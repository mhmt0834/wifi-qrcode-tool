/**
 * 福利中心数据（uniCloud 云函数 wifi_list）
 */

import { ensureWxSession } from '@/utils/wx-session.js'
import {
	WIFI_CLOUD_FUNCTION,
	WIFI_CLOUD_TIMEOUT_MS,
	assertWifiCloudFunctionName
} from '@/utils/cloud-config.js'
import { withTimeout } from '@/utils/promise-util.js'

const CLOUD_FUNCTION = WIFI_CLOUD_FUNCTION

async function callBenefitCloud(data) {
	const functionName = assertWifiCloudFunctionName(CLOUD_FUNCTION)
	const payload = {
		...(data || {}),
		wxCode: await ensureWxSession()
	}
	const res = await withTimeout(
		uniCloud.callFunction({ name: functionName, data: payload }),
		WIFI_CLOUD_TIMEOUT_MS,
		'福利数据请求超时'
	)
	const result = (res && res.result) != null ? res.result : {}
	if (result.code === undefined) {
		return { code: 0, data: result.data != null ? result.data : result, msg: result.msg || 'ok' }
	}
	return result
}

export async function getWifiFreeStatus() {
	const result = await callBenefitCloud({ action: 'getWifiFreeStatus' })
	if (!result || result.code !== 0) {
		throw new Error((result && result.msg) || '状态获取失败')
	}
	return result.data
}

export async function recordWifiFreeAdWatch(ticket) {
	const result = await callBenefitCloud({
		action: 'recordWifiFreeAdWatch',
		ticket
	})
	if (!result || result.code !== 0) {
		throw new Error((result && result.msg) || '观看记录失败')
	}
	return result.data
}

export async function getWifiAdFreePrivilege() {
	const result = await callBenefitCloud({ action: 'getWifiAdFreePrivilege' })
	if (!result || result.code !== 0) {
		return { active: false }
	}
	return result.data || { active: false }
}
