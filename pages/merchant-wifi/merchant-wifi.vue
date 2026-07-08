<template>
	<view class="page-container">
		<custom-navbar title="WiFi管理" :show-back="true" />
		<view class="page-content">
			<view class="hero-card">
				<view class="hero-card__title">WiFi管理</view>
				<view class="hero-card__desc">仅显示归属于当前商家的 WiFi</view>
			</view>

			<view v-if="listLoading" class="list-loading">加载中...</view>

			<view v-else-if="wifiList.length === 0" class="empty-state">
				<image class="empty-state__icon" src="/static/icons/wifi.png" mode="aspectFit" />
				<view class="empty-state__text">暂无 WiFi，请先添加</view>
			</view>

			<view v-for="item in wifiList" :key="item._id" class="wifi-card" @click="goDetail(item)">
				<view class="wifi-card__top">
					<view>
						<view class="wifi-card__name">{{ item.name }}</view>
						<view class="wifi-card__shop">{{ item.shop }}</view>
					</view>
					<text :class="['status-tag', item.status === '在线' ? 'status-tag--on' : 'status-tag--off']">
						{{ item.status }}
					</text>
				</view>
				<view class="wifi-card__meta">
					<text>创建：{{ item.createTimeText }}</text>
					<text class="wifi-card__heat">热度 {{ item.heat }}</text>
				</view>
				<view class="wifi-card__stats">
					<view class="mini-stat">
						<text class="mini-stat__val">{{ item.viewCount }}</text>
						<text class="mini-stat__label">浏览</text>
					</view>
					<view class="mini-stat">
						<text class="mini-stat__val">{{ item.connectCount }}</text>
						<text class="mini-stat__label">连接</text>
					</view>
					<view class="mini-stat">
						<text class="mini-stat__val">{{ item.status }}</text>
						<text class="mini-stat__label">状态</text>
					</view>
					<view class="mini-stat">
						<text class="mini-stat__val">{{ item.heat }}</text>
						<text class="mini-stat__label">热度</text>
					</view>
				</view>
			</view>

			<button v-if="isPlatformAdminUser" class="btn-primary btn-block" style="margin-top:30rpx" @click="goCreate">+ 添加WiFi</button>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { onMounted, onUnmounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import CustomNavbar from '@/components/custom-navbar/custom-navbar.vue'
import { getMerchantWifiList } from '@/utils/merchant-db.js'
import { MERCHANT_REFRESH_EVENT } from '@/utils/cloud-config.js'
import { checkPlatformAdminRole } from '@/utils/admin-db.js'

const wifiList = ref([])
const listLoading = ref(false)
const isPlatformAdminUser = ref(false)

async function loadList() {
	listLoading.value = true
	try {
		const [list, isAdmin] = await Promise.all([
			getMerchantWifiList(),
			checkPlatformAdminRole()
		])
		wifiList.value = list
		isPlatformAdminUser.value = isAdmin
	} catch (err) {
		wifiList.value = []
		isPlatformAdminUser.value = false
	} finally {
		listLoading.value = false
	}
}

function goCreate() {
	if (!isPlatformAdminUser.value) {
		uni.showToast({ title: '仅管理员可创建 WiFi', icon: 'none' })
		return
	}
	uni.navigateTo({ url: '/pages/create-wifi/create-wifi' })
}

function goDetail(item) {
	if (!item || !item._id) return
	uni.navigateTo({
		url: '/pages/wifi-manage-detail/wifi-manage-detail?id=' + encodeURIComponent(item._id)
	})
}

function onMerchantRefresh() {
	loadList()
}

onShow(() => loadList())
onMounted(() => uni.$on(MERCHANT_REFRESH_EVENT, onMerchantRefresh))
onUnmounted(() => uni.$off(MERCHANT_REFRESH_EVENT, onMerchantRefresh))
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.wifi-card {
	background: $bg-card;
	border-radius: $radius-md;
	padding: 30rpx;
	margin-top: 24rpx;
	box-shadow: $shadow-card;

	&__top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
	}

	&__name {
		font-size: 32rpx;
		font-weight: 600;
		color: $text-primary;
	}

	&__shop {
		font-size: 24rpx;
		color: $text-secondary;
		margin-top: 6rpx;
	}

	&__meta {
		display: flex;
		justify-content: space-between;
		margin-top: 16rpx;
		font-size: 24rpx;
		color: $text-secondary;
	}

	&__heat {
		color: $primary-color;
	}

	&__stats {
		display: flex;
		margin-top: 20rpx;
		padding-top: 20rpx;
		border-top: 1rpx solid $border-color;
	}
}

.status-tag {
	font-size: 22rpx;
	padding: 6rpx 16rpx;
	border-radius: 20rpx;

	&--on {
		color: #52c41a;
		background: rgba(82, 196, 26, 0.12);
	}

	&--off {
		color: $text-secondary;
		background: rgba(255, 255, 255, 0.06);
	}
}

.mini-stat {
	flex: 1;
	text-align: center;

	&__val {
		display: block;
		font-size: 32rpx;
		font-weight: 700;
		color: $primary-color;
	}

	&__label {
		display: block;
		font-size: 22rpx;
		color: $text-secondary;
		margin-top: 6rpx;
	}
}
</style>
