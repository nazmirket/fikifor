import { useAuthStore } from '~/store/auth'

export default defineNuxtRouteMiddleware(to => {
	const publicRoutes = new Set(['/', '/quizes', '/login', '/signup'])
	const isProtected = !publicRoutes.has(to.path)

	// Check if token expired
	const authStore = useAuthStore()
	const isLoggedIn = authStore.hasValidToken()
	if (!isLoggedIn && authStore.token) authStore.logout()

	// If page is protected and user is not logged in, redirect to login page
	if (isProtected && !isLoggedIn) {
		const code = to.params.code
		if (typeof code === 'string') return navigateTo(`/login?code=${code}`)
		return navigateTo({
			path: '/login',
			query: { redirect: to.fullPath },
		})
	}

	// If page is not protected and user is logged in, redirect to home page
	if (['/login', '/signup'].includes(to.path) && isLoggedIn) return navigateTo('/')
})
