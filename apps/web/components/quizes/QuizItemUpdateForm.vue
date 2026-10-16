<template>
	<input
		ref="ImageSelector"
		type="file"
		accept="image/*"
		class="hidden"
		maxlength="1"
		@change="setImage"
	/>
	<div class="fk-surface flex w-full flex-col gap-3 rounded-2xl p-3">
		<div
			class="aspect-default relative min-h-[100px] overflow-hidden rounded-xl border border-[#fff4df]/10 bg-[#271c35] object-cover"
		>
			<div
				v-if="isLinkInputVisible"
				class="absolute bottom-0 left-0 right-0 top-0 z-50 flex items-center justify-center bg-[#1d1728]/95 p-6"
			>
				<UInput
					v-model="link"
					placeholder="Link..."
					class="w-full"
					:ui="{ base: '!overflow-hidden !pr-[110px]' }"
				>
					<template #trailing>
						<UButton
							:disabled="!link"
							variant="solid"
							:ui="{
								base: '!rounded-l-none !text-sm hover:!text-[#ff927d] !cursor-pointer !text-[#fff4df] !h-[45px] !w-[50px] !bg-transparent border-l border-[#fff4df]/10',
								color: 'indigo',
							}"
							@click="uploadLink"
						>
							<UIcon name="mage:check" :size="24" />
						</UButton>
						<UButton
							variant="solid"
							:ui="{
								base: '!rounded-l-none !text-sm !cursor-pointer hover:!text-[#ff927d] !text-[#fff4df] !h-[45px] !w-[50px] !bg-transparent border-l border-[#fff4df]/10',
								color: 'indigo',
							}"
							@click="isLinkInputVisible = false"
						>
							<UIcon name="mage:multiply" :size="20" />
						</UButton>
					</template>
				</UInput>
			</div>
			<div class="absolute right-0 top-0 flex gap-1.5 p-1.5">
				<button
					type="button"
					aria-label="Görsel bağlantısı ekle"
					title="Görsel bağlantısı ekle"
					class="flex h-[40px] w-[40px] items-center justify-center rounded-full border border-[#fff4df]/20 bg-[#120f1a]/90 text-[#fff4df] transition hover:border-[#c8b7ff] hover:text-[#c8b7ff]"
					@click="
						() => {
							isLinkInputVisible = true
							link = ''
						}
					"
				>
					<UIcon name="mage:link" :size="20" />
				</button>

				<button
					type="button"
					aria-label="Görsel yükle"
					title="Görsel yükle"
					class="flex h-[40px] w-[40px] items-center justify-center rounded-full border border-[#fff4df]/20 bg-[#120f1a]/90 text-[#fff4df] transition hover:border-[#ff795e] hover:text-[#ff927d]"
					@click="() => $refs.ImageSelector.click()"
				>
					<UIcon name="mage:upload" :size="20" />
				</button>
			</div>
			<div
				v-if="!item.image"
				class="flex h-full w-full flex-col items-center justify-center gap-3 p-3"
			>
				<UIcon name="mage:image" class="text-[#ff927d]" :size="48" />
				<span class="text-center text-sm text-[#c3b8c7]"
					>Bir görsel veya bağlantı ekle</span
				>
			</div>
			<Image
				v-else
				:file="item.image"
				:is-public="isPublic"
				:width="640"
				class="aspect-default h-full w-full"
			/>
		</div>
		<UInput
			v-model="payload.title"
			placeholder="Seçenek başlığı..."
			aria-label="Seçenek başlığı"
			:ui="{ base: '!overflow-hidden !pr-[90px]' }"
		>
			<template #trailing>
				<UButton
					:disabled="!payload.title"
					variant="solid"
					:ui="{
						base: '!rounded-l-none !text-sm !cursor-pointer !text-[#fff4df] hover:!text-[#ff927d] !h-[45px] !w-[80px] !bg-transparent border-l border-[#fff4df]/10',
						color: 'indigo',
					}"
					@click="update"
				>
					Kaydet
				</UButton>
			</template>
		</UInput>
	</div>
</template>

<script setup>
import { useQuizStore } from '~/store/quizes'
const quizStore = useQuizStore()

const isLinkInputVisible = ref(false)

const props = defineProps({
	quizId: {
		type: Number,
		required: true,
	},
	item: {
		type: Object,
		required: true,
	},
	isPublic: {
		type: Boolean,
		default: false,
	},
})

const link = ref('')

const payload = ref({
	title: props.item.title,
})

function setImage(event) {
	useAsync(
		async () => {
			const file = event.target.files[0]
			const formdata = new FormData()
			formdata.append('file', file)
			await quizStore.updateItemImage(props.quizId, props.item.id, formdata)
		},
		{ setLoader: useLoading.set },
	)
}

function uploadLink() {
	useAsync(
		async () => {
			await quizStore.updateItemImageLink(props.quizId, props.item.id, link.value)
			isLinkInputVisible.value = false
		},
		{ setLoader: useLoading.set },
	)
}

function update() {
	useAsync(
		async () =>
			await quizStore.updateItemInfo(props.quizId, props.item.id, payload.value),
		{ setLoader: useLoading.set },
	)
}
</script>
