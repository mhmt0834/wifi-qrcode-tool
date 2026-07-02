<template>
	<view class="page-container">
		<custom-navbar title="收益明细" :show-back="true" />
		<view class="page-content">
			<view class="hero-card">
				<view class="hero-card__title">¥{{ totalRevenue }}</view>
				<view class="hero-card__desc">累计商家收益（元）</view>
			</view>

			<view class="summary-grid">
				<view class="summary-item">
					<text class="summary-item__value">¥{{ todayRevenue }}</text>
					<text class="summary-item__label">今日收益</text>
				</view>
				<view class="summary-item">
					<text class="summary-item__value">¥{{ withdrawable }}</text>
					<text class="summary-item__label">可提现</text>
				</view>
				<view class="summary-item">
					<text class="summary-item__value">¥{{ pendingWithdraw }}</text>
					<text class="summary-item__label">提现中</text>
				</view>
			</view>

			<button class="btn-primary btn-block withdraw-btn" :loading="withdrawLoading" :disabled="!canWithdraw" @click="submitWithdraw">
				申请提现
			</button>

			<view class="filter-tabs">
				<view
					v-for="tab in tabs"
					:key="tab"
					:class="['filter-tab', activeTab === tab ? 'filter-tab--active' : '']"
					@click="changeTab(tab)"
				>{{ tab }}</view>
			</view>

			<view v-if="listLoading" class="list-loading">加载中...</view>

			<view v-else-if="revenueList.length === 0" class="empty-state">
				<image class="empty-state__icon" src="/static/icons/benefit-revenue.png" mode="aspectFit" />
				<view class="empty-state__text">暂无收益记录</view>
			</view>

			<view v-else v-for="item in revenueList" :key="item._id" class="revenue-item">
				<view class="revenue-item__left">
					<view class="revenue-item__title">{{ item.title }}</view>
					<view class="revenue-item__time">{{ item.time }}</view>
					<view v-if="item.type !== 'withdraw'" class="revenue-item__meta">
						{{ item.wifiName || 'WiFi' }} · 商家收益已入账
					</view>
					<view v-else class="revenue-item__meta">
						{{ formatWithdrawStatus(item.status) }}
					</view>
				</view>
				<view
					class="revenue-item__amount"
					:class="{ 'revenue-item__amount--withdraw': item.type === 'withdraw' }"
				>
					{{ item.type === 'withdraw' ? '-' : '+' }}¥{{ item.amount }}
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import CustomNavbar from '@/components/custom-navbar/custom-navbar.vue'
import { getMerchantRevenueList, requestMerchantWithdraw } from '@/utils/merchant-db.js'

const totalRevenue = ref('0.00')
const todayRevenue = ref('0.00')
const withdrawable = ref('0.00')
const pendingWithdraw = ref('0.00')
const tabs = ref(['全部', '今日', '本周', '本月'])
const activeTab = ref('全部')
const revenueList = ref([])
const listLoading = ref(false)
const withdrawLoading = ref(false)

const canWithdraw = computed(() => Number(withdrawable.value) > 0 && !withdrawLoading.value)

async function loadRevenue() {
	listLoading.value = true
	try {
		const { total, today, withdrawable: canUse, pendingWithdraw: pending, list } = await getMerchantRevenueList(activeTab.value)
		totalRevenue.value = total
		todayRevenue.value = today
		withdrawable.value = canUse
		pendingWithdraw.value = pending
		revenueList.value = list
	} catch (err) {
		totalRevenue.value = '0.00'
		todayRevenue.value = '0.00'
		withdrawable.value = '0.00'
		pendingWithdraw.value = '0.00'
		revenueList.value = []
	} finally {
		listLoading.value = false
	}
}

function changeTab(tab) {
	activeTab.value = tab
	loadRevenue()
}

function formatWithdrawStatus(status) {
	if (status === 'paid') return '提现已打款'
	if (status === 'rejected') return '提现已驳回'
	return '提现申请处理中'
}

function submitWithdraw() {
	if (!canWithdraw.value) {
		uni.showToast({ title: '暂无可提现收益', icon: 'none' })
		return
	}
	uni.showModal({
		title: '申请提现',
		content: `确认申请提现 ¥${withdrawable.value}？提交后由平台线下审核打款。`,
		success: async (res) => {
			if (!res.confirm) return
			withdrawLoading.value = true
			try {
				await requestMerchantWithdraw(Number(withdrawable.value))
				uni.showToast({ title: '已提交申请', icon: 'success' })
				loadRevenue()
			} catch (err) {
				uni.showToast({ title: err.message || '提交失败', icon: 'none' })
			} finally {
				withdrawLoading.value = false
			}
		}
	})
}

onShow(() => loadRevenue())
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.filter-tabs {
	display: flex;
	gap: 16rpx;
	margin-top: 24rpx;
}

.summary-grid {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 16rpx;
	margin-top: 24rpx;
}

.summary-item {
	background: $bg-card;
	border-radius: $radius-md;
	padding: 22rpx 18rpx;
	text-align: center;
	box-shadow: $shadow-card;

	&__value {
		display: block;
		font-size: 30rpx;
		font-weight: 700;
		color: $primary-color;
	}

	&__label {
		display: block;
		margin-top: 8rpx;
		font-size: 22rpx;
		color: $text-secondary;
	}
}

.withdraw-btn {
	margin-top: 24rpx;
}

.filter-tab {
	padding: 12rpx 28rpx;
	border-radius: 30rpx;
	font-size: 26rpx;
	color: $text-secondary;
	background: $bg-card;

	&--active {
		background: $primary-color;
		color: #fff;
	}
}

.revenue-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	background: $bg-card;
	border-radius: $radius-md;
	padding: 28rpx 30rpx;
	margin-top: 16rpx;
	box-shadow: $shadow-card;

	&__title {
		font-size: 28rpx;
		color: $text-primary;
		font-weight: 500;
	}

	&__time {
		font-size: 22rpx;
		color: $text-placeholder;
		margin-top: 6rpx;
	}

	&__meta {
		font-size: 22rpx;
		color: $text-secondary;
		margin-top: 8rpx;
		line-height: 1.5;
	}

	&__amount {
		font-size: 32rpx;
		font-weight: 700;
		color: #52c41a;

		&--withdraw {
			color: $text-secondary;
		}
	}
}
</style>
