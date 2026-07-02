<template>
	<view class="page-container">
		<custom-navbar title="上传共享WiFi" />
		<view class="page-content">
			<view class="hero-card upload-hero">
				<view class="upload-hero__badge">共享 · 连接</view>
				<view class="hero-card__title">上传共享 WiFi</view>
				<view class="hero-card__desc">填写 WiFi 信息，自动定位后分享给附近用户</view>
			</view>

			<view class="card tech-card">
				<view class="card__title gold-title">WiFi 信息</view>

				<view class="form-item" :class="{ 'form-item--error': errors.wifiName }">
					<text class="form-item__label">WiFi 名称 <text class="required">*</text></text>
					<input
						v-model="form.wifiName"
						class="input-field"
						:class="{ 'input-field--error': errors.wifiName }"
						placeholder="请输入 WiFi 名称（SSID）"
						maxlength="32"
						@blur="validateField('wifiName')"
					/>
					<text v-if="errors.wifiName" class="form-item__error">{{ errors.wifiName }}</text>
				</view>

				<view class="form-item" :class="{ 'form-item--error': errors.wifiPassword }">
					<text class="form-item__label">WiFi 密码 <text class="required">*</text></text>
					<input
						v-model="form.wifiPassword"
						class="input-field"
						:class="{ 'input-field--error': errors.wifiPassword }"
						password
						placeholder="请输入 WiFi 密码（至少 6 位）"
						maxlength="64"
						@blur="validateField('wifiPassword')"
					/>
					<text v-if="errors.wifiPassword" class="form-item__error">{{ errors.wifiPassword }}</text>
				</view>

				<view class="form-item" :class="{ 'form-item--error': errors.shopName }">
					<text class="form-item__label">店铺名称 <text class="required">*</text></text>
					<input
						v-model="form.shopName"
						class="input-field"
						:class="{ 'input-field--error': errors.shopName }"
						placeholder="请输入店铺名称"
						maxlength="40"
						@blur="validateField('shopName')"
					/>
					<text v-if="errors.shopName" class="form-item__error">{{ errors.shopName }}</text>
				</view>
			</view>

			<view class="card tech-card">
				<view class="card__title gold-title">位置信息</view>
				<view class="card__desc">自动获取 latitude / longitude，写入 wifi_list 集合</view>
				<view class="location-box">
					<view class="location-box__row">
						<text class="location-box__label">纬度</text>
						<text class="location-box__value">{{ latitudeText }}</text>
					</view>
					<view class="location-box__row">
						<text class="location-box__label">经度</text>
						<text class="location-box__value">{{ longitudeText }}</text>
					</view>
					<view class="location-box__status">
						<text v-if="locating" class="status-text status-text--loading">定位中...</text>
						<text v-else-if="locError" class="status-text status-text--warn">{{ locError }}</text>
						<text v-else class="status-text status-text--ok">定位就绪（GCJ-02）</text>
					</view>
				</view>
				<button class="btn-outline btn-block" size="mini" :loading="locating" @click="refreshLocation">
					重新定位
				</button>
			</view>

			<view v-if="uploadSuccess" class="card success-card">
				<view class="success-card__icon">✓</view>
				<view class="card__title gold-title">共享成功</view>
				<view class="card__desc">已写入 wifi_list，首页与附近页已刷新</view>
			</view>

			<button
				class="btn-primary btn-block upload-btn"
				:loading="submitting"
				:disabled="submitting"
				@click="submitUpload"
			>
				{{ uploadSuccess ? '继续上传' : '立即共享 WiFi' }}
			</button>

			<view v-if="uploadSuccess" class="action-row">
				<button class="btn-outline action-row__btn" @click="goHome">去首页查看</button>
				<button class="btn-outline action-row__btn" @click="goNearby">去附近查看</button>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import CustomNavbar from '@/components/custom-navbar/custom-navbar.vue'
