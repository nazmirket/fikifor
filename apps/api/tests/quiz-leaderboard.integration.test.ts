import type { PrismaClient } from '@prisma/client'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const integration = process.env.TEST_DATABASE_URL ? describe : describe.skip

integration('participant-weighted quiz leaderboard', () => {
	let prisma: PrismaClient
	let getQuizLeaderboard: typeof import('../services/QuizService').getQuizLeaderboard
	let getQuizes: typeof import('../services/QuizService').getQuizes
	let ownerId: number
	let quizId: number
	let firstItemId: number
	let secondItemId: number
	let participantIds: number[]

	beforeAll(async () => {
		process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
		;({ default: prisma } = await import('../prisma'))
		;({ getQuizLeaderboard, getQuizes } = await import('../services/QuizService'))

		await prisma.sessionVote.deleteMany()
		await prisma.sessionMatch.deleteMany()
		await prisma.participant.deleteMany()
		await prisma.session.deleteMany()
		await prisma.quizItem.deleteMany()
		await prisma.quiz.deleteMany()
		await prisma.image.deleteMany()
		await prisma.user.deleteMany()

		const users = await Promise.all(
			Array.from({ length: 5 }, (_, index) =>
				prisma.user.create({
					data: {
						username: `ranking-user-${index}`,
						displayName: index === 0 ? 'Ranking Owner' : null,
						password: 'hash',
					},
				}),
			),
		)
		ownerId = users[0].id
		participantIds = users.map(user => user.id)

		const images = await Promise.all(
			Array.from({ length: 3 }, (_, index) =>
				prisma.image.create({
					data: { folder: 'test', name: `ranking-${index}.jpeg` },
				}),
			),
		)
		const quiz = await prisma.quiz.create({
			data: {
				ownerId,
				coverId: images[0].id,
				title: 'Weighted ranking fixture',
				description: 'Participant counts decide aggregate score',
				size: 32,
				published: true,
				items: {
					create: [
						{ title: 'First city', imageId: images[1].id },
						{ title: 'Second city', imageId: images[2].id },
					],
				},
			},
			include: { items: { orderBy: { id: 'asc' } } },
		})
		quizId = quiz.id
		firstItemId = quiz.items[0].id
		secondItemId = quiz.items[1].id

		async function completedSession(code: string, favoriteId: number, userIds: number[]) {
			await prisma.session.create({
				data: {
					code,
					quizId,
					adminId: ownerId,
					cluster: 0,
					started: true,
					ended: true,
					favoriteId,
					participants: {
						createMany: { data: userIds.map(userId => ({ userId })) },
					},
				},
			})
		}

		await completedSession('RANKING0000001', firstItemId, participantIds.slice(0, 2))
		await completedSession('RANKING0000002', firstItemId, participantIds)
		await completedSession('RANKING0000003', secondItemId, participantIds.slice(0, 4))
	})

	afterAll(async () => {
		await prisma?.$disconnect()
	})

	it('sums participant counts for every favorite and ranks by weighted score', async () => {
		const leaderboard = await getQuizLeaderboard(quizId)

		expect(leaderboard).toMatchObject({
			completedSessions: 3,
			participantWeight: 11,
		})
		expect(leaderboard.entries).toHaveLength(2)
		expect(leaderboard.entries[0]).toMatchObject({
			rank: 1,
			item: { id: firstItemId, title: 'First city' },
			sessionWins: 2,
			weightedScore: 7,
			share: 63.6,
		})
		expect(leaderboard.entries[1]).toMatchObject({
			rank: 2,
			item: { id: secondItemId, title: 'Second city' },
			sessionWins: 1,
			weightedScore: 4,
			share: 36.4,
		})
	})

	it('exposes and searches the publisher display name', async () => {
		const result = await getQuizes({
			q: 'ranking owner',
			sortBy: 'relevance',
			sortOrder: 'desc',
			page: 1,
			pageSize: 12,
		})

		expect(result.total).toBe(1)
		expect(result.items[0].owner).toEqual({
			username: 'ranking-user-0',
			displayName: 'Ranking Owner',
		})
	})

	it('conceals aggregate results after the quiz becomes private', async () => {
		await prisma.quiz.update({ where: { id: quizId }, data: { published: false } })

		await expect(getQuizLeaderboard(quizId)).rejects.toMatchObject({
			status: 404,
			code: 'NOT_FOUND',
		})
		await expect(getQuizLeaderboard(quizId, ownerId)).resolves.toMatchObject({
			completedSessions: 3,
		})
	})
})
