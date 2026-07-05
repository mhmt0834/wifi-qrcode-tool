<template>
	<view class="page-container">
		<custom-navbar :title="editMode ? '编辑WiFi' : 'WiFi详情'" :show-back="true" />
		<view class="page-content">
			<view v-if="pageLoading" class="list-loading">加载中...</view>

			<template v-else-if="detail">
				<!-- 查看模式 -->
				<view v-if="!editMode" class="card detail-card">
					<view class="detail-card__head">
						<view class="detail-card__name">{{ detail.name }}</view>
						<text :class="['status-tag', detail.status === '在线' ? 'status-tag--on' : 'status-tag--off']">
							{{ detail.status }}
						</text>
					</view>

					<view class="info-row">
						<text class="info-label">WiFi密码</text>
						<text class="info-value">{{ detail.password || '—' }}</text>
					</view>
					<view class="info-row">
						<text class="info-label">店铺名称</text>
						<text class="info-value">{{ detail.shop || '—' }}</text>
					</view>
					<view class="info-row">
						<text class="info-label">地址</text>
						<text class="info-value">{{ detail.address || '—' }}</text>
					</view>
					<view class="info-row">
						<text class="info-label">介绍</text>
						<text class="info-value">{{ detail.intro || '—' }}</text>
					</view>
					<view class="info-row info-row--tags">
						<text class="info-label">标签</text>
						<view v-if="tagList.length" class="tag-list">
							<text v-for="(t, i) in tagList" :key="i" class="tag-chip">{{ t }}</text>
						</view>
						<text v-else class="info-value">—</text>
					</view>
					<view class="info-row">
						<text class="info-label">创建时间</text>
						<text class="info-value">{{ createTimeText }}</text>
					</view>
					<view class="info-row">
						<text class="info-label">创建者</text>
						<text class="info-value info-value--openid">{{ detail.creatorOpenid || '—' }}</text>
					</view>
					<view class="info-row">
						<text class="info-label">收益商家</text>
						<text class="info-value info-value--openid">{{ detail.merchantOpenid || '未绑定' }}</text>
					</view>
					<view class="info-row">
						<text class="info-label">归属合伙人</text>
						<text class="info-value info-value--openid">{{ detail.agentOpenid || '无合伙人' }}</text>
					</view>
					<view class="stat-row">
						<view class="stat-box">
							<text class="stat-box__val">{{ detail.viewCount }}</text>
							<text class="stat-box__label">浏览次数</text>
						</view>
						<view class="stat-box">
							<text class="stat-box__val">{{ detail.connectCount }}</text>
							<text class="stat-box__label">连接次数</text>
						</view>
						<view class="stat-box">
							<text class="stat-box__val">{{ detail.heat }}</text>
							<text class="stat-box__label">热度</text>
						</view>
					</view>
				</view>

				<!-- 编辑模式 -->
				<view v-else class="card">
					<view class="card__title">编辑信息</view>
					<input v-model="form.wifiName" class="input-field" placeholder="WiFi名称" />
					<input v-model="form.wifiPassword" class="input-field" password placeholder="WiFi密码" />
					<input v-model="form.shopName" class="input-field" placeholder="店铺名称" />
					<input v-model="form.address" class="input-field" placeholder="地址" />
					<textarea
						v-model="form.intro"
						class="textarea-field"
						placeholder="介绍（选填）"
						:maxlength="500"
					/>
					<input v-model="form.tags" class="input-field" placeholder="标签，多个用英文逗号分隔" />
				</view>

				<view v-if="!editMode && detail.canAssignMerchantOpenid" class="card">
					<view class="card__title">商家归属</view>
					<view class="card__desc">收益、连接记录和商家后台管理权将归属于该商家 OpenID</view>
					<input v-model="merchantOpenidInput" class="input-field" placeholder="请输入商家 openid" />
					<button class="btn-primary btn-block" :loading="assigningMerchant" @click="handleAssignMerchant">
						绑定商家
					</button>
				</view>

				<!-- 状态管理 -->
				<view v-if="!editMode" class="card">
					<view class="card__title">状态管理</view>
					<view class="status-switch">
						<view
							:class="['status-btn', detail.status === '在线' ? 'status-btn--active' : '']"
							@click="setStatus('在线')"
						>在线</view>
						<view
							:class="['status-btn', detail.status === '离线' ? 'status-btn--active' : '']"
							@click="setStatus('离线')"
						>离线</view>
					</view>
				</view>

				<!-- 二维码 -->
				<view v-if="!editMode && showQrPanel" class="card qr-card">
					<view class="card__title">WiFi 专属二维码</view>
					<view class="qr-card__path">pages/wifi-detail/wifi-detail?id={{ wifiId }}</view>

					<view v-if="detail.qrCodeUrl && qrDisplayUrl" class="qr-preview">
						<image class="qr-preview__img" :src="qrDisplayUrl" mode="aspectFit" show-menu-by-longpress />
					</view>
					<view v-else class="qr-empty">
						<image class="qr-empty__icon" src="/static/icons/wifi.png" mode="aspectFit" />
						<text class="qr-empty__text">{{ qrEmptyHint }}</text>
						<button
							v-if="detail.qrCodeUrl && !qrDisplayLoading"
							class="btn-outline qr-empty__retry"
							size="mini"
							@click="retryQrDisplay"
						>重新加载图片</button>
					</view>

					<view v-if="detail.qrCodeUrl" class="qr-meta">
						<text>状态：{{ detail.qrCodeStatus || '未生成' }}</text>
						<text>生成时间：{{ qrCreateTimeText }}</text>
					</view>

					<button
						class="btn-primary btn-block"
						:loading="qrGenerating"
						@click="handleGenerateQr"
					>
						{{ detail.qrCodeUrl ? '重新生成二维码' : '生成二维码' }}
					</button>
					<button
						v-if="detail.qrCodeUrl"
						class="btn-outline btn-block"
						:disabled="!qrDisplayUrl"
						@click="handleSaveAlbum"
					>保存到相册</button>
					<button
						v-if="detail.qrCodeUrl"
						class="btn-outline btn-block"
						:disabled="!qrDisplayUrl || posterGenerating"
						:loading="posterGenerating"
						@click="handleSharePoster"
					>分享二维码</button>
				</view>

				<!-- 操作按钮 -->
				<view v-if="!editMode" class="action-group">
					<button class="btn-primary btn-block" @click="editMode = true">编辑</button>
					<button class="btn-outline btn-block" @click="toggleQrPanel">
						{{ showQrPanel ? '收起二维码' : '查看二维码' }}
					</button>
					<button class="btn-danger btn-block" @click="confirmDelete">删除</button>
				</view>
				<view v-else class="action-group">
					<button class="btn-primary btn-block" :loading="saving" @click="saveEdit">保存</button>
					<button class="btn-outline btn-block" @click="cancelEdit">取消</button>
				</view>
			</template>

			<view v-else class="empty-state">
				<image class="empty-state__icon" src="/static/icons/wifi.png" mode="aspectFit" />
				<view class="empty-state__text">WiFi 不存在或无权查看</view>
			</view>
		</view>

		<!-- 离屏画布：分享海报 -->
		<canvas type="2d" id="wifiPosterCanvas" class="poster-canvas" />
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import CustomNavbar from '@/components/custom-navbar/custom-navbar.vue'
import { getMyWifiDetail, updateWifi, deleteWifi, updateWifiStatus, assignWifiMerchant } from '@/utils/wifi-db.js'
import { MY_WIFI_REFRESH_EVENT, MERCHANT_REFRESH_EVENT, WIFI_LIST_REFRESH_EVENT } from '@/utils/cloud-config.js'
import {
	generateWifiQrCode,
	resolveQrImageDisplayUrl,
	saveQrCodeToAlbum,
	isAlbumPermissionDenied,
	isAlbumPrivacyUndeclared
} from '@/utils/wifi-qr.js'
import { createWifiSharePosterInPage, sharePosterImage } from '@/utils/wifi-qr-poster.js'

