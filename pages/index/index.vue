<template>
	<view class="page-container">
		<!-- 首页初次进入：1.5s 加载态 -->
		<view v-if="pageLoading" class="page-loading">
			<view class="page-loading__backdrop" />
			<view class="page-loading__panel">
				<view class="page-loading__ring page-loading__ring--outer" />
				<view class="page-loading__ring page-loading__ring--inner" />
				<view class="page-loading__core">
					<image class="page-loading__icon" src="/static/icons/loading-wifi.png" mode="aspectFit" />
				</view>
				<text class="page-loading__hint">正在加载...</text>
				<text class="page-loading__title">正在连接智能网络...</text>
			</view>
		</view>

		<custom-navbar title="智连WiFi" />
		<view class="page-content">
			<view class="hero-card">
				<view class="hero-card__title">智连WiFi</view>
				<view class="hero-card__desc">中国科技 · 让人民生活更方便</view>
			</view>

			<view class="card">
				<view class="card__title">快速创建WiFi码</view>
				<input v-model="wifiName" class="input-field" placeholder="请输入WiFi名称" />
				<input v-model="wifiPassword" class="input-field" password placeholder="请输入WiFi密码" />
				<input v-model="shopName" class="input-field" placeholder="所属店铺（选填）" />
				<button class="btn-primary btn-block" :loading="creating" @click="quickCreateWifi">一键创建并共享</button>
			</view>

			<view class="card">
				<view class="card__title">附近共享WiFi</view>
				<view class="card__desc">点击连接 · 获取WiFi密码</view>

				<!-- 加载中 -->
				<view v-if="listLoading" class="list-loading">
					<text class="list-loading__text">加载中...</text>
				</view>

				<!-- 加载失败（无数据可展示时） -->
				<view v-else-if="listLoadError && wifiList.length === 0" class="list-error">
					<view class="list-error__icon">⚠️</view>
					<view class="list-error__text">{{ listLoadError }}</view>
					<text class="list-error__btn" @click="() => loadNearbyWifi(true)">点击重试</text>
				</view>

				<!-- 空数据 -->
				<view v-else-if="wifiList.length === 0" class="empty-state">
					<image class="empty-state__icon" src="/static/icons/wifi.png" mode="aspectFit" />
					<view class="empty-state__text">附近暂无共享 WiFi，快来创建第一个吧</view>
				</view>

				<!-- WiFi 列表 -->
				<view v-else class="wifi-list-wrap">
					<view v-if="listFromCloud" class="cloud-tip">
						已从 uniCloud 加载 {{ wifiList.length }} 条附近 WiFi
					</view>
					<view
						v-for="(item, index) in wifiList"
						:key="item._id || item.id || 'wifi-' + index"
						class="list-item wifi-card-item"
						@click="onWifiCardClick(item)"
					>
						<image class="list-item__icon" src="/static/icons/wifi.png" mode="aspectFit" />
						<view class="list-item__info">
							<view class="list-item__title">{{ item.name || item.ssid || '未命名 WiFi' }}</view>
							<view class="list-item__desc">{{ item.shop || '附近' }} · {{ item.distance }} · {{ item.signal }}</view>
						</view>
						<text class="tag tag-ad">获取密码</text>
						<text class="list-item__arrow">›</text>
					</view>
				</view>
			</view>

			<view class="quick-grid">
				<view class="quick-item quick-item--highlight" @click="switchTab('/pages/upload/index')">
					<image class="quick-item__icon" src="/static/icons/upload.png" mode="aspectFit" />
					<text class="quick-item__text">上传共享WiFi</text>
				</view>
				<view class="quick-item" @click="goPage('/pages/create-wifi/create-wifi')">
					<image class="quick-item__icon" src="/static/icons/create.png" mode="aspectFit" />
					<text class="quick-item__text">创建WiFi</text>
				</view>
				<view class="quick-item" @click="goPage('/pages/my-wifi/my-wifi')">
					<image class="quick-item__icon" src="/static/icons/userwifi.png" mode="aspectFit" />
					<text class="quick-item__text">我的WiFi</text>
				</view>
				<view class="quick-item" @click="goMerchantPage">
					<image class="quick-item__icon" src="/static/icons/shop.png" mode="aspectFit" />
					<text class="quick-item__text">{{ isMerchantJoined ? '商家中心' : '商家入驻' }}</text>
				</view>
				<view class="quick-item" @click="goAgentPage">
					<image class="quick-item__icon" src="/static/icons/benefit-revenue.png" mode="aspectFit" />
					<text class="quick-item__text">{{ isAgentJoined ? '代理中心' : '代理入驻' }}</text>
				</view>
				<view class="quick-item" @click="switchTab('/pages/nearby/nearby')">
					<image class="quick-item__icon" src="/static/icons/nearby.png" mode="aspectFit" />
					<text class="quick-item__text">附近WiFi</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
	import {
		ref,
		onMounted,
		onUnmounted
	} from 'vue'
	import {
		onShow,
		onPullDownRefresh
	} from '@dcloudio/uni-app'
	import CustomNavbar from '@/components/custom-navbar/custom-navbar.vue'
	import { addWifi } from '@/utils/wifi-db.js'
	import {
		fetchNearbyWifi,
		filterNearbyCache,
		hasNearbyCache,
		getNearbySessionVersion,
		refreshNearbyWifi
	} from '@/utils/wifi-nearby-loader.js'
	import {
		WIFI_LIST_REFRESH_EVENT,
		MERCHANT_REFRESH_EVENT
	} from '@/utils/cloud-config.js'
	import { getMerchantProfile } from '@/utils/merchant-db.js'
	import { getAgentProfile } from '@/utils/agent-db.js'

	const wifiName = ref('')
	const wifiPassword = ref('')
	const shopName = ref('')

	const wifiList = ref([])
	const listLoading = ref(false)
	const listLoadError = ref('')
	const listFromCloud = ref(false)
	const creating = ref(false)
	const pageLoading = ref(true)
	const isMerchantJoined = ref(false)
	const isAgentJoined = ref(false)
	let loadedSessionVersion = -1

	async function refreshMerchantEntry() {
		try {
			const profile = await getMerchantProfile()
			isMerchantJoined.value = !!(profile && profile._id)
		} catch (err) {
			isMerchantJoined.value = false
		}
	}

	async function refreshAgentEntry() {
		try {
			const profile = await getAgentProfile()
			isAgentJoined.value = !!(profile && profile._id)
		} catch (err) {
			isAgentJoined.value = false
		}
	}

	async function goMerchantPage() {
		try {
			const profile = await getMerchantProfile()
			if (profile && profile._id) {
				isMerchantJoined.value = true
				goPage('/pages/merchant-dashboard/merchant-dashboard')
				return
			}
		} catch (err) {
			// 查询失败时仍进入入驻页
		}
		isMerchantJoined.value = false
		goPage('/pages/merchant-join/merchant-join')
	}

	async function goAgentPage() {
		try {
			const profile = await getAgentProfile()
			if (profile && profile._id) {
				isAgentJoined.value = true
				goPage('/pages/agent-dashboard/agent-dashboard')
				return
			}
		} catch (err) {
			// 查询失败时仍进入入驻页
		}
		isAgentJoined.value = false
		goPage('/pages/agent-join/agent-join')
	}

	function applyWifiList({ list, fromCloud, error }) {
		wifiList.value = list || []
		listFromCloud.value = !!(fromCloud && wifiList.value.length > 0)
		listLoadError.value = error || ''
	}

	/** 首页初次进入：1.5 秒后隐藏加载页 */
	onMounted(() => {
		uni.$on(WIFI_LIST_REFRESH_EVENT, onWifiListRefresh)
		uni.$on(MERCHANT_REFRESH_EVENT, refreshMerchantEntry)
		setTimeout(() => {
			pageLoading.value = false
		}, 1500)
	})

	async function onWifiListRefresh() {
		if (listLoading.value) return
		listLoading.value = true
		try {
			const result = await refreshNearbyWifi({ limit: 50 })
			applyWifiList(result)
			loadedSessionVersion = getNearbySessionVersion()
		} catch (err) {
			listLoadError.value = err.message || '刷新失败'
		} finally {
			listLoading.value = false
		}
	}

	/**
	 * 安全加载附近 WiFi（缓存优先，3 秒内不重复请求云函数）
	 * @param {boolean} force 下拉刷新 / 上传后强制刷新
	 */
	async function loadNearbyWifi(force = false) {
		if (
			!force &&
			loadedSessionVersion === getNearbySessionVersion() &&
			wifiList.value.length > 0
		) {
			return
		}
		if (listLoading.value) return

		if (!force && hasNearbyCache()) {
			const cached = filterNearbyCache()
			if (cached) {
				applyWifiList(cached)
				loadedSessionVersion = getNearbySessionVersion()
				return
			}
		}

		listLoading.value = true
		listLoadError.value = ''
		try {
			const result = await fetchNearbyWifi({ limit: 50 }, { force })
			applyWifiList(result)
			loadedSessionVersion = getNearbySessionVersion()
		} catch (err) {
			wifiList.value = []
			listFromCloud.value = false
			listLoadError.value = err.message || '加载失败，请稍后重试'
			loadedSessionVersion = getNearbySessionVersion()
		} finally {
			listLoading.value = false
			uni.stopPullDownRefresh()
		}
	}

	/** 首页快速创建：写入 uniCloud wifi_list */
	async function quickCreateWifi() {
		if (!wifiName.value || !wifiPassword.value) {
			uni.showToast({
				title: '请输入WiFi名称和密码',
				icon: 'none'
			})
			return
		}

		creating.value = true
		try {
			const result = await addWifi({
				wifiName: wifiName.value,
				wifiPassword: wifiPassword.value,
				shopName: shopName.value || '未命名店铺',
				signal: '强'
			})
			if (!result) {
				uni.showToast({
					title: '创建失败，请检查云函数 wifi_list',
					icon: 'none'
				})
				return
			}
			uni.showToast({
				title: '创建成功',
				icon: 'success'
			})
			wifiName.value = ''
			wifiPassword.value = ''
			shopName.value = ''
			await loadNearbyWifi(true)
		} catch (err) {
			uni.showToast({
				title: err.message || '创建失败',
				icon: 'none'
			})
		} finally {
			creating.value = false
		}
	}

	/** 点击 WiFi 卡片：进入详情页获取密码 */
	function onWifiCardClick(item) {
		if (!item._id) {
			uni.showToast({ title: 'WiFi 数据无效', icon: 'none' })
			return
		}
		const query = [
			'id=' + encodeURIComponent(item._id),
			'distance=' + encodeURIComponent(item.distance || '')
		].join('&')
		uni.navigateTo({
			url: '/pages/wifi-detail/wifi-detail?' + query
		})
	}

	function goPage(url) {
		uni.navigateTo({
			url
		})
	}

	function switchTab(url) {
		uni.switchTab({
			url
		})
	}

	onShow(() => {
		refreshMerchantEntry()
		refreshAgentEntry()
		if (loadedSessionVersion === getNearbySessionVersion() && wifiList.value.length > 0) {
			return
		}
		loadNearbyWifi(false)
	})

	onPullDownRefresh(() => {
		loadedSessionVersion = -1
		loadNearbyWifi(true)
	})

	onUnmounted(() => {
		uni.$off(WIFI_LIST_REFRESH_EVENT, onWifiListRefresh)
		uni.$off(MERCHANT_REFRESH_EVENT, refreshMerchantEntry)
	})
