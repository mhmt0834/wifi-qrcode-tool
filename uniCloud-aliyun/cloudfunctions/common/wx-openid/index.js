'use strict'

const fs = require('fs')
const path = require('path')

let cachedConfig = null

function loadWxConfig() {
	if (cachedConfig) return cachedConfig
	try {
		const raw = fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8')
		cachedConfig = JSON.parse(raw)
	} catch (e) {
		cachedConfig = {}
	}
	return cachedConfig
}

/**
 * 通过 wx.login 的 code 换取 openid（阿里云 uniCloud 必需）
 */
async function getOpenidByWxCode(wxCode) {
	const cfg = loadWxConfig()
	const appid = cfg.appid || ''
	const secret = cfg.appsecret || cfg.secret || ''

	if (!appid || !secret) {
		throw new Error(
			'请在 uniCloud-aliyun/cloudfunctions/common/wx-openid/config.json 填写 appsecret（微信小程序后台获取）'
		)
	}

	const res = await uniCloud.httpclient.request('https://api.weixin.qq.com/sns/jscode2session', {
		method: 'GET',
		data: {
			appid,
			secret,
			js_code: wxCode,
			grant_type: 'authorization_code'
		},
		dataType: 'json'
	})

	const data = res.data || {}
	if (data.errcode) {
		console.error('[wx-openid] code2session 失败', data)
		throw new Error(data.errmsg || '微信 code2session 失败')
	}
	if (!data.openid) {
		throw new Error('微信未返回 openid')
	}
	return data.openid
}

/**
 * 优先 context.OPENID；阿里云为空时用 event.wxCode 换取
 * @param {object} context 云函数 context
 * @param {object} event 客户端参数（需带 wxCode）
 */
async function resolveOpenid(context, event) {
	const openid = context.OPENID
	if (openid) {
		return openid
	}

	if (typeof uniCloud.getWXContext === 'function') {
		try {
			const wxCtx = uniCloud.getWXContext()
			if (wxCtx && wxCtx.OPENID) {
				return wxCtx.OPENID
			}
		} catch (e) {
			console.warn('[wx-openid] getWXContext 失败', e)
		}
	}

	const wxCode = (event && (event.wxCode || event.code)) || ''
	if (!wxCode) {
		console.warn('[wx-openid] context.OPENID 为空且未传 wxCode')
		return ''
	}

	return await getOpenidByWxCode(wxCode)
}

module.exports = {
	resolveOpenid,
	getOpenidByWxCode,
	loadWxConfig
}
