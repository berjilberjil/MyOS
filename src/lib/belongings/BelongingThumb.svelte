<script lang="ts">
	import { signedBelongingUrl } from './belongings';
	import ImageOff from '@lucide/svelte/icons/image-off';
	let { path, alt = '' }: { path: string; alt?: string } = $props();

	let url = $state('');
	let failed = $state(false);

	$effect(() => {
		let active = true;
		failed = false;
		url = '';
		signedBelongingUrl(path)
			.then((u) => active && (url = u))
			.catch(() => active && (failed = true));
		return () => {
			active = false;
		};
	});
</script>

{#if failed}
	<div class="t fallback" title="Image unavailable"><ImageOff class="size-4" /></div>
{:else if url}
	<a class="t" href={url} target="_blank" rel="noopener" aria-label="Open photo">
		<img src={url} {alt} loading="lazy" onerror={() => (failed = true)} />
	</a>
{:else}
	<div class="t skeleton"></div>
{/if}

<style>
	.t {
		display: block;
		height: 100%;
		width: 100%;
	}
	img {
		height: 100%;
		width: 100%;
		object-fit: cover;
		display: block;
	}
	.fallback {
		display: grid;
		place-items: center;
		color: var(--muted-foreground);
		background: var(--muted);
	}
	.skeleton {
		background: linear-gradient(
			90deg,
			var(--muted),
			color-mix(in oklch, var(--muted) 55%, transparent),
			var(--muted)
		);
		background-size: 200% 100%;
		animation: shimmer 1.2s ease-in-out infinite;
	}
	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}
</style>
