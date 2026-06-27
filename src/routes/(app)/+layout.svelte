<script lang="ts">
	import FloatingPanel from '$lib/components/layout/FloatingPanel.svelte';
	import AppSidebar from '$lib/components/layout/AppSidebar.svelte';
	import MobileNav from '$lib/components/layout/MobileNav.svelte';
	import MobileTopBar from '$lib/components/layout/MobileTopBar.svelte';
	import QuickAdd from '$lib/components/finance/QuickAdd.svelte';
	import { onMount } from 'svelte';
	import { useQueryClient } from '@tanstack/svelte-query';
	import { initFinanceSync } from '$lib/finance/sync';

	let { children } = $props();

	const qc = useQueryClient();
	onMount(() => initFinanceSync(() => qc.invalidateQueries({ queryKey: ['finance'] })));
</script>

<div class="flex h-dvh flex-col md:flex-row md:gap-2 md:p-2" style="scrollbar-gutter: stable;">
	<aside class="hidden shrink-0 md:block md:w-64">
		<FloatingPanel class="h-full"><AppSidebar /></FloatingPanel>
	</aside>

	<main class="flex min-h-0 min-w-0 flex-1 flex-col">
		<MobileTopBar />
		<div
			class="kn-enter min-h-0 flex-1 overflow-auto bg-card p-4 pb-[calc(5.25rem+env(safe-area-inset-bottom))] md:rounded-xl md:border md:border-border/60 md:pb-4 md:shadow-sm"
		>
			{@render children()}
		</div>
	</main>

	<MobileNav />
</div>

<QuickAdd />
