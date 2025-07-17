<template>
	<UCard>
		<template #header> Senin Eklediğin Quizler </template>

		<div v-if="quizes?.length === 0"> Henüz quiz eklemediniz. </div>

		<div v-else class="flex min-w-full gap-4 overflow-x-auto py-2">
			<template v-for="quiz of quizes" :key="quiz.id">
				<div
					class="group relative flex min-w-fit cursor-pointer flex-col overflow-hidden rounded-lg border bg-gray-950 p-1.5 hover:border-indigo-500"
					@click="
						() => {
							selected = quiz
							isUpdateFormVisible = true
						}
					"
				>
					<span
						class="absolute right-3.5 top-3.5 flex items-center justify-center rounded-full border border-gray-400 px-2 py-0.5"
						:class="{
							'bg-indigo-500 text-white': quiz.size === 32,
							'bg-indigo-700 text-white': quiz.size === 64,
							'bg-indigo-900 text-white': quiz.size === 128,
						}"
					>
						<span class="text-xs font-medium"> Liste boyutu {{ quiz.size }} </span>
					</span>
					<Image :file="quiz?.cover" class="aspect-default h-[200px]" />
					<div class="h-[60px] w-[280px] p-3 text-sm">
						<span class="line-clamp-2 text-ellipsis text-gray-300">
							{{ quiz.title }}
						</span>
					</div>
				</div>
			</template>
		</div>

		<template #footer>
			<div class="flex items-center justify-between gap-3">
				<span> Toplam {{ quizes.length }} Quiz </span>

				<UButton class="w-[150px]" @click="() => (isCreateFormVisible = true)">
					Yeni Quiz Ekle
				</UButton>
			</div>
		</template>
	</UCard>

	<USlideover v-model="isCreateFormVisible" side="right">
		<QuizAddForm
			@close="
				() => {
					isCreateFormVisible = false
					load()
				}
			"
		/>
	</USlideover>

	<UModal v-model="isUpdateFormVisible" :prevent-close="true" fullscreen>
		<div class="flex h-full flex-col overflow-y-auto">
			<QuizEditForm
				:key="UpdateKey"
				:quiz="selected"
				@close="
					() => {
						isUpdateFormVisible = false
						load()
					}
				"
				@reload="
					() => {
						selected = quizes.find(q => q.id === selected.id)
						UpdateKey++
					}
				"
			/>
		</div>
	</UModal>
</template>

<script setup>
import { useQuizStore } from '~/store/quizes'
const quizStore = useQuizStore()

const selected = ref()

const UpdateKey = ref(0)

const isUpdateFormVisible = ref(false)
const isCreateFormVisible = ref(false)

function load() {
	useAsync(async () => await quizStore.getMyQuizes(), {
		setLoader: useLoading.set,
	})
}

const quizes = computed(() => quizStore.myQuizes)

onMounted(() => load())
</script>
