<template>
	<div
		class="fk-shell relative flex min-h-full w-full max-w-full items-center justify-center overflow-hidden px-3 py-6 sm:px-6 sm:py-10"
	>
		<div
			class="pointer-events-none absolute left-1/2 top-0 -z-10 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-[#ff795e]/10 blur-[120px]"
		/>
		<UNotifications />
		<LoadingSpinner v-if="useLoading.isLoading()" />
		<slot />
	</div>
</template>

<script setup></script>
