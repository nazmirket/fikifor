<template>
	<input
		ref="CoverSelector"
		type="file"
		accept="image/*"
		class="hidden"
		maxlength="1"
		@change="updateCover"
	/>

	<div
		class="flex h-[76px] items-center justify-between border-b border-[#fff4df]/10 bg-[#1d1728]/85 p-4 sm:p-5"
	>
		<div class="flex items-center gap-2">
			<UPopover>
				<button
					type="button"
					class="fk-button-secondary inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm"
				>
					<span>Diğer</span>
					<UIcon name="heroicons:chevron-down" :size="24" />
				</button>

				<template #panel>
					<div
						class="min-w-[180px] rounded-xl border border-[#fff4df]/10 bg-[#271c35] p-1.5 shadow-2xl"
					>
						<button
							type="button"
							class="flex w-full items-center gap-1.5 rounded-lg p-3 text-left text-sm text-[#fff4df] transition hover:bg-[#fff4df]/10 hover:text-[#c8b7ff]"
							@click="isBulkUpdateFormVisible = true"
						>
							<UIcon name="ph:note-pencil" :size="20" />
							<span>Toplu güncelleme</span>
						</button>
					</div>
				</template>
			</UPopover>
		</div>

		<button
			type="button"
			class="rounded-lg px-3 py-2 text-sm font-semibold text-[#c8b7ff] transition hover:bg-[#fff4df]/10 hover:text-[#fff4df]"
			@click="emit('close')"
			>Kapat</button
		>
	</div>
	<div
		class="flex w-full divide-x divide-[#fff4df]/10 bg-[#120f1a] max-md:divide-x-0 max-md:divide-y max-md:divide-[#fff4df]/10 max-sm:flex-col"
	>
		<div class="flex min-w-fit flex-col p-4 sm:p-5 lg:w-[360px]">
			<div class="flex flex-col items-center gap-3">
				<button
					type="button"
					class="group flex min-w-fit overflow-hidden rounded-2xl border border-dashed border-[#fff4df]/20 bg-[#1f182a] transition hover:border-[#ff795e]/70"
					aria-label="Quiz kapak görselini değiştir"
					@click="() => $refs.CoverSelector.click()"
				>
					<Image
						v-if="quiz?.cover"
						:key="quiz?.cover?.name"
						:file="quiz?.cover"
						:is-public="quiz.published"
						:width="640"
						class="aspect-default h-[200px]"
					/>
					<div
						v-else
						class="aspect-default flex w-full items-center justify-center text-[#a69baa]"
						>Kapak görseli ekle</div
					>
				</button>

				<div class="flex w-full flex-col gap-3">
					<div
						class="rounded-xl border p-4"
						:class="
							quiz.published
								? 'border-[#9fe0c1]/30 bg-[#9fe0c1]/10'
								: 'border-[#fff4df]/10 bg-[#1f182a]'
						"
					>
						<div class="flex items-center justify-between gap-3">
							<div>
								<p
									class="font-semibold"
									:class="quiz.published ? 'text-[#9fe0c1]' : 'text-[#fff4df]'"
								>
									{{ quiz.published ? 'Bu liste yayında' : 'Bu liste taslak' }}
								</p>
								<p class="mt-1 text-xs leading-5 text-[#a69baa]">
									<template v-if="quiz.published">
										Herkes keşfedebilir ve oyun odası açabilir.
									</template>
									<template v-else-if="missingImageCount">
										Yayınlamak için {{ missingImageCount }} seçeneğe daha görsel ekle.
									</template>
									<template v-else> Liste yayınlanmaya hazır. </template>
								</p>
							</div>
							<UIcon
								:name="quiz.published ? 'heroicons:globe-alt' : 'heroicons:lock-closed'"
								:class="quiz.published ? 'text-[#9fe0c1]' : 'text-[#a69baa]'"
								:size="26"
							/>
						</div>
						<UButton
							class="fk-button-primary mt-4 !rounded-xl !border-0"
							:color="quiz.published ? 'red' : 'orange'"
							:variant="quiz.published ? 'outline' : 'solid'"
							:loading="publishing"
							:disabled="!quiz.published && missingImageCount > 0"
							:class="{
								'cursor-not-allowed opacity-50': !quiz.published && missingImageCount > 0,
							}"
							@click="togglePublish"
						>
							{{ quiz.published ? 'Yayından Kaldır' : 'Listeyi Yayınla' }}
						</UButton>
					</div>

					<label class="w-full space-y-2">
						<span class="text-sm font-semibold text-[#fff4df]">Liste adı</span>
						<UInput v-model="payload.title" placeholder="Quiz başlığı" class="w-full" />
					</label>
					<label class="w-full space-y-2">
						<span class="text-sm font-semibold text-[#fff4df]">Kısa açıklama</span>
						<UTextarea
							v-model="payload.description"
							placeholder="Quiz açıklaması"
							class="w-full"
						/>
					</label>
					<UButton
						variant="solid"
						class="fk-button-secondary !rounded-xl !border-0"
						:disabled="!payload.title || !payload.description"
						@click="updateInfo"
					>
						Kaydet
					</UButton>
					<UButton
						variant="solid"
						class="fk-button-primary !rounded-xl !border-0"
						@click="createSession"
					>
						Başlat
					</UButton>
				</div>
			</div>
		</div>

		<div
			class="grid w-full grid-cols-4 gap-4 overflow-y-auto bg-[#120f1a] p-4 max-xl:grid-cols-2 max-lg:grid-cols-1 sm:p-5"
		>
			<template v-for="item of quiz.items" :key="item.id">
				<QuizItemUpdateForm :item="item" :quiz-id="quiz.id" :is-public="quiz.published" />
			</template>
		</div>
	</div>

	<UModal v-model="isBulkUpdateFormVisible" :prevent-close="true" fullscreen>
		<div class="flex h-full flex-col bg-[#120f1a] text-[#a69baa]">
			<div
				class="flex items-center justify-between border-b border-[#fff4df]/10 bg-[#1d1728] p-3 sm:p-4"
			>
				<span class="font-semibold text-[#fff4df]">Toplu güncelleme</span>
				<div class="flex gap-3">
					<UButton
						variant="solid"
						class="fk-button-primary w-fit !rounded-xl !border-0"
						@click="bulkUpdate"
					>
						Başlıkları Güncelle
					</UButton>
					<UButton
						variant="solid"
						class="fk-button-secondary w-fit !rounded-xl !border-0"
						@click="isBulkUpdateFormVisible = false"
					>
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
const publishing = ref(false)

const emit = defineEmits(['close', 'reload'])

const bulkItemPayload = ref({
	text: '',
})

const payload = ref({
	title: props.quiz.title,
	description: props.quiz.description,
})

const missingImageCount = computed(
	() => props.quiz.items.filter(item => !item.image).length,
)

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

function togglePublish() {
	useAsync(
		async () => {
			publishing.value = true
			try {
				if (props.quiz.published) {
					await quizStore.unpublishQuiz(props.quiz.id)
				} else {
					await quizStore.publishQuiz(props.quiz.id)
				}
				await quizStore.getMyQuizes()
				emit('reload')
			} finally {
				publishing.value = false
			}
		},
		{ setLoader: useLoading.set },
	)
}
</script>
