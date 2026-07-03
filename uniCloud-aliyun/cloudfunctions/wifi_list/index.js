'use strict'

/**
 * WiFi 列表云函数 · 集合 wifi_list
 * creatorOpenid：resolveOpenid（context.OPENID 或 wxCode）
 */
const {
	resolveOpenid
} = require('wx-openid')
const {
	generateUnlimitedWxaCode
} = require('wx-qrcode')

const WIFI_DETAIL_PAGE = 'pages/wifi-detail/wifi-detail'
const db = uniCloud.database()
const wifiCollection = db.collection('wifi_list')
const merchantCollection = db.collection('merchant_profile')
const agentCollection = db.collection('agent_profile')
const connectLogCollection = db.collection('wifi_connect_log')
const revenueLogCollection = db.collection('wifi_revenue_log')
const agentRevenueCollection = db.collection('agent_revenue_log')

const AD_GROSS_REVENUE_PER_CONNECT = 0.15
const PLATFORM_SHARE_RATE = 0.4
const AGENT_SHARE_RATE = 0.3
const MERCHANT_SHARE_RATE = 0.3
const WITHDRAW_FREEZE_STATUSES = ['pending', 'approved', 'paid']

/**
 * 平台管理员 openid 白名单。
 * 推荐在 uniCloud 环境变量 PLATFORM_ADMIN_OPENIDS 中配置，多个 openid 用英文逗号分隔。
 * 也可以临时填入下方数组，部署云函数后生效。
 */
const PLATFORM_ADMIN_OPENIDS = [
	'ojV5m3aDoa3grCsHqwHZy-s2q5OI'
].filter(Boolean)

function roundMoney(amount) {
	return Math.round((Number(amount) || 0) * 10000) / 10000
}

function calcRevenueShares(grossAmount = AD_GROSS_REVENUE_PER_CONNECT) {
	const gross = roundMoney(grossAmount)
	return {
		grossAmount: gross,
		platformAmount: roundMoney(gross * PLATFORM_SHARE_RATE),
		agentAmount: roundMoney(gross * AGENT_SHARE_RATE),
		merchantAmount: roundMoney(gross * MERCHANT_SHARE_RATE)
	}
}

function getLogMerchantAmount(item) {
	if (!item) return 0
	if (item.merchantAmount != null) return Number(item.merchantAmount) || 0
	return Number(item.amount) || 0
}

function getLogAgentAmount(item) {
	if (!item) return 0
	if (item.agentAmount != null) return Number(item.agentAmount) || 0
	return Number(item.amount) || 0
}

async function getAgentProfileByOpenid(agentOpenid) {
	const openid = normalizeOpenid(agentOpenid)
	if (!openid) return null
	const {
		data
	} = await agentCollection.where({
		openid
	}).limit(1).get()
	return data && data.length ? data[0] : null
}

async function resolveAgentOpenidForCreator(creatorOpenid) {
	const openid = normalizeOpenid(creatorOpenid)
	if (!openid) return ''
	const profile = await getAgentProfileByOpenid(openid)
	if (!profile || profile.status === 'disabled') return ''
	return openid
}

async function resolveAgentOpenidForWifi(doc) {
	const explicitAgentOpenid = normalizeOpenid(doc && doc.agentOpenid)
	if (explicitAgentOpenid) return explicitAgentOpenid
	return await resolveAgentOpenidForCreator(doc && doc.creatorOpenid)
}

async function bindCreatorWifiToAgent(openid) {
	const agentOpenid = normalizeOpenid(openid)
	if (!agentOpenid) return
	const {
		data
	} = await wifiCollection.where({
		creatorOpenid: agentOpenid
	}).limit(1000).get()
	const rows = data || []
	await Promise.all(rows.map((item) => {
		if (normalizeOpenid(item.agentOpenid)) return Promise.resolve()
		return wifiCollection.doc(item._id).update({
			agentOpenid,
			updateTime: Date.now()
		})
	}))
}

function getPlatformAdminOpenids() {
	const envValue =
		typeof process !== 'undefined' && process.env
			? String(process.env.PLATFORM_ADMIN_OPENIDS || '')
			: ''
	const envOpenids = envValue.split(',').map((item) => item.trim()).filter(Boolean)
	return new Set([...PLATFORM_ADMIN_OPENIDS, ...envOpenids].map((item) => normalizeOpenid(item)).filter(Boolean))
}

function isPlatformAdmin(openid) {
	return getPlatformAdminOpenids().has(normalizeOpenid(openid))
}

function isWithdrawFrozen(item) {
	if (!item || item.type !== 'withdraw') return false
	return WITHDRAW_FREEZE_STATUSES.includes(item.status || 'pending')
}

function calcWithdrawFrozenAmount(rows) {
	return (rows || []).reduce((sum, item) => {
		if (!isWithdrawFrozen(item)) return sum
		return sum + (Number(item.amount) || 0)
	}, 0)
}

function calcWithdrawProcessingAmount(rows) {
	return (rows || []).reduce((sum, item) => {
		if (!item || item.type !== 'withdraw') return sum
		const status = item.status || 'pending'
		if (status !== 'pending' && status !== 'approved') return sum
		return sum + (Number(item.amount) || 0)
	}, 0)
}

function calcHeat(viewCount, connectCount) {
	const v = Number(viewCount) || 0
	const c = Number(connectCount) || 0
	return Math.min(9999, v + c * 5)
}

function startOfTodayMs() {
	const d = new Date()
	d.setHours(0, 0, 0, 0)
	return d.getTime()
}

function formatTimeHm(ts) {
	const d = new Date(ts)
	const h = String(d.getHours()).padStart(2, '0')
	const m = String(d.getMinutes()).padStart(2, '0')
	return `${h}:${m}`
}

function formatDateTime(ts) {
	const d = new Date(ts)
	const y = d.getFullYear()
	const mo = String(d.getMonth() + 1).padStart(2, '0')
	const day = String(d.getDate()).padStart(2, '0')
	const h = String(d.getHours()).padStart(2, '0')
	const m = String(d.getMinutes()).padStart(2, '0')
	return `${y}-${mo}-${day} ${h}:${m}`
}

const SEED_WIFI_LIST = [{
		wifiName: '智连WiFi-001',
		wifiPassword: 'Starbucks2024',
		shopName: '星巴克咖啡',
		distance: 120,
		signal: '强',
		latitude: 39.909187,
		longitude: 116.397455
	},
	{
		wifiName: '智连WiFi-002',
		wifiPassword: 'KFC888888',
		shopName: '肯德基',
		distance: 350,
		signal: '强',
		latitude: 39.910512,
		longitude: 116.398902
	},
	{
		wifiName: '智连WiFi-003',
		wifiPassword: 'McDonalds666',
		shopName: '麦当劳',
		distance: 520,
		signal: '中',
		latitude: 39.907821,
		longitude: 116.399812
	},
	{
		wifiName: '智连WiFi-004',
		wifiPassword: 'Luckin2024',
		shopName: '瑞幸咖啡',
		distance: 680,
		signal: '强',
		latitude: 39.906233,
		longitude: 116.395621
	},
	{
		wifiName: '智连WiFi-005',
		wifiPassword: 'FamilyMart88',
		shopName: '全家便利店',
		distance: 800,
		signal: '弱',
		latitude: 39.911902,
		longitude: 116.401233
	}
]

