interface UseAsyncOpts {
	setLoader: (b: boolean) => void
}

export default function (fn: () => Promise<void>, opts?: UseAsyncOpts) {
	const { setLoader = (v: boolean) => v } = opts || {}

	setLoader(true)

	fn()
		.then(() => setLoader(false))
		.catch(err => {
			setLoader(false)
			useToast().add({
				title: 'Error',
				description: err.message,
			})
		})
}
