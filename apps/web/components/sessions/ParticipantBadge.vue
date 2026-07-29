<template>
	<div
		class="flex items-center gap-1 rounded-full border bg-gray-900 py-2 pl-2.5 pr-4 max-sm:py-1 max-sm:pl-1.5 max-sm:pr-2.5"
		:class="{
			'border-green-700 border-opacity-80': participant.online,
			'border-red-700 border-opacity-80': !participant.online,
		}"
	>
		<UIcon name="flowbite:user-solid" :size="20" />
		<span class="text-sm font-medium"> {{ participant.user?.username }} </span>
	</div>
</template>

<script setup>
defineProps({
	participant: {
		type: Object,
		required: true,
	},
})
</script>
