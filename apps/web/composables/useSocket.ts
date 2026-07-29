import type {
	ClientToServerEvents,
	ApiError,
	Participant,
	ServerToClientEvents,
	SessionMatch,
	SessionVote,
} from '@fikifor/contracts'
import { io, type Socket } from 'socket.io-client'

import { useAuthStore } from '~/store/auth'
import { useSessionStore } from '~/store/session'

type FikiforSocket = Socket<ServerToClientEvents, ClientToServerEvents>

const socket = shallowRef<FikiforSocket>()

function playSound(path: string) {
	const audio = new Audio(path)
	audio.play().catch(() => undefined)
}

export default function (): FikiforSocket {
	const authStore = useAuthStore()
	if (socket.value) {
		socket.value.auth = { token: authStore.token }
		if (!socket.value.connected) socket.value.connect()
		return socket.value
	}

	socket.value = io(useRuntimeConfig().public.SOCKET_URL as string, {
		autoConnect: false,
		auth: { token: authStore.token },
	})

	socket.value.on('session:joined', (participants: Participant[]) => {
		const session = useSessionStore().session
		if (session) session.participants = participants
		playSound('/sounds/join.m4a')
	})

	socket.value.on('session:online', (username: string) => {
		const participant = useSessionStore().session?.participants.find(
			(entry: Participant) => entry.user.username === username,
		)
		if (participant && !participant.online) {
			participant.online = true
			playSound('/sounds/join.m4a')
		}
	})

	socket.value.on('session:offline', (username: string) => {
		const participant = useSessionStore().session?.participants.find(
			(entry: Participant) => entry.user.username === username,
		)
		if (participant) participant.online = false
	})

	socket.value.on('session:counter', (counter: number) => {
		useSessionStore().counter = counter || undefined
	})

	socket.value.on('session:started', (match: SessionMatch) => {
		useSessionStore().match = match
		const session = useSessionStore().session
		if (session) session.started = true
	})

	socket.value.on('session:voted', (vote: SessionVote) => {
		const match = useSessionStore().match
		if (match?.id !== vote.matchId) return
		const index = match.votes.findIndex(
			(entry: SessionVote) => entry.participantId === vote.participantId,
		)
		if (index === -1) match.votes.push(vote)
		else match.votes[index] = vote
	})

	socket.value.on('session:ended', () => {
		const match = useSessionStore().match
		if (match) match.completed = true
	})

	const transition = (match: SessionMatch) => {
		const current = useSessionStore().match
		if (current) current.completed = true
		setTimeout(() => (useSessionStore().match = match), 2_500)
	}
	socket.value.on('session:next', transition)
	socket.value.on('session:round', (round: { next: SessionMatch; cluster: number }) => {
		const current = useSessionStore().match
		if (current) current.completed = true
		setTimeout(() => {
			const session = useSessionStore().session
			if (session) session.cluster = round.cluster
			useSessionStore().match = round.next
		}, 2_500)
	})
	socket.value.on('session:over', (code: string) => {
		const session = useSessionStore().session
		if (session?.code !== code) return
		const match = useSessionStore().match
		if (match) match.completed = true
		setTimeout(
			() =>
				useSessionStore()
					.over()
					.catch(() => undefined),
			2_500,
		)
	})
	socket.value.on('session:error', (error: ApiError) => {
		useToast().add({ title: 'Error', description: error.message })
	})

	socket.value.connect()
	return socket.value
}
