import { useAuthStore } from '@/store/auth'

export default defineNuxtRouteMiddleware(() => {
	if (useAuthStore().isLoggedIn) useSocket()
})
