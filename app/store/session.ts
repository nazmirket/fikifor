import { defineStore } from 'pinia'
import { useAuthStore } from './auth'

export const useSessionStore = defineStore('session', () => {
	const session = ref<any>({})
	const match = ref<any>({})
	const final = ref<any>({})

	const counter = ref<number>()

	const participation = computed(() =>
		session.value.participants?.find(
			(p: any) => p.user.id === useAuthStore().user.userId,
		),
	)

	// Get session
	async function getSession(code: string) {
		const { data, error, success } = await useApi(`/sessions/${code}`, {
			method: 'GET',
		})
		if (!success) throw new Error(error)

		session.value = data.session
		match.value = data.match
		final.value = data.final

		if (!session.value.ended) useSocket().emit('session:join', { code })
	}

	// Over
	async function over() {
		match.value = undefined
		counter.value = undefined
		await getSession(session.value.code)
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
