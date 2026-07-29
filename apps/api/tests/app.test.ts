import request from 'supertest'
import { describe, expect, it } from 'vitest'

import { createApp } from '../app'

describe('HTTP application boundaries', () => {
	const app = createApp()

	it('exposes a liveness endpoint', async () => {
		const response = await request(app).get('/health').expect(200)
		expect(response.body.success).toBe(true)
		expect(response.body.data.status).toBe('ok')
	})

	it('returns structured validation errors', async () => {
		const response = await request(app)
			.post('/api/v1/auth/signup')
			.send({ username: '!', password: 'short' })
			.expect(400)

		expect(response.body).toMatchObject({
			success: false,
			error: {
				code: 'VALIDATION_ERROR',
				message: 'Request validation failed',
			},
		})
		expect(response.body.error.details.length).toBeGreaterThan(0)
	})

	it('rejects untrusted browser origins', async () => {
		const response = await request(app)
			.get('/health')
			.set('Origin', 'https://attacker.example')
			.expect(403)
		expect(response.body.error.code).toBe('FORBIDDEN')
	})
})
