<template>

	<view class="page-container">

		<custom-navbar title="隐私政策" :show-back="true" />

		<view class="page-content">

			<view class="hero-card">

				<view class="hero-card__title">隐私政策</view>

				<view class="hero-card__desc">智连WiFi · 说明我们如何收集与使用您的信息</view>

			</view>



			<view class="card privacy-card">

				<view class="card__title gold-title">引言</view>

				<view class="privacy-intro">

					「智连WiFi」是一款 WiFi 共享类微信小程序。我们仅在实现相关功能所必需的范围内处理您的信息，不会收集与本服务无关的权限或数据。请您在使用前仔细阅读本政策。

				</view>

			</view>



			<view class="card privacy-card">

				<view class="card__title gold-title">信息收集与使用</view>

				<view class="privacy-section">

					<view class="privacy-item">

						<view class="privacy-item__title">1. 微信登录</view>

						<view class="privacy-item__text">

							当您使用登录功能时，我们会通过微信提供的接口获取登录凭证，并在服务端换取 openid，用于识别您的账号、关联您上传的 WiFi 与商家资料。您可自愿选择头像、填写昵称，用于「我的」页面展示与资料保存；我们不会以此方式获取您的微信好友、聊天记录等未在本小程序中使用的信息。

						</view>

					</view>

					<view class="privacy-item">

						<view class="privacy-item__title">2. 位置信息</view>

						<view class="privacy-item__text">

							当您使用「附近 WiFi」、创建或上传共享 WiFi 等需要定位的功能时，我们会在您授权后获取当前地理位置（经纬度），用于按距离展示附近 WiFi、为 WiFi 记录坐标。您可在微信设置中关闭位置授权；关闭后，依赖定位的功能可能无法正常使用。

						</view>

					</view>

					<view class="privacy-item">

						<view class="privacy-item__title">3. 相册权限</view>

						<view class="privacy-item__text">

							当您主动选择「保存到相册」时，我们会在您授权后调用相册写入能力，将 WiFi 二维码图片保存至您的手机相册。我们不会未经您同意读取或上传相册中的其他照片。

						</view>

					</view>

					<view class="privacy-item">

						<view class="privacy-item__title">4. WiFi 信息</view>

						<view class="privacy-item__text">

							当您主动创建、上传或管理共享 WiFi 时，您填写的 WiFi 名称（SSID）、WiFi 密码、所属店铺名称等信息会提交并存储，用于生成 WiFi 码、供附近用户按规则获取密码及您本人管理已上传的 WiFi。请勿上传非本人有权共享的网络信息。

						</view>

					</view>

					<view class="privacy-item">

						<view class="privacy-item__title">5. 联系方式（商家）</view>

						<view class="privacy-item__text">

							当您使用商家入驻或店铺设置功能时，您主动填写的店铺名称、联系人姓名、联系电话、店铺地址等信息会提交并存储，用于商家资料展示、店铺管理及与本服务相关的必要联系。我们不会要求您提供与上述功能无关的个人信息。

						</view>

					</view>

					<view class="privacy-item">

						<view class="privacy-item__title">6. 数据存储</view>

						<view class="privacy-item__text">

							上述业务数据（含用户资料、WiFi 信息、商家信息、连接与浏览统计等）存储于 uniCloud 云数据库（阿里云），由云服务提供方托管。数据在传输与存储过程中采取合理安全措施；除法律法规要求或经您同意外，我们不会向无关第三方出售或提供您的个人信息。

						</view>

					</view>

				</view>

			</view>



			<view class="card privacy-card">

				<view class="card__title gold-title">其他说明</view>

				<view class="privacy-section">

					<view class="privacy-item">

						<view class="privacy-item__title">信息使用范围</view>

						<view class="privacy-item__text">

							我们收集的信息仅用于本小程序已上线的功能（如登录、附近 WiFi、WiFi 上传与管理、商家入驻与后台、保存二维码等），不会用于与本服务无关的营销或第三方推广。

						</view>

					</view>

					<view class="privacy-item">

						<view class="privacy-item__title">您的权利</view>

						<view class="privacy-item__text">

							您可在小程序内修改昵称与头像、管理已上传的 WiFi、更新商家店铺信息，或通过「联系我们」与我们沟通。如需删除相关数据，可通过联系渠道向我们提出申请，我们将在核实后依法处理。

						</view>

					</view>

					<view class="privacy-item">

						<view class="privacy-item__title">政策更新</view>

						<view class="privacy-item__text">

							我们可能适时修订本政策，更新后的内容将在本页面公布。若修订涉及重大变更，我们将通过适当方式提示您查阅。

						</view>

					</view>

					<view class="privacy-item">

						<view class="privacy-item__title">联系我们</view>

						<view class="privacy-item__text">

							如您对本政策或个人信息处理有疑问，请通过小程序内「联系我们」页面提供的客服微信或电话与我们沟通。

						</view>

					</view>

				</view>

			</view>



			<view class="card privacy-footer">

				<view class="privacy-footer__text">生效日期：2026年6月2日</view>

				<view class="privacy-footer__text">感谢您信任并使用智连WiFi</view>

			</view>

		</view>

	</view>

</template>



<script setup>

import CustomNavbar from '@/components/custom-navbar/custom-navbar.vue'

</script>



<style lang="scss" scoped>

@import '@/styles/theme.scss';



.privacy-card {

	border: 1px solid rgba(212, 175, 55, 0.2);

}



.privacy-intro {

	font-size: 28rpx;

	color: $text-primary;

	line-height: 1.8;

	text-align: justify;

}



.privacy-section {

	display: flex;

	flex-direction: column;

	gap: 32rpx;

}



.privacy-item {

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



.privacy-footer {

	text-align: center;

	padding: 24rpx 30rpx;



	&__text {

		font-size: 24rpx;

		color: $text-secondary;

		line-height: 1.8;

	}

}

</style>

