import type { NextFunction, Request, Response } from 'express'
import type { ZodType } from 'zod'

export type RequestTarget = 'body' | 'params' | 'query'

export function validate(target: RequestTarget, schema: ZodType) {
	return (req: Request, _res: Response, next: NextFunction) => {
		const parsed = schema.safeParse(req[target])
		if (!parsed.success) return next(parsed.error)

		Object.defineProperty(req, target, {
			configurable: true,
			enumerable: true,
			value: parsed.data,
			writable: true,
		})
		return next()
	}
}
