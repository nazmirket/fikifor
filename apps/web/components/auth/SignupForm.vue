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
			<p class="fk-eyebrow">İlk odanı kur</p>
			<h1 class="fk-display mt-3 text-4xl">Aramıza katıl.</h1>
			<p class="mt-3 text-sm leading-6 text-[#a69baa]"
				>Ücretsiz hesabını oluştur, kendi listeni hazırlayıp arkadaşlarını davet et.</p
			>
		</div>

		<form class="mt-8 space-y-5" @submit.prevent="send">
			<p
				v-if="error"
				role="alert"
				class="rounded-xl border border-[#ff795e]/25 bg-[#ff795e]/10 px-4 py-3 text-sm leading-6 text-[#ffb19f]"
				>{{ error }}</p
			>
			<label class="block">
				<span class="mb-2 block text-sm font-semibold text-[#fff4df]">Kullanıcı adı</span>
				<input
					id="signup-username"
					v-model="payload.username"
					type="text"
					autocomplete="username"
					placeholder="kullanici_adin"
					class="w-full rounded-xl border border-[#fff4df]/15 bg-[#120f1a]/60 px-4 py-3 text-[#fff4df] outline-none transition placeholder:text-[#756a7b] focus:border-[#ff795e] focus:ring-2 focus:ring-[#ff795e]/20"
				/>
			</label>
			<label class="block">
				<span class="mb-2 block text-sm font-semibold text-[#fff4df]">Parola</span>
				<input
					id="signup-password"
					v-model="payload.password"
					placeholder="En az 8 karakter"
					type="password"
					autocomplete="new-password"
					class="w-full rounded-xl border border-[#fff4df]/15 bg-[#120f1a]/60 px-4 py-3 text-[#fff4df] outline-none transition placeholder:text-[#756a7b] focus:border-[#ff795e] focus:ring-2 focus:ring-[#ff795e]/20"
				/>
			</label>
			<label class="block">
				<span class="mb-2 block text-sm font-semibold text-[#fff4df]">Parola tekrar</span>
				<input
					id="signup-password-confirmation"
					v-model="payload.passwordConfirmation"
					placeholder="Parolanı tekrar yaz"
					type="password"
					autocomplete="new-password"
					class="w-full rounded-xl border border-[#fff4df]/15 bg-[#120f1a]/60 px-4 py-3 text-[#fff4df] outline-none transition placeholder:text-[#756a7b] focus:border-[#ff795e] focus:ring-2 focus:ring-[#ff795e]/20"
				/>
			</label>
			<UButton
				type="submit"
				class="!mt-7 !min-h-14 w-full !bg-[#ff795e] !text-[#26131a] hover:!bg-[#ff927d]"
				:disabled="
					payload.username.length === 0 ||
					payload.password.length === 0 ||
					payload.passwordConfirmation.length === 0
				"
			>
				Hesap oluştur
				<template #trailing><UIcon name="heroicons:arrow-right" :size="18" /></template>
			</UButton>
		</form>

		<p class="mt-7 text-sm text-[#a69baa]"
			>Zaten hesabın var mı?
			<NuxtLink
				:to="{ path: '/login', query: useRoute().query }"
				class="font-semibold text-[#ff927d] underline decoration-[#ff795e]/40 underline-offset-4 hover:text-[#fff4df]"
				>Giriş yap</NuxtLink
			></p
		>
	</div>
</template>

<script setup>
import { useAuthStore } from '@/store/auth'
const authStore = useAuthStore()

const error = ref('')
const payload = ref({ username: '', password: '', passwordConfirmation: '' })

function send() {
	useAsync(
		async () => {
			if (payload.value.username.length < 3)
				return (error.value = 'Kullanıcı adı en az 3 karakter olmalıdır')
			const alpanumeric = /^[a-zA-Z0-9]*$/g
			if (!alpanumeric.test(payload.value.username))
				return (error.value = 'Kullanıcı adı sadece harf ve rakam içerebilir')
			if (payload.value.password.length < 8)
				return (error.value = 'Parola en az 8 karakter olmalıdır')
			if (payload.value.password !== payload.value.passwordConfirmation)
				return (error.value = 'Parolalar eşleşmiyor')
			error.value = ''
			await authStore.signup(payload.value)
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
