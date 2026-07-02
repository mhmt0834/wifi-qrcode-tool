'use strict'

/**
 * 微信用户认证
 * openid：优先 context.OPENID；阿里云空间用 wxCode + code2session
 */

const { resolveOpenid } = require('wx-openid')
const db = uniCloud.database()
const usersCollection = db.collection('users')
const wifiCollection = db.collection('wifi_list')

async function getOpenid(context, event) {
	return resolveOpenid(context, event)
}

async function upsertUser(openid, nickname, avatar) {
	const now = Date.now()
	const { data: existList } = await usersCollection.where({ openid }).limit(1).get()

	if (existList && existList.length > 0) {
		const doc = existList[0]
		await usersCollection.doc(doc._id).update({
			nickname,
			avatar,
			updateTime: now
		})
		return {
			_id: doc._id,
			openid,
			nickname,
			avatar,
			createTime: doc.createTime,
			updateTime: now
		}
	}

	const addRes = await usersCollection.add({
		openid,
		nickname,
		avatar,
		createTime: now,
		updateTime: now
	})

	return {
		_id: addRes.id,
		openid,
		nickname,
		avatar,
		createTime: now,
		updateTime: now
	}
}

async function handleGetOpenid(event, context) {
	try {
		const openid = await getOpenid(context, event)
		if (!openid) {
			return {
				code: 401,
				msg: '无法获取 openid：请传 wxCode，或在 wx-openid/config.json 配置 appsecret',
				openid: '',
				data: null
			}
		}
		return { code: 0, msg: 'ok', openid, data: { openid } }
	} catch (err) {
		console.error('[user_auth] getOpenid 失败', err)
		return { code: 500, msg: err.message || '获取 openid 失败', openid: '', data: null }
	}
}

async function handleLogin(event, context) {
	try {
		const openid = await getOpenid(context, event)
		if (!openid) {
			return {
				code: 401,
				msg: '无法获取 openid（context.OPENID 为空，请检查 wxCode 与 appsecret 配置）',
				openid: '',
				data: null
			}
		}

		const nickname = String((event && event.nickname) || '').trim()
		const avatar = String((event && event.avatar) || '').trim()
		if (!nickname) {
			return { code: 400, msg: '请输入昵称', openid, data: null }
		}

		const data = await upsertUser(openid, nickname, avatar)
		return { code: 0, msg: 'ok', openid, data }
	} catch (err) {
		console.error('[user_auth] login 失败', err)
		return { code: 500, msg: err.message || '登录失败', openid: '', data: null }
	}
}

async function handleUpdateProfile(event, context) {
	try {
		const openid = await getOpenid(context, event)
		if (!openid) {
			return { code: 401, msg: '无法获取 openid', openid: '', data: null }
		}

		const nickname = String((event && event.nickname) || '').trim()
		const avatar = String((event && event.avatar) || '').trim()
		if (!nickname) {
			return { code: 400, msg: '请输入昵称', openid, data: null }
		}

		const data = await upsertUser(openid, nickname, avatar)
		return { code: 0, msg: 'ok', openid, data }
	} catch (err) {
		console.error('[user_auth] updateProfile 失败', err)
		return { code: 500, msg: err.message || '更新失败', openid: '', data: null }
	}
}

async function handleGetProfile(event, context) {
	try {
		const openid = await getOpenid(context, event)
		if (!openid) {
			return { code: 401, msg: '未登录', openid: '', data: null }
		}
		const { data } = await usersCollection.where({ openid }).limit(1).get()
		if (!data || !data.length) {
			return { code: 404, msg: '用户不存在', openid, data: null }
		}
		return { code: 0, msg: 'ok', openid, data: data[0] }
	} catch (err) {
		console.error('[user_auth] getProfile 失败', err)
		return { code: 500, msg: err.message || '获取失败', openid: '', data: null }
	}
}

async function handleMyWifiCount(event, context) {
	try {
		const openid = await getOpenid(context, event)
		if (!openid) {
			return { code: 0, msg: 'ok', openid: '', data: { count: 0 } }
		}
		const countRes = await wifiCollection.where({ creatorOpenid: openid }).count()
		return { code: 0, msg: 'ok', openid, data: { count: countRes.total || 0 } }
	} catch (err) {
		console.error('[user_auth] myWifiCount 失败', err)
		return { code: 0, msg: 'ok', openid: '', data: { count: 0 } }
	}
}

exports.main = async (event, context) => {
	const action = (event && event.action) || ''

	try {
		switch (action) {
			case 'getOpenid':
				return await handleGetOpenid(event, context)
			case 'login':
				return await handleLogin(event, context)
			case 'updateProfile':
				return await handleUpdateProfile(event, context)
			case 'getProfile':
				return await handleGetProfile(event, context)
			case 'myWifiCount':
				return await handleMyWifiCount(event, context)
			default:
				return { code: 400, msg: 'unknown action', openid: '', data: null }
		}
	} catch (err) {
		console.error('[user_auth] main 异常', err)
		return { code: 500, msg: err.message || 'error', openid: '', data: null }
	}
}
