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
					@click="activeTab = tab"
				>{{ tab }}</view>
			</view>

			<view v-for="item in revenueList" :key="item.id" class="revenue-item">
				<view class="revenue-item__left">
					<view class="revenue-item__title">{{ item.title }}</view>
					<view class="revenue-item__time">{{ item.time }}</view>
				</view>
				<view class="revenue-item__amount">+¥{{ item.amount }}</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import CustomNavbar from '@/components/custom-navbar/custom-navbar.vue'

const totalRevenue = ref('1,286.50')
const tabs = ref(['全部', '今日', '本周', '本月'])
const activeTab = ref('全部')

const revenueList = ref([
	{ id: 1, title: 'WiFi广告收益', time: '2026-05-24 14:32', amount: '0.15' },
	{ id: 2, title: 'WiFi广告收益', time: '2026-05-24 14:18', amount: '0.15' },
	{ id: 3, title: 'WiFi广告收益', time: '2026-05-24 13:55', amount: '0.12' },
	{ id: 4, title: 'WiFi广告收益', time: '2026-05-24 13:40', amount: '0.15' },
	{ id: 5, title: 'WiFi广告收益', time: '2026-05-24 12:20', amount: '0.15' },
	{ id: 6, title: '提现', time: '2026-05-23 18:00', amount: '100.00' }
])
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
	}
}
</style>
