import Prisma from '../prisma'
import { logger } from '../utils/logger'
import type { FikiforServer, FikiforSocket } from './types'

const userRoom = (userId: number) => `user:${userId}`

export async function markConnected(io: FikiforServer, socket: FikiforSocket) {
	const { userId, username } = socket.data
	await socket.join(userRoom(userId))

	const participations = await Prisma.participant.findMany({
		where: { userId },
		select: { id: true, online: true, session: { select: { code: true } } },
	})
	await Prisma.participant.updateMany({
		where: { userId, online: false },
		data: { online: true },
	})

	for (const participation of participations) {
		await socket.join(participation.session.code)
		if (!participation.online) {
			io.to(participation.session.code).emit('session:online', username)
		}
	}
}

export async function markDisconnected(io: FikiforServer, socket: FikiforSocket) {
	const { userId, username } = socket.data

	await new Promise(resolve => setTimeout(resolve, 0))
	const remainingSockets = await io.in(userRoom(userId)).fetchSockets()
	if (remainingSockets.length > 0) return

	const participations = await Prisma.participant.findMany({
		where: { userId, online: true },
		select: { session: { select: { code: true } } },
	})
	await Prisma.participant.updateMany({
		where: { userId },
		data: { online: false },
	})
	for (const participation of participations) {
		io.to(participation.session.code).emit('session:offline', username)
	}
}

export function registerPresence(io: FikiforServer, socket: FikiforSocket) {
	void markConnected(io, socket).catch(error => {
		logger.error(
			{ err: error, userId: socket.data.userId },
			'Could not mark socket online',
		)
	})
	socket.on('disconnect', () => {
		void markDisconnected(io, socket).catch(error => {
			logger.error(
				{ err: error, userId: socket.data.userId },
				'Could not mark socket offline',
			)
		})
	})
}
