<template>
	<div class="flex h-full w-full items-center justify-center">
		<ClientOnly>
			<LoginForm />
		</ClientOnly>
	</div>
</template>

<script setup>
useSeoMeta({
	title: 'Giriş Yap · Fikifor',
	description: 'Fikifor hesabına giriş yap.',
	robots: 'noindex, nofollow',
})
definePageMeta({ layout: 'auth' })
</script>
