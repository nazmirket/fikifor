import dotenv from 'dotenv'
dotenv.config()

import http from 'node:http'

import { createAdapter } from '@socket.io/redis-adapter'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { createClient } from 'redis'
import { Server } from 'socket.io'

import { env } from '../config/env'
import Prisma from '../prisma'
import { logger } from '../utils/logger'
import { renderMetrics } from '../utils/metrics'
import { protect } from './auth'
import { resumeGameRuntime, stopGameRuntime } from './gameRuntime'
import { reconcilePresence, registerPresence } from './presence'
import { registerSessionHandlers } from './sessionHandlers'
import type { FikiforServer } from './types'

export async function createSocketRuntime(port = env.socketPort) {
	await Prisma.$connect()
	const publisher = createClient({ url: env.redisUrl })
	const subscriber = publisher.duplicate()
	publisher.on('error', error => logger.error({ err: error }, 'Redis publisher error'))
	subscriber.on('error', error => logger.error({ err: error }, 'Redis subscriber error'))
	await Promise.all([publisher.connect(), subscriber.connect()])

	const app = express()
	app.disable('x-powered-by')
	app.use(helmet())
	app.use(
		cors({
			origin(origin, callback) {
				if (!origin || env.corsOrigins.includes(origin)) return callback(null, true)
				return callback(new Error('Origin is not allowed by CORS'))
			},
		}),
	)
	app.use(express.json({ limit: '32kb' }))
	app.get('/health', (_req, res) =>
		res.status(200).json({ success: true, data: { status: 'ok' } }),
	)
	app.get('/ready', async (_req, res) => {
		try {
			await Promise.all([Prisma.$queryRaw`SELECT 1`, publisher.ping()])
			return res.status(200).json({ success: true, data: { status: 'ready' } })
		} catch {
			return res.status(503).json({
				success: false,
				error: { code: 'NOT_READY', message: 'A socket dependency is unavailable' },
			})
		}
	})

	const httpServer = http.createServer(app)
	const io: FikiforServer = new Server(httpServer, {
		cors: {
			credentials: true,
			origin: env.corsOrigins,
		},
		maxHttpBufferSize: 100_000,
	})
	app.get('/metrics', async (_req, res) => {
		const activeSessions = await Prisma.session.count({
			where: { started: true, ended: false },
		})
		res
			.type('text/plain; version=0.0.4')
			.status(200)
			.send(
				renderMetrics({
					fikifor_active_sessions: {
						help: 'Started game sessions that have not ended',
						value: activeSessions,
					},
					fikifor_socket_connections: {
						help: 'Currently connected Socket.IO clients',
						value: io.engine.clientsCount,
					},
				}),
			)
	})
	io.adapter(createAdapter(publisher, subscriber))
	const reconciledUsers = await reconcilePresence(io)
	await resumeGameRuntime(io)
	logger.info({ reconciledUsers }, 'Socket presence reconciled')
	io.use(protect)
	io.on('connection', socket => {
		registerPresence(io, socket)
		registerSessionHandlers(io, socket)
	})

	const close = async () => {
		stopGameRuntime()
		await new Promise<void>(resolve => io.close(() => resolve()))
		await Promise.allSettled([publisher.quit(), subscriber.quit(), Prisma.$disconnect()])
	}

	await new Promise<void>(resolve => {
		httpServer.listen(port, () => resolve())
	})

	return { httpServer, io, close }
}

async function start() {
	const runtime = await createSocketRuntime()
	logger.info({ port: env.socketPort }, 'Socket server listening')

	const shutdown = async (signal: string) => {
		logger.info({ signal }, 'Socket shutdown started')
		const forceExit = setTimeout(() => process.exit(1), env.shutdownTimeoutMs)
		forceExit.unref()
		await runtime.close()
		clearTimeout(forceExit)
		logger.info('Socket shutdown completed')
	}

	for (const signal of ['SIGINT', 'SIGTERM'] as const) {
		process.once(signal, () => void shutdown(signal))
	}
}

if (require.main === module) {
	start().catch(error => {
		logger.fatal({ err: error }, 'Socket server failed to start')
		process.exit(1)
	})
}
