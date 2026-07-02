<script>

import { preloadRewardAd } from '@/utils/ad-provider.js'

import { installFrameworkConsoleFilter } from '@/utils/console-filter.js'



export default {

	onLaunch() {

		installFrameworkConsoleFilter()

		preloadRewardAd()

	},

	onShow() {},

	onHide() {}

}

</script>



<style lang="scss">

@import '@/styles/theme.scss';



page {

	background: $bg-gradient;

	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;

	font-size: 28rpx;

	color: $text-primary;

	box-sizing: border-box;

}



view,

text,

input,

button {

	box-sizing: border-box;

}



button::after {

	border: none;

}

</style>


