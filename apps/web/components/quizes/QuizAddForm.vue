<template>
	<input
		ref="CoverSelector"
		type="file"
		accept="image/*"
		class="hidden"
		maxlength="1"
		@change="setImage"
	/>
	<div class="flex min-h-full flex-col overflow-y-auto bg-[#120f1a] text-[#a69baa]">
		<div class="border-b border-[#fff4df]/10 bg-[#1d1728]/80 p-6">
			<p class="fk-eyebrow">Yeni liste</p>
			<h2 class="fk-display mt-2 text-2xl">Quiz ekle</h2>
			<p class="mt-2 text-sm leading-6 text-[#a69baa]">
				İnsanların birlikte oynayacağı listeyi birkaç adımda hazırla.
			</p>
		</div>

		<div class="flex min-h-0 flex-1 flex-col">
			<div class="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-5 sm:p-6">
				<button
					type="button"
					class="group min-h-[160px] overflow-hidden rounded-2xl border border-dashed border-[#fff4df]/20 bg-[#1f182a] text-left transition hover:border-[#ff795e]/70 hover:bg-[#271c35]"
					aria-label="Quiz kapak resmi seç"
					@click="() => $refs.CoverSelector.click()"
				>
					<div
						v-if="!payload.coverFile"
						class="flex h-full w-full flex-col items-center justify-center gap-3 p-10"
					>
						<span
							class="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ff795e]/15 text-[#ff927d] transition group-hover:scale-105"
						>
							<UIcon name="mage:image" :size="28" />
						</span>
						<span class="max-w-[240px] text-center font-semibold text-[#fff4df]">
							Kapak görseli ekle
						</span>
						<span class="text-center text-xs text-[#a69baa]"
							>JPG, PNG veya WEBP · Listeyi anlatan bir kare seç</span
						>
					</div>
					<img v-else class="w-full object-cover" :src="payload.coverSrc" />
				</button>

				<label class="space-y-2">
					<span class="text-sm font-semibold text-[#fff4df]">Liste adı</span>
					<UInput
						v-model="payload.title"
						placeholder="Örn. İstanbul'un en iyi kahveleri"
						class="w-full"
					/>
				</label>

				<label class="space-y-2">
					<span class="text-sm font-semibold text-[#fff4df]">Kısa açıklama</span>
					<UTextarea
						v-model="payload.description"
						placeholder="Bu listeyi oynayanlar neyi keşfedecek?"
						class="w-full"
					/>
				</label>

				<div class="space-y-3">
					<span class="text-sm font-semibold text-[#fff4df]">Liste boyutu</span>
					<URadioGroup
						v-model="payload.size"
						:options="[
							{ value: 32, label: '32 seçenek' },
							{ value: 64, label: '64 seçenek' },
							{ value: 128, label: '128 seçenek' },
						]"
					/>
				</div>
			</div>

			<div
				class="grid shrink-0 grid-cols-2 gap-3 border-t border-[#fff4df]/10 bg-[#1d1728]/95 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:p-5"
			>
				<UButton
					variant="outline"
					class="fk-button-secondary !rounded-xl !border-0"
					@click="emit('close')"
				>
					İptal
				</UButton>
				<UButton
					variant="solid"
					class="fk-button-primary !rounded-xl !border-0"
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
