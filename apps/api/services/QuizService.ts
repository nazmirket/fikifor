import Prisma from '../prisma'

import * as FileService from './FileService'
import { Prisma as PrismaQuery } from '@prisma/client'
import type {
	CreateQuizInput,
	PublicQuizQuery,
	UpdateQuizInput,
	UpdateQuizItemInput,
} from '@fikifor/contracts'
import { badRequest, notFound } from '../utils/AppError'

interface PublicQuizRow {
	id: number
	title: string
	description: string
	size: number
	published: boolean
	createdAt: Date
	updatedAt: Date | null
	ownerUsername: string
	coverId: number
	coverName: string
	coverFolder: string
	sessionCount: number
	relevance: number
	total: number
}

function publicQuizOrder(query: PublicQuizQuery) {
	const key = `${query.sortBy}:${query.sortOrder}`
	switch (key) {
		case 'relevance:asc':
			return PrismaQuery.sql`"relevance" ASC, "sessionCount" DESC, "createdAt" DESC, "id" DESC`
		case 'relevance:desc':
			return PrismaQuery.sql`"relevance" DESC, "sessionCount" DESC, "createdAt" DESC, "id" DESC`
		case 'sessions:asc':
			return PrismaQuery.sql`"sessionCount" ASC, "createdAt" DESC, "id" DESC`
		case 'sessions:desc':
			return PrismaQuery.sql`"sessionCount" DESC, "createdAt" DESC, "id" DESC`
		case 'createdAt:asc':
			return PrismaQuery.sql`"createdAt" ASC, "id" ASC`
		case 'createdAt:desc':
			return PrismaQuery.sql`"createdAt" DESC, "id" DESC`
		case 'updatedAt:asc':
			return PrismaQuery.sql`"updatedAt" ASC NULLS LAST, "id" ASC`
		case 'updatedAt:desc':
			return PrismaQuery.sql`"updatedAt" DESC NULLS LAST, "id" DESC`
		case 'title:desc':
			return PrismaQuery.sql`LOWER("title") DESC, "id" DESC`
		default:
			return PrismaQuery.sql`LOWER("title") ASC, "id" ASC`
	}
}

// Create Quiz
export async function createQuiz(
	props: CreateQuizInput,
	file: Express.Multer.File | undefined,
	userId: number,
) {
	const image = await FileService.upload(file)

	try {
		return await Prisma.quiz.create({
			data: {
				owner: { connect: { id: userId } },
				title: props.title,
				description: props.description,
				size: props.size,
				cover: { connect: { id: image.id } },
				items: {
					createMany: {
						data: Array.from({ length: props.size }, () => ({})),
					},
				},
			},
			select: {
				id: true,
				owner: {
					select: {
						username: true,
					},
				},
				title: true,
				description: true,
				size: true,
				items: {
					select: {
						id: true,
						title: true,
						image: true,
					},
				},
				cover: true,
			},
		})
	} catch (error) {
		await FileService.remove(image)
		throw error
	}
}

// Update quiz
export async function updateQuiz(quizId: number, props: UpdateQuizInput, userId: number) {
	const quiz = await Prisma.quiz.findUnique({
		where: { id: quizId, ownerId: userId },
	})

	if (!quiz) throw notFound('Quiz not found')

	await Prisma.quiz.update({
		where: { id: quizId },
		data: {
			title: props.title,
			description: props.description,
		},
	})
}

// Update quiz image
export async function updateQuizImage(
	quizId: number,
	file: Express.Multer.File | undefined,
	userId: number,
) {
	const quiz = await Prisma.quiz.findUnique({
		where: { id: quizId, ownerId: userId },
		include: { cover: true },
	})

	if (!quiz) throw notFound('Quiz not found')

	const image = await FileService.upload(file)

	const updated = await Prisma.quiz
		.update({
			where: { id: quizId },
			data: { cover: { connect: { id: image.id } } },
			select: { cover: true },
		})
		.catch(async error => {
			await FileService.remove(image)
			throw error
		})
	await FileService.remove(quiz.cover)
	return updated
}

