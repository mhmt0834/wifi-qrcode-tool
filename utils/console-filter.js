/**
 * 过滤 uni-app / uniCloud 开发框架自带的控制台噪音（非业务逻辑）
 * 无法从 vendor.js 中删除，仅在运行时屏蔽重复提示
 */

const FRAMEWORK_CONSOLE_NOISE = [
	'开发模式下日志通道',
	'不校验合法域名配置',
	'同一网络',
	'日志通道 socket 连接关闭',
	'closeSocket:fail Failed to execute'
]

function messageText(args) {
	return args
		.map((item) => {
			if (typeof item === 'string') return item
			if (item && item.message) return String(item.message)
			if (item && item.errMsg) return String(item.errMsg)
			try {
				return JSON.stringify(item)
			} catch {
				return String(item)
			}
		})
		.join(' ')
}

function shouldSilence(args) {
	const text = messageText(args)
	return FRAMEWORK_CONSOLE_NOISE.some((key) => text.indexOf(key) !== -1)
}

let installed = false

export function installFrameworkConsoleFilter() {
	if (installed || typeof console === 'undefined') return
	installed = true

	;['error', 'warn'].forEach((level) => {
		const raw = console[level]
		if (typeof raw !== 'function') return
		console[level] = function (...args) {
			if (shouldSilence(args)) return
			raw.apply(console, args)
		}
	})
}
