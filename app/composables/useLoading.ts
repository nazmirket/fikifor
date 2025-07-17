const useLoading = reactive({
	hits: [] as boolean[],
	lock: function () {
		useLoading.hits.push(true)
	},
	unlock: function () {
		useLoading.hits.pop()
	},
	set: function (v: boolean) {
		if (v) useLoading.lock()
		else useLoading.unlock()
	},
	isLoading: function () {
		return useLoading.hits.length > 0
	},
})

export default useLoading
