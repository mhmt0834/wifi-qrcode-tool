<template>
	<view class="page-container">
		<custom-navbar title="我的WiFi" :show-back="true" />
		<view class="page-content">
			<view class="hero-card">
				<view class="hero-card__title">我的WiFi</view>
				<view class="hero-card__desc">管理您创建的WiFi共享码</view>
			</view>

			<view v-if="wifiList.length === 0" class="empty-state">
				<view class="empty-state__icon">📶</view>
				<view class="empty-state__text">暂无WiFi，快去创建一个吧</view>
				<button class="btn-primary" style="margin-top:30rpx" @click="goCreate">创建WiFi</button>
			</view>

			<view v-for="item in wifiList" :key="item.id" class="wifi-card">
				<view class="wifi-card__header">
					<text class="wifi-card__name">{{ item.name }}</text>
					<text :class="['tag', item.status === '在线' ? 'tag-success' : '']">{{ item.status }}</text>
				</view>
				<view class="wifi-card__info">连接次数：{{ item.connects }} · 创建时间：{{ item.createTime }}</view>
				<view class="wifi-card__actions">
					<button class="action-btn" size="mini" @click="showQrcode(item)">查看二维码</button>
					<button class="action-btn action-btn--outline" size="mini" @click="editWifi(item)">编辑</button>
				</view>
			</view>

			<button v-if="wifiList.length > 0" class="btn-primary btn-block" style="margin-top:30rpx" @click="goCreate">+ 创建新WiFi</button>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import CustomNavbar from '@/components/custom-navbar/custom-navbar.vue'

const wifiList = ref([
	{ id: 1, name: '我的店铺WiFi', status: '在线', connects: 156, createTime: '2026-03-15' },
	{ id: 2, name: '办公室WiFi', status: '在线', connects: 42, createTime: '2026-04-01' },
	{ id: 3, name: '家庭WiFi', status: '离线', connects: 8, createTime: '2026-05-10' }
])

function goCreate() {
	uni.navigateTo({ url: '/pages/create-wifi/create-wifi' })
}

function showQrcode(item) {
	uni.showToast({ title: '二维码：' + item.name, icon: 'none' })
}

function editWifi(item) {
	uni.navigateTo({ url: '/pages/create-wifi/create-wifi?name=' + encodeURIComponent(item.name) })
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

	&__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	&__name {
		font-size: 32rpx;
		font-weight: 600;
		color: $text-primary;
	}

	&__info {
		font-size: 24rpx;
		color: $text-secondary;
		margin-top: 12rpx;
	}

	&__actions {
		display: flex;
		gap: 16rpx;
		margin-top: 20rpx;
	}
}

.action-btn {
	background: $primary-gradient !important;
	color: #fff !important;
	border-radius: 30rpx !important;
	font-size: 24rpx !important;
	border: none !important;
	margin: 0 !important;

	&--outline {
		background: transparent !important;
		color: $primary-color !important;
		border: 2rpx solid $primary-color !important;
	}
}
</style>
