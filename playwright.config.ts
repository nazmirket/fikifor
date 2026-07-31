import { defineConfig, devices } from '@playwright/test'

const serverEnvironment = {
	...process.env,
	NODE_ENV: 'test',
	DEFAULT_PORT: '3001',
	SOCKET_PORT: '3002',
	CORS_ORIGINS: 'http://127.0.0.1:3000,http://localhost:3000',
	GAME_COUNTDOWN_MS: '3000',
	MATCH_DEADLINE_MS: '5000',
	NUXT_PUBLIC_APP_URL: 'http://127.0.0.1:3000',
	NUXT_PUBLIC_API_URL: 'http://127.0.0.1:3001/api/v1',
	NUXT_PUBLIC_SOCKET_URL: 'http://127.0.0.1:3002',
	NITRO_HOST: '127.0.0.1',
	NITRO_PORT: '3000',
}

export default defineConfig({
	testDir: './apps/web/e2e',
	fullyParallel: false,
	timeout: 30_000,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
	use: {
		baseURL: 'http://127.0.0.1:3000',
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure',
		video: 'retain-on-failure',
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
	webServer: [
		{
			command: 'pnpm --filter @fikifor/api start',
			url: 'http://127.0.0.1:3001/ready',
			env: serverEnvironment,
			reuseExistingServer: !process.env.CI,
			timeout: 30_000,
		},
		{
			command: 'pnpm --filter @fikifor/api start:socket',
			url: 'http://127.0.0.1:3002/ready',
			env: serverEnvironment,
			reuseExistingServer: !process.env.CI,
			timeout: 30_000,
		},
		{
			command: 'pnpm --filter @fikifor/web preview',
			url: 'http://127.0.0.1:3000',
			env: serverEnvironment,
			reuseExistingServer: !process.env.CI,
			timeout: 30_000,
		},
	],
})
