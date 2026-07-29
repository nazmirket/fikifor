import type {
	GameSession,
	Participant,
	SessionMatch,
	SessionSnapshot,
} from '@fikifor/contracts'
import { defineStore } from 'pinia'

import { useAuthStore } from './auth'

export const useSessionStore = defineStore('session', () => {
	const session = ref<GameSession | null>(null)
	const match = ref<SessionMatch | null>(null)
	const final = ref<SessionMatch | null>(null)
	const counter = ref<number>()

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

		if (!session.value.ended) useSocket().emit('session:join', { code })
	}

	async function over() {
		const code = session.value?.code
		if (!code) return
		match.value = null
		counter.value = undefined
		await getSession(code)
	}

	return {
		session,
		final,
		counter,
		match,
		over,
		getSession,
		participation,
	}
})