import { isLoggedIn, getOpenid } from '@/utils/auth.js'
import { addWifi } from '@/utils/wifi-db.js'
import { invalidateNearbyCache } from '@/utils/wifi-nearby-loader.js'
import { getUserLocation } from '@/utils/location.js'
import { WIFI_LIST_REFRESH_EVENT, MERCHANT_REFRESH_EVENT, MY_WIFI_REFRESH_EVENT } from '@/utils/cloud-config.js'

const form = ref({
	wifiName: '',
	wifiPassword: '',
	shopName: ''
})

const errors = reactive({
	wifiName: '',
	wifiPassword: '',
	shopName: ''
})

const latitude = ref(null)
const longitude = ref(null)
const locating = ref(false)
const locError = ref('')
const submitting = ref(false)
const uploadSuccess = ref(false)

const latitudeText = computed(() => {
	if (latitude.value == null) return '--'
	return latitude.value.toFixed(6)
})

const longitudeText = computed(() => {
	if (longitude.value == null) return '--'
	return longitude.value.toFixed(6)
})

onShow(() => {
	if (!uploadSuccess.value) {
		refreshLocation()
	}
})

/** 单字段校验 */
function validateField(field) {
	const name = (form.value.wifiName || '').trim()
	const pwd = (form.value.wifiPassword || '').trim()
	const shop = (form.value.shopName || '').trim()

	if (field === 'wifiName' || !field) {
		if (!name) errors.wifiName = '请输入 WiFi 名称'
		else if (name.length < 2) errors.wifiName = 'WiFi 名称至少 2 个字符'
		else errors.wifiName = ''
	}
	if (field === 'wifiPassword' || !field) {
		if (!pwd) errors.wifiPassword = '请输入 WiFi 密码'
		else if (pwd.length < 6) errors.wifiPassword = '密码至少 6 位'
		else errors.wifiPassword = ''
	}
	if (field === 'shopName' || !field) {
		if (!shop) errors.shopName = '请输入店铺名称'
		else if (shop.length < 2) errors.shopName = '店铺名称至少 2 个字符'
		else errors.shopName = ''
	}
}

/** 提交前全量校验 */
function validateForm() {
	validateField('wifiName')
	validateField('wifiPassword')
	validateField('shopName')
	return !errors.wifiName && !errors.wifiPassword && !errors.shopName
}

async function refreshLocation() {
	locating.value = true
	locError.value = ''
	try {
		const loc = await getUserLocation()
		latitude.value = loc.latitude
		longitude.value = loc.longitude
		if (loc.isDefault) {
			locError.value = '已使用默认坐标，建议开启定位权限'
		}
	} catch (err) {
		locError.value = '定位失败，将使用默认坐标'
		const loc = await getUserLocation({ useDefaultOnFail: true })
		latitude.value = loc.latitude
		longitude.value = loc.longitude
	} finally {
		locating.value = false
	}
}

function clearErrors() {
	errors.wifiName = ''
	errors.wifiPassword = ''
	errors.shopName = ''
}

function resetForm() {
	form.value.wifiName = ''
	form.value.wifiPassword = ''
	form.value.shopName = ''
	uploadSuccess.value = false
	clearErrors()
}

function notifyListRefresh() {
	try {
		invalidateNearbyCache()
		uni.$emit(WIFI_LIST_REFRESH_EVENT)
		uni.$emit(MERCHANT_REFRESH_EVENT)
		uni.$emit(MY_WIFI_REFRESH_EVENT)
	} catch (e) {
		// 静默失败
	}
}

/**
 * 上传到 uniCloud wifi_list 集合（createTime 由云函数写入）
 */
