import ApiReq from 'ApiReq'
import ApiRes from 'ApiRes'
import { NextFunction } from 'express'

import * as JwtUtils from '../utils/JwtUtils'

import AsyncMd from './async'
import { unauthorized } from '../utils/AppError'

export const protect = AsyncMd(async (req: ApiReq, res: ApiRes, next: NextFunction) => {
	const token = getAuthHeader(req)
	if (!token) throw unauthorized()

	const decoded = JwtUtils.verify(token)
	req.username = decoded.username
	req.userId = decoded.userId
	next()
})

export const optionalAuth = AsyncMd(
	async (req: ApiReq, res: ApiRes, next: NextFunction) => {
		const token = getAuthHeader(req)
		if (token) {
			const decoded = JwtUtils.verify(token)
			req.username = decoded.username
			req.userId = decoded.userId
		}
		next()
	},
)

function getAuthHeader(req: ApiReq): string | undefined {
	const header = req.get('Authorization')
	if (!header) return undefined

	const [scheme, token] = header.split(' ')
	return scheme?.toLowerCase() === 'bearer' && token ? token : undefined
}
