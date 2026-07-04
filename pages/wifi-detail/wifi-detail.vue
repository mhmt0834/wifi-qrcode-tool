<template>
	<view class="page-container">
		<custom-navbar title="WiFi详情" :show-back="true" />
		<view class="page-content">
			<view v-if="pageLoading" class="list-loading">加载中...</view>

			<template v-else-if="wifiNotFound">
				<view class="unavailable-card">
					<image class="unavailable-card__icon" src="/static/icons/wifi.png" mode="aspectFit" />
					<view class="unavailable-card__title">该WiFi已下线或已删除</view>
					<view class="unavailable-card__desc">请联系商家获取最新二维码</view>
					<button class="btn-primary btn-block unavailable-card__btn" @click="goHome">
						返回首页
					</button>
				</view>
			</template>

			<template v-else-if="loadError">
				<view class="unavailable-card">
					<image class="unavailable-card__icon" src="/static/icons/wifi.png" mode="aspectFit" />
					<view class="unavailable-card__title">{{ loadError }}</view>
					<view class="unavailable-card__desc">请稍后重试或联系商家</view>
					<button class="btn-primary btn-block unavailable-card__btn" @click="goHome">
						返回首页
					</button>
				</view>
			</template>

			<template v-else>
				<view class="hero-card">
					<view class="hero-card__title">{{ wifiSsid }}</view>
					<view class="hero-card__desc">{{ shopName }} · 免费共享</view>
				</view>

				<view class="card">
					<view class="info-row">
						<text class="info-label">热度</text>
						<text class="info-value">{{ wifiHeat }}</text>
					</view>
					<view class="info-row">
						<text class="info-label">浏览次数</text>
						<text class="info-value">{{ viewCount }}</text>
					</view>
					<view class="info-row">
						<text class="info-label">信号强度</text>
						<text class="info-value">{{ wifiSignal }}</text>
					</view>
					<view class="info-row">
						<text class="info-label">距离</text>
						<text class="info-value">{{ wifiDistance }}</text>
					</view>
					<view class="info-row">
						<text class="info-label">状态</text>
						<text class="info-value">{{ wifiStatus }}</text>
					</view>
					<view class="info-row">
						<text class="info-label">连接方式</text>
						<text class="info-value">点击获取 WiFi 密码</text>
					</view>
				</view>

				<view v-if="wifiIntro" class="card">
					<view class="card__title">介绍</view>
					<view class="card__desc">{{ wifiIntro }}</view>
				</view>

				<!-- 未解锁 -->
				<view v-if="!passwordUnlocked" class="card lock-card">
					<image class="lock-card__icon" src="/static/icons/wifi.png" mode="aspectFit" />
					<view class="card__desc">点击下方按钮获取 WiFi 密码</view>
					<view class="card__desc lock-tip">密码不会提前显示，获取后可复制连接</view>
				</view>

				<!-- 已解锁：展示密码 -->
				<view v-else class="card password-card">
					<view class="card__title gold-title">WiFi密码</view>
					<view class="password-card__value">{{ wifiPassword }}</view>
					<view class="card__desc password-card__hint">请复制密码后前往系统 WiFi 设置连接</view>
					<button class="btn-primary btn-block" @click="copyPassword">复制密码</button>
				</view>

				<!-- 连接 WiFi 主按钮 -->
				<button
					v-if="!passwordUnlocked && wifiStatus !== '离线'"
					class="btn-primary btn-block connect-btn"
					:loading="adLoading"
					:disabled="adLoading"
					@click="onGetPassword"
				>
					获取WiFi密码
				</button>

				<view v-if="wifiStatus === '离线'" class="offline-tip">该 WiFi 已下线，暂不可连接</view>

				<!-- 解锁后可选：自动连接 -->
				<template v-if="passwordUnlocked">
					<view v-if="connectStatus !== 'idle'" class="card status-card" :class="'status-card--' + connectStatus">
						<view class="status-title">{{ statusTitle }}</view>
						<view class="card__desc status-desc">{{ statusDesc }}</view>
					</view>
					<button
						class="btn-outline btn-block connect-btn"
						:loading="connecting"
						@click="tryAutoConnect"
					>
						尝试自动连接 WiFi
					</button>
					<button class="btn-outline btn-block system-wifi-btn" @click="handleGoSystemWifi">
						去系统WiFi页面
					</button>
				</template>
			</template>
		</view>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import CustomNavbar from '@/components/custom-navbar/custom-navbar.vue'
