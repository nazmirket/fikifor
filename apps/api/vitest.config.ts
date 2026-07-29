import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		environment: 'node',
		fileParallelism: false,
		env: {
			NODE_ENV: 'test',
			JWT_SECRET: 'test-secret-that-is-long-enough-for-fikifor',
			CORS_ORIGINS: 'http://localhost:3000',
			REDIS_URL: process.env.REDIS_URL ?? 'redis://localhost:6380',
		},
		coverage: {
			reporter: ['text', 'lcov'],
		},
	},
})
