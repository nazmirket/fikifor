import type {
	GameSession,
	Participant,
	SessionMatch,
	SessionSnapshot,
} from '@fikifor/contracts'
import { defineStore } from 'pinia'

import { useAuthStore } from './auth'

export type GamePhase =
	'lobby' | 'countdown' | 'playing' | 'resolved' | 'transitioning' | 'finished'

export const useSessionStore = defineStore('session', () => {
	const session = ref<GameSession | null>(null)
	const match = ref<SessionMatch | null>(null)
	const final = ref<SessionMatch | null>(null)
	const counter = ref<number>()
	const phase = ref<GamePhase>('lobby')
	let countdownTimer: ReturnType<typeof setInterval> | undefined

	const participation = computed<Participant | undefined>(() => {
		const userId = useAuthStore().user?.userId
		return session.value?.participants.find(
			(participant: Participant) => participant.user.id === userId,
		)
	})

	async function getSession(code: string) {
		const response = await useApi<SessionSnapshot>(`/sessions/${code}`, {
			method: 'GET',
		})
		if (!response.success) throw apiError(response.error)

		session.value = response.data.session
		match.value = response.data.match
		final.value = response.data.final

		stopCountdown()
		if (session.value.ended) phase.value = 'finished'
		else if (!session.value.started) phase.value = 'lobby'
		else if (
			session.value.startsAt &&
			new Date(session.value.startsAt).getTime() > Date.now()
		) {
			phase.value = 'countdown'
			startCountdown(session.value.startsAt)
		} else {
			phase.value = match.value ? 'playing' : 'countdown'
		}

		if (!session.value.ended) {
			useSocket()
			joinCurrentSession()
		}
	}

	function startCountdown(startsAt: string) {
		const update = () => {
			const remaining = new Date(startsAt).getTime() - Date.now()
			counter.value = remaining > 0 ? Math.ceil(remaining / 1_000) : undefined
			if (remaining <= 0) stopCountdown()
		}
		update()
		countdownTimer = setInterval(update, 250)
	}

	function stopCountdown() {
		if (countdownTimer) clearInterval(countdownTimer)
		countdownTimer = undefined
	}

	async function over() {
		const code = session.value?.code
		if (!code) return
		match.value = null
		counter.value = undefined
		await getSession(code)
	}

	onScopeDispose(stopCountdown)

	return {
		session,
		final,
		counter,
		phase,
		match,
		over,
		getSession,
		participation,
	}
})