import { showRewardAdWithTicket, getRewardAdFailMessage } from '@/utils/ad-provider.js'
import {
	autoConnectWifi,
	goToSystemWifiPage,
	stopWifiModule,
	WIFI_CONNECT_SUCCESS_MSG,
	WIFI_CONNECT_FAIL_MSG
} from '@/utils/wifi.js'
import {
	getWifiPublicDetail,
	getWifiConnectCredential,
	resolveWifiIdFromOptions
} from '@/utils/wifi-qr.js'
import { recordWifiView, recordWifiConnect } from '@/utils/merchant-db.js'

const pageLoading = ref(true)
const wifiNotFound = ref(false)
const loadError = ref('')
const wifiSsid = ref('智连WiFi')
const shopName = ref('附近商家')
const wifiIntro = ref('')
const wifiAddress = ref('')
const wifiHeat = ref(0)
const viewCount = ref(0)
const wifiSignal = ref('强')
const wifiDistance = ref('--')
const wifiStatus = ref('在线')
const wifiPassword = ref('')
const passwordUnlocked = ref(false)
const adLoading = ref(false)
const connecting = ref(false)
const connectStatus = ref('idle')
const wifiDocId = ref('')
const lastAdTicket = ref('')

const statusTitle = computed(() => {
	if (connectStatus.value === 'connecting') return '正在自动连接 WiFi...'
	if (connectStatus.value === 'success') return WIFI_CONNECT_SUCCESS_MSG
	if (connectStatus.value === 'failed') return WIFI_CONNECT_FAIL_MSG
	return ''
})

const statusDesc = computed(() => {
	if (connectStatus.value === 'connecting') {
		return `正在连接「${wifiSsid.value}」，请稍候`
	}
	if (connectStatus.value === 'success') {
		return `已成功连接「${wifiSsid.value}」`
	}
	if (connectStatus.value === 'failed') {
		return '自动连接失败，请使用复制的密码手动连接'
	}
	return ''
})

async function loadPublicWifi(id) {
	pageLoading.value = true
	wifiNotFound.value = false
	loadError.value = ''
	try {
		const result = await getWifiPublicDetail(id)
		if (result.status === 'not_found') {
			wifiNotFound.value = true
			return
		}
		if (result.status === 'error') {
			loadError.value = result.message || '加载失败，请稍后重试'
			return
		}
		const doc = result.data
		wifiSsid.value = doc.name
		shopName.value = doc.shop
		wifiIntro.value = doc.intro || ''
		wifiAddress.value = doc.address || ''
		wifiHeat.value = doc.heat
		viewCount.value = doc.viewCount
		wifiSignal.value = doc.signal || '强'
		wifiStatus.value = doc.status || '在线'
		recordWifiView(id)
	} catch (err) {
		loadError.value = '加载失败，请稍后重试'
	} finally {
		pageLoading.value = false
	}
}

function goHome() {
	uni.switchTab({ url: '/pages/index/index' })
}

/** 获取连接凭证（审核模式跳过广告；正式版经 showRewardAd 播放激励视频） */
async function unlockPassword(adTicket = '') {
	if (!wifiDocId.value) return false
	if (!adTicket || adTicket !== lastAdTicket.value) {
		uni.showToast({ title: '请先完整观看激励视频', icon: 'none' })
		return false
	}

	try {
		const cred = await getWifiConnectCredential(wifiDocId.value)
		wifiSsid.value = cred.wifiName || wifiSsid.value
		wifiPassword.value = cred.wifiPassword || ''
		if (!wifiPassword.value) {
			uni.showToast({ title: '未获取到密码', icon: 'none' })
			return false
		}

		await recordWifiConnect(wifiDocId.value)
		passwordUnlocked.value = true
		uni.showToast({ title: '密码已获取', icon: 'success' })
		return true
	} catch (err) {
		uni.showToast({ title: err.message || '获取密码失败', icon: 'none' })
		return false
	}
}

async function onGetPassword() {
	if (wifiStatus.value === '离线') {
		uni.showToast({ title: '该 WiFi 已下线', icon: 'none' })
		return
	}
	if (!wifiDocId.value) {
		uni.showToast({ title: '缺少 WiFi 信息', icon: 'none' })
		return
	}
	if (passwordUnlocked.value) return

	adLoading.value = true
	try {
		lastAdTicket.value = ''
		const adResult = await showRewardAdWithTicket()
		if (!adResult.completed || !adResult.ticket) {
			uni.showModal({
				title: '广告未播放',
				content: adResult.error || getRewardAdFailMessage(),
				showCancel: false
			})
			return
		}
		lastAdTicket.value = adResult.ticket
		await unlockPassword(adResult.ticket)
	} catch (err) {
		uni.showToast({ title: '操作失败，请重试', icon: 'none' })
	} finally {
		adLoading.value = false
	}
}

