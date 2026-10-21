import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
	appendFileSync,
	accessSync,
	constants,
	cpSync,
	mkdtempSync,
	mkdirSync,
	readFileSync,
	rmSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, join } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import test from 'node:test'
import { verifyHarnessIdentity } from './harness-identity.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const read = path => readFileSync(join(root, path), 'utf8')

test('both hosts share canonical instructions and a minimal selection', () => {
	assert.equal(read('CLAUDE.md').trim(), '@AGENTS.md')
	const manifest = JSON.parse(read('.mirket/project.json'))
	assert.deepEqual([...manifest.targets].sort(), ['claude', 'codex'])
	assert.deepEqual(manifest.profiles, ['project-foundation'])
	assert.equal(manifest.target_skills, undefined)
	assert.equal(new Set(manifest.skills).size, manifest.skills.length)
	for (const skill of [
		'architecture-review',
		'debugging',
		'test-design',
		'release-operations',
	]) {
		assert.ok(
			!manifest.skills.includes(skill),
			`${skill} is already selected by project-foundation`,
		)
	}
	const tracked = spawnSync('git', ['ls-files', '.mirket/project.lock'], {
		cwd: root,
		encoding: 'utf8',
	})
	assert.equal(tracked.status, 0, tracked.stderr)
	assert.equal(tracked.stdout, '', 'the synchronization mutex must not be committed')
})

for (const target of ['.agents', '.claude']) {
	for (const failure of ['modified', 'missing']) {
		test(`${target}: the real doctor rejects ${failure} managed guidance`, () => {
			const fixture = mkdtempSync(join(tmpdir(), 'mirket-adoption-'))
			try {
				mkdirSync(join(fixture, '.mirket'))
				cpSync(join(root, '.mirket/project.json'), join(fixture, '.mirket/project.json'))
				for (const host of ['.agents', '.claude']) {
					cpSync(join(root, host, 'skills'), join(fixture, host, 'skills'), {
						recursive: true,
					})
				}
				const doctor = () =>
					spawnSync('mirket', ['project', 'doctor', '--project', fixture, '--json'], {
						encoding: 'utf8',
					})
				const valid = doctor()
				assert.equal(valid.status, 0, valid.stderr || valid.stdout)
				assert.equal(JSON.parse(valid.stdout).ok, true)
				const path = join(fixture, target, 'skills/debugging/SKILL.md')
				if (failure === 'modified') appendFileSync(path, '\nUnapproved fixture change.\n')
				else rmSync(path)
				const broken = doctor()
				assert.equal(broken.status, 1, broken.stderr || broken.stdout)
				assert.equal(JSON.parse(broken.stdout).ok, false)
				assert.match(broken.stdout, /conflict|missing|changed|modified|digest/i)
			} finally {
				rmSync(fixture, { recursive: true, force: true })
			}
		})
	}
}

const pin = JSON.parse(read('scripts/mirket-release.json'))

test('pinned assets belong to one official release', () => {
	assert.equal(pin.release, `mirket-v${pin.version}`)
	assert.match(pin.release_manifest_sha256, /^[0-9a-f]{64}$/)
	assert.equal(new Set(pin.assets.map(asset => asset.target)).size, pin.assets.length)
	for (const asset of pin.assets) {
		assert.equal(
			new URL(asset.url).origin,
			'https://github.com',
			'asset must come from the official release host',
		)
		assert.ok(
			asset.url.startsWith(
				`https://github.com/codemirket/harness/releases/download/${pin.release}/mirket-`,
			),
			'asset URL must use the pinned repository and tag',
		)
		assert.match(asset.sha256, /^[0-9a-f]{64}$/)
	}
})

test('a clean CI home verifies a standalone release without claiming desktop activation', () => {
	const home = mkdtempSync(join(tmpdir(), 'mirket-ci-home-'))
	try {
		const runtime = spawnSync('mirket', ['--home', home, 'info', '--json'], {
			encoding: 'utf8',
		})
		assert.equal(runtime.status, 0, runtime.stderr)
		const identity = JSON.parse(runtime.stdout)
		assert.equal(identity.installed_binary.sha256, null)
		verifyHarnessIdentity(identity, pin, { requireInstalled: false })
		assert.throws(() => verifyHarnessIdentity(identity, pin))
	} finally {
		rmSync(home, { recursive: true, force: true })
	}
})

test('the installed harness matches the published bytes, source and catalog', () => {
	const executable = (process.env.PATH ?? '')
		.split(delimiter)
		.map(directory =>
			join(directory, process.platform === 'win32' ? 'mirket.exe' : 'mirket'),
		)
		.find(path => {
			try {
				accessSync(path, constants.X_OK)
				return true
			} catch {
				return false
			}
		})
	assert.ok(executable, 'Mirket executable must be available on PATH')
	const runtime = spawnSync(executable, ['info', '--json'], { encoding: 'utf8' })
	assert.equal(runtime.status, 0, runtime.stderr)
	const identity = JSON.parse(runtime.stdout)
	verifyHarnessIdentity(identity, pin, { requireInstalled: false })
	assert.equal(
		createHash('sha256').update(readFileSync(executable)).digest('hex'),
		identity.process.executable_sha256,
		'Terminal executable bytes must match the reported process',
	)
	if (identity.installed_binary.sha256 !== null) {
		assert.equal(
			createHash('sha256')
				.update(readFileSync(identity.installed_binary.path))
				.digest('hex'),
			identity.installed_binary.sha256,
			'Installed file bytes must match the reported identity',
		)
	}
})

test('a same-version replacement, stale source/catalog or process fails verification', () => {
	const asset = pin.assets[0]
	const identity = {
		process: {
			version: pin.version,
			target: asset.target,
			executable_sha256: asset.sha256,
			source_sha256: pin.source_sha256,
		},
		catalog: { sha256: pin.catalog_sha256 },
		installed_binary: { matches_process: true, sha256: asset.sha256 },
	}
	verifyHarnessIdentity(identity, pin)
	const standalone = structuredClone(identity)
	standalone.installed_binary = { sha256: null, matches_process: null }
	assert.throws(() => verifyHarnessIdentity(standalone, pin))
	verifyHarnessIdentity(standalone, pin, { requireInstalled: false })
	for (const [section, field, value] of [
		['process', 'executable_sha256', '0'.repeat(64)],
		['process', 'source_sha256', '0'.repeat(64)],
		['catalog', 'sha256', '0'.repeat(64)],
		['installed_binary', 'sha256', '0'.repeat(64)],
		['installed_binary', 'matches_process', false],
	]) {
		const changed = structuredClone(identity)
		changed[section][field] = value
		assert.throws(() => verifyHarnessIdentity(changed, pin))
	}
})
