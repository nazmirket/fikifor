import { describe, expect, it } from 'vitest'

import { selectWinner } from '../services/GameService'

describe('tournament winner selection', () => {
	it('selects the item with more votes', () => {
		expect(selectWinner(10, 20, 3, 2)).toBe(10)
		expect(selectWinner(10, 20, 1, 4)).toBe(20)
	})

	it('always resolves a tie to one of the two match items', () => {
		expect([10, 20]).toContain(selectWinner(10, 20, 2, 2))
	})
})
