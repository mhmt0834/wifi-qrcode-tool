<template>
	<view class="page-container">
		<custom-navbar title="激励广告结算" :show-back="true" />
		<view class="page-content">
			<view v-if="checking" class="list-loading">加载中...</view>

			<view v-else-if="!isAdmin" class="empty-state">
				<image class="empty-state__icon" src="/static/icons/benefit-revenue.png" mode="aspectFit" />
				<view class="empty-state__text">无管理员权限</view>
			</view>

			<template v-else>
				<view class="hero-card">
					<view class="hero-card__title">激励广告结算</view>
					<view class="hero-card__desc">按有效广告访问次数分配真实收益</view>
				</view>

				<view class="settlement-tip">
					只填写微信流量主后台“激励”广告收入，不要填写全部广告收入。
				</view>

				<view class="card form-card">
					<view class="form-label">结算日期</view>
					<picker mode="date" :value="form.settleDate" @change="onDateChange">
						<view class="picker-field">{{ form.settleDate || '请选择结算日期' }}</view>
					</picker>

					<view class="form-label">真实激励广告收入（元）</view>
					<input
						v-model="form.grossAmount"
						class="input-field"
						type="digit"
						placeholder="例如：1.07"
						placeholder-class="input-placeholder"
					/>

					<view class="form-label">激励广告位 ID</view>
					<input
						v-model="form.adUnitId"
						class="input-field"
						placeholder="默认使用当前激励广告位"
						placeholder-class="input-placeholder"
					/>

					<button class="btn-primary btn-block" :loading="submitting" :disabled="!canSubmit" @click="confirmSubmit">
						确认结算
					</button>
				</view>

				<view v-if="result" class="card result-card">
					<view class="card__title gold-title">结算结果</view>
					<view class="result-row">
						<text class="result-row__label">结算日期</text>
						<text class="result-row__value">{{ result.settleDate }}</text>
					</view>
					<view class="result-row">
						<text class="result-row__label">真实收入</text>
						<text class="result-row__value">¥{{ result.grossAmount }}</text>
					</view>
					<view class="result-row">
						<text class="result-row__label">平台预留</text>
						<text class="result-row__value">¥{{ result.platformAmount }}</text>
					</view>
					<view class="result-row">
						<text class="result-row__label">合伙人总额</text>
						<text class="result-row__value">¥{{ result.agentAmount }}</text>
					</view>
					<view class="result-row">
						<text class="result-row__label">商家总额</text>
						<text class="result-row__value">¥{{ result.merchantAmount }}</text>
					</view>
					<view class="result-row">
						<text class="result-row__label">有效访问</text>
						<text class="result-row__value">{{ result.eligibleCount }} 条</text>
					</view>
					<view class="result-row">
						<text class="result-row__label">已结算</text>
						<text class="result-row__value">{{ result.settledCount }} 条</text>
					</view>
					<view v-if="result.missingRevenueCount" class="result-warning">
						有 {{ result.missingRevenueCount }} 条访问缺少对应收益记录，请人工复核。
					</view>
				</view>
			</template>
		</view>
	</view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import CustomNavbar from '@/components/custom-navbar/custom-navbar.vue'
import { checkPlatformAdminRole, settleRewardedAdRevenue } from '@/utils/admin-db.js'

const DEFAULT_AD_UNIT_ID = 'adunit-21d6d12eb155bd3b'

const checking = ref(true)
const isAdmin = ref(false)
const submitting = ref(false)
const result = ref(null)
const form = reactive({
	settleDate: getDefaultSettleDate(),
	grossAmount: '',
	adUnitId: DEFAULT_AD_UNIT_ID
})

const canSubmit = computed(() => {
	return !!form.settleDate && Number(form.grossAmount) > 0 && !submitting.value
})

function formatDate(date) {
	const y = date.getFullYear()
	const m = String(date.getMonth() + 1).padStart(2, '0')
	const d = String(date.getDate()).padStart(2, '0')
	return `${y}-${m}-${d}`
}

function getDefaultSettleDate() {
	const date = new Date()
	date.setDate(date.getDate() - 1)
	return formatDate(date)
}

function onDateChange(e) {
	form.settleDate = e.detail.value
	result.value = null
}

function confirmSubmit() {
	if (!canSubmit.value) {
		uni.showToast({ title: '请填写结算日期和真实收入', icon: 'none' })
		return
	}
	uni.showModal({
		title: '确认结算',
		content: `将按 ${form.settleDate} 的有效激励广告访问记录分配 ¥${Number(form.grossAmount).toFixed(2)}，确认继续？`,
		success: async (res) => {
			if (!res.confirm) return
			await submitSettlement()
		}
	})
}

async function submitSettlement() {
	submitting.value = true
	result.value = null
	try {
		result.value = await settleRewardedAdRevenue({
			settleDate: form.settleDate,
			grossAmount: Number(form.grossAmount),
			adUnitId: form.adUnitId || DEFAULT_AD_UNIT_ID
		})
		uni.showToast({ title: '结算完成', icon: 'success' })
	} catch (err) {
		uni.showToast({ title: err.message || '结算失败', icon: 'none' })
	} finally {
		submitting.value = false
	}
}

onShow(async () => {
	checking.value = true
	try {
		isAdmin.value = await checkPlatformAdminRole()
	} finally {
		checking.value = false
	}
})
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.settlement-tip {
	margin-bottom: 20rpx;
	padding: 18rpx 22rpx;
	border: 1rpx solid rgba(212, 175, 55, 0.35);
	border-radius: $radius-sm;
	background: rgba(212, 175, 55, 0.08);
	color: $gold;
	font-size: 24rpx;
	line-height: 1.5;
}

.form-card {
	.form-label {
		margin: 24rpx 0 12rpx;
		font-size: 26rpx;
		color: $text-secondary;

		&:first-child {
			margin-top: 0;
		}
	}

	.input-field {
		margin-bottom: 0;
	}

	.btn-primary {
		margin-top: 34rpx;
	}
}

.picker-field {
	height: 88rpx;
	line-height: 88rpx;
	padding: 0 28rpx;
	border: 1rpx solid rgba(255, 255, 255, 0.1);
	border-radius: $radius-md;
	background: rgba(255, 255, 255, 0.05);
	color: $text-primary;
	font-size: 28rpx;
}

.result-card {
	.result-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20rpx;
		padding: 14rpx 0;
		border-bottom: 1rpx solid $border-color;

		&:last-child {
			border-bottom: none;
		}

		&__label {
			font-size: 24rpx;
			color: $text-secondary;
		}

		&__value {
			font-size: 26rpx;
			color: $text-primary;
			font-weight: 600;
		}
	}
}

.result-warning {
	margin-top: 20rpx;
	padding: 16rpx 20rpx;
	border-radius: $radius-sm;
	background: rgba(255, 171, 0, 0.12);
	color: $warning;
	font-size: 24rpx;
	line-height: 1.5;
}
</style>