function copyPassword() {
	if (!wifiPassword.value) return
	uni.setClipboardData({
		data: wifiPassword.value,
		success: () => uni.showToast({ title: '密码已复制', icon: 'success' })
	})
}

async function tryAutoConnect() {
	if (!passwordUnlocked.value || !wifiPassword.value) return
	connecting.value = true
	connectStatus.value = 'connecting'
	const result = await autoConnectWifi({
		SSID: wifiSsid.value,
		password: wifiPassword.value
	})
	connectStatus.value = result.success ? 'success' : 'failed'
	connecting.value = false
}

function handleGoSystemWifi() {
	if (!wifiPassword.value) {
		uni.showToast({ title: '请先获取WiFi密码', icon: 'none' })
		return
	}
	goToSystemWifiPage({
		SSID: wifiSsid.value,
		password: wifiPassword.value
	})
}

onLoad(async (options) => {
	const id = resolveWifiIdFromOptions(options)
	if (id) {
		wifiDocId.value = id
		await loadPublicWifi(id)
	} else if (options.ssid || options.name) {
		pageLoading.value = false
		if (options.ssid) wifiSsid.value = decodeURIComponent(options.ssid)
		else if (options.name) wifiSsid.value = decodeURIComponent(options.name)
		if (options.shop) shopName.value = decodeURIComponent(options.shop)
		if (options.distance) wifiDistance.value = decodeURIComponent(options.distance)
	} else {
		pageLoading.value = false
		wifiNotFound.value = true
	}
	// 禁止通过 URL 传递 password / unlocked 绕过获取流程
})

onUnload(() => {
	stopWifiModule()
})
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.list-loading {
	padding: 60rpx 0;
	text-align: center;
	color: $text-secondary;
}

.unavailable-card {
	margin-top: 48rpx;
	padding: 56rpx 40rpx;
	text-align: center;
	background: $bg-card;
	border-radius: $radius-lg;
	border: 1px solid rgba(212, 175, 55, 0.25);
	box-shadow: $shadow-card;

	&__icon {
		width: 120rpx;
		height: 120rpx;
		margin-bottom: 32rpx;
		opacity: 0.75;
	}

	&__title {
		font-size: 34rpx;
		font-weight: 700;
		color: $gold;
		line-height: 1.5;
		margin-bottom: 20rpx;
	}

	&__desc {
		font-size: 28rpx;
		color: $text-secondary;
		line-height: 1.6;
		margin-bottom: 48rpx;
	}

	&__btn {
		max-width: 480rpx;
		margin: 0 auto;
	}
}

.info-row {
	display: flex;
	justify-content: space-between;
	padding: 20rpx 0;
	border-bottom: 1rpx solid $border-color;

	&:last-child {
		border-bottom: none;
	}
}

.info-label {
	font-size: 28rpx;
	color: $text-secondary;
}

.info-value {
	font-size: 28rpx;
	color: $text-primary;
	font-weight: 500;
}

.lock-card {
	text-align: center;
	padding: 40rpx 30rpx;

	&__icon {
		width: 80rpx;
		height: 80rpx;
		margin-bottom: 16rpx;
		opacity: 0.85;
	}
}

.lock-tip {
	color: $gold !important;
	margin-top: 12rpx;
	font-size: 24rpx;
}

.password-card {
	text-align: center;

	&__value {
		font-size: 40rpx;
		font-weight: 700;
		color: $primary-color;
		letter-spacing: 4rpx;
		margin: 24rpx 0;
		word-break: break-all;
	}

	&__hint {
		margin-bottom: 24rpx;
	}
}

.card__desc--sub {
	margin-top: 8rpx;
	color: $text-secondary !important;
}

.offline-tip {
	text-align: center;
	color: $text-secondary;
	font-size: 28rpx;
	margin-top: 24rpx;
}

.status-card {
	text-align: center;
	padding: 32rpx 30rpx;
	border: 1rpx solid $border-gold;
	margin-top: 24rpx;

	&--success {
		border-color: rgba(0, 200, 83, 0.5);
	}

	&--failed {
		border-color: rgba(255, 171, 0, 0.5);
	}
}

.status-title {
	font-size: 30rpx;
	font-weight: 600;
	color: $text-primary;
	margin-bottom: 8rpx;
}

.status-desc {
	font-size: 26rpx;
}

.connect-btn {
	margin-top: 40rpx;
}

.system-wifi-btn {
	margin-top: 20rpx;
}
</style>
