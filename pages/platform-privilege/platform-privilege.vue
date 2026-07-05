<template>
	<view class="page-container">
		<custom-navbar title="WiFi自由审核" :show-back="true" />
		<view class="page-content">
			<view v-if="checking" class="list-loading">加载中...</view>

			<view v-else-if="!isAdmin" class="empty-state">
				<image class="empty-state__icon" src="/static/icons/benefit-wifi.png" mode="aspectFit" />
				<view class="empty-state__text">无管理员权限</view>
			</view>

			<template v-else>
				<view class="hero-card">
					<view class="hero-card__title">WiFi自由审核</view>
					<view class="hero-card__desc">审核用户免广告特权申请</view>
				</view>

				<view class="filter-tabs">
					<view
						v-for="tab in tabs"
						:key="tab.value"
						:class="['filter-tab', activeStatus === tab.value ? 'filter-tab--active' : '']"
						@click="changeStatus(tab.value)"
					>{{ tab.label }}</view>
				</view>

				<view v-if="listLoading" class="list-loading">加载中...</view>

				<view v-else-if="requestList.length === 0" class="empty-state">
					<image class="empty-state__icon" src="/static/icons/benefit-wifi.png" mode="aspectFit" />
					<view class="empty-state__text">暂无特权申请</view>
				</view>

				<view v-else v-for="item in requestList" :key="item._id" class="request-card">
					<view class="request-card__head">
						<view>
							<view class="request-card__title">{{ item.levelLabel }}</view>
							<view class="request-card__time">{{ item.time }}</view>
						</view>
						<text :class="['status-tag', 'status-tag--' + item.status]">{{ statusText(item.status) }}</text>
					</view>

					<view class="request-card__body">
						<view class="info-row">
							<text class="info-row__label">OpenID</text>
							<text class="info-row__value info-row__value--openid" selectable @click="copyText(item.openid)">{{ item.openid || '-' }}</text>
							<button class="copy-chip" size="mini" :disabled="!item.openid" @click.stop="copyText(item.openid)">复制</button>
						</view>
						<view class="info-row">
							<text class="info-row__label">进度</text>
							<text class="info-row__value">{{ item.watchCount }}/{{ item.requiredCount }} 次</text>
						</view>
						<view class="info-row">
							<text class="info-row__label">日期</text>
							<text class="info-row__value">{{ item.dateKey || '-' }}</text>
						</view>
						<view v-if="item.auditNote" class="info-row">
							<text class="info-row__label">备注</text>
							<text class="info-row__value">{{ item.auditNote }}</text>
						</view>
					</view>

					<textarea
						v-if="item.status === 'pending'"
						v-model="auditNotes[item._id]"
						class="audit-note"
						maxlength="80"
						placeholder="审核备注，可不填"
					/>

					<view v-if="item.status === 'pending'" class="action-row">
						<button
							class="btn-primary action-btn"
							size="mini"
							:loading="actingId === item._id"
							@click="confirmAction(item, 'approve')"
						>通过</button>
						<button
							class="btn-outline action-btn action-btn--danger"
							size="mini"
							:loading="actingId === item._id"
							@click="confirmAction(item, 'reject')"
						>驳回</button>
					</view>
				</view>
			</template>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import CustomNavbar from '@/components/custom-navbar/custom-navbar.vue'
import { auditWifiPrivilegeRequest, checkPlatformAdminRole, getWifiPrivilegeRequestList } from '@/utils/admin-db.js'

const tabs = [
	{ label: '待审核', value: 'pending' },
	{ label: '已通过', value: 'approved' },
	{ label: '已驳回', value: 'rejected' },
	{ label: '全部', value: '全部' }
]

const checking = ref(true)
const isAdmin = ref(false)
const activeStatus = ref('pending')
const listLoading = ref(false)
const requestList = ref([])
const auditNotes = ref({})
const actingId = ref('')

function statusText(status) {
	if (status === 'approved') return '已通过'
	if (status === 'rejected') return '已驳回'
	return '待审核'
}

async function loadList() {
	if (!isAdmin.value) return
	listLoading.value = true
	try {
		requestList.value = await getWifiPrivilegeRequestList(activeStatus.value)
	} catch (err) {
		requestList.value = []
		uni.showToast({ title: err.message || '加载失败', icon: 'none' })
	} finally {
		listLoading.value = false
	}
}

