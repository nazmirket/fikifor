import { defineStore } from 'pinia'

export const useQuizStore = defineStore('quizes', () => {
	const quizes = ref<any[]>([])
	const myQuizes = ref<any[]>([])

	// Get quizes
	async function getQuizes(payload: any) {
		const { data, error, success } = await useApi('/quizes', {
			method: 'GET',
			body: payload,
		})
		if (!success) throw new Error(error)
		quizes.value = data
	}

	// Get my quizes
	async function getMyQuizes(payload: any) {
		const { data, error, success } = await useApi('/quizes/me', {
			method: 'GET',
			body: payload,
		})
		if (!success) throw new Error(error)
		myQuizes.value = data
	}

	// Create quiz
	async function createQuiz(formdata: any) {
		const res = (await useUploader('/quizes', formdata)) as any
		if (!res.success) throw new Error(res.error)
	}

	// Update quiz
	async function updateQuiz(quizId: number, payload: any) {
		const { error, success } = await useApi(`/quizes/${quizId}`, {
			method: 'PUT',
			body: payload,
		})
		if (!success) throw new Error(error)
	}

	// Update quiz image
	async function updateQuizImage(quizId: number, formdata: any) {
		const res = (await useUploader(`/quizes/${quizId}/image`, formdata, 'PUT')) as any
		if (!res.success) throw new Error(res.error)
	}

	// Bulk update items
	async function bulkUpdateItems(quizId: number, payload: any) {
		const { data, error, success } = await useApi(`/quizes/${quizId}/items/bulk`, {
			method: 'POST',
			body: payload,
		})
		if (!success) throw new Error(error)
	}

	// Update item
	async function updateItemInfo(quizId: number, itemId: number, payload: any) {
		const { data, error, success } = await useApi(`/quizes/items/${itemId}`, {
			method: 'PUT',
			body: payload,
		})
		if (!success) throw new Error(error)

		const quizIndex = myQuizes.value.findIndex((quiz: any) => quiz.id === quizId)

		if (quizIndex === -1) return

		const itemIndex = myQuizes.value[quizIndex]?.items?.findIndex(
			(item: any) => item.id === itemId,
		)

		if (itemIndex === -1) return

		myQuizes.value[quizIndex].items[itemIndex] = data
	}

	// Update item image
	async function updateItemImage(quizId: number, itemId: number, formdata: any) {
		const res = (await useUploader(
			`/quizes/items/${itemId}/image`,
			formdata,
			'PUT',
		)) as any
		if (!res.success) throw new Error(res.error)

		const data = res.data

		const quizIndex = myQuizes.value.findIndex((quiz: any) => quiz.id === quizId)
		if (quizIndex === -1) return

		const itemIndex = myQuizes.value[quizIndex]?.items?.findIndex(
			(item: any) => item.id === itemId,
		)

		if (itemIndex === -1) return

		myQuizes.value[quizIndex].items[itemIndex] = data
	}

	// Update item image link
	async function updateItemImageLink(quizId: number, itemId: number, payload: any) {
		const { data, error, success } = await useApi(`/quizes/items/${itemId}/image/link`, {
			method: 'PUT',
			body: payload,
		})
		if (!success) throw new Error(error)

		const quizIndex = myQuizes.value.findIndex((quiz: any) => quiz.id === quizId)
		if (quizIndex === -1) return

		const itemIndex = myQuizes.value[quizIndex]?.items?.findIndex(
			(item: any) => item.id === itemId,
		)

		if (itemIndex === -1) return

		myQuizes.value[quizIndex].items[itemIndex] = data
	}

	// Create session
	async function createSession(quizId: number) {
		const { data, error, success } = await useApi(`/sessions`, {
			method: 'POST',
			body: { quizId },
		})
		if (!success) throw new Error(error)
		return data
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
