function integer(value: string | undefined, fallback: number) {
	const parsed = Number.parseInt(value ?? '', 10)
	return Number.isFinite(parsed) ? parsed : fallback
}

function boolean(value: string | undefined, fallback: boolean) {
	if (value === undefined) return fallback
	return ['1', 'true', 'yes'].includes(value.toLowerCase())
}

function origins(value: string | undefined) {
	return (value ?? 'http://localhost:3000')
		.split(',')
		.map(origin => origin.trim())
		.filter(Boolean)
}

function trustProxy(value: string | undefined): boolean | number {
	if (!value) return false
	if (/^\d+$/.test(value)) return Number.parseInt(value, 10)
	return boolean(value, false)
}

const nodeEnv = process.env.NODE_ENV ?? 'development'
const jwtSecret =
	process.env.JWT_SECRET ?? 'local-development-secret-change-before-deployment'

if (nodeEnv === 'production' && jwtSecret.length < 32) {
	throw new Error('JWT_SECRET must contain at least 32 characters in production')
}

export const env = {
	nodeEnv,
	isProduction: nodeEnv === 'production',
	apiPort: integer(process.env.DEFAULT_PORT ?? process.env.PORT, 3001),
	socketPort: integer(process.env.SOCKET_PORT ?? process.env.PORT, 3002),
	jwtSecret,
	jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '12h',
	corsOrigins: origins(process.env.CORS_ORIGINS),
	trustProxy: trustProxy(process.env.TRUST_PROXY),
	redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
	remoteImageMaxBytes: integer(process.env.REMOTE_IMAGE_MAX_BYTES, 5_000_000),
	remoteImageTimeoutMs: integer(process.env.REMOTE_IMAGE_TIMEOUT_MS, 8_000),
	gameCountdownMs: integer(process.env.GAME_COUNTDOWN_MS, 5_000),
	matchDeadlineMs: integer(process.env.MATCH_DEADLINE_MS, 60_000),
	shutdownTimeoutMs: integer(process.env.SHUTDOWN_TIMEOUT_MS, 10_000),
	logLevel: process.env.LOG_LEVEL ?? (nodeEnv === 'test' ? 'silent' : 'info'),
}
