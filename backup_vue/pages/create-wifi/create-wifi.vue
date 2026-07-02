<template>
	<view class="page-container">
		<custom-navbar title="创建WiFi" :show-back="true" />
		<view class="page-content">
			<view class="hero-card">
				<view class="hero-card__title">创建WiFi码</view>
				<view class="hero-card__desc">生成专属WiFi共享二维码</view>
			</view>

			<view class="card">
				<view class="card__title">WiFi信息</view>
				<input v-model="form.name" class="input-field" placeholder="WiFi名称（SSID）" />
				<input v-model="form.password" class="input-field" password placeholder="WiFi密码" />
				<input v-model="form.shop" class="input-field" placeholder="所属店铺（选填）" />
			</view>

			<view class="card">
				<view class="card__title">共享设置</view>
				<view class="setting-row">
					<text>需要观看广告</text>
					<switch :checked="form.needAd" @change="form.needAd = $event.detail.value" color="#1677ff" />
				</view>
				<view class="setting-row">
					<text>允许陌生人连接</text>
					<switch :checked="form.allowPublic" @change="form.allowPublic = $event.detail.value" color="#1677ff" />
				</view>
			</view>

			<view v-if="generated" class="card qrcode-card">
				<view class="qrcode-placeholder">
					<text class="qrcode-icon">📱</text>
					<text class="qrcode-text">WiFi二维码</text>
				</view>
				<view class="qrcode-name">{{ form.name }}</view>
			</view>

			<button class="btn-primary btn-block" @click="generateWifi">{{ generated ? '保存并分享' : '生成WiFi码' }}</button>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import CustomNavbar from '@/components/custom-navbar/custom-navbar.vue'

const form = ref({
	name: '',
	password: '',
	shop: '',
	needAd: true,
	allowPublic: true
})
const generated = ref(false)

onLoad((options) => {
	if (options.name) form.value.name = decodeURIComponent(options.name)
})

function generateWifi() {
	if (!form.value.name || !form.value.password) {
		uni.showToast({ title: '请填写WiFi名称和密码', icon: 'none' })
		return
	}
	generated.value = true
	uni.showToast({ title: 'WiFi码生成成功', icon: 'success' })
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.setting-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 24rpx 0;
	border-bottom: 1rpx solid $border-color;
	font-size: 28rpx;
	color: $text-primary;

	&:last-child {
		border-bottom: none;
	}
}

.qrcode-card {
	text-align: center;
}

.qrcode-placeholder {
	width: 300rpx;
	height: 300rpx;
	margin: 0 auto;
	background: $bg-input;
	border-radius: $radius-md;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	border: 2rpx dashed $border-color;

	.qrcode-icon {
		font-size: 80rpx;
	}

	.qrcode-text {
		font-size: 24rpx;
		color: $text-secondary;
		margin-top: 12rpx;
	}
}

.qrcode-name {
	font-size: 28rpx;
	color: $text-primary;
	margin-top: 20rpx;
	font-weight: 600;
}
</style>
