<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { setTheme, themeState, type Theme } from '$lib/stores/theme.svelte';

	const themes: Theme[] = ['light', 'dark', 'tui', 'system'];

	function cycle() {
		const i = themes.indexOf(themeState.current);
		const next = themes[(i + 1) % themes.length];
		themeState.current = next;
		setTheme(next);
	}

	const links = [
		{ href: '/', label: 'Dashboard' },
		{ href: '/finance', label: 'Finance' }
	];
</script>

<nav class="flex h-full flex-col gap-1 p-3">
	<div class="px-2 py-1 text-sm font-semibold tracking-tight">MyOS</div>
	<div class="kn-stagger mt-1 flex flex-col gap-0.5">
		{#each links as link (link.href)}
			<a href={link.href} class="rounded-lg px-2 py-1.5 text-base hover:bg-accent hover:text-accent-foreground">
				{link.label}
			</a>
		{/each}
	</div>
	<div class="mt-auto">
		<Button variant="ghost" size="sm" class="w-full justify-start" onclick={cycle} data-testid="theme-toggle">
			Theme: {themeState.current}
		</Button>
	</div>
</nav>
