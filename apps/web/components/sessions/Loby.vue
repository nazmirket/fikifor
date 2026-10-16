<template>
	<div
		v-if="quiz"
		class="fk-surface flex w-full max-w-[600px] flex-col gap-6 rounded-[2rem] p-4 sm:p-6"
	>
		<div
			class="flex flex-col gap-4 rounded-2xl border border-[#fff4df]/10 bg-[#271c35] p-3"
		>
			<Image
				:file="quiz?.cover"
				:is-public="quiz.published"
				eager
				:width="640"
				class="aspect-default"
			/>
			<span class="text-center text-xl font-semibold text-[#fff4df]">
				{{ quiz.title }}
			</span>
		</div>

		<div
			class="flex w-full items-center gap-3 overflow-hidden rounded-xl border border-[#fff4df]/10 bg-[#120f1a] p-2.5 text-[#a69baa] transition focus-within:border-[#c8b7ff]/60 hover:border-[#ff795e]/60"
		>
			<UIcon
				name="material-symbols:link"
				class="ml-1 shrink-0 text-[#c8b7ff]"
				:size="22"
			/>
			<span class="min-w-0 flex-1 truncate font-medium" :title="link">{{ link }}</span>
			<button
				type="button"
				class="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg bg-[#ff795e] px-3 text-sm font-bold text-[#26131a] transition hover:bg-[#ff927d] disabled:cursor-not-allowed disabled:opacity-70"
				:aria-label="copyLabel"
				@click="copyLink"
			>
				<UIcon
					:name="
						copyState === 'success' ? 'heroicons:check' : 'heroicons:clipboard-document'
					"
					:size="17"
				/>
				<span>{{ copyLabel }}</span>
			</button>
		</div>
		<p
			v-if="copyState === 'error'"
			role="status"
			class="text-sm font-medium text-[#ffb19f]"
		>
			Bağlantı kopyalanamadı. Tarayıcı izinlerini kontrol edip tekrar deneyin.
		</p>

		<div class="flex flex-col rounded-2xl border border-[#fff4df]/10 bg-[#120f1a]">
			<div class="border-b border-[#fff4df]/10 p-3">
				<span class="text-sm font-semibold text-[#fff4df]">
					Katılımcılar ({{ session.participants?.length }})</span
				>
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

		<div v-else-if="!session.started && session.adminId === authStore.user.userId">
			<UButton class="w-full" color="green" @click="start"> Başlat </UButton>
		</div>
	</div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/store/auth'
import { useSessionStore } from '~/store/session'
import { unlockGameAudio } from '~/utils/gameAudio'

const link = computed(() =>
	[useRuntimeConfig().public.APP_URL, 'sessions', session.value.code].join('/'),
)

const copyState = ref<'idle' | 'success' | 'error'>('idle')
const copyTimer = ref<ReturnType<typeof setTimeout>>()
const copyLabel = computed(() => {
	if (copyState.value === 'success') return 'Kopyalandı'
	if (copyState.value === 'error') return 'Tekrar dene'
	return 'Kopyala'
})

const authStore = useAuthStore()
const sessionStore = useSessionStore()

const session = computed(() => sessionStore.session)
const quiz = computed(() => session.value.quiz)

async function copyLink() {
	const text = link.value
	try {
		if (navigator.clipboard?.writeText) {
			await navigator.clipboard.writeText(text)
		} else {
			const input = document.createElement('textarea')
			input.value = text
			input.setAttribute('readonly', '')
			input.style.position = 'fixed'
			input.style.opacity = '0'
			document.body.appendChild(input)
			input.select()
			const copied = document.execCommand('copy')
			document.body.removeChild(input)
			if (!copied) throw new Error('Clipboard copy failed')
		}
		copyState.value = 'success'
	} catch {
		copyState.value = 'error'
	}
	clearTimeout(copyTimer.value)
	copyTimer.value = setTimeout(() => (copyState.value = 'idle'), 2_500)
}

function start() {
	void unlockGameAudio()
	useSocket().emit('session:start', { code: session.value.code })
}

onBeforeUnmount(() => clearTimeout(copyTimer.value))
</script>
