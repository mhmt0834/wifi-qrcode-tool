<template>
	<view class="page-container">
		<custom-navbar title="代理中心" :show-back="true" />
		<view class="page-content">
			<view v-if="pageLoading" class="list-loading">加载中...</view>

			<template v-else>
				<view v-if="!profile" class="empty-state">
					<image class="empty-state__icon" src="/static/icons/benefit-revenue.png" mode="aspectFit" />
					<view class="empty-state__text">请先完成代理入驻</view>
					<button class="btn-primary btn-block empty-btn" @click="goJoin">去入驻</button>
				</view>

				<template v-else>
					<view class="hero-card">
						<view class="hero-card__title">{{ profile.name || '代理' }}</view>
						<view class="hero-card__desc">{{ profile.city || '城市代理' }}</view>
					</view>

					<view class="stat-grid">
						<view class="stat-item stat-item--highlight">
							<view class="stat-item__value">¥{{ stats.todayRevenue }}</view>
							<view class="stat-item__label">今日收益</view>
						</view>
						<view class="stat-item">
							<view class="stat-item__value">¥{{ stats.totalRevenue }}</view>
							<view class="stat-item__label">累计收益</view>
						</view>
						<view class="stat-item">
							<view class="stat-item__value">¥{{ stats.withdrawable }}</view>
							<view class="stat-item__label">可提现</view>
						</view>
						<view class="stat-item">
							<view class="stat-item__value">{{ stats.todayConnectCount }}</view>
							<view class="stat-item__label">今日连接</view>
						</view>
					</view>

					<view class="stat-grid stat-grid--secondary">
						<view class="stat-item">
							<view class="stat-item__value">{{ stats.merchantCount }}</view>
							<view class="stat-item__label">商家数</view>
						</view>
						<view class="stat-item">
							<view class="stat-item__value">{{ stats.wifiCount }}</view>
							<view class="stat-item__label">WiFi数</view>
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
						<view class="menu-item" @click="goPage('/pages/agent-revenue/agent-revenue')">
							<image class="menu-item__icon" src="/static/icons/benefit-revenue.png" mode="aspectFit" />
							<text class="menu-item__text">代理收益</text>
							<text class="list-item__arrow">›</text>
						</view>
						<view class="menu-item" @click="goUpload">
							<image class="menu-item__icon" src="/static/icons/create.png" mode="aspectFit" />
							<text class="menu-item__text">上传商家 WiFi</text>
							<text class="list-item__arrow">›</text>
						</view>
						<view class="menu-item" @click="goJoin">
							<image class="menu-item__icon" src="/static/icons/shop.png" mode="aspectFit" />
							<text class="menu-item__text">编辑代理资料</text>
							<text class="list-item__arrow">›</text>
						</view>
					</view>

					<view class="card">
						<view class="card__title">名下 WiFi</view>
						<view v-if="wifiList.length === 0" class="empty-inline">暂无 WiFi</view>
						<view v-for="item in wifiList" :key="item._id" class="wifi-row">
							<view class="wifi-row__main">
								<view class="wifi-row__name">{{ item.name || '未命名 WiFi' }}</view>
								<view class="wifi-row__shop">{{ item.shop || '未填写店铺' }}</view>
							</view>
							<view class="wifi-row__stat">
								<text>{{ item.connectCount }}</text>
								<text>连接</text>
							</view>
						</view>
					</view>
				</template>
			</template>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import CustomNavbar from '@/components/custom-navbar/custom-navbar.vue'
import { getAgentDashboardStats, getAgentProfile, getAgentWifiList } from '@/utils/agent-db.js'

const pageLoading = ref(false)
const profile = ref(null)
const stats = ref({
	wifiCount: 0,
	merchantCount: 0,
	connectCount: 0,
	todayConnectCount: 0,
	todayRevenue: '0.00',
	totalRevenue: '0.00',
	withdrawable: '0.00',
	pendingWithdraw: '0.00'
})
const wifiList = ref([])

async function loadDashboard() {
	pageLoading.value = true
	try {
		const [profileData, statData, list] = await Promise.all([
			getAgentProfile(),
			getAgentDashboardStats(),
			getAgentWifiList()
		])
		profile.value = profileData
		stats.value = { ...stats.value, ...statData }
		wifiList.value = list
	} finally {
		pageLoading.value = false
	}
}

function goPage(url) {
	uni.navigateTo({ url })
}

function goUpload() {
	uni.switchTab({ url: '/pages/upload/index' })
}

function goJoin() {
	uni.navigateTo({ url: '/pages/agent-join/agent-join' })
}

onShow(() => loadDashboard())
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.stat-grid--secondary {
	margin-top: 16rpx;
}

.menu-card {
	padding: 0 30rpx;
	margin-top: 24rpx;
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

.empty-btn {
	margin-top: 24rpx;
}

.empty-inline {
	padding: 24rpx 0;
	font-size: 26rpx;
	color: $text-secondary;
	text-align: center;
}

.wifi-row {
	display: flex;
	align-items: center;
	gap: 20rpx;
	padding: 22rpx 0;
	border-bottom: 1rpx solid $border-color;

	&:last-child {
		border-bottom: none;
	}

	&__main {
		flex: 1;
		min-width: 0;
	}

	&__name {
		font-size: 28rpx;
		font-weight: 600;
		color: $text-primary;
	}

	&__shop {
		margin-top: 6rpx;
		font-size: 24rpx;
		color: $text-secondary;
	}

	&__stat {
		min-width: 96rpx;
		text-align: right;

		text {
			display: block;
			font-size: 22rpx;
			color: $text-secondary;

			&:first-child {
				font-size: 30rpx;
				font-weight: 700;
				color: $gold;
			}
		}
	}
}
</style>
