<template>
	<div class="flex min-h-full w-full flex-col pt-[60px]">
		<UNotifications />
		<LoadingSpinner v-if="useLoading.isLoading()" />
		<div
			class="fixed left-0 right-0 top-0 flex h-[60px] items-center justify-between bg-gray-900 px-4"
		>
			<div class="flex items-center gap-2">
				<img src="/brand.svg" alt="mirket" class="h-8 w-8" />
				<span class="text-3xl font-bold text-gray-200">FIKIFOR</span>
			</div>

			<UPopover>
				<span> @{{ authStore.user?.username }} </span>

				<template #panel>
					<div class="min-w-[150px] bg-gray-800">
						<a
							class="flex cursor-pointer items-center gap-1.5 p-3 hover:text-indigo-300"
							@click="logout"
						>
							<UIcon name="fluent:sign-out-20-regular" :size="24" />
							<span> Çıkış Yap </span>
						</a>
					</div>
				</template>
			</UPopover>
		</div>
		<slot />
	</div>
</template>

<script setup>
import { useAuthStore } from '~/store/auth'
const authStore = useAuthStore()

const logout = () => {
	authStore.token = null
	authStore.user = null
	navigateTo('/login')
}
</script>
