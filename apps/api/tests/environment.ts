const loopback = new Set(['localhost', '127.0.0.1', '[::1]'])

export function testEnvironment(environment: NodeJS.ProcessEnv) {
	const database = environment.TEST_DATABASE_URL
	if (!database) {
		throw new Error('TEST_DATABASE_URL is required; use pnpm verify:isolated')
	}
	const databaseUrl = new URL(database)
	if (
		!['postgres:', 'postgresql:'].includes(databaseUrl.protocol) ||
		!loopback.has(databaseUrl.hostname) ||
		!/^\/[a-zA-Z0-9_]+_test$/.test(databaseUrl.pathname) ||
		databaseUrl.search
	) {
		throw new Error(
			'TEST_DATABASE_URL must address a local disposable database ending in _test, without query overrides',
		)
	}
	const redis = environment.REDIS_URL
	if (!redis)
		throw new Error('REDIS_URL must explicitly identify a disposable local Redis')
	const redisUrl = new URL(redis)
	if (
		redisUrl.protocol !== 'redis:' ||
		!loopback.has(redisUrl.hostname) ||
		redisUrl.search
	) {
		throw new Error(
			'REDIS_URL must address disposable local Redis without query overrides',
		)
	}
	return { DATABASE_URL: database, TEST_DATABASE_URL: database, REDIS_URL: redis }
}