const wifiId = ref('')
const pageLoading = ref(false)
const editMode = ref(false)
const saving = ref(false)
const detail = ref(null)
const showQrPanel = ref(false)
const qrGenerating = ref(false)
const posterGenerating = ref(false)
const assigningMerchant = ref(false)
const qrDisplayUrl = ref('')
const qrDisplayLoading = ref(false)
const qrDisplayError = ref('')

const form = ref({
	wifiName: '',
	wifiPassword: '',
	shopName: '',
	address: '',
	intro: '',
	tags: ''
})
const merchantOpenidInput = ref('')

const tagList = computed(() => {
	const raw = (detail.value && detail.value.tags) || ''
	return raw
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean)
})

const createTimeText = computed(() => {
	const ts = detail.value && detail.value.createTime
	if (!ts) return '--'
	const d = new Date(ts)
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
})

const qrCreateTimeText = computed(() => {
	const ts = detail.value && detail.value.qrCodeCreateTime
	if (!ts) return '--'
	const d = new Date(ts)
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
})

const qrEmptyHint = computed(() => {
	if (qrDisplayLoading.value) return '二维码图片加载中…'
	if (detail.value && detail.value.qrCodeUrl) {
		return qrDisplayError.value || '二维码图片加载失败，请重试'
	}
	return '尚未生成二维码'
})

