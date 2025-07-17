import express from 'express'

import { protect } from '../../middleware/auth'

import * as FileController from '../../controllers/FileController'

const router = express.Router()

router.get('/:name', protect, FileController.access)

export default router
