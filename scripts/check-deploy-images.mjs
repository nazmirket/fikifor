import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const envFile = resolve(root, process.argv[2] ?? 'deploy/.env')
const composeFile = join(root, 'deploy/compose.yml')
const services = ['postgres', 'redis', 'migrate', 'api', 'socket', 'web']
const digestReference = /@sha256:[a-fA-F0-9]{64}$/

const result = spawnSync(
	'podman',
	['compose', '--env-file', envFile, '--file', composeFile, 'config', '--format', 'json'],
	{ cwd: root, encoding: 'utf8' },
)

if (result.error || result.status !== 0) {
	console.error(
		'Deployment Compose configuration failed. Check the environment file and Podman installation.',
	)
	process.exit(1)
}

let config
try {
	config = JSON.parse(result.stdout)
} catch {
	console.error('Podman did not return a valid JSON Compose configuration.')
	process.exit(1)
}

const unpinned = services.filter(
	service => !digestReference.test(config.services?.[service]?.image ?? ''),
)
if (unpinned.length > 0) {
	console.error(`Set digest-pinned image references for: ${unpinned.join(', ')}.`)
	process.exit(1)
}

console.log('Deployment Compose configuration and all six image digests are valid.')
