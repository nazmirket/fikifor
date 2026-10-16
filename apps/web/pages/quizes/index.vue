<template>
	<div class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
		<PublishedQuizes />
	</div>
</template>

<script setup lang="ts">
const appUrl = useRuntimeConfig().public.APP_URL

useSeoMeta({
	title: 'Quizleri Keşfet · Fikifor',
	description: 'Topluluğun yayınladığı quizleri ara ve arkadaşlarınla oynamaya başla.',
	ogTitle: 'Quizleri keşfet · Fikifor',
	ogDescription: 'Topluluğun yayınladığı quizleri ara ve arkadaşlarınla oynamaya başla.',
	ogUrl: `${appUrl}/quizes`,
	ogImage: `${appUrl}/og-image.png`,
	ogImageAlt: 'Fikifor topluluk quizlerini keşfet',
	twitterImage: `${appUrl}/og-image.png`,
})
useHead({
	link: [{ rel: 'canonical', href: `${appUrl}/quizes` }],
})
definePageMeta({ layout: 'panel' })
</script>
