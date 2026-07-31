<template>
	<section aria-labelledby="public-quizzes-title">
		<div class="flex flex-col gap-2">
			<p class="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-400">
				Topluluk listeleri
			</p>
			<div class="flex flex-col justify-between gap-4 md:flex-row md:items-end">
				<div>
					<h1
						id="public-quizzes-title"
						class="text-3xl font-bold text-gray-100 sm:text-4xl"
					>
						Quizleri keşfet
					</h1>
					<p class="mt-2 max-w-2xl text-gray-500">
						Bir liste seç, oyun odanı aç ve arkadaşlarını davet et.
					</p>
				</div>
				<p
					v-if="loading"
					class="w-fit rounded-full border border-gray-800 bg-gray-900/70 px-3 py-1.5 text-sm text-gray-500"
				>
					Listeler yükleniyor...
				</p>
				<p
					v-else
					class="w-fit rounded-full border border-gray-800 bg-gray-900/70 px-3 py-1.5 text-sm text-gray-500"
				>
					<span class="font-semibold text-gray-300">{{ total }}</span> yayınlanmış liste
				</p>
			</div>
		</div>

		<div
			class="mt-8 grid gap-3 rounded-2xl border border-gray-800 bg-gray-900/50 p-4 shadow-sm shadow-black/20 sm:grid-cols-[minmax(0,1fr)_minmax(190px,220px)_48px]"
		>
			<UInput
				v-model="search"
				size="xl"
				icon="heroicons:magnifying-glass"
				placeholder="Başlık, açıklama veya kullanıcı ara..."
				aria-label="Quiz ara"
				class="w-full"
			/>
			<USelect
				v-model="sortBy"
				size="xl"
				:options="sortOptions"
				option-attribute="label"
				aria-label="Quizleri sırala"
				select-class="h-12"
				class="w-full"
			/>
			<UButton
				variant="outline"
				:icon="
					sortOrder === 'desc' ? 'heroicons:bars-arrow-down' : 'heroicons:bars-arrow-up'
				"
				:title="sortOrder === 'desc' ? 'Azalan sıralama' : 'Artan sıralama'"
				:aria-label="sortOrder === 'desc' ? 'Azalan sıralama' : 'Artan sıralama'"
				class="!h-12 !w-full sm:!w-12"
				@click="sortOrder = sortOrder === 'desc' ? 'asc' : 'desc'"
			>
				<span class="sm:hidden">
					{{ sortOrder === 'desc' ? 'Azalan' : 'Artan' }}
				</span>
			</UButton>
		</div>

		<div v-if="loading" class="grid gap-5 py-8 md:grid-cols-2 xl:grid-cols-3">
			<div
				v-for="index in 6"
				:key="index"
				class="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900"
			>
				<div class="aspect-[5/3] animate-pulse bg-gray-800/70" />
				<div class="space-y-4 p-5">
					<div class="h-3 w-2/5 animate-pulse rounded-full bg-gray-800" />
					<div class="h-6 w-4/5 animate-pulse rounded-full bg-gray-800" />
					<div class="h-4 w-full animate-pulse rounded-full bg-gray-800" />
					<div class="h-4 w-3/4 animate-pulse rounded-full bg-gray-800" />
				</div>
			</div>
		</div>

		<div v-else-if="quizes.length" class="grid gap-5 py-8 md:grid-cols-2 xl:grid-cols-3">
			<article
				v-for="quiz in quizes"
				:key="quiz.id"
				class="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/70 transition duration-200 hover:-translate-y-1 hover:border-indigo-500/60 hover:shadow-xl hover:shadow-indigo-950/20"
			>
				<div class="relative aspect-[5/3] overflow-hidden bg-gray-900">
					<Image
						:file="quiz.cover"
						:alt="quiz.title"
						is-public
						:width="640"
						class="h-full w-full rounded-none transition duration-300 group-hover:scale-[1.02]"
					/>
					<span
						class="absolute right-3 top-3 rounded-full border border-white/10 bg-gray-950/80 px-3 py-1 text-xs font-semibold text-gray-200 backdrop-blur"
					>
						{{ quiz.size }} seçenek
					</span>
				</div>

				<div class="flex flex-1 flex-col p-5">
					<div class="flex items-center justify-between gap-3 text-xs text-gray-500">
						<span class="min-w-0 truncate">{{ publisherName(quiz.owner) }}</span>
						<span class="shrink-0">{{ formatDate(quiz.createdAt) }}</span>
					</div>
					<h2 class="mt-3 line-clamp-2 text-xl font-semibold text-gray-100">
						{{ quiz.title }}
					</h2>
					<p class="mt-2 line-clamp-3 text-sm leading-6 text-gray-500">
						{{ quiz.description }}
					</p>

					<div class="mt-auto pt-6">
						<div class="flex shrink-0 items-center gap-1.5 text-sm text-gray-500">
							<UIcon name="heroicons:play-circle" :size="20" />
							<span>{{ quiz.sessionCount }} oturum</span>
						</div>
						<div class="mt-4 grid grid-cols-2 gap-2">
							<UButton
								:to="`/quizes/${quiz.id}`"
								variant="outline"
								icon="heroicons:chart-bar"
							>
								Detaylar
							</UButton>
							<UButton
								:loading="startingId === quiz.id"
								icon="heroicons:play"
								@click="start(quiz.id)"
							>
								Oyna
							</UButton>
						</div>
					</div>
				</div>
			</article>
		</div>

		<div
			v-else
			class="my-8 flex flex-col items-center rounded-2xl border border-dashed border-gray-800 bg-gray-900/20 px-6 py-16 text-center sm:py-20"
		>
			<div
				class="flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-800 bg-gray-900 text-gray-500"
			>
				<UIcon
					:name="hasSearch ? 'heroicons:magnifying-glass' : 'heroicons:rectangle-stack'"
					:size="28"
				/>
			</div>
			<h2 class="mt-5 text-lg font-semibold text-gray-300">
				{{ hasSearch ? 'Eşleşen quiz bulunamadı' : 'Henüz yayınlanmış quiz yok' }}
			</h2>
			<p class="mt-2 max-w-md text-sm leading-6 text-gray-600">
				{{
					hasSearch
						? 'Arama sözcüğünü değiştirerek yeniden deneyebilirsin.'
						: 'Yayınlanan topluluk listeleri burada görünecek.'
				}}
			</p>
			<UButton
				v-if="hasSearch"
				variant="outline"
				class="mt-5 !w-auto"
				@click="search = ''"
			>
				Aramayı temizle
			</UButton>
		</div>

		<div
			v-if="totalPages > 1"
			class="flex flex-wrap items-center justify-center gap-3 pb-6"
		>
			<UButton
				variant="outline"
				icon="heroicons:chevron-left"
				class="!w-auto"
				:disabled="page === 1"
				@click="page--"
			>
				Önceki
			</UButton>
			<span class="min-w-[100px] text-center text-sm text-gray-500">
				{{ page }} / {{ totalPages }}
			</span>
			<UButton
				variant="outline"
				trailing
				icon="heroicons:chevron-right"
				class="!w-auto"
				:disabled="page === totalPages"
				@click="page++"
			>
				Sonraki
			</UButton>
		</div>
	</section>
