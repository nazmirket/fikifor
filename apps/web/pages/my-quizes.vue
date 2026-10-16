<template>
	<div class="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6">
		<div>
			<p class="fk-eyebrow"> İçerik alanın </p>
			<h1 class="fk-display mt-3 text-4xl sm:text-5xl">Listelerim</h1>
			<p class="mt-3 text-[#a69baa]">
				Listelerini düzenle, yayın durumlarını yönet veya yeni bir oyun başlat.
			</p>
		</div>
		<OwnQuizes />
	</div>
</template>

<script setup lang="ts">
useSeoMeta({
	title: 'Listelerim · Fikifor',
	description: 'Fikifor listelerini yönet.',
	robots: 'noindex, nofollow',
})
definePageMeta({ layout: 'panel' })
</script>
