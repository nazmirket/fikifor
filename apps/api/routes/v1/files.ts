import express from 'express'

import { protect } from '../../middleware/auth'

import * as FileController from '../../controllers/FileController'
import { fileNameParamsSchema } from '@fikifor/contracts'
import { validate } from '../../middleware/validate'

const router = express.Router()

router.get(
	'/:name',
	protect,
	validate('params', fileNameParamsSchema),
	FileController.access,
)

export default router
