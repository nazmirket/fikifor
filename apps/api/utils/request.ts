import type { Request } from 'express'

import { badRequest } from './AppError'

export function stringParam(req: Request, key: string) {
	const value = req.params[key]
	if (typeof value !== 'string') throw badRequest(`Invalid ${key} parameter`)
	return value
}

export function numberParam(req: Request, key: string) {
	return Number.parseInt(stringParam(req, key), 10)
}
