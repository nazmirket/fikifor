import express from 'express'

import { protect } from '../../middleware/auth'

import * as SessionController from '../../controllers/SessionController'

const router = express.Router()

// Create a session
router.post('/', protect, SessionController.createSession)

// Get a session
router.get('/:code', protect, SessionController.getSession)

export default router
