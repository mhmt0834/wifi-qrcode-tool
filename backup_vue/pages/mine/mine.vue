<template>
	<view class="page-container">
		<custom-navbar title="我的" />
		<view class="page-content">
			<view class="user-card" @click="goLogin">
				<view class="user-avatar">{{ isLogin ? '👤' : '🔑' }}</view>
				<view class="user-info">
					<view class="user-name">{{ isLogin ? userInfo.nickname : '点击登录' }}</view>
					<view class="user-desc">{{ isLogin ? userInfo.phone : '登录后享受更多服务' }}</view>
				</view>
				<text class="list-item__arrow">›</text>
			</view>

			<view class="stat-grid">
				<view class="stat-item">
					<view class="stat-item__value">{{ stats.connectCount }}</view>
					<view class="stat-item__label">连接次数</view>
				</view>
				<view class="stat-item">
					<view class="stat-item__value">{{ stats.wifiCount }}</view>
					<view class="stat-item__label">我的WiFi</view>
				</view>
				<view class="stat-item">
					<view class="stat-item__value">{{ stats.dealCount }}</view>
					<view class="stat-item__label">优惠券</view>
				</view>
			</view>

			<view class="card menu-card">
				<view class="menu-item" @click="goPage('/pages/my-wifi/my-wifi')">
					<text class="menu-item__icon">📶</text>
					<text class="menu-item__text">我的WiFi</text>
					<text class="list-item__arrow">›</text>
				</view>
				<view class="menu-item" @click="goPage('/pages/create-wifi/create-wifi')">
					<text class="menu-item__icon">➕</text>
					<text class="menu-item__text">创建WiFi码</text>
					<text class="list-item__arrow">›</text>
				</view>
				<view class="menu-item" @click="goPage('/pages/merchant-join/merchant-join')">
					<text class="menu-item__icon">🏪</text>
					<text class="menu-item__text">商家入驻</text>
					<text class="list-item__arrow">›</text>
				</view>
				<view class="menu-item" @click="goPage('/pages/merchant-dashboard/merchant-dashboard')">
					<text class="menu-item__icon">📊</text>
					<text class="menu-item__text">商家中心</text>
					<text class="list-item__arrow">›</text>
				</view>
			</view>

			<view class="card menu-card">
				<view class="menu-item">
					<text class="menu-item__icon">⚙️</text>
					<text class="menu-item__text">设置</text>
					<text class="list-item__arrow">›</text>
				</view>
				<view class="menu-item">
					<text class="menu-item__icon">❓</text>
					<text class="menu-item__text">帮助与反馈</text>
					<text class="list-item__arrow">›</text>
				</view>
				<view class="menu-item">
					<text class="menu-item__icon">ℹ️</text>
					<text class="menu-item__text">关于智连WiFi</text>
					<text class="list-item__arrow">›</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import CustomNavbar from '@/components/custom-navbar/custom-navbar.vue'

const isLogin = ref(false)
const userInfo = ref({ nickname: 'WiFi用户', phone: '138****8888' })
const stats = ref({ connectCount: 12, wifiCount: 3, dealCount: 5 })

function goLogin() {
	if (!isLogin.value) {
		uni.navigateTo({ url: '/pages/login/login' })
	}
}

function goPage(url) {
	uni.navigateTo({ url })
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.user-card {
	display: flex;
	align-items: center;
	background: $primary-gradient;
	border-radius: $radius-lg;
	padding: 40rpx 30rpx;
	box-shadow: $shadow-btn;

	.user-avatar {
		width: 100rpx;
		height: 100rpx;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 48rpx;
		margin-right: 24rpx;
	}

	.user-info {
		flex: 1;
	}

	.user-name {
		font-size: 36rpx;
		font-weight: 600;
		color: #fff;
	}

	.user-desc {
		font-size: 26rpx;
		color: rgba(255, 255, 255, 0.8);
		margin-top: 8rpx;
	}

	.list-item__arrow {
		color: rgba(255, 255, 255, 0.6);
	}
}

.menu-card {
	padding: 0 30rpx;
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
</style>
