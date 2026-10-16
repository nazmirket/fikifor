import { afterEach, describe, expect, it, vi } from 'vitest'

const originalNodeEnv = process.env.NODE_ENV
const originalJwtSecret = process.env.JWT_SECRET

afterEach(() => {
	vi.resetModules()
	if (originalNodeEnv === undefined) delete process.env.NODE_ENV
	else process.env.NODE_ENV = originalNodeEnv
	if (originalJwtSecret === undefined) delete process.env.JWT_SECRET
	else process.env.JWT_SECRET = originalJwtSecret
})

describe('production environment requirements', () => {
	it('rejects a missing JWT secret instead of using the development fallback', async () => {
		process.env.NODE_ENV = 'production'
		delete process.env.JWT_SECRET

		await expect(import('../config/env')).rejects.toThrow(
			/JWT_SECRET must be explicitly configured/,
		)
	})

	it('rejects the development fallback even when it is supplied explicitly', async () => {
		process.env.NODE_ENV = 'production'
		process.env.JWT_SECRET = 'local-development-secret-change-before-deployment'

		await expect(import('../config/env')).rejects.toThrow(
			/JWT_SECRET must be explicitly configured/,
		)
	})

	it('rejects the placeholder from the environment template', async () => {
		process.env.NODE_ENV = 'production'
		process.env.JWT_SECRET = 'replace-with-a-long-random-secret'

		await expect(import('../config/env')).rejects.toThrow(
			/JWT_SECRET must be explicitly configured/,
		)
	})
})
