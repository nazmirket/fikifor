<template>
	<img
		v-if="objectUrl"
		ref="element"
		:src="objectUrl"
		:srcset="responsiveSrcset"
		:sizes="responsiveSrcset ? '(max-width: 640px) 100vw, 50vw' : undefined"
		:alt="alt"
		:loading="eager ? 'eager' : 'lazy'"
		:fetchpriority="eager ? 'high' : 'auto'"
		decoding="async"
		class="rounded-lg object-cover"
		@error="handleImageError"
	/>
	<div
		v-else
		ref="element"
		class="flex h-full w-full items-center justify-center rounded-lg border border-[#fff4df]/10 bg-[#271c35] px-4 py-6 text-center"
		role="img"
		:aria-label="failed ? alt || 'Görsel yüklenemedi' : 'Görsel yükleniyor'"
	>
		<div class="flex flex-col items-center gap-2">
			<span
				class="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff795e]/15 text-[#ff927d]"
			>
				<UIcon v-if="!failed" name="svg-spinners:ring-resize" :size="22" />
				<UIcon v-else name="heroicons:photo" :size="22" />
			</span>
			<span v-if="failed" class="text-xs font-semibold text-[#ffb19f]">
				Görsel yüklenemedi
			</span>
		</div>
	</div>
</template>

<script setup lang="ts">
import type { ImageAsset } from '@fikifor/contracts'
import { useAuthStore } from '~/store/auth'

const props = withDefaults(
	defineProps<{
		file: ImageAsset
		alt?: string
		isPublic?: boolean
		eager?: boolean
		width?: 320 | 640 | 1280
	}>(),
	{ alt: '', isPublic: false, eager: false, width: 1280 },
)

const failed = ref(false)
const objectUrl = ref<string>()
const responsiveSrcset = computed(() =>
	props.isPublic
		? ([320, 640, 1280] as const).map(width => `${fileUrl(width)} ${width}w`).join(', ')
		: undefined,
)
const element = ref<HTMLElement>()
let observer: IntersectionObserver | undefined
let controller: AbortController | undefined
let requestSequence = 0

function fileUrl(width = props.width) {
	const url = [useRuntimeConfig().public.API_URL, 'files', props.file.name].join('/')
	return `${url}?width=${width}`
}

function clearObjectUrl() {
	if (objectUrl.value?.startsWith('blob:')) URL.revokeObjectURL(objectUrl.value)
	objectUrl.value = undefined
}

function handleImageError() {
	clearObjectUrl()
	failed.value = true
}

function stopPending() {
	observer?.disconnect()
	observer = undefined
	controller?.abort()
	controller = undefined
}

async function loadPrivate() {
	const sequence = ++requestSequence
	controller?.abort()
	controller = new AbortController()
	clearObjectUrl()
	failed.value = false
	const headers = new Headers()
	const token = useAuthStore().token
	if (token) headers.set('Authorization', `Bearer ${token}`)

	try {
		const response = await fetch(fileUrl(), {
			method: 'GET',
			headers,
			signal: controller.signal,
			cache: 'force-cache',
		})
		if (!response.ok) throw new Error(`Image request failed with ${response.status}`)
		const blob = await response.blob()
		if (sequence !== requestSequence) return
		objectUrl.value = URL.createObjectURL(blob)
	} catch (error) {
		if ((error as DOMException).name !== 'AbortError' && sequence === requestSequence) {
			failed.value = true
		}
	}
}

function load() {
	stopPending()
	clearObjectUrl()
	failed.value = false
	if (props.isPublic) {
		objectUrl.value = fileUrl()
		return
	}
	if (props.eager || !('IntersectionObserver' in window)) {
		void loadPrivate()
		return
	}
	observer = new IntersectionObserver(
		entries => {
			if (!entries.some(entry => entry.isIntersecting)) return
			observer?.disconnect()
			observer = undefined
			void loadPrivate()
		},
		{ rootMargin: '200px' },
	)
	if (element.value) observer.observe(element.value)
}

onMounted(load)
watch(() => [props.file.name, props.isPublic, props.eager, props.width], load)
onBeforeUnmount(() => {
	requestSequence += 1
	stopPending()
	clearObjectUrl()
})
</script>
