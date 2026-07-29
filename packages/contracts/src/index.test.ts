import { describe, expect, it } from 'vitest'

import { sessionVoteInputSchema, signupInputSchema } from './index'

describe('shared contracts', () => {
	it('normalizes valid vote identifiers', () => {
		expect(sessionVoteInputSchema.parse({ matchId: '2', itemId: 3 })).toEqual({
			matchId: 2,
			itemId: 3,
		})
	})

	it('rejects mismatched signup passwords', () => {
		const result = signupInputSchema.safeParse({
			username: 'player1',
			password: 'password-one',
			passwordConfirmation: 'password-two',
		})
		expect(result.success).toBe(false)
	})
})
