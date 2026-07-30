import { describe, expect, it } from 'vitest'

import { publicQuizQuerySchema, sessionVoteInputSchema, signupInputSchema } from './index'

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

	it('normalizes public quiz discovery query parameters', () => {
		expect(
			publicQuizQuerySchema.parse({
				q: '  film  ',
				sortBy: 'createdAt',
				sortOrder: 'asc',
				page: '2',
				pageSize: '24',
			}),
		).toEqual({
			q: 'film',
			sortBy: 'createdAt',
			sortOrder: 'asc',
			page: 2,
			pageSize: 24,
		})
	})
})
