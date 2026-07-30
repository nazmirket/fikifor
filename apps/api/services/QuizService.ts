import Prisma from '../prisma'

import * as FileService from './FileService'
import { Prisma as PrismaQuery } from '@prisma/client'
import type {
	CreateQuizInput,
	PublicQuizQuery,
	QuizLeaderboard,
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
	ownerDisplayName: string | null
	coverId: number
	coverName: string
	coverFolder: string
	sessionCount: number
	relevance: number
	total: number
}

interface QuizLeaderboardRow {
	itemId: number
	itemTitle: string | null
	imageId: number | null
	imageName: string | null
	imageFolder: string | null
	sessionWins: number
	weightedScore: number
	weightedPlacement: number
	completedSessions: number
	participantWeight: number
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
						displayName: true,
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
				u."displayName" AS "ownerDisplayName",
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
							similarity(LOWER(COALESCE(u."displayName", '')), ${search}),
							CASE
								WHEN STRPOS(LOWER(q."title"), ${search}) > 0 THEN 1.0
								WHEN STRPOS(LOWER(q."description"), ${search}) > 0 THEN 0.9
								WHEN STRPOS(LOWER(COALESCE(u."displayName", '')), ${search}) > 0 THEN 0.85
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
					OR STRPOS(LOWER(COALESCE(u."displayName", '')), ${search}) > 0
					OR q."title" % ${search}
					OR q."description" % ${search}
					OR similarity(LOWER(q."title"), ${search}) >= 0.2
					OR word_similarity(${search}, LOWER(q."title")) >= 0.25
					OR similarity(LOWER(q."description"), ${search}) >= 0.2
					OR word_similarity(${search}, LOWER(q."description")) >= 0.25
					OR similarity(LOWER(COALESCE(u."displayName", '')), ${search}) >= 0.2
				)
			GROUP BY q."id", u."username", u."displayName", i."id"
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
			owner: {
				username: row.ownerUsername,
				displayName: row.ownerDisplayName,
			},
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

// Rank every item by the round in which it was eliminated. Standard competition
// placements are used (1, 2, 3, 3, 5...), converted to points, and multiplied by
// the session's participant count so larger rooms carry proportionally more weight.
export async function getQuizLeaderboard(
	quizId: number,
	userId?: number,
): Promise<QuizLeaderboard> {
	const quiz = await Prisma.quiz.findFirst({
		where: {
			id: quizId,
			OR: [...(userId ? [{ ownerId: userId }] : []), { published: true }],
		},
		select: { id: true, size: true },
	})
	if (!quiz) throw notFound('Quiz not found')

	const rows = await Prisma.$queryRaw<QuizLeaderboardRow[]>(PrismaQuery.sql`
		WITH "completedSessions" AS (
			SELECT
				s."id",
				s."favoriteId",
				COUNT(p."id")::integer AS "participantCount"
			FROM "Session" s
			LEFT JOIN "Participant" p ON p."sessionId" = s."id"
			WHERE
				s."quizId" = ${quizId}
				AND s."ended" = true
				AND s."favoriteId" IS NOT NULL
			GROUP BY s."id"
		),
		"stats" AS (
			SELECT
				COUNT(*)::integer AS "completedSessions",
				COALESCE(SUM("participantCount"), 0)::integer AS "participantWeight"
			FROM "completedSessions"
		),
		"placements" AS (
			SELECT
				qi."id" AS "itemId",
				completed."id" AS "sessionId",
				completed."participantCount",
				CASE
					WHEN completed."favoriteId" = qi."id" THEN 1
					ELSE eliminated."cluster" + 1
				END::integer AS "placement"
			FROM "QuizItem" qi
			CROSS JOIN "completedSessions" completed
			LEFT JOIN LATERAL (
				SELECT match."cluster"
				FROM "SessionMatch" match
				WHERE
					match."sessionId" = completed."id"
					AND match."completed" = true
					AND match."winnerId" IS NOT NULL
					AND match."winnerId" <> qi."id"
					AND (
						match."firstItemId" = qi."id"
						OR match."secondItemId" = qi."id"
					)
				LIMIT 1
			) eliminated ON true
			WHERE qi."quizId" = ${quizId}
		),
		"scores" AS (
			SELECT
				qi."id" AS "itemId",
				qi."title" AS "itemTitle",
				i."id" AS "imageId",
				i."name" AS "imageName",
				i."folder" AS "imageFolder",
				COUNT(*) FILTER (WHERE placement."placement" = 1)::integer AS "sessionWins",
				COALESCE(
					SUM(
						(${quiz.size + 1} - placement."placement")
						* placement."participantCount"
					),
					0
				)::integer AS "weightedScore",
				COALESCE(
					SUM(placement."placement" * placement."participantCount"),
					0
				)::integer AS "weightedPlacement"
			FROM "QuizItem" qi
			LEFT JOIN "Image" i ON i."id" = qi."imageId"
			LEFT JOIN "placements" placement ON placement."itemId" = qi."id"
			WHERE qi."quizId" = ${quizId}
			GROUP BY qi."id", i."id"
		)
		SELECT scores.*, stats."completedSessions", stats."participantWeight"
		FROM "scores" scores
		CROSS JOIN "stats" stats
		ORDER BY
			scores."weightedScore" DESC,
			scores."sessionWins" DESC,
			LOWER(scores."itemTitle") ASC NULLS LAST,
			scores."itemId" ASC
	`)

	const completedSessions = rows[0]?.completedSessions ?? 0
	const participantWeight = rows[0]?.participantWeight ?? 0
	if (completedSessions === 0 || participantWeight === 0) {
		return { completedSessions, participantWeight, entries: [] }
	}

	let previousScore: number | undefined
	let previousWins: number | undefined
	let currentRank = 0

	const entries = rows.map((row, index) => {
		if (row.weightedScore !== previousScore || row.sessionWins !== previousWins) {
			currentRank = index + 1
			previousScore = row.weightedScore
			previousWins = row.sessionWins
		}
		return {
			rank: currentRank,
			item: {
				id: row.itemId,
				title: row.itemTitle,
				image:
					row.imageId && row.imageName && row.imageFolder
						? {
								id: row.imageId,
								name: row.imageName,
								folder: row.imageFolder,
							}
						: null,
			},
			sessionWins: row.sessionWins,
			averageRank: Number((row.weightedPlacement / participantWeight).toFixed(2)),
			weightedScore: row.weightedScore,
			scorePercentage: Number(
				((row.weightedScore / (quiz.size * participantWeight)) * 100).toFixed(1),
			),
			// Kept as a response alias for existing API consumers.
			share: Number(
				((row.weightedScore / (quiz.size * participantWeight)) * 100).toFixed(1),
			),
		}
	})

	return { completedSessions, participantWeight, entries }
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
			owner: { select: { username: true, displayName: true } },
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
