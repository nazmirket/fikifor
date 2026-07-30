<template>
	<div class="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6">
		<div>
			<p class="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-400">
				İçerik alanın
			</p>
			<h1 class="mt-2 text-3xl font-bold text-gray-100">Listelerim</h1>
			<p class="mt-2 text-gray-500">
				Listelerini düzenle, yayın durumlarını yönet veya yeni bir oyun başlat.
			</p>
		</div>
		<OwnQuizes />
	</div>
</template>

<script setup lang="ts">
useSeoMeta({ title: 'Listelerim · Fikifor' })
definePageMeta({ layout: 'panel' })
</script>
