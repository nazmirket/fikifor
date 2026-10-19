import type { PrismaClient } from '@prisma/client'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const integration = process.env.TEST_DATABASE_URL ? describe : describe.skip

integration('participant-weighted quiz leaderboard', () => {
	let prisma: PrismaClient
	let getQuizLeaderboard: typeof import('../services/QuizService').getQuizLeaderboard
	let getQuizes: typeof import('../services/QuizService').getQuizes
	let ownerId: number
	let quizId: number
	let itemIds: number[]
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
			Array.from({ length: 5 }, (_, index) =>
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
				size: 4,
				published: true,
				items: {
					create: [
						{ title: 'First city', imageId: images[1].id },
						{ title: 'Second city', imageId: images[2].id },
						{ title: 'Third city', imageId: images[3].id },
						{ title: 'Fourth city', imageId: images[4].id },
					],
				},
			},
			include: { items: { orderBy: { id: 'asc' } } },
		})
		quizId = quiz.id
		itemIds = quiz.items.map(item => item.id)

		async function completedSession(
			code: string,
			placements: [number, number, number, number],
			userIds: number[],
		) {
			const [winnerId, finalistId, firstSemiFinalistId, secondSemiFinalistId] = placements
			await prisma.session.create({
				data: {
					code,
					quizId,
					adminId: ownerId,
					cluster: 0,
					started: true,
					ended: true,
					favoriteId: winnerId,
					participants: {
						createMany: { data: userIds.map(userId => ({ userId })) },
					},
					matches: {
						create: [
							{
								cluster: 2,
								order: 1,
								completed: true,
								firstItemId: winnerId,
								secondItemId: firstSemiFinalistId,
								winnerId,
							},
							{
								cluster: 2,
								order: 2,
								completed: true,
								firstItemId: finalistId,
								secondItemId: secondSemiFinalistId,
								winnerId: finalistId,
							},
							{
								cluster: 1,
								order: 1,
								completed: true,
								firstItemId: winnerId,
								secondItemId: finalistId,
								winnerId,
							},
						],
					},
				},
			})
		}

		await completedSession(
			'RANKING0000001',
			[itemIds[0], itemIds[1], itemIds[2], itemIds[3]],
			participantIds.slice(0, 2),
		)
		await completedSession(
			'RANKING0000002',
			[itemIds[0], itemIds[2], itemIds[1], itemIds[3]],
			participantIds,
		)
		await completedSession(
			'RANKING0000003',
			[itemIds[1], itemIds[3], itemIds[0], itemIds[2]],
			participantIds.slice(0, 4),
		)
		await prisma.$transaction([
			prisma.quiz.update({
				where: { id: quizId },
				data: { completedSessionCount: 3, participantWeight: 11 },
			}),
			prisma.quizItem.update({
				where: { id: itemIds[0] },
				data: { sessionWins: 2, weightedScore: 36, weightedPlacement: 19 },
			}),
			prisma.quizItem.update({
				where: { id: itemIds[1] },
				data: { sessionWins: 1, weightedScore: 32, weightedPlacement: 23 },
			}),
			prisma.quizItem.update({
				where: { id: itemIds[2] },
				data: { sessionWins: 0, weightedScore: 27, weightedPlacement: 28 },
			}),
			prisma.quizItem.update({
				where: { id: itemIds[3] },
				data: { sessionWins: 0, weightedScore: 26, weightedPlacement: 29 },
			}),
		])
	})

	afterAll(async () => {
		await prisma?.$disconnect()
	})

	it('ranks every item from every completed bracket with participant weighting', async () => {
		const leaderboard = await getQuizLeaderboard(quizId)

		expect(leaderboard).toMatchObject({
			completedSessions: 3,
			participantWeight: 11,
		})
		expect(leaderboard.entries).toHaveLength(4)
		for (const entry of leaderboard.entries) expect(entry).not.toHaveProperty('share')
		expect(leaderboard.entries[0]).toMatchObject({
			rank: 1,
			item: { id: itemIds[0], title: 'First city' },
			sessionWins: 2,
			averageRank: 1.73,
			weightedScore: 36,
			scorePercentage: 81.8,
		})
		expect(leaderboard.entries[1]).toMatchObject({
			rank: 2,
			item: { id: itemIds[1], title: 'Second city' },
			sessionWins: 1,
			averageRank: 2.09,
			weightedScore: 32,
			scorePercentage: 72.7,
		})
		expect(leaderboard.entries[2]).toMatchObject({
			rank: 3,
			item: { id: itemIds[2], title: 'Third city' },
			sessionWins: 0,
			averageRank: 2.55,
			weightedScore: 27,
			scorePercentage: 61.4,
		})
		expect(leaderboard.entries[3]).toMatchObject({
			rank: 4,
			item: { id: itemIds[3], title: 'Fourth city' },
			sessionWins: 0,
			averageRank: 2.64,
			weightedScore: 26,
			scorePercentage: 59.1,
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
