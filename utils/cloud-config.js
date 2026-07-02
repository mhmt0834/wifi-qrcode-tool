/**
 * uniCloud 云函数统一配置（禁止 list / wifi-list 旧名称）
 * 兼容 uni-app + 微信小程序
 */

/** 唯一允许的云函数名，与 uniCloud-aliyun/cloudfunctions/wifi_list 一致 */
export const WIFI_CLOUD_FUNCTION = 'wifi_list'

/** 禁止使用的旧云函数名 */
export const FORBIDDEN_CLOUD_FUNCTIONS = Object.freeze(['list', 'wifi-list'])

/** WiFi 列表刷新事件（禁止 wifi-list-refresh 命名） */
export const WIFI_LIST_REFRESH_EVENT = 'wifi_list_refresh'
export const MERCHANT_REFRESH_EVENT = 'merchant_refresh'
export const MY_WIFI_REFRESH_EVENT = 'my_wifi_refresh'

/** 用户登录云函数 */
export const USER_AUTH_FUNCTION = 'user_auth'

/** 云函数调用超时（毫秒，冷启动可能超过 10s） */
export const WIFI_CLOUD_TIMEOUT_MS = 20000

/**
 * 将 uniCloud / 微信网络错误转为用户可读提示（不含开发环境文案）
 */
import {
	markCloudExhausted,
	isCloudInCooldown,
	isCloudResourceExhaustedMessage
} from '@/utils/cloud-cooldown.js'

const NETWORK_FAIL_HINT = '网络请求失败，请稍后重试'
const CLOUD_BUSY_HINT = '云服务繁忙，请稍后再试'

function stripCloudPrefix(msg) {
	return String(msg || '').replace(/^\[[\w_-]+\]:\s*/, '')
}

function isDevOrDomainNetworkMsg(msg) {
	if (!msg) return false
	return (
		msg.indexOf('url not in domain list') !== -1 ||
		msg.indexOf('不在以下 request 合法域名') !== -1 ||
		msg.indexOf('合法域名') !== -1 ||
		msg.indexOf('微信开发者工具') !== -1 ||
		msg.indexOf('本地设置') !== -1 ||
		msg.indexOf('不校验合法域名') !== -1
	)
}

export function formatCloudError(err) {
	const raw = (err && (err.message || err.errMsg)) || String(err || '')
	const msg = stripCloudPrefix(raw)
	if (isCloudResourceExhaustedMessage(msg)) {
		return CLOUD_BUSY_HINT
	}
	if (isDevOrDomainNetworkMsg(msg)) {
		return NETWORK_FAIL_HINT
	}
	if (msg.indexOf('timeout') !== -1 || msg.indexOf('超时') !== -1) {
		return '请求超时，请检查网络或稍后重试'
	}
	return msg || NETWORK_FAIL_HINT
}

export { isCloudInCooldown }

/** 用于 uni.showToast，避免把开发环境长文案展示给体验版用户 */
export function toastMessage(errOrMsg, fallback = '操作失败') {
	const raw =
		typeof errOrMsg === 'string'
			? errOrMsg
			: (errOrMsg && (errOrMsg.message || errOrMsg.errMsg)) || ''
	return formatCloudError({ message: raw }) || fallback
}

/**
 * 校验云函数名，防止误用 list / wifi-list
 */
export function assertWifiCloudFunctionName(name) {
	const fn = String(name || '').trim()
	if (!fn) {
		throw new Error('云函数名不能为空')
	}
	if (FORBIDDEN_CLOUD_FUNCTIONS.includes(fn)) {
		console.error('[cloud-config] 检测到禁止的旧云函数名:', fn)
		throw new Error('禁止调用旧云函数 ' + fn + '，请使用 wifi_list')
	}
	if (fn !== WIFI_CLOUD_FUNCTION) {
		console.warn('[cloud-config] 非标准云函数名:', fn, '已强制改为', WIFI_CLOUD_FUNCTION)
	}
	return WIFI_CLOUD_FUNCTION
}
