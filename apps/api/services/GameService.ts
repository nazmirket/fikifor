import { randomInt } from 'node:crypto'

import type {
	SessionMatch as ContractSessionMatch,
	SessionVote as ContractSessionVote,
} from '@fikifor/contracts'
import { Prisma as PrismaTypes } from '@prisma/client'

import { env } from '../config/env'
import Prisma from '../prisma'
import { badRequest, conflict, forbidden, notFound } from '../utils/AppError'
import { gameMetrics } from '../utils/metrics'

export const matchSelect = PrismaTypes.validator<PrismaTypes.SessionMatchSelect>()({
	id: true,
	order: true,
	cluster: true,
	completed: true,
	winnerId: true,
	deadlineAt: true,
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
	winnerId: number | null
	transition: VoteTransition
}

export interface DeadlineOutcome extends VoteResolution {
	matchId: number
	sessionCode: string
}

export interface PendingMatchDeadline {
	matchId: number
	deadlineAt: Date
}

interface VoteMatchRow {
	id: number
	sessionId: number
	cluster: number
	completed: boolean
	firstItemId: number
	secondItemId: number
	deadlineAt: Date | null
	isCurrent: boolean
	sessionCode: string
	sessionCluster: number
	sessionEnded: boolean
	sessionStartsAt: Date | null
	participantCount: number
	participantId: number | null
	participantUserId: number | null
	participantUsername: string | null
}

interface FinalizationMatchRow {
	id: number
	sessionId: number
	cluster: number
	completed: boolean
	firstItemId: number
	secondItemId: number
	deadlineAt: Date | null
	isCurrent: boolean
	sessionCode: string
	sessionCluster: number
	sessionEnded: boolean
	sessionQuizId: number
	participantCount: number
}

interface VoteResolution {
	matchCompleted: boolean
	winnerId: number | null
	transition: VoteTransition
}

function asContractMatch(match: MatchRecord): ContractSessionMatch {
	return match as unknown as ContractSessionMatch
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

function nextDeadline() {
	return new Date(Date.now() + env.matchDeadlineMs)
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

async function sessionLock(
	tx: PrismaTypes.TransactionClient,
	sessionId: number,
	measure = false,
) {
	const startedAt = performance.now()
	await tx.$executeRaw`SELECT pg_advisory_xact_lock(74201, CAST(${sessionId} AS integer))`
	if (measure) gameMetrics.finalizationLockWait(performance.now() - startedAt)
}

function unresolvedVote(): VoteResolution {
	return {
		matchCompleted: false,
		winnerId: null,
		transition: { type: 'none' },
	}
}

async function materializeSessionResult(
	tx: PrismaTypes.TransactionClient,
	sessionId: number,
	quizId: number,
	winnerId: number,
	participantCount: number,
) {
	await tx.$executeRaw(
		PrismaTypes.sql`
			WITH placements AS (
				SELECT
					item."id" AS "itemId",
					quiz."size",
					CASE
						WHEN item."id" = ${winnerId} THEN 1
						ELSE eliminated."cluster" + 1
					END::integer AS "placement"
				FROM "QuizItem" item
				INNER JOIN "Quiz" quiz ON quiz."id" = item."quizId"
				LEFT JOIN LATERAL (
					SELECT match."cluster"
					FROM "SessionMatch" match
					WHERE match."sessionId" = ${sessionId}
						AND match."completed" = true
						AND match."winnerId" IS NOT NULL
						AND match."winnerId" <> item."id"
						AND (
							match."firstItemId" = item."id"
							OR match."secondItemId" = item."id"
						)
					LIMIT 1
				) eliminated ON true
				WHERE item."quizId" = ${quizId}
					AND (item."id" = ${winnerId} OR eliminated."cluster" IS NOT NULL)
			)
			UPDATE "QuizItem" item
			SET
				"sessionWins" = item."sessionWins"
					+ CASE WHEN placements."placement" = 1 THEN 1 ELSE 0 END,
				"weightedScore" = item."weightedScore"
					+ (
						placements."size" + 1 - placements."placement"
					) * ${participantCount},
				"weightedPlacement" = item."weightedPlacement"
					+ placements."placement" * ${participantCount}
			FROM placements
			WHERE item."id" = placements."itemId"
		`,
	)
	await tx.quiz.update({
		where: { id: quizId },
		data: {
			completedSessionCount: { increment: 1 },
			participantWeight: { increment: participantCount },
		},
	})
}

async function finalizeMatch(
	matchId: number,
	sessionId: number,
): Promise<VoteResolution> {
	return Prisma.$transaction(
		async tx => {
			// Only the short finalization path is serialized. Ordinary vote writes use
			// compatible row-share locks and can proceed concurrently.
			await sessionLock(tx, sessionId, true)
			const [match] = await tx.$queryRaw<FinalizationMatchRow[]>(
				PrismaTypes.sql`
					SELECT
						match."id",
						match."sessionId",
						match."cluster",
						match."completed",
						match."firstItemId",
						match."secondItemId",
						match."deadlineAt",
						NOT EXISTS (
							SELECT 1
							FROM "SessionMatch" earlier
							WHERE earlier."sessionId" = match."sessionId"
								AND earlier."cluster" = match."cluster"
								AND earlier."completed" = false
								AND earlier."order" < match."order"
						) AS "isCurrent",
						session."code" AS "sessionCode",
						session."cluster" AS "sessionCluster",
						session."ended" AS "sessionEnded",
						session."quizId" AS "sessionQuizId",
						(
							SELECT COUNT(*)::integer
							FROM "Participant" participant
							WHERE participant."sessionId" = session."id"
						) AS "participantCount"
					FROM "SessionMatch" match
					INNER JOIN "Session" session ON session."id" = match."sessionId"
					WHERE match."id" = ${matchId}
					FOR UPDATE OF match
				`,
			)
			if (!match) throw notFound('Match not found')
			if (match.sessionId !== sessionId) throw conflict('Match session changed')
			if (match.completed || match.sessionEnded) return unresolvedVote()
			if (match.cluster !== match.sessionCluster || !match.isCurrent)
				throw conflict('This is not the active match')

			const groupedVotes = await tx.sessionVote.groupBy({
				by: ['selectionId'],
				where: { matchId },
				_count: { _all: true },
			})
			const voteCount = groupedVotes.reduce(
				(total, group) => total + group._count._all,
				0,
			)
			const deadlineElapsed =
				match.deadlineAt !== null && match.deadlineAt.getTime() <= Date.now()
			if (voteCount < match.participantCount && !deadlineElapsed) {
				return unresolvedVote()
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
					cluster: match.sessionCluster,
					completed: false,
				},
				orderBy: { order: 'asc' },
				select: { id: true },
			})
			if (nextMatch) {
				const next = await tx.sessionMatch.update({
					where: { id: nextMatch.id },
					data: { deadlineAt: nextDeadline() },
					select: matchSelect,
				})
				return {
					matchCompleted: true,
					winnerId,
					transition: { type: 'next', next: asContractMatch(next) },
				}
			}

			if (match.sessionCluster === 1) {
				await materializeSessionResult(
					tx,
					match.sessionId,
					match.sessionQuizId,
					winnerId,
					match.participantCount,
				)
				await tx.session.update({
					where: { id: match.sessionId },
					data: { favoriteId: winnerId, ended: true, cluster: 0 },
				})
				return {
					matchCompleted: true,
					winnerId,
					transition: { type: 'over', code: match.sessionCode },
				}
			}

			const completedMatches = await tx.sessionMatch.findMany({
				where: { sessionId: match.sessionId, cluster: match.sessionCluster },
				orderBy: { order: 'asc' },
				select: { winnerId: true },
			})
			const winners = completedMatches.map(entry => {
				if (!entry.winnerId) throw conflict('Round contains a match without a winner')
				return entry.winnerId
			})
			const newCluster = match.sessionCluster / 2
			const nextPairs = pairs(shuffle(winners))
			const deadlineAt = nextDeadline()

			await tx.sessionMatch.deleteMany({
				where: { sessionId: match.sessionId, cluster: newCluster },
			})
			await tx.sessionMatch.createMany({
				data: nextPairs.map(([firstItemId, secondItemId], index) => ({
					order: index + 1,
					cluster: newCluster,
					sessionId: match.sessionId,
					firstItemId,
					secondItemId,
					deadlineAt: index === 0 ? deadlineAt : null,
				})),
			})
			await tx.session.update({
				where: { id: match.sessionId },
				data: { cluster: newCluster },
			})

			const next = await tx.sessionMatch.findFirstOrThrow({
				where: { sessionId: match.sessionId, cluster: newCluster, order: 1 },
				select: matchSelect,
			})
			return {
				matchCompleted: true,
				winnerId,
				transition: { type: 'round', next: asContractMatch(next), cluster: newCluster },
			}
		},
		{ maxWait: 5_000, timeout: 15_000 },
	)
}

export async function joinSession(code: string, userId: number) {
	return Prisma.$transaction(async tx => {
		const session = await tx.session.findUnique({
			where: { code },
			select: {
				id: true,
				code: true,
				cluster: true,
				started: true,
				startsAt: true,
				ended: true,
			},
		})
		if (!session) throw notFound('Session not found')

		await sessionLock(tx, session.id)
		const existing = await tx.participant.findUnique({
			where: { userId_sessionId: { userId, sessionId: session.id } },
			select: { id: true, online: true },
		})
		if (!existing && (session.started || session.ended)) {
			throw conflict('This session is no longer accepting participants')
		}

		const changed = !existing || !existing.online
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
		const participant = participants.find(entry => entry.user.id === userId)
		if (!participant) throw notFound('Participant not found')
		return { ...session, participant, participants, changed }
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
		const startsAt = new Date(Date.now() + env.gameCountdownMs)
		const deadlineAt = new Date(startsAt.getTime() + env.matchDeadlineMs)
		const tournamentPairs = pairs(shuffle(session.quiz.items.map(item => item.id)))

		await tx.sessionMatch.deleteMany({ where: { sessionId: session.id } })
		await tx.sessionMatch.createMany({
			data: tournamentPairs.map(([firstItemId, secondItemId], index) => ({
				order: index + 1,
				cluster,
				sessionId: session.id,
				firstItemId,
				secondItemId,
				deadlineAt: index === 0 ? deadlineAt : null,
			})),
		})
		await tx.session.update({
			where: { id: session.id },
			data: { cluster, started: true, startsAt },
		})

		return { id: session.id, code: session.code, cluster, startsAt }
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

export async function pendingMatchDeadlines(): Promise<PendingMatchDeadline[]> {
	return Prisma.$queryRaw<PendingMatchDeadline[]>(PrismaTypes.sql`
		SELECT
			match."id" AS "matchId",
			match."deadlineAt"
		FROM "SessionMatch" match
		INNER JOIN "Session" session ON session."id" = match."sessionId"
		WHERE match."completed" = false
			AND match."deadlineAt" IS NOT NULL
			AND session."started" = true
			AND session."ended" = false
			AND match."cluster" = session."cluster"
			AND NOT EXISTS (
				SELECT 1
				FROM "SessionMatch" earlier
				WHERE earlier."sessionId" = match."sessionId"
					AND earlier."cluster" = match."cluster"
					AND earlier."completed" = false
					AND earlier."order" < match."order"
			)
	`)
}

export async function expireMatch(matchId: number): Promise<DeadlineOutcome | null> {
	const match = await Prisma.sessionMatch.findUnique({
		where: { id: matchId },
		select: { sessionId: true, session: { select: { code: true } } },
	})
	if (!match) return null
	const resolution = await finalizeMatch(matchId, match.sessionId)
	return {
		matchId,
		sessionCode: match.session.code,
		...resolution,
	}
}

export async function submitVote(
	matchId: number,
	itemId: number,
	userId: number,
): Promise<VoteOutcome> {
	const persisted = await Prisma.$transaction(
		async tx => {
			// A share lock keeps finalization from passing an in-flight vote, while
			// allowing votes from different participants to be written in parallel.
			const [match] = await tx.$queryRaw<VoteMatchRow[]>(
				PrismaTypes.sql`
					SELECT
						match."id",
						match."sessionId",
						match."cluster",
						match."completed",
						match."firstItemId",
						match."secondItemId",
						match."deadlineAt",
						NOT EXISTS (
							SELECT 1
							FROM "SessionMatch" earlier
							WHERE earlier."sessionId" = match."sessionId"
								AND earlier."cluster" = match."cluster"
								AND earlier."completed" = false
								AND earlier."order" < match."order"
						) AS "isCurrent",
						session."code" AS "sessionCode",
						session."cluster" AS "sessionCluster",
						session."ended" AS "sessionEnded",
						session."startsAt" AS "sessionStartsAt",
						(
							SELECT COUNT(*)::integer
							FROM "Participant" sessionParticipant
							WHERE sessionParticipant."sessionId" = session."id"
						) AS "participantCount",
						participant."id" AS "participantId",
						participant."userId" AS "participantUserId",
						participantUser."username" AS "participantUsername"
					FROM "SessionMatch" match
					INNER JOIN "Session" session ON session."id" = match."sessionId"
					LEFT JOIN "Participant" participant
						ON participant."sessionId" = session."id"
						AND participant."userId" = ${userId}
					LEFT JOIN "User" participantUser
						ON participantUser."id" = participant."userId"
					WHERE match."id" = ${matchId}
					FOR SHARE OF match
				`,
			)
			if (!match) throw notFound('Match not found')
			if (match.completed || match.sessionEnded)
				throw conflict('Voting for this match is closed')
			if (match.sessionStartsAt && match.sessionStartsAt.getTime() > Date.now()) {
				throw conflict('The session countdown is still active')
			}
			if (match.cluster !== match.sessionCluster || !match.isCurrent)
				throw conflict('This is not the active match')
			if (![match.firstItemId, match.secondItemId].includes(itemId)) {
				throw badRequest('Vote selection is not part of this match')
			}
			if (
				!match.participantId ||
				!match.participantUserId ||
				!match.participantUsername
			) {
				throw forbidden('You are not a participant in this session')
			}

			const vote = await tx.sessionVote.upsert({
				where: {
					matchId_participantId: {
						matchId,
						participantId: match.participantId,
					},
				},
				create: {
					matchId,
					participantId: match.participantId,
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
				participant: {
					id: match.participantId,
					userId: match.participantUserId,
					user: {
						id: match.participantUserId,
						username: match.participantUsername,
					},
				},
			}
			return {
				vote: contractVote,
				sessionId: match.sessionId,
				sessionCode: match.sessionCode,
				participantCount: match.participantCount,
				deadlineAt: match.deadlineAt,
			}
		},
		{ maxWait: 5_000, timeout: 10_000 },
	)

	const voteCount = await Prisma.sessionVote.count({ where: { matchId } })
	const deadlineElapsed =
		persisted.deadlineAt !== null && persisted.deadlineAt.getTime() <= Date.now()
	const resolution =
		voteCount < persisted.participantCount && !deadlineElapsed
			? unresolvedVote()
			: await finalizeMatch(matchId, persisted.sessionId)

	return {
		vote: persisted.vote,
		sessionCode: persisted.sessionCode,
		...resolution,
	}
}
