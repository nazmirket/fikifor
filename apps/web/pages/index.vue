<template>
	<div class="relative isolate flex flex-1 overflow-hidden">
		<div
			class="pointer-events-none absolute -left-32 top-24 -z-10 h-96 w-96 rounded-full bg-[#ff795e]/10 blur-[110px]"
		/>
		<div
			class="pointer-events-none absolute -right-24 top-[-80px] -z-10 h-[30rem] w-[30rem] rounded-full bg-[#c8b7ff]/10 blur-[120px]"
		/>

		<div
			class="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-5 py-14 sm:px-8 sm:py-20 lg:px-10 lg:py-24"
		>
			<div
				class="grid min-w-0 grid-cols-1 items-center gap-14 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.85fr)] lg:gap-20"
			>
				<section class="min-w-0 max-w-2xl">
					<div
						class="fk-eyebrow inline-flex items-center gap-2 rounded-full border border-[#ff795e]/25 bg-[#ff795e]/10 px-3.5 py-2"
					>
						<span
							class="h-1.5 w-1.5 rounded-full bg-[#ff795e] shadow-[0_0_0_4px_rgba(255,121,94,0.15)]"
						/>
						Birlikte seçmenin yeni yolu
					</div>

					<h1
						class="fk-display mt-7 max-w-full text-5xl sm:text-6xl lg:max-w-xl lg:text-[5.4rem]"
					>
						Kararsızlığı
						<span class="text-[#ff795e]">oyuna</span> dönüştür.
					</h1>
					<p class="mt-7 max-w-xl text-base leading-8 text-[#b8aebb] sm:text-lg">
						Filmden müziğe, yemekten seyahate kadar seçeneklerini tek bir odada topla.
						Arkadaşlarını davet et, oyları gör ve favorinizi birlikte bulun.
					</p>

					<div class="mt-9 flex w-full max-w-lg flex-col gap-3 sm:flex-row">
						<NuxtLink
							to="/quizes"
							class="fk-button-primary inline-flex min-h-14 flex-1 items-center justify-center gap-2 rounded-2xl px-6 py-4 transition hover:-translate-y-0.5"
						>
							Quizleri keşfet
							<UIcon name="heroicons:arrow-up-right" :size="20" />
						</NuxtLink>
						<NuxtLink
							:to="authStore.isLoggedIn ? '/my-quizes' : '/signup'"
							class="fk-button-secondary inline-flex min-h-14 flex-1 items-center justify-center rounded-2xl px-6 py-4 transition hover:-translate-y-0.5"
						>
							{{ authStore.isLoggedIn ? 'Liste oluştur' : 'Ücretsiz başla' }}
						</NuxtLink>
					</div>

					<div
						class="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-[#8f8497]"
					>
						<span class="inline-flex items-center gap-2">
							<UIcon name="heroicons:check-circle" class="text-[#9fe0c1]" :size="18" />
							Görsel listeler
						</span>
						<span class="inline-flex items-center gap-2">
							<UIcon name="heroicons:check-circle" class="text-[#9fe0c1]" :size="18" />
							Tek linkle davet
						</span>
						<span class="inline-flex items-center gap-2">
							<UIcon name="heroicons:check-circle" class="text-[#9fe0c1]" :size="18" />
							Oylama odaları
						</span>
					</div>
				</section>

				<section
					aria-label="Örnek oyun odası"
					class="relative mx-auto w-full min-w-0 max-w-[520px]"
				>
					<div
						class="absolute -right-4 -top-6 hidden -rotate-3 rounded-2xl border border-[#c8b7ff]/25 bg-[#c8b7ff]/10 px-4 py-3 text-xs font-semibold text-[#daceff] shadow-xl shadow-black/10 sm:block"
					>
						Arkadaşlarınla birlikte
					</div>
					<div class="fk-surface overflow-hidden rounded-[2rem] p-2">
						<div class="rounded-[1.5rem] bg-[#271c35] p-5 sm:p-7">
							<div class="flex items-center justify-between gap-4">
								<div>
									<p class="fk-eyebrow">Örnek oyun odası</p>
									<h2
										class="mt-2 text-xl font-semibold tracking-tight text-[#fff4df] sm:text-2xl"
										>Bu akşam ne izliyoruz?</h2
									>
								</div>
								<span
									class="rounded-full border border-[#9fe0c1]/25 bg-[#9fe0c1]/10 px-3 py-1.5 text-xs font-semibold text-[#b9f0d4]"
									>Canlı</span
								>
							</div>

							<div class="mt-7 space-y-3">
								<div
									v-for="(option, index) in roomOptions"
									:key="option.title"
									class="flex items-center gap-3 rounded-2xl border border-[#fff4df]/10 bg-[#fff4df]/[0.045] p-3 transition hover:border-[#ff795e]/40 hover:bg-[#fff4df]/[0.08]"
								>
									<div
										class="h-14 w-14 shrink-0 overflow-hidden rounded-xl"
										:class="option.tone"
									>
										<div
											class="flex h-full items-center justify-center text-2xl font-bold text-[#fff4df]/90"
											>{{ index + 1 }}</div
										>
									</div>
									<div class="min-w-0 flex-1">
										<p class="truncate font-semibold text-[#fff4df]">{{
											option.title
										}}</p>
										<div class="mt-2 h-1.5 overflow-hidden rounded-full bg-[#fff4df]/10">
											<div
												class="h-full rounded-full bg-[#ff795e]"
												:style="{ width: `${option.votes}%` }"
											/>
										</div>
									</div>
									<span class="w-10 text-right text-sm font-semibold text-[#c8b7ff]"
										>{{ option.votes }}%</span
									>
								</div>
							</div>

							<div
								class="mt-7 flex items-center justify-between border-t border-[#fff4df]/10 pt-5 text-sm"
							>
								<span class="inline-flex items-center gap-2 text-[#a69baa]"
									><UIcon name="heroicons:user-group" :size="18" /> 8 arkadaş oy
									veriyor</span
								>
								<span class="font-semibold text-[#fff4df]">3 / 5 seçenek</span>
							</div>
						</div>
					</div>
					<div
						class="absolute -bottom-5 -left-5 hidden rotate-2 items-center gap-3 rounded-2xl border border-[#ff795e]/20 bg-[#3a2638] px-4 py-3 shadow-xl shadow-black/20 sm:flex"
					>
						<span
							class="flex h-8 w-8 items-center justify-center rounded-full bg-[#ff795e]/20 text-[#ffb19f]"
							><UIcon name="heroicons:sparkles" :size="17"
						/></span>
						<span class="text-xs font-semibold text-[#fff4df]"
							>Kazananı birlikte bulun</span
						>
					</div>
				</section>
			</div>

			<div
				class="mt-24 grid gap-px overflow-hidden rounded-2xl border border-[#fff4df]/10 bg-[#fff4df]/10 sm:grid-cols-3"
			>
				<div v-for="step in steps" :key="step.title" class="bg-[#1d1728]/80 p-5 sm:p-6">
					<div class="flex items-center gap-3">
						<span class="text-sm font-bold text-[#ff795e]">0{{ step.number }}</span>
						<UIcon :name="step.icon" class="text-[#c8b7ff]" :size="20" />
					</div>
					<p class="mt-5 font-semibold text-[#fff4df]">{{ step.title }}</p>
					<p class="mt-1.5 text-sm leading-6 text-[#968a9c]">{{ step.description }}</p>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/store/auth'

