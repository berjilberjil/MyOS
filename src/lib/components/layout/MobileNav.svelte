<script lang="ts">
	import { page } from '$app/state';
	import { NAV } from '$lib/nav';

	function isActive(item: { href: string; match?: string[] }): boolean {
		const p = page.url.pathname;
		if (item.href === '/') return p === '/';
		const paths = item.match ?? [item.href];
		return paths.some((h) => p === h || p.startsWith(h + '/'));
	}
</script>

<nav class="mnav md:hidden" aria-label="Primary">
	{#each NAV as item (item.href)}
		{@const Icon = item.icon}
		{@const active = isActive(item)}
		<a href={item.href} class="item" class:active aria-current={active ? 'page' : undefined}>
			<span class="bar" aria-hidden="true"></span>
			<Icon class="ic" />
			<span class="lbl">{item.label}</span>
		</a>
	{/each}
</nav>

<style>
	.mnav {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 40;
		display: flex;
		align-items: stretch;
		justify-content: space-around;
		gap: 1px;
		border-top: 1px solid var(--border);
		background: color-mix(in oklch, var(--card) 88%, transparent);
		backdrop-filter: blur(14px);
		padding: 5px 3px calc(5px + env(safe-area-inset-bottom));
	}
	.item {
		position: relative;
		display: flex;
		min-width: 0;
		flex: 1;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		border-radius: var(--radius-md);
		padding: 5px 2px 3px;
		font-size: 10px;
		line-height: 1;
		color: var(--muted-foreground);
		text-decoration: none;
		-webkit-tap-highlight-color: transparent;
	}
	.item.active {
		color: var(--primary);
	}
	.item:active {
		background: var(--accent);
	}
	.bar {
		position: absolute;
		top: -1px;
		left: 50%;
		height: 2.5px;
		width: 0;
		transform: translateX(-50%);
		border-radius: 9999px;
		background: var(--primary);
		transition: width var(--duration-normal) var(--ease-entrance);
	}
	.item.active .bar {
		width: 26px;
	}
	.item :global(.ic) {
		height: 21px;
		width: 21px;
	}
	.item.active :global(.ic) {
		color: var(--primary);
	}
	.lbl {
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
