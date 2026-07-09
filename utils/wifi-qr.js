/**
 * WiFi 二维码与公开详情（云函数 wifi_list）
 */

import { ensureWxSession } from '@/utils/wx-session.js'
import {
	WIFI_CLOUD_FUNCTION,
	WIFI_CLOUD_TIMEOUT_MS,
	assertWifiCloudFunctionName,
	formatCloudError
} from '@/utils/cloud-config.js'
import { withTimeout } from '@/utils/promise-util.js'

const CLOUD_FUNCTION = WIFI_CLOUD_FUNCTION
const IMAGE_DOWNLOAD_TIMEOUT_MS = 15000
const SAVE_ALBUM_TIMEOUT_MS = 15000

function withLocalTimeout(promise, ms, message) {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error(message)), ms)
		promise
			.then((res) => {
				clearTimeout(timer)
				resolve(res)
			})
			.catch((err) => {
				clearTimeout(timer)
				reject(err)
			})
	})
}

async function callWifiQrCloud(data, needWx = false) {
	const functionName = assertWifiCloudFunctionName(CLOUD_FUNCTION)
	const payload = { ...(data || {}) }
	if (needWx) {
		payload.wxCode = await ensureWxSession()
	}
	const res = await withTimeout(
		uniCloud.callFunction({ name: functionName, data: payload }),
		WIFI_CLOUD_TIMEOUT_MS,
		'请求超时'
	)
	const result = (res && res.result) != null ? res.result : {}
	if (result.code === undefined) {
		return { code: 0, data: result.data != null ? result.data : result, msg: result.msg || 'ok' }
	}
	return result
}

export function mapWifiPublicDetail(data) {
	if (!data) return null
	return {
		_id: data._id,
		name: data.wifiName || '',
		shop: data.shopName || '',
		intro: data.intro || '',
		tags: data.tags || '',
		promoVideoUrl: data.promoVideoUrl || '',
		promoVideoStatus: data.promoVideoStatus || '未配置',
		address: data.address || '',
		signal: data.signal || '强',
		status: data.status || '在线',
		viewCount: data.viewCount || 0,
		connectCount: data.connectCount || 0,
		heat: data.heat != null ? data.heat : 0
	}
}

/**
 * 扫码/详情页公开信息（不含密码）
 * @returns {{ status: 'ok', data: object } | { status: 'not_found' } | { status: 'error', message: string }}
 */
export async function getWifiPublicDetail(id) {
	if (!id) {
		return { status: 'not_found' }
	}
	try {
		const result = await callWifiQrCloud({ action: 'getWifiPublicDetail', id })
		if (!result) {
			return { status: 'error', message: '网络异常，请稍后重试' }
		}
		if (result.code === 404) {
			return { status: 'not_found' }
		}
		if (result.code !== 0 || !result.data) {
			const msg = (result && result.msg) || ''
			if (result.code === 404 || /不存在|已删除|已下线/i.test(msg)) {
				return { status: 'not_found' }
			}
			return { status: 'error', message: msg || '加载失败，请稍后重试' }
		}
		const data = mapWifiPublicDetail(result.data)
		if (!data || !data._id) {
			return { status: 'not_found' }
		}
		return { status: 'ok', data }
	} catch (err) {
		const msg = (err && err.message) || ''
		if (/不存在|已删除|已下线|404/i.test(msg)) {
			return { status: 'not_found' }
		}
		return { status: 'error', message: '网络异常，请稍后重试' }
	}
}

/** 观看广告后获取连接凭证（仅云库读取密码） */
export async function getWifiConnectCredential(id) {
	const result = await callWifiQrCloud({ action: 'getWifiConnectCredential', id })
	if (!result || result.code !== 0) {
		throw new Error((result && result.msg) || '无法获取连接信息')
	}
	return result.data || { wifiName: '', wifiPassword: '' }
}

/** 生成小程序码并写入 qrCodeUrl */
export async function generateWifiQrCode(id) {
	const result = await callWifiQrCloud({ action: 'generateWifiQrCode', id }, true)
	if (!result || result.code !== 0) {
		throw new Error((result && result.msg) || formatCloudError(null) || '生成失败')
	}
	return result.data
}