const SEED_CREATOR_OPENID = 'system-seed-data'
const EARTH_RADIUS = 6371000

function toRad(deg) {
	return (deg * Math.PI) / 180
}

function calcDistanceMeters(lat1, lon1, lat2, lon2) {
	try {
		const dLat = toRad(lat2 - lat1)
		const dLon = toRad(lon2 - lon1)
		const a =
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
			Math.sin(dLon / 2) * Math.sin(dLon / 2)
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
		return EARTH_RADIUS * c
	} catch (e) {
		return 999999
	}
}

function formatDistanceText(meters) {
	if (meters == null || isNaN(meters)) return '--'
	if (meters < 1000) return Math.round(meters) + 'm'
	return (meters / 1000).toFixed(1) + 'km'
}

function attachDistanceAndSort(list, latitude, longitude) {
	try {
		return (list || [])
			.map((item) => {
				const distanceMeters = calcDistanceMeters(latitude, longitude, item.latitude, item.longitude)
				return {
					...item,
					distance: distanceMeters,
					distanceText: formatDistanceText(distanceMeters)
				}
			})
			.sort((a, b) => a.distance - b.distance)
	} catch (e) {
		return list || []
	}
}

/** 空库时写入测试数据（失败不抛出，避免卡死） */
async function ensureSeedData() {
	try {
		const countRes = await wifiCollection.count()
		if ((countRes.total || 0) > 0) {
			return {
				seeded: false,
				count: countRes.total
			}
		}
		const now = Date.now()
		const docs = SEED_WIFI_LIST.map((item, index) => ({
			wifiName: item.wifiName,
			wifiPassword: item.wifiPassword,
			shopName: item.shopName,
			distance: item.distance,
			signal: item.signal,
			latitude: item.latitude,
			longitude: item.longitude,
			createTime: now - (SEED_WIFI_LIST.length - index) * 86400000,
			creatorOpenid: SEED_CREATOR_OPENID
		}))
		await wifiCollection.add(docs)
		return {
			seeded: true,
			count: docs.length
		}
	} catch (err) {
		console.error('[wifi_list] ensureSeedData 失败', err)
		return {
			seeded: false,
			count: 0
		}
	}
}

async function handleInitSeed() {
	try {
		const result = await ensureSeedData()
		return {
			code: 0,
			msg: 'ok',
			data: result
		}
	} catch (err) {
		return {
			code: 0,
			msg: 'ok',
			data: []
		}
	}
}

async function handleNearby(event) {
	try {
		const {
			latitude,
			longitude,
			limit = 100,
			keyword = '',
			autoSeed = false
		} = event || {}

		if (latitude == null || longitude == null) {
			return {
				code: 0,
				msg: 'ok',
				data: []
			}
		}

		if (autoSeed === true) {
			await ensureSeedData()
		}

		const res = await wifiCollection.limit(Math.min(limit, 500)).get()
		let list = res.data || []

		if (keyword && String(keyword).trim()) {
			const kw = String(keyword).trim().toLowerCase()
			list = list.filter(
				(item) =>
				(item.wifiName && item.wifiName.toLowerCase().includes(kw)) ||
				(item.shopName && item.shopName.toLowerCase().includes(kw))
			)
		}

		const sorted = attachDistanceAndSort(list, latitude, longitude)
		return {
			code: 0,
			msg: 'ok',
			data: sorted.slice(0, limit)
		}
	} catch (err) {
		console.error('[wifi_list] handleNearby 失败', err)
		return {
			code: 0,
			msg: 'ok',
			data: []
		}
	}
}

async function handleAdd(event, openid) {
	try {
		if (!openid) {
			return {
				code: 401,
				msg: '无法获取 openid（context.OPENID 为空），请先登录',
				openid: '',
				data: null
			}
		}

		const {
			wifiName,
			wifiPassword,
			shopName,
			merchantOpenid = '',
			latitude,
			longitude,
			signal = '强',
			address = '',
			intro = '',
			tags = ''
		} =
		event || {}
		if (!wifiName || !wifiPassword || !shopName) {
			return {
				code: 400,
				msg: '参数不完整',
				openid,
				data: null
			}
		}
		if (latitude == null || longitude == null) {
			return {
				code: 400,
				msg: '缺少定位',
				openid,
				data: null
			}
		}
		const agentOpenid = await resolveAgentOpenidForCreator(openid)
		if (!isPlatformAdmin(openid) && !agentOpenid) {
			return {
				code: 403,
				msg: '请先完成代理入驻，或联系平台管理员添加 WiFi',
				openid,
				data: null
			}
		}
		const doc = {
			wifiName: String(wifiName).trim(),
			wifiPassword: String(wifiPassword).trim(),
			shopName: String(shopName).trim(),
			latitude: Number(latitude),
			longitude: Number(longitude),
			signal: signal || '强',
			distance: 0,
			createTime: Date.now(),
			creatorOpenid: openid,
			merchantOpenid: normalizeOpenid(merchantOpenid),
			agentOpenid,
			viewCount: 0,
			connectCount: 0,
			heat: 0,
			status: '在线',
			address: String(address || '').trim(),
			intro: String(intro || '').trim(),
			tags: String(tags || '').trim(),
			qrCodeStatus: '未生成'
		}
		const res = await wifiCollection.add(doc)
		return {
			code: 0,
			msg: 'ok',
			openid,
			data: [{
				_id: res.id,
				...doc
			}]
		}
	} catch (err) {
		console.error('[wifi_list] handleAdd 失败', err)
		return {
			code: 0,
			msg: 'ok',
			data: []
		}
	}
}

async function handleDelete(event, openid) {
	try {
		const {
			id
		} = event || {}
		if (!id) return {
			code: 400,
			msg: '缺少 id',
			data: null
		}
		if (!openid) return {
			code: 401,
			msg: '未登录',
			data: null
		}
		const {
			data
		} = await wifiCollection.doc(id).get()
		if (!data || !data.length) return {
			code: 404,
			msg: 'WiFi 不存在',
			data: null
		}
		if (!canManageWifiDoc(data[0], openid)) {
			return {
				code: 403,
				msg: '无权限删除',
				data: null
			}
		}
		await wifiCollection.doc(id).remove()
		return {
			code: 0,
			msg: 'ok',
			data: {
				deleted: true
			}
		}
	} catch (err) {
		console.error('[wifi_list] handleDelete 失败', err)
		return {
			code: 500,
			msg: err.message || '删除失败',
			data: null
		}
	}
}

function enrichWifiDoc(item) {
	const viewCount = item.viewCount || 0
	const connectCount = item.connectCount || 0
	return {
		...item,
		viewCount,
		connectCount,
		heat: item.heat != null ? item.heat : calcHeat(viewCount, connectCount),
		status: item.status || '在线',
		address: item.address || '',
		intro: item.intro || '',
		tags: item.tags || '',
		qrCodeUrl: item.qrCodeUrl || '',
		qrCodeStatus: item.qrCodeStatus || '未生成',
		qrCodeCreateTime: item.qrCodeCreateTime || null
	}
}

function normalizeOpenid(value) {
	return String(value || '').trim()
}

function canManageWifiDoc(doc, openid) {
	const userOpenid = normalizeOpenid(openid)
	if (!doc || !userOpenid) return false
	return doc.creatorOpenid === userOpenid || doc.merchantOpenid === userOpenid
}

