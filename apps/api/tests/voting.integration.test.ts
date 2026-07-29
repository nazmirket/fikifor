import type { PrismaClient } from '@prisma/client'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const integration = process.env.TEST_DATABASE_URL ? describe : describe.skip

integration('concurrent voting', () => {
	let prisma: PrismaClient
	let submitVote: typeof import('../services/GameService').submitVote

	beforeAll(async () => {
		process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
		;({ default: prisma } = await import('../prisma'))
		;({ submitVote } = await import('../services/GameService'))

		await prisma.sessionVote.deleteMany()
		await prisma.sessionMatch.deleteMany()
		await prisma.participant.deleteMany()
		await prisma.session.deleteMany()
		await prisma.quizItem.deleteMany()
		await prisma.quiz.deleteMany()
		await prisma.image.deleteMany()
		await prisma.user.deleteMany()
	})

	afterAll(async () => {
		await prisma?.$disconnect()
	})

	it('completes and advances a match exactly once under simultaneous votes', async () => {
		const [admin, player] = await Promise.all([
			prisma.user.create({ data: { username: 'race-admin', password: 'hash' } }),
			prisma.user.create({ data: { username: 'race-player', password: 'hash' } }),
		])
		const cover = await prisma.image.create({
			data: { folder: 'test', name: 'race-cover.jpeg' },
		})
		const quiz = await prisma.quiz.create({
			data: {
				ownerId: admin.id,
				coverId: cover.id,
				title: 'Race test',
				description: 'Concurrent voting fixture',
				size: 32,
				items: { create: [{ title: 'First' }, { title: 'Second' }] },
			},
			include: { items: true },
		})
		const session = await prisma.session.create({
			data: {
				code: 'RACETEST000001',
				quizId: quiz.id,
				adminId: admin.id,
				cluster: 1,
				started: true,
				participants: {
					create: [{ userId: admin.id }, { userId: player.id }],
				},
				matches: {
					create: {
						cluster: 1,
						order: 1,
						firstItemId: quiz.items[0].id,
						secondItemId: quiz.items[1].id,
					},
				},
			},
			include: { matches: true },
		})
		const match = session.matches[0]

		const outcomes = await Promise.all([
			submitVote(match.id, quiz.items[0].id, admin.id),
			submitVote(match.id, quiz.items[1].id, player.id),
		])

		expect(outcomes.filter(outcome => outcome.matchCompleted)).toHaveLength(1)
		expect(outcomes.filter(outcome => outcome.transition.type === 'over')).toHaveLength(1)

		const [storedMatch, storedSession, votes] = await Promise.all([
			prisma.sessionMatch.findUniqueOrThrow({ where: { id: match.id } }),
			prisma.session.findUniqueOrThrow({ where: { id: session.id } }),
			prisma.sessionVote.findMany({ where: { matchId: match.id } }),
		])
		expect(storedMatch.completed).toBe(true)
		expect([quiz.items[0].id, quiz.items[1].id]).toContain(storedMatch.winnerId)
		expect(storedSession.ended).toBe(true)
		expect(storedSession.favoriteId).toBe(storedMatch.winnerId)
		expect(votes).toHaveLength(2)

		await expect(submitVote(match.id, quiz.items[0].id, admin.id)).rejects.toMatchObject({
			code: 'CONFLICT',
		})
	})
})
