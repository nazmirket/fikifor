<template>
	<div class="relative isolate flex flex-1 overflow-hidden">
		<div
			class="pointer-events-none absolute inset-x-0 top-[-260px] -z-10 mx-auto h-[620px] max-w-5xl rounded-full bg-indigo-600/20 blur-[140px]"
		/>
		<div
			class="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center px-6 py-20 text-center sm:py-28"
		>
			<div
				class="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-200"
			>
				<UIcon name="heroicons:sparkles" :size="18" />
				Listeni oluştur, arkadaşlarınla birlikte seç
			</div>

			<h1
				class="max-w-4xl text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl"
			>
				Kararsızlığı
				<span class="text-indigo-400">oyuna dönüştür.</span>
			</h1>
			<p class="mt-6 max-w-2xl text-base leading-8 text-gray-400 sm:text-lg">
				Filmden müziğe, yemekten seyahate kadar seçeneklerini paylaş. Odayı aç,
				arkadaşlarını davet et ve favorinizi birlikte bulun.
			</p>

			<div class="mt-10 flex w-full max-w-md flex-col gap-3 sm:flex-row">
				<NuxtLink
					to="/quizes"
					class="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-6 py-4 font-semibold text-white shadow-lg shadow-indigo-950/40 transition hover:-translate-y-0.5 hover:bg-indigo-400"
				>
					Quizleri Keşfet
					<UIcon name="heroicons:arrow-right" :size="20" />
				</NuxtLink>
				<NuxtLink
					:to="authStore.isLoggedIn ? '/my-quizes' : '/signup'"
					class="flex flex-1 items-center justify-center rounded-xl border border-gray-700 bg-gray-900/70 px-6 py-4 font-semibold text-gray-100 transition hover:border-gray-500 hover:bg-gray-900"
				>
					{{ authStore.isLoggedIn ? 'Liste Oluştur' : 'Ücretsiz Başla' }}
				</NuxtLink>
			</div>

			<div
				class="mt-16 grid w-full max-w-3xl grid-cols-1 divide-y divide-gray-800 rounded-2xl border border-gray-800 bg-gray-900/40 text-left sm:grid-cols-3 sm:divide-x sm:divide-y-0"
			>
				<div class="p-5">
					<UIcon name="heroicons:rectangle-stack" class="text-indigo-400" :size="24" />
					<p class="mt-3 font-semibold text-gray-100">Listeni hazırla</p>
					<p class="mt-1 text-sm leading-6 text-gray-500"
						>Seçeneklerini görsellerle ekle.</p
					>
				</div>
				<div class="p-5">
					<UIcon name="heroicons:share" class="text-indigo-400" :size="24" />
					<p class="mt-3 font-semibold text-gray-100">Yayınla ve paylaş</p>
					<p class="mt-1 text-sm leading-6 text-gray-500"
						>Topluluğun listeni keşfetsin.</p
					>
				</div>
				<div class="p-5">
					<UIcon name="heroicons:user-group" class="text-indigo-400" :size="24" />
					<p class="mt-3 font-semibold text-gray-100">Birlikte oyna</p>
					<p class="mt-1 text-sm leading-6 text-gray-500">Oylayın ve kazananı bulun.</p>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/store/auth'

const authStore = useAuthStore()

useSeoMeta({
	title: 'Fikifor · Birlikte seç',
	description: 'Listeni paylaş, arkadaşlarınla oyla ve favorinizi birlikte bulun.',
})
definePageMeta({ layout: 'panel' })
</script>
