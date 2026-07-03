<template>

	<view class="page-container">

		<custom-navbar title="我的WiFi" :show-back="true" />

		<view class="page-content">

			<view class="hero-card">

				<view class="hero-card__title">我的WiFi</view>

				<view class="hero-card__desc">管理您创建并保存到云数据库的 WiFi</view>

			</view>



			<view v-if="listLoading" class="list-loading">加载中...</view>



			<view v-else-if="wifiList.length === 0" class="empty-state">

				<image class="empty-state__icon" src="/static/icons/wifi.png" mode="aspectFit" />

				<view class="empty-state__text">暂无WiFi，快去创建一个吧</view>

				<button v-if="isPlatformAdminUser" class="btn-primary" style="margin-top:30rpx" @click="goCreate">创建WiFi</button>

			</view>



			<view

				v-for="item in wifiList"

				:key="item._id"

				class="wifi-card"

				@click="goDetail(item)"

			>

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

					<text>创建：{{ formatTime(item.createTime) }}</text>

					<text class="wifi-card__heat">热度 {{ item.heat }}</text>

				</view>

				<view class="wifi-card__stats">

					<view class="mini-stat">

						<text class="mini-stat__val">{{ item.viewCount }}</text>

						<text class="mini-stat__label">浏览量</text>

					</view>

					<view class="mini-stat">

						<text class="mini-stat__val">{{ item.connectCount }}</text>

						<text class="mini-stat__label">连接量</text>

					</view>

				</view>

				<text class="wifi-card__arrow">›</text>

			</view>



			<button v-if="wifiList.length > 0 && isPlatformAdminUser" class="btn-primary btn-block" style="margin-top:30rpx" @click="goCreate">

				+ 创建新WiFi

			</button>

		</view>

	</view>

</template>



<script setup>

import { ref } from 'vue'

import { onMounted, onUnmounted } from 'vue'

import { onShow } from '@dcloudio/uni-app'

import CustomNavbar from '@/components/custom-navbar/custom-navbar.vue'

import { getMyWifiList } from '@/utils/wifi-db.js'

import { MY_WIFI_REFRESH_EVENT } from '@/utils/cloud-config.js'
import { checkPlatformAdminRole } from '@/utils/admin-db.js'



const wifiList = ref([])

const listLoading = ref(false)
const isPlatformAdminUser = ref(false)

let myWifiLoaded = false

let myWifiLastAt = 0

const MY_WIFI_THROTTLE_MS = 3000



async function loadMyWifi(force = false) {

	if (listLoading.value) return

	const now = Date.now()

	if (!force && myWifiLoaded && now - myWifiLastAt < MY_WIFI_THROTTLE_MS) {

		return

	}



	listLoading.value = true

	try {

		wifiList.value = await getMyWifiList()

		myWifiLoaded = true

		myWifiLastAt = now

	} catch (err) {
		uni.showToast({ title: err.message || '加载失败', icon: 'none' })

		wifiList.value = []

	} finally {

		listLoading.value = false

	}

}



function formatTime(ts) {

	if (!ts) return '--'

	const d = new Date(ts)

	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

}



function goCreate() {
	if (!isPlatformAdminUser.value) {
		uni.showToast({ title: '仅管理员可创建 WiFi', icon: 'none' })
		return
	}

	uni.navigateTo({ url: '/pages/create-wifi/create-wifi' })

}



function goDetail(item) {

	uni.navigateTo({

		url: '/pages/wifi-manage-detail/wifi-manage-detail?id=' + encodeURIComponent(item._id)

	})

}



function onMyWifiRefresh() {

	myWifiLoaded = false

	loadMyWifi(true)

}



onShow(() => {
	loadMyWifi(false)
	checkPlatformAdminRole().then((isAdmin) => {
		isPlatformAdminUser.value = isAdmin
	})
})

onMounted(() => uni.$on(MY_WIFI_REFRESH_EVENT, onMyWifiRefresh))

onUnmounted(() => uni.$off(MY_WIFI_REFRESH_EVENT, onMyWifiRefresh))

</script>



<style lang="scss" scoped>

@import '@/styles/theme.scss';



.list-loading {

	padding: 60rpx 0;

	text-align: center;

	color: $text-secondary;

}



.wifi-card {

	background: $bg-card;

	border-radius: $radius-md;

	padding: 30rpx;

	margin-top: 24rpx;

	box-shadow: $shadow-card;

	position: relative;



	&__top {

		display: flex;

		align-items: flex-start;

		justify-content: space-between;

		padding-right: 40rpx;

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



	&__arrow {

		position: absolute;

		right: 24rpx;

		top: 50%;

		transform: translateY(-50%);

		font-size: 36rpx;

		color: $text-placeholder;

	}

}



.status-tag {

	font-size: 22rpx;

	padding: 6rpx 16rpx;

	border-radius: 20rpx;

	flex-shrink: 0;



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

