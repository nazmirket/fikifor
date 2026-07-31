import type { AddressInfo } from 'node:net'

import type { PrismaClient } from '@prisma/client'
import { io, type Socket } from 'socket.io-client'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type {
	ClientToServerEvents,
	ServerToClientEvents,
	SocketFailure,
	SocketSuccess,
} from '@fikifor/contracts'

const integration = process.env.TEST_DATABASE_URL ? describe : describe.skip

integration('Socket.IO session events', () => {
	let prisma: PrismaClient
	let runtime: Awaited<ReturnType<typeof import('../ws/server').createSocketRuntime>>
	let client: Socket<ServerToClientEvents, ClientToServerEvents>
	let token: string
	let quizItemIds: number[]
	const code = 'SOCKETTEST0001'

	beforeAll(async () => {
		process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
		;({ default: prisma } = await import('../prisma'))
		const { sign } = await import('../utils/JwtUtils')
		const { createSocketRuntime } = await import('../ws/server')

		await prisma.sessionVote.deleteMany()
		await prisma.sessionMatch.deleteMany()
		await prisma.participant.deleteMany()
		await prisma.session.deleteMany()
		await prisma.quizItem.deleteMany()
		await prisma.quiz.deleteMany()
		await prisma.image.deleteMany()
		await prisma.user.deleteMany()

		const user = await prisma.user.create({
			data: { username: 'socket-user', password: 'hash' },
		})
		const cover = await prisma.image.create({
			data: { folder: 'test', name: 'socket-cover.jpeg' },
		})
		const quiz = await prisma.quiz.create({
			data: {
				ownerId: user.id,
				coverId: cover.id,
				title: 'Socket test',
				description: 'Socket event fixture',
				size: 32,
				items: { create: [{ title: 'First' }, { title: 'Second' }] },
			},
			include: { items: { orderBy: { id: 'asc' } } },
		})
		quizItemIds = quiz.items.map(item => item.id)
		await prisma.session.create({
			data: { code, quizId: quiz.id, adminId: user.id, cluster: 16 },
		})
		token = sign({ userId: user.id, username: user.username })

		runtime = await createSocketRuntime(0)
		const port = (runtime.httpServer.address() as AddressInfo).port
		client = io(`http://127.0.0.1:${port}`, {
			auth: { token },
			transports: ['websocket'],
		})
		await new Promise<void>((resolve, reject) => {
			client.once('connect', () => resolve())
			client.once('connect_error', reject)
		})
	})

	afterAll(async () => {
		client?.disconnect()
		await runtime?.close()
	})

	it('validates and handles the session join event', async () => {
		const result = await new Promise<SocketSuccess | SocketFailure>(resolve => {
			client.emit('session:join', { code }, resolve)
		})
		expect(result).toEqual({ ok: true })

		const participant = await prisma.participant.findFirst({
			where: { session: { code }, user: { username: 'socket-user' } },
		})
		expect(participant?.online).toBe(true)
	})

	it('emits a structured error for an invalid vote', async () => {
		const errorEvent = new Promise<{ code: string; message: string }>(resolve => {
			client.once('session:error', resolve)
		})
		const result = await new Promise<SocketSuccess | SocketFailure>(resolve => {
			client.emit('session:vote', { matchId: -1, itemId: -1 }, resolve)
		})
		expect(result.ok).toBe(false)
		await expect(errorEvent).resolves.toMatchObject({ code: 'VALIDATION_ERROR' })
	})

	it('broadcasts the authoritative winner when a match completes', async () => {
		const session = await prisma.session.findUniqueOrThrow({ where: { code } })
		const match = await prisma.sessionMatch.create({
			data: {
				sessionId: session.id,
				cluster: 1,
				order: 1,
				firstItemId: quizItemIds[0],
				secondItemId: quizItemIds[1],
			},
		})
		await prisma.session.update({
			where: { id: session.id },
			data: { started: true, cluster: 1 },
		})

		const completed = new Promise<{ matchId: number; winnerId: number }>(resolve => {
			client.once('session:ended', resolve)
		})
		const result = await new Promise<SocketSuccess | SocketFailure>(resolve => {
			client.emit('session:vote', { matchId: match.id, itemId: quizItemIds[0] }, resolve)
		})

		expect(result).toEqual({ ok: true })
		await expect(completed).resolves.toEqual({
			matchId: match.id,
			winnerId: quizItemIds[0],
		})
	})
})
