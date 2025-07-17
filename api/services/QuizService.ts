import Prisma from '../prisma'

import * as FileService from './FileService'

// Create Quiz
export async function createQuiz(props: any, file: any, userId: number) {
	if (!props.title) throw new Error('Başlık zorunludur')
	if (!parseInt(props.size)) throw new Error('Boyut zorunludur')
	if (!props.description) throw new Error('Açıklama zorunludur')

	if (![32, 64, 128].includes(parseInt(props.size))) {
		throw new Error('Boyut 32, 64 veya 128 olabilir')
	}

	const image = await FileService.upload(file)

	const quiz = await Prisma.quiz.create({
		data: {
			owner: { connect: { id: userId } },
			title: props.title,
			description: props.description,
			size: parseInt(props.size),
			cover: { connect: { id: image.id } },
			items: {
				createMany: {
					data: new Array(parseInt(props.size)).fill(0).map((_, index) => ({})),
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

	return quiz
}

// Update quiz
export async function updateQuiz(quizId: number, props: any, userId: number) {
	const quiz = await Prisma.quiz.findUnique({
		where: { id: quizId, ownerId: userId },
	})

	if (!quiz) throw new Error('Quiz bulunamadı')

	await Prisma.quiz.update({
		where: { id: quizId },
		data: {
			title: props.title,
			description: props.description,
		},
	})
}

// Update quiz image
export async function updateQuizImage(quizId: number, file: any, userId: number) {
	const quiz = await Prisma.quiz.findUnique({
		where: { id: quizId, ownerId: userId },
	})

	if (!quiz) throw new Error('Quiz bulunamadı')

	const image = await FileService.upload(file)

	await Prisma.quiz.update({
		where: { id: quizId },
		data: { cover: { connect: { id: image.id } } },
	})
}

// Publish quiz
export async function publishQuiz(quizId: number, userId: number) {
	const quiz = await Prisma.quiz.findUnique({
		where: { id: quizId, ownerId: userId },
		include: { items: true },
	})

	if (!quiz) throw new Error('Quiz bulunamadı')

	if (quiz.items.some(item => !item.imageId)) {
		throw new Error('Tüm itemlerin resmi olmalıdır')
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

	if (!quiz) throw new Error('Quiz bulunamadı')

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

	if (!quiz) throw new Error('Quiz bulunamadı')

	const size = quiz.size

	const items = quiz.items.map(i => ({ id: i.id, title: i.title }))

	if (size !== titles.length) throw new Error('Satır sayısı eşleşmiyor')

	const transactions = []

	for (let i = 0; i < size; i++) {
		const item = items[i]
		const title = titles[i]
		transactions.push(Prisma.quizItem.update({ where: { id: item.id }, data: { title } }))
	}

	await Prisma.$transaction(transactions)
}

// Update item's image
export async function updateItemImage(itemId: number, file: any, userId: number) {
	const item = await Prisma.quizItem.findUnique({
		where: { id: itemId, quiz: { ownerId: userId } },
	})

	if (!item) throw new Error('Item bulunamadı')

	const image = await FileService.upload(file)

	const updated = await Prisma.quizItem.update({
		where: { id: itemId },
		data: { image: { connect: { id: image.id } } },
		select: {
			id: true,
			title: true,
			image: true,
		},
	})

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
	if (!item) throw new Error('Item bulunamadı')

	const image = await FileService.uploadFromLink(link)

	const updated = await Prisma.quizItem.update({
		where: { id: itemId },
		data: { image: { connect: { id: image.id } } },
		select: {
			id: true,
			title: true,
			image: true,
		},
	})

	return updated
}

// Update item's info
export async function updateItemInfo(itemId: number, props: any, userId: number) {
	const item = await Prisma.quizItem.findUnique({
		where: { id: itemId, quiz: { ownerId: userId } },
	})

	if (!item) throw new Error('Item bulunamadı')

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
export async function getQuizById(quizId: number, userId: number) {
	const quiz = await Prisma.quiz.findUnique({
		where: {
			id: quizId,
			OR: [{ ownerId: userId }, { published: true }],
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
