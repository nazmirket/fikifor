import type {
	ClientToServerEvents,
	ApiError,
	Participant,
	ServerToClientEvents,
	SessionMatch,
	SessionMatchResult,
	SessionVote,
} from '@fikifor/contracts'
import { io, type Socket } from 'socket.io-client'

import { useAuthStore } from '~/store/auth'
import { useSessionStore } from '~/store/session'
import { playGameSound } from '~/utils/gameAudio'

type FikiforSocket = Socket<ServerToClientEvents, ClientToServerEvents>

const socket = shallowRef<FikiforSocket>()
let joinedConnection: string | undefined
let joinedCode: string | undefined
let transitionTimer: ReturnType<typeof setTimeout> | undefined
let pendingTransition: string | undefined

function clearTransition() {
	if (transitionTimer) clearTimeout(transitionTimer)
	transitionTimer = undefined
	pendingTransition = undefined
}

function scheduleTransition(key: string, work: () => void) {
	if (pendingTransition === key) return
	clearTransition()
	pendingTransition = key
	useSessionStore().phase = 'transitioning'
	transitionTimer = setTimeout(() => {
		transitionTimer = undefined
		pendingTransition = undefined
		work()
	}, 2_500)
}

export function joinCurrentSession() {
	const currentSocket = socket.value
	const session = useSessionStore().session
	if (!currentSocket?.connected || !currentSocket.id || !session || session.ended) return
	if (joinedConnection === currentSocket.id && joinedCode === session.code) return
	joinedConnection = currentSocket.id
	joinedCode = session.code
	currentSocket.emit('session:join', { code: session.code })
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
	socket.value.on('connect', () => {
		joinedConnection = undefined
		joinedCode = undefined
		clearTransition()
		joinCurrentSession()
	})
	socket.value.on('disconnect', () => {
		joinedConnection = undefined
		joinedCode = undefined
		clearTransition()
	})

	socket.value.on('session:joined', (participants: Participant[]) => {
		const session = useSessionStore().session
		if (session) session.participants = participants
	})

	socket.value.on('session:participant', (participant: Participant) => {
		const session = useSessionStore().session
		if (!session) return
		const index = session.participants.findIndex(
			(entry: Participant) => entry.id === participant.id,
		)
		if (index === -1) session.participants.push(participant)
		else session.participants[index] = participant
		void playGameSound('join')
	})

	socket.value.on('session:online', (username: string) => {
		const participant = useSessionStore().session?.participants.find(
			(entry: Participant) => entry.user.username === username,
		)
		if (participant && !participant.online) {
			participant.online = true
			void playGameSound('join')
		}
	})

	socket.value.on('session:offline', (username: string) => {
		const participant = useSessionStore().session?.participants.find(
			(entry: Participant) => entry.user.username === username,
		)
		if (participant) participant.online = false
	})

	socket.value.on('session:counter', (counter: number) => {
		const store = useSessionStore()
		store.counter = counter || undefined
		if (counter > 0) store.phase = 'countdown'
	})

	socket.value.on('session:started', (match: SessionMatch) => {
		clearTransition()
		const store = useSessionStore()
		store.counter = undefined
		store.match = match
		store.phase = 'playing'
		const session = store.session
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

	socket.value.on('session:ended', (result: SessionMatchResult) => {
		const match = useSessionStore().match
		if (!match || match.id !== result.matchId) return
		match.winnerId = result.winnerId
		match.completed = true
		useSessionStore().phase = 'resolved'
		void playGameSound('win')
	})

	const transition = (match: SessionMatch) => {
		const store = useSessionStore()
		const current = store.match
		if (current) current.completed = true
		scheduleTransition(`next:${current?.id ?? 0}:${match.id}`, () => {
			store.match = match
			store.phase = 'playing'
		})
	}
	socket.value.on('session:next', transition)
	socket.value.on('session:round', (round: { next: SessionMatch; cluster: number }) => {
		const store = useSessionStore()
		const current = store.match
		if (current) current.completed = true
		scheduleTransition(`round:${current?.id ?? 0}:${round.next.id}`, () => {
			const session = store.session
			if (session) session.cluster = round.cluster
			store.match = round.next
			store.phase = 'playing'
		})
	})
	socket.value.on('session:over', (code: string) => {
		const store = useSessionStore()
		const session = store.session
		if (session?.code !== code) return
		const match = store.match
		if (match) match.completed = true
		scheduleTransition(`over:${match?.id ?? 0}:${code}`, () => {
			void store.over().catch(() => undefined)
		})
	})
	socket.value.on('session:error', (error: ApiError) => {
		useToast().add({ title: 'Error', description: error.message })
	})

	socket.value.connect()
	return socket.value
}
