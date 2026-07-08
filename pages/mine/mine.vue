<template>
	<view class="page-container">
		<custom-navbar title="我的" />
		<view class="page-content">
			<!-- 已登录：展示 + 编辑 -->
			<view v-if="isLogin" class="user-card">
				<image
					v-if="userInfo.avatar"
					class="user-avatar user-avatar--img"
					:src="userInfo.avatar"
					mode="aspectFill"
				/>
				<view v-else class="user-avatar">👤</view>
				<view class="user-info">
					<view class="user-name">{{ userInfo.nickname }}</view>
					<view class="user-desc">已登录</view>
					<view class="user-openid-panel">
						<text class="user-openid-label">OpenID</text>
						<text class="user-openid-value">{{ userInfo.openid || openidFallbackText }}</text>
						<button
							class="openid-copy-btn"
							:class="{ 'openid-copy-btn--disabled': !userInfo.openid }"
							size="mini"
							:disabled="!userInfo.openid"
							@click.stop="copyOpenid"
						>复制</button>
					</view>
				</view>
			</view>

			<!-- 仅开发版显示 openid 调试 -->
			<view v-if="isLogin && showDebugOpenid" class="card debug-card">
				<view class="card__title gold-title">调试 · openid</view>
				<text class="debug-openid" selectable @click="copyOpenid">{{ userInfo.openid || '点击下方按钮获取' }}</text>
				<button class="btn-outline btn-block debug-btn" size="mini" :loading="fetchingOpenid" @click="testFetchOpenid">
					从云函数拉取 OPENID
				</button>
				<button v-if="userInfo.openid" class="btn-outline btn-block debug-btn" size="mini" @click="copyOpenid">
					复制 OPENID
				</button>
			</view>

			<!-- 未登录：引导登录（勿用 v-else 接在调试区后面，否则已登录体验版会误显示本卡片） -->
			<view v-if="!isLogin" class="user-card user-card--guest" @click="goLogin">
				<view class="user-avatar">
					<image class="user-avatar__icon" src="/static/icons/login.png" mode="aspectFit" />
				</view>
				<view class="user-info">
					<view class="user-name">点击登录</view>
					<view class="user-desc">选择头像 + 输入昵称完成登录</view>
				</view>
				<text class="list-item__arrow">›</text>
			</view>

			<view class="stat-grid">
				<view class="stat-item stat-item--highlight">
					<view class="stat-item__value">{{ stats.wifiCount }}</view>
					<view class="stat-item__label">我的共享WiFi</view>
				</view>
				<view class="stat-item">
					<view class="stat-item__value">{{ stats.connectCount }}</view>
					<view class="stat-item__label">连接次数</view>
				</view>
				<view class="stat-item">
					<view class="stat-item__value">{{ stats.dealCount }}</view>
					<view class="stat-item__label">优惠券</view>
				</view>
			</view>

			<!-- 修改头像 / 昵称 -->
			<view v-if="isLogin" class="card profile-card">
				<view class="card__title gold-title">修改资料</view>
				<profile-editor
					:avatar="editAvatar"
					:nickname="editNickname"
					@choose-avatar="editAvatar = $event"
					@update:nickname="editNickname = $event"
				/>
				<button class="btn-primary btn-block" :loading="saving" @click="saveProfile">保存资料</button>
			</view>

			<view class="card menu-card">
				<view class="menu-item" @click="goPage('/pages/my-wifi/my-wifi')">
					<image class="menu-item__icon" src="/static/icons/userwifi.png" mode="aspectFit" />
					<text class="menu-item__text">我的WiFi列表</text>
					<text class="list-item__arrow">›</text>
				</view>
				<view class="menu-item" @click="switchTabUpload">
					<image class="menu-item__icon" src="/static/icons/upload.png" mode="aspectFit" />
					<text class="menu-item__text">上传共享WiFi</text>
					<text class="list-item__arrow">›</text>
				</view>
			</view>

			<view v-if="isLogin && isPlatformAdminUser" class="card menu-card menu-card--admin">
				<view class="menu-item" @click="goPage('/pages/platform-privilege/platform-privilege')">
					<image class="menu-item__icon" src="/static/icons/benefit-wifi.png" mode="aspectFit" />
					<text class="menu-item__text menu-item__text--gold">WiFi自由审核</text>
					<text class="list-item__arrow">›</text>
				</view>
			</view>

			<view class="card menu-card menu-card--policy">
				<view class="menu-item" @click="goPrivacy">
					<view class="menu-item__badge">隐</view>
					<text class="menu-item__text menu-item__text--gold">隐私政策</text>
					<text class="list-item__arrow">›</text>
				</view>
				<view class="menu-item" @click="goAgreement">
					<view class="menu-item__badge">协</view>
					<text class="menu-item__text menu-item__text--gold">用户协议</text>
					<text class="list-item__arrow">›</text>
				</view>
				<view class="menu-item" @click="goContact">
					<image class="menu-item__icon" src="/static/icons/shop.png" mode="aspectFit" />
					<text class="menu-item__text menu-item__text--gold">联系我们</text>
					<text class="list-item__arrow">›</text>
				</view>
			</view>

			<view v-if="isLogin" class="card menu-card">
				<view class="menu-item menu-item--danger" @click="handleLogout">
					<image class="menu-item__icon" src="/static/icons/logout.png" mode="aspectFit" />
					<text class="menu-item__text menu-item__text--danger">退出登录</text>
				</view>
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
	getOpenid,
	updateUserProfile,
	fetchMyWifiCount,
	logout,
	refreshUserProfile,
	fetchOpenidFromCloud
} from '@/utils/auth.js'
import { saveStoredUser, getStoredUser as readStoredUser } from '@/utils/user-store.js'
import { toastMessage } from '@/utils/cloud-config.js'
import { isDevelopMiniProgram } from '@/utils/mp-env.js'
import { checkPlatformAdminRole } from '@/utils/admin-db.js'