function fillFormFromDetail(d) {
	form.value = {
		wifiName: d.name || d.wifiName || '',
		wifiPassword: d.password || d.wifiPassword || '',
		shopName: d.shop || d.shopName || '',
		address: d.address || '',
		intro: d.intro || '',
		tags: d.tags || ''
	}
}

async function loadDetail() {
	if (!wifiId.value) return
	pageLoading.value = true
	try {
		const data = await getMyWifiDetail(wifiId.value)
		detail.value = data
		merchantOpenidInput.value = data.merchantOpenid || ''
		fillFormFromDetail(data)
		if (data.qrCodeUrl) {
			await refreshQrDisplayUrl(data.qrCodeUrl)
		}
	} catch (err) {
		detail.value = null
		uni.showToast({ title: err.message || '加载失败', icon: 'none' })
	} finally {
		pageLoading.value = false
	}
}

function notifyRefresh() {
	uni.$emit(MY_WIFI_REFRESH_EVENT)
	uni.$emit(MERCHANT_REFRESH_EVENT)
	uni.$emit(WIFI_LIST_REFRESH_EVENT)
}

async function setStatus(status) {
	if (!detail.value || detail.value.status === status) return
	const ok = await updateWifiStatus(wifiId.value, status)
	if (ok) {
		detail.value.status = status
		uni.showToast({ title: status === '在线' ? '已上线' : '已下线', icon: 'success' })
		notifyRefresh()
	} else {
		uni.showToast({ title: '状态更新失败', icon: 'none' })
	}
}

async function handleAssignMerchant() {
	if (!detail.value || !detail.value.canAssignMerchantOpenid) return
	const merchantOpenid = String(merchantOpenidInput.value || '').trim()
	if (!merchantOpenid) {
		uni.showToast({ title: '请填写商家 openid', icon: 'none' })
		return
	}
	assigningMerchant.value = true
	try {
		const data = await assignWifiMerchant(wifiId.value, merchantOpenid)
		detail.value = data
		merchantOpenidInput.value = data.merchantOpenid || ''
		uni.showToast({ title: '已绑定商家', icon: 'success' })
		notifyRefresh()
	} catch (err) {
		uni.showToast({ title: err.message || '绑定失败', icon: 'none' })
	} finally {
		assigningMerchant.value = false
	}
}

async function refreshQrDisplayUrl(url) {
	const fileId = url || (detail.value && detail.value.qrCodeUrl) || ''
	if (!fileId) {
		qrDisplayUrl.value = ''
		qrDisplayError.value = ''
		return
	}
	qrDisplayLoading.value = true
	qrDisplayError.value = ''
	try {
		const display = await resolveQrImageDisplayUrl(fileId)
		qrDisplayUrl.value = display
	} catch (err) {
		qrDisplayUrl.value = ''
		qrDisplayError.value = (err && err.message) || '加载失败'
		console.warn('[wifi-manage-detail] qr display fail', err)
	} finally {
		qrDisplayLoading.value = false
	}
}

