/**
 * 广告模块（兼容层，请优先使用 ad-provider.js）
 */
import {
	showRewardAd,
	showMockRewardAd,
	showWechatRewardedVideoAd,
	toastAdIncomplete,
	preloadRewardAd,
	isMockAdMode,
	isAuditAdMode,
	AD_INCOMPLETE_TOAST,
	AD_UNIT_ID,
	USE_WECHAT_REWARD_AD,
	AUDIT_MODE,
	MOCK_AD_DURATION_MS
} from '@/utils/ad-provider.js'

/** 与旧版命名兼容：true 表示 Mock 模式 */
export const USE_MOCK_AD = !USE_WECHAT_REWARD_AD

export {
	showRewardAd,
	showMockRewardAd,
	showWechatRewardedVideoAd,
	toastAdIncomplete,
	preloadRewardAd,
	isMockAdMode,
	isAuditAdMode,
	AD_INCOMPLETE_TOAST,
	AD_UNIT_ID,
	AUDIT_MODE,
	MOCK_AD_DURATION_MS
}

/** @deprecated 请使用 showRewardAd */
export const showRewardedVideoAd = showRewardAd

/** WiFi 场景：观看激励视频 */
export async function watchAdThenAllowWifi(hooks = {}) {
	const completed = await showRewardAd(hooks)
	if (!completed) {
		toastAdIncomplete()
	}
	return completed
}

export const preloadRewardedVideoAd = preloadRewardAd
