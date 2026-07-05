/**
 * 平台管理员后台数据（提现审核）
 */

import { ensureWxSession } from '@/utils/wx-session.js'
import {
	WIFI_CLOUD_FUNCTION,
	WIFI_CLOUD_TIMEOUT_MS,
	assertWifiCloudFunctionName
} from '@/utils/cloud-config.js'
import { withTimeout } from '@/utils/promise-util.js'

const CLOUD_FUNCTION = WIFI_CLOUD_FUNCTION

async function callAdminCloud(data) {
	const functionName = assertWifiCloudFunctionName(CLOUD_FUNCTION)
	const payload = {
		...(data || {}),
		wxCode: await ensureWxSession()
	}
	const res = await withTimeout(
		uniCloud.callFunction({ name: functionName, data: payload }),
		WIFI_CLOUD_TIMEOUT_MS,
		'平台后台请求超时'
	)
	const result = (res && res.result) != null ? res.result : {}
	if (result.code === undefined) {
		return { code: 0, data: result.data != null ? result.data : result, msg: result.msg || 'ok' }
	}
	return result
}

export async function checkPlatformAdminRole() {
	try {
		const result = await callAdminCloud({ action: 'checkPlatformAdmin' })
		return !!(result && result.code === 0 && result.data && result.data.isAdmin)
	} catch (err) {
		return false
	}
}

export async function getAdminWithdrawList(status = 'pending') {
	const result = await callAdminCloud({
		action: 'adminWithdrawList',
		status
	})
	if (!result || result.code !== 0) {
		throw new Error((result && result.msg) || '提现列表加载失败')
	}
	return (result.data && result.data.list) || []
}

export async function auditWithdraw({ withdrawId, accountType = 'merchant', auditAction, auditNote = '' }) {
	const result = await callAdminCloud({
		action: 'adminAuditWithdraw',
		withdrawId,
		accountType,
		auditAction,
		auditNote
	})
	if (!result || result.code !== 0) {
		throw new Error((result && result.msg) || '审核失败')
	}
	return result.data
}

export async function settleRewardedAdRevenue({ settleDate, grossAmount, adUnitId = '' }) {
	const result = await callAdminCloud({
		action: 'adminSettleRewardedAdRevenue',
		settleDate,
		grossAmount,
		adUnitId
	})
	if (!result || result.code !== 0) {
		throw new Error((result && result.msg) || '结算失败')
	}
	return result.data
}

export async function getWifiPrivilegeRequestList(status = 'pending') {
	const result = await callAdminCloud({
		action: 'adminWifiPrivilegeRequestList',
		status
	})
	if (!result || result.code !== 0) {
		throw new Error((result && result.msg) || '特权申请加载失败')
	}
	return (result.data && result.data.list) || []
}

export async function auditWifiPrivilegeRequest({ requestId, auditAction, auditNote = '' }) {
	const result = await callAdminCloud({
		action: 'adminAuditWifiPrivilegeRequest',
		requestId,
		auditAction,
		auditNote
	})
	if (!result || result.code !== 0) {
		throw new Error((result && result.msg) || '特权审核失败')
	}
	return result.data
}
