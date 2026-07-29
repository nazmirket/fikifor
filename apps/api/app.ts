import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'

import Prisma from './prisma'
import { env } from './config/env'
import AuthRouter from './routes/v1/auth'
import FileRouter from './routes/v1/files'
import QuizRouter from './routes/v1/quizes'
import SessionRouter from './routes/v1/sessions'
import ErrorMd from './middleware/error'
import { forbidden, notFound } from './utils/AppError'
import { requestLogger } from './utils/logger'

export function createApp() {
	const app = express()

	app.disable('x-powered-by')
	app.set('trust proxy', env.trustProxy)
	app.use(requestLogger)
	app.use(helmet())
	app.use(
		cors({
			credentials: true,
			origin(origin, callback) {
				if (!origin || env.corsOrigins.includes(origin)) return callback(null, true)
				return callback(forbidden('Origin is not allowed by CORS'))
			},
		}),
	)
	app.use(express.urlencoded({ extended: false, limit: '100kb' }))
	app.use(express.json({ limit: '100kb' }))

	app.get('/health', (req, res) =>
		res.status(200).json({
			success: true,
			data: { status: 'ok', requestId: req.id },
		}),
	)
	app.get('/ready', async (_req, res) => {
		try {
			await Prisma.$queryRaw`SELECT 1`
			return res.status(200).json({ success: true, data: { status: 'ready' } })
		} catch {
			return res.status(503).json({
				success: false,
				error: { code: 'NOT_READY', message: 'Database is unavailable' },
			})
		}
	})

	const authLimiter = rateLimit({
		windowMs: 15 * 60 * 1000,
		limit: 20,
		standardHeaders: 'draft-8',
		legacyHeaders: false,
		message: {
			success: false,
			error: {
				code: 'RATE_LIMITED',
				message: 'Too many authentication attempts; please try again later',
			},
		},
	})

	app.use('/api/v1/auth', authLimiter, AuthRouter)
	app.use('/api/v1/files', FileRouter)
	app.use('/api/v1/quizes', QuizRouter)
	app.use('/api/v1/sessions', SessionRouter)
	app.use((_req, _res, next) => next(notFound('Route not found')))
	app.use(ErrorMd)

	return app
}
