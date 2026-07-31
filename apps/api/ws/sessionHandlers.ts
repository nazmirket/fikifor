import type {
	ApiError,
	SocketAck,
	SocketFailure,
	SocketSuccess,
} from '@fikifor/contracts'
import {
	sessionJoinInputSchema,
	sessionStartInputSchema,
	sessionVoteInputSchema,
} from '@fikifor/contracts'
import type { ZodType } from 'zod'

import {
	firstCurrentMatch,
	joinSession,
	startSession,
	submitVote,
} from '../services/GameService'
import { AppError, errorPayload } from '../utils/AppError'
import { logger } from '../utils/logger'
import type { FikiforServer, FikiforSocket } from './types'

async function action(
	socket: FikiforSocket,
	ack: SocketAck | undefined,
	work: () => Promise<void>,
) {
	try {
		await work()
		const result: SocketSuccess = { ok: true }
		ack?.(result)
	} catch (error) {
		const payload = errorPayload(error)
		if (!(error instanceof AppError) || error.status >= 500) {
			logger.error({ err: error, userId: socket.data.userId }, 'Socket action failed')
		} else {
			logger.warn(
				{ code: error.code, userId: socket.data.userId },
				'Socket action rejected',
			)
		}
		socket.emit('session:error', payload)
		ack?.({ ok: false, error: payload } as SocketFailure)
	}
}

function parse<T>(schema: ZodType<T>, payload: unknown): T {
	return schema.parse(payload)
}

const delay = (milliseconds: number) =>
	new Promise(resolve => setTimeout(resolve, milliseconds))

async function countdown(
	io: FikiforServer,
	session: { id: number; code: string; cluster: number },
) {
	for (let counter = 5; counter > 0; counter--) {
		io.to(session.code).emit('session:counter', counter)
		await delay(1_000)
	}
	const match = await firstCurrentMatch(session.id, session.cluster)
	io.to(session.code).emit('session:counter', 0)
	io.to(session.code).emit('session:started', match)
}

export function registerSessionHandlers(io: FikiforServer, socket: FikiforSocket) {
	socket.on('session:join', (payload, ack) => {
		void action(socket, ack, async () => {
			const input = parse(sessionJoinInputSchema, payload)
			const joined = await joinSession(input.code, socket.data.userId)
			await socket.join(joined.code)
			io.to(joined.code).emit('session:joined', joined.participants)
		})
	})

	socket.on('session:start', (payload, ack) => {
		void action(socket, ack, async () => {
			const input = parse(sessionStartInputSchema, payload)
			const session = await startSession(input.code, socket.data.userId)
			void countdown(io, session).catch(error => {
				const payload: ApiError = errorPayload(error)
				logger.error({ err: error, sessionId: session.id }, 'Session countdown failed')
				io.to(session.code).emit('session:error', payload)
			})
		})
	})

	socket.on('session:vote', (payload, ack) => {
		void action(socket, ack, async () => {
			const input = parse(sessionVoteInputSchema, payload)
			const outcome = await submitVote(input.matchId, input.itemId, socket.data.userId)

			const room = outcome.sessionCode
			if (!socket.rooms.has(room)) await socket.join(room)

			io.to(room).emit('session:voted', outcome.vote)
			if (!outcome.matchCompleted || !outcome.winnerId) return

			io.to(room).emit('session:ended', {
				matchId: input.matchId,
				winnerId: outcome.winnerId,
			})
			io.to(room).emit('session:match:done')

			switch (outcome.transition.type) {
				case 'next':
					io.to(room).emit('session:next', outcome.transition.next)
					break
				case 'round':
					io.to(room).emit('session:round', {
						next: outcome.transition.next,
						cluster: outcome.transition.cluster,
					})
					break
				case 'over':
					io.to(room).emit('session:over', outcome.transition.code)
					break
				case 'none':
					break
			}
		})
	})
}
