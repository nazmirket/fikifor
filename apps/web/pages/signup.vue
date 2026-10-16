<template>
	<div class="flex h-full w-full items-center justify-center">
		<ClientOnly>
			<SignupForm />
		</ClientOnly>
	</div>
</template>

<script setup>
useSeoMeta({
	title: 'Hesap Oluştur · Fikifor',
	description: 'Fikifor ile arkadaşlarınla birlikte seçim yapmaya başla.',
	robots: 'noindex, nofollow',
})
definePageMeta({ layout: 'auth' })
</script>
