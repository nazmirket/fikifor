<template>
	<div class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
		<PublishedQuizes />
	</div>
</template>

<script setup lang="ts">
useSeoMeta({
	title: 'Quizleri Keşfet · Fikifor',
	description: 'Topluluğun yayınladığı quizleri ara ve arkadaşlarınla oynamaya başla.',
})
definePageMeta({ layout: 'panel' })
</script>
