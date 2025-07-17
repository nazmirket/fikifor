<template>
	<div
		class="flex w-full min-w-[300px] max-w-[450px] flex-col gap-6 rounded-lg border bg-gray-900 p-8"
	>
		<div class="flex flex-col gap-2">
			<div class="flex items-center gap-2">
				<img src="/brand.svg" alt="mirket" class="h-8 w-8" />
				<span class="text-3xl font-bold text-gray-200">FIKIFOR</span>
			</div>
			<span> Lütfen kullanıcı adı ve parolanızı giriniz </span>
		</div>

		<div class="flex flex-col gap-4">
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

			<UButton
				class="w-full"
				:disabled="payload.username.length === 0 || payload.password.length === 0"
				@click="send"
			>
				Giriş Yap
			</UButton>
		</div>

		<div>
			Eğer hesabınız yoksa
			<NuxtLink
				:to="useRoute().query.code ? `/signup?code=${useRoute().query.code}` : '/signup'"
				class="text-indigo-400"
			>
				hesap oluşturun
			</NuxtLink>
		</div>
	</div>
</template>

<script setup>
import { useAuthStore } from '@/store/auth'
const authStore = useAuthStore()

const payload = ref({
	username: '',
	password: '',
})

function send() {
	useAsync(
		async () => {
			await authStore.login(payload.value)

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
