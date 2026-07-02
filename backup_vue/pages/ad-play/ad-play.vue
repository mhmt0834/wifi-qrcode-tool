<template>
	<view class="page-container">
		<custom-navbar title="观看广告" :show-back="true" />
		<view class="page-content">
			<view class="ad-card">
				<view class="ad-placeholder">
					<text class="ad-icon">▶</text>
					<text class="ad-text">广告播放区域</text>
				</view>
				<view class="ad-progress">
					<view class="ad-progress__bar" :style="{ width: progress + '%' }"></view>
				</view>
				<view class="ad-timer">{{ countdown }}秒后自动连接</view>
			</view>

			<view class="card">
				<view class="card__title">即将连接</view>
				<view class="card__desc">{{ wifiName }}</view>
				<view class="card__desc">观看完整广告即可免费连接WiFi</view>
			</view>

			<button v-if="finished" class="btn-primary btn-block" @click="doConnect">立即连接WiFi</button>
			<button v-else class="btn-outline btn-block" disabled>请耐心等待...</button>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import CustomNavbar from '@/components/custom-navbar/custom-navbar.vue'

const wifiName = ref('智连WiFi')
const countdown = ref(15)
const progress = ref(0)
const finished = ref(false)
let timer = null

onLoad((options) => {
	if (options.name) wifiName.value = decodeURIComponent(options.name)
})

onMounted(() => {
	const total = 15
	timer = setInterval(() => {
		countdown.value--
		progress.value = ((total - countdown.value) / total) * 100
		if (countdown.value <= 0) {
			clearInterval(timer)
			finished.value = true
		}
	}, 1000)
})

onUnmounted(() => {
	if (timer) clearInterval(timer)
})

function doConnect() {
	uni.showToast({ title: 'WiFi连接成功', icon: 'success' })
	setTimeout(() => uni.navigateBack({ delta: 2 }), 1500)
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.ad-card {
	background: $bg-card;
	border-radius: $radius-md;
	padding: 30rpx;
	box-shadow: $shadow-card;
}

.ad-placeholder {
	height: 360rpx;
	background: linear-gradient(135deg, #1a1a2e, #16213e);
	border-radius: $radius-md;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;

	.ad-icon {
		font-size: 80rpx;
		color: $primary-light;
	}

	.ad-text {
		color: rgba(255, 255, 255, 0.6);
		font-size: 26rpx;
		margin-top: 16rpx;
	}
}

.ad-progress {
	height: 8rpx;
	background: $bg-input;
	border-radius: 4rpx;
	margin-top: 24rpx;
	overflow: hidden;

	&__bar {
		height: 100%;
		background: $primary-gradient;
		border-radius: 4rpx;
		transition: width 1s linear;
	}
}

.ad-timer {
	text-align: center;
	font-size: 26rpx;
	color: $text-secondary;
	margin-top: 16rpx;
}
</style>