const authStore = useAuthStore()
const appUrl = useRuntimeConfig().public.APP_URL

const roomOptions = [
	{ title: 'Arrival', votes: 58, tone: 'bg-[#9d5c53]' },
	{ title: 'The Grand Budapest Hotel', votes: 31, tone: 'bg-[#675584]' },
	{ title: 'Before Sunrise', votes: 11, tone: 'bg-[#4c756e]' },
]

const steps = [
	{
		number: 1,
		title: 'Listeni hazırla',
		description: 'Seçeneklerini görsellerle tek yerde topla.',
		icon: 'heroicons:rectangle-stack',
	},
	{
		number: 2,
		title: 'Odayı paylaş',
		description: 'Bir link gönder, arkadaşların anında katılsın.',
		icon: 'heroicons:paper-airplane',
	},
	{
		number: 3,
		title: 'Birlikte karar ver',
		description: 'Oyları gör ve kazanan seçeneği kutla.',
		icon: 'heroicons:user-group',
	},
]

useSeoMeta({
	title: 'Fikifor · Birlikte seç',
	description: 'Listeni paylaş, arkadaşlarınla oyla ve favorinizi birlikte bulun.',
	ogTitle: 'Fikifor · Birlikte seç',
	ogDescription: 'Listeni paylaş, arkadaşlarınla oyla ve favorinizi birlikte bulun.',
	ogUrl: appUrl,
	ogImage: `${appUrl}/og-image.png`,
	ogImageAlt: 'Fikifor ile arkadaşlarınla birlikte seçim yap',
	twitterImage: `${appUrl}/og-image.png`,
})
useHead({ link: [{ rel: 'canonical', href: appUrl }] })
definePageMeta({ layout: 'panel' })
</script>
