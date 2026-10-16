<template>
	<div
		class="flex flex-col divide-y divide-[#fff4df]/10 rounded-2xl border border-[#fff4df]/10 bg-[#1d1728]"
		:class="{
			'bg-grd divide-y-2 divide-[#ff795e] border-2 !border-[#ff795e]': isFavorite,
		}"
	>
		<div class="flex h-[50px] flex-wrap gap-1 p-2">
			<span
				v-for="v of votes"
				:key="v.id"
				class="flex h-fit items-center gap-1 rounded-full border border-[#fff4df]/10 bg-[#120f1a] p-1 px-2 pr-3 text-sm text-[#a69baa]"
			>
				<UIcon name="flowbite:user-solid" :size="18" />
				{{ v?.participant.user.username }}
			</span>
		</div>
		<div class="p-3">
			<Image
				v-if="item.image"
				:file="item.image"
				:is-public="isPublic"
				eager
				:class="{
					'border-2 !border-[#ff795e]': isFavorite,
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
				class="w-full text-center text-lg font-semibold text-[#fff4df]"
				:class="{
					'!text-[#26131a]': isFavorite,
				}"
			>
				{{ item.title }}
			</span>
		</div>
	</div>
</template>

<script setup>
defineProps({
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
	isPublic: {
		type: Boolean,
		default: false,
	},
})
</script>

<style scoped>
.bg-grd {
	background: rgb(255, 121, 94);
	background: linear-gradient(
		90deg,
		rgba(255, 121, 94, 1) 0%,
		rgba(255, 154, 118, 1) 49%,
		rgba(255, 218, 164, 1) 100%
	);
}
</style>
