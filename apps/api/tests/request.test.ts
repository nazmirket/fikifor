import type { Request } from 'express'
import { describe, expect, it } from 'vitest'

import { numberParam } from '../utils/request'

describe('request parameter helpers', () => {
	it.each([
		['validated number', 12],
		['raw numeric string', '12'],
	])('accepts a positive ID from a %s', (_label, value) => {
		const request = { params: { quizId: value } } as unknown as Request
		expect(numberParam(request, 'quizId')).toBe(12)
	})

	it.each([0, -1, '1.5', 'not-a-number', undefined])('rejects invalid IDs: %s', value => {
		const request = { params: { quizId: value } } as unknown as Request
		expect(() => numberParam(request, 'quizId')).toThrow('Invalid quizId parameter')
	})
})
