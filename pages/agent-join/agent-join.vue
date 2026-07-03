<template>
	<view class="page-container">
		<custom-navbar title="代理入驻" :show-back="true" />
		<view class="page-content">
			<view class="hero-card">
				<view class="hero-card__title">城市代理</view>
				<view class="hero-card__desc">推广商家部署 WiFi，获得长期广告分成</view>
			</view>

			<view class="card">
				<view class="card__title">代理资料</view>
				<input v-model="form.name" class="input-field" placeholder="姓名" />
				<input v-model="form.phone" class="input-field" type="number" placeholder="手机号" />
				<input v-model="form.city" class="input-field" placeholder="代理城市" />
				<input v-model="form.wechat" class="input-field" placeholder="提现微信账号（选填）" />
				<button class="btn-primary btn-block" :loading="saving" @click="submit">
					保存并进入代理后台
				</button>
			</view>

			<view class="card">
				<view class="benefit-row" v-for="item in benefits" :key="item.title">
					<image class="benefit-row__icon" :src="item.icon" mode="aspectFit" />
					<view class="benefit-row__body">
						<view class="benefit-row__title">{{ item.title }}</view>
						<view class="benefit-row__desc">{{ item.desc }}</view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import CustomNavbar from '@/components/custom-navbar/custom-navbar.vue'
import { getAgentProfile, saveAgentProfile } from '@/utils/agent-db.js'

const form = ref({
	name: '',
	phone: '',
	city: '',
	wechat: ''
})
const saving = ref(false)
const benefits = [
	{ icon: '/static/icons/benefit-wifi.png', title: '部署 WiFi', desc: '代理可上传 WiFi 并绑定真实商家' },
	{ icon: '/static/icons/benefit-revenue.png', title: '代理收益', desc: '顾客看广告后，代理分成自动累计' },
	{ icon: '/static/icons/benefit-chart.png', title: '数据看板', desc: '查看名下商家、WiFi 和连接数据' }
]

async function loadProfile() {
	const profile = await getAgentProfile()
	if (!profile) return
	form.value = {
		name: profile.name || '',
		phone: profile.phone || '',
		city: profile.city || '',
		wechat: profile.wechat || ''
	}
}

async function submit() {
	if (!form.value.name || !form.value.phone || !form.value.city) {
		uni.showToast({ title: '请填写姓名、手机号和城市', icon: 'none' })
		return
	}
	saving.value = true
	try {
		await saveAgentProfile(form.value)
		uni.showToast({ title: '保存成功', icon: 'success' })
		uni.redirectTo({ url: '/pages/agent-dashboard/agent-dashboard' })
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

.benefit-row {
	display: flex;
	align-items: center;
	padding: 24rpx 0;
	border-bottom: 1rpx solid $border-color;

	&:last-child {
		border-bottom: none;
	}

	&__icon {
		width: 42rpx;
		height: 42rpx;
		margin-right: 20rpx;
		flex-shrink: 0;
	}

	&__body {
		flex: 1;
		min-width: 0;
	}

	&__title {
		font-size: 28rpx;
		font-weight: 600;
		color: $text-primary;
	}

	&__desc {
		margin-top: 8rpx;
		font-size: 24rpx;
		color: $text-secondary;
		line-height: 1.5;
	}
}
</style>
