<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import { Toaster } from '$lib/components/ui/sonner';
	import { queryClient } from '$lib/data/query-client';
	import { initTheme } from '$lib/stores/theme.svelte';
	import { initProfile } from '$lib/stores/profile.svelte';
	import { flush } from '$lib/data/sync-queue';
	import { SupabaseRepository } from '$lib/data/repository';

	let { children } = $props();

	const resolveRepo = (table: string) => new SupabaseRepository<{ id: string }>(table);

	onMount(() => {
		initTheme();
		initProfile();
		const onOnline = () => flush(resolveRepo);
		addEventListener('online', onOnline);
		return () => removeEventListener('online', onOnline);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<QueryClientProvider client={queryClient}>
	{@render children()}
	<Toaster position="bottom-center" />
</QueryClientProvider>
