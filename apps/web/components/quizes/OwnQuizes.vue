<template>
	<UCard
		:ui="{
			base: 'fk-surface overflow-hidden rounded-2xl',
			header: 'border-[#fff4df]/10 px-5 py-4 font-semibold text-[#fff4df]',
			body: 'p-5',
			footer: 'border-[#fff4df]/10 px-5 py-4 text-[#a69baa]',
		}"
	>
		<template #header> Senin Eklediğin Quizler </template>

		<div v-if="quizes?.length === 0"> Henüz quiz eklemediniz. </div>

		<div v-else class="flex min-w-full gap-4 overflow-x-auto py-2">
			<template v-for="quiz of quizes" :key="quiz.id">
				<button
					type="button"
					class="group relative flex min-w-fit flex-col overflow-hidden rounded-2xl border border-[#fff4df]/10 bg-[#120f1a] p-1.5 text-left transition hover:-translate-y-0.5 hover:border-[#ff795e]/60"
					:aria-label="`${quiz.title} quizini düzenle`"
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
					<span
						class="absolute left-3.5 top-3.5 rounded-full border px-2 py-0.5 text-xs font-semibold backdrop-blur"
						:class="
							quiz.published
								? 'border-emerald-400/40 bg-emerald-500/80 text-white'
								: 'border-gray-600 bg-gray-950/80 text-gray-300'
						"
					>
						{{ quiz.published ? 'Yayında' : 'Taslak' }}
					</span>
					<Image
						:file="quiz?.cover"
						:is-public="quiz.published"
						:width="640"
						class="aspect-default h-[200px]"
					/>
					<div class="h-[60px] w-[280px] p-3 text-sm">
						<span class="line-clamp-2 text-ellipsis text-gray-300">
							{{ quiz.title }}
						</span>
					</div>
					<div class="flex items-center gap-1.5 px-3 pb-3 text-xs text-gray-500">
						<UIcon name="heroicons:play-circle" :size="17" />
						{{ quiz.sessionCount ?? 0 }} oturum
					</div>
				</button>
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
