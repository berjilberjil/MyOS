<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { NAV } from '$lib/nav';

	function isActive(item: { href: string; match?: string[] }): boolean {
		const p = page.url.pathname;
		if (item.href === '/') return p === '/';
		const paths = item.match ?? [item.href];
		return paths.some((h) => p === h || p.startsWith(h + '/'));
	}

	// On hover-capable devices (desktop) the bar auto-hides: it reveals when the
	// pointer nears the bottom edge and tucks away after a short idle. On touch
	// devices it stays put.
	let autoHide = $state(false);
	let revealed = $state(true);
	let hideTimer: ReturnType<typeof setTimeout> | undefined;

	function scheduleHide(delay = 2200) {
		clearTimeout(hideTimer);
		hideTimer = setTimeout(() => (revealed = false), delay);
	}

	onMount(() => {
		const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
		if (!mq.matches) return; // touch: always visible
		autoHide = true;
		revealed = false;
		const onMove = (e: MouseEvent) => {
			if (e.clientY >= window.innerHeight - 110) {
				revealed = true;
				scheduleHide();
			}
		};
		window.addEventListener('mousemove', onMove);
		return () => {
			window.removeEventListener('mousemove', onMove);
			clearTimeout(hideTimer);
		};
	});

	function keepOpen() {
		clearTimeout(hideTimer);
		revealed = true;
	}
	function leave() {
		if (autoHide) scheduleHide(1200);
	}
</script>

{#if autoHide && !revealed}
	<button class="peek" onmouseenter={keepOpen} aria-label="Show navigation">
		<span></span>
	</button>
{/if}

<nav
	class="mnav"
	class:autohide={autoHide}
	class:revealed
	onmouseenter={keepOpen}
	onmouseleave={leave}
	aria-label="Primary"
>
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
		transition:
			transform 0.32s var(--ease-entrance),
			opacity 0.32s ease;
	}
	/* Desktop: float as a centered pill that hides until the pointer comes near. */
	.mnav.autohide {
		left: 50%;
		right: auto;
		bottom: 14px;
		width: min(620px, calc(100% - 2rem));
		transform: translate(-50%, calc(100% + 22px));
		opacity: 0;
		gap: 4px;
		border: 1px solid var(--border);
		border-radius: 9999px;
		padding: 6px;
		box-shadow: 0 18px 40px -16px rgb(0 0 0 / 0.5);
	}
	.mnav.autohide.revealed {
		transform: translate(-50%, 0);
		opacity: 1;
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
	.mnav.autohide .item {
		border-radius: 9999px;
		padding: 6px 4px;
	}
	.item.active {
		color: var(--primary);
	}
	.item:active {
		background: var(--accent);
	}
	.mnav.autohide .item.active {
		background: color-mix(in oklch, var(--primary) 12%, transparent);
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
	.mnav.autohide .bar {
		display: none;
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

	/* Hover affordance shown while the desktop bar is tucked away. */
	.peek {
		position: fixed;
		bottom: 0;
		left: 50%;
		z-index: 39;
		display: grid;
		height: 22px;
		width: 120px;
		transform: translateX(-50%);
		place-items: center;
		background: transparent;
		border: none;
	}
	.peek span {
		height: 4px;
		width: 46px;
		border-radius: 9999px;
		background: color-mix(in oklch, var(--foreground) 22%, transparent);
		transition: background-color var(--duration-fast) ease;
	}
	.peek:hover span {
		background: var(--primary);
	}
</style>
