import type { PrismaClient } from '@prisma/client'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const integration = process.env.TEST_DATABASE_URL ? describe : describe.skip

integration('concurrent voting', () => {
	let prisma: PrismaClient
	let submitVote: typeof import('../services/GameService').submitVote
	let expireMatch: typeof import('../services/GameService').expireMatch

	beforeAll(async () => {
		process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
		;({ default: prisma } = await import('../prisma'))
		;({ submitVote, expireMatch } = await import('../services/GameService'))

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
		await expect(
			prisma.quiz.findUniqueOrThrow({
				where: { id: quiz.id },
				select: { completedSessionCount: true, participantWeight: true },
			}),
		).resolves.toEqual({ completedSessionCount: 1, participantWeight: 2 })

		await expect(submitVote(match.id, quiz.items[0].id, admin.id)).rejects.toMatchObject({
			code: 'CONFLICT',
		})
	})

	it('accepts a high fan-in vote burst and finalizes only once', async () => {
		const playerCount = 64
		await prisma.user.createMany({
			data: Array.from({ length: playerCount }, (_, index) => ({
				username: `fan-in-player-${index}`,
				password: 'hash',
			})),
		})
		const players = await prisma.user.findMany({
			where: { username: { startsWith: 'fan-in-player-' } },
			orderBy: { id: 'asc' },
		})
		const cover = await prisma.image.create({
			data: { folder: 'test', name: 'fan-in-cover.jpeg' },
		})
		const quiz = await prisma.quiz.create({
			data: {
				ownerId: players[0].id,
				coverId: cover.id,
				title: 'Fan-in test',
				description: 'High concurrency voting fixture',
				size: 32,
				items: { create: [{ title: 'First' }, { title: 'Second' }] },
			},
			include: { items: true },
		})
		const session = await prisma.session.create({
			data: {
				code: 'FANINTEST00001',
				quizId: quiz.id,
				adminId: players[0].id,
				cluster: 1,
				started: true,
				participants: {
					create: players.map(player => ({ userId: player.id })),
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

		const outcomes = await Promise.all(
			players.map((player, index) =>
				submitVote(match.id, quiz.items[index % 2].id, player.id),
			),
		)

		expect(outcomes).toHaveLength(playerCount)
		expect(outcomes.filter(outcome => outcome.matchCompleted)).toHaveLength(1)
		expect(outcomes.filter(outcome => outcome.transition.type === 'over')).toHaveLength(1)
		await expect(
			prisma.sessionVote.count({ where: { matchId: match.id } }),
		).resolves.toBe(playerCount)
	})

	it('rejects votes for a later match in the current round', async () => {
		const user = await prisma.user.create({
			data: { username: 'active-match-player', password: 'hash' },
		})
		const cover = await prisma.image.create({
			data: { folder: 'test', name: 'active-match-cover.jpeg' },
		})
		const quiz = await prisma.quiz.create({
			data: {
				ownerId: user.id,
				coverId: cover.id,
				title: 'Active match test',
				description: 'Future match protection fixture',
				size: 4,
				items: {
					create: Array.from({ length: 4 }, (_, index) => ({
						title: `Active item ${index}`,
					})),
				},
			},
			include: { items: { orderBy: { id: 'asc' } } },
		})
		const session = await prisma.session.create({
			data: {
				code: 'ACTIVEMATCH001',
				quizId: quiz.id,
				adminId: user.id,
				cluster: 2,
				started: true,
				participants: { create: { userId: user.id } },
				matches: {
					create: [
						{
							cluster: 2,
							order: 1,
							firstItemId: quiz.items[0].id,
							secondItemId: quiz.items[1].id,
						},
						{
							cluster: 2,
							order: 2,
							firstItemId: quiz.items[2].id,
							secondItemId: quiz.items[3].id,
						},
					],
				},
			},
			include: { matches: { orderBy: { order: 'asc' } } },
		})

		await expect(
			submitVote(session.matches[1].id, quiz.items[2].id, user.id),
		).rejects.toMatchObject({
			code: 'CONFLICT',
			message: 'This is not the active match',
		})
		await expect(
			prisma.sessionVote.count({ where: { matchId: session.matches[1].id } }),
		).resolves.toBe(0)
	})

	it('finalizes at the deadline without waiting for disconnected non-voters', async () => {
		const [admin, absentPlayer] = await Promise.all([
			prisma.user.create({ data: { username: 'deadline-admin', password: 'hash' } }),
			prisma.user.create({ data: { username: 'deadline-absent', password: 'hash' } }),
		])
		const cover = await prisma.image.create({
			data: { folder: 'test', name: 'deadline-cover.jpeg' },
		})
		const quiz = await prisma.quiz.create({
			data: {
				ownerId: admin.id,
				coverId: cover.id,
				title: 'Deadline test',
				description: 'Disconnected participant timeout fixture',
				size: 2,
				items: { create: [{ title: 'First' }, { title: 'Second' }] },
			},
			include: { items: true },
		})
		const session = await prisma.session.create({
			data: {
				code: 'DEADLINETEST01',
				quizId: quiz.id,
				adminId: admin.id,
				cluster: 1,
				started: true,
				participants: {
					create: [
						{ userId: admin.id, online: true },
						{ userId: absentPlayer.id, online: false },
					],
				},
				matches: {
					create: {
						cluster: 1,
						order: 1,
						firstItemId: quiz.items[0].id,
						secondItemId: quiz.items[1].id,
						deadlineAt: new Date(Date.now() - 1_000),
					},
				},
			},
			include: { matches: true },
		})

		const outcome = await expireMatch(session.matches[0].id)
		expect(outcome?.matchCompleted).toBe(true)
		expect(outcome?.transition.type).toBe('over')
		const stored = await prisma.session.findUniqueOrThrow({ where: { id: session.id } })
		expect(stored.ended).toBe(true)
		expect(quiz.items.map(item => item.id)).toContain(stored.favoriteId)
	})
})
