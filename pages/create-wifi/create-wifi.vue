<template>
	<view class="page-container">
		<custom-navbar title="创建WiFi" :show-back="true" />
		<view class="page-content">
			<view class="hero-card">
				<view class="hero-card__title">创建WiFi码</view>
				<view class="hero-card__desc">保存到 uniCloud 云数据库并共享给附近用户</view>
			</view>

			<view class="card">
				<view class="card__title">WiFi信息</view>
				<input v-model="form.wifiName" class="input-field" placeholder="WiFi名称（SSID）" />
				<input v-model="form.wifiPassword" class="input-field" password placeholder="WiFi密码" />
				<input v-model="form.shopName" class="input-field" placeholder="所属店铺名称" />
			</view>

			<view class="card">
				<view class="card__title">位置信息</view>
				<view class="card__desc">将使用当前定位作为 WiFi 坐标，用于附近排序</view>
				<view class="location-row">
					<text class="location-label">当前坐标</text>
					<text class="location-value">
						{{ locationText }}
					</text>
				</view>
				<button class="btn-outline btn-block" size="mini" @click="refreshLocation">刷新定位</button>
			</view>

			<view class="card">
				<view class="card__title">共享设置</view>
				<view class="setting-row">
					<text>连接前需获取密码</text>
					<switch :checked="form.needAd" @change="form.needAd = $event.detail.value" color="#C80000" />
				</view>
				<view class="setting-row">
					<text>允许陌生人连接</text>
					<switch :checked="form.allowPublic" @change="form.allowPublic = $event.detail.value" color="#C80000" />
				</view>
			</view>

			<view v-if="createdId" class="card success-card">
				<view class="card__title gold-title">已保存到云数据库</view>
				<view class="card__desc">WiFi ID：{{ createdId }}</view>
				<view class="card__desc">附近用户可按距离看到并连接</view>
			</view>

			<button class="btn-primary btn-block" :loading="submitting" @click="submitWifi">
				{{ createdId ? '继续创建新的' : '保存到云数据库' }}
			</button>
		</view>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import CustomNavbar from '@/components/custom-navbar/custom-navbar.vue'
import { addWifi } from '@/utils/wifi-db.js'
import { invalidateNearbyCache } from '@/utils/wifi-nearby-loader.js'
import { getUserLocation } from '@/utils/location.js'
import { WIFI_LIST_REFRESH_EVENT, MERCHANT_REFRESH_EVENT, MY_WIFI_REFRESH_EVENT } from '@/utils/cloud-config.js'

/** 表单字段与 wifi_list 集合字段对应 */
const form = ref({
	wifiName: '',
	wifiPassword: '',
	shopName: '',
	needAd: true,
	allowPublic: true
})

const latitude = ref(null)
const longitude = ref(null)
const submitting = ref(false)
const createdId = ref('')

const locationText = computed(() => {
	if (latitude.value == null) return '定位中...'
	return `${latitude.value.toFixed(5)}, ${longitude.value.toFixed(5)}`
})

onLoad(async (options) => {
	if (options.name) form.value.wifiName = decodeURIComponent(options.name)
	await refreshLocation()
})

/** 获取当前 GCJ-02 坐标，写入新增记录 */
async function refreshLocation() {
	try {
		const loc = await getUserLocation()
		latitude.value = loc.latitude
		longitude.value = loc.longitude
	} catch (err) {
		uni.showToast({ title: '定位失败', icon: 'none' })
	}
}

/**
 * 新增 WiFi 到 uniCloud wifi_list 集合
 * 云函数会自动写入 creatorOpenid 与 createTime
 */
async function submitWifi() {
	if (!form.value.wifiName || !form.value.wifiPassword || !form.value.shopName) {
		uni.showToast({ title: '请填写完整 WiFi 信息', icon: 'none' })
		return
	}
	if (latitude.value == null) {
		await refreshLocation()
		if (latitude.value == null) return
	}

	submitting.value = true
	try {
		const data = await addWifi({
			wifiName: form.value.wifiName,
			wifiPassword: form.value.wifiPassword,
			shopName: form.value.shopName,
			latitude: latitude.value,
			longitude: longitude.value,
			signal: '强'
		})

		if (!data) {
			uni.showToast({ title: '保存失败，请检查云函数 wifi_list', icon: 'none' })
			return
		}

		createdId.value = data._id
		uni.showToast({ title: '已保存到云数据库', icon: 'success' })
		invalidateNearbyCache()
		uni.$emit(WIFI_LIST_REFRESH_EVENT)
		uni.$emit(MERCHANT_REFRESH_EVENT)
		uni.$emit(MY_WIFI_REFRESH_EVENT)

		// 清空表单，便于继续创建下一条
		form.value.wifiName = ''
		form.value.wifiPassword = ''
		form.value.shopName = ''
	} catch (err) {
		uni.showToast({ title: err.message || '保存失败', icon: 'none' })
	} finally {
		submitting.value = false
	}
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.setting-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 24rpx 0;
	border-bottom: 1rpx solid $border-color;
	font-size: 28rpx;
	color: $text-primary;

	&:last-child {
		border-bottom: none;
	}
}

.location-row {
	display: flex;
	justify-content: space-between;
	padding: 20rpx 0;
	font-size: 26rpx;
}

.location-label {
	color: $text-secondary;
}

.location-value {
	color: $gold;
}

.success-card {
	border: 1px solid $border-gold;
	box-shadow: $shadow-gold;
}
</style>
