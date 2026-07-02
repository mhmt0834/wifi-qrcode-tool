/**
 * 云函数 resource exhausted 后短暂冷却，避免连续打满额度
 */

const STORAGE_KEY = 'cloud_exhausted_until'
const COOLDOWN_MS = 120000

export function isCloudResourceExhaustedMessage(msg) {
	const text = String(msg || '')
	return (
		text.indexOf('resource exhausted') !== -1 ||
		text.indexOf('FC invoke failed') !== -1 ||
		text.indexOf('资源不足') !== -1
	)
}

export function markCloudExhausted(errOrMsg) {
	const msg =
		typeof errOrMsg === 'string'
			? errOrMsg
			: (errOrMsg && (errOrMsg.message || errOrMsg.errMsg)) || ''
	if (!isCloudResourceExhaustedMessage(msg)) return
	try {
		uni.setStorageSync(STORAGE_KEY, Date.now() + COOLDOWN_MS)
	} catch (e) {}
}

export function isCloudInCooldown() {
	try {
		const until = Number(uni.getStorageSync(STORAGE_KEY) || 0)
		return until > Date.now()
	} catch (e) {
		return false
	}
}

export function clearCloudCooldown() {
	try {
		uni.removeStorageSync(STORAGE_KEY)
	} catch (e) {}
}
