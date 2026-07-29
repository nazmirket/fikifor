import type { ApiResponse } from '@fikifor/contracts'
import type { FetchOptions } from 'ofetch'
import { ofetch } from 'ofetch'

function responseFromError<T>(error: unknown) {
	if (typeof error !== 'object' || error === null || !('data' in error)) return undefined
	return (error as { data?: ApiResponse<T> }).data
}

export default async function <T>(
	endpoint: string,
	opts: FetchOptions<'json'> = {},
): Promise<ApiResponse<T>> {
	const headers = new Headers(opts.headers)
	headers.set('Accept', 'application/json')
	headers.set('Cache-Control', 'no-cache')

	try {
		return await ofetch<ApiResponse<T>>(endpoint, {
			...opts,
			baseURL: useRuntimeConfig().public.API_URL,
			headers,
		})
	} catch (error) {
		return (
			responseFromError<T>(error) ?? {
				success: false,
				error: { code: 'NETWORK_ERROR', message: 'The API request failed' },
			}
		)
	}
}
