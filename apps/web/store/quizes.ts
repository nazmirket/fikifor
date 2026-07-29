import type {
	ImageAsset,
	Quiz,
	QuizItem,
	UpdateQuizInput,
	UpdateQuizItemInput,
} from '@fikifor/contracts'
import { defineStore } from 'pinia'

export const useQuizStore = defineStore('quizes', () => {
	const quizes = ref<Quiz[]>([])
	const myQuizes = ref<Quiz[]>([])

	async function getQuizes() {
		const response = await useApi<Quiz[]>('/quizes', { method: 'GET' })
		if (!response.success) throw apiError(response.error)
		quizes.value = response.data
	}

	async function getMyQuizes() {
		const response = await useApi<Quiz[]>('/quizes/me', { method: 'GET' })
		if (!response.success) throw apiError(response.error)
		myQuizes.value = response.data
	}

	async function createQuiz(formdata: FormData) {
		const response = await useUploader<Quiz>('/quizes', formdata)
		if (!response.success) throw apiError(response.error)
		return response.data
	}

	async function updateQuiz(quizId: number, payload: UpdateQuizInput) {
		const response = await useApi<Quiz>(`/quizes/${quizId}`, {
			method: 'PUT',
			body: payload,
		})
		if (!response.success) throw apiError(response.error)
	}

	async function updateQuizImage(quizId: number, formdata: FormData) {
		const response = await useUploader<{ cover: ImageAsset }>(
			`/quizes/${quizId}/image`,
			formdata,
			'PUT',
		)
		if (!response.success) throw apiError(response.error)
		return response.data
	}

	async function bulkUpdateItems(quizId: number, payload: string[]) {
		const response = await useApi<undefined>(`/quizes/${quizId}/items/bulk`, {
			method: 'POST',
			body: payload,
		})
		if (!response.success) throw apiError(response.error)
	}

	function replaceItem(quizId: number, item: QuizItem) {
		const quiz = myQuizes.value.find((entry: Quiz) => entry.id === quizId)
		const itemIndex =
			quiz?.items.findIndex((entry: QuizItem) => entry.id === item.id) ?? -1
		if (quiz && itemIndex >= 0) quiz.items[itemIndex] = item
	}

	async function updateItemInfo(
		quizId: number,
		itemId: number,
		payload: UpdateQuizItemInput,
	) {
		const response = await useApi<QuizItem>(`/quizes/items/${itemId}`, {
			method: 'PUT',
			body: payload,
		})
		if (!response.success) throw apiError(response.error)
		replaceItem(quizId, response.data)
	}

	async function updateItemImage(quizId: number, itemId: number, formdata: FormData) {
		const response = await useUploader<QuizItem>(
			`/quizes/items/${itemId}/image`,
			formdata,
			'PUT',
		)
		if (!response.success) throw apiError(response.error)
		replaceItem(quizId, response.data)
	}

	async function updateItemImageLink(quizId: number, itemId: number, link: string) {
		const response = await useApi<QuizItem>(`/quizes/items/${itemId}/image/link`, {
			method: 'PUT',
			body: { link },
		})
		if (!response.success) throw apiError(response.error)
		replaceItem(quizId, response.data)
	}

	async function createSession(quizId: number) {
		const response = await useApi<string>('/sessions', {
			method: 'POST',
			body: { quizId },
		})
		if (!response.success) throw apiError(response.error)
		return response.data
	}

	return {
		getQuizes,
		getMyQuizes,
		createQuiz,
		updateQuiz,
		updateQuizImage,
		bulkUpdateItems,
		updateItemInfo,
		updateItemImage,
		updateItemImageLink,
		createSession,
		quizes,
		myQuizes,
	}
})
