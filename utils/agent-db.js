/**
 * 代理后台数据（uniCloud 云函数 wifi_list）
 */

import { ensureWxSession } from '@/utils/wx-session.js'
import {
	WIFI_CLOUD_FUNCTION,
	WIFI_CLOUD_TIMEOUT_MS,
	assertWifiCloudFunctionName
} from '@/utils/cloud-config.js'
import { withTimeout } from '@/utils/promise-util.js'

const CLOUD_FUNCTION = WIFI_CLOUD_FUNCTION

async function callAgentCloud(data) {
	const functionName = assertWifiCloudFunctionName(CLOUD_FUNCTION)
	const payload = {
		...(data || {}),
		wxCode: await ensureWxSession()
	}
	const res = await withTimeout(
		uniCloud.callFunction({ name: functionName, data: payload }),
		WIFI_CLOUD_TIMEOUT_MS,
		'代理数据请求超时'
	)
	const result = (res && res.result) != null ? res.result : {}
	if (result.code === undefined) {
		return { code: 0, data: result.data != null ? result.data : result, msg: result.msg || 'ok' }
	}
	return result
}

export async function getAgentProfile() {
	try {
		const result = await callAgentCloud({ action: 'getAgentProfile' })
		if (!result || result.code !== 0) return null
		return result.data || null
	} catch (err) {
		return null
	}
}

export async function saveAgentProfile(profile) {
	const result = await callAgentCloud({
		action: 'saveAgentProfile',
		...profile
	})
	if (!result || result.code !== 0) {
		throw new Error((result && result.msg) || '保存失败')
	}
	return result.data
}

export async function getAgentDashboardStats() {
	try {
		const result = await callAgentCloud({ action: 'agentStats' })
		if (!result || result.code !== 0) return emptyAgentStats()
		return { ...emptyAgentStats(), ...(result.data || {}) }
	} catch (err) {
		return emptyAgentStats()
	}
}

function emptyAgentStats() {
	return {
		wifiCount: 0,
		merchantCount: 0,
		connectCount: 0,
		todayConnectCount: 0,
		todayRevenue: '0.00',
		totalRevenue: '0.00',
		withdrawable: '0.00',
		pendingWithdraw: '0.00'
	}
}

export async function getAgentWifiList() {
	try {
		const result = await callAgentCloud({ action: 'agentWifiList' })
		if (!result || result.code !== 0) return []
		return result.data || []
	} catch (err) {
		return []
	}
}

export async function getAgentRevenueList(range = '全部') {
	try {
		const result = await callAgentCloud({ action: 'agentRevenue', range })
		if (!result || result.code !== 0) return emptyAgentRevenue()
		return { ...emptyAgentRevenue(), ...(result.data || {}) }
	} catch (err) {
		return emptyAgentRevenue()
	}
}

function emptyAgentRevenue() {
	return {
		total: '0.00',
		today: '0.00',
		withdrawable: '0.00',
		pendingWithdraw: '0.00',
		list: []
	}
}

export async function requestAgentWithdraw(amount) {
	const result = await callAgentCloud({
		action: 'agentWithdrawRequest',
		amount
	})
	if (!result || result.code !== 0) {
		throw new Error((result && result.msg) || '提现申请失败')
	}
	return result.data
}
