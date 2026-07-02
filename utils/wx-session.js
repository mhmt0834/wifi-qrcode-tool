/**
 * 微信会话（仅 uni.login，不解析 openid）
 */

import { withTimeout } from '@/utils/promise-util.js'

const WX_LOGIN_TIMEOUT_MS = 10000

export function ensureWxSession() {
	const loginPromise = new Promise((resolve, reject) => {
		uni.login({
			provider: 'weixin',
			success: (res) => {
				if (res.code) {
					resolve(res.code)
				} else {
					reject(new Error('uni.login 未返回 code'))
				}
			},
			fail: (err) => reject(err)
		})
	})

	return withTimeout(loginPromise, WX_LOGIN_TIMEOUT_MS, '微信登录超时')
}
