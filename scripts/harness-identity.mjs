import assert from 'node:assert/strict'

// Works for CLI info and an actual client's runtime_status structured content.
// The caller must retain which connection supplied the identity.
export function verifyHarnessIdentity(identity, pin, { requireInstalled = true } = {}) {
	const asset = pin.assets.find(asset => asset.target === identity.process.target)
	assert.ok(asset, `No reviewed release asset for ${identity.process.target}`)
	assert.equal(identity.process.version, pin.version, 'Harness release differs')
	assert.equal(
		identity.process.executable_sha256,
		asset.sha256,
		'Executable differs from published asset',
	)
	assert.equal(
		identity.process.source_sha256,
		pin.source_sha256,
		'Compiled source differs',
	)
	assert.equal(identity.catalog.sha256, pin.catalog_sha256, 'Embedded catalog differs')
	// CI runs a verified standalone asset without installing desktop clients.
	// Live desktop observations must retain the default, stricter contract.
	if (!requireInstalled && identity.installed_binary.sha256 === null) {
		assert.equal(identity.installed_binary.matches_process, null)
		return
	}
	assert.equal(identity.installed_binary.sha256, asset.sha256, 'Installed binary differs')
	assert.equal(
		identity.installed_binary.matches_process,
		true,
		'Running process needs reconnection',
	)
}
