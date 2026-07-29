<template>
	<div
		class="flex w-full min-w-[300px] max-w-[450px] flex-col gap-6 rounded-lg border bg-gray-900 p-8"
	>
		<div class="flex flex-col gap-2">
			<div class="flex items-center gap-2">
				<img src="/brand.svg" alt="mirket" class="h-8 w-8" />
				<span class="text-3xl font-bold text-gray-200">FIKIFOR</span>
			</div>
			<span> Hesap oluşturmak için lütfen kullanıcı adı ve parolanızı girin </span>
		</div>

		<div class="flex flex-col gap-4">
			<span v-if="error" class="text-red-400">
				{{ error }}
			</span>

			<UInput
				v-model="payload.username"
				type="text"
				placeholder="Kullanıcı adı"
				class="w-full"
			/>
			<UInput
				v-model="payload.password"
				placeholder="Parola"
				type="password"
				class="w-full"
			/>
			<UInput
				v-model="payload.passwordConfirmation"
				placeholder="Parola tekrar"
				type="password"
				class="w-full"
			/>
			<UButton
				class="w-full"
				:disabled="
					payload.username.length === 0 ||
					payload.password.length === 0 ||
					payload.passwordConfirmation.length === 0
				"
				@click="send"
			>
				Hesap Oluştur
			</UButton>
		</div>

		<div>
			Eğer hesabınız varsa
			<NuxtLink
				:to="useRoute().query.code ? `/login?code=${useRoute().query.code}` : '/login'"
				class="text-indigo-400"
			>
				giriş yapın
			</NuxtLink>
		</div>
	</div>
</template>

<script setup>
import { useAuthStore } from '@/store/auth'
const authStore = useAuthStore()

const error = ref('')

const payload = ref({
	username: '',
	password: '',
	passwordConfirmation: '',
})

function send() {
	useAsync(
		async () => {
			if (payload.value.username.length < 3) {
				error.value = 'Kullanıcı adı en az 3 karakter olmalıdır'
				return
			}

			const alpanumeric = /^[a-zA-Z0-9]*$/g

			if (!alpanumeric.test(payload.value.username)) {
				error.value = 'Kullanıcı adı sadece harf ve rakam içerebilir'
				return
			}

			if (payload.value.password.length < 8) {
				error.value = 'Parola en az 8 karakter olmalıdır'
				return
			}

			if (payload.value.password !== payload.value.passwordConfirmation) {
				error.value = 'Parolalar eşleşmiyor'
				return
			}

			await authStore.signup(payload.value)

			const code = useRoute().query.code

			if (code?.length === 14 && code.toUpperCase() === code) {
				return navigateTo(`/sessions/${code}`)
			}

			navigateTo('/')
		},
		{ setLoader: useLoading.set },
	)
}
</script>
