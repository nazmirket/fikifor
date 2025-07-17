<template>
	<input
		ref="CoverSelector"
		type="file"
		accept="image/*"
		class="hidden"
		maxlength="1"
		@change="updateCover"
	/>

	<div class="flex h-[60px] items-center justify-between border-b p-4">
		<div class="flex items-center gap-2">
			<UPopover>
				<span class="flex cursor-pointer items-center gap-1">
					<span> Diğer </span>
					<UIcon name="heroicons:chevron-down" :size="24" />
				</span>

				<template #panel>
					<div class="min-w-[150px] bg-gray-800">
						<a
							class="flex cursor-pointer items-center gap-1.5 p-3 hover:text-indigo-300"
							@click="isBulkUpdateFormVisible = true"
						>
							<UIcon name="ph:note-pencil" :size="20" />
							<span> Toplu Güncelleme </span>
						</a>
					</div>
				</template>
			</UPopover>
		</div>

		<a class="cursor-pointer" @click="emit('close')"> Kapat </a>
	</div>
	<div class="flex w-full divide-x max-md:divide-x-0 max-md:divide-y max-sm:flex-col">
		<div class="flex min-w-fit flex-col p-4">
			<div class="flex flex-col items-center gap-3">
				<div
					class="flex min-w-fit cursor-pointer"
					@click="() => $refs.CoverSelector.click()"
				>
					<Image
						v-if="quiz?.cover"
						:key="quiz?.cover?.name"
						:file="quiz?.cover"
						class="aspect-default h-[200px]"
					/>
					<div v-else class="aspect-default w-full" />
				</div>

				<div class="flex w-full flex-col gap-3">
					<UInput v-model="payload.title" placeholder="Quiz Başlığı" class="w-full" />
					<UTextarea
						v-model="payload.description"
						placeholder="Quiz Açıklaması"
						class="w-full"
					/>
					<UButton
						variant="solid"
						:disabled="!payload.title || !payload.description"
						@click="updateInfo"
					>
						Kaydet
					</UButton>
					<UButton variant="solid" color="green" @click="createSession"> Başlat </UButton>
				</div>
			</div>
		</div>

		<div
			class="grid w-full grid-cols-4 gap-3 overflow-y-auto p-3 max-xl:grid-cols-2 max-lg:grid-cols-1"
		>
			<template v-for="item of quiz.items" :key="item.id">
				<QuizItemUpdateForm :item="item" :quiz-id="quiz.id" />
			</template>
		</div>
	</div>

	<UModal v-model="isBulkUpdateFormVisible" :prevent-close="true" fullscreen>
		<div class="flex h-full flex-col">
			<div class="flex items-center justify-between border-b p-3">
				<span> Toplu Güncelleme </span>
				<div class="flex gap-3">
					<UButton variant="solid" class="w-fit" color="green" @click="bulkUpdate">
						Başlıkları Güncelle
					</UButton>
					<UButton variant="solid" class="w-fit" @click="isBulkUpdateFormVisible = false">
						Kapat
					</UButton>
				</div>
			</div>
			<div class="flex h-full p-3">
				<UTextarea
					v-model="bulkItemPayload.text"
					placeholder="Liste başlıklarını her satırda bir olacak şekilde giriniz..."
					class="h-full w-full"
					:ui="{ base: 'w-full h-full' }"
				/>
			</div>
		</div>
	</UModal>
</template>

<script setup>
import { useQuizStore } from '~/store/quizes'
const quizStore = useQuizStore()

const props = defineProps({
	quiz: {
		type: Object,
		required: true,
	},
})

const isBulkUpdateFormVisible = ref(false)

const emit = defineEmits(['close', 'reload'])

const bulkItemPayload = ref({
	text: '',
})

const payload = ref({
	title: props.quiz.title,
	description: props.quiz.description,
})

function updateCover(event) {
	useAsync(
		async () => {
			const file = event.target.files[0]
			const formdata = new FormData()
			formdata.append('file', file)
			await quizStore.updateQuizImage(props.quiz.id, formdata)
			await quizStore.getMyQuizes()
			emit('reload')
		},
		{ setLoader: useLoading.set },
	)
}

function bulkUpdate() {
	useAsync(
		async () => {
			const items = bulkItemPayload.value.text.split('\n').filter(s => s)
			await quizStore.bulkUpdateItems(props.quiz.id, items)
			await quizStore.getMyQuizes()
			isBulkUpdateFormVisible.value = false
			emit('reload')
		},
		{ setLoader: useLoading.set },
	)
}

function updateInfo() {
	useAsync(
		async () => {
			await quizStore.updateQuiz(props.quiz.id, {
				title: payload.value.title,
				description: payload.value.description,
			})
			await quizStore.getMyQuizes()
			emit('reload')
		},
		{ setLoader: useLoading.set },
	)
}

function createSession() {
	useAsync(
		async () => {
			const code = await quizStore.createSession(props.quiz.id)
			navigateTo(`/sessions/${code}`)
		},
		{ setLoader: useLoading.set },
	)
}
</script>
