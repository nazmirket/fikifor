<template>
	<input
		ref="CoverSelector"
		type="file"
		accept="image/*"
		class="hidden"
		maxlength="1"
		@change="setImage"
	/>
	<div class="flex min-h-full flex-col overflow-y-auto bg-gray-950">
		<div class="border-b border-gray-800 p-6">
			<span class="text-lg"> Quiz Ekle </span>
		</div>

		<div class="flex h-full flex-col justify-between">
			<div class="flex h-full flex-col gap-6 p-4">
				<div
					class="min-h-[100px] cursor-pointer overflow-hidden rounded-lg border bg-gray-900 object-cover hover:border-indigo-600"
					@click="() => $refs.CoverSelector.click()"
				>
					<div
						v-if="!payload.coverFile"
						class="flex h-full w-full flex-col items-center justify-center gap-3 p-10"
					>
						<UIcon name="mage:image" class="text-gray-400" :size="48" />
						<span class="max-w-[200px] text-center">
							Quiz kapak resmi yüklemek için tıkla
						</span>
					</div>
					<img v-else class="w-full object-cover" :src="payload.coverSrc" />
				</div>

				<UInput v-model="payload.title" placeholder="Quiz Başlığı" class="w-full" />

				<UTextarea
					v-model="payload.description"
					placeholder="Quiz Açıklaması"
					class="w-full"
				/>

				<URadioGroup
					v-model="payload.size"
					:options="[
						{ value: 32, label: '32 Items' },
						{ value: 64, label: '64 Items' },
						{ value: 128, label: '128 Items' },
					]"
				/>
			</div>

			<div class="grid grid-cols-2 gap-3 border-t border-gray-800 p-4">
				<UButton variant="outline" @click="emit('close')"> İptal </UButton>
				<UButton
					variant="solid"
					:disabled="
						!payload.coverFile || !payload.title || !payload.description || !payload.size
					"
					@click="send"
				>
					Ekle
				</UButton>
			</div>
		</div>
	</div>
</template>

<script setup>
import { useQuizStore } from '~/store/quizes'
const quizStore = useQuizStore()

const emit = defineEmits(['close'])

const payload = ref({
	coverFile: null,
	coverSrc: null,

	title: '',
	description: '',
	size: 32,
})

function setImage(event) {
	payload.value.coverFile = event.target.files[0]
	payload.value.coverSrc = URL.createObjectURL(event.target.files[0])
}

function send() {
	useAsync(
		async function () {
			const formData = new FormData()
			formData.append('file', payload.value.coverFile)
			formData.append('title', payload.value.title)
			formData.append('description', payload.value.description)
			formData.append('size', payload.value.size)
			await quizStore.createQuiz(formData)
			emit('close')
		},
		{ setLoader: useLoading.set },
	)
}
</script>
