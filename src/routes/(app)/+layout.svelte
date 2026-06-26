<script lang="ts">
	import TwoColumnLayout from '$lib/components/layout/TwoColumnLayout.svelte';
	import AppSidebar from '$lib/components/layout/AppSidebar.svelte';
	import FloatingPanel from '$lib/components/layout/FloatingPanel.svelte';
	import QuickAdd from '$lib/components/finance/QuickAdd.svelte';
	import { onMount } from 'svelte';
	import { useQueryClient } from '@tanstack/svelte-query';
	import { initFinanceSync } from '$lib/finance/sync';

	let { children } = $props();

	const qc = useQueryClient();
	onMount(() => initFinanceSync(() => qc.invalidateQueries({ queryKey: ['finance'] })));
</script>

<TwoColumnLayout>
	{#snippet sidebar()}
		<FloatingPanel class="h-full">
			<AppSidebar />
		</FloatingPanel>
	{/snippet}
	{#snippet main()}
		<FloatingPanel class="kn-enter h-full p-4">
			{@render children()}
		</FloatingPanel>
	{/snippet}
</TwoColumnLayout>

<QuickAdd />
