<template>
	<div
		class="relative flex min-h-full w-full items-center justify-center overflow-hidden px-5 py-10 sm:px-8 lg:px-12"
	>
		<div
			class="pointer-events-none absolute -left-32 top-[-6rem] h-96 w-96 rounded-full bg-[#ff795e]/10 blur-[120px]"
		/>
		<div
			class="pointer-events-none absolute -right-32 bottom-[-8rem] h-[28rem] w-[28rem] rounded-full bg-[#c8b7ff]/10 blur-[120px]"
		/>
		<UNotifications />
		<LoadingSpinner v-if="useLoading.isLoading()" />
		<div
			class="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-[#fff4df]/10 bg-[#1d1728]/80 shadow-2xl shadow-black/30 lg:grid-cols-[0.9fr_1.1fr]"
		>
			<aside class="hidden flex-col justify-between bg-[#271c35] p-10 lg:flex">
				<div>
					<NuxtLink to="/" class="flex items-center gap-2.5">
						<span
							class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-[#742222]"
							><img src="/brand.svg" alt="Fikifor" class="h-10 w-10"
						/></span>
						<span class="text-2xl font-bold tracking-[-0.04em] text-[#fff4df]"
							>FIKIFOR</span
						>
					</NuxtLink>
					<p class="fk-eyebrow mt-24">Karar vermek daha güzel</p>
					<h1 class="fk-display mt-4 text-5xl"
						>Birlikte seç,<br /><span class="text-[#ff795e]">birlikte kutla.</span></h1
					>
					<p class="mt-6 max-w-xs text-sm leading-7 text-[#a69baa]"
						>Listelerini arkadaşlarınla paylaş, oylama odalarında ortak bir favori bul.</p
					>
				</div>
				<div class="flex items-center gap-3 text-sm text-[#a69baa]"
					><span class="h-2 w-2 rounded-full bg-[#9fe0c1]" /> Fikifor topluluğuna
					katıl</div
				>
			</aside>
			<div class="flex items-center justify-center p-5 sm:p-10"><slot /></div>
		</div>
	</div>
</template>

<script setup></script>
