<template>
	<view class="page-container">
		<custom-navbar title="登录" :show-back="true" />
		<view class="page-content login-content">
			<view class="login-logo">
				<text class="logo-icon">📶</text>
				<text class="logo-text">智连WiFi</text>
				<text class="logo-desc">WiFi共享平台</text>
			</view>

			<view class="card login-card">
				<input v-model="phone" class="input-field" type="number" maxlength="11" placeholder="请输入手机号" />
				<view class="code-row">
					<input v-model="code" class="input-field code-input" type="number" maxlength="6" placeholder="验证码" />
					<button class="code-btn" size="mini" @click="sendCode">{{ codeText }}</button>
				</view>
				<button class="btn-primary btn-block" @click="doLogin">登录 / 注册</button>
			</view>

			<button class="wx-login-btn" @click="wxLogin">
				<text class="wx-icon">💬</text>
				<text>微信一键登录</text>
			</button>

			<view class="agreement">
				登录即表示同意《用户协议》和《隐私政策》
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import CustomNavbar from '@/components/custom-navbar/custom-navbar.vue'

const phone = ref('')
const code = ref('')
const codeText = ref('获取验证码')

function sendCode() {
	if (!phone.value || phone.value.length !== 11) {
		uni.showToast({ title: '请输入正确手机号', icon: 'none' })
		return
	}
	codeText.value = '60s'
	uni.showToast({ title: '验证码已发送', icon: 'none' })
}

function doLogin() {
	if (!phone.value || !code.value) {
		uni.showToast({ title: '请填写登录信息', icon: 'none' })
		return
	}
	uni.showToast({ title: '登录成功', icon: 'success' })
	setTimeout(() => uni.navigateBack(), 1500)
}

function wxLogin() {
	uni.showToast({ title: '微信登录成功', icon: 'success' })
	setTimeout(() => uni.navigateBack(), 1500)
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.login-content {
	padding-top: 60rpx;
}

.login-logo {
	text-align: center;
	margin-bottom: 60rpx;

	.logo-icon {
		font-size: 100rpx;
		display: block;
	}

	.logo-text {
		font-size: 48rpx;
		font-weight: 700;
		color: $primary-color;
		display: block;
		margin-top: 16rpx;
	}

	.logo-desc {
		font-size: 26rpx;
		color: $text-secondary;
		margin-top: 8rpx;
		display: block;
	}
}

.login-card {
	margin-top: 0;
}

.code-row {
	display: flex;
	align-items: center;
	gap: 16rpx;

	.code-input {
		flex: 1;
		margin-bottom: 0;
	}
}

.code-btn {
	background: rgba(22, 119, 255, 0.1) !important;
	color: $primary-color !important;
	border: none !important;
	font-size: 24rpx !important;
	white-space: nowrap;
	margin: 0 !important;
	line-height: 88rpx !important;
	height: 88rpx !important;
	border-radius: $radius-sm !important;
}

.wx-login-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	background: #07c160;
	color: #fff;
	border-radius: $radius-btn;
	height: 88rpx;
	margin-top: 30rpx;
	font-size: 30rpx;
	border: none;

	.wx-icon {
		margin-right: 12rpx;
		font-size: 36rpx;
	}
}

.agreement {
	text-align: center;
	font-size: 22rpx;
	color: $text-placeholder;
	margin-top: 40rpx;
}
</style>
