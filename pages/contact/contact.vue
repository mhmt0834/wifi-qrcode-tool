<template>
	<view class="page-container">
		<custom-navbar title="联系我们" :show-back="true" />
		<view class="page-content">
			<view class="hero-card">
				<view class="hero-card__title">联系我们</view>
				<view class="hero-card__desc">智连WiFi · 反馈建议 · 商务合作</view>
			</view>

			<view class="card purpose-card">
				<view class="card__title gold-title">您可以咨询</view>
				<view class="purpose-grid">
					<view
						v-for="(item, index) in purposes"
						:key="index"
						class="purpose-item"
					>
						<image class="purpose-item__icon" :src="item.icon" mode="aspectFit" />
						<view class="purpose-item__title">{{ item.title }}</view>
						<view class="purpose-item__desc">{{ item.desc }}</view>
					</view>
				</view>
			</view>

			<view class="card contact-card">
				<view class="card__title gold-title">客服微信</view>
				<view
					v-for="(item, index) in wechatList"
					:key="'wx-' + index"
					class="contact-row"
				>
					<image class="contact-row__icon" src="/static/icons/login.png" mode="aspectFit" />
					<view class="contact-row__body">
						<view class="contact-row__label">{{ item.label }}</view>
						<view class="contact-row__value">{{ item.value || '暂无' }}</view>
					</view>
					<button
						class="contact-row__btn"
						size="mini"
						:disabled="!item.value"
						@click="copyWechat(item.value)"
					>
						复制
					</button>
				</view>
			</view>

			<view class="card contact-card">
				<view class="card__title gold-title">联系电话</view>
				<view
					v-for="(item, index) in phoneList"
					:key="'ph-' + index"
					class="contact-row"
				>
					<image class="contact-row__icon" src="/static/icons/nearby.png" mode="aspectFit" />
					<view class="contact-row__body">
						<view class="contact-row__label">{{ item.label }}</view>
						<view class="contact-row__value contact-row__value--phone">{{ item.value }}</view>
					</view>
					<button class="contact-row__btn contact-row__btn--call" size="mini" @click="callPhone(item.value)">
						拨打
					</button>
				</view>
			</view>

			<view class="card service-card">
				<view class="card__title gold-title">服务时间</view>
				<view class="service-time">
					<image class="service-time__icon" src="/static/icons/benefit-chart.png" mode="aspectFit" />
					<text class="service-time__text">{{ serviceTime }}</text>
				</view>
			</view>

			<view class="contact-tip">
				<text class="contact-tip__text">添加微信时请备注「智连WiFi」，便于客服快速响应</text>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import CustomNavbar from '@/components/custom-navbar/custom-navbar.vue'
import {
	CONTACT_PURPOSES,
	CONTACT_INFO,
	getWechatList,
	getPhoneList
} from '@/utils/contact-config.js'

const purposes = ref(CONTACT_PURPOSES)
const wechatList = ref(getWechatList())
const phoneList = ref(getPhoneList())
const serviceTime = ref(CONTACT_INFO.serviceTime)

function copyWechat(wechatId) {
	if (!wechatId) {
		uni.showToast({ title: '微信号未配置', icon: 'none' })
		return
	}
	uni.setClipboardData({
		data: String(wechatId),
		success: () => {
			uni.showToast({ title: '已复制微信号', icon: 'none' })
		},
		fail: () => {
			uni.showToast({ title: '复制失败，请重试', icon: 'none' })
		}
	})
}

function callPhone(phoneNumber) {
	if (!phoneNumber) {
		uni.showToast({ title: '电话未配置', icon: 'none' })
		return
	}
	uni.makePhoneCall({
		phoneNumber: String(phoneNumber),
		fail: () => {
			uni.showToast({ title: '无法拨打电话', icon: 'none' })
		}
	})
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.page-content {
	padding-bottom: calc(80rpx + env(safe-area-inset-bottom));
}

.purpose-card {
	border: 1px solid rgba(212, 175, 55, 0.2);
}

.purpose-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 20rpx;
	margin-top: 8rpx;
}

.purpose-item {
	background: rgba(255, 255, 255, 0.03);
	border: 1px solid rgba(212, 175, 55, 0.15);
	border-radius: $radius-md;
	padding: 24rpx 20rpx;

	&__icon {
		width: 44rpx;
		height: 44rpx;
		margin-bottom: 12rpx;
	}

	&__title {
		font-size: 28rpx;
		font-weight: 600;
		color: $gold;
		margin-bottom: 8rpx;
	}

	&__desc {
		font-size: 22rpx;
		color: $text-secondary;
		line-height: 1.5;
	}
}

.contact-card {
	border: 1px solid rgba(212, 175, 55, 0.2);
	margin-top: 24rpx;
}

.contact-row {
	display: flex;
	align-items: center;
	padding: 28rpx 0;
	border-bottom: 1rpx solid $border-color;

	&:last-child {
		border-bottom: none;
		padding-bottom: 8rpx;
	}

	&__icon {
		width: 40rpx;
		height: 40rpx;
		margin-right: 20rpx;
		flex-shrink: 0;
	}

	&__body {
		flex: 1;
		min-width: 0;
	}

	&__label {
		font-size: 24rpx;
		color: $text-secondary;
		margin-bottom: 6rpx;
	}

	&__value {
		font-size: 30rpx;
		font-weight: 600;
		color: $text-primary;
		word-break: break-all;

		&--phone {
			letter-spacing: 1rpx;
		}
	}

	&__btn {
		flex-shrink: 0;
		margin: 0 0 0 16rpx !important;
		padding: 0 28rpx !important;
		line-height: 56rpx !important;
		font-size: 24rpx !important;
		border-radius: 28rpx !important;
		background: rgba(212, 175, 55, 0.15) !important;
		color: $gold !important;
		border: 1px solid $border-gold !important;

		&--call {
			background: $primary-gradient !important;
			color: #fff !important;
			border: none !important;
		}
	}
}

.service-card {
	border: 1px solid rgba(212, 175, 55, 0.2);
	margin-top: 24rpx;
}

.service-time {
	display: flex;
	align-items: center;
	padding: 8rpx 0 4rpx;

	&__icon {
		width: 40rpx;
		height: 40rpx;
		margin-right: 16rpx;
		flex-shrink: 0;
	}

	&__text {
		font-size: 30rpx;
		font-weight: 600;
		color: $gold;
	}
}

.contact-tip {
	margin-top: 24rpx;
	padding: 0 8rpx;

	&__text {
		font-size: 24rpx;
		color: $text-placeholder;
		line-height: 1.6;
	}
}
</style>
