import ApiReq from 'ApiReq'
import ApiRes from 'ApiRes'

import AsyncMd from '../middleware/async'
import * as SessionService from '../services/SessionService'

// Create a session
export const createSession = AsyncMd(async (req: ApiReq, res: ApiRes) => {
	const userId = req.userId
	const quizId = req.body.quizId
	const code = await SessionService.createSession(quizId, userId)
	res.status(201).json({ success: true, data: code })
})

// Get a session
export const getSession = AsyncMd(async (req: ApiReq, res: ApiRes) => {
	const code = req.params.code
	const { match, session, final } = await SessionService.getSession(code)
	res.status(200).json({
		success: true,
		data: { session, match, final },
	})
})
