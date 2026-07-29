<template>
	<div class="flex flex-col gap-6 p-3">
		<div class="rounded-lg border bg-gray-900 p-3">
			<span> FIKIFOR'e Hoşgeldiniz</span>
		</div>

		<PublishedQuizes />
		<OwnQuizes />
	</div>
</template>

<script setup>
useSeoMeta({ title: 'FIKIFOR' })
definePageMeta({ layout: 'panel' })
</script>
