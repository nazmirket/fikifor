import Prisma from '../prisma'

import * as FileService from './FileService'
import type {
	CreateQuizInput,
	UpdateQuizInput,
	UpdateQuizItemInput,
} from '@fikifor/contracts'
import { badRequest, notFound } from '../utils/AppError'

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

	await Prisma.quiz.update({
		where: { id: quizId },
		data: { published: true },
	})
}

// Unpublish quiz
export async function unpublishQuiz(quizId: number, userId: number) {
	const quiz = await Prisma.quiz.findUnique({
		where: { id: quizId, ownerId: userId },
	})

	if (!quiz) throw notFound('Quiz not found')

	await Prisma.quiz.update({
		where: { id: quizId },
		data: { published: false },
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

// Get quizes
export async function getQuizes() {
	const quizes = await Prisma.quiz.findMany({
		where: { published: true },
		select: {
			id: true,
			title: true,
			description: true,
			size: true,
			owner: { select: { username: true } },
			cover: true,
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
	return quizes
}

// Get quizes of user
export async function getQuizesOfUser(userId: number) {
	const quizes = await Prisma.quiz.findMany({
		where: { ownerId: userId },
		select: {
			id: true,
			title: true,
			description: true,
			size: true,
			cover: true,
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
	return quizes
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
			owner: { select: { username: true } },
			cover: true,
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
	return quiz
}
