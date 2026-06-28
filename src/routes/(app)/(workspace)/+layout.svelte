<script lang="ts">
	import { onDestroy } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { cn } from '$lib/utils';
	import { setHeaderTabs, clearHeaderTabs } from '$lib/stores/headerTabs.svelte';
	import * as haptics from '$lib/haptics';

	let { children } = $props();

	const tabs = [
		{ href: '/journal', label: 'Journal' },
		{ href: '/notes', label: 'Notes' },
		{ href: '/todos', label: 'To-dos' },
		{ href: '/goals', label: 'Goals' }
	];

	// Publish to the desktop top bar; keep an in-content row for phones.
	setHeaderTabs(tabs);
	onDestroy(clearHeaderTabs);

	function active(href: string): boolean {
		const p = page.url.pathname;
		return p === href || p.startsWith(href + '/');
	}

	// Horizontal swipe moves between sub-tabs (swipe right → next, left → prev),
	// i.e. journal → notes → to-dos → goals when sliding right.
	const SWIPE_PX = 60;
	let sx = 0;
	let sy = 0;
	let tracking = false;

	function swipeDown(e: PointerEvent) {
		if (e.pointerType === 'mouse' && e.button !== 0) return;
		sx = e.clientX;
		sy = e.clientY;
		tracking = true;
	}
	function swipeUp(e: PointerEvent) {
		if (!tracking) return;
		tracking = false;
		const dx = e.clientX - sx;
		const dy = e.clientY - sy;
		// Only a deliberate horizontal swipe — ignore taps and vertical scrolls.
		if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) < Math.abs(dy) * 1.8) return;
		const cur = tabs.findIndex((t) => active(t.href));
		if (cur < 0) return;
		const next = cur + (dx > 0 ? 1 : -1);
		if (next < 0 || next >= tabs.length) return;
		haptics.tick();
		goto(tabs[next].href);
	}
</script>

<div class="flex h-full flex-col gap-4">
	<nav class="flex shrink-0 flex-wrap gap-1 border-b border-border pb-2 md:hidden">
		{#each tabs as t (t.href)}
			<a
				href={t.href}
				class={cn(
					'rounded-md px-3 py-1.5 text-sm transition-colors',
					active(t.href)
						? 'bg-secondary font-medium text-secondary-foreground'
						: 'text-muted-foreground hover:bg-secondary/50'
				)}
			>
				{t.label}
			</a>
		{/each}
	</nav>
	<div
		class="min-h-0 flex-1 overflow-auto"
		onpointerdown={swipeDown}
		onpointerup={swipeUp}
		onpointercancel={() => (tracking = false)}
	>
		{@render children()}
	</div>
</div>
