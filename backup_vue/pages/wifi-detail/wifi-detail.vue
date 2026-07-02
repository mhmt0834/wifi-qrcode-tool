<template>
	<view class="page-container">
		<custom-navbar title="WiFi详情" :show-back="true" />
		<view class="page-content">
			<view class="hero-card">
				<view class="hero-card__title">{{ wifiName }}</view>
				<view class="hero-card__desc">{{ shopName }} · 免费共享</view>
			</view>

			<view class="card">
				<view class="info-row">
					<text class="info-label">信号强度</text>
					<text class="info-value">强</text>
				</view>
				<view class="info-row">
					<text class="info-label">连接人数</text>
					<text class="info-value">28人</text>
				</view>
				<view class="info-row">
					<text class="info-label">距离</text>
					<text class="info-value">120m</text>
				</view>
				<view class="info-row">
					<text class="info-label">连接方式</text>
					<text class="info-value">观看广告后连接</text>
				</view>
			</view>

			<view class="card">
				<view class="card__title">商家信息</view>
				<view class="card__desc">星巴克咖啡（万达广场店）</view>
				<view class="card__desc">营业时间：07:00 - 22:00</view>
			</view>

			<button class="btn-primary btn-block connect-btn" @click="connectWifi">观看广告连接WiFi</button>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import CustomNavbar from '@/components/custom-navbar/custom-navbar.vue'

const wifiName = ref('智连WiFi')
const shopName = ref('附近商家')

onLoad((options) => {
	if (options.name) wifiName.value = decodeURIComponent(options.name)
	if (options.id) shopName.value = '店铺 #' + options.id
})

function connectWifi() {
	uni.navigateTo({ url: '/pages/ad-play/ad-play?name=' + encodeURIComponent(wifiName.value) })
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.info-row {
	display: flex;
	justify-content: space-between;
	padding: 20rpx 0;
	border-bottom: 1rpx solid $border-color;

	&:last-child {
		border-bottom: none;
	}
}

.info-label {
	font-size: 28rpx;
	color: $text-secondary;
}

.info-value {
	font-size: 28rpx;
	color: $text-primary;
	font-weight: 500;
}

.connect-btn {
	margin-top: 40rpx;
}
</style>