function changeStatus(status) {
	activeStatus.value = status
	loadList()
}

function copyText(text) {
	if (!text) {
		uni.showToast({ title: '暂无OpenID', icon: 'none' })
		return
	}
	uni.setClipboardData({
		data: text,
		success: () => uni.showToast({ title: 'OpenID已复制', icon: 'success' })
	})
}

function actionText(action) {
	return action === 'approve' ? '通过申请' : '驳回申请'
}

function confirmAction(item, auditAction) {
	if (!item || actingId.value) return
	uni.showModal({
		title: actionText(auditAction),
		content: `确认${actionText(auditAction)}「${item.levelLabel}」？`,
		success: async (res) => {
			if (!res.confirm) return
			actingId.value = item._id
			try {
				await auditWifiPrivilegeRequest({
					requestId: item._id,
					auditAction,
					auditNote: auditNotes.value[item._id] || ''
				})
				uni.showToast({ title: '操作成功', icon: 'success' })
				await loadList()
			} catch (err) {
				uni.showToast({ title: err.message || '操作失败', icon: 'none' })
			} finally {
				actingId.value = ''
			}
		}
	})
}

onShow(async () => {
	checking.value = true
	try {
		isAdmin.value = await checkPlatformAdminRole()
		if (isAdmin.value) await loadList()
	} finally {
		checking.value = false
	}
})
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.filter-tabs {
	display: flex;
	gap: 14rpx;
	margin-top: 24rpx;
	overflow-x: auto;
	white-space: nowrap;
}

.filter-tab {
	flex-shrink: 0;
	padding: 12rpx 24rpx;
	border-radius: 30rpx;
	font-size: 26rpx;
	color: $text-secondary;
	background: $bg-card;

	&--active {
		background: $primary-color;
		color: #fff;
	}
}

.request-card {
	margin-top: 20rpx;
	padding: 28rpx;
	border-radius: $radius-md;
	background: $bg-card;
	box-shadow: $shadow-card;

	&__head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 20rpx;
	}

	&__title {
		font-size: 32rpx;
		font-weight: 700;
		color: $gold;
	}

	&__time {
		margin-top: 6rpx;
		font-size: 22rpx;
		color: $text-placeholder;
	}

	&__body {
		margin-top: 22rpx;
		padding-top: 18rpx;
		border-top: 1rpx solid $border-color;
	}
}

.status-tag {
	padding: 8rpx 18rpx;
	border-radius: 24rpx;
	font-size: 22rpx;
	background: rgba(212, 175, 55, 0.14);
	color: $gold;
	flex-shrink: 0;

	&--approved {
		background: rgba(82, 196, 26, 0.14);
		color: #52c41a;
	}

	&--rejected {
		background: rgba(255, 107, 107, 0.14);
		color: #ff6b6b;
	}
}

.info-row {
	display: flex;
	gap: 18rpx;
	padding: 10rpx 0;
	font-size: 24rpx;

	&__label {
		width: 100rpx;
		color: $text-secondary;
		flex-shrink: 0;
	}

	&__value {
		flex: 1;
		min-width: 0;
		color: $text-primary;
		word-break: break-all;

		&--openid {
			font-family: monospace;
			color: $gold;
		}
	}
}

.copy-chip {
	width: 72rpx;
	height: 40rpx;
	line-height: 40rpx;
	margin: 0 0 0 12rpx;
	padding: 0;
	border-radius: 999rpx;
	background: rgba(212, 175, 55, 0.14);
	color: $gold;
	font-size: 20rpx;
	flex-shrink: 0;

	&[disabled] {
		opacity: 0.45;
	}
}

.copy-chip::after {
	border: none;
}

.audit-note {
	width: 100%;
	min-height: 96rpx;
	margin-top: 18rpx;
	padding: 18rpx;
	border-radius: $radius-sm;
	background: rgba(255, 255, 255, 0.06);
	color: $text-primary;
	font-size: 24rpx;
	line-height: 1.5;
}

.action-row {
	display: flex;
	gap: 16rpx;
	margin-top: 18rpx;
}

.action-btn {
	flex: 1;
	margin: 0;

	&--danger {
		color: #ff6b6b;
		border-color: rgba(255, 107, 107, 0.35);
	}
}
</style>
