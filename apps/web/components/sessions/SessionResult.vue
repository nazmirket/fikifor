<template>
	<div class="flex w-full flex-col gap-4">
		<div
			class="fk-surface flex h-[60px] w-full items-center justify-between rounded-2xl px-4"
		>
			<span class="text-lg font-semibold text-[#fff4df]">
				{{ sessionStore.session.quiz?.title }}
			</span>
		</div>
		<div v-if="final" class="grid grid-cols-2 gap-4">
			<SessionItemPassive
				:item="final.firstItem"
				:votes="votes.filter(v => v.selectionId === final.firstItem?.id)"
				:is-favorite="sessionStore.session.favorite?.id === final.firstItem?.id"
				:is-public="sessionStore.session.quiz.published"
			/>
			<SessionItemPassive
				:item="final.secondItem"
				:votes="votes.filter(v => v.selectionId === final.secondItem?.id)"
				:is-favorite="sessionStore.session.favorite?.id === final.secondItem?.id"
				:is-public="sessionStore.session.quiz.published"
			/>
		</div>

		<UButton
			class="!bg-[#ff795e] !text-[#26131a] hover:!bg-[#ff927d]"
			@click="navigateTo('/')"
		>
			Ana sayfaya dön
		</UButton>
	</div>
</template>

<script setup>
import { useSessionStore } from '~/store/session'
const sessionStore = useSessionStore()

const final = computed(() => sessionStore.final)
const votes = computed(() => sessionStore.final.votes)
</script>
