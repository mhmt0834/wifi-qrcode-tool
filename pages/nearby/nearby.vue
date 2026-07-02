<template>
	<view class="page-container">
		<custom-navbar title="附近WiFi" />
		<view class="page-content">
			<view class="hero-card">
				<view class="hero-card__title">附近WiFi</view>
				<view class="hero-card__desc">uniCloud 云数据库 · 按距离排序</view>
			</view>

			<view class="search-bar">
				<image class="search-icon" src="/static/icons/search.png" mode="aspectFit" />
				<input v-model="keyword" class="search-input" placeholder="搜索店铺或WiFi名称" @confirm="onSearchConfirm" />
			</view>

			<view v-if="listLoading" class="list-loading">
				<text class="list-loading__text">加载中...</text>
			</view>

			<view v-else-if="listLoadError && wifiList.length === 0" class="list-error">
				<view class="list-error__icon">⚠️</view>
				<view class="list-error__text">{{ listLoadError }}</view>
				<text class="list-error__btn" @click="() => loadNearbyWifi(true)">点击重试</text>
			</view>

			<view v-else-if="wifiList.length === 0" class="empty-state">
				<image class="empty-state__icon" src="/static/icons/wifi.png" mode="aspectFit" />
				<view class="empty-state__text">附近暂无共享 WiFi</view>
			</view>

			<view v-else class="wifi-list-wrap">
				<view v-if="listFromCloud" class="cloud-tip">
					已从 uniCloud 加载 {{ wifiList.length }} 条附近 WiFi
				</view>
				<view v-for="(item, index) in wifiList" :key="item._id || item.id || 'wifi-' + index"
					class="list-item wifi-card-item" @click="onWifiCardClick(item)">
					<image class="list-item__icon" src="/static/icons/wifi.png" mode="aspectFit" />
					<view class="list-item__info">
						<view class="list-item__title">{{ item.name || item.ssid || '未命名 WiFi' }}</view>
						<view class="list-item__desc">{{ item.shop || '附近' }} · {{ item.distance }} · {{ item.signal }}
						</view>
					</view>
					<text class="tag tag-ad">获取密码</text>
					<text class="list-item__arrow">›</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
	import {
		ref,
		watch,
		onMounted,
		onUnmounted
	} from 'vue'
	import {
		onShow,
		onPullDownRefresh
	} from '@dcloudio/uni-app'
	import CustomNavbar from '@/components/custom-navbar/custom-navbar.vue'
	import {
		fetchNearbyWifi,
		filterNearbyCache,
		hasNearbyCache,
		getNearbySessionVersion,
		refreshNearbyWifi
	} from '@/utils/wifi-nearby-loader.js'
	import {
		WIFI_LIST_REFRESH_EVENT
	} from '@/utils/cloud-config.js'
	const loadingNearby = ref(false)
	const nearbyLoaded = ref(false)
	const keyword = ref('')
	const wifiList = ref([])
	const listLoading = ref(false)
	const listLoadError = ref('')
	const listFromCloud = ref(false)
	let loadedSessionVersion = -1

	function applyListResult({
		list,
		fromCloud,
		error
	}) {
		wifiList.value = list || []
		listFromCloud.value = !!(fromCloud && wifiList.value.length > 0)
		listLoadError.value = error || ''
	}

	/** 安全查询附近 WiFi（缓存优先，3 秒内不重复请求云函数） */
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
			const cached = filterNearbyCache(keyword.value)
			if (cached) {
				applyListResult(cached)
				loadedSessionVersion = getNearbySessionVersion()
				return
			}
		}

		listLoading.value = true
		listLoadError.value = ''
		try {
			const result = await fetchNearbyWifi({
				keyword: keyword.value,
				limit: 100
			}, {
				force
			})
			applyListResult(result)
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

	function onSearchConfirm() {
		const cached = filterNearbyCache(keyword.value)
		if (cached) {
			applyListResult(cached)
			return
		}
		loadNearbyWifi(true)
	}

	async function onWifiListRefresh() {
		if (listLoading.value) return
		listLoading.value = true
		listLoadError.value = ''
		try {
			const result = await refreshNearbyWifi({
				keyword: keyword.value,
				limit: 100
			})
			applyListResult(result)
			loadedSessionVersion = getNearbySessionVersion()
		} catch (err) {
			listLoadError.value = err.message || '刷新失败'
		} finally {
			listLoading.value = false
		}
	}

	/** 搜索：优先本地过滤缓存，不重复请求云函数 */
	let searchTimer = null
	watch(keyword, () => {
		clearTimeout(searchTimer)
		searchTimer = setTimeout(() => {
			const cached = filterNearbyCache(keyword.value)
			if (cached) {
				applyListResult(cached)
				return
			}
			if (loadedSessionVersion !== getNearbySessionVersion()) {
				loadNearbyWifi(false)
			}
		}, 300)
	})

	function onWifiCardClick(item) {
		if (!item._id) {
			uni.showToast({
				title: 'WiFi 数据无效',
				icon: 'none'
			})
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

	onShow(() => {
		if (loadedSessionVersion === getNearbySessionVersion() && wifiList.value.length > 0) {
			return
		}
		if (hasNearbyCache()) {
			const cached = filterNearbyCache(keyword.value)
			if (cached) {
				applyListResult(cached)
				loadedSessionVersion = getNearbySessionVersion()
				return
			}
		}
		loadNearbyWifi(false)
	})

	onPullDownRefresh(() => {
		loadedSessionVersion = -1
		loadNearbyWifi(true)
	})

	onMounted(() => {
		uni.$on(WIFI_LIST_REFRESH_EVENT, onWifiListRefresh)
	})

	onUnmounted(() => {
		clearTimeout(searchTimer)
		uni.$off(WIFI_LIST_REFRESH_EVENT, onWifiListRefresh)
	})
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
			width: 32rpx;
			height: 32rpx;
			margin-right: 16rpx;
			flex-shrink: 0;
		}

		.search-input {
			flex: 1;
			font-size: 28rpx;
			height: 80rpx;
		}
	}

	.wifi-list-wrap {
		margin-top: 8rpx;
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
</style>