// Publish quiz
export async function publishQuiz(quizId: number, userId: number) {
	const quiz = await Prisma.quiz.findUnique({
		where: { id: quizId, ownerId: userId },
		include: { items: true },
	})

	if (!quiz) throw notFound('Quiz not found')

	if (quiz.items.some(item => !item.imageId)) {
		throw badRequest('Every quiz item must have an image before publishing')
	}

	return Prisma.quiz.update({
		where: { id: quizId },
		data: { published: true },
		select: { id: true, published: true },
	})
}

// Unpublish quiz
export async function unpublishQuiz(quizId: number, userId: number) {
	const quiz = await Prisma.quiz.findUnique({
		where: { id: quizId, ownerId: userId },
	})

	if (!quiz) throw notFound('Quiz not found')

	return Prisma.quiz.update({
		where: { id: quizId },
		data: { published: false },
		select: { id: true, published: true },
	})
}

// Bulk update items
export async function bulkUpdateItems(quizId: number, titles: string[], userId: number) {
	const quiz = await Prisma.quiz.findUnique({
		where: { id: quizId, ownerId: userId },
		select: {
			size: true,
			items: {
				orderBy: { id: 'asc' },
				select: { id: true, title: true },
			},
		},
	})

	if (!quiz) throw notFound('Quiz not found')

	const size = quiz.size

	const items = quiz.items.map(i => ({ id: i.id, title: i.title }))

	if (size !== titles.length) throw badRequest('Title count does not match quiz size')

	const transactions = []

	for (let i = 0; i < size; i++) {
		const item = items[i]
		const title = titles[i]
		transactions.push(Prisma.quizItem.update({ where: { id: item.id }, data: { title } }))
	}

	await Prisma.$transaction(transactions)
}

// Update item's image
export async function updateItemImage(
	itemId: number,
	file: Express.Multer.File | undefined,
	userId: number,
) {
	const item = await Prisma.quizItem.findUnique({
		where: { id: itemId, quiz: { ownerId: userId } },
		include: { image: true },
	})

	if (!item) throw notFound('Quiz item not found')

	const image = await FileService.upload(file)

	const updated = await Prisma.quizItem
		.update({
			where: { id: itemId },
			data: { image: { connect: { id: image.id } } },
			select: {
				id: true,
				title: true,
				image: true,
			},
		})
		.catch(async error => {
			await FileService.remove(image)
			throw error
		})

	await FileService.remove(item.image)
	return updated
}

// Update item's image with link
export async function updateItemImageWithLink(
	itemId: number,
	link: string,
	userId: number,
) {
	const item = await Prisma.quizItem.findUnique({
		where: { id: itemId, quiz: { ownerId: userId } },
	})
	if (!item) throw notFound('Quiz item not found')

	const image = await FileService.uploadFromLink(link)

	const updated = await Prisma.quizItem
		.update({
			where: { id: itemId },
			data: { image: { connect: { id: image.id } } },
			select: {
				id: true,
				title: true,
				image: true,
			},
		})
		.catch(async error => {
			await FileService.remove(image)
			throw error
		})

	if (item.imageId) {
		const previous = await Prisma.image.findUnique({ where: { id: item.imageId } })
		await FileService.remove(previous)
	}
	return updated
}

// Update item's info
export async function updateItemInfo(
	itemId: number,
	props: UpdateQuizItemInput,
	userId: number,
) {
	const item = await Prisma.quizItem.findUnique({
		where: { id: itemId, quiz: { ownerId: userId } },
	})

	if (!item) throw notFound('Quiz item not found')

	const updated = await Prisma.quizItem.update({
		where: { id: itemId },
		data: { title: props.title },
		select: {
			id: true,
			title: true,
			image: true,
		},
	})

	return updated
}

