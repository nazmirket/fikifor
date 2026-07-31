import type { ApiError } from '@fikifor/contracts'
import { ZodError } from 'zod'

export class AppError extends Error {
	constructor(
		public readonly status: number,
		public readonly code: string,
		message: string,
		public readonly details?: unknown,
	) {
		super(message)
		this.name = 'AppError'
	}

	toJSON(): ApiError {
		return {
			code: this.code,
			message: this.message,
			...(this.details === undefined ? {} : { details: this.details }),
		}
	}
}

export const badRequest = (message: string, details?: unknown) =>
	new AppError(400, 'BAD_REQUEST', message, details)
export const unauthorized = (message = 'Unauthorized') =>
	new AppError(401, 'UNAUTHORIZED', message)
export const forbidden = (message = 'Forbidden') =>
	new AppError(403, 'FORBIDDEN', message)
export const notFound = (message = 'Not found') => new AppError(404, 'NOT_FOUND', message)
export const conflict = (message: string) => new AppError(409, 'CONFLICT', message)
export const tooManyRequests = (message = 'Too many requests') =>
	new AppError(429, 'RATE_LIMITED', message)

export function errorPayload(error: unknown): ApiError {
	if (error instanceof AppError) return error.toJSON()
	if (error instanceof ZodError) {
		return {
			code: 'VALIDATION_ERROR',
			message: 'Socket payload validation failed',
			details: error.issues,
		}
	}
	return {
		code: 'INTERNAL_ERROR',
		message: 'An unexpected server error occurred',
	}
}
