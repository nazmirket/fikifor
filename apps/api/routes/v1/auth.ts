import express from 'express'

import * as AuthController from '../../controllers/AuthController'
import { loginInputSchema, signupInputSchema } from '@fikifor/contracts'
import { validate } from '../../middleware/validate'

const router = express.Router()

// Login with username and password
router.post('/login', validate('body', loginInputSchema), AuthController.login)

// Signup with username and password
router.post('/signup', validate('body', signupInputSchema), AuthController.signup)

export default router
