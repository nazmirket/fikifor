import ApiReq from 'ApiReq'
import ApiRes from 'ApiRes'
import { NextFunction } from 'express'

import * as JwtUtils from '../utils/JwtUtils'

import AsyncMd from './async'

// Protect Middleware
// This middleware is used to protect routes that require authentication
export const protect = AsyncMd(async (req: ApiReq, res: ApiRes, next: NextFunction) => {
	const token = getAuthHeader(req)
	if (!token) throw new Error('Unauthorized')

	// decrypt token
	const decoded = JwtUtils.verify(token) as any

	// attach fields to request
	req.username = decoded.username
	req.userId = decoded.userId

	// continue
	next()
})

// Utility function to get token from header
function getAuthHeader(req: ApiReq) {
	const header = req.get('Authorization')
	// if no header then continue
	if (!header) return undefined

	// get token
	const token = header.startsWith('Bearer') ? header.split(' ')[1] : ''

	// if no token continue
	if (!token) return undefined

	return token
}
