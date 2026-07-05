<template>

	<view class="page-container">

		<custom-navbar title="商家中心" :show-back="true" />

		<view class="page-content">

			<view v-if="pageLoading" class="list-loading">加载中...</view>

			<template v-else>

				<view class="hero-card">

					<view class="hero-card__title">{{ shopInfo.name }}</view>

					<view class="hero-card__desc">商家管理控制台</view>

				</view>



				<view class="stat-grid">

					<view class="stat-item">

						<view class="stat-item__value">¥{{ stats.todayRevenue }}</view>

						<view class="stat-item__label">今日已结算</view>

					</view>

					<view class="stat-item">

						<view class="stat-item__value">¥{{ stats.totalRevenue }}</view>

						<view class="stat-item__label">累计已结算</view>

					</view>

					<view class="stat-item">

						<view class="stat-item__value">¥{{ stats.withdrawable }}</view>

						<view class="stat-item__label">可提现</view>

					</view>

					<view class="stat-item stat-item--highlight">

						<view class="stat-item__value">{{ stats.todayConnectCount }}</view>

						<view class="stat-item__label">今日连接</view>

					</view>

				</view>

				<view class="stat-grid stat-grid--secondary">

					<view class="stat-item">

						<view class="stat-item__value">{{ stats.wifiCount }}</view>

						<view class="stat-item__label">WiFi总数</view>

					</view>

					<view class="stat-item">

						<view class="stat-item__value">{{ stats.viewCount }}</view>

						<view class="stat-item__label">浏览次数</view>

					</view>

					<view class="stat-item">

						<view class="stat-item__value">{{ stats.connectCount }}</view>

						<view class="stat-item__label">累计连接</view>

					</view>

					<view class="stat-item">

						<view class="stat-item__value">{{ stats.pendingWithdraw }}</view>

						<view class="stat-item__label">提现中</view>

					</view>

				</view>



				<view class="card menu-card">

					<view class="menu-item" @click="goPage('/pages/merchant-wifi/merchant-wifi')">

						<image class="menu-item__icon" src="/static/icons/benefit-wifi.png" mode="aspectFit" />

						<text class="menu-item__text">WiFi管理</text>

						<text class="list-item__arrow">›</text>

					</view>

					<view class="menu-item" @click="goPage('/pages/merchant-revenue/merchant-revenue')">

						<image class="menu-item__icon" src="/static/icons/benefit-revenue.png" mode="aspectFit" />

						<text class="menu-item__text">收益明细</text>

						<text class="list-item__arrow">›</text>

					</view>

					<view class="menu-item" @click="goPage('/pages/merchant-settings/merchant-settings')">

						<image class="menu-item__icon" src="/static/icons/shop.png" mode="aspectFit" />

						<text class="menu-item__text">商家设置</text>

						<text class="list-item__arrow">›</text>

					</view>

					<view v-if="isPlatformAdminUser" class="menu-item" @click="goPage('/pages/create-wifi/create-wifi')">

						<image class="menu-item__icon" src="/static/icons/create.png" mode="aspectFit" />

						<text class="menu-item__text">添加WiFi</text>

						<text class="list-item__arrow">›</text>

					</view>

				</view>



				<view class="card">

					<view class="card__title">最近连接记录</view>

					<view v-if="recentConnects.length === 0" class="empty-inline">暂无连接记录</view>

					<view v-for="(item, i) in recentConnects" :key="item._id || i" class="record-row">

						<text class="record-time">{{ item.time }}</text>

						<text class="record-wifi">{{ item.wifi }}</text>

						<text class="record-income">预估+¥{{ item.income }}</text>

					</view>

				</view>

			</template>

		</view>

	</view>

</template>



<script setup>

import { ref } from 'vue'

import { onMounted, onUnmounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'

import CustomNavbar from '@/components/custom-navbar/custom-navbar.vue'

import {

	getMerchantDashboardStats,

	getMerchantRecentConnects,

	getMerchantProfile

} from '@/utils/merchant-db.js'

import { getStoredUser } from '@/utils/user-store.js'

import { MERCHANT_REFRESH_EVENT } from '@/utils/cloud-config.js'
import { checkPlatformAdminRole } from '@/utils/admin-db.js'



const pageLoading = ref(false)

const shopInfo = ref({ name: '我的店铺' })

const stats = ref({
	wifiCount: 0,
	viewCount: 0,
	connectCount: 0,
	todayNew: 0,
	todayConnectCount: 0,
	todayRevenue: '0.00',
	totalRevenue: '0.00',
	withdrawable: '0.00',
	pendingWithdraw: '0.00'
})

const recentConnects = ref([])
const isPlatformAdminUser = ref(false)



async function loadDashboard() {

	pageLoading.value = true

	try {

		const [profile, statData, connects] = await Promise.all([

			getMerchantProfile(),

			getMerchantDashboardStats(),

			getMerchantRecentConnects(20)

		])
		isPlatformAdminUser.value = await checkPlatformAdminRole()

		const user = getStoredUser()

		shopInfo.value.name =

			(profile && profile.shopName) ||

			(user && user.nickname) ||

			'我的店铺'

		stats.value = statData

		recentConnects.value = connects

	} catch (err) {
		uni.showToast({ title: '加载失败', icon: 'none' })

	} finally {

		pageLoading.value = false

	}

}



function goPage(url) {

	uni.navigateTo({ url })

}



function onMerchantRefresh() {

	loadDashboard()

}



onShow(() => {

	loadDashboard()

})



onMounted(() => {
	uni.$on(MERCHANT_REFRESH_EVENT, onMerchantRefresh)
})

onUnmounted(() => {
	uni.$off(MERCHANT_REFRESH_EVENT, onMerchantRefresh)
})

</script>



<style lang="scss" scoped>

@import '@/styles/theme.scss';



.menu-card {

	padding: 0 30rpx;

	margin-top: 24rpx;

}

.stat-grid--secondary {
	margin-top: 16rpx;
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

		width: 36rpx;

		height: 36rpx;

		margin-right: 20rpx;

		flex-shrink: 0;

	}



	&__text {

		flex: 1;

		font-size: 30rpx;

		color: $text-primary;

	}

}



.empty-inline {

	padding: 24rpx 0;

	font-size: 26rpx;

	color: $text-secondary;

	text-align: center;

}



.record-row {

	display: flex;

	align-items: center;

	padding: 20rpx 0;

	border-bottom: 1rpx solid $border-color;

	font-size: 26rpx;



	&:last-child {

		border-bottom: none;

	}

}



.record-time {

	color: $text-secondary;

	width: 100rpx;

}



.record-wifi {

	flex: 1;

	color: $text-primary;

}



.record-income {

	color: #52c41a;

	font-weight: 600;

}

</style>

