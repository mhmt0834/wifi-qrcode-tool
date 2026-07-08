/**

 * WiFi 云数据库客户端（uniCloud · 云函数 wifi_list）

 * 所有 uniCloud.callFunction 仅通过本模块，禁止 name: 'list' / 'wifi-list'

 */



import { getUserLocation } from '@/utils/location.js'

import {

	WIFI_CLOUD_FUNCTION,

	WIFI_CLOUD_TIMEOUT_MS,

	assertWifiCloudFunctionName,

	formatCloudError

} from '@/utils/cloud-config.js'

import { ensureWxSession } from '@/utils/wx-session.js'

import { withTimeout } from '@/utils/promise-util.js'

import { markCloudExhausted, isCloudInCooldown } from '@/utils/cloud-cooldown.js'



const CLOUD_FUNCTION = WIFI_CLOUD_FUNCTION

const CLOUD_TIMEOUT_MS = WIFI_CLOUD_TIMEOUT_MS

const NEARBY_CLOUD_THROTTLE_MS = 3000



let nearbyCloudInflight = null

let nearbyCloudLastAt = 0



export { WIFI_CLOUD_FUNCTION, CLOUD_FUNCTION }



function formatDistanceText(meters) {

	if (meters == null || isNaN(meters)) return '--'

	if (typeof meters === 'string') return meters

	if (meters < 1000) return Math.round(meters) + 'm'

	return (meters / 1000).toFixed(1) + 'km'

}



function formatSignal(signal) {

	if (signal == null || signal === '') return '强'

	if (typeof signal === 'number') return String(signal)

	return String(signal)

}



export function mapWifiDocToListItem(doc, index = 0) {

	if (!doc) return null

	const stableId =

		doc._id ||

		doc.id ||

		`wifi-${String(doc.wifiName || 'item')}-${doc.latitude ?? index}-${index}`

	return {

		_id: stableId,

		id: doc._id || doc.id || stableId,

		name: doc.wifiName || '',

		ssid: doc.wifiName || '',

		shop: doc.shopName || '',

		password: doc.wifiPassword || '',

		distance: doc.distanceText || formatDistanceText(doc.distance),

		distanceMeters: doc.distance,

		signal: formatSignal(doc.signal),

		latitude: doc.latitude,

		longitude: doc.longitude,

		createTime: doc.createTime,

		creatorOpenid: doc.creatorOpenid,

		merchantOpenid: doc.merchantOpenid || '',

		agentOpenid: doc.agentOpenid || '',

		canManage: !!doc.canManage,

		canAssignMerchantOpenid: !!doc.canAssignMerchantOpenid,

		viewCount: doc.viewCount || 0,

		connectCount: doc.connectCount || 0,

		heat: doc.heat != null ? doc.heat : (doc.viewCount || 0) + (doc.connectCount || 0) * 5,

		status: doc.status || '在线',

		address: doc.address || '',

		intro: doc.intro || '',

		tags: doc.tags || '',

		promoVideoUrl: doc.promoVideoUrl || '',

		promoVideoStatus: doc.promoVideoStatus || '未配置',

		qrCodeUrl: doc.qrCodeUrl || '',

		qrCodeStatus: doc.qrCodeStatus || '未生成',

		qrCodeCreateTime: doc.qrCodeCreateTime || null

	}

}



/** 管理详情完整字段映射 */

export function mapWifiDocToManageDetail(doc) {

	const base = mapWifiDocToListItem(doc)

	if (!base) return null

	return {

		...base,

		wifiName: doc.wifiName || base.name,

		wifiPassword: doc.wifiPassword || base.password,

		shopName: doc.shopName || base.shop,

		qrCodeUrl: doc.qrCodeUrl || base.qrCodeUrl || '',

		qrCodeStatus: doc.qrCodeStatus || base.qrCodeStatus || '未生成',

		qrCodeCreateTime: doc.qrCodeCreateTime || base.qrCodeCreateTime || null,

		promoVideoUrl: doc.promoVideoUrl || base.promoVideoUrl || '',

		promoVideoStatus: doc.promoVideoStatus || base.promoVideoStatus || '未配置'

	}

}



/**

 * 统一云函数调用（仅 wifi_list）

 */

async function executeCallWifiCloud(functionName, payload) {

	try {

		if (typeof uniCloud === 'undefined' || !uniCloud.callFunction) {

			throw new Error('uniCloud 未初始化，请在 HBuilderX 关联云服务空间')

		}



		const res = await withTimeout(

			uniCloud.callFunction({ name: functionName, data: payload }),

			CLOUD_TIMEOUT_MS,

			'uniCloud 请求超时'

		)



		const result = (res && res.result) != null ? res.result : {}

		if (result.code === undefined) {

			return { code: 0, data: result.data != null ? result.data : [], msg: result.msg || 'ok' }

		}

		return result

	} catch (err) {

		const errMsg = (err && err.message) || String(err)

		markCloudExhausted(err)

		return { code: -1, msg: formatCloudError(err) || errMsg || '云函数调用失败', data: [] }

	}

}



