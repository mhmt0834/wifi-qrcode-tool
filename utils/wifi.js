/**
 * ============================================================================
 * WiFi 自动连接模块（uni.startWifi + uni.connectWifi）
 * ============================================================================
 *
 * 适用平台：uni-app + 微信小程序（MP-WEIXIN）
 *
 * 官方文档：
 * - 微信小程序 startWifi：https://developers.weixin.qq.com/miniprogram/dev/api/device/wifi/wx.startWifi.html
 * - 微信小程序 connectWifi：https://developers.weixin.qq.com/miniprogram/dev/api/device/wifi/wx.connectWifi.html
 * - uni-app 封装：uni.startWifi / uni.connectWifi
 *
 * 连接流程：
 * 1. （Android）申请定位权限 —— 微信连接 WiFi 所需
 * 2. uni.startWifi() —— 初始化 WiFi 模块
 * 3. uni.connectWifi({ SSID, password }) —— 发起连接
 * 4. 成功 → 提示「WiFi连接成功」
 * 5. 失败 → 自动复制密码 + 提示「自动连接失败，请手动连接WiFi」
 *
 * 注意：
 * - iOS 系统限制，小程序内可能无法 programmatic 连接，会走失败兜底逻辑
 * - 微信小程序无「打开系统 WiFi 设置页」官方 API，goToSystemWifiPage 会复制密码并引导用户手动前往
 * ============================================================================
 */

import { withTimeout } from '@/utils/promise-util.js'

/** 连接成功提示文案 */
export const WIFI_CONNECT_SUCCESS_MSG = 'WiFi连接成功'

/** 连接失败提示文案（同时会自动复制密码） */
export const WIFI_CONNECT_FAIL_MSG = '自动连接失败，请手动连接WiFi'

/** WiFi 模块是否已 startWifi 初始化 */
let wifiModuleStarted = false

/** 单次 WiFi API 调用超时（毫秒） */
const WIFI_API_TIMEOUT_MS = 12000

/** 权限弹窗最长等待 */
const PERMISSION_MODAL_TIMEOUT_MS = 30000

/**
 * 将 uni API 回调风格包装为 Promise
 * @param {Function} api uni 接口函数
 * @param {Object} [options={}] 传入 api 的参数
 * @returns {Promise<any>}
 */
function promisifyUni(api, options = {}) {
	return new Promise((resolve, reject) => {
		api({
			...options,
			success: resolve,
			fail: reject
		})
	})
}

/**
 * 复制 WiFi 密码到剪贴板
 * @param {string} password WiFi 密码
 * @param {boolean} [silent=false] 是否静默复制（不弹「已复制」toast）
 * @returns {Promise<void>}
 */
export function copyWifiPassword(password, silent = false) {
	return new Promise((resolve, reject) => {
		uni.setClipboardData({
			data: password,
			success: () => {
				if (!silent) {
					uni.showToast({ title: '密码已复制', icon: 'success' })
				}
				resolve()
			},
			fail: reject
		})
	})
}

/**
 * 申请定位权限（Android 连接 WiFi 时微信要求）
 * @returns {Promise<boolean>} 是否已授权
 */
async function ensureLocationPermission() {
	// #ifdef MP-WEIXIN
	try {
		const setting = await promisifyUni(uni.getSetting)
		if (setting.authSetting && setting.authSetting['scope.userLocation']) {
		 return true
		}

		try {
			await promisifyUni(uni.authorize, { scope: 'scope.userLocation' })
			return true
		} catch {
			const modalPromise = new Promise((resolve) => {
				let settled = false
				const finish = (ok) => {
					if (settled) return
					settled = true
					resolve(!!ok)
				}
				uni.showModal({
					title: '需要位置权限',
					content: '连接 WiFi 需要授权位置信息，请在设置中开启',
					confirmText: '去设置',
					success: (res) => {
						if (res.confirm) {
							uni.openSetting({
								success: (settingRes) => {
									finish(settingRes.authSetting && settingRes.authSetting['scope.userLocation'])
								},
								fail: () => finish(false)
							})
						} else {
							finish(false)
						}
					},
					fail: () => finish(false)
				})
			})
			return await withTimeout(modalPromise, PERMISSION_MODAL_TIMEOUT_MS, '权限授权超时')
		}
	} catch {
		return false
	}
	// #endif

	// #ifndef MP-WEIXIN
	// 非微信端跳过权限检查
	return true
	// #endif
}

/**
 * 初始化 WiFi 模块（uni.startWifi）
 * 全局只需成功调用一次，重复调用会直接返回
 *
 * @returns {Promise<boolean>}
 */
