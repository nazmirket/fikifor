import { describe, expect, it } from 'vitest'

import { testEnvironment } from './environment'

const local = {
	TEST_DATABASE_URL: 'postgresql://test:test@127.0.0.1:15432/fikifor_test',
	REDIS_URL: 'redis://127.0.0.1:16379',
}

describe('test destination contract', () => {
	it('uses the explicit test database even when an application database is inherited', () => {
		expect(
			testEnvironment({ ...local, DATABASE_URL: 'postgresql://production/app' }),
		).toEqual({ ...local, DATABASE_URL: local.TEST_DATABASE_URL })
	})

	it.each([
		undefined,
		'postgresql://remote.example/fikifor_test',
		'postgresql://localhost/fikifor',
		'postgresql://localhost/fikifor_test?host=remote.example',
		'file:/tmp/fikifor_test',
	])('rejects unsafe database %s before connecting', TEST_DATABASE_URL => {
		expect(() => testEnvironment({ ...local, TEST_DATABASE_URL })).toThrow()
	})

	it.each([undefined, 'redis://remote.example', 'redis://localhost?host=remote.example'])(
		'rejects implicit or remote Redis %s',
		REDIS_URL => {
			expect(() => testEnvironment({ ...local, REDIS_URL })).toThrow()
		},
	)
})
