<template>
	<div class="flex min-h-full w-full max-w-full items-center justify-center">
		<UNotifications />
		<LoadingSpinner v-if="useLoading.isLoading()" />
		<slot />
	</div>
</template>

<script setup></script>
