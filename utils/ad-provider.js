/**
 * 激励视频广告统一入口
 * 审核版：AUDIT_MODE=true，跳过广告直接放行
 * 正式版：AUDIT_MODE=false，USE_WECHAT_REWARD_AD=true 并配置 WECHAT_AD_UNIT_ID
 */

/** 微信首次提审：true=跳过 Mock/激励视频，点击直接获取密码；过审后改 false */
export const AUDIT_MODE = false

/** 测试版 Mock 广告时长（毫秒） */
export const MOCK_AD_DURATION_MS = 5000

/** false = Mock；true = 微信流量主激励视频（AUDIT_MODE 关闭后启用） */
export const USE_WECHAT_REWARD_AD = true

/** 微信激励视频广告位 ID（正式环境填写） */
export const WECHAT_AD_UNIT_ID = 'adunit-21d6d12eb155bd3b'

const AD_INCOMPLETE_TOAST = '获取密码失败，请重试'

let rewardedVideoAd = null
let rewardedVideoAdResolve = null
let lastRewardAdError = ''

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

function resolveRewardAd(completed) {
	if (rewardedVideoAdResolve) {
		rewardedVideoAdResolve(!!completed)
		rewardedVideoAdResolve = null
	}
}

function setRewardAdError(errOrMsg) {
	if (!errOrMsg) {
		lastRewardAdError = ''
		return
	}
	const msg =
		typeof errOrMsg === 'string'
			? errOrMsg
			: (errOrMsg.errMsg || errOrMsg.message || JSON.stringify(errOrMsg))
	lastRewardAdError = msg || AD_INCOMPLETE_TOAST
}

function ensureWechatRewardedVideoAd(adUnitId = WECHAT_AD_UNIT_ID) {
	// #ifdef MP-WEIXIN
	if (!adUnitId) {
		console.error('[ad-provider] 未配置 WECHAT_AD_UNIT_ID')
		setRewardAdError('未配置激励广告位 ID')
		return null
	}
	if (!rewardedVideoAd) {
		rewardedVideoAd = wx.createRewardedVideoAd({ adUnitId })
		rewardedVideoAd.onClose((res) => {
			if (res && res.isEnded === false) {
				setRewardAdError('请完整观看激励视频后再获取密码')
				resolveRewardAd(false)
				return
			}
			setRewardAdError('')
			resolveRewardAd(true)
		})
		rewardedVideoAd.onError((err) => {
			console.error('[ad-provider] 激励视频错误', err)
			setRewardAdError(err)
			resolveRewardAd(false)
		})
	}
	return rewardedVideoAd
	// #endif
	// #ifndef MP-WEIXIN
	return null
	// #endif
}

/**
 * Mock：由页面展示遮罩对话框，倒计时结束后 resolve
 * @param {{ onMockStart?: () => void, onMockEnd?: () => void }} hooks
 */
export async function showMockRewardAd(hooks = {}) {
	const { onMockStart, onMockEnd } = hooks
	onMockStart && onMockStart()
	await sleep(MOCK_AD_DURATION_MS)
	onMockEnd && onMockEnd()
	return true
}

/**
 * 微信激励视频（后期替换 Mock 时启用）
 * @returns {Promise<boolean>}
 */
export function showWechatRewardedVideoAd(adUnitId = WECHAT_AD_UNIT_ID) {
	return new Promise((resolve) => {
		// #ifdef MP-WEIXIN
		setRewardAdError('')
		rewardedVideoAdResolve = resolve
		const ad = ensureWechatRewardedVideoAd(adUnitId)
		if (!ad) {
			resolveRewardAd(false)
			return
		}
		ad
			.show()
			.catch((showErr) => {
				setRewardAdError(showErr)
				ad
					.load()
					.then(() => ad.show())
					.catch((err) => {
						console.error('[ad-provider] 激励视频加载失败', err)
						resolveRewardAd(false)
					})
			})
		// #endif
		// #ifndef MP-WEIXIN
		console.warn('[ad-provider] 非微信小程序环境，无法播放激励视频')
		resolve(false)
		// #endif
	})
}

/**
 * 展示激励视频广告（统一入口）
 * @param {{ onMockStart?: () => void, onMockEnd?: () => void }} hooks Mock 时页面遮罩回调
 * @returns {Promise<boolean>} 是否完整观看
 */
export async function showRewardAd(hooks = {}) {
	try {
		if (AUDIT_MODE) {
			setRewardAdError('')
			return true
		}
		if (USE_WECHAT_REWARD_AD) {
			return await showWechatRewardedVideoAd()
		}
		return await showMockRewardAd(hooks)
	} catch (err) {
		console.error('[ad-provider] showRewardAd 异常', err)
		setRewardAdError(err)
		return false
	}
}

/** 是否处于提审模式（不展示/不播放任何广告） */
export function isAuditAdMode() {
	return AUDIT_MODE
}

export function toastAdIncomplete() {
	uni.showToast({
		title: getRewardAdFailMessage(),
		icon: 'none',
		duration: 2500
	})
}

export function getRewardAdFailMessage() {
	if (!lastRewardAdError) return AD_INCOMPLETE_TOAST
	if (lastRewardAdError.indexOf('no ad') !== -1 || lastRewardAdError.indexOf('广告拉取失败') !== -1) {
		return '暂无可播放广告，请稍后重试'
	}
	if (lastRewardAdError.indexOf('完整观看') !== -1) {
		return lastRewardAdError
	}
	if (lastRewardAdError.indexOf('未配置') !== -1) {
		return lastRewardAdError
	}
	return `激励广告异常：${lastRewardAdError}`
}

export function preloadRewardAd() {
	if (AUDIT_MODE || !USE_WECHAT_REWARD_AD) return
	const ad = ensureWechatRewardedVideoAd()
	if (ad) {
		ad.load().catch(() => {})
	}
}

export function isMockAdMode() {
	return !AUDIT_MODE && !USE_WECHAT_REWARD_AD
}

export { AD_INCOMPLETE_TOAST, WECHAT_AD_UNIT_ID as AD_UNIT_ID }
