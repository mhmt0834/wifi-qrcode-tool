<template>
	<view class="page-container">
		<custom-navbar title="收益明细" :show-back="true" />
		<view class="page-content">
			<view class="hero-card">
				<view class="hero-card__title">¥{{ totalRevenue }}</view>
				<view class="hero-card__desc">累计总收益（元）</view>
			</view>

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
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import CustomNavbar from '@/components/custom-navbar/custom-navbar.vue'
import { getMerchantRevenueList } from '@/utils/merchant-db.js'

const totalRevenue = ref('0.00')
const tabs = ref(['全部', '今日', '本周', '本月'])
const activeTab = ref('全部')
const revenueList = ref([])
const listLoading = ref(false)

async function loadRevenue() {
	listLoading.value = true
	try {
		const { total, list } = await getMerchantRevenueList(activeTab.value)
		totalRevenue.value = total
		revenueList.value = list
	} catch (err) {
		totalRevenue.value = '0.00'
		revenueList.value = []
	} finally {
		listLoading.value = false
	}
}

function changeTab(tab) {
	activeTab.value = tab
	loadRevenue()
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
