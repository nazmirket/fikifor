import type { SocketAck, SocketFailure, SocketSuccess } from '@fikifor/contracts'
import {
	sessionJoinInputSchema,
	sessionStartInputSchema,
	sessionVoteInputSchema,
} from '@fikifor/contracts'
import type { ZodType } from 'zod'

import { joinSession, startSession, submitVote } from '../services/GameService'
import { AppError, errorPayload } from '../utils/AppError'
import { logger } from '../utils/logger'
import { gameMetrics } from '../utils/metrics'
import {
	emitGameResolution,
	startRoomCountdown,
	syncSocketGameState,
} from './gameRuntime'
import { enforceSocketRateLimit } from './rateLimit'
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

export function registerSessionHandlers(io: FikiforServer, socket: FikiforSocket) {
	socket.on('session:join', (payload, ack) => {
		void action(socket, ack, async () => {
			enforceSocketRateLimit(socket.data.userId, 'join')
			const input = parse(sessionJoinInputSchema, payload)
			const joined = await joinSession(input.code, socket.data.userId)
			await socket.join(joined.code)
			socket.emit('session:joined', joined.participants)
			if (joined.changed) {
				socket.to(joined.code).emit('session:participant', joined.participant)
			}
			syncSocketGameState(io, socket, joined)
		})
	})

	socket.on('session:start', (payload, ack) => {
		void action(socket, ack, async () => {
			enforceSocketRateLimit(socket.data.userId, 'start')
			const input = parse(sessionStartInputSchema, payload)
			const session = await startSession(input.code, socket.data.userId)
			void startRoomCountdown(io, {
				...session,
				started: true,
				ended: false,
			}).catch(error => {
				gameMetrics.transitionFailure()
				const payload = errorPayload(error)
				logger.error({ err: error, sessionId: session.id }, 'Session countdown failed')
				io.to(session.code).emit('session:error', payload)
			})
		})
	})

	socket.on('session:vote', (payload, ack) => {
		void action(socket, ack, async () => {
			const startedAt = performance.now()
			try {
				enforceSocketRateLimit(socket.data.userId, 'vote')
				const input = parse(sessionVoteInputSchema, payload)
				const outcome = await submitVote(input.matchId, input.itemId, socket.data.userId)

				const room = outcome.sessionCode
				if (!socket.rooms.has(room)) await socket.join(room)

				io.to(room).emit('session:voted', outcome.vote)
				emitGameResolution(io, outcome)
				gameMetrics.vote()
			} catch (error) {
				gameMetrics.voteRejected()
				throw error
			} finally {
				gameMetrics.voteDuration(performance.now() - startedAt)
			}
		})
	})
}
