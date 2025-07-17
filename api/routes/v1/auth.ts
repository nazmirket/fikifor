import express from 'express'

import * as AuthController from '../../controllers/AuthController'

const router = express.Router()

// Login with username and password
router.post('/login', AuthController.login)

// Signup with username and password
router.post('/signup', AuthController.signup)

export default router
