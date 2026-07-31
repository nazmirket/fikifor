import { tooManyRequests } from '../utils/AppError'

interface Bucket {
	tokens: number
	updatedAt: number
}

interface Rate {
	capacity: number
	refillPerSecond: number
}

const rates = {
	join: { capacity: 6, refillPerSecond: 1 },
	start: { capacity: 3, refillPerSecond: 0.2 },
	vote: { capacity: 20, refillPerSecond: 10 },
} satisfies Record<string, Rate>

export type SocketAction = keyof typeof rates

export class SocketRateLimiter {
	private readonly buckets = new Map<string, Bucket>()

	constructor(private readonly now: () => number = Date.now) {}

	consume(userId: number, action: SocketAction) {
		const rate = rates[action]
		const key = `${userId}:${action}`
		const currentTime = this.now()
		const bucket = this.buckets.get(key) ?? {
			tokens: rate.capacity,
			updatedAt: currentTime,
		}
		const elapsedSeconds = Math.max(0, currentTime - bucket.updatedAt) / 1_000
		bucket.tokens = Math.min(
			rate.capacity,
			bucket.tokens + elapsedSeconds * rate.refillPerSecond,
		)
		bucket.updatedAt = currentTime

		if (bucket.tokens < 1) {
			this.buckets.set(key, bucket)
			return false
		}
		bucket.tokens -= 1
		this.buckets.set(key, bucket)

		if (this.buckets.size > 10_000) this.prune(currentTime)
		return true
	}

	private prune(currentTime: number) {
		for (const [key, bucket] of this.buckets) {
			if (currentTime - bucket.updatedAt > 10 * 60_000) this.buckets.delete(key)
		}
	}
}

const limiter = new SocketRateLimiter()

export function enforceSocketRateLimit(userId: number, action: SocketAction) {
	if (!limiter.consume(userId, action)) {
		throw tooManyRequests('Too many gameplay actions; slow down and try again')
	}
}
