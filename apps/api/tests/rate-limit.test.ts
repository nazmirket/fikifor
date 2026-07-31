import { describe, expect, it } from 'vitest'

import { SocketRateLimiter } from '../ws/rateLimit'

describe('socket gameplay rate limiter', () => {
	it('limits bursts per user and refills over time', () => {
		let now = 1_000
		const limiter = new SocketRateLimiter(() => now)

		for (let index = 0; index < 20; index++) {
			expect(limiter.consume(42, 'vote')).toBe(true)
		}
		expect(limiter.consume(42, 'vote')).toBe(false)
		expect(limiter.consume(43, 'vote')).toBe(true)

		now += 1_000
		expect(limiter.consume(42, 'vote')).toBe(true)
	})
})
