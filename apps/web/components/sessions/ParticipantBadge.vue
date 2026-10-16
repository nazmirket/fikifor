<template>
	<div
		class="flex items-center gap-1 rounded-full border bg-[#271c35] py-2 pl-2.5 pr-4 text-[#fff4df] max-sm:py-1 max-sm:pl-1.5 max-sm:pr-2.5"
		:class="{
			'border-[#9fe0c1]/60': participant.online,
			'border-[#ff795e]/40': !participant.online,
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