function retryQrDisplay() {
	if (detail.value && detail.value.qrCodeUrl) {
		refreshQrDisplayUrl(detail.value.qrCodeUrl)
	}
}

function toggleQrPanel() {
	showQrPanel.value = !showQrPanel.value
	if (showQrPanel.value && detail.value && detail.value.qrCodeUrl) {
		refreshQrDisplayUrl(detail.value.qrCodeUrl)
	}
}

async function handleGenerateQr() {
	if (!wifiId.value) return
	qrGenerating.value = true
	try {
		const data = await generateWifiQrCode(wifiId.value)
		if (detail.value) {
			detail.value.qrCodeUrl = data.qrCodeUrl
			detail.value.qrCodeStatus = data.qrCodeStatus
			detail.value.qrCodeCreateTime = data.qrCodeCreateTime
		}
		await refreshQrDisplayUrl(data.qrCodeUrl)
		showQrPanel.value = true
		uni.showToast({ title: '二维码已生成', icon: 'success' })
		notifyRefresh()
	} catch (err) {
		uni.showToast({ title: err.message || '生成失败', icon: 'none' })
	} finally {
		qrGenerating.value = false
	}
}

async function handleSaveAlbum() {
	if (!detail.value || !detail.value.qrCodeUrl) return
	try {
		await saveQrCodeToAlbum(detail.value.qrCodeUrl)
		uni.showToast({ title: '已保存到相册', icon: 'success' })
	} catch (err) {
		if (isAlbumPrivacyUndeclared(err)) {
			uni.showModal({
				title: '相册权限未生效',
				content: '请确认已在微信公众平台隐私保护指引中声明“相册（仅写入）权限”，并重新发布后再试。',
				showCancel: false
			})
			return
		}
		if (isAlbumPermissionDenied(err)) {
			uni.showModal({
				title: '需要相册权限',
				content: '请在设置中允许保存到相册',
				confirmText: '去设置',
				success: (r) => {
					if (r.confirm) uni.openSetting()
				}
			})
			return
		}
		uni.showToast({ title: err.message || err.errMsg || '保存失败', icon: 'none' })
	}
}

async function handleSharePoster() {
	if (!detail.value || !detail.value.qrCodeUrl) return
	posterGenerating.value = true
	try {
		const posterPath = await createWifiSharePosterInPage('wifiPosterCanvas', {
			wifiName: detail.value.name,
			shopName: detail.value.shop,
			qrCodeUrl: detail.value.qrCodeUrl,
			logoPath: '/static/logo.png'
		})
		await sharePosterImage(posterPath)
	} catch (err) {
		uni.showToast({ title: err.message || '分享失败', icon: 'none' })
	} finally {
		posterGenerating.value = false
	}
}

function confirmDelete() {
	uni.showModal({
		title: '确认删除',
		content: '是否删除此WiFi？删除后无法恢复。',
		confirmColor: '#C80000',
		success: async (res) => {
			if (!res.confirm) return
			try {
				await deleteWifi(wifiId.value)
				uni.showToast({ title: '已删除', icon: 'success' })
				notifyRefresh()
				setTimeout(() => uni.navigateBack(), 500)
			} catch (err) {
				uni.showToast({ title: err.message || '删除失败', icon: 'none' })
			}
		}
	})
}

async function saveEdit() {
	if (!form.value.wifiName || !form.value.wifiPassword || !form.value.shopName) {
		uni.showToast({ title: '请填写 WiFi 名称、密码和店铺', icon: 'none' })
		return
	}
	saving.value = true
	try {
		const data = await updateWifi(wifiId.value, { ...form.value })
		detail.value = data
		fillFormFromDetail(data)
		editMode.value = false
		uni.showToast({ title: '已保存', icon: 'success' })
		notifyRefresh()
	} catch (err) {
		uni.showToast({ title: err.message || '保存失败', icon: 'none' })
	} finally {
		saving.value = false
	}
}

function cancelEdit() {
	if (detail.value) fillFormFromDetail(detail.value)
	editMode.value = false
}

