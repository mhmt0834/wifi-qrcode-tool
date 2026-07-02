/**
 * 微信登录（chooseAvatar + 昵称）
 * openid 由云函数返回（优先 context.OPENID；阿里云用 wxCode 换取）
 */

import { ensureWxSession } from '@/utils/wx-session.js'
import {
	getStoredUser,
	isLoggedIn,
	getOpenid,
	saveStoredUser,
	clearStoredUser
} from '@/utils/user-store.js'

import { formatCloudError } from '@/utils/cloud-config.js'
import { markCloudExhausted, isCloudInCooldown } from '@/utils/cloud-cooldown.js'

const USER_AUTH_FUNCTION = 'user_auth'

export { getStoredUser, isLoggedIn, getOpenid, ensureWxSession }

async function callUserAuth(data) {
	if (typeof uniCloud === 'undefined' || !uniCloud.callFunction) {
		throw new Error('uniCloud 未初始化')
	}
	const action = (data && data.action) || ''
	const skippable = ['getProfile', 'myWifiCount'].includes(action)
	if (skippable && isCloudInCooldown()) {
		if (action === 'myWifiCount') {
			return { code: 0, msg: 'cooldown', data: { count: 0 } }
		}
		return { code: 0, msg: 'cooldown', data: getStoredUser() }
	}
	const wxCode = await ensureWxSession()
	let res
	try {
		res = await uniCloud.callFunction({
			name: USER_AUTH_FUNCTION,
			data: { ...(data || {}), wxCode }
		})
	} catch (err) {
		markCloudExhausted(err)
		throw new Error(formatCloudError(err))
	}
	const result = (res && res.result) != null ? res.result : {}
	return result
}

export function resolveOpenidFromResult(result) {
	if (!result) return ''
	if (result.openid) return String(result.openid)
	if (result.data && result.data.openid) return String(result.data.openid)
	return ''
}

export async function fetchOpenidFromCloud() {
	const result = await callUserAuth({ action: 'getOpenid' })
	const openid = resolveOpenidFromResult(result)
	if (result.code !== 0 || !openid) {
		throw new Error(result.msg || '无法获取 openid')
	}
	return openid
}

function isLocalTempAvatar(path) {
	if (!path) return false
	if (path.indexOf('cloud://') === 0) return false
	if (/^https?:\/\//i.test(path) && path.indexOf('/tmp') === -1 && path.indexOf('tmp/') === -1) {
		return false
	}
	return (
		path.indexOf('wxfile://') === 0 ||
		path.indexOf('file://') === 0 ||
		path.indexOf('/tmp') !== -1 ||
		path.indexOf('tmp/') !== -1 ||
		/^https?:\/\/tmp/i.test(path)
	)
}

export async function uploadAvatarToCloud(tempFilePath) {
	if (!tempFilePath) return ''
	if (!isLocalTempAvatar(tempFilePath)) return tempFilePath
	try {
		const extMatch = tempFilePath.match(/\.(\w+)$/)
		const ext = (extMatch && extMatch[1]) || 'png'
		const cloudPath = `avatar/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
		const uploadRes = await uniCloud.uploadFile({
			filePath: tempFilePath,
			cloudPath
		})
		return uploadRes.fileID || tempFilePath
	} catch (e) {
		return tempFilePath
	}
}

function buildUserFromResult(result, nickname, avatar) {
	const openid = resolveOpenidFromResult(result)
	if (!openid) {
		throw new Error('无法获取用户身份，请稍后重试')
	}
	const data = result.data || {}
	return {
		_id: data._id,
		openid,
		nickname: data.nickname || nickname,
		avatar: data.avatar || avatar
	}
}

export async function loginWithProfile(profile = {}) {
	const nickname = String(profile.nickname || '').trim()
	const avatarTemp = String(profile.avatar || '').trim()

	if (!nickname) throw new Error('请输入昵称')
	if (nickname.length < 2) throw new Error('昵称至少 2 个字符')
	if (!avatarTemp) throw new Error('请选择头像')

	let avatar = avatarTemp
	if (isLocalTempAvatar(avatarTemp)) {
		avatar = await uploadAvatarToCloud(avatarTemp)
	}

	const result = await callUserAuth({ action: 'login', nickname, avatar })
	if (result.code !== 0) throw new Error(result.msg || '登录失败')

	const user = buildUserFromResult(result, nickname, avatar)
	saveStoredUser(user)
	return user
}

export async function updateUserProfile(profile = {}) {
	if (!isLoggedIn()) throw new Error('请先登录')

	const nickname = String(profile.nickname || '').trim()
	let avatar = String(profile.avatar || '').trim()

	if (!nickname) throw new Error('请输入昵称')
	if (nickname.length < 2) throw new Error('昵称至少 2 个字符')

	if (avatar && isLocalTempAvatar(avatar)) {
		avatar = await uploadAvatarToCloud(avatar)
	}

	const result = await callUserAuth({ action: 'updateProfile', nickname, avatar })
	if (result.code !== 0) throw new Error(result.msg || '保存失败')

	const user = buildUserFromResult(result, nickname, avatar)
	saveStoredUser(user)
	return user
}

export async function refreshUserProfile() {
	if (!isLoggedIn()) return null
	try {
		const result = await callUserAuth({ action: 'getProfile' })
		if (result.code === 0 && result.data) {
			const user = buildUserFromResult(result, result.data.nickname, result.data.avatar)
			saveStoredUser(user)
			return user
		}
	} catch (e) {
		// 静默失败
	}
	return getStoredUser()
}

export async function fetchMyWifiCount() {
	try {
		const result = await callUserAuth({ action: 'myWifiCount' })
		if (result.code === 0 && result.data) {
			return result.data.count || 0
		}
	} catch (e) {
		// 静默失败
	}
	return 0
}

export function logout() {
	clearStoredUser()
	uni.showToast({ title: '已退出登录', icon: 'none' })
}

export default {
	getStoredUser,
	isLoggedIn,
	getOpenid,
	ensureWxSession,
	resolveOpenidFromResult,
	fetchOpenidFromCloud,
	uploadAvatarToCloud,
	loginWithProfile,
	updateUserProfile,
	refreshUserProfile,
	fetchMyWifiCount,
	logout
}
