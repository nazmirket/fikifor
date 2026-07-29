import { randomInt } from 'node:crypto'

import type {
	SessionMatch as ContractSessionMatch,
	SessionVote as ContractSessionVote,
} from '@fikifor/contracts'
import { Prisma as PrismaTypes } from '@prisma/client'

import Prisma from '../prisma'
import { badRequest, conflict, forbidden, notFound } from '../utils/AppError'

export const matchSelect = PrismaTypes.validator<PrismaTypes.SessionMatchSelect>()({
	id: true,
	order: true,
	cluster: true,
	completed: true,
	winnerId: true,
	votes: {
		select: {
			id: true,
			matchId: true,
			selectionId: true,
			participantId: true,
			participant: {
				select: {
					id: true,
					userId: true,
					user: { select: { id: true, username: true } },
				},
			},
		},
	},
	firstItem: {
		select: {
			id: true,
			title: true,
			image: true,
		},
	},
	secondItem: {
		select: {
			id: true,
			title: true,
			image: true,
		},
	},
})

type MatchRecord = PrismaTypes.SessionMatchGetPayload<{ select: typeof matchSelect }>

export type VoteTransition =
	| { type: 'none' }
	| { type: 'next'; next: ContractSessionMatch }
	| { type: 'round'; next: ContractSessionMatch; cluster: number }
	| { type: 'over'; code: string }

export interface VoteOutcome {
	vote: ContractSessionVote
	sessionCode: string
	matchCompleted: boolean
	transition: VoteTransition
}

function asContractMatch(match: MatchRecord): ContractSessionMatch {
	return match as ContractSessionMatch
}

function shuffle<T>(values: T[]) {
	const result = [...values]
	for (let index = result.length - 1; index > 0; index--) {
		const target = randomInt(index + 1)
		;[result[index], result[target]] = [result[target], result[index]]
	}
	return result
}

function pairs(values: number[]) {
	if (values.length % 2 !== 0) throw badRequest('Tournament item count must be even')
	const result: Array<[number, number]> = []
	for (let index = 0; index < values.length; index += 2) {
		result.push([values[index], values[index + 1]])
	}
	return result
}

export function selectWinner(
	firstItemId: number,
	secondItemId: number,
	firstVotes: number,
	secondVotes: number,
) {
	if (firstVotes > secondVotes) return firstItemId
	if (secondVotes > firstVotes) return secondItemId
	return randomInt(2) === 0 ? firstItemId : secondItemId
}

async function sessionLock(tx: PrismaTypes.TransactionClient, sessionId: number) {
	await tx.$executeRaw`SELECT pg_advisory_xact_lock(74201, CAST(${sessionId} AS integer))`
}

export async function joinSession(code: string, userId: number) {
	return Prisma.$transaction(async tx => {
		const session = await tx.session.findUnique({
			where: { code },
			select: { id: true, code: true, started: true, ended: true },
		})
		if (!session) throw notFound('Session not found')

		await sessionLock(tx, session.id)
		const existing = await tx.participant.findUnique({
			where: { userId_sessionId: { userId, sessionId: session.id } },
		})
		if (!existing && (session.started || session.ended)) {
			throw conflict('This session is no longer accepting participants')
		}

		if (!existing) {
			await tx.participant.create({
				data: { sessionId: session.id, userId, online: true },
			})
		} else if (!existing.online) {
			await tx.participant.update({
				where: { id: existing.id },
				data: { online: true },
			})
		}

		const participants = await tx.participant.findMany({
			where: { sessionId: session.id },
			orderBy: { id: 'asc' },
			select: {
				id: true,
				online: true,
				user: { select: { id: true, username: true } },
			},
		})
		return { code: session.code, participants }
	})
}

export async function startSession(code: string, userId: number) {
	return Prisma.$transaction(async tx => {
		const initial = await tx.session.findUnique({
			where: { code },
			select: { id: true },
		})
		if (!initial) throw notFound('Session not found')
		await sessionLock(tx, initial.id)

		const session = await tx.session.findUnique({
			where: { id: initial.id },
			select: {
				id: true,
				code: true,
				adminId: true,
				started: true,
				ended: true,
				quiz: { select: { size: true, items: { select: { id: true } } } },
			},
		})
		if (!session) throw notFound('Session not found')
		if (session.adminId !== userId) throw forbidden('Only the session owner can start it')
		if (session.started || session.ended) throw conflict('Session has already started')
		if (session.quiz.items.length !== session.quiz.size) {
			throw conflict('Quiz item count does not match its configured size')
		}

		const cluster = session.quiz.size / 2
		const tournamentPairs = pairs(shuffle(session.quiz.items.map(item => item.id)))

		await tx.sessionMatch.deleteMany({ where: { sessionId: session.id } })
		await tx.sessionMatch.createMany({
			data: tournamentPairs.map(([firstItemId, secondItemId], index) => ({
				order: index + 1,
				cluster,
				sessionId: session.id,
				firstItemId,
				secondItemId,
			})),
		})
		await tx.session.update({
			where: { id: session.id },
			data: { cluster, started: true },
		})

		return { id: session.id, code: session.code, cluster }
	})
}

