/**
 * Promise 超时工具（防止微信小程序 async 链长时间挂起）
 */

export function withTimeout(promise, ms, message = '操作超时') {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			reject(new Error(message))
		}, ms)
		Promise.resolve(promise).then(
			(val) => {
				clearTimeout(timer)
				resolve(val)
			},
			(err) => {
				clearTimeout(timer)
				reject(err)
			}
		)
	})
}
