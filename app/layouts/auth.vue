<template>
	<div class="flex min-h-full items-center justify-center">
		<UNotifications />
		<LoadingSpinner v-if="useLoading.isLoading()" />
		<slot />
	</div>
</template>

<script setup></script>
