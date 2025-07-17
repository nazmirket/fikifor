import express from 'express'

import { protect } from '../../middleware/auth'

import * as QuizController from '../../controllers/QuizController'

import Uploader from '../../middleware/upload'

const router = express.Router()

// Bulk update items
router.post('/:quizId/items/bulk', protect, QuizController.bulkUpdateItems)

// Update item image
router.put(
	'/items/:itemId/image',
	protect,
	Uploader.single(5),
	QuizController.updateItemImage,
)

// Update item image with link
router.put('/items/:itemId/image/link', protect, QuizController.updateItemImageWithLink)

// Update item info
router.put('/items/:itemId', protect, QuizController.updateItemInfo)

// Get quizes
router.get('/', QuizController.getQuizes)

// Get my quizes
router.get('/me', protect, QuizController.getMyQuizes)

// Get quiz by id
router.get('/:quizId', QuizController.getQuizById)

// Create quiz
router.post('/', protect, Uploader.single(5), QuizController.createQuiz)

// Update quiz image
router.put('/:quizId/image', protect, Uploader.single(5), QuizController.updateQuizImage)

// Update quiz
router.put('/:quizId', protect, QuizController.updateQuiz)

export default router
