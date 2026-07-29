import type { ExtendedError } from 'socket.io'

import * as JwtUtils from '../utils/JwtUtils'
import type { FikiforSocket } from './types'

export function protect(socket: FikiforSocket, next: (error?: ExtendedError) => void) {
	try {
		const token = socket.handshake.auth.token
		if (typeof token !== 'string') return next(new Error('Unauthorized'))
		const decoded = JwtUtils.verify(token)
		socket.data.username = decoded.username
		socket.data.userId = decoded.userId
		return next()
	} catch {
		return next(new Error('Unauthorized'))
	}
}
