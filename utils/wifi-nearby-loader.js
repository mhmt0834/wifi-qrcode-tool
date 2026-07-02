/**

 * 附近 WiFi 列表：内存缓存 + 3 秒节流 + 请求锁 + 会话版本

 * 供首页 / 附近页共用，避免 tab 切换与 onShow 重复调用 wifi_list

 */



import { loadWifiListSafe } from '@/utils/wifi-db.js'



export const NEARBY_THROTTLE_MS = 3000



let cache = null

let inflight = null

let lastRequestAt = 0

let sessionVersion = 0

let isFetching = false



function hasCacheList() {

	return !!(cache && cache.baseList && cache.baseList.length)

}



function filterByKeyword(list, keyword) {

	const kw = String(keyword || '').trim().toLowerCase()

	if (!kw) return list || []

	return (list || []).filter(function (item) {

		return (

			(item.name && item.name.toLowerCase().indexOf(kw) !== -1) ||

			(item.shop && item.shop.toLowerCase().indexOf(kw) !== -1) ||

			(item.ssid && item.ssid.toLowerCase().indexOf(kw) !== -1)

		)

	})

}



function buildPayload(result, keyword) {

	const baseList = result.list || []

	return {

		list: filterByKeyword(baseList, keyword),

		baseList: baseList,

		fromCloud: result.fromCloud,

		fromCache: false,

		error: result.error || null

	}

}



function fromCache(keyword) {

	return {

		list: filterByKeyword(cache.baseList, keyword),

		baseList: cache.baseList,

		fromCloud: cache.fromCloud,

		fromCache: true,

		error: null

	}

}



function withKeyword(payload, keyword) {

	if (!keyword) return payload

	return Object.assign({}, payload, {

		list: filterByKeyword(payload.baseList, keyword)

	})

}



function saveCache(payload) {

	cache = {

		baseList: payload.baseList,

		fromCloud: payload.fromCloud,

		at: Date.now()

	}

}



function requestNearbyFromCloud(limit, force) {

	if (isFetching && inflight) {

		return inflight

	}



	const now = Date.now()

	if (!force && now - lastRequestAt < NEARBY_THROTTLE_MS && hasCacheList()) {

		return Promise.resolve(

			buildPayload(

				{

					list: cache.baseList,

					fromCloud: cache.fromCloud

				},

				''

			)

		)

	}



	isFetching = true

	lastRequestAt = now

	inflight = loadWifiListSafe({ limit: limit, keyword: '', force: !!force })

		.then(function (result) {

			const payload = buildPayload(result, '')

			saveCache(payload)

			return payload

		})

		.finally(function () {

			isFetching = false

			inflight = null

		})



	return inflight

}



/**

 * @param {object} options - limit / keyword（keyword 仅本地过滤）

 * @param {{ force?: boolean }} opts - 下拉刷新或数据变更后强制拉取

 */

export function fetchNearbyWifi(options, opts) {

	const opt = options || {}

	const cfg = opts || {}

	const force = !!cfg.force

	const keyword = opt.keyword || ''

	const limit = opt.limit || 50



	if (inflight) {

		return inflight.then(function (payload) {

			return withKeyword(payload, keyword)

		})

	}



	if (!force && hasCacheList()) {

		return Promise.resolve(fromCache(keyword))

	}



	if (isFetching && hasCacheList()) {

		return Promise.resolve(fromCache(keyword))

	}



	return requestNearbyFromCloud(limit, force).then(function (payload) {

		return withKeyword(payload, keyword)

	})

}



/** 上传/创建后统一刷新（全局只发 1 次云请求） */

export function refreshNearbyWifi(options) {

	invalidateNearbyCache()

	const opt = options || {}

	const limit = opt.limit || 100

	return fetchNearbyWifi(

		{ limit: limit, keyword: opt.keyword || '' },

		{ force: true }

	)

}



export function getNearbySessionVersion() {

	return sessionVersion

}



/** 仅本地按关键词过滤（不发起云请求） */

export function filterNearbyCache(keyword) {

	if (!hasCacheList()) return null

	return fromCache(keyword || '')

}



export function invalidateNearbyCache() {

	cache = null

	sessionVersion += 1

}



export function hasNearbyCache() {

	return hasCacheList()

}



export function isNearbyFetching() {

	return isFetching

}


