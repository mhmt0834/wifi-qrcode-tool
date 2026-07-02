/**
 * 商家后台数据（uniCloud 云函数 wifi_list · 真实数据库）
 */

import { ensureWxSession } from '@/utils/wx-session.js'
import {
	WIFI_CLOUD_FUNCTION,
	WIFI_CLOUD_TIMEOUT_MS,
	assertWifiCloudFunctionName,
	formatCloudError
} from '@/utils/cloud-config.js'
import { withTimeout } from '@/utils/promise-util.js'

const CLOUD_FUNCTION = WIFI_CLOUD_FUNCTION

async function callMerchantCloud(data) {
	const functionName = assertWifiCloudFunctionName(CLOUD_FUNCTION)
	const payload = { ...(data || {}) }
	const needWx = payload.action !== 'recordView'
	if (needWx) {
		payload.wxCode = await ensureWxSession()
	}
	const res = await withTimeout(
		uniCloud.callFunction({ name: functionName, data: payload }),
		WIFI_CLOUD_TIMEOUT_MS,
		'商家数据请求超时'
	)
	const result = (res && res.result) != null ? res.result : {}
	if (result.code === undefined) {
		return { code: 0, data: result.data != null ? result.data : result, msg: result.msg || 'ok' }
	}
	return result
}

function formatCreateTime(ts) {
	if (!ts) return '--'
	const d = new Date(ts)
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** 商家 WiFi 列表（当前用户 merchantOpenid） */
export async function getMerchantWifiList() {
	const result = await callMerchantCloud({ action: 'merchantWifiList' })
	if (!result || result.code !== 0) return []
	const list = result.data || []
	return list.map((item) => ({
		_id: item._id,
		name: item.name || item.ssid,
		shop: item.shop,
		createTimeText: formatCreateTime(item.createTime),
		status: item.status || '在线',
		heat: item.heat != null ? item.heat : (item.viewCount || 0) + (item.connectCount || 0) * 5,
		viewCount: item.viewCount || 0,
		connectCount: item.connectCount || 0,
		todayRevenue: item.todayRevenue || '0.00',
		totalRevenue: item.totalRevenue || '0.00'
	}))
}

/** 控制台统计：WiFi总数、浏览、连接、今日新增 */
export async function getMerchantDashboardStats() {
	try {
		const result = await callMerchantCloud({ action: 'merchantStats' })
		if (!result || result.code !== 0) {
			return emptyMerchantStats()
		}
		return { ...emptyMerchantStats(), ...(result.data || {}) }
	} catch (err) {
		return emptyMerchantStats()
	}
}

function emptyMerchantStats() {
	return {
		wifiCount: 0,
		viewCount: 0,
		connectCount: 0,
		todayNew: 0,
		todayConnectCount: 0,
		todayRevenue: '0.00',
		totalRevenue: '0.00',
		withdrawable: '0.00',
		pendingWithdraw: '0.00'
	}
}

/** 最近连接记录 */
export async function getMerchantRecentConnects(limit = 20) {
	try {
		const result = await callMerchantCloud({ action: 'merchantConnects', limit })
		if (!result || result.code !== 0) return []
		return result.data || []
	} catch (err) {
		return []
	}
}

/** 收益明细 */
export async function getMerchantRevenueList(range = '全部') {
	try {
		const result = await callMerchantCloud({ action: 'merchantRevenue', range })
		if (!result || result.code !== 0) {
			return emptyMerchantRevenue()
		}
		return { ...emptyMerchantRevenue(), ...(result.data || {}) }
	} catch (err) {
		return emptyMerchantRevenue()
	}
}

function emptyMerchantRevenue() {
	return {
		total: '0.00',
		today: '0.00',
		withdrawable: '0.00',
		pendingWithdraw: '0.00',
		list: []
	}
}

export async function requestMerchantWithdraw(amount) {
	const result = await callMerchantCloud({
		action: 'merchantWithdrawRequest',
		amount
	})
	if (!result || result.code !== 0) {
		throw new Error((result && result.msg) || '提现申请失败')
	}
	return result.data
}

/** 商家资料 */
export async function getMerchantProfile() {
	try {
		const result = await callMerchantCloud({ action: 'getMerchantProfile' })
		if (!result || result.code !== 0) return null
		return result.data || null
	} catch (err) {
		return null
	}
}

export async function saveMerchantProfile(profile) {
	try {
		const result = await callMerchantCloud({
			action: 'saveMerchantProfile',
			...profile
		})
		if (!result || result.code !== 0) {
			throw new Error((result && result.msg) || formatCloudError(null) || '保存失败')
		}
		return result.data
	} catch (err) {
		throw err
	}
}

/** 详情页浏览 +1 */
export async function recordWifiView(wifiId) {
	if (!wifiId) return
	try {
		await callMerchantCloud({ action: 'recordView', wifiId })
	} catch (err) {
		// 静默失败
	}
}

/** 连接成功：写连接记录与收益 */
export async function recordWifiConnect(wifiId) {
	if (!wifiId) return
	try {
		await callMerchantCloud({ action: 'recordConnect', wifiId })
	} catch (err) {
		// 静默失败
	}
}
