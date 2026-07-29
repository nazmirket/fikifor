import express from 'express'

import { protect } from '../../middleware/auth'

import * as SessionController from '../../controllers/SessionController'
import { createSessionInputSchema, sessionCodeParamsSchema } from '@fikifor/contracts'
import { validate } from '../../middleware/validate'

const router = express.Router()

// Create a session
router.post(
	'/',
	protect,
	validate('body', createSessionInputSchema),
	SessionController.createSession,
)

// Get a session
router.get(
	'/:code',
	protect,
	validate('params', sessionCodeParamsSchema),
	SessionController.getSession,
)

export default router
