import type { ApiError } from '@fikifor/contracts'

export function apiError(error: ApiError) {
	return new Error(error.message)
}