export async function firstCurrentMatch(sessionId: number, cluster: number) {
	const match = await Prisma.sessionMatch.findFirst({
		where: { sessionId, cluster, completed: false },
		orderBy: { order: 'asc' },
		select: matchSelect,
	})
	if (!match) throw notFound('Session match not found')
	return asContractMatch(match)
}

export async function submitVote(
	matchId: number,
	itemId: number,
	userId: number,
): Promise<VoteOutcome> {
	const identity = await Prisma.sessionMatch.findUnique({
		where: { id: matchId },
		select: { sessionId: true },
	})
	if (!identity) throw notFound('Match not found')

	return Prisma.$transaction(
		async tx => {
			await sessionLock(tx, identity.sessionId)

			const match = await tx.sessionMatch.findUnique({
				where: { id: matchId },
				select: {
					id: true,
					sessionId: true,
					cluster: true,
					completed: true,
					firstItemId: true,
					secondItemId: true,
					session: {
						select: {
							id: true,
							code: true,
							cluster: true,
							ended: true,
							_count: { select: { participants: true } },
						},
					},
				},
			})
			if (!match) throw notFound('Match not found')
			if (match.completed || match.session.ended)
				throw conflict('Voting for this match is closed')
			if (match.cluster !== match.session.cluster)
				throw conflict('This is not the current round')
			if (![match.firstItemId, match.secondItemId].includes(itemId)) {
				throw badRequest('Vote selection is not part of this match')
			}

			const participant = await tx.participant.findUnique({
				where: {
					userId_sessionId: {
						userId,
						sessionId: match.sessionId,
					},
				},
				select: {
					id: true,
					userId: true,
					user: { select: { id: true, username: true } },
				},
			})
			if (!participant) throw forbidden('You are not a participant in this session')

			const vote = await tx.sessionVote.upsert({
				where: {
					matchId_participantId: {
						matchId,
						participantId: participant.id,
					},
				},
				create: {
					matchId,
					participantId: participant.id,
					selectionId: itemId,
				},
				update: { selectionId: itemId },
				select: {
					id: true,
					matchId: true,
					selectionId: true,
					participantId: true,
				},
			})

			const contractVote: ContractSessionVote = {
				...vote,
				participant,
			}
			const participantCount = match.session._count.participants
			const groupedVotes = await tx.sessionVote.groupBy({
				by: ['selectionId'],
				where: { matchId },
				_count: { _all: true },
			})
			const voteCount = groupedVotes.reduce(
				(total, group) => total + group._count._all,
				0,
			)
			if (voteCount < participantCount) {
				return {
					vote: contractVote,
					sessionCode: match.session.code,
					matchCompleted: false,
					transition: { type: 'none' },
				}
			}

			const firstVotes =
				groupedVotes.find(group => group.selectionId === match.firstItemId)?._count
					._all ?? 0
			const secondVotes =
				groupedVotes.find(group => group.selectionId === match.secondItemId)?._count
					._all ?? 0
			const winnerId = selectWinner(
				match.firstItemId,
				match.secondItemId,
				firstVotes,
				secondVotes,
			)

			await tx.sessionMatch.update({
				where: { id: match.id },
				data: { completed: true, winnerId },
			})

			const nextMatch = await tx.sessionMatch.findFirst({
				where: {
					sessionId: match.sessionId,
					cluster: match.session.cluster,
					completed: false,
				},
				orderBy: { order: 'asc' },
				select: matchSelect,
			})
			if (nextMatch) {
				return {
					vote: contractVote,
					sessionCode: match.session.code,
					matchCompleted: true,
					transition: { type: 'next', next: asContractMatch(nextMatch) },
				}
			}

			if (match.session.cluster === 1) {
				await tx.session.update({
					where: { id: match.session.id },
					data: { favoriteId: winnerId, ended: true, cluster: 0 },
				})
				return {
					vote: contractVote,
					sessionCode: match.session.code,
					matchCompleted: true,
					transition: { type: 'over', code: match.session.code },
				}
			}

			const completedMatches = await tx.sessionMatch.findMany({
				where: { sessionId: match.session.id, cluster: match.session.cluster },
				orderBy: { order: 'asc' },
				select: { winnerId: true },
			})
			const winners = completedMatches.map(entry => {
				if (!entry.winnerId) throw conflict('Round contains a match without a winner')
				return entry.winnerId
			})
			const newCluster = match.session.cluster / 2
			const nextPairs = pairs(shuffle(winners))

			await tx.sessionMatch.deleteMany({
				where: { sessionId: match.session.id, cluster: newCluster },
			})
			await tx.sessionMatch.createMany({
				data: nextPairs.map(([firstItemId, secondItemId], index) => ({
					order: index + 1,
					cluster: newCluster,
					sessionId: match.session.id,
					firstItemId,
					secondItemId,
				})),
			})
			await tx.session.update({
				where: { id: match.session.id },
				data: { cluster: newCluster },
			})

			const next = await tx.sessionMatch.findFirstOrThrow({
				where: { sessionId: match.session.id, cluster: newCluster, order: 1 },
				select: matchSelect,
			})
			return {
				vote: contractVote,
				sessionCode: match.session.code,
				matchCompleted: true,
				transition: { type: 'round', next: asContractMatch(next), cluster: newCluster },
			}
		},
		{ maxWait: 5_000, timeout: 15_000 },
	)
}
