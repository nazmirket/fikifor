export default defineNuxtConfig({
	app: {
		head: {
			title: 'Fikifor',
			meta: [
				{ charset: 'utf-8' },
				{ name: 'viewport', content: 'width=device-width, initial-scale=1' },
				{ hid: 'description', name: 'description', content: '' },
			],
			link: [{ rel: 'icon', type: 'image/x-icon', href: `/brand.svg` }],
		},
	},

	modules: ['@pinia/nuxt', 'pinia-plugin-persistedstate', '@nuxt/ui'],

	colorMode: {
		preference: 'dark',
	},

	ui: {
		global: true,
	},

	tailwindcss: {
		cssPath: '~/assets/css/main.css',
		config: '~/tailwind.config.ts',
	},

	vite: {
		define: {
			global: {},
		},
	},

	// Component auto import
	components: [
		{
			path: '~/components',
			pathPrefix: false,
			extensions: ['.vue'],
			global: true,
		},
	],

	ssr: false,

	runtimeConfig: {
		public: {
			APP_URL: 'https://fikifor.mirket.dev',
			API_URL: 'https://fikifor.mirket.dev/api/v1',
			SOCKET_URL: 'https://fikifor.mirket.dev',
		},
	},

	devServer: {
		port: 3332,
	},

	typescript: {
		tsConfig: {
			compilerOptions: { declarationDir: 'types' },
			include: ['~/types'],
		},
	},

	compatibilityDate: '2025-02-09',
})
