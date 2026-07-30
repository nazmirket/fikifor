<template>
	<div class="flex min-h-full w-full flex-col bg-gray-950 pt-[72px]">
		<UNotifications />
		<LoadingSpinner v-if="useLoading.isLoading()" />

		<header
			class="fixed inset-x-0 top-0 z-50 h-[72px] border-b border-gray-800/80 bg-gray-950/90 backdrop-blur"
		>
			<div
				class="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6"
			>
				<div class="flex items-center gap-8">
					<NuxtLink to="/" class="flex items-center gap-2">
						<img src="/brand.svg" alt="Fikifor" class="h-9 w-9" />
						<span class="text-2xl font-bold tracking-tight text-gray-100">FIKIFOR</span>
					</NuxtLink>

					<nav class="hidden items-center gap-6 text-sm font-medium md:flex">
						<NuxtLink
							to="/quizes"
							class="transition hover:text-indigo-300"
							active-class="text-indigo-300"
						>
							Quizleri Keşfet
						</NuxtLink>
						<NuxtLink
							v-if="authStore.isLoggedIn"
							to="/my-quizes"
							class="transition hover:text-indigo-300"
							active-class="text-indigo-300"
						>
							Listelerim
						</NuxtLink>
					</nav>
				</div>

				<div class="flex items-center gap-2">
					<NuxtLink
						to="/quizes"
						class="rounded-lg p-2 text-gray-300 transition hover:bg-gray-800 md:hidden"
						aria-label="Quizleri keşfet"
					>
						<UIcon name="heroicons:magnifying-glass" :size="22" />
					</NuxtLink>
					<NuxtLink
						v-if="authStore.isLoggedIn"
						to="/my-quizes"
						class="rounded-lg p-2 text-gray-300 transition hover:bg-gray-800 md:hidden"
						aria-label="Listelerim"
					>
						<UIcon name="heroicons:rectangle-stack" :size="22" />
					</NuxtLink>

					<UPopover v-if="authStore.isLoggedIn">
						<button
							class="flex items-center gap-2 rounded-full border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 transition hover:border-indigo-500"
						>
							<span
								class="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500/20 font-semibold text-indigo-300"
							>
								{{ authStore.user?.username?.slice(0, 1).toUpperCase() }}
							</span>
							<span class="hidden sm:inline">@{{ authStore.user?.username }}</span>
						</button>

						<template #panel>
							<div class="min-w-[180px] rounded-lg bg-gray-900 p-1">
								<NuxtLink
									to="/my-quizes"
									class="flex items-center gap-2 rounded-md p-3 hover:bg-gray-800 hover:text-indigo-300"
								>
									<UIcon name="heroicons:rectangle-stack" :size="20" />
									<span>Listelerim</span>
								</NuxtLink>
								<button
									class="flex w-full items-center gap-2 rounded-md p-3 text-left hover:bg-gray-800 hover:text-indigo-300"
									@click="logout"
								>
									<UIcon name="fluent:sign-out-20-regular" :size="20" />
									<span>Çıkış Yap</span>
								</button>
							</div>
						</template>
					</UPopover>

					<template v-else>
						<NuxtLink
							to="/login"
							class="rounded-lg px-3 py-2 text-sm font-semibold text-gray-200 transition hover:bg-gray-800"
						>
							Giriş Yap
						</NuxtLink>
						<NuxtLink
							to="/signup"
							class="hidden rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 sm:block"
						>
							Hesap Oluştur
						</NuxtLink>
					</template>
				</div>
			</div>
		</header>

		<main class="flex flex-1 flex-col">
			<slot />
		</main>

		<footer class="border-t border-gray-900 px-6 py-8 text-center text-sm text-gray-600">
			Fikifor · Birlikte seçmenin en eğlenceli yolu
		</footer>
	</div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/store/auth'

const authStore = useAuthStore()

function logout() {
	authStore.logout()
	navigateTo('/')
}
</script>
