export default {
	theme: {
		extend: {
			borderColor: {
				DEFAULT: 'rgba(255, 255, 255, 0.2)',
			},
		},
	},

	content: [
		'./components/**/*.{js,vue,ts}',
		'./layouts/**/*.vue',
		'./pages/**/*.vue',
		'./plugins/**/*.{js,ts}',
		'./nuxt.config.{js,ts}',
	],
}
