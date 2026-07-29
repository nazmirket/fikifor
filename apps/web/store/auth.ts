import type { AuthResult, LoginInput, SignupInput } from '@fikifor/contracts'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore(
	'auth',
	() => {
		const token = ref<string | null>(null)
		const user = ref<AuthResult['user'] | null>(null)

		function hasValidToken() {
			if (!token.value || !user.value) return false
			try {
				const segment = token.value.split('.')[1]
				if (!segment) return false
				const encoded = segment
					.replace(/-/g, '+')
					.replace(/_/g, '/')
					.padEnd(Math.ceil(segment.length / 4) * 4, '=')
				const payload = JSON.parse(atob(encoded)) as { exp?: number }
				return typeof payload.exp === 'number' && payload.exp * 1_000 > Date.now()
			} catch {
				return false
			}
		}

		const isLoggedIn = computed(() => hasValidToken())

		async function login(payload: LoginInput) {
			const response = await useAuthApi<AuthResult>('/auth/login', {
				method: 'POST',
				body: payload,
			})
			if (!response.success) throw apiError(response.error)
			token.value = response.data.token
			user.value = response.data.user
		}

		async function signup(payload: SignupInput) {
			const response = await useAuthApi<AuthResult>('/auth/signup', {
				method: 'POST',
				body: payload,
			})
			if (!response.success) throw apiError(response.error)
			token.value = response.data.token
			user.value = response.data.user
		}

		function logout() {
			token.value = null
			user.value = null
		}

		return { login, signup, logout, hasValidToken, token, user, isLoggedIn }
	},
	{
		persist: {
			storage: localStorage,
			key: 'auth',
		},
	},
)
