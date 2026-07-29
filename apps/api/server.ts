import dotenv from 'dotenv'
dotenv.config()

import Prisma from './prisma'
import { createApp } from './app'
import { env } from './config/env'
import { logger } from './utils/logger'

async function start() {
	await Prisma.$connect()
	const app = createApp()
	const server = app.listen(env.apiPort, () => {
		logger.info({ port: env.apiPort }, 'API listening')
	})

	const shutdown = async (signal: string) => {
		logger.info({ signal }, 'API shutdown started')
		const forceExit = setTimeout(() => process.exit(1), env.shutdownTimeoutMs)
		forceExit.unref()
		await new Promise<void>(resolve => server.close(() => resolve()))
		await Prisma.$disconnect()
		clearTimeout(forceExit)
		logger.info('API shutdown completed')
	}

	for (const signal of ['SIGINT', 'SIGTERM'] as const) {
		process.once(signal, () => void shutdown(signal))
	}
}

start().catch(error => {
	logger.fatal({ err: error }, 'API failed to start')
	process.exit(1)
})
