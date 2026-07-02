<template>
	<view class="page-container">
		<custom-navbar title="商家入驻" :show-back="true" />
		<view v-if="checking" class="page-content">
			<view class="list-loading">加载中...</view>
		</view>
		<view v-else class="page-content">
			<view class="hero-card">
				<view class="hero-card__title">商家入驻</view>
				<view class="hero-card__desc">共享WiFi · 引流获客 · 赚取收益</view>
			</view>

			<view class="card">
				<view class="card__title">入驻优势</view>
				<view class="benefit-item" v-for="(item, i) in benefits" :key="i">
					<image class="benefit-icon" :src="item.icon" mode="aspectFit" />
					<view class="benefit-info">
						<view class="benefit-title">{{ item.title }}</view>
						<view class="benefit-desc">{{ item.desc }}</view>
					</view>
				</view>
			</view>

			<view class="card">
				<view class="card__title">填写入驻信息</view>
				<input v-model="form.shopName" class="input-field" placeholder="店铺名称" />
				<input v-model="form.contact" class="input-field" placeholder="联系人姓名" />
				<input v-model="form.phone" class="input-field" type="number" placeholder="联系电话" />
				<input v-model="form.address" class="input-field" placeholder="店铺地址" />
				<button class="btn-primary btn-block" :loading="submitting" @click="submitJoin">提交入驻申请</button>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import CustomNavbar from '@/components/custom-navbar/custom-navbar.vue'
import { getMerchantProfile, saveMerchantProfile } from '@/utils/merchant-db.js'
import { MERCHANT_REFRESH_EVENT } from '@/utils/cloud-config.js'

const form = ref({ shopName: '', contact: '', phone: '', address: '' })
const submitting = ref(false)
const checking = ref(true)

async function checkExistingProfile() {
	checking.value = true
	try {
		const profile = await getMerchantProfile()
		if (profile && profile._id) {
			uni.redirectTo({ url: '/pages/merchant-dashboard/merchant-dashboard' })
			return
		}
	} catch (err) {
		// 查询失败时仍展示入驻表单
	} finally {
		checking.value = false
	}
}

onShow(() => checkExistingProfile())

const benefits = ref([
	{ icon: '/static/icons/benefit-wifi.png', title: 'WiFi共享', desc: '一键生成WiFi码，顾客扫码即连' },
	{ icon: '/static/icons/benefit-revenue.png', title: '平台收益', desc: '用户连接WiFi，商家获得平台服务收益' },
	{ icon: '/static/icons/benefit-target.png', title: '精准引流', desc: '连接WiFi后推送店铺优惠活动' },
	{ icon: '/static/icons/benefit-chart.png', title: '数据看板', desc: '实时查看连接数据和收益报表' }
])

async function submitJoin() {
	if (!form.value.shopName || !form.value.phone) {
		uni.showToast({ title: '请填写完整信息', icon: 'none' })
		return
	}
	submitting.value = true
	try {
		await saveMerchantProfile({
			shopName: form.value.shopName,
			contact: form.value.contact,
			phone: form.value.phone,
			address: form.value.address
		})
		uni.$emit(MERCHANT_REFRESH_EVENT)
		uni.showToast({ title: '申请已提交', icon: 'success' })
		setTimeout(() => {
			uni.navigateTo({ url: '/pages/merchant-dashboard/merchant-dashboard' })
		}, 800)
	} catch (err) {
		uni.showToast({ title: err.message || '提交失败', icon: 'none' })
	} finally {
		submitting.value = false
	}
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.benefit-item {
	display: flex;
	align-items: flex-start;
	padding: 20rpx 0;
	border-bottom: 1rpx solid $border-color;

	&:last-child {
		border-bottom: none;
	}
}

.benefit-icon {
	width: 80rpx;
	height: 80rpx;
	margin-right: 20rpx;
	flex-shrink: 0;
}

.benefit-title {
	font-size: 28rpx;
	font-weight: 600;
	color: $text-primary;
}

.benefit-desc {
	font-size: 24rpx;
	color: $text-secondary;
	margin-top: 6rpx;
}
</style>
