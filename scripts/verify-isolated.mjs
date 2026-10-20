import { spawn, spawnSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { createServer } from 'node:net'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const name = `fikifor-verify-${randomUUID().slice(0, 8)}`
const containers = []
let child
let interrupted = false

function podman(args) {
	const result = spawnSync('podman', args, { encoding: 'utf8' })
	if (result.status !== 0) throw new Error(result.stderr || `podman ${args[0]} failed`)
	return result.stdout.trim()
}

async function run(args, env) {
	if (interrupted) throw new Error('Verification interrupted')
	await new Promise((resolve, reject) => {
		child = spawn('pnpm', args, { cwd: root, env, stdio: 'inherit' })
		child.once('error', reject)
		child.once('exit', code => {
			child = undefined
			if (code === 0) resolve()
			else reject(new Error(`pnpm ${args.join(' ')} failed (${code})`))
		})
	})
}

async function freePort() {
	const server = createServer()
	await new Promise((resolve, reject) => {
		server.once('error', reject)
		server.listen(0, '127.0.0.1', resolve)
	})
	const port = server.address().port
	await new Promise(resolve => server.close(resolve))
	return String(port)
}

for (const signal of ['SIGINT', 'SIGTERM']) {
	process.on(signal, () => {
		interrupted = true
		child?.kill(signal)
	})
}

try {
	for (const [service, port, image, settings] of [
		[
			'postgres',
			5432,
			'docker.io/library/postgres:16-alpine',
			[
				'-e',
				'POSTGRES_USER=fikifor',
				'-e',
				'POSTGRES_PASSWORD=isolated-test-only',
				'-e',
				'POSTGRES_DB=fikifor_test',
			],
		],
		['redis', 6379, 'docker.io/library/redis:7-alpine', []],
	]) {
		const container = `${name}-${service}`
		podman([
			'run',
			'-d',
			'--name',
			container,
			'-p',
			`127.0.0.1::${port}`,
			...settings,
			image,
		])
		containers.push(container)
	}
	const postgresPort = podman(['port', `${name}-postgres`, '5432'])
		.split(':')
		.at(-1)
	const redisPort = podman(['port', `${name}-redis`, '6379'])
		.split(':')
		.at(-1)
	const env = {
		...process.env,
		DATABASE_URL: `postgresql://fikifor:isolated-test-only@127.0.0.1:${postgresPort}/fikifor_test`,
		TEST_DATABASE_URL: `postgresql://fikifor:isolated-test-only@127.0.0.1:${postgresPort}/fikifor_test`,
		REDIS_URL: `redis://127.0.0.1:${redisPort}`,
		NODE_ENV: 'test',
		JWT_SECRET: 'isolated-verification-secret-at-least-32-characters',
		E2E_WEB_PORT: await freePort(),
		E2E_API_PORT: await freePort(),
		E2E_SOCKET_PORT: await freePort(),
	}
	const deadline = Date.now() + 60_000
	for (;;) {
		if (interrupted) throw new Error('Verification interrupted')
		const pg = spawnSync('podman', [
			'exec',
			`${name}-postgres`,
			'pg_isready',
			'-U',
			'fikifor',
			'-d',
			'fikifor_test',
		])
		const redis = spawnSync('podman', ['exec', `${name}-redis`, 'redis-cli', 'ping'], {
			encoding: 'utf8',
		})
		if (pg.status === 0 && redis.status === 0 && redis.stdout.trim() === 'PONG') break
		if (Date.now() >= deadline)
			throw new Error('Disposable dependencies did not become ready')
		await new Promise(resolve => setTimeout(resolve, 500))
	}
	await run(['db:build'], env)
	await run(['db:deploy'], env)
	await run(['test'], env)
	await run(['build'], env)
	await run(['test:e2e'], env)
} catch (error) {
	console.error(error.message)
	process.exitCode = 1
} finally {
	for (const container of containers.reverse()) {
		try {
			podman(['rm', '-f', '-v', container])
		} catch (error) {
			console.error(`Cleanup failed for ${container}: ${error.message}`)
			process.exitCode = 1
		}
	}
}
