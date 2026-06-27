<script lang="ts">
	import { setTheme, themeState, type Theme } from '$lib/stores/theme.svelte';
	import { profileState } from '$lib/stores/profile.svelte';
	import Palette from '@lucide/svelte/icons/palette';

	const themes: Theme[] = ['light', 'dark', 'system'];
	function cycle() {
		const i = themes.indexOf(themeState.current);
		const next = themes[(i + 1) % themes.length];
		themeState.current = next;
		setTheme(next);
	}
</script>

<header class="mtop md:hidden">
	<a href="/" class="brand">MyOS</a>
	<div class="actions">
		<button onclick={cycle} aria-label="Switch theme" class="icon-btn"><Palette class="size-[18px]" /></button>
		<a href="/profile" class="avatar-link" aria-label="Profile">
			<img src={profileState.avatar} alt={profileState.name} width="30" height="30" />
		</a>
	</div>
</header>

<style>
	.mtop {
		position: sticky;
		top: 0;
		z-index: 30;
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 52px;
		padding: 0 12px;
		padding-top: env(safe-area-inset-top);
		border-bottom: 1px solid var(--border);
		background: color-mix(in oklch, var(--card) 88%, transparent);
		backdrop-filter: blur(14px);
	}
	.brand {
		font-size: var(--text-base);
		font-weight: 700;
		letter-spacing: -0.01em;
		color: var(--foreground);
		text-decoration: none;
	}
	.actions {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.icon-btn {
		display: grid;
		height: 34px;
		width: 34px;
		place-items: center;
		border-radius: 9999px;
		color: var(--muted-foreground);
	}
	.icon-btn:active {
		background: var(--accent);
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
