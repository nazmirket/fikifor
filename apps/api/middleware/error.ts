import ApiReq from 'ApiReq'
import ApiRes from 'ApiRes'

import { Prisma } from '@prisma/client'
import type { ErrorRequestHandler, NextFunction } from 'express'
import multer from 'multer'
import { ZodError } from 'zod'

import { AppError } from '../utils/AppError'
import { logger } from '../utils/logger'

function handleErr(err: Error, req: ApiReq, res: ApiRes, _next: NextFunction) {
	let appError: AppError

	if (err instanceof AppError) {
		appError = err
	} else if (err instanceof ZodError) {
		appError = new AppError(
			400,
			'VALIDATION_ERROR',
			'Request validation failed',
			err.issues,
		)
	} else if (err instanceof multer.MulterError) {
		appError = new AppError(400, 'UPLOAD_ERROR', err.message)
	} else if (
		err instanceof Prisma.PrismaClientKnownRequestError &&
		err.code === 'P2002'
	) {
		appError = new AppError(409, 'CONFLICT', 'A record with these values already exists')
	} else if (
		err instanceof Prisma.PrismaClientKnownRequestError &&
		err.code === 'P2025'
	) {
		appError = new AppError(404, 'NOT_FOUND', 'Record not found')
	} else {
		appError = new AppError(500, 'INTERNAL_ERROR', 'An unexpected server error occurred')
	}

	const context = { err, requestId: req.id, method: req.method, path: req.path }
	if (appError.status >= 500) logger.error(context, 'Request failed')
	else logger.warn(context, 'Request rejected')

	res.status(appError.status).json({
		success: false,
		error: appError.toJSON(),
	})
}

export default handleErr as ErrorRequestHandler
