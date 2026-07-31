<template>
	<div class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
		<NuxtLink
			to="/quizes"
			class="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-indigo-300"
		>
			<UIcon name="heroicons:arrow-left" :size="18" />
			Quizlere dön
		</NuxtLink>

		<div v-if="loading" class="mt-6 space-y-6">
			<div
				class="h-[340px] animate-pulse rounded-3xl border border-gray-800 bg-gray-900"
			/>
			<div
				class="h-[420px] animate-pulse rounded-3xl border border-gray-800 bg-gray-900"
			/>
		</div>

		<template v-else-if="quiz && leaderboard">
			<section
				class="mt-6 overflow-hidden rounded-3xl border border-gray-800 bg-gray-900/70"
				aria-labelledby="quiz-title"
			>
				<div class="grid lg:grid-cols-[minmax(0,440px)_1fr]">
					<div class="quiz-hero-media min-w-0 bg-gray-900 lg:min-h-[360px]">
						<Image
							:file="quiz.cover"
							:alt="quiz.title"
							class="h-full w-full rounded-none"
						/>
					</div>
					<div class="flex min-w-0 flex-col p-6 sm:p-8">
						<div class="flex flex-wrap items-center gap-2 text-sm">
							<span
								class="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-semibold text-emerald-300"
							>
								Yayında
							</span>
							<span class="text-gray-600">Yayıncı</span>
							<span class="font-semibold text-gray-300">{{ publisher }}</span>
						</div>

						<h1
							id="quiz-title"
							class="mt-5 text-3xl font-bold tracking-tight text-gray-100 sm:text-4xl"
						>
							{{ quiz.title }}
						</h1>
						<p class="mt-4 max-w-2xl text-sm leading-7 text-gray-500 sm:text-base">
							{{ quiz.description }}
						</p>

						<div class="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-gray-500">
							<span class="flex items-center gap-2">
								<UIcon name="heroicons:squares-2x2" :size="19" />
								{{ quiz.size }} seçenek
							</span>
							<span class="flex items-center gap-2">
								<UIcon name="heroicons:play-circle" :size="19" />
								{{ quiz.sessionCount ?? 0 }} oturum
							</span>
							<span v-if="quiz.createdAt" class="flex items-center gap-2">
								<UIcon name="heroicons:calendar-days" :size="19" />
								{{ formatDate(quiz.createdAt) }}
							</span>
						</div>

						<div class="mt-auto pt-8">
							<UButton
								icon="heroicons:play"
								:loading="starting"
								class="!w-full sm:!w-auto sm:px-8"
								@click="start"
							>
								Oyun odası aç
							</UButton>
							<p v-if="!authStore.isLoggedIn" class="mt-3 text-xs text-gray-600">
								Oda açmak için giriş yapman istenecek.
							</p>
						</div>
					</div>
				</div>
			</section>

			<section
				class="mt-6 rounded-3xl border border-gray-800 bg-gray-900/50 p-5 sm:p-7"
				aria-labelledby="leaderboard-title"
			>
				<div class="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
					<div>
						<p class="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-400">
							Genel sonuçlar
						</p>
						<h2 id="leaderboard-title" class="mt-2 text-2xl font-bold text-gray-100">
							Topluluk sıralaması
						</h2>
						<p class="mt-2 max-w-3xl text-sm leading-6 text-gray-500">
							Her tamamlanan oyunda tüm seçenekler ulaştıkları eleme turuna göre
							sıralanır. Sıra puanı odadaki katılımcı sayısıyla çarpılır; böylece
							kalabalık oyunlar genel sonuca daha fazla ağırlık verir.
						</p>
					</div>

					<div class="grid shrink-0 grid-cols-2 gap-3">
						<div class="rounded-2xl border border-gray-800 bg-gray-950/70 px-4 py-3">
							<p class="text-xs text-gray-600">Tamamlanan oyun</p>
							<p class="mt-1 text-xl font-bold text-gray-200">
								{{ leaderboard.completedSessions }}
							</p>
						</div>
						<div class="rounded-2xl border border-gray-800 bg-gray-950/70 px-4 py-3">
							<p class="text-xs text-gray-600">Katılımcı ağırlığı</p>
							<p class="mt-1 text-xl font-bold text-gray-200">
								{{ leaderboard.participantWeight }}
							</p>
						</div>
					</div>
				</div>

				<div
					v-if="leaderboard.entries.length"
					class="mt-7 overflow-x-auto rounded-2xl border border-gray-800"
				>
					<table class="w-full min-w-[860px] border-collapse text-left">
						<thead class="bg-gray-950/80 text-xs uppercase tracking-wider text-gray-600">
							<tr>
								<th scope="col" class="w-20 px-5 py-4">Sıra</th>
								<th scope="col" class="px-5 py-4">Seçenek</th>
								<th scope="col" class="px-5 py-4 text-right">Oyun zaferi</th>
								<th scope="col" class="px-5 py-4 text-right">Ort. sıra</th>
								<th scope="col" class="px-5 py-4 text-right">Ağırlıklı puan</th>
								<th scope="col" class="w-48 px-5 py-4">Başarı</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-800">
							<tr
								v-for="entry in leaderboard.entries"
								:key="entry.item.id"
								class="bg-gray-900/40 transition hover:bg-gray-800/50"
							>
								<td class="px-5 py-4">
									<span
										class="inline-flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-bold"
										:class="rankClass(entry.rank)"
									>
										{{ entry.rank }}
									</span>
								</td>
								<td class="px-5 py-4">
									<div class="flex min-w-0 items-center gap-3">
										<Image
											v-if="entry.item.image"
											:file="entry.item.image"
											:alt="entry.item.title ?? 'Quiz seçeneği'"
											class="h-12 w-16 shrink-0 rounded-lg"
										/>
										<div
											v-else
											class="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg bg-gray-800"
										>
											<UIcon name="heroicons:photo" class="text-gray-600" :size="22" />
										</div>
										<span class="truncate font-semibold text-gray-200">
											{{ entry.item.title || 'İsimsiz seçenek' }}
										</span>
									</div>
								</td>
								<td class="px-5 py-4 text-right font-medium text-gray-400">
									{{ entry.sessionWins }}
								</td>
								<td class="px-5 py-4 text-right font-medium text-gray-400">
									{{ formatRank(entry.averageRank) }}
								</td>
								<td class="px-5 py-4 text-right font-bold text-indigo-300">
									{{ entry.weightedScore }}
								</td>
								<td class="px-5 py-4">
									<div class="flex items-center gap-3">
										<div class="h-2 flex-1 overflow-hidden rounded-full bg-gray-800">
											<div
												class="h-full rounded-full bg-indigo-500"
												:style="{ width: `${entry.scorePercentage}%` }"
											/>
										</div>
										<span class="w-12 text-right text-xs font-semibold text-gray-400">
											%{{ entry.scorePercentage }}
										</span>
									</div>
								</td>
							</tr>
						</tbody>
					</table>
				</div>

				<div
					v-else
					class="mt-7 flex flex-col items-center rounded-2xl border border-dashed border-gray-800 px-6 py-14 text-center"
				>
					<UIcon name="heroicons:trophy" class="text-gray-700" :size="36" />
					<h3 class="mt-4 font-semibold text-gray-300">Henüz tamamlanan oyun yok</h3>
					<p class="mt-2 max-w-md text-sm leading-6 text-gray-600">
						İlk oyun tamamlandığında tüm seçeneklerin katılımcı ağırlıklı sıralaması
						burada görünecek.
					</p>
				</div>
			</section>
		</template>
	</div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/store/auth'
