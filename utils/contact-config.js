/**
 * 联系我们 · 统一配置（修改联系方式仅改本文件）
 */

/** 服务说明：问题反馈 / 建议 / BUG / 商务 */
export const CONTACT_PURPOSES = [
	{
		icon: '/static/icons/benefit-target.png',
		title: '问题反馈',
		desc: '使用中遇到问题，欢迎随时反馈'
	},
	{
		icon: '/static/icons/benefit-chart.png',
		title: '功能建议',
		desc: '有好的想法？帮助我们做得更好'
	},
	{
		icon: '/static/icons/benefit-wifi.png',
		title: 'BUG提交',
		desc: '发现异常请描述场景，便于快速修复'
	},
	{
		icon: '/static/icons/shop.png',
		title: '商务合作',
		desc: '商户入驻、平台推广、渠道合作'
	}
]

export const CONTACT_INFO = {
	wechat1: {
		label: '客服微信1',
		value: 'mhmt0834'
	},
	wechat2: {
		label: '客服微信2',
		value: ''
	},
	phone1: {
		label: '联系电话1',
		value: '19190990834'
	},
	phone2: {
		label: '联系电话2',
		value: '18509039385'
	},
	serviceTime: '每日 9:00 - 23:00（9点到23点）'
}

/** 微信条目（固定展示两条，无值时页面显示「暂无」） */
export function getWechatList() {
	return [CONTACT_INFO.wechat1, CONTACT_INFO.wechat2]
}

/** 电话条目 */
export function getPhoneList() {
	return [CONTACT_INFO.phone1, CONTACT_INFO.phone2]
}
