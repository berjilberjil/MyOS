<script lang="ts">
	import { signedBelongingUrl } from './belongings';
	let { path, alt = '' }: { path: string; alt?: string } = $props();
	let url = $state('');
	$effect(() => {
		signedBelongingUrl(path)
			.then((u) => (url = u))
			.catch(() => {});
	});
</script>

{#if url}
	<img src={url} {alt} class="thumb" loading="lazy" />
{:else}
	<div class="thumb skeleton"></div>
{/if}

<style>
	.thumb {
		height: 100%;
		width: 100%;
		object-fit: cover;
		display: block;
	}
	.skeleton {
		background: var(--muted);
	}
</style>