// Get public quizzes with typo-tolerant search, stable sorting, and pagination.
export async function getQuizes(query: PublicQuizQuery) {
	const search = query.q.toLowerCase()
	const offset = (query.page - 1) * query.pageSize
	const orderBy = publicQuizOrder(query)

	const rows = await Prisma.$queryRaw<PublicQuizRow[]>(PrismaQuery.sql`
		WITH "ranked" AS (
			SELECT
				q."id",
				q."title",
				q."description",
				q."size",
				q."published",
				q."createdAt",
				q."updatedAt",
				u."username" AS "ownerUsername",
				i."id" AS "coverId",
				i."name" AS "coverName",
				i."folder" AS "coverFolder",
				COUNT(s."id")::integer AS "sessionCount",
				(
					CASE
						WHEN ${search} = '' THEN 1.0
						ELSE GREATEST(
							similarity(LOWER(q."title"), ${search}),
							word_similarity(${search}, LOWER(q."title")),
							similarity(LOWER(q."description"), ${search}),
							word_similarity(${search}, LOWER(q."description")),
							similarity(LOWER(u."username"), ${search}),
							CASE
								WHEN STRPOS(LOWER(q."title"), ${search}) > 0 THEN 1.0
								WHEN STRPOS(LOWER(q."description"), ${search}) > 0 THEN 0.9
								ELSE 0.0
							END
						)
					END
				)::double precision AS "relevance"
			FROM "Quiz" q
			INNER JOIN "User" u ON u."id" = q."ownerId"
			INNER JOIN "Image" i ON i."id" = q."coverId"
			LEFT JOIN "Session" s ON s."quizId" = q."id"
			WHERE
				q."published" = true
				AND (
					${search} = ''
					OR STRPOS(LOWER(q."title"), ${search}) > 0
					OR STRPOS(LOWER(q."description"), ${search}) > 0
					OR STRPOS(LOWER(u."username"), ${search}) > 0
					OR q."title" % ${search}
					OR q."description" % ${search}
					OR similarity(LOWER(q."title"), ${search}) >= 0.2
					OR word_similarity(${search}, LOWER(q."title")) >= 0.25
					OR similarity(LOWER(q."description"), ${search}) >= 0.2
					OR word_similarity(${search}, LOWER(q."description")) >= 0.25
				)
			GROUP BY q."id", u."username", i."id"
		)
		SELECT
			"ranked".*,
			COUNT(*) OVER()::integer AS "total"
		FROM "ranked"
		ORDER BY ${orderBy}
		LIMIT ${query.pageSize}
		OFFSET ${offset}
	`)

	return {
		items: rows.map(row => ({
			id: row.id,
			title: row.title,
			description: row.description,
			size: row.size,
			published: true as const,
			createdAt: row.createdAt,
			updatedAt: row.updatedAt,
			owner: { username: row.ownerUsername },
			cover: {
				id: row.coverId,
				name: row.coverName,
				folder: row.coverFolder,
			},
			sessionCount: row.sessionCount,
		})),
		total: rows[0]?.total ?? 0,
	}
}

// Get quizes of user
export async function getQuizesOfUser(userId: number) {
	const quizes = await Prisma.quiz.findMany({
		where: { ownerId: userId },
		orderBy: { createdAt: 'desc' },
		select: {
			id: true,
			title: true,
			description: true,
			size: true,
			published: true,
			createdAt: true,
			updatedAt: true,
			cover: true,
			_count: { select: { sessions: true } },
			items: {
				orderBy: { id: 'asc' },
				select: {
					id: true,
					title: true,
					image: true,
				},
			},
		},
	})
	return quizes.map(({ _count, ...quiz }) => ({
		...quiz,
		sessionCount: _count.sessions,
	}))
}

// Get quiz by id
export async function getQuizById(quizId: number, userId?: number) {
	const quiz = await Prisma.quiz.findUnique({
		where: {
			id: quizId,
			OR: [...(userId ? [{ ownerId: userId }] : []), { published: true }],
		},
		select: {
			id: true,
			title: true,
			published: true,
			description: true,
			size: true,
			createdAt: true,
			updatedAt: true,
			owner: { select: { username: true } },
			cover: true,
			_count: { select: { sessions: true } },
			items: {
				orderBy: { id: 'asc' },
				select: {
					id: true,
					title: true,
					image: true,
				},
			},
		},
	})
	if (!quiz) throw notFound('Quiz not found')
	const { _count, ...details } = quiz
	return { ...details, sessionCount: _count.sessions }
}
