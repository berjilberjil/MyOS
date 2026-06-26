<script lang="ts">
	import TwoColumnLayout from '$lib/components/layout/TwoColumnLayout.svelte';
	import AppSidebar from '$lib/components/layout/AppSidebar.svelte';
	import FloatingPanel from '$lib/components/layout/FloatingPanel.svelte';

	let { children } = $props();
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