async function submitUpload() {
	if (uploadSuccess.value) {
		resetForm()
		await refreshLocation()
		return
	}

	if (!validateForm()) {
		uni.showToast({ title: '请完善表单信息', icon: 'none' })
		return
	}

	if (!isLoggedIn()) {
		uni.showModal({
			title: '请先登录',
			content: '上传共享 WiFi 需微信登录，以便记录 creatorOpenid',
			confirmText: '去登录',
			success: (res) => {
				if (res.confirm) uni.navigateTo({ url: '/pages/login/login' })
			}
		})
		return
	}

	if (latitude.value == null || longitude.value == null) {
		await refreshLocation()
		if (latitude.value == null) {
			uni.showToast({ title: '无法获取位置，请稍后重试', icon: 'none' })
			return
		}
	}

	const wifiName = form.value.wifiName.trim()
	const wifiPassword = form.value.wifiPassword.trim()
	const shopName = form.value.shopName.trim()

	submitting.value = true
	try {
		const data = await addWifi({
			wifiName,
			wifiPassword,
			shopName,
			latitude: latitude.value,
			longitude: longitude.value,
			signal: '强'
		})

		if (!data || !data._id) {
			uni.showToast({
				title: '共享失败，请先登录后重试',
				icon: 'none',
				duration: 3000
			})
			return
		}

		uploadSuccess.value = true
		notifyListRefresh()

		uni.showToast({ title: '共享成功', icon: 'success', duration: 2000 })
	} catch (err) {
		uni.showToast({ title: err.message || '共享失败', icon: 'none' })
	} finally {
		submitting.value = false
	}
}

function goHome() {
	notifyListRefresh()
	uni.switchTab({ url: '/pages/index/index' })
}

function goNearby() {
	notifyListRefresh()
	uni.switchTab({ url: '/pages/nearby/nearby' })
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.upload-hero {
	position: relative;
	overflow: hidden;

	&__badge {
		display: inline-block;
		margin-bottom: 16rpx;
		padding: 8rpx 20rpx;
		font-size: 22rpx;
		color: $gold;
		border: 1px solid $border-gold;
		border-radius: $radius-full;
		background: rgba(200, 0, 0, 0.25);
	}
}

.tech-card {
	border: 1px solid rgba(255, 215, 0, 0.2);
	box-shadow: $shadow-card;
}

.required {
	color: $gold;
}

.form-item {
	margin-bottom: 24rpx;

	&--error .form-item__label {
		color: #ff6b6b;
	}

	&__label {
		display: block;
		margin-bottom: 12rpx;
		font-size: 26rpx;
		color: $text-secondary;
	}

	&__error {
		display: block;
		margin-top: 8rpx;
		font-size: 24rpx;
		color: #ff6b6b;
	}
}

.input-field--error {
	border-color: rgba(255, 77, 79, 0.8) !important;
}

.location-box {
	margin: 20rpx 0;
	padding: 24rpx;
	background: rgba(0, 0, 0, 0.25);
	border-radius: $radius-md;
	border: 1px solid $border-color;

	&__row {
		display: flex;
		justify-content: space-between;
		padding: 12rpx 0;
		font-size: 26rpx;
	}

	&__label {
		color: $text-secondary;
	}

	&__value {
		color: $gold;
		font-family: monospace;
	}

	&__status {
		margin-top: 16rpx;
		padding-top: 16rpx;
		border-top: 1rpx solid $border-color;
	}
}

.status-text {
	font-size: 24rpx;

	&--loading {
		color: $text-secondary;
	}

	&--ok {
		color: #52c41a;
	}

	&--warn {
		color: $gold;
	}
}

.success-card {
	text-align: center;
	border: 1px solid $border-gold;
	box-shadow: $shadow-gold;

	&__icon {
		width: 80rpx;
		height: 80rpx;
		line-height: 80rpx;
		margin: 0 auto 20rpx;
		font-size: 40rpx;
		color: #fff;
		background: linear-gradient(135deg, $primary-color, $primary-light);
		border-radius: 50%;
	}
}

.upload-btn {
	margin-top: 32rpx;
	box-shadow: 0 8rpx 24rpx rgba(200, 0, 0, 0.4);
}

.action-row {
	display: flex;
	gap: 20rpx;
	margin-top: 24rpx;

	&__btn {
		flex: 1;
	}
}
</style>