/** 解析扫码 scene / 页面参数中的 wifiId */
export function resolveWifiIdFromOptions(options = {}) {
	if (options.id) return String(options.id)
	if (options.wifiId) return String(options.wifiId)
	if (options.scene) {
		try {
			return decodeURIComponent(String(options.scene))
		} catch (e) {
			return String(options.scene)
		}
	}
	return ''
}

/**
 * 从 getTempFileURL 结果解析可展示的 https 地址（供 <image> 使用）
 */
function pickTempFileUrlFromResult(res, fileId) {
	const list = (res && res.fileList) || []
	const item = list.find((row) => row.fileID === fileId) || list[0]
	if (!item) {
		throw new Error('getTempFileURL 无返回')
	}
	const code = item.code
	if (code !== undefined && code !== 0 && code !== '0' && String(code) !== 'SUCCESS') {
		throw new Error(item.message || item.errMsg || '临时链接获取失败')
	}
	const tempUrl = item.tempFileURL || item.download_url || ''
	if (!tempUrl || !/^https?:\/\//i.test(tempUrl)) {
		throw new Error('临时链接为空')
	}
	return tempUrl
}

/**
 * cloud:// / https → 页面展示用地址（优先 https，体验版/开发版均可直接显示）
 */
export function resolveQrImageDisplayUrl(url) {
	return new Promise((resolve, reject) => {
		const raw = String(url || '').trim()
		if (!raw) {
			reject(new Error('图片地址为空'))
			return
		}
		if (/^https?:\/\//i.test(raw)) {
			resolve(raw)
			return
		}
		if (raw.indexOf('cloud://') !== 0) {
			resolve(raw)
			return
		}
		if (typeof uniCloud === 'undefined' || !uniCloud.getTempFileURL) {
			reject(new Error('uniCloud 未初始化，无法读取云存储图片'))
			return
		}
		uniCloud.getTempFileURL({
			fileList: [raw],
			success: (res) => {
				try {
					resolve(pickTempFileUrlFromResult(res, raw))
				} catch (err) {
					reject(err)
				}
			},
			fail: (err) => reject(err)
		})
	})
}

/**
 * 云存储 fileID / https 转为本地临时路径（保存相册、Canvas 等）
 */
export async function resolveImageLocalPath(url) {
	const displayUrl = await resolveQrImageDisplayUrl(url)
	if (/^https?:\/\//i.test(displayUrl)) {
		return await withLocalTimeout(new Promise((resolve, reject) => {
			uni.downloadFile({
				url: displayUrl,
				success: (res) => resolve(res.tempFilePath),
				fail: reject
			})
		}), IMAGE_DOWNLOAD_TIMEOUT_MS, '二维码图片下载超时，请稍后重试')
	}
	return displayUrl
}

/** 保存图片到相册 */
export function ensureWritePhotosAlbumPermission() {
	return new Promise((resolve, reject) => {
		// #ifdef MP-WEIXIN
		uni.getSetting({
			success: (res) => {
				const authSetting = (res && res.authSetting) || {}
				if (authSetting['scope.writePhotosAlbum']) {
					resolve()
					return
				}
				uni.authorize({
					scope: 'scope.writePhotosAlbum',
					success: resolve,
					fail: reject
				})
			},
			fail: reject
		})
		// #endif
		// #ifndef MP-WEIXIN
		resolve()
		// #endif
	})
}

export async function saveImageToAlbum(filePath) {
	await ensureWritePhotosAlbumPermission()
	await withLocalTimeout(new Promise((resolve, reject) => {
		uni.saveImageToPhotosAlbum({
			filePath,
			success: resolve,
			fail: reject
		})
	}), SAVE_ALBUM_TIMEOUT_MS, '保存到相册超时，请稍后重试')
}

export async function saveQrCodeToAlbum(qrCodeUrl) {
	const localPath = await resolveImageLocalPath(qrCodeUrl)
	await saveImageToAlbum(localPath)
}

export function isAlbumPermissionDenied(err) {
	const msg = (err && (err.errMsg || err.message)) || ''
	return /auth deny|authorize:fail|permission denied|deny/i.test(msg)
}

export function isAlbumPrivacyUndeclared(err) {
	const msg = (err && (err.errMsg || err.message)) || ''
	return /api scope.*not.*declared|privacy agreement|隐私/i.test(msg)
}
