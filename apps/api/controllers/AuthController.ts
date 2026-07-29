import ApiReq from 'ApiReq'
import ApiRes from 'ApiRes'

import AsyncMd from '../middleware/async'
import * as AuthService from '../services/AuthService'

// Login
export const login = AsyncMd(async (req: ApiReq, res: ApiRes) => {
	const { username, password } = req.body
	const { token, user } = await AuthService.login(username, password)
	res.status(200).json({ success: true, data: { token, user } })
})

// Signup
export const signup = AsyncMd(async (req: ApiReq, res: ApiRes) => {
	const { username, password } = req.body
	const { token, user } = await AuthService.signup(username, password)
	res.status(200).json({ success: true, data: { token, user } })
})