const showDebugOpenid = isDevelopMiniProgram()
const isLogin = ref(false)
const userInfo = ref({ nickname: '', avatar: '', openid: '' })
const editNickname = ref('')
const editAvatar = ref('')
const stats = ref({ connectCount: 0, wifiCount: 0, dealCount: 0 })
const saving = ref(false)
const fetchingOpenid = ref(false)
const openidLoading = ref(false)
const openidFallbackText = ref('获取中...')
const isPlatformAdminUser = ref(false)

function syncLocalUser() {
	const user = getStoredUser()
	isLogin.value = checkLoggedIn()
	if (user) {
		userInfo.value = {
			nickname: user.nickname || '',
			avatar: user.avatar || '',
			openid: user.openid || ''
		}
		editNickname.value = user.nickname || ''
		editAvatar.value = user.avatar || ''
	} else {
		userInfo.value = { nickname: '', avatar: '', openid: '' }
		editNickname.value = ''
		editAvatar.value = ''
		openidFallbackText.value = '获取中...'
	}
}

function saveOpenidToLocal(openid) {
	const value = String(openid || '').trim()
	if (!value) return false
	userInfo.value = { ...userInfo.value, openid: value }
	const stored = readStoredUser()
	if (stored) {
		saveStoredUser({ ...stored, openid: value })
	}
	openidFallbackText.value = ''
	return true
}

async function ensureOpenidLoaded(silent = true) {
	if (!isLogin.value || userInfo.value.openid || openidLoading.value) return
	openidLoading.value = true
	openidFallbackText.value = '获取中...'
	try {
		const openid = await fetchOpenidFromCloud()
		saveOpenidToLocal(openid)
	} catch (err) {
		openidFallbackText.value = '获取失败'
		if (!silent) {
			uni.showToast({ title: toastMessage(err, '获取失败'), icon: 'none' })
		}
	} finally {
		openidLoading.value = false
	}
}

async function testFetchOpenid() {
	if (fetchingOpenid.value) return
	fetchingOpenid.value = true
	try {
		const openid = await fetchOpenidFromCloud()
		saveOpenidToLocal(openid)
		uni.setClipboardData({
			data: openid,
			success: () => {
				uni.showModal({
					title: 'OPENID 已复制',
					content: openid,
					showCancel: false
				})
			}
		})
	} catch (err) {
		uni.showToast({ title: toastMessage(err, '获取失败'), icon: 'none' })
	} finally {
		fetchingOpenid.value = false
	}
}

function copyOpenid() {
	const openid = userInfo.value.openid
	if (!openid) {
		uni.showToast({ title: '请先获取 openid', icon: 'none' })
		return
	}
	uni.setClipboardData({
		data: openid,
		success: () => uni.showToast({ title: 'openid 已复制', icon: 'success' })
	})
}

async function loadStats() {
	if (!isLogin.value) {
		stats.value = { connectCount: 0, wifiCount: 0, dealCount: 0 }
		return
	}
	const count = await fetchMyWifiCount()
	stats.value = { ...stats.value, wifiCount: count }
}

async function loadAdminRole() {
	if (!isLogin.value) {
		isPlatformAdminUser.value = false
		return
	}
	isPlatformAdminUser.value = await checkPlatformAdminRole()
}

async function saveProfile() {
	if (saving.value) return
	saving.value = true
	try {
		await updateUserProfile({
			nickname: editNickname.value,
			avatar: editAvatar.value
		})
		syncLocalUser()
		uni.showToast({ title: '保存成功', icon: 'success' })
	} catch (err) {
		uni.showToast({ title: toastMessage(err, '保存失败'), icon: 'none' })
	} finally {
		saving.value = false
	}
}

function goLogin() {
	uni.navigateTo({ url: '/pages/login/login' })
}

function handleLogout() {
	uni.showModal({
		title: '退出登录',
		content: '确定退出当前账号？',
		success: (res) => {
			if (res.confirm) {
				logout()
				syncLocalUser()
				loadStats()
			}
		}
	})
}

function goPage(url) {
	if (!isLogin.value) {
		uni.showToast({ title: '请先登录', icon: 'none' })
		return
	}
	uni.navigateTo({ url })
}

function switchTabUpload() {
	uni.switchTab({ url: '/pages/upload/index' })
}

