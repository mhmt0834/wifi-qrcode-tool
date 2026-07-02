<template>
	<view class="page-container">
		<custom-navbar title="商家中心" :show-back="true" />
		<view class="page-content">
			<view class="hero-card">
				<view class="hero-card__title">{{ shopInfo.name }}</view>
				<view class="hero-card__desc">商家管理控制台</view>
			</view>

			<view class="stat-grid">
				<view class="stat-item">
					<view class="stat-item__value">¥{{ stats.revenue }}</view>
					<view class="stat-item__label">今日收益</view>
				</view>
				<view class="stat-item">
					<view class="stat-item__value">{{ stats.connects }}</view>
					<view class="stat-item__label">今日连接</view>
				</view>
				<view class="stat-item">
					<view class="stat-item__value">{{ stats.wifiCount }}</view>
					<view class="stat-item__label">WiFi数量</view>
				</view>
			</view>

			<view class="card menu-card">
				<view class="menu-item" @click="goPage('/pages/merchant-wifi/merchant-wifi')">
					<text class="menu-item__icon">📶</text>
					<text class="menu-item__text">WiFi管理</text>
					<text class="list-item__arrow">›</text>
				</view>
				<view class="menu-item" @click="goPage('/pages/merchant-revenue/merchant-revenue')">
					<text class="menu-item__icon">💰</text>
					<text class="menu-item__text">收益明细</text>
					<text class="list-item__arrow">›</text>
				</view>
				<view class="menu-item" @click="goPage('/pages/merchant-settings/merchant-settings')">
					<text class="menu-item__icon">⚙️</text>
					<text class="menu-item__text">商家设置</text>
					<text class="list-item__arrow">›</text>
				</view>
				<view class="menu-item" @click="goPage('/pages/create-wifi/create-wifi')">
					<text class="menu-item__icon">➕</text>
					<text class="menu-item__text">添加WiFi</text>
					<text class="list-item__arrow">›</text>
				</view>
			</view>

			<view class="card">
				<view class="card__title">最近连接记录</view>
				<view v-for="(item, i) in recentConnects" :key="i" class="record-row">
					<text class="record-time">{{ item.time }}</text>
					<text class="record-wifi">{{ item.wifi }}</text>
					<text class="record-income">+¥{{ item.income }}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import CustomNavbar from '@/components/custom-navbar/custom-navbar.vue'

const shopInfo = ref({ name: '星巴克咖啡（万达店）' })
const stats = ref({ revenue: '128.50', connects: 86, wifiCount: 3 })

const recentConnects = ref([
	{ time: '14:32', wifi: '智连WiFi-001', income: '0.15' },
	{ time: '14:18', wifi: '智连WiFi-001', income: '0.15' },
	{ time: '13:55', wifi: '智连WiFi-002', income: '0.12' },
	{ time: '13:40', wifi: '智连WiFi-001', income: '0.15' }
])

function goPage(url) {
	uni.navigateTo({ url })
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.menu-card {
	padding: 0 30rpx;
	margin-top: 24rpx;
}

.menu-item {
	display: flex;
	align-items: center;
	padding: 32rpx 0;
	border-bottom: 1rpx solid $border-color;

	&:last-child {
		border-bottom: none;
	}

	&__icon {
		font-size: 36rpx;
		margin-right: 20rpx;
	}

	&__text {
		flex: 1;
		font-size: 30rpx;
		color: $text-primary;
	}
}

.record-row {
	display: flex;
	align-items: center;
	padding: 20rpx 0;
	border-bottom: 1rpx solid $border-color;
	font-size: 26rpx;

	&:last-child {
		border-bottom: none;
	}
}

.record-time {
	color: $text-secondary;
	width: 100rpx;
}

.record-wifi {
	flex: 1;
	color: $text-primary;
}

.record-income {
	color: #52c41a;
	font-weight: 600;
}
</style>
