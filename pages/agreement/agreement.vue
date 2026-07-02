<template>
	<view class="page-container">
		<custom-navbar title="用户协议" :show-back="true" />
		<view class="page-content">
			<view class="hero-card">
				<view class="hero-card__title">用户协议</view>
				<view class="hero-card__desc">智连WiFi · 中国科技 · 规范使用服务</view>
			</view>

			<view class="card agreement-card">
				<view class="card__title gold-title">使用条款</view>
				<view class="agreement-section">
					<view class="agreement-item">
						<view class="agreement-item__title">1. 遵守法律法规</view>
						<view class="agreement-item__text">
							用户在使用本小程序时，应遵守中华人民共和国相关法律法规，不得利用本服务从事任何违法违规活动。
						</view>
					</view>
					<view class="agreement-item">
						<view class="agreement-item__title">2. 禁止违法违规信息</view>
						<view class="agreement-item__text">
							用户不得上传、发布、传播任何违法违规的网络信息，包括但不限于危害国家安全、侵犯他人权益、散布谣言或不良内容的信息。
						</view>
					</view>
					<view class="agreement-item">
						<view class="agreement-item__title">3. 禁止恶意行为</view>
						<view class="agreement-item__text">
							用户不得对本平台或相关系统进行恶意攻击、干扰、破坏，不得利用技术手段非法获取数据或影响平台正常运行。
						</view>
					</view>
					<view class="agreement-item">
						<view class="agreement-item__title">4. 平台服务说明</view>
						<view class="agreement-item__text">
							本平台仅提供 WiFi 信息共享与网络信息相关服务，不对用户自行发布的信息内容承担超出法律法规规定的额外责任。
						</view>
					</view>
					<view class="agreement-item">
						<view class="agreement-item__title">5. 用户责任</view>
						<view class="agreement-item__text">
							用户应对自己发布、上传的信息内容负责，因用户违规行为所产生的一切后果，由用户自行承担。
						</view>
					</view>
					<view class="agreement-item">
						<view class="agreement-item__title">6. 违规内容处理</view>
						<view class="agreement-item__text">
							平台有权对违法违规或违反本协议的内容进行删除、屏蔽、限制展示等处理，并视情况采取限制账号功能等措施。
						</view>
					</view>
				</view>
			</view>

			<view class="card agreement-footer">
				<view class="agreement-footer__text">更新日期：2026年5月29日</view>
				<view class="agreement-footer__text">感谢您信任并使用智连WiFi</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import CustomNavbar from '@/components/custom-navbar/custom-navbar.vue'
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.agreement-card {
	border: 1px solid rgba(212, 175, 55, 0.2);
}

.agreement-section {
	display: flex;
	flex-direction: column;
	gap: 32rpx;
}

.agreement-item {
	&__title {
		font-size: 30rpx;
		font-weight: 600;
		color: #d4af37;
		margin-bottom: 12rpx;
		line-height: 1.5;
	}

	&__text {
		font-size: 28rpx;
		color: $text-primary;
		line-height: 1.8;
		text-align: justify;
	}
}

.agreement-footer {
	text-align: center;
	padding: 24rpx 30rpx;

	&__text {
		font-size: 24rpx;
		color: $text-secondary;
		line-height: 1.8;
	}
}
</style>
