<template>
	<img
		v-if="objectUrl"
		:src="objectUrl"
		:alt="alt"
		loading="lazy"
		class="rounded-lg object-cover"
	/>
	<div
		v-else
		class="flex h-full w-full items-center justify-center rounded-lg bg-gray-200"
	>
		<UIcon v-if="!failed" name="svg-spinners:ring-resize" :size="36" />
		<UIcon v-else name="heroicons-solid:exclamation" :size="36" />
	</div>
</template>

<script setup lang="ts">
import type { ImageAsset } from '@fikifor/contracts'
import { useAuthStore } from '~/store/auth'

const props = defineProps<{
	file: ImageAsset
	alt?: string
}>()

const failed = ref(false)
const objectUrl = ref<string>()

function clearObjectUrl() {
	if (!objectUrl.value) return
	URL.revokeObjectURL(objectUrl.value)
	objectUrl.value = undefined
}

function load() {
	useAsync(
		async () => {
			clearObjectUrl()
			failed.value = false
			const url = [useRuntimeConfig().public.API_URL, 'files', props.file.name].join('/')
			const headers = new Headers()
			const token = useAuthStore().token
			if (token) headers.set('Authorization', `Bearer ${token}`)
			const res = await fetch(url, {
				method: 'GET',
				headers,
			})
			if (!res.ok) {
				failed.value = true
				return
			}
			const blob = await res.blob()
			objectUrl.value = URL.createObjectURL(blob)
		},
		{ setLoader: useLoading.set },
	)
}

onMounted(() => load())
watch(() => props.file.name, load)
onBeforeUnmount(clearObjectUrl)
</script>
