'use strict'

const {
	loadWxConfig
} = require('wx-openid')

let tokenCache = {
	token: '',
	expireAt: 0
}

/**
 * 获取小程序 access_token（用于生成小程序码）
 */
async function getAccessToken() {
	if (tokenCache.token && Date.now() < tokenCache.expireAt - 60000) {
		return tokenCache.token
	}
	const cfg = loadWxConfig()
	const appid = cfg.appid || ''
	const secret = cfg.appsecret || cfg.secret || ''
	if (!appid || !secret) {
		throw new Error('请在 wx-openid/config.json 配置 appid 与 appsecret')
	}
	const res = await uniCloud.httpclient.request('https://api.weixin.qq.com/cgi-bin/token', {
		method: 'GET',
		data: {
			grant_type: 'client_credential',
			appid,
			secret
		},
		dataType: 'json'
	})
	const data = res.data || {}
	if (!data.access_token) {
		throw new Error(data.errmsg || '获取 access_token 失败')
	}
	tokenCache = {
		token: data.access_token,
		expireAt: Date.now() + (data.expires_in || 7200) * 1000
	}
	return tokenCache.token
}

/**
 * 生成不限制数量的小程序码（scene 携带 wifiId，禁止包含密码）
 * @param {string} scene 最长 32 字符
 * @param {string} page 小程序页面路径
 */
async function generateUnlimitedWxaCode(scene, page = 'pages/wifi-detail/wifi-detail') {
	const token = await getAccessToken()
	const sceneStr = String(scene || '').slice(0, 32)
	if (!sceneStr) throw new Error('scene 不能为空')

	const env_version = 'release'

	const res = await uniCloud.httpclient.request(
		`https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${token}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			data: {
				scene: sceneStr,
				page,
				width: 430,
				check_path: false,
				env_version
			},
			dataType: 'buffer'
		}
	)

	const buf = res.data
	if (!buf || !buf.length) {
		throw new Error('微信未返回小程序码图片')
	}
	// 错误时返回 JSON
	if (buf[0] === 0x7b) {
		try {
			const err = JSON.parse(buf.toString('utf8'))
			throw new Error(err.errmsg || '生成小程序码失败')
		} catch (e) {
			if (e.message && e.message.indexOf('生成') !== -1) throw e
		}
	}
	return buf
}

module.exports = {
	getAccessToken,
	generateUnlimitedWxaCode
}