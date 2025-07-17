import { defineStore } from 'pinia'

export const useAuthStore = defineStore(
	'auth',
	() => {
		const token = ref()
		const user = ref()

		const isLoggedIn = computed(() => !!token.value)

		// Login
		async function login(payload: any) {
			const { data, error, success } = await useAuthApi('/auth/login', {
				method: 'POST',
				body: payload,
			})

			// if error
			if (!success) throw new Error(error)

			// set token
			token.value = data.token
			user.value = data.user
		}

		// Login
		async function signup(payload: any) {
			const { data, error, success } = await useAuthApi('/auth/signup', {
				method: 'POST',
				body: payload,
			})

			// if error
			if (!success) throw new Error(error)

			// set token
			token.value = data.token
			user.value = data.user
		}

		return {
			login,
			signup,

			token,
			user,

			isLoggedIn,
		}
	},
	{
		persist: {
			storage: localStorage,
			key: 'auth',
		},
	},
)
