<template>
	<div
		v-if="match"
		ref="Container"
		:key="match?.id"
		class="flex w-full gap-6 transition-all duration-1000 max-sm:flex-col max-sm:gap-2"
	>
		<SessionItem
			ref="Node1"
			class="w-1/2 overflow-hidden max-sm:w-full"
			:item="firstItem"
			:votes="voters1"
			:completed="match.completed"
			@vote="() => vote(firstItem.id)"
		/>
		<SessionItem
			ref="Node2"
			class="w-1/2 overflow-hidden max-sm:w-full"
			:item="secondItem"
			:votes="voters2"
			:completed="match.completed"
			@vote="() => vote(secondItem.id)"
		/>
	</div>
</template>

<script setup>
import lodash from 'lodash'
import { useSessionStore } from '~/store/session'
const sessionStore = useSessionStore()

const Node1 = ref()
const Node2 = ref()
const Container = ref()

const match = computed(() => lodash.cloneDeep(sessionStore.match))
const votes = computed(() => match.value?.votes)

const firstItem = computed(() => match.value.firstItem)
const secondItem = computed(() => match.value.secondItem)

const voters1 = computed(() =>
	votes.value?.filter(v => v.selectionId === firstItem.value.id),
)

const voters2 = computed(() =>
	votes.value?.filter(v => v.selectionId === secondItem.value.id),
)

function vote(itemId) {
	useSocket().emit('session:vote', {
		matchId: match.value.id,
		order: match.value.order,
		participantId: sessionStore.participation.id,
		itemId,
	})
}

watch(
	match,
	(n, o) => {
		if (o && !o?.completed && n?.completed) {
			// If first item has more votes
			if (voters1.value.length > voters2.value.length) {
				Node1.value.win()
				Node2.value.lose()
				setTimeout(() => {
					Node2.value.$el.style.width = '0%'
					Node2.value.$el.style.borderWidth = '0px'
					Node2.value.$el.style.padding = '0px'
					Container.value.style.columnGap = '0px'
					Container.value.style.rowGap = '0px'
					Node1.value.$el.style.width = '100%'
				}, 500)
			}
			// If second item has more votes
			else if (voters2.value.length > voters1.value.length) {
				Node2.value.win()
				Node1.value.lose()
				setTimeout(() => {
					Node1.value.$el.style.width = '0%'
					Node1.value.$el.style.borderWidth = '0px'
					Node1.value.$el.style.padding = '0px'
					Container.value.style.columnGap = '0px'
					Container.value.style.rowGap = '0px'
					Node2.value.$el.style.width = '100%'
				}, 500)
			}
		}
	},
	{ deep: true, immediate: true },
)
</script>
