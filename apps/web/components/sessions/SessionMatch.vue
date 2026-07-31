<template>
	<div
		v-if="match"
		:key="match?.id"
		class="match-stage w-full gap-6 max-sm:gap-2"
		:class="{
			'match-stage--first': winnerPosition === 'first',
			'match-stage--second': winnerPosition === 'second',
		}"
	>
		<SessionItem
			class="match-card overflow-hidden"
			:item="firstItem"
			:votes="voters1"
			:completed="match.completed"
			:status="itemStatus(firstItem.id)"
			:is-public="sessionStore.session?.quiz.published"
			@vote="() => vote(firstItem.id)"
		/>
		<SessionItem
			class="match-card overflow-hidden"
			:item="secondItem"
			:votes="voters2"
			:completed="match.completed"
			:status="itemStatus(secondItem.id)"
			:is-public="sessionStore.session?.quiz.published"
			@vote="() => vote(secondItem.id)"
		/>
	</div>
</template>

<script setup>
import { useSessionStore } from '~/store/session'
import { unlockGameAudio } from '~/utils/gameAudio'

const sessionStore = useSessionStore()

const match = computed(() => sessionStore.match)
const votes = computed(() => match.value?.votes)

const firstItem = computed(() => match.value?.firstItem)
const secondItem = computed(() => match.value?.secondItem)

const voters1 = computed(() =>
	votes.value?.filter(v => v.selectionId === firstItem.value?.id),
)

const voters2 = computed(() =>
	votes.value?.filter(v => v.selectionId === secondItem.value?.id),
)

const winnerPosition = computed(() => {
	if (!match.value?.completed || !match.value.winnerId) return
	return match.value.winnerId === firstItem.value?.id ? 'first' : 'second'
})

function itemStatus(itemId) {
	if (!match.value?.completed || !match.value.winnerId) return
	return match.value.winnerId === itemId ? 'win' : 'lose'
}

function vote(itemId) {
	if (!match.value || match.value.completed) return
	void unlockGameAudio()
	useSocket().emit('session:vote', {
		matchId: match.value.id,
		itemId,
	})
}
</script>

<style scoped>
.match-stage {
	display: grid;
	grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
	transition:
		grid-template-columns 700ms ease,
		gap 700ms ease;
}

.match-stage--first {
	grid-template-columns: minmax(0, 1fr) minmax(0, 0fr);
	gap: 0;
}

.match-stage--second {
	grid-template-columns: minmax(0, 0fr) minmax(0, 1fr);
	gap: 0;
}

.match-card {
	min-width: 0;
}

@media (max-width: 639px) {
	.match-stage {
		display: flex;
		flex-direction: column;
	}
}
</style>
