<template>
	<view class="page-container">
		<custom-navbar title="商家设置" :show-back="true" />
		<view class="page-content">
			<view class="card">
				<view class="card__title">店铺信息</view>
				<view class="form-item">
					<text class="form-label">店铺名称</text>
					<input v-model="form.shopName" class="form-input" placeholder="请输入店铺名称" />
				</view>
				<view class="form-item">
					<text class="form-label">联系电话</text>
					<input v-model="form.phone" class="form-input" placeholder="请输入联系电话" />
				</view>
				<view class="form-item">
					<text class="form-label">店铺地址</text>
					<input v-model="form.address" class="form-input" placeholder="请输入店铺地址" />
				</view>
			</view>

			<view class="card">
				<view class="card__title">WiFi设置</view>
				<view class="setting-row">
					<text>默认需要观看广告</text>
					<switch :checked="form.defaultAd" @change="form.defaultAd = $event.detail.value" color="#1677ff" />
				</view>
				<view class="setting-row">
					<text>连接成功推送优惠</text>
					<switch :checked="form.pushDeal" @change="form.pushDeal = $event.detail.value" color="#1677ff" />
				</view>
				<view class="setting-row">
					<text>收益自动提现</text>
					<switch :checked="form.autoWithdraw" @change="form.autoWithdraw = $event.detail.value" color="#1677ff" />
				</view>
			</view>

			<view class="card">
				<view class="card__title">提现账户</view>
				<view class="form-item">
					<text class="form-label">微信账号</text>
					<input v-model="form.wechat" class="form-input" placeholder="绑定微信收款账号" />
				</view>
			</view>

			<button class="btn-primary btn-block" style="margin-top:30rpx" @click="saveSettings">保存设置</button>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import CustomNavbar from '@/components/custom-navbar/custom-navbar.vue'

const form = ref({
	shopName: '星巴克咖啡（万达店）',
	phone: '13800138000',
	address: '万达广场B1层',
	defaultAd: true,
	pushDeal: true,
	autoWithdraw: false,
	wechat: ''
})

function saveSettings() {
	uni.showToast({ title: '设置已保存', icon: 'success' })
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.form-item {
	padding: 20rpx 0;
	border-bottom: 1rpx solid $border-color;

	&:last-child {
		border-bottom: none;
	}
}

.form-label {
	font-size: 26rpx;
	color: $text-secondary;
	display: block;
	margin-bottom: 12rpx;
}

.form-input {
	height: 72rpx;
	background: $bg-input;
	border-radius: $radius-sm;
	padding: 0 20rpx;
	font-size: 28rpx;
}

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
</style>
