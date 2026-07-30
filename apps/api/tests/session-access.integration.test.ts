import type { PrismaClient } from '@prisma/client'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const integration = process.env.TEST_DATABASE_URL ? describe : describe.skip

integration('session creation access', () => {
	let prisma: PrismaClient
	let createSession: typeof import('../services/SessionService').createSession
	let ownerId: number
	let playerId: number
	let publicQuizId: number
	let privateQuizId: number

	beforeAll(async () => {
		process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
		;({ default: prisma } = await import('../prisma'))
		;({ createSession } = await import('../services/SessionService'))

		await prisma.sessionVote.deleteMany()
		await prisma.sessionMatch.deleteMany()
		await prisma.participant.deleteMany()
		await prisma.session.deleteMany()
		await prisma.quizItem.deleteMany()
		await prisma.quiz.deleteMany()
		await prisma.image.deleteMany()
		await prisma.user.deleteMany()

		const [owner, player] = await Promise.all([
			prisma.user.create({ data: { username: 'access-owner', password: 'hash' } }),
			prisma.user.create({ data: { username: 'access-player', password: 'hash' } }),
		])
		ownerId = owner.id
		playerId = player.id

		const [publicCover, privateCover] = await Promise.all([
			prisma.image.create({
				data: { folder: 'test', name: 'access-public-cover.jpeg' },
			}),
			prisma.image.create({
				data: { folder: 'test', name: 'access-private-cover.jpeg' },
			}),
		])
		const [publicQuiz, privateQuiz] = await Promise.all([
			prisma.quiz.create({
				data: {
					ownerId,
					coverId: publicCover.id,
					title: 'Published fixture',
					description: 'Available to every player',
					size: 32,
					published: true,
				},
			}),
			prisma.quiz.create({
				data: {
					ownerId,
					coverId: privateCover.id,
					title: 'Private fixture',
					description: 'Available only to its owner',
					size: 32,
				},
			}),
		])
		publicQuizId = publicQuiz.id
		privateQuizId = privateQuiz.id
	})

	afterAll(async () => {
		await prisma?.$disconnect()
	})

	it('allows another user to start a published quiz', async () => {
		const code = await createSession(publicQuizId, playerId)
		const session = await prisma.session.findUniqueOrThrow({ where: { code } })
		expect(session).toMatchObject({ quizId: publicQuizId, adminId: playerId })
	})

	it('allows the owner to start a private quiz', async () => {
		const code = await createSession(privateQuizId, ownerId)
		const session = await prisma.session.findUniqueOrThrow({ where: { code } })
		expect(session).toMatchObject({ quizId: privateQuizId, adminId: ownerId })
	})

	it('conceals a private quiz from another user', async () => {
		await expect(createSession(privateQuizId, playerId)).rejects.toMatchObject({
			status: 404,
			code: 'NOT_FOUND',
		})
	})
})
