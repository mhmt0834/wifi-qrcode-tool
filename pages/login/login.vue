<template>
	<view class="page-container">
		<custom-navbar title="登录" :show-back="true" />
		<view class="page-content login-content">
			<view class="login-logo">
				<image class="logo-icon" src="/static/icons/login-wifi.png" mode="aspectFit" />
				<text class="logo-text">智连WiFi</text>
				<text class="logo-desc">新版授权 · 选择头像 + 输入昵称</text>
			</view>

			<!-- 已登录：可修改资料 -->
			<view v-if="isLogin" class="card profile-card">
				<view class="card__title gold-title">我的资料</view>
				<profile-editor
					:avatar="formAvatar"
					:nickname="formNickname"
					@choose-avatar="onChooseAvatar"
					@update:nickname="formNickname = $event"
				/>
				<button class="btn-primary btn-block" :loading="saving" @click="saveProfile">保存修改</button>
				<button class="btn-outline btn-block logout-btn" @click="handleLogout">退出登录</button>
			</view>

			<!-- 未登录：登录表单 -->
			<view v-else class="card profile-card">
				<view class="card__title gold-title">完善资料后登录</view>
				<view class="step-tip">① 选择头像 ② 输入昵称 ③ 完成登录</view>
				<profile-editor
					:avatar="formAvatar"
					:nickname="formNickname"
					@choose-avatar="onChooseAvatar"
					@update:nickname="formNickname = $event"
				/>
				<button class="wx-login-btn" :loading="loggingIn" @click="doLogin">完成登录</button>
			</view>

			<view class="agreement">
				<text>登录即表示同意</text>
				<text class="agreement-link" @click.stop="goAgreement">《用户协议》</text>
				<text>和</text>
				<text class="agreement-link" @click.stop="goPrivacy">《隐私政策》</text>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import CustomNavbar from '@/components/custom-navbar/custom-navbar.vue'
import ProfileEditor from '@/components/profile-editor/profile-editor.vue'
import {
	getStoredUser,
	isLoggedIn as checkLoggedIn,
	loginWithProfile,
	updateUserProfile,
	logout
} from '@/utils/auth.js'
import { toastMessage } from '@/utils/cloud-config.js'

const isLogin = ref(false)
const formNickname = ref('')
const formAvatar = ref('')
const loggingIn = ref(false)
const saving = ref(false)

function syncUser() {
	isLogin.value = checkLoggedIn()
	const user = getStoredUser()
	if (user) {
		formNickname.value = user.nickname || ''
		formAvatar.value = user.avatar || ''
	}
}

function onChooseAvatar(url) {
	formAvatar.value = url
}

async function doLogin() {
	if (loggingIn.value) return
	loggingIn.value = true
	try {
		await loginWithProfile({
			nickname: formNickname.value,
			avatar: formAvatar.value
		})
		syncUser()
		uni.showToast({ title: '登录成功', icon: 'success' })
		setTimeout(() => uni.navigateBack(), 1200)
	} catch (err) {
		uni.showToast({ title: toastMessage(err, '登录失败'), icon: 'none' })
	} finally {
		loggingIn.value = false
	}
}

async function saveProfile() {
	if (saving.value) return
	saving.value = true
	try {
		await updateUserProfile({
			nickname: formNickname.value,
			avatar: formAvatar.value
		})
		syncUser()
		uni.showToast({ title: '保存成功', icon: 'success' })
	} catch (err) {
		uni.showToast({ title: toastMessage(err, '保存失败'), icon: 'none' })
	} finally {
		saving.value = false
	}
}

function handleLogout() {
	logout()
	syncUser()
	formNickname.value = ''
	formAvatar.value = ''
}

function goAgreement() {
	uni.navigateTo({ url: '/pages/agreement/agreement' })
}

function goPrivacy() {
	uni.navigateTo({ url: '/pages/privacy/privacy' })
}

onShow(() => {
	syncUser()
})
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.login-content {
	padding-top: 40rpx;
}

.login-logo {
	text-align: center;
	margin-bottom: 40rpx;

	.logo-icon {
		width: 120rpx;
		height: 120rpx;
		display: block;
		margin: 0 auto;
	}

	.logo-text {
		display: block;
		font-size: 44rpx;
		font-weight: 700;
		color: $gold;
		margin-top: 16rpx;
	}

	.logo-desc {
		display: block;
		font-size: 24rpx;
		color: $text-secondary;
		margin-top: 10rpx;
	}
}

.profile-card {
	border: 1px solid rgba(255, 215, 0, 0.2);
}

.step-tip {
	font-size: 24rpx;
	color: $text-muted;
	margin-bottom: 24rpx;
	line-height: 1.5;
}

.wx-login-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 96rpx;
	margin-top: 32rpx;
	background: linear-gradient(135deg, $primary-color, $primary-light);
	color: #fff;
	border-radius: $radius-full;
	font-size: 32rpx;
	font-weight: 600;
	border: none;
	box-shadow: 0 8rpx 24rpx rgba(200, 0, 0, 0.4);
}

.logout-btn {
	margin-top: 20rpx;
}

.agreement {
	text-align: center;
	font-size: 22rpx;
	color: $text-muted;
	margin-top: 40rpx;
	line-height: 1.6;
}

.agreement-link {
	color: $gold;
}
</style>
