<template>
	<div class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
		<NuxtLink
			to="/quizes"
			class="inline-flex items-center gap-2 text-sm font-semibold text-[#c8b7ff] transition hover:text-[#fff4df]"
		>
			<UIcon name="heroicons:arrow-left" :size="18" />
			Quizlere dön
		</NuxtLink>

		<div v-if="loading" class="mt-6 space-y-6">
			<div
				class="h-[340px] animate-pulse rounded-[2rem] border border-[#fff4df]/10 bg-[#1f182a]"
			/>
			<div
				class="h-[420px] animate-pulse rounded-[2rem] border border-[#fff4df]/10 bg-[#1f182a]"
			/>
		</div>

		<template v-else-if="quiz && leaderboard">
			<section
				class="fk-surface mt-6 overflow-hidden rounded-[2rem]"
				aria-labelledby="quiz-title"
			>
				<div class="grid lg:grid-cols-[minmax(0,440px)_1fr]">
					<div class="quiz-hero-media min-w-0 bg-[#271c35] lg:min-h-[360px]">
						<Image
							:file="quiz.cover"
							:alt="quiz.title"
							:is-public="quiz.published"
							:width="1280"
							class="h-full w-full rounded-none"
						/>
					</div>
					<div class="flex min-w-0 flex-col p-6 sm:p-8">
						<div class="flex flex-wrap items-center gap-2 text-sm">
							<span
								class="rounded-full border border-[#9fe0c1]/30 bg-[#9fe0c1]/10 px-3 py-1 font-semibold text-[#9fe0c1]"
							>
								Yayında
							</span>
							<span class="text-[#a69baa]">Yayıncı</span>
							<span class="font-semibold text-[#fff4df]">{{ publisher }}</span>
						</div>

						<h1 id="quiz-title" class="fk-display mt-5 text-3xl sm:text-4xl">
							{{ quiz.title }}
						</h1>
						<p class="mt-4 max-w-2xl text-sm leading-7 text-[#c3b8c7] sm:text-base">
							{{ quiz.description }}
						</p>

						<div class="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-[#a69baa]">
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
							<button
								type="button"
								:disabled="starting"
								class="fk-button-primary inline-flex min-h-11 w-full items-center justify-center rounded-xl px-5 py-3 font-semibold disabled:cursor-wait disabled:opacity-60 sm:w-auto sm:px-8"
								@click="start"
							>
								Oyun odası aç
							</button>
							<p v-if="!authStore.isLoggedIn" class="mt-3 text-xs text-[#a69baa]">
								Oda açmak için giriş yapman istenecek.
							</p>
						</div>
					</div>
				</div>
			</section>

			<section
				class="fk-surface mt-6 rounded-[2rem] p-5 sm:p-7"
				aria-labelledby="leaderboard-title"
			>
				<div class="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
					<div>
						<p class="fk-eyebrow"> Genel sonuçlar </p>
						<h2 id="leaderboard-title" class="fk-display mt-2 text-2xl">
							Topluluk sıralaması
						</h2>
						<p class="mt-2 max-w-3xl text-sm leading-6 text-[#c3b8c7]">
							Her tamamlanan oyunda tüm seçenekler ulaştıkları eleme turuna göre
							sıralanır. Sıra puanı odadaki katılımcı sayısıyla çarpılır; böylece
							kalabalık oyunlar genel sonuca daha fazla ağırlık verir.
						</p>
					</div>

					<div class="grid shrink-0 grid-cols-2 gap-3">
						<div class="rounded-2xl border border-[#fff4df]/10 bg-[#120f1a]/60 px-4 py-3">
							<p class="text-xs text-[#a69baa]">Tamamlanan oyun</p>
							<p class="mt-1 text-xl font-bold text-[#fff4df]">
								{{ leaderboard.completedSessions }}
							</p>
						</div>
						<div class="rounded-2xl border border-[#fff4df]/10 bg-[#120f1a]/60 px-4 py-3">
							<p class="text-xs text-[#a69baa]">Katılımcı ağırlığı</p>
							<p class="mt-1 text-xl font-bold text-[#fff4df]">
								{{ leaderboard.participantWeight }}
							</p>
						</div>
					</div>
				</div>

				<div v-if="leaderboard.entries.length" class="mt-7 md:hidden">
					<div class="mb-3 flex items-center gap-2 text-xs font-semibold text-[#a69baa]">
						<UIcon name="heroicons:arrow-down" :size="16" class="text-[#ff795e]" />
						<span>Puanları görmek için aşağı kaydır</span>
					</div>
					<div class="space-y-3">
						<article
							v-for="entry in leaderboard.entries"
							:key="`mobile-${entry.item.id}`"
							class="rounded-2xl border border-[#fff4df]/10 bg-[#1f182a]/70 p-4"
						>
							<div class="flex items-start gap-3">
								<span
									class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-sm font-bold"
									:class="rankClass(entry.rank)"
								>
									{{ entry.rank }}
								</span>
								<div class="min-w-0 flex-1">
									<div class="flex items-start justify-between gap-3">
										<div class="flex min-w-0 items-center gap-2">
											<Image
												v-if="entry.item.image"
												:file="entry.item.image"
												:alt="entry.item.title ?? 'Quiz seçeneği'"
												:is-public="quiz.published"
												:width="320"
												class="h-10 w-12 shrink-0 rounded-lg"
											/>
											<span class="truncate font-semibold text-[#fff4df]">
												{{ entry.item.title || 'İsimsiz seçenek' }}
											</span>
										</div>
										<div class="shrink-0 text-right">
											<p class="text-[0.65rem] uppercase tracking-[0.16em] text-[#a69baa]"
												>Puan</p
											>
											<p class="font-bold text-[#c8b7ff]">{{ entry.weightedScore }}</p>
										</div>
									</div>
									<div class="mt-3 flex items-center gap-3">
										<div class="h-2 flex-1 overflow-hidden rounded-full bg-[#271c35]">
											<div
												class="h-full rounded-full bg-[#ff795e]"
												:style="{ width: `${entry.scorePercentage}%` }"
											/>
										</div>
										<span class="text-xs font-semibold text-[#c3b8c7]"
											>%{{ entry.scorePercentage }}</span
										>
									</div>
									<p class="mt-2 text-xs text-[#a69baa]">
										{{ entry.sessionWins }} oyun zaferi · Ort. sıra
										{{ formatRank(entry.averageRank) }}
									</p>
								</div>
							</div>
						</article>
					</div>
				</div>

				<div
					v-if="leaderboard.entries.length"
					class="mt-7 hidden overflow-x-auto rounded-2xl border border-[#fff4df]/10 md:block"
				>
					<table class="w-full min-w-[860px] border-collapse text-left">
						<thead
							class="bg-[#120f1a]/80 text-xs uppercase tracking-wider text-[#a69baa]"
						>
							<tr>
								<th scope="col" class="w-20 px-5 py-4">Sıra</th>
								<th scope="col" class="px-5 py-4">Seçenek</th>
								<th scope="col" class="px-5 py-4 text-right">Oyun zaferi</th>
								<th scope="col" class="px-5 py-4 text-right">Ort. sıra</th>
								<th scope="col" class="px-5 py-4 text-right">Ağırlıklı puan</th>
								<th scope="col" class="w-48 px-5 py-4">Başarı</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-[#fff4df]/10">
							<tr
								v-for="entry in leaderboard.entries"
								:key="entry.item.id"
								class="bg-[#1f182a]/40 transition hover:bg-[#271c35]/80"
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
											:is-public="quiz.published"
											:width="320"
											class="h-12 w-16 shrink-0 rounded-lg"
										/>
										<div
											v-else
											class="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg border border-[#fff4df]/10 bg-[#271c35]"
										>
											<UIcon name="heroicons:photo" class="text-[#a69baa]" :size="22" />
										</div>
										<span class="truncate font-semibold text-[#fff4df]">
											{{ entry.item.title || 'İsimsiz seçenek' }}
										</span>
									</div>
								</td>
								<td class="px-5 py-4 text-right font-medium text-[#c3b8c7]">
									{{ entry.sessionWins }}
								</td>
								<td class="px-5 py-4 text-right font-medium text-[#c3b8c7]">
									{{ formatRank(entry.averageRank) }}
								</td>
								<td class="px-5 py-4 text-right font-bold text-[#c8b7ff]">
									{{ entry.weightedScore }}
								</td>
								<td class="px-5 py-4">
									<div class="flex items-center gap-3">
										<div class="h-2 flex-1 overflow-hidden rounded-full bg-[#271c35]">
											<div
												class="h-full rounded-full bg-[#ff795e]"
												:style="{ width: `${entry.scorePercentage}%` }"
											/>
										</div>
										<span class="w-12 text-right text-xs font-semibold text-[#c3b8c7]">
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
					class="mt-7 flex flex-col items-center rounded-2xl border border-dashed border-[#fff4df]/15 bg-[#120f1a]/30 px-6 py-14 text-center"
				>
					<UIcon name="heroicons:trophy" class="text-[#ff795e]" :size="36" />
					<h3 class="mt-4 font-semibold text-[#fff4df]">Henüz tamamlanan oyun yok</h3>
					<p class="mt-2 max-w-md text-sm leading-6 text-[#a69baa]">
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
const appUrl = useRuntimeConfig().public.APP_URL
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
		const code =
			error && typeof error === 'object' && 'code' in error ? error.code : undefined
		throw createError({
			statusCode: code === 'NOT_FOUND' ? 404 : 503,
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
	ogTitle: () =>
		quiz.value ? `${quiz.value.title} · Fikifor` : 'Quiz detayları · Fikifor',
	ogDescription: () =>
		quiz.value?.description ?? 'Quiz sonuçları ve topluluk sıralaması.',
	ogType: 'website',
	ogUrl: `${appUrl}/quizes/${quizId}`,
	ogImage: `${appUrl}/og-image.png`,
	ogImageAlt: () => quiz.value?.title ?? 'Fikifor quizleri',
	twitterImage: `${appUrl}/og-image.png`,
	robots: () => (quiz.value?.published ? 'index, follow' : 'noindex, nofollow'),
})
useHead({
	link: [{ rel: 'canonical', href: `${appUrl}/quizes/${quizId}` }],
})
definePageMeta({ layout: 'panel' })
await callOnce(`quiz-${quizId}`, load)
loading.value = false
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
