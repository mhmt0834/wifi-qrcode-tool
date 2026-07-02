<template>
	<view class="page-container">
		<custom-navbar title="WiFi管理" :show-back="true" />
		<view class="page-content">
			<view class="hero-card">
				<view class="hero-card__title">WiFi管理</view>
				<view class="hero-card__desc">管理店铺所有共享WiFi</view>
			</view>

			<view v-for="item in wifiList" :key="item.id" class="wifi-card">
				<view class="wifi-card__top">
					<view>
						<view class="wifi-card__name">{{ item.name }}</view>
						<view class="wifi-card__ssid">SSID: {{ item.ssid }}</view>
					</view>
					<switch :checked="item.enabled" @change="toggleWifi(item)" color="#1677ff" />
				</view>
				<view class="wifi-card__stats">
					<view class="mini-stat">
						<text class="mini-stat__val">{{ item.todayConnects }}</text>
						<text class="mini-stat__label">今日连接</text>
					</view>
					<view class="mini-stat">
						<text class="mini-stat__val">{{ item.totalConnects }}</text>
						<text class="mini-stat__label">总连接</text>
					</view>
					<view class="mini-stat">
						<text class="mini-stat__val">¥{{ item.revenue }}</text>
						<text class="mini-stat__label">总收益</text>
					</view>
				</view>
			</view>

			<button class="btn-primary btn-block" style="margin-top:30rpx" @click="goCreate">+ 添加WiFi</button>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import CustomNavbar from '@/components/custom-navbar/custom-navbar.vue'

const wifiList = ref([
	{ id: 1, name: '大厅WiFi', ssid: 'Shop-WiFi-01', enabled: true, todayConnects: 45, totalConnects: 1280, revenue: '192.00' },
	{ id: 2, name: '包间WiFi', ssid: 'Shop-WiFi-02', enabled: true, todayConnects: 28, totalConnects: 560, revenue: '84.00' },
	{ id: 3, name: '员工WiFi', ssid: 'Shop-WiFi-Staff', enabled: false, todayConnects: 0, totalConnects: 120, revenue: '18.00' }
])

function toggleWifi(item) {
	item.enabled = !item.enabled
	uni.showToast({ title: item.enabled ? '已启用' : '已禁用', icon: 'none' })
}

function goCreate() {
	uni.navigateTo({ url: '/pages/create-wifi/create-wifi' })
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.wifi-card {
	background: $bg-card;
	border-radius: $radius-md;
	padding: 30rpx;
	margin-top: 24rpx;
	box-shadow: $shadow-card;

	&__top {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	&__name {
		font-size: 32rpx;
		font-weight: 600;
		color: $text-primary;
	}

	&__ssid {
		font-size: 24rpx;
		color: $text-secondary;
		margin-top: 6rpx;
	}

	&__stats {
		display: flex;
		margin-top: 24rpx;
		padding-top: 24rpx;
		border-top: 1rpx solid $border-color;
	}
}

.mini-stat {
	flex: 1;
	text-align: center;

	&__val {
		display: block;
		font-size: 32rpx;
		font-weight: 700;
		color: $primary-color;
	}

	&__label {
		display: block;
		font-size: 22rpx;
		color: $text-secondary;
		margin-top: 6rpx;
	}
}
</style>