import { useQuizStore } from '~/store/quizes'
import { unlockGameAudio } from '~/utils/gameAudio'

const route = useRoute()
const authStore = useAuthStore()
const quizStore = useQuizStore()
const loading = ref(true)
const starting = ref(false)

const quizId = Number(route.params.id)
if (!Number.isInteger(quizId) || quizId < 1) {
	throw createError({ statusCode: 404, statusMessage: 'Quiz bulunamadı' })
}

const quiz = computed(() => quizStore.selectedQuiz)
const leaderboard = computed(() => quizStore.leaderboard)
const publisher = computed(() => {
	const owner = quiz.value?.owner
	if (!owner) return ''
	return owner.displayName || `@${owner.username}`
})

function formatDate(value: string) {
	return new Intl.DateTimeFormat('tr-TR', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	}).format(new Date(value))
}

function rankClass(rank: number) {
	if (rank === 1) return 'border-amber-400/40 bg-amber-400/10 text-amber-300'
	if (rank === 2) return 'border-slate-400/40 bg-slate-400/10 text-slate-300'
	if (rank === 3) return 'border-orange-500/40 bg-orange-500/10 text-orange-300'
	return 'border-gray-700 bg-gray-900 text-gray-500'
}

function formatRank(rank: number) {
	return new Intl.NumberFormat('tr-TR', {
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	}).format(rank)
}

async function load() {
	loading.value = true
	try {
		await Promise.all([quizStore.getQuiz(quizId), quizStore.getLeaderboard(quizId)])
	} catch (error) {
		throw createError({
			statusCode: 404,
			statusMessage: error instanceof Error ? error.message : 'Quiz bulunamadı',
		})
	} finally {
		loading.value = false
	}
}

async function start() {
	void unlockGameAudio()
	if (!authStore.isLoggedIn) {
		await navigateTo({ path: '/login', query: { redirect: route.fullPath } })
		return
	}

	starting.value = true
	try {
		const code = await quizStore.createSession(quizId)
		await navigateTo(`/sessions/${code}`)
	} catch (error) {
		useToast().add({
			title: 'Oturum başlatılamadı',
			description: error instanceof Error ? error.message : 'Beklenmeyen bir hata oluştu',
		})
	} finally {
		starting.value = false
	}
}

useSeoMeta({
	title: () =>
		quiz.value ? `${quiz.value.title} · Fikifor` : 'Quiz detayları · Fikifor',
	description: () => quiz.value?.description ?? 'Quiz sonuçları ve topluluk sıralaması.',
})
definePageMeta({ layout: 'panel' })
onMounted(load)
</script>

<style scoped>
.quiz-hero-media {
	aspect-ratio: 5 / 3;
}

@media (min-width: 1024px) {
	.quiz-hero-media {
		aspect-ratio: auto;
	}
}
</style>
