import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { verifyHarnessIdentity } from './harness-identity.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const pin = JSON.parse(readFileSync(new URL('./mirket-release.json', import.meta.url)))

function mirket(args) {
	const result = spawnSync('mirket', [...args, '--json'], {
		cwd: root,
		encoding: 'utf8',
		timeout: 30_000,
	})
	if (result.error?.code === 'ENOENT') {
		throw new Error(
			'Mirket CLI unavailable on PATH. Install the reviewed release with device-level authorization; see docs/harness.md.',
		)
	}
	if (result.error) throw result.error
	if (result.status !== 0) {
		throw new Error(
			result.stderr.trim() || result.stdout.trim() || `mirket ${args[0]} failed`,
		)
	}
	return JSON.parse(result.stdout)
}

try {
	const args = process.argv.slice(2)
	if (args.length !== 0 && (args.length !== 2 || args[0] !== '--connection')) {
		throw new Error(
			'Usage: pnpm agents:runtime [--connection /path/to/runtime-status.json]',
		)
	}
	verifyHarnessIdentity(mirket(['info']), pin)
	console.log(
		'Installed CLI matches the reviewed release. This does not verify a desktop connection.',
	)
	if (args.length) {
		const response = JSON.parse(readFileSync(args[1], 'utf8'))
		verifyHarnessIdentity(response.structuredContent ?? response, pin)
		console.log(
			'Supplied connection identity matches. Retain its client, connection and observation time; this file is not live attestation.',
		)
	}
	mirket(['task', 'list', '--project', root, '--limit', '1'])
	console.log(
		'Registered project access passed. Memory retrieval, worker recovery and design output require their own relevant checks.',
	)
} catch (error) {
	console.error(`Local Mirket readiness failed: ${error.message}`)
	console.error(
		'Preserve registration and state; follow docs/harness.md. Do not edit SQLite, unregister or reinitialize to bypass identity checks. Continue only independent work.',
	)
	process.exitCode = 1
}
