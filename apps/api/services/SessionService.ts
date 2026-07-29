import Prisma from '../prisma'
import * as StrUtils from '../utils/StrUtils'
import { notFound } from '../utils/AppError'
import { matchSelect } from './GameService'

// Create Quiz
export async function createSession(quizId: number, userId: number) {
	const code = StrUtils.shortid()

	const quiz = await Prisma.quiz.findUnique({
		where: { id: quizId, ownerId: userId },
	})

	if (!quiz) throw notFound('Quiz not found')

	await Prisma.session.create({
		data: {
			code,
			cluster: quiz.size / 2,
			admin: { connect: { id: userId } },
			quiz: { connect: { id: quizId } },
			participants: { create: { userId } },
		},
	})

	return code
}

// Get Session
export async function getSession(code: string) {
	const session = await Prisma.session.findUnique({
		where: { code },
		select: {
			id: true,
			code: true,
			cluster: true,
			started: true,
			ended: true,
			adminId: true,
			admin: {
				select: {
					id: true,
					username: true,
				},
			},
			favorite: {
				select: {
					id: true,
					title: true,
					image: true,
				},
			},
			quiz: {
				select: {
					id: true,
					title: true,
					cover: true,
					size: true,
				},
			},
			participants: {
				select: {
					id: true,
					online: true,
					user: {
						select: {
							id: true,
							username: true,
						},
					},
				},
			},
		},
	})

	if (!session) throw notFound('Session not found')

	const match = session.started
		? await Prisma.sessionMatch.findFirst({
				where: {
					sessionId: session.id,
					completed: false,
					cluster: session.cluster,
				},
				orderBy: { order: 'asc' },
				select: matchSelect,
			})
		: null

	const final = session.ended
		? await Prisma.sessionMatch.findFirst({
				where: {
					sessionId: session.id,
					cluster: 1,
				},
				select: matchSelect,
			})
		: null

	return { session, match, final }
}