</script>

<style lang="scss" scoped>
	@import '@/styles/theme.scss';

	.page-loading {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: center;

		&__backdrop {
			position: absolute;
			inset: 0;
			background: linear-gradient(180deg, #0a0a0f 0%, #12121a 45%, #1a0508 100%);
		}

		&__panel {
			position: relative;
			z-index: 1;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			padding: 64rpx 48rpx;
		}

		&__ring {
			position: absolute;
			top: 50%;
			left: 50%;
			border-radius: 50%;
			transform: translate(-50%, -58%);
			border: 2rpx solid transparent;

			&--outer {
				width: 220rpx;
				height: 220rpx;
				border-top-color: rgba(200, 0, 0, 0.9);
				border-right-color: rgba(0, 180, 255, 0.35);
				box-shadow: 0 0 40rpx rgba(200, 0, 0, 0.45), 0 0 80rpx rgba(0, 160, 255, 0.15);
				animation: page-loading-spin 1.2s linear infinite;
			}

			&--inner {
				width: 168rpx;
				height: 168rpx;
				border-bottom-color: rgba(0, 180, 255, 0.85);
				border-left-color: rgba(200, 0, 0, 0.25);
				box-shadow: 0 0 30rpx rgba(0, 180, 255, 0.35);
				animation: page-loading-spin 0.9s linear infinite reverse;
			}
		}

		&__core {
			width: 120rpx;
			height: 120rpx;
			margin-bottom: 48rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			border-radius: 50%;
			background: rgba(255, 255, 255, 0.04);
			border: 1px solid rgba(255, 215, 0, 0.25);
			box-shadow:
				0 0 24rpx rgba(200, 0, 0, 0.35),
				0 0 48rpx rgba(0, 160, 255, 0.2);
			animation: page-loading-pulse 1.5s ease-in-out infinite;

			.page-loading__icon {
				width: 72rpx;
				height: 72rpx;
			}
		}

		&__hint {
			font-size: 24rpx;
			color: rgba(255, 255, 255, 0.55);
			letter-spacing: 4rpx;
			margin-bottom: 16rpx;
		}

		&__title {
			font-size: 34rpx;
			font-weight: 600;
			color: #f5f5f5;
			letter-spacing: 2rpx;
			text-align: center;
			text-shadow:
				0 0 16rpx rgba(200, 0, 0, 0.65),
				0 0 32rpx rgba(0, 160, 255, 0.35);
		}
	}

	@keyframes page-loading-spin {
		from {
			transform: translate(-50%, -58%) rotate(0deg);
		}
		to {
			transform: translate(-50%, -58%) rotate(360deg);
		}
	}

	@keyframes page-loading-pulse {
		0%,
		100% {
			transform: scale(1);
			opacity: 1;
		}
		50% {
			transform: scale(1.06);
			opacity: 0.88;
		}
	}

	.wifi-card-item {
		transition: background 0.2s;

		&:active {
			background: rgba(200, 0, 0, 0.08);
		}
	}

	.tag-ad {
		display: inline-block;
		padding: 6rpx 16rpx;
		border-radius: $radius-sm;
		font-size: 22rpx;
		font-weight: 500;
		background: rgba(200, 0, 0, 0.2);
		color: $gold;
		border: 1px solid $border-gold;
		margin-right: 8rpx;
	}

	.quick-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 20rpx;
		margin-top: 24rpx;

		.quick-item {
			width: calc(50% - 10rpx);

			&--highlight {
				border: 1px solid $border-gold;
				box-shadow: 0 0 16rpx rgba(200, 0, 0, 0.35);

				.quick-item__text {
					color: $gold;
				}
			}

			background: $bg-card;
			border-radius: $radius-md;
			padding: 32rpx;
			display: flex;
			align-items: center;
			box-shadow: $shadow-card;

			&__icon {
				width: 40rpx;
				height: 40rpx;
				margin-right: 16rpx;
				flex-shrink: 0;
			}

			&__text {
				font-size: 28rpx;
				color: $text-primary;
				font-weight: 500;
			}
		}
	}
</style>
