import { describe, expect, it } from 'vitest'

import { isPublicIpAddress } from '../services/FileService'

describe('remote image network policy', () => {
	it.each([
		'127.0.0.1',
		'10.1.2.3',
		'172.16.0.1',
		'192.168.1.1',
		'169.254.169.254',
		'::1',
		'fd00::1',
	])('rejects private address %s', address => {
		expect(isPublicIpAddress(address)).toBe(false)
	})

	it.each(['1.1.1.1', '8.8.8.8', '2606:4700:4700::1111'])(
		'allows public address %s',
		address => {
			expect(isPublicIpAddress(address)).toBe(true)
		},
	)
})
