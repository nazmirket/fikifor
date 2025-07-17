import type { UseFetchOptions } from 'nuxt/app'

interface ResBody {
	success: boolean
	data?: any
	error?: any
	total?: number
}

export default async function <T>(endpoint: string, opts: UseFetchOptions<T> = {}) {
	const res = await useFetch<T>(endpoint, {
		watch: false,
		...(opts as any),
		baseURL: useRuntimeConfig().public.API_URL,
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
			'Cache-Control': 'no-cache',
			...opts.headers,
		},
	})
	return resolve(res)
}

function resolve(res: any): ResBody {
	const body = res.data?.value || res.error?.value?.data
	return {
		data: body?.data,
		success: body?.success,
		error: body?.error,
		total: body?.total,
	}
}
