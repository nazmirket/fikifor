import type { ApiError } from '@fikifor/contracts'

export function apiError(error: ApiError) {
	return Object.assign(new Error(error.message), {
		code: error.code,
		details: error.details,
	})
}
