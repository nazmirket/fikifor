export default defineAppConfig({
	ui: {
		primary: 'indigo',
		gray: 'cool',

		input: {
			default: {
				size: 'xl',
				variant: 'outline',
			},
			padding: {
				xl: 'py-3 px-4',
			},
		},

		textarea: {
			default: {
				size: 'xl',
				variant: 'outline',
			},
			padding: {
				xl: 'py-4 px-4',
			},
		},

		radioGroup: {
			wrapper: 'flex border p-4 flex-wrap rounded-lg bg-gray-900',
			fieldset: 'flex items-center space-x-4',
			default: {
				color: 'indigo',
			},
		},

		button: {
			default: {
				size: 'xl',
				variant: 'solid',
			},
			padding: {
				xl: 'py-3 px-4',
			},
			base: 'text-center w-full flex justify-center items-center !font-bold',
		},
	},
})