function canAssignMerchantOpenid(doc, openid) {
	const userOpenid = normalizeOpenid(openid)
	if (!doc || !userOpenid) return false
	return doc.creatorOpenid === userOpenid
}

function enrichWifiDocForViewer(doc, openid) {
	const enriched = enrichWifiDoc(doc)
	return {
		...enriched,
		canManage: canManageWifiDoc(enriched, openid),
		canAssignMerchantOpenid: canAssignMerchantOpenid(enriched, openid)
	}
}

function mapWifiPublicDetail(doc) {
	const enriched = enrichWifiDoc(doc)
	return {
		_id: enriched._id,
		wifiName: enriched.wifiName,
		shopName: enriched.shopName,
		intro: enriched.intro,
		tags: enriched.tags,
		address: enriched.address,
		signal: enriched.signal,
		status: enriched.status,
		viewCount: enriched.viewCount,
		connectCount: enriched.connectCount,
		heat: enriched.heat,
		createTime: enriched.createTime
	}
}

async function handleGetWifiPublicDetail(event) {
	try {
		const {
			id
		} = event || {}
		if (!id) return {
			code: 400,
			msg: '缺少 id',
			data: null
		}
		const {
			data
		} = await wifiCollection.doc(id).get()
		if (!data || !data.length) return {
			code: 404,
			msg: 'WiFi 不存在',
			data: null
		}
		return {
			code: 0,
			msg: 'ok',
			data: mapWifiPublicDetail(data[0])
		}
	} catch (err) {
		console.error('[wifi_list] getWifiPublicDetail 失败', err)
		return {
			code: 500,
			msg: err.message || '读取失败',
			data: null
		}
	}
}

/** 连接用凭证（仅返回 SSID+密码，不在二维码或 URL 中传递） */
async function handleGetWifiConnectCredential(event) {
	try {
		const {
			id
		} = event || {}
		if (!id) return {
			code: 400,
			msg: '缺少 id',
			data: null
		}
		const {
			data
		} = await wifiCollection.doc(id).get()
		if (!data || !data.length) return {
			code: 404,
			msg: 'WiFi 不存在',
			data: null
		}
		const doc = data[0]
		if (doc.status === '离线') {
			return {
				code: 403,
				msg: '该 WiFi 已下线',
				data: null
			}
		}
		return {
			code: 0,
			msg: 'ok',
			data: {
				wifiName: doc.wifiName || '',
				wifiPassword: doc.wifiPassword || ''
			}
		}
	} catch (err) {
		console.error('[wifi_list] getWifiConnectCredential 失败', err)
		return {
			code: 500,
			msg: err.message || '读取失败',
			data: null
		}
	}
}

async function handleGenerateWifiQrCode(event, openid) {
	try {
		const {
			id
		} = event || {}
		if (!id) return {
			code: 400,
			msg: '缺少 id',
			data: null
		}
		if (!openid) return {
			code: 401,
			msg: '未登录',
			data: null
		}

		const {
			data
		} = await wifiCollection.doc(id).get()
		if (!data || !data.length) return {
			code: 404,
			msg: 'WiFi 不存在',
			data: null
		}
		if (!canManageWifiDoc(data[0], openid)) {
			return {
				code: 403,
				msg: '无权限',
				data: null
			}
		}

		// scene 仅携带 wifiId，禁止密码
		const buffer = await generateUnlimitedWxaCode(id, WIFI_DETAIL_PAGE)
		const cloudPath = `wifi-qrcode/${openid}/${id}_${Date.now()}.png`
		const uploadRes = await uniCloud.uploadFile({
			cloudPath,
			fileContent: buffer
		})
		const qrCodeUrl = uploadRes.fileID || ''
		const now = Date.now()
		await wifiCollection.doc(id).update({
			qrCodeUrl,
			qrCodeStatus: '已生成',
			qrCodeCreateTime: now
		})

		return {
			code: 0,
			msg: 'ok',
			data: {
				qrCodeUrl,
				qrCodeStatus: '已生成',
				qrCodeCreateTime: now,
				page: WIFI_DETAIL_PAGE,
				scene: id
			}
		}
	} catch (err) {
		console.error('[wifi_list] generateWifiQrCode 失败', err)
		try {
			const {
				id
			} = event || {}
			if (id) {
				await wifiCollection.doc(id).update({
					qrCodeStatus: '生成失败'
				})
			}
		} catch (e) {
			/* ignore */
		}
		return {
			code: 500,
			msg: err.message || '生成失败',
			data: null
		}
	}
}

async function handleGetMyWifiDetail(event, openid) {
	try {
		const {
			id
		} = event || {}
		if (!id) return {
			code: 400,
			msg: '缺少 id',
			data: null
		}
		if (!openid) return {
			code: 401,
			msg: '未登录',
			data: null
		}
		const {
			data
		} = await wifiCollection.doc(id).get()
		if (!data || !data.length) return {
			code: 404,
			msg: 'WiFi 不存在',
			data: null
		}
		const doc = data[0]
		if (!canManageWifiDoc(doc, openid)) {
			return {
				code: 403,
				msg: '无权限查看',
				data: null
			}
		}
		return {
			code: 0,
			msg: 'ok',
			data: enrichWifiDocForViewer(doc, openid)
		}
	} catch (err) {
		console.error('[wifi_list] getMyWifiDetail 失败', err)
		return {
			code: 500,
			msg: err.message || '读取失败',
			data: null
		}
	}
}

async function handleUpdateWifi(event, openid) {
	try {
		const {
			id,
			wifiName,
			wifiPassword,
			shopName,
			address,
			intro,
			tags,
			latitude,
			longitude
		} = event || {}
		if (!id) return {
			code: 400,
			msg: '缺少 id',
			data: null
		}
		if (!openid) return {
			code: 401,
			msg: '未登录',
			data: null
		}
		const {
			data
		} = await wifiCollection.doc(id).get()
		if (!data || !data.length) return {
			code: 404,
			msg: 'WiFi 不存在',
			data: null
		}
		if (!canManageWifiDoc(data[0], openid)) {
			return {
				code: 403,
				msg: '无权限编辑',
				data: null
			}
		}
		const patch = {
			updateTime: Date.now()
		}
		if (wifiName != null && String(wifiName).trim()) patch.wifiName = String(wifiName).trim()
		if (wifiPassword != null && String(wifiPassword).trim()) patch.wifiPassword = String(wifiPassword).trim()
		if (shopName != null && String(shopName).trim()) patch.shopName = String(shopName).trim()
		if (address != null) patch.address = String(address).trim()
		if (intro != null) patch.intro = String(intro).trim()
		if (tags != null) patch.tags = String(tags).trim()
		if (latitude != null) patch.latitude = Number(latitude)
		if (longitude != null) patch.longitude = Number(longitude)
		await wifiCollection.doc(id).update(patch)
		const {
			data: updated
		} = await wifiCollection.doc(id).get()
		return {
			code: 0,
			msg: 'ok',
			data: enrichWifiDocForViewer(updated[0], openid)
		}
	} catch (err) {
		console.error('[wifi_list] updateWifi 失败', err)
		return {
			code: 500,
			msg: err.message || '更新失败',
			data: null
		}
	}
}

