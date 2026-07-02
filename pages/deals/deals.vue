<template>
	<view class="page-container">
		<custom-navbar title="优惠活动" />
		<view class="page-content">
			<view class="hero-card">
				<view class="hero-card__title">限时优惠</view>
				<view class="hero-card__desc">连接WiFi享商家专属福利</view>
			</view>

			<view v-if="deals.length === 0" class="empty-state">
				<image class="empty-state__icon" src="/static/tab/deals.png" mode="aspectFit" />
				<view class="empty-state__text">暂无优惠活动，敬请期待</view>
			</view>

			<template v-else>
				<view v-for="item in deals" :key="item.id" class="deal-card" @click="onDealClick(item)">
					<view class="deal-card__header">
						<text class="deal-card__shop">{{ item.shop }}</text>
						<text class="tag">{{ item.tag }}</text>
					</view>
					<view class="deal-card__title">{{ item.title }}</view>
					<view class="deal-card__desc">{{ item.desc }}</view>
					<view class="deal-card__footer">
						<text class="deal-card__expire">有效期至 {{ item.expire }}</text>
						<button class="deal-btn" size="mini">立即领取</button>
					</view>
				</view>
			</template>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import CustomNavbar from '@/components/custom-navbar/custom-navbar.vue'

const deals = ref([])

function onDealClick(item) {
	uni.showToast({ title: '已领取：' + item.title, icon: 'none' })
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.page-content {
	padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
}

.deal-card {
	background: $bg-card;
	border-radius: $radius-md;
	padding: 30rpx;
	margin-top: 24rpx;
	box-shadow: $shadow-card;

	&__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 16rpx;
	}

	&__shop {
		font-size: 26rpx;
		color: $primary-color;
		font-weight: 600;
	}

	&__title {
		font-size: 32rpx;
		font-weight: 600;
		color: $text-primary;
		margin-bottom: 10rpx;
	}

	&__desc {
		font-size: 26rpx;
		color: $text-secondary;
	}

	&__footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 20rpx;
		padding-top: 20rpx;
		border-top: 1rpx solid $border-color;
	}

	&__expire {
		font-size: 22rpx;
		color: $text-placeholder;
	}
}

.deal-btn {
	background: $primary-gradient !important;
	color: #fff !important;
	border-radius: 30rpx !important;
	font-size: 24rpx !important;
	border: none !important;
	margin: 0 !important;
	padding: 0 28rpx !important;
	line-height: 56rpx !important;
}
</style>
