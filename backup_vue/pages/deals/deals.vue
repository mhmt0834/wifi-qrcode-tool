<template>
	<view class="page-container">
		<custom-navbar title="优惠活动" />
		<view class="page-content">
			<view class="hero-card">
				<view class="hero-card__title">限时优惠</view>
				<view class="hero-card__desc">连接WiFi享商家专属福利</view>
			</view>

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
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import CustomNavbar from '@/components/custom-navbar/custom-navbar.vue'

const deals = ref([
	{ id: 1, shop: '星巴克咖啡', tag: '新人专享', title: '连接WiFi送中杯美式', desc: '首次连接本店WiFi即可领取', expire: '2026-06-30' },
	{ id: 2, shop: '肯德基', tag: '限时', title: 'WiFi连接满30分钟送蛋挞', desc: '每日限领1次，先到先得', expire: '2026-05-31' },
	{ id: 3, shop: '麦当劳', tag: '热门', title: '周末WiFi专享9折券', desc: '连接WiFi后自动发放至卡包', expire: '2026-07-15' },
	{ id: 4, shop: '瑞幸咖啡', tag: '推荐', title: '免费升杯券', desc: '连接WiFi观看15秒广告即可领取', expire: '2026-06-01' }
])

function onDealClick(item) {
	uni.showToast({ title: '已领取：' + item.title, icon: 'none' })
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

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
