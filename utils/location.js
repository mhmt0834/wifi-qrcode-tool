/**
 * ============================================================================
 * 定位工具（uni-app / 微信小程序）
 * ============================================================================
 */

import { withTimeout } from '@/utils/promise-util.js'

/** 定位失败时的默认坐标（北京天安门） */
const DEFAULT_LOCATION = {
	latitude: 39.908823,
	longitude: 116.397470
}

/** 定位超时（毫秒），避免 await 卡死 */
const LOCATION_TIMEOUT_MS = 5000

/**
 * 获取用户当前位置（GCJ-02）
 * 超时或失败时使用默认坐标，不阻塞页面
 */
export function getUserLocation(options = {}) {
	const { useDefaultOnFail = true, timeout = LOCATION_TIMEOUT_MS } = options

	const locatePromise = new Promise((resolve, reject) => {
		try {
			uni.getLocation({
				type: 'gcj02',
				success: (res) => {
					resolve({
						latitude: res.latitude,
						longitude: res.longitude,
						isDefault: false
					})
				},
				fail: (err) => {
					const msg = (err && err.errMsg) || ''
					if (msg.indexOf('requiredPrivateInfos') !== -1) {
						console.warn(
							'[location] 请在 manifest.json 配置 requiredPrivateInfos: getLocation，已使用默认坐标'
						)
					} else {
						console.warn('[location] 获取定位失败，已使用默认坐标', err)
					}
					if (useDefaultOnFail) {
						resolve({ ...DEFAULT_LOCATION, isDefault: true })
					} else {
						reject(err)
					}
				}
			})
		} catch (err) {
			if (useDefaultOnFail) {
				resolve({ ...DEFAULT_LOCATION, isDefault: true })
			} else {
				reject(err)
			}
		}
	})

	return withTimeout(locatePromise, timeout, '定位超时').catch((err) => {
		console.warn('[location]', err.message)
		if (useDefaultOnFail) {
			return { ...DEFAULT_LOCATION, isDefault: true }
		}
		throw err
	})
}
