<script lang="ts">
	import { page } from '$app/state';
	import { profileState } from '$lib/stores/profile.svelte';
	import { headerTabs } from '$lib/stores/headerTabs.svelte';
	import { cn } from '$lib/utils';

	function active(href: string): boolean {
		const p = page.url.pathname;
		return p === href || p.startsWith(href + '/');
	}
</script>

<header class="mtop">
	<div class="left">
		<a href="/" class="brand">MyOS</a>
		{#if headerTabs.tabs.length}
			<nav class="tabs" aria-label="Section">
				{#each headerTabs.tabs as t (t.href)}
					<a href={t.href} class={cn('tab', active(t.href) && 'on')}>{t.label}</a>
				{/each}
			</nav>
		{/if}
	</div>
	<a href="/profile" class="avatar-link" aria-label="Profile">
		<img src={profileState.avatar} alt={profileState.name} width="30" height="30" />
	</a>
</header>

<style>
	.mtop {
		position: sticky;
		top: 0;
		z-index: 30;
		display: flex;
		flex-shrink: 0;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		height: 52px;
		padding: 0 14px;
		padding-top: env(safe-area-inset-top);
		border-bottom: 1px solid var(--border);
		background: color-mix(in oklch, var(--card) 88%, transparent);
		backdrop-filter: blur(14px);
	}
	@media (min-width: 768px) {
		.mtop {
			height: 56px;
			padding-inline: 24px;
		}
	}
	.left {
		display: flex;
		min-width: 0;
		align-items: center;
		gap: 1.25rem;
	}
	.brand {
		flex-shrink: 0;
		font-size: var(--text-base);
		font-weight: 700;
		letter-spacing: -0.01em;
		color: var(--foreground);
		text-decoration: none;
	}
	/* Section sub-tabs live in the header on desktop; pages keep their own on mobile. */
	.tabs {
		display: none;
		align-items: center;
		gap: 0.25rem;
	}
	@media (min-width: 768px) {
		.tabs {
			display: flex;
		}
	}
	.tab {
		border-radius: var(--radius-md);
		padding: 0.3rem 0.7rem;
		font-size: var(--text-sm);
		color: var(--muted-foreground);
		text-decoration: none;
		transition: background-color var(--duration-fast) ease, color var(--duration-fast) ease;
	}
	.tab:hover {
		background: var(--secondary);
		color: var(--foreground);
	}
	.tab.on {
		background: var(--secondary);
		font-weight: 500;
		color: var(--secondary-foreground);
	}
	.avatar-link img {
		height: 30px;
		width: 30px;
		border-radius: 9999px;
		object-fit: cover;
		object-position: center 18%;
		box-shadow: 0 0 0 1.5px color-mix(in oklch, var(--primary) 40%, transparent);
	}
</style>
