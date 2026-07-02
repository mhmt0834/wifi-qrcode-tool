<template>
	<view class="page-container">
		<custom-navbar title="附近WiFi" />
		<view class="page-content">
			<view class="hero-card">
				<view class="hero-card__title">附近WiFi</view>
				<view class="hero-card__desc">发现周边免费共享网络</view>
			</view>

			<view class="search-bar">
				<text class="search-icon">🔍</text>
				<input v-model="keyword" class="search-input" placeholder="搜索店铺或WiFi名称" />
			</view>

			<view v-if="filteredList.length === 0" class="empty-state">
				<view class="empty-state__icon">📡</view>
				<view class="empty-state__text">附近暂无共享WiFi</view>
			</view>

			<view v-for="item in filteredList" :key="item.id" class="list-item" @click="goDetail(item)">
				<view class="list-item__icon">📶</view>
				<view class="list-item__info">
					<view class="list-item__title">{{ item.name }}</view>
					<view class="list-item__desc">{{ item.shop }} · {{ item.distance }} · {{ item.users }}人连接</view>
				</view>
				<text class="tag tag-success">在线</text>
				<text class="list-item__arrow">›</text>
			</view>
		</view>
	</view>
</template>

<script setup>
	import {
		ref,
		computed
	} from 'vue'
	import CustomNavbar from '@/components/custom-navbar/custom-navbar.vue'

	const keyword = ref('')

	const wifiList = ref([{
			id: 1,
			name: '智连WiFi-001',
			shop: '星巴克咖啡',
			distance: '120m',
			users: 28
		},
		{
			id: 2,
			name: '智连WiFi-002',
			shop: '肯德基',
			distance: '350m',
			users: 15
		},
		{
			id: 3,
			name: '智连WiFi-003',
			shop: '麦当劳',
			distance: '520m',
			users: 42
		},
		{
			id: 4,
			name: '智连WiFi-004',
			shop: '瑞幸咖啡',
			distance: '680m',
			users: 9
		},
		{
			id: 5,
			name: '智连WiFi-005',
			shop: '全家便利店',
			distance: '800m',
			users: 6
		}
	])

	const filteredList = computed(() => {
		if (!keyword.value) return wifiList.value
		const kw = keyword.value.toLowerCase()
		return wifiList.value.filter(
			item => item.name.toLowerCase().includes(kw) || item.shop.toLowerCase().includes(kw)
		)
	})

	function goDetail(item) {
		uni.navigateTo({
			url: '/pages/wifi-detail/wifi-detail?id=' + item.id + '&name=' + encodeURIComponent(item.name)
		})
	}
</script>

<style lang="scss" scoped>
	@import '@/styles/theme.scss';

	.search-bar {
		display: flex;
		align-items: center;
		background: $bg-card;
		border-radius: $radius-md;
		padding: 0 24rpx;
		height: 80rpx;
		margin-top: 24rpx;
		box-shadow: $shadow-card;

		.search-icon {
			font-size: 32rpx;
			margin-right: 16rpx;
		}

		.search-input {
			flex: 1;
			font-size: 28rpx;
			height: 80rpx;
		}
	}
</style>