function goPrivacy() {
	uni.navigateTo({ url: '/pages/privacy/privacy' })
}

function goAgreement() {
	uni.navigateTo({ url: '/pages/agreement/agreement' })
}

function goContact() {
	uni.navigateTo({ url: '/pages/contact/contact' })
}

onShow(() => {
	syncLocalUser()
	loadStats()
	loadAdminRole()
	if (isLogin.value) {
		ensureOpenidLoaded()
		refreshUserProfile()
			.then(() => {
				syncLocalUser()
				ensureOpenidLoaded()
			})
			.catch(() => {
				ensureOpenidLoaded()
			})
	}
})
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.page-content {
	padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
}

.user-card {
	display: flex;
	align-items: center;
	background: $primary-gradient;
	border-radius: $radius-lg;
	padding: 40rpx 30rpx;
	box-shadow: $shadow-btn;
	margin-bottom: 8rpx;

	&--guest:active {
		opacity: 0.9;
	}

	.user-avatar {
		width: 100rpx;
		height: 100rpx;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 48rpx;
		margin-right: 24rpx;
		flex-shrink: 0;

		&--img {
			border: 2rpx solid rgba(255, 215, 0, 0.6);
		}

		&__icon {
			width: 56rpx;
			height: 56rpx;
		}
	}

	.user-info {
		flex: 1;
		min-width: 0;
	}

	.user-name {
		font-size: 36rpx;
		font-weight: 600;
		color: #fff;
	}

	.user-desc {
		font-size: 22rpx;
		color: rgba(255, 255, 255, 0.75);
		margin-top: 8rpx;
	}

	.user-openid-panel {
		display: flex;
		align-items: center;
		margin-top: 14rpx;
		min-width: 0;
	}

	.user-openid-label {
		font-size: 20rpx;
		color: rgba(255, 255, 255, 0.82);
		margin-right: 8rpx;
		flex-shrink: 0;
	}

	.user-openid-value {
		flex: 1;
		min-width: 0;
		font-size: 20rpx;
		color: rgba(255, 255, 255, 0.9);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.openid-copy-btn {
		width: 72rpx;
		height: 40rpx;
		line-height: 40rpx;
		margin-left: 12rpx;
		padding: 0;
		border-radius: 999rpx;
		background: rgba(255, 255, 255, 0.22);
		color: #fff;
		font-size: 20rpx;
		flex-shrink: 0;
	}

	.openid-copy-btn--disabled {
		opacity: 0.55;
	}

	.openid-copy-btn::after {
		border: none;
	}

	.list-item__arrow {
		color: rgba(255, 255, 255, 0.6);
	}
}

.profile-card {
	border: 1px solid rgba(255, 215, 0, 0.2);
	margin-bottom: 8rpx;
}

.debug-card {
	border: 1px dashed rgba(255, 215, 0, 0.35);
	margin-bottom: 8rpx;
}

.debug-openid {
	display: block;
	font-size: 22rpx;
	color: $gold;
	word-break: break-all;
	line-height: 1.6;
	padding: 12rpx 0;
	font-family: monospace;
}

.debug-btn {
	margin-top: 16rpx;
}

.stat-grid {
	display: flex;
	gap: 16rpx;
	margin: 24rpx 0;

	.stat-item {
		flex: 1;
		background: $bg-card;
		border-radius: $radius-md;
		padding: 28rpx 16rpx;
		text-align: center;
		box-shadow: $shadow-card;

		&--highlight {
			border: 1px solid $border-gold;

			.stat-item__value {
				color: $gold;
			}
		}

		&__value {
			font-size: 40rpx;
			font-weight: 700;
			color: $text-primary;
		}

		&__label {
			font-size: 22rpx;
			color: $text-secondary;
			margin-top: 8rpx;
		}
	}
}

.menu-card {
	padding: 0 30rpx;

	&--policy {
		border: 1px solid rgba(212, 175, 55, 0.25);
		box-shadow: 0 0 16rpx rgba(212, 175, 55, 0.12);
	}

	&--admin {
		border: 1px solid rgba(212, 175, 55, 0.3);
		box-shadow: 0 0 18rpx rgba(212, 175, 55, 0.16);
	}
}

.menu-item {
	display: flex;
	align-items: center;
	padding: 32rpx 0;
	border-bottom: 1rpx solid $border-color;

	&:last-child {
		border-bottom: none;
	}

	&__badge {
		width: 36rpx;
		height: 36rpx;
		margin-right: 20rpx;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 22rpx;
		font-weight: 700;
		color: #d4af37;
		border: 1px solid rgba(212, 175, 55, 0.45);
		border-radius: 8rpx;
		background: rgba(212, 175, 55, 0.1);
	}

	&__icon {
		width: 36rpx;
		height: 36rpx;
		margin-right: 20rpx;
		flex-shrink: 0;
	}

	&__text {
		flex: 1;
		font-size: 30rpx;
		color: $text-primary;

		&--gold {
			color: #d4af37;
			font-weight: 600;
		}

		&--danger {
			color: #ff6b6b;
		}
	}
}
</style>
