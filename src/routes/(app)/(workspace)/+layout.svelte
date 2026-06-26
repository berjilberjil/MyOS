<script lang="ts">
	import { page } from '$app/state';
	import { cn } from '$lib/utils';

	let { children } = $props();

	const tabs = [
		{ href: '/journal', label: 'Journal' },
		{ href: '/notes', label: 'Notes' },
		{ href: '/todos', label: 'To-dos' },
		{ href: '/goals', label: 'Goals' }
	];

	function active(href: string): boolean {
		const p = page.url.pathname;
		return p === href || p.startsWith(href + '/');
	}
</script>

<div class="flex h-full flex-col gap-4">
	<nav class="flex shrink-0 flex-wrap gap-1 border-b border-border pb-2">
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
	<div class="min-h-0 flex-1 overflow-auto">
		{@render children()}
	</div>
</div>
