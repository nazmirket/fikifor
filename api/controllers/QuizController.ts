import ApiReq from 'ApiReq'
import ApiRes from 'ApiRes'

import AsyncMd from '../middleware/async'
import * as QuizService from '../services/QuizService'

// Create quiz
export const createQuiz = AsyncMd(async (req: ApiReq, res: ApiRes) => {
	const props = req.body
	const image = req.file

	const quiz = await QuizService.createQuiz(props, image, req.userId)
	res.status(200).json({ success: true, data: quiz })
})

// Update quiz
export const updateQuiz = AsyncMd(async (req: ApiReq, res: ApiRes) => {
	const quizId = parseInt(req.params.quizId)
	const props = req.body

	const quiz = await QuizService.updateQuiz(quizId, props, req.userId)
	res.status(200).json({ success: true, data: quiz })
})

// Update quiz image
export const updateQuizImage = AsyncMd(async (req: ApiReq, res: ApiRes) => {
	const quizId = parseInt(req.params.quizId)
	const image = req.file

	const updated = await QuizService.updateQuizImage(quizId, image, req.userId)
	res.status(200).json({ success: true, data: updated })
})

// Publish quiz
export const publishQuiz = AsyncMd(async (req: ApiReq, res: ApiRes) => {
	const quizId = parseInt(req.params.quizId)
	const quiz = await QuizService.publishQuiz(quizId, req.userId)
	res.status(200).json({ success: true, data: quiz })
})

// Unpublish quiz
export const unpublishQuiz = AsyncMd(async (req: ApiReq, res: ApiRes) => {
	const quizId = parseInt(req.params.quizId)
	const quiz = await QuizService.unpublishQuiz(quizId, req.userId)
	res.status(200).json({ success: true, data: quiz })
})

// Bulk update items
export const bulkUpdateItems = AsyncMd(async (req: ApiReq, res: ApiRes) => {
	const quizId = parseInt(req.params.quizId)
	const titles = req.body
	await QuizService.bulkUpdateItems(quizId, titles, req.userId)
	res.status(200).json({ success: true })
})

// Update item's image
export const updateItemImage = AsyncMd(async (req: ApiReq, res: ApiRes) => {
	const itemId = parseInt(req.params.itemId)
	const image = req.file

	const updated = await QuizService.updateItemImage(itemId, image, req.userId)
	res.status(200).json({ success: true, data: updated })
})

// Update item's image with link
export const updateItemImageWithLink = AsyncMd(async (req: ApiReq, res: ApiRes) => {
	const itemId = parseInt(req.params.itemId)
	const link = req.body.link
	const updated = await QuizService.updateItemImageWithLink(itemId, link, req.userId)
	res.status(200).json({ success: true, data: updated })
})

// Update item's info
export const updateItemInfo = AsyncMd(async (req: ApiReq, res: ApiRes) => {
	const itemId = parseInt(req.params.itemId)
	const props = req.body

	const updated = await QuizService.updateItemInfo(itemId, props, req.userId)
	res.status(200).json({ success: true, data: updated })
})

// Get quizes
export const getQuizes = AsyncMd(async (req: ApiReq, res: ApiRes) => {
	const quizes = await QuizService.getQuizes()
	res.status(200).json({ success: true, data: quizes })
})

// Get my quizes
export const getMyQuizes = AsyncMd(async (req: ApiReq, res: ApiRes) => {
	const quizes = await QuizService.getQuizesOfUser(req.userId)
	res.status(200).json({ success: true, data: quizes })
})

// Get quiz by id
export const getQuizById = AsyncMd(async (req: ApiReq, res: ApiRes) => {
	const quizId = parseInt(req.params.quizId)
	const quiz = await QuizService.getQuizById(quizId, req.userId)
	res.status(200).json({ success: true, data: quiz })
})
