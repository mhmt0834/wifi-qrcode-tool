<script>
export default {
	onLaunch() {
		console.log('智连WiFi App Launch')
	},
	onShow() {
		console.log('智连WiFi App Show')
	},
	onHide() {
		console.log('智连WiFi App Hide')
	}
}
</script>

<style lang="scss">
@import '@/styles/theme.scss';

page {
	background-color: #f0f4f8;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
	font-size: 28rpx;
	color: #1a1a2e;
	box-sizing: border-box;
}

view, text, input, button {
	box-sizing: border-box;
}

button::after {
	border: none;
}
</style>