onLoad((options) => {
	if (options.id) wifiId.value = options.id
	if (options.edit === '1') editMode.value = true
	loadDetail()
})
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.detail-card__head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 24rpx;
}

.detail-card__name {
	font-size: 36rpx;
	font-weight: 700;
	color: $text-primary;
	flex: 1;
	margin-right: 16rpx;
}

.status-tag {
	font-size: 22rpx;
	padding: 6rpx 16rpx;
	border-radius: 20rpx;
	flex-shrink: 0;

	&--on {
		color: #52c41a;
		background: rgba(82, 196, 26, 0.12);
	}

	&--off {
		color: $text-secondary;
		background: rgba(255, 255, 255, 0.06);
	}
}

.info-row {
	padding: 20rpx 0;
	border-bottom: 1rpx solid $border-color;
	font-size: 28rpx;

	&:last-child {
		border-bottom: none;
	}

	&--tags {
		display: block;
	}
}

.info-label {
	color: $text-secondary;
	display: block;
	margin-bottom: 8rpx;
	font-size: 24rpx;
}

.info-value {
	color: $text-primary;
	word-break: break-all;
}

.tag-list {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
	margin-top: 8rpx;
}

.tag-chip {
	font-size: 22rpx;
	padding: 6rpx 16rpx;
	border-radius: 8rpx;
	color: $primary-color;
	border: 1rpx solid rgba(212, 175, 55, 0.45);
	background: rgba(212, 175, 55, 0.1);
}

.stat-row {
	display: flex;
	margin-top: 24rpx;
	padding-top: 24rpx;
	border-top: 1rpx solid $border-color;
}

.stat-box {
	flex: 1;
	text-align: center;

	&__val {
		display: block;
		font-size: 36rpx;
		font-weight: 700;
		color: $primary-color;
	}

	&__label {
		display: block;
		font-size: 22rpx;
		color: $text-secondary;
		margin-top: 8rpx;
	}
}

.textarea-field {
	width: 100%;
	min-height: 160rpx;
	background: $bg-input;
	border-radius: $radius-sm;
	padding: 20rpx;
	font-size: 28rpx;
	margin-top: 16rpx;
	box-sizing: border-box;
}

.status-switch {
	display: flex;
	gap: 20rpx;
}

.status-btn {
	flex: 1;
	text-align: center;
	padding: 20rpx 0;
	border-radius: $radius-sm;
	font-size: 28rpx;
	color: $text-secondary;
	background: $bg-input;
	border: 2rpx solid transparent;

	&--active {
		color: $primary-color;
		border-color: $primary-color;
		background: rgba(212, 175, 55, 0.12);
	}
}

.action-group {
	margin-top: 30rpx;
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.btn-danger {
	background: rgba(255, 77, 79, 0.15) !important;
	color: $error !important;
	border: 2rpx solid rgba(255, 77, 79, 0.4) !important;
	border-radius: $radius-md !important;
	font-size: 30rpx !important;
}

.qr-card__path {
	font-size: 22rpx;
	color: $text-secondary;
	word-break: break-all;
	margin-bottom: 20rpx;
}

.qr-preview {
	display: flex;
	justify-content: center;
	padding: 24rpx 0;

	&__img {
		width: 400rpx;
		height: 400rpx;
		background: #fff;
		border-radius: $radius-sm;
	}
}

.qr-empty {
	text-align: center;
	padding: 40rpx 0;

	&__icon {
		width: 96rpx;
		height: 96rpx;
		opacity: 0.6;
	}

	&__text {
		display: block;
		margin-top: 16rpx;
		font-size: 26rpx;
		color: $text-secondary;
	}

	&__retry {
		margin-top: 20rpx;
	}
}

.qr-meta {
	display: flex;
	flex-direction: column;
	gap: 8rpx;
	font-size: 24rpx;
	color: $text-secondary;
	margin-bottom: 24rpx;
}

.poster-canvas {
	position: fixed;
	left: -9999px;
	top: 0;
	width: 600px;
	height: 900px;
	pointer-events: none;
}
</style>
