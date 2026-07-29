import type { ApiResponse } from '@fikifor/contracts'
import type { FetchOptions } from 'ofetch'
import { ofetch } from 'ofetch'

import { useAuthStore } from '~/store/auth'

function responseFromError<T>(error: unknown) {
	if (typeof error !== 'object' || error === null || !('data' in error)) return undefined
	return (error as { data?: ApiResponse<T> }).data
}

export default async function <T>(
	endpoint: string,
	opts: FetchOptions<'json'> = {},
): Promise<ApiResponse<T>> {
	const authStore = useAuthStore()
	const headers = new Headers(opts.headers)
	headers.set('Accept', 'application/json')
	headers.set('Cache-Control', 'no-cache')
	if (authStore.token) headers.set('Authorization', `Bearer ${authStore.token}`)

	let body: ApiResponse<T>
	try {
		body = await ofetch<ApiResponse<T>>(endpoint, {
			...opts,
			baseURL: useRuntimeConfig().public.API_URL,
			headers,
		})
	} catch (error) {
		body = responseFromError<T>(error) ?? {
			success: false,
			error: { code: 'NETWORK_ERROR', message: 'The API request failed' },
		}
	}

	if (!body.success && body.error.code === 'UNAUTHORIZED') authStore.logout()
	return body
}
