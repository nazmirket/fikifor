<template>
	<div
		class="flex flex-col divide-y divide-[#fff4df]/10 rounded-2xl border border-[#fff4df]/10 bg-[#1d1728] transition-all duration-300"
		:class="{
			'!divide-[#ff795e]/40 !border-[#ff795e]/70 !bg-[#3a2638]': isVoted,
			'cursor-pointer hover:scale-[102%]': !completed,
			'vs-winner': status === 'win',
			'vs-loser': status === 'lose',
		}"
		@click="completed ? undefined : emit('vote')"
	>
		<div
			class="flex h-full min-h-[40px] p-2 max-sm:p-1.5"
			:class="{ 'border-[#ff795e]/40': isVoted }"
		>
			<div class="flex h-min flex-wrap gap-1">
				<span
					v-for="v in votes"
					:key="v.id"
					class="flex h-fit items-center gap-1 rounded-full border border-[#fff4df]/10 bg-[#120f1a] p-1 px-2 pr-3.5 text-sm text-[#a69baa]"
				>
					<UIcon name="flowbite:user-solid" :size="16" />
					<span class="whitespace-nowrap text-xs">
						{{ v?.participant?.user?.username }}
					</span>
				</span>
			</div>
		</div>
		<div class="p-3 max-sm:p-1.5">
			<Image
				v-if="item.image"
				:file="item.image"
				:is-public="isPublic"
				eager
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
		<div class="flex w-full p-3 max-sm:p-1.5">
			<span class="w-full text-center text-lg font-semibold text-[#fff4df]">
				{{ item.title }}
			</span>
		</div>
	</div>
</template>

<script setup>
import { useAuthStore } from '~/store/auth'
const authStore = useAuthStore()

const props = defineProps({
	item: {
		type: Object,
		required: true,
	},
	votes: {
		type: Array,
		required: true,
	},
	completed: {
		type: Boolean,
		default: false,
	},
	status: {
		type: String,
		default: undefined,
		validator: value => value === undefined || ['win', 'lose'].includes(value),
	},
	isPublic: {
		type: Boolean,
		default: false,
	},
})

const isVoted = computed(() => {
	const userId = authStore.user?.userId
	return (
		userId !== undefined && props.votes?.some(v => v.participant?.user?.id === userId)
	)
})

const emit = defineEmits(['vote'])
</script>
