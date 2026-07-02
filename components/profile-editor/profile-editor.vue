<template>
	<view class="profile-editor">
		<view class="avatar-row">
			<text class="field-label">头像 <text class="required">*</text></text>
			<!-- 微信新版：chooseAvatar，禁止 getUserInfo -->
			<button class="avatar-picker" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
				<image
					v-if="avatar"
					class="avatar-picker__img"
					:src="avatar"
					mode="aspectFill"
				/>
				<view v-else class="avatar-picker__placeholder">
					<image class="avatar-picker__icon" src="/static/icons/avatar-placeholder.png" mode="aspectFit" />
					<text class="avatar-picker__text">点击选择头像</text>
				</view>
			</button>
		</view>

		<view class="nickname-row">
			<text class="field-label">昵称 <text class="required">*</text></text>
			<!-- 微信新版：type=nickname 手动输入/选择微信昵称 -->
			<input
				class="input-field nickname-input"
				type="nickname"
				:value="nickname"
				placeholder="请输入昵称"
				maxlength="20"
				@input="onNicknameInput"
				@blur="onNicknameBlur"
			/>
		</view>
	</view>
</template>

<script setup>
const props = defineProps({
	avatar: {
		type: String,
		default: ''
	},
	nickname: {
		type: String,
		default: ''
	}
})

const emit = defineEmits(['choose-avatar', 'update:nickname'])

function onChooseAvatar(e) {
	const url = (e.detail && e.detail.avatarUrl) || ''
	if (url) {
		emit('choose-avatar', url)
	}
}

function onNicknameInput(e) {
	emit('update:nickname', (e.detail && e.detail.value) || '')
}

function onNicknameBlur(e) {
	emit('update:nickname', (e.detail && e.detail.value) || '')
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.profile-editor {
	padding: 8rpx 0;
}

.field-label {
	display: block;
	font-size: 26rpx;
	color: $text-secondary;
	margin-bottom: 16rpx;
}

.required {
	color: $gold;
}

.avatar-row {
	margin-bottom: 32rpx;
}

.avatar-picker {
	padding: 0;
	margin: 0;
	background: transparent;
	border: none;
	line-height: normal;
	width: 160rpx;
	height: 160rpx;
	border-radius: 50%;
	overflow: hidden;

	&::after {
		border: none;
	}

	&__img {
		width: 160rpx;
		height: 160rpx;
		border-radius: 50%;
		border: 3rpx solid $border-gold;
	}

	&__placeholder {
		width: 160rpx;
		height: 160rpx;
		border-radius: 50%;
		background: rgba(200, 0, 0, 0.15);
		border: 2rpx dashed $border-gold;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	&__icon {
		width: 64rpx;
		height: 64rpx;
	}

	&__text {
		font-size: 20rpx;
		color: $gold;
		margin-top: 8rpx;
	}
}

.nickname-input {
	width: 100%;
	box-sizing: border-box;
}
</style>
