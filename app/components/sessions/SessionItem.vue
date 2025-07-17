<template>
	<div
		class="flex flex-col divide-y rounded-lg border bg-gray-900 transition-all duration-300"
		:class="{
			'divide-indigo-700 border-indigo-700 bg-indigo-950': isVoted,
			'cursor-pointer hover:scale-[102%]': !completed,
			'vs-winner': status === 'win',
			'vs-loser': status === 'lose',
		}"
		@click="completed ? undefined : emit('vote')"
	>
		<div
			class="flex h-full min-h-[40px] p-2 max-sm:p-1.5"
			:class="{ 'border-indigo-700': isVoted }"
		>
			<div class="flex h-min flex-wrap gap-1">
				<span
					v-for="v in votes"
					:key="v.id"
					class="flex h-fit items-center gap-1 rounded-full border bg-gray-950 p-1 px-2 pr-3.5 text-sm"
				>
					<UIcon name="flowbite:user-solid" :size="16" />
					<span class="whitespace-nowrap text-xs">
						{{ v?.participant?.user?.username }}
					</span>
				</span>
			</div>
		</div>
		<div class="p-3 max-sm:p-1.5">
			<Image v-if="item.image" :file="item.image" class="aspect-default w-full" />
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
			<span class="w-full text-center text-lg text-gray-300">
				{{ item.title }}
			</span>
		</div>
	</div>
</template>

<script setup>
import { useAuthStore } from '~/store/auth'
const authStore = useAuthStore()

const status = ref()

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
})

const isVoted = computed(() =>
	props.votes?.some(v => v.participant?.user?.id === authStore.user.userId),
)

function win() {
	status.value = 'win'
	const audio = new Audio('/sounds/win.m4a')
	audio.play()
}

function lose() {
	status.value = 'lose'
}

const emit = defineEmits(['vote'])

defineExpose({ win, lose })
</script>