async function callWifiCloud(data) {

	const functionName = assertWifiCloudFunctionName(CLOUD_FUNCTION)

	const payload = { ...(data || {}) }

	const merchantActions = [

		'merchantStats',

		'merchantConnects',

		'merchantRevenue',

		'getMerchantProfile',

		'saveMerchantProfile',

		'updateWifiStatus',

		'recordConnect',

		'getMyWifiDetail',

		'updateWifi',

		'assignMerchantOpenid',

		'generateWifiQrCode'

	]

	const needOpenid = ['add', 'delete', 'myList', ...merchantActions].includes(payload.action)

	if (needOpenid) {

		payload.wxCode = await ensureWxSession()

	}



	if (payload.action === 'nearby') {

		const forceNearby = !!payload.force

		delete payload.force

		const now = Date.now()

		if (nearbyCloudInflight) {

			return nearbyCloudInflight

		}

		if (!forceNearby && now - nearbyCloudLastAt < NEARBY_CLOUD_THROTTLE_MS) {

			return { code: -2, msg: 'throttled', data: [] }

		}

		nearbyCloudLastAt = now

		nearbyCloudInflight = executeCallWifiCloud(functionName, payload).finally(() => {

			nearbyCloudInflight = null

		})

		return nearbyCloudInflight

	}



	return executeCallWifiCloud(functionName, payload)

}



/**

 * 安全加载（首页 / 附近页）— 超时或失败返回空列表，不向页面抛错

 */

export async function loadWifiListSafe(options = {}) {

	const { keyword = '', limit = 50 } = options



	if (isCloudInCooldown()) {

		return {

			list: [],

			fromCloud: false,

			error: '云服务暂时不可用，请稍后再试'

		}

	}



	try {

		let latitude = options.latitude

		let longitude = options.longitude

		if (latitude == null || longitude == null) {

			const loc = await getUserLocation()

			latitude = loc.latitude

			longitude = loc.longitude

		}



		const result = await callWifiCloud({

			action: 'nearby',

			latitude,

			longitude,

			keyword,

			limit,

			force: !!options.force

		})



		if (result && result.code === -2) {

			return { list: [], fromCloud: false, error: null }

		}



		if (!result || result.code !== 0) {

			throw new Error((result && result.msg) || 'wifi_list 返回异常')

		}



		const list = (result.data || [])

			.map((doc, index) => mapWifiDocToListItem(doc, index))

			.filter(Boolean)

		return { list, fromCloud: true, error: null }

	} catch (err) {

		markCloudExhausted(err)

		return {

			list: [],

			fromCloud: false,

			error: err.message || String(err)

		}

	}

}



export const uploadSharedWifi = addWifi



export async function addWifi(wifiData = {}) {

	try {

		let { latitude, longitude, ...rest } = wifiData

		if (latitude == null || longitude == null) {

			const loc = await getUserLocation()

			latitude = loc.latitude

			longitude = loc.longitude

		}

		const result = await callWifiCloud({

			action: 'add',

			...rest,

			latitude,

			longitude

		})

		if (!result || result.code !== 0) {

			return null

		}

		const data = result.data

		if (Array.isArray(data) && data[0]) return data[0]

		return data || null

	} catch (err) {

		return null

	}

}



export async function deleteWifi(id) {

	try {

		if (!id) return false

		const result = await callWifiCloud({ action: 'delete', id })

		if (!result || result.code !== 0) {

			throw new Error((result && result.msg) || '删除失败')

		}

		return true

	} catch (err) {

		throw err

	}

}



/** 我的 WiFi 详情（含密码，仅创建者可读） */

export async function getMyWifiDetail(id) {

	try {

		const result = await callWifiCloud({ action: 'getMyWifiDetail', id })

		if (!result || result.code !== 0) {

			throw new Error((result && result.msg) || '读取失败')

		}

		return mapWifiDocToManageDetail(result.data)

	} catch (err) {

		throw err

	}

}



/** 更新我的 WiFi */

export async function updateWifi(id, wifiData = {}) {

	try {

		const result = await callWifiCloud({

			action: 'updateWifi',

			id,

			...wifiData

		})

		if (!result || result.code !== 0) {

			throw new Error((result && result.msg) || '更新失败')

		}

		return mapWifiDocToManageDetail(result.data)

	} catch (err) {

		throw err

	}

}

export async function assignWifiMerchant(id, merchantOpenid) {

	try {

		const result = await callWifiCloud({

			action: 'assignMerchantOpenid',

			id,

			merchantOpenid

		})

		if (!result || result.code !== 0) {

			throw new Error((result && result.msg) || '绑定商家失败')

		}

		return mapWifiDocToManageDetail(result.data)

	} catch (err) {

		throw err

	}

}



/** 切换在线 / 离线 */

export async function updateWifiStatus(id, status) {

	try {

		const result = await callWifiCloud({

			action: 'updateWifiStatus',

			id,

			status

		})

		return result && result.code === 0

	} catch (err) {

		return false

	}

}



export async function getMyWifiList() {

	try {

		const result = await callWifiCloud({ action: 'myList' })

		if (!result || result.code !== 0) return []

		return (result.data || [])

			.map((doc, idx) => mapWifiDocToListItem(doc, idx))

			.filter(Boolean)

	} catch (err) {

		return []

	}

}


