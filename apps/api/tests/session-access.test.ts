import { beforeEach, describe, expect, it, vi } from 'vitest'

const { quizRead, sessionCreate, transaction } = vi.hoisted(() => ({
	quizRead: vi.fn(),
	sessionCreate: vi.fn(),
	transaction: vi.fn(),
}))

vi.mock('../prisma', () => ({
	default: {
		$transaction: transaction,
	},
}))

import { createSession } from '../services/SessionService'

describe('quiz session access', () => {
	beforeEach(() => {
		quizRead.mockReset()
		sessionCreate.mockReset()
		transaction.mockReset()
		transaction.mockImplementation(callback =>
			callback({
				$queryRaw: quizRead,
				session: { create: sessionCreate },
			}),
		)
	})

	it('allows the owner or any user of a published quiz to create a session', async () => {
		quizRead.mockResolvedValue([{ size: 32 }])
		sessionCreate.mockResolvedValue({})

		const code = await createSession(7, 42)

		expect(code).toHaveLength(14)
		expect(quizRead).toHaveBeenCalledOnce()
		expect(sessionCreate).toHaveBeenCalledWith({
			data: expect.objectContaining({
				cluster: 16,
				admin: { connect: { id: 42 } },
				quiz: { connect: { id: 7 } },
				participants: { create: { userId: 42 } },
			}),
		})
	})

	it('conceals an unavailable private quiz', async () => {
		quizRead.mockResolvedValue([])

		await expect(createSession(7, 42)).rejects.toMatchObject({
			status: 404,
			code: 'NOT_FOUND',
		})
		expect(sessionCreate).not.toHaveBeenCalled()
	})
})
