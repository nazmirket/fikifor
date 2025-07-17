import Prisma from '../prisma'

// connect to prisma and init config
Prisma.$connect()

import { Server, Socket } from 'socket.io'
import http from 'http'
import express from 'express'
import cors from 'cors'

import lodash from 'lodash'

import { protect } from './auth'

async function start() {
	// create express app
	const app = express()

	// set json as the default body parser
	app.use(express.json())

	// enable cors for all origins
	app.use(cors())

	// create http server
	const server = http.createServer(app)

	// socket.io
	const io = new Server(server, { cors: { origin: '*' } })

	// add auth middleware to socket
	io.use(protect)

	// init socket server
	io.on('connection', async function (socket: Socket) {
		// join the user's room
		socket.join(socket.data.userId.toString())

		try {
			const sessions = await Prisma.session.findMany({
				where: { participants: { some: { userId: socket.data.userId } } },
				select: { code: true },
			})

			await Prisma.participant.updateMany({
				where: { userId: socket.data.userId },
				data: { online: true },
			})

			// join the user's sessions
			for (const session of sessions) {
				await socket.join(session.code)
				// inform the session participants that the user is online
				io.to(session.code).emit('session:online', socket.data.username)
			}
		} catch (error) {}

		// listen for disconnect event
		socket.on('disconnect', async () => {
			try {
				const sessions = await Prisma.session.findMany({
					where: { participants: { some: { userId: socket.data.userId } } },
					select: { code: true },
				})
				// inform the session participants that the user is offline
				await Prisma.participant.updateMany({
					where: { userId: socket.data.userId },
					data: { online: false },
				})
				sessions.forEach(s => io.to(s.code).emit('session:offline', socket.data.username))
			} catch (error) {}
		})

		socket.on('session:join', async function (payload: any) {
			try {
				const code = payload.code

				const session = await Prisma.session.findUnique({ where: { code } })

				if (!session) throw new Error('Session not found')

				const participant = await Prisma.participant.findUnique({
					where: {
						userId_sessionId: { userId: socket.data.userId, sessionId: session.id },
					},
				})

				if (participant) return socket.join(code)

				await Prisma.participant.create({
					data: { sessionId: session.id, userId: socket.data.userId },
				})

				socket.join(code)

				const participants = await Prisma.participant.findMany({
					where: { sessionId: session.id },
					select: {
						id: true,
						online: true,
						user: {
							select: {
								id: true,
								username: true,
							},
						},
					},
				})

				io.to(code).emit('session:joined', participants)
			} catch (error) {}
		})

		socket.on('session:start', async function (payload: any) {
			try {
				const code = payload.code

				const session = await Prisma.session.findUnique({
					where: {
						code,
						adminId: socket.data.userId,
						started: false,
						ended: false,
					},
					select: {
						id: true,
						quiz: {
							select: {
								size: true,
								items: { select: { id: true } },
							},
						},
					},
				})

				if (!session) throw new Error('Error')

				const items = lodash.shuffle(session.quiz.items.map(item => item.id))
				const matches = lodash.chunk(items, 2)
				const cluster = session.quiz.size / 2

				await Prisma.$transaction([
					Prisma.sessionMatch.deleteMany({ where: { sessionId: session.id } }),
					Prisma.sessionMatch.createMany({
						data: matches.map((match, index) => ({
							order: index + 1,
							cluster,
							sessionId: session.id,
							firstItemId: match[0],
							secondItemId: match[1],
						})),
					}),
					Prisma.session.update({
						where: { id: session.id },
						data: { cluster },
					}),
				])

				let counter = 5

				io.to(code).emit('session:counter', counter)

				const interval = setInterval(async () => {
					io.to(code).emit('session:counter', counter--)
					if (counter < 0) {
						clearInterval(interval)

						const session = await Prisma.session.update({
							where: { code },
							data: { started: true },
							select: {
								id: true,
								cluster: true,
								quiz: { select: { size: true } },
							},
						})

						const match = await Prisma.sessionMatch.findFirst({
							where: {
								session: { code },
								cluster: session.cluster,
							},
							orderBy: { order: 'asc' },
							select: {
								id: true,
								votes: {
									select: {
										selectionId: true,
										participantId: true,
										participant: {
											select: {
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
								order: true,
								cluster: true,
							},
						})

						if (!match) throw new Error('Error')

						io.to(code).emit('session:started', match)
					}
				}, 1000)
			} catch (error) {}
		})

		socket.on('session:vote', async function (payload: any) {
			try {
				const { matchId, itemId } = payload

				const participant = await Prisma.participant.findFirst({
					where: {
						session: { matches: { some: { id: matchId } } },
						userId: socket.data.userId,
					},
				})

				if (!participant) throw new Error('Unauthorized')

				const updated = await Prisma.sessionMatch.update({
					where: {
						id: matchId,
						completed: false,
						session: { participants: { some: { userId: socket.data.userId } } },
					},
					data: {
						votes: {
							upsert: {
								where: {
									matchId_participantId: {
										matchId,
										participantId: participant.id,
									},
								},
								create: {
									participantId: participant.id,
									selectionId: itemId,
								},
								update: {
									selectionId: itemId,
									participantId: participant.id,
								},
							},
						},
					},
					select: {
						session: {
							select: {
								id: true,
								code: true,
								cluster: true,
								_count: { select: { participants: true } },
							},
						},
						order: true,
						firstItem: {
							select: {
								id: true,
								_count: {
									select: {
										votes: { where: { matchId } },
									},
								},
							},
						},
						secondItem: {
							select: {
								id: true,
								_count: {
									select: {
										votes: { where: { matchId } },
									},
								},
							},
						},
					},
				})

				io.to(updated.session.code).emit('session:voted', {
					matchId,
					selectionId: itemId,
					participantId: participant.id,
					participant: {
						id: participant.id,
						userId: socket.data.userId,
						user: {
							id: socket.data.userId,
							username: socket.data.username,
						},
					},
				})

				const participantCount = updated.session._count.participants
				const firstItemVotes = updated.firstItem._count.votes
				const secondItemVotes = updated.secondItem._count.votes

				if (firstItemVotes + secondItemVotes === participantCount) {
					let winnerId
					if (firstItemVotes > secondItemVotes) winnerId = updated.firstItem.id
					else if (firstItemVotes < secondItemVotes) winnerId = updated.secondItem.id

					if (winnerId) {
						await Prisma.sessionMatch.update({
							where: { id: matchId },
							data: { completed: true },
						})

						io.to(updated.session.code).emit('session:match:done')

						const next = await Prisma.sessionMatch.findFirst({
							where: {
								session: { code: updated.session.code },
								completed: false,
								cluster: updated.session.cluster,
							},
							orderBy: { order: 'asc' },
							select: {
								id: true,
								votes: {
									select: {
										selectionId: true,
										participantId: true,
										participant: {
											select: {
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
								order: true,
								cluster: true,
							},
						})

						// If there is a next match update index and emit next match
						if (next) io.to(updated.session.code).emit('session:next', next)
						// If there is no next match, go to the next round
						else {
							const isSessionOver = updated.session.cluster === 1

							// If the session is over, find the favorite and emit end
							if (isSessionOver) {
								const finalMatch = await Prisma.sessionMatch.findFirst({
									where: {
										cluster: 1,
										session: { code: updated.session.code },
									},
									select: {
										firstItem: {
											select: {
												id: true,
												_count: {
													select: {
														votes: { where: { match: { cluster: 1 } } },
													},
												},
											},
										},
										secondItem: {
											select: {
												id: true,
												_count: {
													select: {
														votes: { where: { match: { cluster: 1 } } },
													},
												},
											},
										},
									},
								})

								if (!finalMatch) throw new Error('Error')

								const favoriteId =
									finalMatch.firstItem._count.votes > finalMatch.secondItem._count.votes
										? finalMatch.firstItem.id
										: finalMatch.secondItem.id

								await Prisma.session.update({
									where: { code: updated.session.code },
									data: { favoriteId, ended: true, cluster: 0 },
								})

								io.to(updated.session.code).emit('session:over', updated.session.code)
							}
							// If there is a next round, update the cluster and emit next round
							else {
								const matches = await Prisma.sessionMatch.findMany({
									where: {
										session: { code: updated.session.code },
										cluster: updated.session.cluster,
									},
									select: {
										firstItem: {
											select: {
												id: true,
												_count: {
													select: {
														votes: {
															where: {
																match: {
																	sessionId: updated.session.id,
																	cluster: updated.session.cluster,
																},
															},
														},
													},
												},
											},
										},
										secondItem: {
											select: {
												id: true,
												_count: {
													select: {
														votes: {
															where: {
																match: {
																	sessionId: updated.session.id,
																	cluster: updated.session.cluster,
																},
															},
														},
													},
												},
											},
										},
									},
								})

								const winners = matches.map(match => {
									if (match.firstItem._count.votes > match.secondItem._count.votes)
										return match.firstItem.id
									else return match.secondItem.id
								})

								const newCluster = updated.session.cluster / 2

								const newMatches = lodash
									.chunk(lodash.shuffle(winners), 2)
									.map((match, index) => ({
										order: index + 1,
										cluster: newCluster,
										sessionId: updated.session.id,
										firstItemId: match[0],
										secondItemId: match[1],
									}))

								await Prisma.$transaction([
									Prisma.sessionMatch.deleteMany({
										where: {
											sessionId: updated.session.id,
											cluster: newCluster,
										},
									}),
									Prisma.sessionMatch.createMany({ data: newMatches }),
									Prisma.session.update({
										where: { code: updated.session.code },
										data: { cluster: newCluster },
									}),
								])

								const next = await Prisma.sessionMatch.findFirst({
									where: {
										session: { code: updated.session.code },
										cluster: newCluster,
										order: 1,
									},
									select: {
										id: true,
										votes: {
											select: {
												selectionId: true,
												participantId: true,
												participant: {
													select: {
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
										order: true,
										cluster: true,
									},
								})

								if (!next) throw new Error('Error')

								io.to(updated.session.code).emit('session:round', {
									next,
									cluster: newCluster,
								})
							}
						}
					}
				}
			} catch (error) {}
		})
	})

	// listen for incoming requests
	const port = parseInt((process.env.SOCKET_PORT || process.env.PORT) as string)

	server.listen(port, () => console.log('Socket is running on port', port))
}

start()
