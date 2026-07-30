import type {
	ImageAsset,
	PublicQuizQuery,
	Quiz,
	QuizItem,
	QuizLeaderboard,
	QuizSummary,
	UpdateQuizInput,
	UpdateQuizItemInput,
} from '@fikifor/contracts'
import { defineStore } from 'pinia'

export const useQuizStore = defineStore('quizes', () => {
	const quizes = ref<QuizSummary[]>([])
	const publicTotal = ref(0)
	const selectedQuiz = ref<Quiz>()
	const leaderboard = ref<QuizLeaderboard>()
	const myQuizes = ref<Quiz[]>([])
	let publicRequestSequence = 0

	async function getQuizes(query: PublicQuizQuery) {
		const sequence = ++publicRequestSequence
		const params = new URLSearchParams({
			q: query.q,
			sortBy: query.sortBy,
			sortOrder: query.sortOrder,
			page: String(query.page),
			pageSize: String(query.pageSize),
		})
		const response = await useApi<QuizSummary[]>(`/quizes?${params.toString()}`, {
			method: 'GET',
		})
		if (sequence !== publicRequestSequence) return
		if (!response.success) throw apiError(response.error)
		quizes.value = response.data
		publicTotal.value = response.total ?? response.data.length
	}

	async function getMyQuizes() {
		const response = await useApi<Quiz[]>('/quizes/me', { method: 'GET' })
		if (!response.success) throw apiError(response.error)
		myQuizes.value = response.data
	}

	async function getQuiz(quizId: number) {
		const response = await useApi<Quiz>(`/quizes/${quizId}`, { method: 'GET' })
		if (!response.success) throw apiError(response.error)
		selectedQuiz.value = response.data
		return response.data
	}

	async function getLeaderboard(quizId: number) {
		const response = await useApi<QuizLeaderboard>(`/quizes/${quizId}/leaderboard`, {
			method: 'GET',
		})
		if (!response.success) throw apiError(response.error)
		leaderboard.value = response.data
		return response.data
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

	async function publishQuiz(quizId: number) {
		const response = await useApi<{ id: number; published: boolean }>(
			`/quizes/${quizId}/publish`,
			{ method: 'PUT' },
		)
		if (!response.success) throw apiError(response.error)
		return response.data
	}

	async function unpublishQuiz(quizId: number) {
		const response = await useApi<{ id: number; published: boolean }>(
			`/quizes/${quizId}/publish`,
			{ method: 'DELETE' },
		)
		if (!response.success) throw apiError(response.error)
		return response.data
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
		getQuiz,
		getLeaderboard,
		createQuiz,
		updateQuiz,
		publishQuiz,
		unpublishQuiz,
		updateQuizImage,
		bulkUpdateItems,
		updateItemInfo,
		updateItemImage,
		updateItemImageLink,
		createSession,
		quizes,
		publicTotal,
		selectedQuiz,
		leaderboard,
		myQuizes,
	}
})
