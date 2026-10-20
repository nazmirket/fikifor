import { defineConfig, devices } from '@playwright/test'

import { testEnvironment } from './apps/api/tests/environment'

const dependencies = testEnvironment(process.env)
Object.assign(process.env, dependencies)

const webPort = process.env.E2E_WEB_PORT ?? '3000'
const apiPort = process.env.E2E_API_PORT ?? '3001'
const socketPort = process.env.E2E_SOCKET_PORT ?? '3002'
const webUrl = `http://127.0.0.1:${webPort}`
const apiUrl = `http://127.0.0.1:${apiPort}`
const socketUrl = `http://127.0.0.1:${socketPort}`
process.env.E2E_API_URL = apiUrl

const serverEnvironment = {
	...process.env,
	...dependencies,
	NODE_ENV: 'test',
	DEFAULT_PORT: apiPort,
	SOCKET_PORT: socketPort,
	CORS_ORIGINS: webUrl,
	GAME_COUNTDOWN_MS: '3000',
	MATCH_DEADLINE_MS: '5000',
	NUXT_PUBLIC_APP_URL: webUrl,
	NUXT_PUBLIC_API_URL: `${apiUrl}/api/v1`,
	NUXT_PUBLIC_SOCKET_URL: socketUrl,
	NITRO_HOST: '127.0.0.1',
	NITRO_PORT: webPort,
}

export default defineConfig({
	testDir: './apps/web/e2e',
	fullyParallel: false,
	workers: 1,
	timeout: 30_000,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
	use: {
		baseURL: webUrl,
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure',
		video: 'retain-on-failure',
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
		{
			name: 'chromium-mobile-reduced-motion',
			use: { ...devices['Pixel 7'], reducedMotion: 'reduce' },
		},
	],
	webServer: [
		{
			command: 'pnpm --filter @fikifor/api start',
			url: `${apiUrl}/ready`,
			env: serverEnvironment,
			reuseExistingServer: false,
			timeout: 30_000,
		},
		{
			command: 'pnpm --filter @fikifor/api start:socket',
			url: `${socketUrl}/ready`,
			env: serverEnvironment,
			reuseExistingServer: false,
			timeout: 30_000,
		},
		{
			command: 'pnpm --filter @fikifor/web preview',
			url: webUrl,
			env: serverEnvironment,
			reuseExistingServer: false,
			timeout: 30_000,
		},
	],
})
