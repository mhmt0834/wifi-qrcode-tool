<template>
	<view class="page-container">
		<custom-navbar title="福利中心" />
		<view class="page-content">
			<view class="hero-card">
				<view class="hero-card__title">福利中心</view>
				<view class="hero-card__desc">完成指定任务，领取平台权益</view>
			</view>

			<view class="wifi-free-card">
				<view class="wifi-free-card__head">
					<view class="wifi-free-card__icon-wrap">
						<image class="wifi-free-card__icon" src="/static/icons/benefit-wifi.png" mode="aspectFit" />
					</view>
					<view class="wifi-free-card__title-wrap">
						<view class="wifi-free-card__title">WiFi自由</view>
						<view class="wifi-free-card__desc">实现 WiFi 自由，获取密码免广告连接</view>
					</view>
				</view>

				<view class="rule-box">
					<view class="rule-box__line">该福利功能已暂停</view>
					<view class="rule-box__line">当前获取 WiFi 密码以商家宣传视频为准</view>
				</view>

				<view v-if="activePrivilegeText" class="privilege-banner">
					{{ activePrivilegeText }}
				</view>

				<view class="progress-block">
					<view class="progress-block__top">
						<text>1个月体验卡</text>
						<text>{{ watchCount }}/{{ monthlyRequiredCount }}</text>
					</view>
					<view class="progress-bar">
						<view class="progress-bar__inner" :style="{ width: monthlyProgress + '%' }" />
					</view>
					<view v-if="monthlyRequestText" class="request-status">{{ monthlyRequestText }}</view>
				</view>

				<view class="progress-block">
					<view class="progress-block__top">
						<text>长期免广告特权</text>
						<text>{{ watchCount }}/{{ permanentRequiredCount }}</text>
					</view>
					<view class="progress-bar">
						<view class="progress-bar__inner progress-bar__inner--gold" :style="{ width: permanentProgress + '%' }" />
					</view>
					<view v-if="permanentRequestText" class="request-status">{{ permanentRequestText }}</view>
				</view>

				<button
					class="btn-primary btn-block benefit-btn"
					:disabled="buttonDisabled"
				>
					{{ buttonText }}
				</button>
			</view>
		</view>
	</view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import CustomNavbar from '@/components/custom-navbar/custom-navbar.vue'
import { getWifiFreeStatus } from '@/utils/benefit-db.js'

const watchCount = ref(0)
const monthlyRequiredCount = ref(8)
const permanentRequiredCount = ref(18)
const activePrivilege = ref(null)
const monthlyRequestStatus = ref('')
const permanentRequestStatus = ref('')

const monthlyProgress = computed(() => {
	return Math.min(100, Math.round((watchCount.value / monthlyRequiredCount.value) * 100))
})

const permanentProgress = computed(() => {
	return Math.min(100, Math.round((watchCount.value / permanentRequiredCount.value) * 100))
})

const activePrivilegeText = computed(() => {
	const item = activePrivilege.value
	if (!item) return ''
	if (item.level === 'permanent') return '你已拥有长期免广告特权，获取 WiFi 密码无需观看广告'
	if (item.expireDate) return `你已拥有 1 个月免广告体验卡，有效期至 ${item.expireDate}`
	return '你已拥有 1 个月免广告体验卡'
})

const monthlyRequestText = computed(() => {
	if (monthlyRequestStatus.value === 'pending') return '1个月体验卡申请已提交，等待管理员审核'
	if (monthlyRequestStatus.value === 'approved') return '1个月体验卡已通过'
	return ''
})

const permanentRequestText = computed(() => {
	if (permanentRequestStatus.value === 'pending') return '长期免广告特权申请已提交，等待管理员审核'
	if (permanentRequestStatus.value === 'approved') return '长期免广告特权已通过'
	return ''
})

const buttonDisabled = computed(() => {
	return true
})

const buttonText = computed(() => {
	return '功能已暂停'
})

function applyStatus(data = {}) {
	watchCount.value = Number(data.watchCount) || 0
	monthlyRequiredCount.value = Number(data.monthlyRequiredCount) || 8
	permanentRequiredCount.value = Number(data.permanentRequiredCount) || 18
	activePrivilege.value = data.activePrivilege || null
	monthlyRequestStatus.value = data.monthlyRequestStatus || ''
	permanentRequestStatus.value = data.permanentRequestStatus || ''
}

async function loadStatus() {
	try {
		applyStatus(await getWifiFreeStatus())
	} catch (err) {
		uni.showToast({ title: err.message || '福利状态加载失败', icon: 'none' })
	}
}

onShow(() => {
	loadStatus()
})
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.page-content {
	padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
}

.wifi-free-card {
	background: $bg-card;
	border: 1rpx solid rgba(212, 175, 55, 0.28);
	border-radius: $radius-md;
	padding: 30rpx;
	box-shadow: $shadow-card;

	&__head {
		display: flex;
		align-items: center;
		gap: 20rpx;
	}

	&__icon-wrap {
		width: 88rpx;
		height: 88rpx;
		border-radius: 24rpx;
		background: rgba(212, 175, 55, 0.12);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	&__icon {
		width: 54rpx;
		height: 54rpx;
	}

	&__title-wrap {
		flex: 1;
		min-width: 0;
	}

	&__title {
		font-size: 34rpx;
		font-weight: 700;
		color: $gold;
	}

	&__desc {
		margin-top: 8rpx;
		font-size: 24rpx;
		color: $text-secondary;
		line-height: 1.45;
	}
}

.rule-box {
	margin-top: 26rpx;
	padding: 22rpx 24rpx;
	border-radius: $radius-sm;
	background: rgba(255, 255, 255, 0.05);

	&__line {
		font-size: 24rpx;
		line-height: 1.7;
		color: $text-secondary;
	}
}

.privilege-banner {
	margin-top: 22rpx;
	padding: 18rpx 22rpx;
	border-radius: $radius-sm;
	background: rgba(0, 200, 83, 0.12);
	color: #63d471;
	font-size: 24rpx;
	line-height: 1.5;
}

.progress-block {
	margin-top: 28rpx;

	&__top {
		display: flex;
		justify-content: space-between;
		gap: 20rpx;
		font-size: 24rpx;
		color: $text-primary;
	}
}

.progress-bar {
	height: 16rpx;
	margin-top: 14rpx;
	overflow: hidden;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.08);

	&__inner {
		height: 100%;
		border-radius: inherit;
		background: $primary-gradient;
		transition: width 0.2s ease;

		&--gold {
			background: linear-gradient(135deg, #d4af37, #ffd86b);
		}
	}
}

.request-status {
	margin-top: 12rpx;
	font-size: 22rpx;
	color: $gold;
	line-height: 1.45;
}

.benefit-btn {
	margin-top: 34rpx;
}
</style>