export async function startWifiModule() {
	if (wifiModuleStarted) {
		return true
	}

	// #ifdef MP-WEIXIN
	const hasPermission = await ensureLocationPermission()
	if (!hasPermission) {
		throw new Error('未获得位置权限，无法连接 WiFi')
	}

	await withTimeout(promisifyUni(uni.startWifi), WIFI_API_TIMEOUT_MS, 'WiFi 模块初始化超时')
	wifiModuleStarted = true
	return true
	// #endif

	// #ifndef MP-WEIXIN
	// 非微信端模拟初始化成功，connectWifi 会走模拟逻辑
	wifiModuleStarted = true
	return true
	// #endif
}

/**
 * 调用 uni.connectWifi 连接指定 WiFi
 *
 * @param {Object} params
 * @param {string} params.SSID WiFi 名称（SSID）
 * @param {string} params.password WiFi 密码
 * @returns {Promise<void>}
 */
export async function connectWifiByCredentials({ SSID, password }) {
	if (!SSID) {
		throw new Error('SSID 不能为空')
	}

	// #ifdef MP-WEIXIN
	await startWifiModule()

	// 微信 connectWifi：SSID + password 为必填连接参数
	await withTimeout(
		promisifyUni(uni.connectWifi, {
			SSID,
			password: password || '',
			maunal: false
		}),
		WIFI_API_TIMEOUT_MS,
		'WiFi 连接超时'
	)

	// #endif

	// #ifndef MP-WEIXIN
	throw new Error('当前环境不支持自动连接 WiFi')
	// #endif
}

/**
 * 观看广告后的自动连接入口
 *
 * 成功：toast「WiFi连接成功」
 * 失败：自动复制密码 + toast「自动连接失败，请手动连接WiFi」
 *
 * @param {Object} params
 * @param {string} params.SSID WiFi SSID
 * @param {string} params.password WiFi 密码
 * @returns {Promise<{ success: boolean, error?: any }>}
 */
export async function autoConnectWifi({ SSID, password }) {
	uni.showLoading({ title: '正在连接 WiFi...', mask: true })

	try {
		await connectWifiByCredentials({ SSID, password })
		uni.hideLoading()
		uni.showToast({
			title: WIFI_CONNECT_SUCCESS_MSG,
			icon: 'success',
			duration: 2000
		})
		return { success: true }
	} catch (err) {
		uni.hideLoading()

		// 连接失败：自动复制密码，方便用户手动连接
		try {
			await copyWifiPassword(password, true)
		} catch (copyErr) {
			console.error('[wifi] 复制密码失败', copyErr)
		}

		uni.showToast({
			title: WIFI_CONNECT_FAIL_MSG,
			icon: 'none',
			duration: 3000
		})

		return { success: false, error: err }
	}
}

/**
 * 前往系统 WiFi 页面（最佳努力）
 *
 * 微信小程序无直接打开系统 WLAN 设置 API，因此：
 * 1. 自动复制密码到剪贴板
 * 2. 弹窗引导用户手动进入【设置 → WLAN】
 *
 * App 端（Android）尝试打开系统 WiFi 设置
 *
 * @param {Object} params
 * @param {string} params.SSID WiFi 名称
 * @param {string} params.password WiFi 密码
 */
export async function goToSystemWifiPage({ SSID, password }) {
	// 先复制密码，用户到系统页后可直接粘贴
	try {
		await copyWifiPassword(password, true)
	} catch (err) {
		console.error('[wifi] 复制密码失败', err)
	}

	// #ifdef APP-PLUS
	try {
		if (plus.os.name === 'Android') {
			const main = plus.android.runtimeMainActivity()
			const Intent = plus.android.importClass('android.content.Intent')
			const Settings = plus.android.importClass('android.provider.Settings')
			const intent = new Intent(Settings.ACTION_WIFI_SETTINGS)
			main.startActivity(intent)
			uni.showToast({ title: '请在 WLAN 列表中选择网络', icon: 'none' })
			return
		}
	} catch (err) {
		console.warn('[wifi] 打开系统 WiFi 设置失败', err)
	}
	// #endif

	// 微信小程序 / iOS / 打开失败时：弹窗引导
	uni.showModal({
		title: '去系统 WiFi 页面',
		content: `密码已复制到剪贴板。\n\n请打开手机【设置】→【WLAN】，选择「${SSID}」并粘贴密码完成连接。`,
		confirmText: '我知道了',
		showCancel: false
	})
}

/**
 * 页面卸载时可选择性关闭 WiFi 模块（按需调用）
 */
export function stopWifiModule() {
	// #ifdef MP-WEIXIN
	if (wifiModuleStarted) {
		uni.stopWifi({
			complete: () => {
				wifiModuleStarted = false
			}
		})
	}
	// #endif
}
