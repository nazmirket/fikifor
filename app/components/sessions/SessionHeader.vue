<template>
	<div
		class="flex w-full flex-col divide-y divide-gray-600 rounded-lg border bg-gray-950"
	>
		<div class="flex w-full flex-wrap gap-2 p-3 max-sm:p-1.5">
			<template v-for="p of participants" :key="p.id">
				<ParticipantBadge :participant="p" />
			</template>
		</div>

		<div
			class="flex w-full items-center justify-between gap-2 p-3 max-sm:flex-col max-sm:gap-1 max-sm:p-2"
		>
			<span class="text-md max-sm:text-sm">
				{{ sessionStore.session.quiz?.title }}
			</span>

			<span class="whitespace-nowrap font-medium max-sm:text-sm">
				{{ sessionStore.match?.order }}
				/
				{{ sessionStore.match?.cluster }}
			</span>
		</div>
	</div>
</template>

<script setup>
import { useSessionStore } from '~/store/session'
const sessionStore = useSessionStore()

const participants = computed(() => sessionStore.session.participants)
</script>
