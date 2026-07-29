import { randomUUID } from 'node:crypto'

import pino from 'pino'
import pinoHttp from 'pino-http'

import { env } from '../config/env'

export const logger = pino({
	level: env.logLevel,
	redact: {
		paths: [
			'req.headers.authorization',
			'req.headers.cookie',
			'password',
			'passwordConfirmation',
			'token',
		],
		censor: '[redacted]',
	},
})

export const requestLogger = pinoHttp({
	logger,
	genReqId(req, res) {
		const requestId = req.headers['x-request-id']?.toString() ?? randomUUID()
		res.setHeader('x-request-id', requestId)
		return requestId
	},
	customLogLevel(_req, res, error) {
		if (error || res.statusCode >= 500) return 'error'
		if (res.statusCode >= 400) return 'warn'
		return 'info'
	},
})