async function handleAssignMerchantOpenid(event, openid) {
	try {
		const {
			id,
			merchantOpenid
		} = event || {}
		if (!id) return {
			code: 400,
			msg: '缺少 id',
			data: null
		}
		if (!openid) return {
			code: 401,
			msg: '未登录',
			data: null
		}
		const nextMerchantOpenid = normalizeOpenid(merchantOpenid)
		if (!nextMerchantOpenid) return {
			code: 400,
			msg: '请填写商家 openid',
			data: null
		}
		const {
			data
		} = await wifiCollection.doc(id).get()
		if (!data || !data.length) return {
			code: 404,
			msg: 'WiFi 不存在',
			data: null
		}
		const doc = data[0]
		if (!canAssignMerchantOpenid(doc, openid)) {
			return {
				code: 403,
				msg: '只有创建者可以绑定商家归属',
				data: null
			}
		}
		await wifiCollection.doc(id).update({
			merchantOpenid: nextMerchantOpenid,
			agentOpenid: doc.agentOpenid || await resolveAgentOpenidForCreator(doc.creatorOpenid),
			updateTime: Date.now()
		})
		const {
			data: updated
		} = await wifiCollection.doc(id).get()
		return {
			code: 0,
			msg: 'ok',
			data: enrichWifiDocForViewer(updated[0], openid)
		}
	} catch (err) {
		console.error('[wifi_list] assignMerchantOpenid 失败', err)
		return {
			code: 500,
			msg: err.message || '绑定失败',
			data: null
		}
	}
}

async function handleMyList(openid) {
	try {
		if (!openid) return {
			code: 0,
			msg: 'ok',
			data: []
		}
		const {
			data
		} = await wifiCollection.where({
			creatorOpenid: openid
		}).orderBy('createTime', 'desc').get()
		const list = (data || []).map((item) => enrichWifiDoc(item))
		return {
			code: 0,
			msg: 'ok',
			data: list
		}
	} catch (err) {
		console.error('[wifi_list] handleMyList 失败', err)
		return {
			code: 0,
			msg: 'ok',
			data: []
		}
	}
}

async function handleMerchantWifiList(openid) {
	try {
		if (!openid) return {
			code: 0,
			msg: 'ok',
			data: []
		}
		const {
			data
		} = await wifiCollection.where({
			merchantOpenid: openid
		}).orderBy('createTime', 'desc').get()
		const todayStart = startOfTodayMs()
		const wifiRevenueMap = {}
		const {
			data: revenueRows
		} = await revenueLogCollection
			.where({
				merchantOpenid: openid,
				type: 'ad'
			})
			.limit(1000)
			.get()
		;(revenueRows || []).forEach((item) => {
			const wifiId = item.wifiId || ''
			if (!wifiId) return
			if (!wifiRevenueMap[wifiId]) {
				wifiRevenueMap[wifiId] = {
					totalRevenue: 0,
					todayRevenue: 0
				}
			}
			const amount = getLogMerchantAmount(item)
			wifiRevenueMap[wifiId].totalRevenue += amount
			if ((item.createTime || 0) >= todayStart) {
				wifiRevenueMap[wifiId].todayRevenue += amount
			}
		})
		const list = (data || []).map((item) => {
			const enriched = enrichWifiDocForViewer(item, openid)
			const revenue = wifiRevenueMap[item._id] || { totalRevenue: 0, todayRevenue: 0 }
			return {
				...enriched,
				totalRevenue: revenue.totalRevenue.toFixed(2),
				todayRevenue: revenue.todayRevenue.toFixed(2)
			}
		})
		return {
			code: 0,
			msg: 'ok',
			data: list
		}
	} catch (err) {
		console.error('[wifi_list] handleMerchantWifiList 失败', err)
		return {
			code: 0,
			msg: 'ok',
			data: []
		}
	}
}

