<template>
	<div
		v-if="session"
		class="flex min-h-full w-full max-w-[900px] flex-col items-center justify-center gap-4 p-6 max-sm:gap-2 max-sm:p-3"
	>
		<SessionResult v-if="sessionStore.phase === 'finished'" />
		<Loby
			v-else-if="sessionStore.phase === 'lobby' || sessionStore.phase === 'countdown'"
		/>
		<template v-else>
			<SessionHeader />
			<SessionMatch />
		</template>
	</div>
</template>

<script setup>
import { useSessionStore } from '~/store/session'
const sessionStore = useSessionStore()

useSeoMeta({ title: 'FIKIFOR' })
definePageMeta({ layout: 'session' })

const code = computed(() => useRoute().params.code)

const session = computed(() => sessionStore.session)

function load() {
	useAsync(async () => await sessionStore.getSession(code.value), {
		setLoader: useLoading.set,
	})
}

onMounted(() => load())
</script>
