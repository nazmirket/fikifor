import Prisma from '../prisma'
import { logger } from '../utils/logger'
import type { FikiforServer, FikiforSocket } from './types'

export const userRoom = (userId: number) => `user:${userId}`

export async function markConnected(io: FikiforServer, socket: FikiforSocket) {
	const { userId, username } = socket.data
	await socket.join(userRoom(userId))

	const participations = await Prisma.participant.findMany({
		where: { userId, session: { ended: false } },
		select: { id: true, online: true, session: { select: { code: true } } },
	})
	await Prisma.participant.updateMany({
		where: { userId, online: false, session: { ended: false } },
		data: { online: true },
	})

	const rooms = participations.map(participation => participation.session.code)
	if (rooms.length > 0) await socket.join(rooms)
	for (const participation of participations) {
		if (!participation.online) {
			io.to(participation.session.code).emit('session:online', username)
		}
	}
}

export async function markDisconnected(io: FikiforServer, socket: FikiforSocket) {
	const { userId, username } = socket.data

	await new Promise(resolve => setTimeout(resolve, 0))
	const remainingSocketIds = await io.in(userRoom(userId)).allSockets()
	if (remainingSocketIds.size > 0) return

	const participations = await Prisma.participant.findMany({
		where: { userId, online: true, session: { ended: false } },
		select: { session: { select: { code: true } } },
	})
	await Prisma.participant.updateMany({
		where: { userId, session: { ended: false } },
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

export async function reconcilePresence(io: FikiforServer) {
	await Prisma.participant.updateMany({
		where: { online: true, session: { ended: true } },
		data: { online: false },
	})
	const onlineUsers = await Prisma.participant.groupBy({
		by: ['userId'],
		where: { online: true, session: { ended: false } },
	})
	const staleUserIds: number[] = []

	for (let index = 0; index < onlineUsers.length; index += 25) {
		const batch = onlineUsers.slice(index, index + 25)
		const states = await Promise.all(
			batch.map(async entry => ({
				userId: entry.userId,
				sockets: await io.in(userRoom(entry.userId)).allSockets(),
			})),
		)
		for (const state of states) {
			if (state.sockets.size === 0) staleUserIds.push(state.userId)
		}
	}

	if (staleUserIds.length > 0) {
		await Prisma.participant.updateMany({
			where: {
				userId: { in: staleUserIds },
				online: true,
				session: { ended: false },
			},
			data: { online: false },
		})
	}
	return staleUserIds.length
}