</template>

<script setup lang="ts">
import type { PublisherSummary, QuizSortBy, SortOrder } from '@fikifor/contracts'
import { useAuthStore } from '~/store/auth'
import { useQuizStore } from '~/store/quizes'

const authStore = useAuthStore()
const quizStore = useQuizStore()

const search = ref('')
const sortBy = ref<QuizSortBy>('sessions')
const sortOrder = ref<SortOrder>('desc')
const page = ref(1)
const pageSize = 12
const loading = ref(true)
const startingId = ref<number>()
let searchTimer: ReturnType<typeof setTimeout> | undefined
let requestSequence = 0

const sortOptions: Array<{ label: string; value: QuizSortBy }> = [
	{ label: 'En çok oynanan', value: 'sessions' },
	{ label: 'Oluşturulma tarihi', value: 'createdAt' },
	{ label: 'Güncellenme tarihi', value: 'updatedAt' },
	{ label: 'Başlık', value: 'title' },
	{ label: 'Arama ilgisi', value: 'relevance' },
]

const quizes = computed(() => quizStore.quizes)
const total = computed(() => quizStore.publicTotal)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))
const hasSearch = computed(() => search.value.trim().length > 0)

function formatDate(value: string) {
	return new Intl.DateTimeFormat('tr-TR', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	}).format(new Date(value))
}

function publisherName(owner: PublisherSummary) {
	return owner.displayName || `@${owner.username}`
}

async function load() {
	const sequence = ++requestSequence
	loading.value = true
	try {
		await quizStore.getQuizes({
			q: search.value,
			sortBy: sortBy.value,
			sortOrder: sortOrder.value,
			page: page.value,
			pageSize,
		})
	} catch (error) {
		useToast().add({
			title: 'Quizler yüklenemedi',
			description: error instanceof Error ? error.message : 'Beklenmeyen bir hata oluştu',
		})
	} finally {
		if (sequence === requestSequence) loading.value = false
	}
}

async function start(quizId: number) {
	if (!authStore.isLoggedIn) {
		await navigateTo({ path: '/login', query: { redirect: '/quizes' } })
		return
	}

	startingId.value = quizId
	try {
		const code = await quizStore.createSession(quizId)
		await navigateTo(`/sessions/${code}`)
	} catch (error) {
		useToast().add({
			title: 'Oturum başlatılamadı',
			description: error instanceof Error ? error.message : 'Beklenmeyen bir hata oluştu',
		})
	} finally {
		startingId.value = undefined
	}
}

watch(search, () => {
	page.value = 1
	if (searchTimer) clearTimeout(searchTimer)
	searchTimer = setTimeout(load, 300)
})
watch([sortBy, sortOrder], () => {
	page.value = 1
	load()
})
watch(page, load)

onMounted(load)
onBeforeUnmount(() => {
	if (searchTimer) clearTimeout(searchTimer)
})
</script>
