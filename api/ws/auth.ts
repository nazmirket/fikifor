import { Socket } from 'socket.io'

import * as JwtUtils from '../utils/JwtUtils'

// Auht client
// verify the given token and return the decoded data
export async function protect(socket: Socket, next: any) {
	try {
		// get token from socket
		const token = socket.handshake.auth.token

		// check token here
		const decoded = JwtUtils.verify(token) as any

		// set user data
		socket.data.username = decoded.username
		socket.data.userId = decoded.userId
		next()
	} catch (error: any) {
		throw new Error('Unauthorized')
	}
}
