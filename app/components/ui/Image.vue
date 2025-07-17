<template>
	<img v-if="objectUrl" :src="objectUrl" class="rounded-lg object-cover" />
	<div
		v-else
		class="flex h-full w-full items-center justify-center rounded-lg bg-gray-200"
	>
		<UIcon v-if="!failed" name="svg-spinners:ring-resize" :size="36" />
		<UIcon v-else name="heroicons-solid:exclamation" :size="36" />
	</div>
</template>

<script setup>
import { useAuthStore } from '~/store/auth'

const props = defineProps({
	file: {
		type: Object,
		required: true,
	},
})

const failed = ref(false)
const objectUrl = ref()

function load() {
	useAsync(
		async () => {
			const url = [useRuntimeConfig().public.API_URL, 'files', props.file.name].join('/')
			const res = await fetch(url, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${useAuthStore().token}`,
				},
			})
			if (!res.ok) return (failed.value = true)
			const blob = await res.blob()
			objectUrl.value = URL.createObjectURL(blob)
		},
		{ setLoader: useLoading.set },
	)
}

onMounted(() => load())
</script>
