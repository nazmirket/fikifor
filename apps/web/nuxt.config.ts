const publicAppUrl = process.env.NUXT_PUBLIC_APP_URL || 'https://fikifor.mirket.dev'

export default defineNuxtConfig({
	app: {
		head: {
			title: 'Fikifor · Birlikte seç',
			meta: [
				{ charset: 'utf-8' },
				{ name: 'viewport', content: 'width=device-width, initial-scale=1' },
				{
					name: 'description',
					content:
						'Fikifor ile film, müzik, yemek ve seyahat seçeneklerini arkadaşlarınla birlikte oylayıp ortak favorini bul.',
				},
				{ name: 'theme-color', content: '#120f1a' },
				{ name: 'robots', content: 'index, follow' },
				{ property: 'og:site_name', content: 'Fikifor' },
				{ property: 'og:type', content: 'website' },
				{ property: 'og:image', content: `${publicAppUrl}/og-image.png` },
				{ property: 'og:image:width', content: '1200' },
				{ property: 'og:image:height', content: '630' },
				{ name: 'twitter:card', content: 'summary_large_image' },
				{ name: 'twitter:image', content: `${publicAppUrl}/og-image.png` },
			],
			link: [
				{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
				{ rel: 'icon', type: 'image/svg+xml', href: '/brand.svg' },
				{ rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
			],
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

	ssr: true,

	runtimeConfig: {
		public: {
			APP_URL: 'http://localhost:3000',
			API_URL: 'http://localhost:3001/api/v1',
			SOCKET_URL: 'http://localhost:3002',
		},
	},

	devServer: {
		port: 3000,
	},

	typescript: {
		tsConfig: {
			include: ['~/types'],
		},
	},

	compatibilityDate: '2025-02-09',
})
