import type { SessionMatch } from '@fikifor/contracts'

import {
	expireMatch,
	firstCurrentMatch,
	pendingMatchDeadlines,
	type DeadlineOutcome,
	type VoteOutcome,
} from '../services/GameService'
import { logger } from '../utils/logger'
import { gameMetrics } from '../utils/metrics'
import type { FikiforServer, FikiforSocket } from './types'

interface SessionRuntimeState {
	id: number
	code: string
	cluster: number
	started: boolean
	startsAt: Date | null
	ended: boolean
}

const deadlineTimers = new Map<number, NodeJS.Timeout>()
const socketCountdownTimers = new WeakMap<FikiforSocket, NodeJS.Timeout>()

function matchDeadline(match: SessionMatch) {
	if (!match.deadlineAt) return null
	const deadline = new Date(match.deadlineAt)
	return Number.isNaN(deadline.getTime()) ? null : deadline
}

function scheduleMatchDeadline(io: FikiforServer, matchId: number, deadlineAt: Date) {
	const existing = deadlineTimers.get(matchId)
	if (existing) clearTimeout(existing)

	const delay = Math.max(0, deadlineAt.getTime() - Date.now()) + 25
	const timer = setTimeout(() => {
		deadlineTimers.delete(matchId)
		void expireMatch(matchId)
			.then(outcome => {
				if (outcome?.matchCompleted) emitGameResolution(io, outcome)
			})
			.catch(error => {
				gameMetrics.transitionFailure()
				logger.error({ err: error, matchId }, 'Match deadline finalization failed')
				scheduleMatchDeadline(io, matchId, new Date(Date.now() + 5_000))
			})
	}, delay)
	timer.unref()
	deadlineTimers.set(matchId, timer)
}

function scheduleTransitionDeadline(
	io: FikiforServer,
	outcome: DeadlineOutcome | VoteOutcome,
) {
	if (outcome.transition.type !== 'next' && outcome.transition.type !== 'round') {
		return
	}
	const deadlineAt = matchDeadline(outcome.transition.next)
	if (deadlineAt) {
		scheduleMatchDeadline(io, outcome.transition.next.id, deadlineAt)
	}
}

export function emitGameResolution(
	io: FikiforServer,
	outcome: DeadlineOutcome | VoteOutcome,
) {
	if (!outcome.matchCompleted || !outcome.winnerId) return
	gameMetrics.finalized()
	const room = outcome.sessionCode
	const matchId = 'matchId' in outcome ? outcome.matchId : outcome.vote.matchId
	if (!matchId) return

	io.to(room).emit('session:ended', {
		matchId,
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
	scheduleTransitionDeadline(io, outcome)
}

async function currentMatch(session: SessionRuntimeState) {
	return firstCurrentMatch(session.id, session.cluster)
}

export async function startRoomCountdown(
	io: FikiforServer,
	session: SessionRuntimeState,
) {
	const startsAt = session.startsAt?.getTime() ?? Date.now()
	let remaining = startsAt - Date.now()
	while (remaining > 0) {
		io.to(session.code).emit('session:counter', Math.ceil(remaining / 1_000))
		await new Promise(resolve => setTimeout(resolve, Math.min(1_000, remaining)))
		remaining = startsAt - Date.now()
	}
	const match = await currentMatch(session)
	io.to(session.code).emit('session:counter', 0)
	io.to(session.code).emit('session:started', match)
	const deadlineAt = matchDeadline(match)
	if (deadlineAt) scheduleMatchDeadline(io, match.id, deadlineAt)
}

export function syncSocketGameState(
	io: FikiforServer,
	socket: FikiforSocket,
	session: SessionRuntimeState,
) {
	const previous = socketCountdownTimers.get(socket)
	if (previous) clearTimeout(previous)
	if (!session.started || session.ended) return

	const startsAt = session.startsAt?.getTime() ?? Date.now()
	const sendMatch = () => {
		void currentMatch(session)
			.then(match => {
				socket.emit('session:counter', 0)
				socket.emit('session:started', match)
				const deadlineAt = matchDeadline(match)
				if (deadlineAt) scheduleMatchDeadline(io, match.id, deadlineAt)
			})
			.catch(error => {
				gameMetrics.transitionFailure()
				logger.error(
					{ err: error, sessionId: session.id, userId: socket.data.userId },
					'Could not synchronize current match',
				)
			})
	}

	const remaining = startsAt - Date.now()
	if (remaining <= 0) {
		sendMatch()
		return
	}
	socket.emit('session:counter', Math.ceil(remaining / 1_000))
	const timer = setTimeout(sendMatch, remaining + 10)
	timer.unref()
	socketCountdownTimers.set(socket, timer)
}

export async function resumeGameRuntime(io: FikiforServer) {
	const pending = await pendingMatchDeadlines()
	for (const match of pending) {
		scheduleMatchDeadline(io, match.matchId, match.deadlineAt)
	}
	logger.info({ pendingDeadlines: pending.length }, 'Game runtime restored')
}

export function stopGameRuntime() {
	for (const timer of deadlineTimers.values()) clearTimeout(timer)
	deadlineTimers.clear()
}
