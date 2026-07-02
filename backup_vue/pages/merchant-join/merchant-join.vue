<template>
	<view class="page-container">
		<custom-navbar title="商家入驻" :show-back="true" />
		<view class="page-content">
			<view class="hero-card">
				<view class="hero-card__title">商家入驻</view>
				<view class="hero-card__desc">共享WiFi · 引流获客 · 赚取收益</view>
			</view>

			<view class="card">
				<view class="card__title">入驻优势</view>
				<view class="benefit-item" v-for="(item, i) in benefits" :key="i">
					<text class="benefit-icon">{{ item.icon }}</text>
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
				<button class="btn-primary btn-block" @click="submitJoin">提交入驻申请</button>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import CustomNavbar from '@/components/custom-navbar/custom-navbar.vue'

const form = ref({ shopName: '', contact: '', phone: '', address: '' })

const benefits = ref([
	{ icon: '📶', title: 'WiFi共享', desc: '一键生成WiFi码，顾客扫码即连' },
	{ icon: '💰', title: '广告收益', desc: '用户观看广告，商家获得分成' },
	{ icon: '🎯', title: '精准引流', desc: '连接WiFi后推送店铺优惠活动' },
	{ icon: '📊', title: '数据看板', desc: '实时查看连接数据和收益报表' }
])

function submitJoin() {
	if (!form.value.shopName || !form.value.phone) {
		uni.showToast({ title: '请填写完整信息', icon: 'none' })
		return
	}
	uni.showToast({ title: '申请已提交', icon: 'success' })
	setTimeout(() => {
		uni.navigateTo({ url: '/pages/merchant-dashboard/merchant-dashboard' })
	}, 1500)
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
	font-size: 40rpx;
	margin-right: 20rpx;
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
