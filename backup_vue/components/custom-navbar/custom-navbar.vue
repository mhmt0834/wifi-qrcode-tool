<template>
	<view class="navbar-wrap">
		<view class="navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="navbar-inner" :style="{ height: navBarHeight + 'px' }">
				<view v-if="showBack" class="navbar-back" @click="handleBack">
					<text class="back-icon">‹</text>
				</view>
				<view v-else class="navbar-placeholder"></view>
				<text class="navbar-title">{{ title }}</text>
				<view class="navbar-placeholder"></view>
			</view>
		</view>
		<view class="navbar-spacer" :style="{ height: totalHeight + 'px' }"></view>
	</view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
	title: {
		type: String,
		default: '智连WiFi'
	},
	showBack: {
		type: Boolean,
		default: false
	}
})

const statusBarHeight = ref(20)
const navBarHeight = ref(44)

const totalHeight = computed(() => statusBarHeight.value + navBarHeight.value)

onMounted(() => {
	const info = uni.getSystemInfoSync()
	statusBarHeight.value = info.statusBarHeight || 20
	// #ifdef MP-WEIXIN
	const menuBtn = uni.getMenuButtonBoundingClientRect()
	if (menuBtn && menuBtn.top) {
		navBarHeight.value = (menuBtn.top - statusBarHeight.value) * 2 + menuBtn.height
	}
	// #endif
})

function handleBack() {
	const pages = getCurrentPages()
	if (pages.length > 1) {
		uni.navigateBack()
	} else {
		uni.switchTab({ url: '/pages/index/index' })
	}
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.navbar {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	z-index: 999;
	background: $primary-gradient;
}

.navbar-inner {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 24rpx;
}

.navbar-back {
	width: 64rpx;
	height: 64rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.back-icon {
	font-size: 52rpx;
	color: #fff;
	font-weight: 300;
	line-height: 1;
}

.navbar-title {
	flex: 1;
	text-align: center;
	font-size: 34rpx;
	font-weight: 600;
	color: #fff;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.navbar-placeholder {
	width: 64rpx;
}
</style>
