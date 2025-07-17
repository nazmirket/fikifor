<template>
	<div v-if="quiz" class="flex w-full max-w-[600px] flex-col gap-6 rounded-lg border p-6">
		<div class="flex flex-col gap-4 rounded-lg border p-3">
			<Image :file="quiz?.cover" class="aspect-default" />
			<span class="text-center text-xl">
				{{ quiz.title }}
			</span>
		</div>

		<UTooltip class="w-full" text="Davet Linkini Kopyala">
			<div
				class="flex w-full cursor-pointer items-center gap-2 overflow-hidden rounded-lg border bg-gray-900 p-3 hover:border-indigo-500"
				@click="copyLink"
			>
				<UIcon name="material-symbols:link" :size="24" />
				<span ref="LinkSpan" class="font-medium"> {{ link }} </span>
			</div>
		</UTooltip>

		<div class="flex flex-col rounded-lg border">
			<div class="border-b p-3">
				<span> Katılımcılar ({{ session.participants?.length }})</span>
			</div>
			<div class="flex flex-wrap gap-4 p-3">
				<template v-for="p of session.participants" :key="p.id">
					<ParticipantBadge :participant="p" />
				</template>
			</div>
		</div>

		<div v-if="sessionStore.counter">
			<UButton :disabled="true"> Başlıyor ({{ sessionStore.counter }} sn) </UButton>
		</div>

		<div v-else-if="session.adminId === authStore.user.userId">
			<UButton class="w-full" color="green" @click="start"> Başlat </UButton>
		</div>
	</div>
</template>

<script setup>
import { useAuthStore } from '~/store/auth'
import { useSessionStore } from '~/store/session'

const LinkSpan = ref()
const link = computed(() =>
	[useRuntimeConfig().public.APP_URL, 'sessions', session.value.code].join('/'),
)

const authStore = useAuthStore()
const sessionStore = useSessionStore()

const session = computed(() => sessionStore.session)
const quiz = computed(() => session.value.quiz)

function copyLink() {
	const text = link.value
	const input = document.createElement('input')
	input.value = text
	document.body.appendChild(input)
	input.select()
	document.execCommand('copy')
	document.body.removeChild(input)

	LinkSpan.value.innerText = 'Kopyalandı!'
	setTimeout(() => (LinkSpan.value.innerText = text), 1000)
}

function start() {
	useSocket().emit('session:start', { code: session.value.code })
}
</script>
