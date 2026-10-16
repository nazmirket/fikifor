<template>
	<div class="w-full max-w-md">
		<div class="mb-8 lg:hidden">
			<NuxtLink to="/" class="flex items-center gap-2.5">
				<span
					class="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-[#742222]"
					><img src="/brand.svg" alt="Fikifor" class="h-9 w-9"
				/></span>
				<span class="text-2xl font-bold tracking-[-0.04em] text-[#fff4df]">FIKIFOR</span>
			</NuxtLink>
		</div>
		<div>
			<p class="fk-eyebrow">Tekrar hoş geldin</p>
			<h1 class="fk-display mt-3 text-4xl">Odaya dön.</h1>
			<p class="mt-3 text-sm leading-6 text-[#a69baa]"
				>Listelerini ve arkadaşlarınla açtığın odaları kaldığın yerden sürdür.</p
			>
		</div>

		<form class="mt-8 space-y-5" @submit.prevent="send">
			<label class="block">
				<span class="mb-2 block text-sm font-semibold text-[#fff4df]">Kullanıcı adı</span>
				<UInput
					id="login-username"
					v-model="payload.username"
					type="text"
					autocomplete="username"
					placeholder="kullanici_adin"
					class="w-full"
				/>
			</label>
			<label class="block">
				<span class="mb-2 block text-sm font-semibold text-[#fff4df]">Parola</span>
				<UInput
					id="login-password"
					v-model="payload.password"
					placeholder="••••••••"
					type="password"
					autocomplete="current-password"
					class="w-full"
				/>
			</label>
			<UButton
				type="submit"
				class="!mt-7 !min-h-14 w-full !bg-[#ff795e] !text-[#26131a] hover:!bg-[#ff927d]"
				:disabled="payload.username.length === 0 || payload.password.length === 0"
			>
				Giriş yap
				<template #trailing><UIcon name="heroicons:arrow-right" :size="18" /></template>
			</UButton>
		</form>

		<p class="mt-7 text-sm text-[#a69baa]"
			>Hesabın yok mu?
			<NuxtLink
				:to="{ path: '/signup', query: useRoute().query }"
				class="font-semibold text-[#ff927d] underline decoration-[#ff795e]/40 underline-offset-4 hover:text-[#fff4df]"
				>Hesap oluştur</NuxtLink
			></p
		>
	</div>
</template>

<script setup>
import { useAuthStore } from '@/store/auth'
const authStore = useAuthStore()

const payload = ref({ username: '', password: '' })

function send() {
	useAsync(
		async () => {
			await authStore.login(payload.value)
			const code = useRoute().query.code
			if (code?.length === 14 && code.toUpperCase() === code)
				return navigateTo(`/sessions/${code}`)
			const redirect = useRoute().query.redirect
			if (
				typeof redirect === 'string' &&
				redirect.startsWith('/') &&
				!redirect.startsWith('//')
			)
				return navigateTo(redirect)
			navigateTo('/')
		},
		{ setLoader: useLoading.set },
	)
}
</script>
