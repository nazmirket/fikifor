<template>
	<div class="fk-surface flex w-full flex-col divide-y divide-[#fff4df]/10 rounded-2xl">
		<div class="flex w-full flex-wrap gap-2 p-3 max-sm:p-1.5">
			<template v-for="p of participants" :key="p.id">
				<ParticipantBadge :participant="p" />
			</template>
		</div>

		<div
			class="flex w-full items-center justify-between gap-2 p-3 text-[#fff4df] max-sm:flex-col max-sm:gap-1 max-sm:p-2"
		>
			<span class="text-md max-sm:text-sm">
				{{ sessionStore.session.quiz?.title }}
			</span>

			<span class="whitespace-nowrap font-medium max-sm:text-sm">
				{{ sessionStore.match?.order }}
				/
				{{ sessionStore.match?.cluster }}
			</span>
			<span
				v-if="deadlineSeconds !== undefined"
				class="rounded-full border border-[#c8b7ff]/30 bg-[#c8b7ff]/10 px-2.5 py-1 text-xs text-[#daceff]"
			>
				{{ deadlineSeconds }} sn
			</span>
		</div>
	</div>
</template>

<script setup>
import { useSessionStore } from '~/store/session'
const sessionStore = useSessionStore()

const participants = computed(() => sessionStore.session.participants)
const deadlineSeconds = ref()
let deadlineTimer

function updateDeadline() {
	const deadlineAt = sessionStore.match?.deadlineAt
	if (!deadlineAt || sessionStore.match?.completed) {
		deadlineSeconds.value = undefined
		return
	}
	deadlineSeconds.value = Math.max(
		0,
		Math.ceil((new Date(deadlineAt).getTime() - Date.now()) / 1_000),
	)
}

watch(() => sessionStore.match?.deadlineAt, updateDeadline, { immediate: true })
onMounted(() => {
	deadlineTimer = setInterval(updateDeadline, 250)
})
onBeforeUnmount(() => clearInterval(deadlineTimer))
</script>
