import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '~/store/auth'
import { useSessionStore } from '~/store/session'

const socket = ref<Socket>()

export default function (): Socket {
	if (socket.value) return socket.value

	// Auth payload
	const auth = { token: useAuthStore().token }

	// Connect to the socket server
	socket.value = io(useRuntimeConfig().public.SOCKET_URL as string, {
		autoConnect: false,
		auth,
	})

	if (!socket.value.connected) socket.value.connect()

	// Listen for event
	socket.value.on('session:joined', function (participants: any[]) {
		useSessionStore().session.participants = participants
		const audio = new Audio('/audio/join.m4a')
		audio.play()
	})

	// Listen for online event
	socket.value.on('session:online', function (username: string) {
		const index = useSessionStore().session.participants?.findIndex(
			(p: any) => p.user?.username === username,
		)
		if (useSessionStore().session?.participants?.[index]) {
			useSessionStore().session.participants[index].online = true
			const audio = new Audio('/audio/join.m4a')
			audio.play()
		}
	})

	// Listen for offline event
	socket.value.on('session:offline', function (username: string) {
		const index = useSessionStore().session.participants?.findIndex(
			(p: any) => p.user?.username === username,
		)
		if (useSessionStore().session?.participants?.[index]) {
			useSessionStore().session.participants[index].online = false
			const audio = new Audio('/audio/leave.m4a')
			audio.play()
		}
	})

	// Listen for start counter
	socket.value.on('session:counter', function (counter: number) {
		useSessionStore().counter = counter
	})

	// Lister for session start
	socket.value.on('session:started', function (match) {
		useSessionStore().match = match
		useSessionStore().session.started = true
	})

	// Listen session vote
	socket.value.on('session:voted', function (vote) {
		const matchId = vote.matchId
		const participantId = vote.participantId

		if (useSessionStore().match.id === matchId) {
			const index = useSessionStore().match.votes.findIndex(
				(v: any) => v.participantId === participantId,
			)
			if (index === -1) useSessionStore().match.votes.push(vote)
			else useSessionStore().match.votes[index] = vote
		}
	})

	// Listen session match end
	socket.value.on('session:ended', function () {
		useSessionStore().match.completed = true
	})

	// Listen session next
	socket.value.on('session:next', function (match) {
		useSessionStore().match.completed = true
		setTimeout(() => (useSessionStore().match = match), 2500)
	})

	// Listen session round
	socket.value.on('session:round', function (round) {
		useSessionStore().match.completed = true
		setTimeout(() => {
			useSessionStore().session.cluster = round.cluster
			useSessionStore().match = round.next
		}, 2500)
	})

	// Listen session over
	socket.value.on('session:over', function (code) {
		if (useSessionStore().session.code === code) {
			useSessionStore().match.completed = true
			setTimeout(() => useSessionStore().over(), 2500)
		}
	})

	// return the socket
	return socket.value
}
