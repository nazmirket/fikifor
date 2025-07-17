<template>
	<input
		ref="ImageSelector"
		type="file"
		accept="image/*"
		class="hidden"
		maxlength="1"
		@change="setImage"
	/>
	<div class="flex w-full flex-col gap-2 rounded-lg border p-2">
		<div
			class="aspect-default relative min-h-[100px] overflow-hidden rounded-lg border bg-gray-900 object-cover"
		>
			<div
				v-if="isLinkInputVisible"
				class="absolute bottom-0 left-0 right-0 top-0 z-50 flex items-center justify-center bg-gray-900 p-6"
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
								base: '!rounded-l-none !text-sm hover:!text-indigo-500 !cursor-pointer !text-gray-300 !h-[45px] !w-[50px] !bg-transparent border-l',
								color: 'indigo',
							}"
							@click="uploadLink"
						>
							<UIcon name="mage:check" :size="24" />
						</UButton>
						<UButton
							variant="solid"
							:ui="{
								base: '!rounded-l-none !text-sm !cursor-pointer hover:!text-red-600 !text-gray-300 !h-[45px] !w-[50px] !bg-transparent border-l',
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
				<a
					class="flex h-[40px] w-[40px] cursor-pointer items-center justify-center rounded-full border border-gray-300 bg-gray-900 hover:border-indigo-500 hover:bg-gray-950 hover:text-indigo-500"
					@click="
						() => {
							isLinkInputVisible = true
							link = ''
						}
					"
				>
					<UIcon name="mage:link" :size="20" />
				</a>

				<a
					class="flex h-[40px] w-[40px] cursor-pointer items-center justify-center rounded-full border border-gray-300 bg-gray-900 hover:border-indigo-500 hover:text-indigo-500"
					@click="() => $refs.ImageSelector.click()"
				>
					<UIcon name="mage:upload" :size="20" />
				</a>
			</div>
			<div
				v-if="!item.image"
				class="flex h-full w-full flex-col items-center justify-center gap-3 p-3"
			>
				<UIcon name="mage:image" class="text-gray-400" :size="48" />
				<span class="text-center text-sm"> Resim yüklemek için tıkla </span>
			</div>
			<Image v-else :file="item.image" class="aspect-default h-full w-full" />
		</div>
		<UInput
			v-model="payload.title"
			placeholder="Başlık..."
			:ui="{ base: '!overflow-hidden !pr-[90px]' }"
		>
			<template #trailing>
				<UButton
					:disabled="!payload.title"
					variant="solid"
					:ui="{
						base: '!rounded-l-none !text-sm !cursor-pointer !text-gray-300 !h-[45px] !w-[80px] !bg-transparent border-l',
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
			await quizStore.updateItemImageLink(props.quizId, props.item.id, {
				link: link.value,
			})
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
