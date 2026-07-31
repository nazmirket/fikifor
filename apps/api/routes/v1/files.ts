import express from 'express'

import { optionalAuth } from '../../middleware/auth'

import * as FileController from '../../controllers/FileController'
import { fileNameParamsSchema, imageQuerySchema } from '@fikifor/contracts'
import { validate } from '../../middleware/validate'

const router = express.Router()

router.get(
	'/:name',
	optionalAuth,
	validate('params', fileNameParamsSchema),
	validate('query', imageQuerySchema),
	FileController.access,
)

export default router
