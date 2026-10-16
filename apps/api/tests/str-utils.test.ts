import { describe, expect, it } from 'vitest'

import { shortid } from '../utils/StrUtils'

describe('session code generation', () => {
	it('generates cryptographically random, valid session codes', () => {
		const codes = new Set(Array.from({ length: 1_000 }, () => shortid()))

		expect(codes.size).toBe(1_000)
		for (const code of codes) expect(code).toMatch(/^[A-Z0-9]{14}$/)
	})
})
