import type { ApiResponse } from '@fikifor/contracts'

import { useAuthStore } from '~/store/auth'

export function useUploader<T>(
	url: string,
	body: FormData,
	method = 'POST',
): Promise<ApiResponse<T>> {
	const xhr = new XMLHttpRequest()
	xhr.open(method, `${useRuntimeConfig().public.API_URL}${url}`, true)
	const token = useAuthStore().token
	if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

	return new Promise((resolve, reject) => {
		xhr.onload = () => {
			try {
				resolve(JSON.parse(xhr.responseText) as ApiResponse<T>)
			} catch {
				reject(new Error('The upload server returned an invalid response'))
			}
		}
		xhr.onerror = () => reject(new Error('The upload request failed'))
		xhr.send(body)
	})
}
