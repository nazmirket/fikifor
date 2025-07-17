import { useAuthStore } from '~/store/auth'

export function useUploader(url: string, body: FormData, method = 'POST') {
	const xhr = new XMLHttpRequest()
	xhr.open(method, `${useRuntimeConfig().public.API_URL}${url}`, true)
	xhr.setRequestHeader('Authorization', `Bearer ${useAuthStore().token}`)

	return new Promise((resolve, reject) => {
		xhr.onload = () => {
			if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.response))
			else reject(xhr.statusText)
		}
		xhr.onerror = () => reject(xhr.statusText)
		xhr.send(body)
	})
}
