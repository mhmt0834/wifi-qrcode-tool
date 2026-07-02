<template>
	<view class="page-container">
		<custom-navbar title="商家设置" :show-back="true" />
		<view class="page-content">
			<view v-if="pageLoading" class="list-loading">加载中...</view>
			<template v-else>
				<view class="card">
					<view class="card__title">店铺信息</view>
					<view class="form-item">
						<text class="form-label">店铺名称</text>
						<input v-model="form.shopName" class="form-input" placeholder="请输入店铺名称" />
					</view>
					<view class="form-item">
						<text class="form-label">联系人</text>
						<input v-model="form.contact" class="form-input" placeholder="请输入联系人" />
					</view>
					<view class="form-item">
						<text class="form-label">联系电话</text>
						<input v-model="form.phone" class="form-input" type="number" placeholder="请输入联系电话" />
					</view>
					<view class="form-item">
						<text class="form-label">店铺地址</text>
						<input v-model="form.address" class="form-input" placeholder="请输入店铺地址" />
					</view>
				</view>

				<view class="card">
					<view class="card__title">WiFi设置</view>
					<view class="setting-row">
						<text>默认开启密码保护</text>
						<switch :checked="form.defaultAd" @change="form.defaultAd = $event.detail.value" color="#d4af37" />
					</view>
					<view class="setting-row">
						<text>连接成功推送优惠</text>
						<switch :checked="form.pushDeal" @change="form.pushDeal = $event.detail.value" color="#d4af37" />
					</view>
					<view class="setting-row">
						<text>收益自动提现</text>
						<switch :checked="form.autoWithdraw" @change="form.autoWithdraw = $event.detail.value" color="#d4af37" />
					</view>
				</view>

				<view class="card">
					<view class="card__title">提现账户</view>
					<view class="form-item">
						<text class="form-label">微信账号</text>
						<input v-model="form.wechat" class="form-input" placeholder="绑定微信收款账号" />
					</view>
				</view>

				<button class="btn-primary btn-block" style="margin-top:30rpx" :loading="saving" @click="saveSettings">
					保存设置
				</button>
			</template>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import CustomNavbar from '@/components/custom-navbar/custom-navbar.vue'
import { getMerchantProfile, saveMerchantProfile } from '@/utils/merchant-db.js'
import { getStoredUser } from '@/utils/user-store.js'
import { MERCHANT_REFRESH_EVENT } from '@/utils/cloud-config.js'

const pageLoading = ref(false)
const saving = ref(false)
const form = ref({
	shopName: '',
	contact: '',
	phone: '',
	address: '',
	defaultAd: true,
	pushDeal: true,
	autoWithdraw: false,
	wechat: ''
})

function applyProfile(profile) {
	if (!profile) {
		const user = getStoredUser()
		if (user && user.nickname) {
			form.value.contact = user.nickname
		}
		return
	}
	form.value = {
		shopName: profile.shopName || '',
		contact: profile.contact || '',
		phone: profile.phone || '',
		address: profile.address || '',
		defaultAd: profile.defaultAd !== false,
		pushDeal: profile.pushDeal !== false,
		autoWithdraw: !!profile.autoWithdraw,
		wechat: profile.wechat || ''
	}
}

async function loadProfile() {
	pageLoading.value = true
	try {
		const profile = await getMerchantProfile()
		applyProfile(profile)
	} catch (err) {
		// 静默失败
	} finally {
		pageLoading.value = false
	}
}

async function saveSettings() {
	if (!form.value.shopName || !form.value.phone) {
		uni.showToast({ title: '请填写店铺名称和电话', icon: 'none' })
		return
	}
	saving.value = true
	try {
		await saveMerchantProfile({ ...form.value })
		uni.showToast({ title: '设置已保存', icon: 'success' })
		uni.$emit(MERCHANT_REFRESH_EVENT)
	} catch (err) {
		uni.showToast({ title: err.message || '保存失败', icon: 'none' })
	} finally {
		saving.value = false
	}
}

onShow(() => loadProfile())
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.form-item {
	padding: 20rpx 0;
	border-bottom: 1rpx solid $border-color;

	&:last-child {
		border-bottom: none;
	}
}

.form-label {
	font-size: 26rpx;
	color: $text-secondary;
	display: block;
	margin-bottom: 12rpx;
}

.form-input {
	height: 72rpx;
	background: $bg-input;
	border-radius: $radius-sm;
	padding: 0 20rpx;
	font-size: 28rpx;
}

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
</style>
