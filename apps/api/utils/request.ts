import type { Request } from 'express'

import { badRequest } from './AppError'

export function stringParam(req: Request, key: string) {
	const value = req.params[key]
	if (typeof value !== 'string') throw badRequest(`Invalid ${key} parameter`)
	return value
}

export function numberParam(req: Request, key: string) {
	const value = req.params[key] as unknown
	if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value

	if (typeof value === 'string') {
		const parsed = Number(value)
		if (Number.isInteger(parsed) && parsed > 0) return parsed
	}

	throw badRequest(`Invalid ${key} parameter`)
}
