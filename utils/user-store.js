/**
 * 本地用户信息存储（无云函数依赖，避免与 wifi-db 循环引用）
 */

const USER_STORAGE_KEY = 'wifi_user_info'

export function getStoredUser() {
	try {
		const raw = uni.getStorageSync(USER_STORAGE_KEY)
		if (raw && raw.openid) return raw
	} catch (e) {
		// 静默失败
	}
	return null
}

export function isLoggedIn() {
	const user = getStoredUser()
	return !!(user && user.openid)
}

export function getOpenid() {
	const user = getStoredUser()
	return (user && user.openid) || ''
}

export function saveStoredUser(user) {
	if (!user || !user.openid) {
		return
	}
	try {
		uni.setStorageSync(USER_STORAGE_KEY, user)
	} catch (e) {
		// 静默失败
	}
}

export function clearStoredUser() {
	try {
		uni.removeStorageSync(USER_STORAGE_KEY)
	} catch (e) {
		// 静默失败
	}
}
