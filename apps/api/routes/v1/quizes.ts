import express from 'express'

import { optionalAuth, protect } from '../../middleware/auth'

import * as QuizController from '../../controllers/QuizController'

import Uploader from '../../middleware/upload'
import {
	bulkUpdateQuizItemsInputSchema,
	createQuizInputSchema,
	itemIdParamsSchema,
	publicQuizQuerySchema,
	quizIdParamsSchema,
	remoteImageInputSchema,
	updateQuizInputSchema,
	updateQuizItemInputSchema,
} from '@fikifor/contracts'
import { validate } from '../../middleware/validate'

const router = express.Router()

// Bulk update items
router.post(
	'/:quizId/items/bulk',
	protect,
	validate('params', quizIdParamsSchema),
	validate('body', bulkUpdateQuizItemsInputSchema),
	QuizController.bulkUpdateItems,
)

// Update item image
router.put(
	'/items/:itemId/image',
	protect,
	validate('params', itemIdParamsSchema),
	Uploader.single(5),
	QuizController.updateItemImage,
)

// Update item image with link
router.put(
	'/items/:itemId/image/link',
	protect,
	validate('params', itemIdParamsSchema),
	validate('body', remoteImageInputSchema),
	QuizController.updateItemImageWithLink,
)

// Update item info
router.put(
	'/items/:itemId',
	protect,
	validate('params', itemIdParamsSchema),
	validate('body', updateQuizItemInputSchema),
	QuizController.updateItemInfo,
)

// Get published quizzes
router.get('/', validate('query', publicQuizQuerySchema), QuizController.getQuizes)

// Get my quizes
router.get('/me', protect, QuizController.getMyQuizes)

// Get aggregate results for a published quiz or an owner preview
router.get(
	'/:quizId/leaderboard',
	optionalAuth,
	validate('params', quizIdParamsSchema),
	QuizController.getQuizLeaderboard,
)

// Publish quiz
router.put(
	'/:quizId/publish',
	protect,
	validate('params', quizIdParamsSchema),
	QuizController.publishQuiz,
)

// Unpublish quiz
router.delete(
	'/:quizId/publish',
	protect,
	validate('params', quizIdParamsSchema),
	QuizController.unpublishQuiz,
)

// Get quiz by id
router.get(
	'/:quizId',
	optionalAuth,
	validate('params', quizIdParamsSchema),
	QuizController.getQuizById,
)

// Create quiz
router.post(
	'/',
	protect,
	Uploader.single(5),
	validate('body', createQuizInputSchema),
	QuizController.createQuiz,
)

// Update quiz image
router.put(
	'/:quizId/image',
	protect,
	validate('params', quizIdParamsSchema),
	Uploader.single(5),
	QuizController.updateQuizImage,
)

// Update quiz
router.put(
	'/:quizId',
	protect,
	validate('params', quizIdParamsSchema),
	validate('body', updateQuizInputSchema),
	QuizController.updateQuiz,
)

export default router
