<template>
	<div class="fk-shell flex min-h-full w-full flex-col pt-[76px]">
		<UNotifications />
		<LoadingSpinner v-if="useLoading.isLoading()" />

		<header
			class="fixed inset-x-0 top-0 z-50 h-[76px] border-b border-[#fff4e0]/10 bg-[#120f1a]/90 backdrop-blur-xl"
		>
			<div
				class="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6"
			>
				<div class="flex items-center gap-6 sm:gap-10">
					<NuxtLink to="/" class="group flex items-center gap-2.5">
						<span
							class="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-[#742222] shadow-lg shadow-black/20"
						>
							<img
								src="/brand.svg"
								alt="Fikifor"
								class="h-9 w-9 transition duration-300 group-hover:rotate-6"
							/>
						</span>
						<span class="text-xl font-bold tracking-[-0.04em] text-[#fff4df] sm:text-2xl"
							>FIKIFOR</span
						>
					</NuxtLink>

					<nav
						class="hidden items-center gap-1 rounded-full border border-[#fff4df]/10 bg-[#fff4df]/[0.04] p-1 text-sm font-medium md:flex"
					>
						<NuxtLink
							to="/quizes"
							class="rounded-full px-4 py-2 text-[#a69baa] transition hover:bg-[#fff4df]/[0.08] hover:text-[#fff4df]"
							active-class="bg-[#fff4df]/10 !text-[#fff4df]"
						>
							Quizleri Keşfet
						</NuxtLink>
						<NuxtLink
							v-if="authStore.isLoggedIn"
							to="/my-quizes"
							class="rounded-full px-4 py-2 text-[#a69baa] transition hover:bg-[#fff4df]/[0.08] hover:text-[#fff4df]"
							active-class="bg-[#fff4df]/10 !text-[#fff4df]"
						>
							Listelerim
						</NuxtLink>
					</nav>
				</div>

				<div class="flex items-center gap-2">
					<NuxtLink
						to="/quizes"
						class="rounded-xl p-2.5 text-[#fff4df]/80 transition hover:bg-[#fff4df]/10 hover:text-[#fff4df] md:hidden"
						aria-label="Quizleri keşfet"
					>
						<UIcon name="heroicons:magnifying-glass" :size="22" />
					</NuxtLink>
					<NuxtLink
						v-if="authStore.isLoggedIn"
						to="/my-quizes"
						class="rounded-xl p-2.5 text-[#fff4df]/80 transition hover:bg-[#fff4df]/10 hover:text-[#fff4df] md:hidden"
						aria-label="Listelerim"
					>
						<UIcon name="heroicons:rectangle-stack" :size="22" />
					</NuxtLink>

					<UPopover v-if="authStore.isLoggedIn">
						<button
							class="flex items-center gap-2 rounded-full border border-[#fff4df]/15 bg-[#fff4df]/[0.06] px-2.5 py-1.5 text-sm text-[#fff4df] transition hover:border-[#c8b7ff]/60 sm:px-3 sm:py-2"
						>
							<span
								class="flex h-7 w-7 items-center justify-center rounded-full bg-[#ff795e]/20 font-semibold text-[#ffb19f]"
							>
								{{ authStore.user?.username?.slice(0, 1).toUpperCase() }}
							</span>
							<span class="hidden sm:inline">@{{ authStore.user?.username }}</span>
						</button>

						<template #panel>
							<div
								class="min-w-[180px] rounded-2xl border border-[#fff4df]/10 bg-[#271c35] p-1 shadow-2xl shadow-black/30"
							>
								<NuxtLink
									to="/my-quizes"
									class="flex items-center gap-2 rounded-xl p-3 hover:bg-[#fff4df]/10 hover:text-[#c8b7ff]"
								>
									<UIcon name="heroicons:rectangle-stack" :size="20" />
									<span>Listelerim</span>
								</NuxtLink>
								<button
									class="flex w-full items-center gap-2 rounded-xl p-3 text-left hover:bg-[#fff4df]/10 hover:text-[#c8b7ff]"
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
							class="rounded-xl px-3 py-2 text-sm font-semibold text-[#fff4df]/85 transition hover:bg-[#fff4df]/10 hover:text-[#fff4df]"
						>
							Giriş Yap
						</NuxtLink>
						<NuxtLink
							to="/signup"
							class="hidden rounded-xl bg-[#ff795e] px-4 py-2 text-sm font-semibold text-[#26131a] shadow-lg shadow-[#ff795e]/15 transition hover:bg-[#ff927d] sm:block"
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

		<footer
			class="border-t border-[#fff4df]/10 px-6 py-10 text-center text-sm text-[#a69baa]"
		>
			<span class="font-semibold text-[#fff4df]">Fikifor</span> · Birlikte seçmenin en
			eğlenceli yolu
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
