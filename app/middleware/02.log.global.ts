import { useAuthStore } from '~/store/auth'

export default defineNuxtRouteMiddleware(to => {
	// List of routes that do not require authentication
	const ignore = ['/login', '/signup']

	// Check if the route is in the ignore list
	const isProtected = !ignore.includes(to.path)

	// Check if token expired
	const isLoggedIn = useAuthStore().isLoggedIn

	// If page is protected and user is not logged in, redirect to login page
	if (isProtected && !isLoggedIn) {
		const code = to.params.code
		return navigateTo(`/login?code=${code}`)
	}

	// If page is not protected and user is logged in, redirect to home page
	if (!isProtected && isLoggedIn) return navigateTo('/')
})
