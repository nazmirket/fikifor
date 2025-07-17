<template>
	<div class="flex w-full flex-col gap-4">
		<div
			class="flex h-[60px] w-full items-center justify-between rounded-lg border bg-gray-950 px-4"
		>
			<span class="text-lg">
				{{ sessionStore.session.quiz?.title }}
			</span>
		</div>
		<div v-if="final" class="grid grid-cols-2 gap-4">
			<SessionItemPassive
				:item="final.firstItem"
				:votes="votes.filter(v => v.selectionId === final.firstItem?.id)"
				:is-favorite="sessionStore.session.favorite?.id === final.firstItem?.id"
			/>
			<SessionItemPassive
				:item="final.secondItem"
				:votes="votes.filter(v => v.selectionId === final.secondItem?.id)"
				:is-favorite="sessionStore.session.favorite?.id === final.secondItem?.id"
			/>
		</div>

		<UButton @click="navigateTo('/')"> Go to Home </UButton>
	</div>
</template>

<script setup>
import { useSessionStore } from '~/store/session'
const sessionStore = useSessionStore()

const final = computed(() => sessionStore.final)
const votes = computed(() => sessionStore.final.votes)
</script>
