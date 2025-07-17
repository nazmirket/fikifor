<template>
	<div
		class="flex flex-col divide-y rounded-lg border bg-gray-900"
		:class="{
			'bg-grd divide-y-2 divide-amber-500 border-2 !border-amber-500': isFavorite,
		}"
	>
		<div class="flex h-[50px] flex-wrap gap-1 p-2">
			<span
				v-for="v of votes"
				:key="v.id"
				class="flex h-fit items-center gap-1 rounded-full border bg-gray-950 p-1 px-2 pr-3 text-sm"
			>
				<UIcon name="flowbite:user-solid" :size="18" />
				{{ v?.participant.user.username }}
			</span>
		</div>
		<div class="p-3">
			<Image
				v-if="item.image"
				:file="item.image"
				:class="{
					'border-2 !border-amber-500': isFavorite,
				}"
				class="aspect-default w-full"
			/>
			<div
				v-else
				class="aspect-default flex items-center justify-center rounded-lg bg-white bg-opacity-20"
			>
				<UIcon
					name="heroicons-solid:exclamation"
					class="text-gray-900 text-opacity-25"
					:size="42"
				/>
			</div>
		</div>
		<div class="flex w-full p-3">
			<span
				class="w-full text-center text-lg text-gray-300"
				:class="{
					'!text-amber-900': isFavorite,
				}"
			>
				{{ item.title }}
			</span>
		</div>
	</div>
</template>

<script setup>
import { useSessionStore } from '~/store/session'
const sessionStore = useSessionStore()

const props = defineProps({
	item: {
		type: Object,
		required: true,
	},
	votes: {
		type: Array,
		required: true,
	},
	isFavorite: {
		type: Boolean,
		default: false,
	},
})
</script>

<style scoped>
.bg-grd {
	background: rgb(255, 178, 0);
	background: linear-gradient(
		90deg,
		rgba(255, 178, 0, 1) 0%,
		rgba(255, 198, 0, 1) 49%,
		rgba(255, 238, 86, 1) 100%
	);
}
</style>