async function handleMerchantStats(openid) {
	try {
		if (!openid) {
			return {
				code: 0,
				msg: 'ok',
				data: {
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
		}
		const {
			data
		} = await wifiCollection.where({
			merchantOpenid: openid
		}).get()
		const list = data || []
		const todayStart = startOfTodayMs()
		let viewCount = 0
		let connectCount = 0
		let todayNew = 0
		list.forEach((item) => {
			viewCount += item.viewCount || 0
			connectCount += item.connectCount || 0
			if ((item.createTime || 0) >= todayStart) todayNew += 1
		})
		const {
			data: revenueRows
		} = await revenueLogCollection
			.where({
				merchantOpenid: openid
			})
			.limit(1000)
			.get()
		let todayRevenue = 0
		let totalRevenue = 0
		;(revenueRows || []).forEach((item) => {
			const type = item.type || 'ad'
			if (type === 'withdraw') {
				return
			}
			const merchantAmount = getLogMerchantAmount(item)
			totalRevenue += merchantAmount
			if ((item.createTime || 0) >= todayStart) todayRevenue += merchantAmount
		})
		const withdrawTotal = calcWithdrawFrozenAmount(revenueRows || [])
		const pendingWithdraw = calcWithdrawProcessingAmount(revenueRows || [])
		const {
			total
		} = await connectLogCollection.where({
			merchantOpenid: openid,
			connectTime: db.command.gte(todayStart)
		}).count()
		return {
			code: 0,
			msg: 'ok',
			data: {
				wifiCount: list.length,
				viewCount,
				connectCount,
				todayNew,
				todayConnectCount: total || 0,
				todayRevenue: todayRevenue.toFixed(2),
				totalRevenue: totalRevenue.toFixed(2),
				withdrawable: Math.max(0, totalRevenue - withdrawTotal).toFixed(2),
				pendingWithdraw: pendingWithdraw.toFixed(2)
			}
		}
	} catch (err) {
		console.error('[wifi_list] handleMerchantStats 失败', err)
		return {
			code: 0,
			msg: 'ok',
			data: {
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
	}
}

async function handleMerchantConnects(openid, limit = 20) {
	try {
		if (!openid) return {
			code: 0,
			msg: 'ok',
			data: []
		}
		const {
			data
		} = await connectLogCollection
			.where({
				merchantOpenid: openid
			})
			.orderBy('connectTime', 'desc')
			.limit(Math.min(limit, 50))
			.get()
		const list = (data || []).map((item) => ({
			_id: item._id,
			time: formatTimeHm(item.connectTime),
			wifi: item.wifiName || 'WiFi',
			income: (item.merchantAmount != null ? item.merchantAmount : (item.income || 0)).toFixed(2)
		}))
		return {
			code: 0,
			msg: 'ok',
			data: list
		}
	} catch (err) {
		console.error('[wifi_list] handleMerchantConnects 失败', err)
		return {
			code: 0,
			msg: 'ok',
			data: []
		}
	}
}

function filterRevenueByRange(list, range) {
	if (!range || range === '全部') return list
	const now = Date.now()
	const todayStart = startOfTodayMs()
	const weekStart = now - 7 * 86400000
	const monthStart = new Date()
	monthStart.setDate(1)
	monthStart.setHours(0, 0, 0, 0)
	const monthStartMs = monthStart.getTime()

	return list.filter((item) => {
		const t = item.createTime || 0
		if (range === '今日') return t >= todayStart
		if (range === '本周') return t >= weekStart
		if (range === '本月') return t >= monthStartMs
		return true
	})
}

async function handleMerchantRevenue(openid, range = '全部') {
	try {
		if (!openid) return {
			code: 0,
			msg: 'ok',
			data: {
				total: '0.00',
				today: '0.00',
				withdrawable: '0.00',
				pendingWithdraw: '0.00',
				list: []
			}
		}
		const {
			data
		} = await revenueLogCollection
			.where({
				merchantOpenid: openid
			})
			.orderBy('createTime', 'desc')
			.limit(200)
			.get()
		const all = data || []
		const filtered = filterRevenueByRange(all, range)
		const list = filtered.map((item) => {
			const amount = item.type === 'withdraw' ? (Number(item.amount) || 0) : getLogMerchantAmount(item)
			return {
				_id: item._id,
				title: item.title || 'WiFi广告收益',
				time: formatDateTime(item.createTime),
				amount: amount.toFixed(2),
				type: item.type || 'ad',
				status: item.status || '',
				wifiName: item.wifiName || '',
				merchantAmount: amount.toFixed(2)
			}
		})
		const sumAll = all.reduce((s, item) => {
			if (item.type === 'withdraw') return s
			return s + getLogMerchantAmount(item)
		}, 0)
		const withdrawTotal = calcWithdrawFrozenAmount(all)
		const pendingWithdraw = calcWithdrawProcessingAmount(all)
		const todayRevenue = all.reduce((s, item) => {
			if (item.type === 'withdraw' || (item.createTime || 0) < startOfTodayMs()) return s
			return s + getLogMerchantAmount(item)
		}, 0)
		return {
			code: 0,
			msg: 'ok',
			data: {
				total: sumAll.toFixed(2),
				today: todayRevenue.toFixed(2),
				withdrawable: Math.max(0, sumAll - withdrawTotal).toFixed(2),
				pendingWithdraw: pendingWithdraw.toFixed(2),
				list
			}
		}
	} catch (err) {
		console.error('[wifi_list] handleMerchantRevenue 失败', err)
		return {
			code: 0,
			msg: 'ok',
			data: {
				total: '0.00',
				today: '0.00',
				withdrawable: '0.00',
				pendingWithdraw: '0.00',
				list: []
			}
		}
	}
}

async function handleMerchantWithdrawRequest(event, openid) {
	try {
		if (!openid) return {
			code: 401,
			msg: '未登录',
			data: null
		}
		const requestedAmount = roundMoney(event && event.amount)
		if (!requestedAmount || requestedAmount <= 0) return {
			code: 400,
			msg: '提现金额错误',
			data: null
		}
		const {
			data
		} = await revenueLogCollection
			.where({
				merchantOpenid: openid
			})
			.limit(1000)
			.get()
		const rows = data || []
		const totalRevenue = rows.reduce((s, item) => {
			if (item.type === 'withdraw') return s
			return s + getLogMerchantAmount(item)
		}, 0)
		const withdrawTotal = calcWithdrawFrozenAmount(rows)
		const withdrawable = roundMoney(Math.max(0, totalRevenue - withdrawTotal))
		if (requestedAmount > withdrawable) {
			return {
				code: 400,
				msg: '可提现余额不足',
				data: {
					withdrawable: withdrawable.toFixed(2)
				}
			}
		}
		const now = Date.now()
		const addRes = await revenueLogCollection.add({
			merchantOpenid: openid,
			wifiId: '',
			title: '提现申请',
			amount: requestedAmount,
			type: 'withdraw',
			status: 'pending',
			createTime: now
		})
		return {
			code: 0,
			msg: 'ok',
			data: {
				_id: addRes.id,
				amount: requestedAmount.toFixed(2),
				status: 'pending',
				createTime: now
			}
		}
	} catch (err) {
		console.error('[wifi_list] merchantWithdrawRequest 失败', err)
		return {
			code: 500,
			msg: err.message || '提现申请失败',
			data: null
		}
	}
}

async function handleGetAgentProfile(openid) {
	try {
		if (!openid) return {
			code: 401,
			msg: '未登录',
			data: null
		}
		const profile = await getAgentProfileByOpenid(openid)
		return {
			code: 0,
			msg: 'ok',
			data: profile
		}
	} catch (err) {
		console.error('[wifi_list] getAgentProfile 失败', err)
		return {
			code: 0,
			msg: 'ok',
			data: null
		}
	}
}

async function handleSaveAgentProfile(event, openid) {
	try {
		if (!openid) return {
			code: 401,
			msg: '未登录',
			data: null
		}
		const now = Date.now()
		const payload = {
			name: String((event && event.name) || '').trim(),
			phone: String((event && event.phone) || '').trim(),
			city: String((event && event.city) || '').trim(),
			wechat: String((event && event.wechat) || '').trim(),
			status: 'active',
			updateTime: now
		}
		if (!payload.name || !payload.phone || !payload.city) {
			return {
				code: 400,
				msg: '请填写姓名、手机号和城市',
				data: null
			}
		}
		const {
			data: exist
		} = await agentCollection.where({
			openid
		}).limit(1).get()
		if (exist && exist.length) {
			await agentCollection.doc(exist[0]._id).update(payload)
			await bindCreatorWifiToAgent(openid)
			return {
				code: 0,
				msg: 'ok',
				data: {
					...exist[0],
					...payload,
					openid
				}
			}
		}
		const addRes = await agentCollection.add({
			openid,
			...payload,
			createTime: now
		})
		await bindCreatorWifiToAgent(openid)
		return {
			code: 0,
			msg: 'ok',
			data: {
				_id: addRes.id,
				openid,
				...payload,
				createTime: now
			}
		}
	} catch (err) {
		console.error('[wifi_list] saveAgentProfile 失败', err)
		return {
			code: 500,
			msg: err.message || '保存失败',
			data: null
		}
	}
}

async function handleAgentWifiList(openid) {
	try {
		if (!openid) return {
			code: 0,
			msg: 'ok',
			data: []
		}
		const {
			data
		} = await wifiCollection.where({
			agentOpenid: openid
		}).orderBy('createTime', 'desc').get()
		const list = (data || []).map((item) => ({
			_id: item._id,
			name: item.wifiName || '',
			shop: item.shopName || '',
			merchantOpenid: item.merchantOpenid || '',
			status: item.status || '在线',
			viewCount: item.viewCount || 0,
			connectCount: item.connectCount || 0,
			createTime: item.createTime || 0
		}))
		return {
			code: 0,
			msg: 'ok',
			data: list
		}
	} catch (err) {
		console.error('[wifi_list] agentWifiList 失败', err)
		return {
			code: 0,
			msg: 'ok',
			data: []
		}
	}
}

async function handleAgentStats(openid) {
	try {
		if (!openid) return {
			code: 0,
			msg: 'ok',
			data: emptyAgentStats()
		}
		const todayStart = startOfTodayMs()
		const {
			data: wifiRows
		} = await wifiCollection.where({
			agentOpenid: openid
		}).get()
		const merchantSet = new Set()
		let connectCount = 0
		;(wifiRows || []).forEach((item) => {
			connectCount += item.connectCount || 0
			if (item.merchantOpenid) merchantSet.add(item.merchantOpenid)
		})
		const {
			data: revenueRows
		} = await agentRevenueCollection.where({
			agentOpenid: openid
		}).limit(1000).get()
		let todayRevenue = 0
		let totalRevenue = 0
		;(revenueRows || []).forEach((item) => {
			if (item.type === 'withdraw') return
			const amount = getLogAgentAmount(item)
			totalRevenue += amount
			if ((item.createTime || 0) >= todayStart) todayRevenue += amount
		})
		const withdrawTotal = calcWithdrawFrozenAmount(revenueRows || [])
		const pendingWithdraw = calcWithdrawProcessingAmount(revenueRows || [])
		const {
			total: todayConnectCount
		} = await connectLogCollection.where({
			agentOpenid: openid,
			connectTime: db.command.gte(todayStart)
		}).count()
		return {
			code: 0,
			msg: 'ok',
			data: {
				wifiCount: (wifiRows || []).length,
				merchantCount: merchantSet.size,
				connectCount,
				todayConnectCount: todayConnectCount || 0,
				todayRevenue: todayRevenue.toFixed(2),
				totalRevenue: totalRevenue.toFixed(2),
				withdrawable: Math.max(0, totalRevenue - withdrawTotal).toFixed(2),
				pendingWithdraw: pendingWithdraw.toFixed(2)
			}
		}
	} catch (err) {
		console.error('[wifi_list] agentStats 失败', err)
		return {
			code: 0,
			msg: 'ok',
			data: emptyAgentStats()
		}
	}
}

function emptyAgentStats() {
	return {
		wifiCount: 0,
		merchantCount: 0,
		connectCount: 0,
		todayConnectCount: 0,
		todayRevenue: '0.00',
		totalRevenue: '0.00',
		withdrawable: '0.00',
		pendingWithdraw: '0.00'
	}
}

async function handleAgentRevenue(openid, range = '全部') {
	try {
		if (!openid) return {
			code: 0,
			msg: 'ok',
			data: emptyAgentRevenue()
		}
		const {
			data
		} = await agentRevenueCollection
			.where({
				agentOpenid: openid
			})
			.orderBy('createTime', 'desc')
			.limit(200)
			.get()
		const all = data || []
		const filtered = filterRevenueByRange(all, range)
		const list = filtered.map((item) => {
			const amount = item.type === 'withdraw' ? (Number(item.amount) || 0) : getLogAgentAmount(item)
			return {
				_id: item._id,
				title: item.title || '代理广告收益',
				time: formatDateTime(item.createTime),
				amount: amount.toFixed(2),
				type: item.type || 'ad',
				status: item.status || '',
				wifiName: item.wifiName || '',
				merchantOpenid: item.merchantOpenid || '',
				agentAmount: amount.toFixed(2)
			}
		})
		const sumAll = all.reduce((s, item) => {
			if (item.type === 'withdraw') return s
			return s + getLogAgentAmount(item)
		}, 0)
		const withdrawTotal = calcWithdrawFrozenAmount(all)
		const pendingWithdraw = calcWithdrawProcessingAmount(all)
		const todayRevenue = all.reduce((s, item) => {
			if (item.type === 'withdraw' || (item.createTime || 0) < startOfTodayMs()) return s
			return s + getLogAgentAmount(item)
		}, 0)
		return {
			code: 0,
			msg: 'ok',
			data: {
				total: sumAll.toFixed(2),
				today: todayRevenue.toFixed(2),
				withdrawable: Math.max(0, sumAll - withdrawTotal).toFixed(2),
				pendingWithdraw: pendingWithdraw.toFixed(2),
				list
			}
		}
	} catch (err) {
		console.error('[wifi_list] agentRevenue 失败', err)
		return {
			code: 0,
			msg: 'ok',
			data: emptyAgentRevenue()
		}
	}
}

function emptyAgentRevenue() {
	return {
		total: '0.00',
		today: '0.00',
		withdrawable: '0.00',
		pendingWithdraw: '0.00',
		list: []
	}
}

async function handleAgentWithdrawRequest(event, openid) {
	try {
		if (!openid) return {
			code: 401,
			msg: '未登录',
			data: null
		}
		const profile = await getAgentProfileByOpenid(openid)
		if (!profile || profile.status === 'disabled') return {
			code: 403,
			msg: '请先完成代理入驻',
			data: null
		}
		const requestedAmount = roundMoney(event && event.amount)
		if (!requestedAmount || requestedAmount <= 0) return {
			code: 400,
			msg: '提现金额错误',
			data: null
		}
		const {
			data
		} = await agentRevenueCollection.where({
			agentOpenid: openid
		}).limit(1000).get()
		const rows = data || []
		const totalRevenue = rows.reduce((s, item) => {
			if (item.type === 'withdraw') return s
			return s + getLogAgentAmount(item)
		}, 0)
		const withdrawTotal = calcWithdrawFrozenAmount(rows)
		const withdrawable = roundMoney(Math.max(0, totalRevenue - withdrawTotal))
		if (requestedAmount > withdrawable) {
			return {
				code: 400,
				msg: '可提现余额不足',
				data: {
					withdrawable: withdrawable.toFixed(2)
				}
			}
		}
		const now = Date.now()
		const addRes = await agentRevenueCollection.add({
			agentOpenid: openid,
			title: '代理提现申请',
			amount: requestedAmount,
			type: 'withdraw',
			status: 'pending',
			createTime: now
		})
		return {
			code: 0,
			msg: 'ok',
			data: {
				_id: addRes.id,
				amount: requestedAmount.toFixed(2),
				status: 'pending',
				createTime: now
			}
		}
	} catch (err) {
		console.error('[wifi_list] agentWithdrawRequest 失败', err)
		return {
			code: 500,
			msg: err.message || '提现申请失败',
			data: null
		}
	}
}

async function handleCheckPlatformAdmin(openid) {
	return {
		code: 0,
		msg: 'ok',
		data: {
			isAdmin: isPlatformAdmin(openid),
			openid: normalizeOpenid(openid)
		}
	}
}

function rejectNonAdmin(openid) {
	if (isPlatformAdmin(openid)) return null
	return {
		code: 403,
		msg: '无管理员权限',
		data: null
	}
}

async function getMerchantProfileByOpenid(merchantOpenid) {
	const openid = normalizeOpenid(merchantOpenid)
	if (!openid) return null
	const {
		data
	} = await merchantCollection.where({
		openid
	}).limit(1).get()
	return data && data.length ? data[0] : null
}

function getWithdrawCollection(accountType) {
	return accountType === 'agent' ? agentRevenueCollection : revenueLogCollection
}

async function handleAdminWithdrawList(event, openid) {
	try {
		const denied = rejectNonAdmin(openid)
		if (denied) return denied
		const status = String((event && event.status) || 'pending').trim()
		const limit = Math.min(Number((event && event.limit) || 100) || 100, 100)
		const query = {
			type: 'withdraw'
		}
		if (status && status !== '全部') {
			query.status = status
		}
		const {
			data: merchantRows
		} = await revenueLogCollection
			.where(query)
			.orderBy('createTime', 'desc')
			.limit(limit)
			.get()
		const {
			data: agentRows
		} = await agentRevenueCollection
			.where(query)
			.orderBy('createTime', 'desc')
			.limit(limit)
			.get()
		const merchantList = await Promise.all((merchantRows || []).map(async (item) => {
			const profile = await getMerchantProfileByOpenid(item.merchantOpenid)
			return {
				_id: item._id,
				accountType: 'merchant',
				accountLabel: '商家',
				accountOpenid: item.merchantOpenid || '',
				accountName: (profile && profile.shopName) || '未填写店铺',
				accountPhone: (profile && profile.phone) || '',
				wechat: (profile && profile.wechat) || '',
				amount: (Number(item.amount) || 0).toFixed(2),
				status: item.status || 'pending',
				time: formatDateTime(item.createTime),
				createTime: item.createTime || 0,
				auditNote: item.auditNote || '',
				auditTime: item.auditTime ? formatDateTime(item.auditTime) : '',
				payTime: item.payTime ? formatDateTime(item.payTime) : ''
			}
		}))
		const agentList = await Promise.all((agentRows || []).map(async (item) => {
			const profile = await getAgentProfileByOpenid(item.agentOpenid)
			return {
				_id: item._id,
				accountType: 'agent',
				accountLabel: '代理',
				accountOpenid: item.agentOpenid || '',
				accountName: (profile && profile.name) || '未填写代理',
				accountPhone: (profile && profile.phone) || '',
				wechat: (profile && profile.wechat) || '',
				amount: (Number(item.amount) || 0).toFixed(2),
				status: item.status || 'pending',
				time: formatDateTime(item.createTime),
				createTime: item.createTime || 0,
				auditNote: item.auditNote || '',
				auditTime: item.auditTime ? formatDateTime(item.auditTime) : '',
				payTime: item.payTime ? formatDateTime(item.payTime) : ''
			}
		}))
		const list = [...merchantList, ...agentList]
			.sort((a, b) => (b.createTime || 0) - (a.createTime || 0))
			.slice(0, limit)
		return {
			code: 0,
			msg: 'ok',
			data: {
				list
			}
		}
	} catch (err) {
		console.error('[wifi_list] adminWithdrawList 失败', err)
		return {
			code: 500,
			msg: err.message || '查询失败',
			data: {
				list: []
			}
		}
	}
}

async function handleAdminAuditWithdraw(event, openid) {
	try {
		const denied = rejectNonAdmin(openid)
		if (denied) return denied
		const withdrawId = String((event && event.withdrawId) || '').trim()
		const accountType = String((event && event.accountType) || 'merchant').trim() === 'agent' ? 'agent' : 'merchant'
		const auditAction = String((event && event.auditAction) || '').trim()
		const auditNote = String((event && event.auditNote) || '').trim()
		if (!withdrawId) return {
			code: 400,
			msg: '缺少提现申请 ID',
			data: null
		}
		const {
			data
		} = await getWithdrawCollection(accountType).doc(withdrawId).get()
		if (!data || !data.length || data[0].type !== 'withdraw') {
			return {
				code: 404,
				msg: '提现申请不存在',
				data: null
			}
		}
		const doc = data[0]
		const currentStatus = doc.status || 'pending'
		const now = Date.now()
		let payload = null
		if (auditAction === 'approve') {
			if (currentStatus !== 'pending') return {
				code: 400,
				msg: '只有待审核申请可以通过',
				data: null
			}
			payload = {
				status: 'approved',
				auditorOpenid: openid,
				auditNote,
				auditTime: now,
				updateTime: now
			}
		} else if (auditAction === 'reject') {
			if (currentStatus !== 'pending' && currentStatus !== 'approved') return {
				code: 400,
				msg: '当前状态不可驳回',
				data: null
			}
			payload = {
				status: 'rejected',
				auditorOpenid: openid,
				auditNote,
				auditTime: now,
				rejectTime: now,
				updateTime: now
			}
		} else if (auditAction === 'paid') {
			if (currentStatus !== 'approved') return {
				code: 400,
				msg: '请先审核通过，再标记已打款',
				data: null
			}
			payload = {
				status: 'paid',
				payerOpenid: openid,
				payNote: auditNote,
				payTime: now,
				updateTime: now
			}
		} else {
			return {
				code: 400,
				msg: '审核操作错误',
				data: null
			}
		}
		await getWithdrawCollection(accountType).doc(withdrawId).update(payload)
		return {
			code: 0,
			msg: 'ok',
			data: {
				_id: withdrawId,
				accountType,
				status: payload.status
			}
		}
	} catch (err) {
		console.error('[wifi_list] adminAuditWithdraw 失败', err)
		return {
			code: 500,
			msg: err.message || '审核失败',
			data: null
		}
	}
}

async function handleGetMerchantProfile(openid) {
	try {
		if (!openid) {
			return {
				code: 401,
				msg: '未登录',
				data: null
			}
		}

		const {
			data
		} = await merchantCollection.where({
			openid
		}).limit(1).get()

		return {
			code: 0,
			msg: 'ok',
			data: data[0] || null
		}
	} catch (err) {
		console.error('[merchant-profile] 查询异常', JSON.stringify(err))
		return {
			code: 0,
			msg: 'ok',
			data: null
		}
	}
}

async function handleSaveMerchantProfile(event, openid) {
	try {
		if (!openid) return {
			code: 401,
			msg: '未登录',
			data: null
		}
		const now = Date.now()
		const payload = {
			shopName: String((event && event.shopName) || '').trim(),
			contact: String((event && event.contact) || '').trim(),
			phone: String((event && event.phone) || '').trim(),
			address: String((event && event.address) || '').trim(),
			defaultAd: event && event.defaultAd !== false,
			pushDeal: event && event.pushDeal !== false,
			autoWithdraw: !!(event && event.autoWithdraw),
			wechat: String((event && event.wechat) || '').trim(),
			updateTime: now
		}
		const {
			data: exist
		} = await merchantCollection.where({
			openid
		}).limit(1).get()
		if (exist && exist.length) {
			await merchantCollection.doc(exist[0]._id).update(payload)
			return {
				code: 0,
				msg: 'ok',
				data: {
					...exist[0],
					...payload,
					openid
				}
			}
		}
		const addRes = await merchantCollection.add({
			openid,
			...payload,
			createTime: now
		})
		return {
			code: 0,
			msg: 'ok',
			data: {
				_id: addRes.id,
				openid,
				...payload,
				createTime: now
			}
		}
	} catch (err) {
		console.error('[wifi_list] saveMerchantProfile 失败', err)
		return {
			code: 500,
			msg: err.message || '保存失败',
			data: null
		}
	}
}

async function handleRecordView(event) {
	try {
		const {
			wifiId
		} = event || {}
		if (!wifiId) return {
			code: 0,
			msg: 'ok',
			data: null
		}
		const {
			data
		} = await wifiCollection.doc(wifiId).get()
		if (!data || !data.length) return {
			code: 0,
			msg: 'ok',
			data: null
		}
		const doc = data[0]
		const viewCount = (doc.viewCount || 0) + 1
		const connectCount = doc.connectCount || 0
		const heat = calcHeat(viewCount, connectCount)
		await wifiCollection.doc(wifiId).update({
			viewCount,
			heat
		})
		return {
			code: 0,
			msg: 'ok',
			data: {
				viewCount,
				heat
			}
		}
	} catch (err) {
		console.error('[wifi_list] recordView 失败', err)
		return {
			code: 0,
			msg: 'ok',
			data: null
		}
	}
}

async function handleRecordConnect(event, userOpenid) {
	try {
		const {
			wifiId
		} = event || {}
		if (!wifiId) return {
			code: 0,
			msg: 'ok',
			data: null
		}
		const {
			data
		} = await wifiCollection.doc(wifiId).get()
		if (!data || !data.length) return {
			code: 0,
			msg: 'ok',
			data: null
		}
		const doc = data[0]
		const merchantOpenid = normalizeOpenid(doc.merchantOpenid)
		if (!merchantOpenid || merchantOpenid === 'system-seed-data') {
			return {
				code: 0,
				msg: 'ok',
				data: null
			}
		}
		const now = Date.now()
		const shares = calcRevenueShares()
		const agentOpenid = await resolveAgentOpenidForWifi(doc)
		const connectCount = (doc.connectCount || 0) + 1
		const viewCount = doc.viewCount || 0
		const heat = calcHeat(viewCount, connectCount)
		const updatePayload = {
			connectCount,
			heat
		}
		if (agentOpenid && !normalizeOpenid(doc.agentOpenid)) {
			updatePayload.agentOpenid = agentOpenid
		}
		await wifiCollection.doc(wifiId).update(updatePayload)
		await connectLogCollection.add({
			wifiId,
			wifiName: doc.wifiName || '',
			merchantOpenid,
			agentOpenid,
			userOpenid: userOpenid || '',
			connectTime: now,
			income: shares.merchantAmount,
			grossAmount: shares.grossAmount,
			platformAmount: shares.platformAmount,
			agentAmount: shares.agentAmount,
			merchantAmount: shares.merchantAmount
		})
		await revenueLogCollection.add({
			merchantOpenid,
			agentOpenid,
			wifiId,
			wifiName: doc.wifiName || '',
			title: 'WiFi广告收益',
			amount: shares.merchantAmount,
			grossAmount: shares.grossAmount,
			platformAmount: shares.platformAmount,
			agentAmount: shares.agentAmount,
			merchantAmount: shares.merchantAmount,
			type: 'ad',
			status: 'settled',
			createTime: now
		})
		if (agentOpenid) {
			await agentRevenueCollection.add({
				agentOpenid,
				merchantOpenid,
				wifiId,
				wifiName: doc.wifiName || '',
				title: '代理广告收益',
				amount: shares.agentAmount,
				grossAmount: shares.grossAmount,
				platformAmount: shares.platformAmount,
				agentAmount: shares.agentAmount,
				merchantAmount: shares.merchantAmount,
				type: 'ad',
				status: 'settled',
				createTime: now
			})
		}
		return {
			code: 0,
			msg: 'ok',
			data: {
				connectCount,
				income: shares.merchantAmount,
				merchantAmount: shares.merchantAmount
			}
		}
	} catch (err) {
		console.error('[wifi_list] recordConnect 失败', err)
		return {
			code: 0,
			msg: 'ok',
			data: null
		}
	}
}

async function handleUpdateWifiStatus(event, openid) {
	try {
		const {
			id,
			status
		} = event || {}
		if (!id || !openid) return {
			code: 400,
			msg: '参数错误',
			data: null
		}
		const {
			data
		} = await wifiCollection.doc(id).get()
		if (!data || !data.length || !canManageWifiDoc(data[0], openid)) {
			return {
				code: 403,
				msg: '无权限',
				data: null
			}
		}
		const nextStatus = status === '离线' ? '离线' : '在线'
		await wifiCollection.doc(id).update({
			status: nextStatus
		})
		return {
			code: 0,
			msg: 'ok',
			data: {
				status: nextStatus
			}
		}
	} catch (err) {
		console.error('[wifi_list] updateWifiStatus 失败', err)
		return {
			code: 500,
			msg: err.message || '更新失败',
			data: null
		}
	}
}

/**
 * 云函数入口（必须存在 index.js）
 */
exports.main = async (event, context) => {
	const action = (event && event.action) || ''
	const needOpenid = [
		'add',
		'delete',
		'myList',
		'merchantWifiList',
		'merchantStats',
		'merchantConnects',
		'merchantRevenue',
		'merchantWithdrawRequest',
		'getAgentProfile',
		'saveAgentProfile',
		'agentWifiList',
		'agentStats',
		'agentRevenue',
		'agentWithdrawRequest',
		'checkPlatformAdmin',
		'adminWithdrawList',
		'adminAuditWithdraw',
		'getMerchantProfile',
		'saveMerchantProfile',
		'updateWifiStatus',
		'getMyWifiDetail',
		'updateWifi',
		'assignMerchantOpenid',
		'generateWifiQrCode'
	]
	const needOpenidOptional = ['recordConnect']

	let openid = ''
	if (needOpenid.includes(action) || needOpenidOptional.includes(action)) {
		openid = await resolveOpenid(context, event)
	}

	try {
		switch (action) {
			case 'nearby':
				return await handleNearby(event)
			case 'initSeed':
				return await handleInitSeed()
			case 'add':
				return await handleAdd(event, openid)
			case 'delete':
				return await handleDelete(event, openid)
			case 'myList':
				return await handleMyList(openid)
			case 'merchantWifiList':
				return await handleMerchantWifiList(openid)
			case 'merchantStats':
				return await handleMerchantStats(openid)
			case 'merchantConnects':
				return await handleMerchantConnects(openid, event && event.limit)
			case 'merchantRevenue':
				return await handleMerchantRevenue(openid, event && event.range)
			case 'merchantWithdrawRequest':
				return await handleMerchantWithdrawRequest(event, openid)
			case 'getAgentProfile':
				return await handleGetAgentProfile(openid)
			case 'saveAgentProfile':
				return await handleSaveAgentProfile(event, openid)
			case 'agentWifiList':
				return await handleAgentWifiList(openid)
			case 'agentStats':
				return await handleAgentStats(openid)
			case 'agentRevenue':
				return await handleAgentRevenue(openid, event && event.range)
			case 'agentWithdrawRequest':
				return await handleAgentWithdrawRequest(event, openid)
			case 'checkPlatformAdmin':
				return await handleCheckPlatformAdmin(openid)
			case 'adminWithdrawList':
				return await handleAdminWithdrawList(event, openid)
			case 'adminAuditWithdraw':
				return await handleAdminAuditWithdraw(event, openid)
			case 'getMerchantProfile':
				return await handleGetMerchantProfile(openid)
			case 'saveMerchantProfile':
				return await handleSaveMerchantProfile(event, openid)
			case 'recordView':
				return await handleRecordView(event)
			case 'recordConnect':
				return await handleRecordConnect(event, openid)
			case 'updateWifiStatus':
				return await handleUpdateWifiStatus(event, openid)
			case 'getMyWifiDetail':
				return await handleGetMyWifiDetail(event, openid)
			case 'updateWifi':
				return await handleUpdateWifi(event, openid)
			case 'assignMerchantOpenid':
				return await handleAssignMerchantOpenid(event, openid)
			case 'getWifiPublicDetail':
				return await handleGetWifiPublicDetail(event)
			case 'getWifiConnectCredential':
				return await handleGetWifiConnectCredential(event)
			case 'generateWifiQrCode':
				return await handleGenerateWifiQrCode(event, openid)
			default:
				return {
					code: 0, msg: 'ok', data: []
				}
		}
	} catch (err) {
		console.error('[wifi_list] main 异常', err)
		return {
			code: 0,
			msg: 'ok',
			data: []
		}
	}
}
