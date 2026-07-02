<template>
	<view class="page-container">
		<custom-navbar title="智连WiFi" />
		<view class="page-content">
			<view class="hero-card">
				<view class="hero-card__title">智连WiFi</view>
				<view class="hero-card__desc">WiFi共享平台 · 让生活连接更简单</view>
			</view>

			<view class="card">
				<view class="card__title">快速创建WiFi码</view>
				<input v-model="wifiName" class="input-field" placeholder="请输入WiFi名称" />
				<input v-model="wifiPassword" class="input-field" password placeholder="请输入WiFi密码" />
				<button class="btn-primary btn-block" @click="createWifi">一键生成WiFi码</button>
			</view>

			<view class="card">
				<view class="card__title">附近共享WiFi</view>
				<view class="card__desc">观看广告后可快速连接</view>
				<view
					v-for="item in wifiList"
					:key="item.id"
					class="list-item"
					@click="goDetail(item)"
				>
					<view class="list-item__icon">📶</view>
					<view class="list-item__info">
						<view class="list-item__title">{{ item.name }}</view>
						<view class="list-item__desc">{{ item.shop }} · {{ item.distance }}</view>
					</view>
					<text class="tag">免费</text>
					<text class="list-item__arrow">›</text>
				</view>
			</view>

			<view class="quick-grid">
				<view class="quick-item" @click="goPage('/pages/create-wifi/create-wifi')">
					<text class="quick-item__icon">➕</text>
					<text class="quick-item__text">创建WiFi</text>
				</view>
				<view class="quick-item" @click="goPage('/pages/my-wifi/my-wifi')">
					<text class="quick-item__icon">📋</text>
					<text class="quick-item__text">我的WiFi</text>
				</view>
				<view class="quick-item" @click="goPage('/pages/merchant-join/merchant-join')">
					<text class="quick-item__icon">🏪</text>
					<text class="quick-item__text">商家入驻</text>
				</view>
				<view class="quick-item" @click="switchTab('/pages/nearby/nearby')">
					<text class="quick-item__icon">📍</text>
					<text class="quick-item__text">附近WiFi</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import CustomNavbar from '@/components/custom-navbar/custom-navbar.vue'

const wifiName = ref('')
const wifiPassword = ref('')

const wifiList = ref([
	{ id: 1, name: '智连WiFi-001', shop: '星巴克咖啡', distance: '120m' },
	{ id: 2, name: '智连WiFi-002', shop: '肯德基', distance: '350m' },
	{ id: 3, name: '智连WiFi-003', shop: '麦当劳', distance: '520m' }
])

function createWifi() {
	if (!wifiName.value || !wifiPassword.value) {
		uni.showToast({ title: '请输入WiFi信息', icon: 'none' })
		return
	}
	uni.navigateTo({ url: '/pages/create-wifi/create-wifi?name=' + encodeURIComponent(wifiName.value) })
}

function goDetail(item) {
	uni.navigateTo({ url: '/pages/wifi-detail/wifi-detail?id=' + item.id + '&name=' + encodeURIComponent(item.name) })
}

function goPage(url) {
	uni.navigateTo({ url })
}

function switchTab(url) {
	uni.switchTab({ url })
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.quick-grid {
	display: flex;
	flex-wrap: wrap;
	gap: 20rpx;
	margin-top: 24rpx;

	.quick-item {
		width: calc(50% - 10rpx);
		background: $bg-card;
		border-radius: $radius-md;
		padding: 32rpx;
		display: flex;
		align-items: center;
		box-shadow: $shadow-card;

		&__icon {
			font-size: 40rpx;
			margin-right: 16rpx;
		}

		&__text {
			font-size: 28rpx;
			color: $text-primary;
			font-weight: 500;
		}
	}
}
</style>
