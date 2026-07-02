/**
 * 微信小程序运行环境（develop / trial / release）
 * 保留此文件：避免旧编译缓存仍 require 本模块导致【我的】页白屏
 */

export function getMiniProgramEnvVersion() {
	try {
		const info = uni.getAccountInfoSync()
		return (info.miniProgram && info.miniProgram.envVersion) || ''
	} catch (e) {
		return ''
	}
}

export function isDevelopMiniProgram() {
	return getMiniProgramEnvVersion() === 'develop'
}
