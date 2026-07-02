/**
 * WiFi 二维码分享海报（Canvas 2D）
 */

import { resolveImageLocalPath } from '@/utils/wifi-qr.js'

const POSTER_WIDTH = 600
const POSTER_HEIGHT = 900

function loadCanvasImage(canvas, src) {
	return new Promise((resolve, reject) => {
		const img = canvas.createImage()
		img.onload = () => resolve(img)
		img.onerror = reject
		img.src = src
	})
}

function wrapText(ctx, text, maxWidth) {
	const chars = String(text || '').split('')
	let line = ''
	const lines = []
	chars.forEach((ch) => {
		const test = line + ch
		if (ctx.measureText(test).width > maxWidth && line) {
			lines.push(line)
			line = ch
		} else {
			line = test
		}
	})
	if (line) lines.push(line)
	return lines.length ? lines : ['']
}

/**
 * 生成分享海报临时文件路径
 * @param {object} opts
 * @param {string} opts.wifiName
 * @param {string} opts.shopName
 * @param {string} opts.qrCodeUrl 云存储或本地路径
 * @param {string} [opts.logoPath] 默认 /static/logo.png
 */
export function createWifiSharePoster(opts = {}) {
	const { wifiName = 'WiFi', shopName = '店铺', qrCodeUrl, logoPath = '/static/logo.png' } = opts

	return new Promise((resolve, reject) => {
		const query = uni.createSelectorQuery()
		// 使用离屏 canvas 需页面有 canvas；由页面传入 canvasId
		reject(new Error('请使用 createWifiSharePosterInPage'))
	})
}

/**
 * 在页面 canvas 上绘制并导出海报
 * @param {string} canvasId 页面 canvas 的 id
 * @param {object} opts 同 createWifiSharePoster
 */
export async function createWifiSharePosterInPage(canvasId, opts = {}) {
	const { wifiName = 'WiFi', shopName = '店铺', qrCodeUrl, logoPath = '/static/logo.png' } = opts

	return new Promise((resolve, reject) => {
		uni
			.createSelectorQuery()
			.select(`#${canvasId}`)
			.fields({ node: true, size: true })
			.exec(async (res) => {
				try {
					if (!res || !res[0] || !res[0].node) {
						reject(new Error('Canvas 未就绪'))
						return
					}
					const canvas = res[0].node
					const ctx = canvas.getContext('2d')
					const dpr = uni.getSystemInfoSync().pixelRatio || 2
					canvas.width = POSTER_WIDTH * dpr
					canvas.height = POSTER_HEIGHT * dpr
					ctx.scale(dpr, dpr)

					// 背景
					const grd = ctx.createLinearGradient(0, 0, 0, POSTER_HEIGHT)
					grd.addColorStop(0, '#1a1a1a')
					grd.addColorStop(1, '#0d0d0d')
					ctx.fillStyle = grd
					ctx.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT)

					ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)'
					ctx.lineWidth = 2
					ctx.strokeRect(24, 24, POSTER_WIDTH - 48, POSTER_HEIGHT - 48)

					// Logo
					try {
						const logoImg = await loadCanvasImage(canvas, logoPath)
						const logoSize = 72
						ctx.drawImage(logoImg, (POSTER_WIDTH - logoSize) / 2, 48, logoSize, logoSize)
					} catch (e) {
						console.warn('[wifi-qr-poster] logo 加载失败', e)
					}

					ctx.fillStyle = '#d4af37'
					ctx.font = 'bold 28px sans-serif'
					ctx.textAlign = 'center'
					ctx.fillText('智连WiFi', POSTER_WIDTH / 2, 140)

					ctx.fillStyle = '#ffffff'
					ctx.font = 'bold 32px sans-serif'
					const nameLines = wrapText(ctx, wifiName, POSTER_WIDTH - 80)
					nameLines.forEach((line, i) => {
						ctx.fillText(line, POSTER_WIDTH / 2, 200 + i * 40)
					})

					ctx.fillStyle = '#aaaaaa'
					ctx.font = '24px sans-serif'
					const shopLines = wrapText(ctx, shopName, POSTER_WIDTH - 80)
					const shopStart = 200 + nameLines.length * 40 + 16
					shopLines.forEach((line, i) => {
						ctx.fillText(line, POSTER_WIDTH / 2, shopStart + i * 32)
					})

					// 二维码
					const qrLocal = await resolveImageLocalPath(qrCodeUrl)
					const qrImg = await loadCanvasImage(canvas, qrLocal)
					const qrSize = 320
					const qrY = POSTER_HEIGHT - qrSize - 80
					ctx.fillStyle = '#ffffff'
					ctx.fillRect((POSTER_WIDTH - qrSize - 20) / 2, qrY - 10, qrSize + 20, qrSize + 20)
					ctx.drawImage(qrImg, (POSTER_WIDTH - qrSize) / 2, qrY, qrSize, qrSize)

					ctx.fillStyle = '#888888'
					ctx.font = '20px sans-serif'
					ctx.fillText('扫码连接 WiFi', POSTER_WIDTH / 2, POSTER_HEIGHT - 36)

					uni.canvasToTempFilePath({
						canvas,
						width: POSTER_WIDTH,
						height: POSTER_HEIGHT,
						destWidth: POSTER_WIDTH * dpr,
						destHeight: POSTER_HEIGHT * dpr,
						fileType: 'png',
						success: (r) => resolve(r.tempFilePath),
						fail: reject
					})
				} catch (err) {
					reject(err)
				}
			})
	})
}

/** 分享海报图片 */
export function sharePosterImage(tempFilePath) {
	return new Promise((resolve, reject) => {
		// #ifdef MP-WEIXIN
		if (typeof wx !== 'undefined' && wx.showShareImageMenu) {
			wx.showShareImageMenu({
				path: tempFilePath,
				success: resolve,
				fail: reject
			})
			return
		}
		// #endif
		uni.previewImage({
			urls: [tempFilePath],
			current: tempFilePath,
			success: resolve,
			fail: reject
		})
	})
}
