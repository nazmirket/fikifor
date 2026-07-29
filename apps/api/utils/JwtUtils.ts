import type { AuthUser } from '@fikifor/contracts'
import jwt, { type SignOptions } from 'jsonwebtoken'

import { env } from '../config/env'
import { unauthorized } from './AppError'

const issuer = 'fikifor-api'
const audience = 'fikifor-web'

export function sign(payload: AuthUser, opts: SignOptions = {}) {
	return jwt.sign(payload, env.jwtSecret, {
		issuer,
		audience,
		expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'],
		...opts,
	})
}

export function verify(token: string): AuthUser {
	try {
		const decoded = jwt.verify(token, env.jwtSecret, { issuer, audience })
		if (
			typeof decoded === 'string' ||
			typeof decoded.userId !== 'number' ||
			typeof decoded.username !== 'string'
		) {
			throw unauthorized('Invalid token payload')
		}
		return { userId: decoded.userId, username: decoded.username }
	} catch {
		throw unauthorized('Invalid or expired token')
	}
}
