<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { NAV_LEFT, NAV_RIGHT, DASHBOARD, type NavItem } from '$lib/nav';
	import * as haptics from '$lib/haptics';
	import {
		LONG_PRESS_MS,
		targetForDelta,
		actionForRelease,
		shouldAbortPress,
		type GestureTarget
	} from './navGesture';

	function isActive(item: { href: string; match?: string[] }): boolean {
		const p = page.url.pathname;
		if (item.href === '/dashboard') return p === '/dashboard';
		const paths = item.match ?? [item.href];
		return paths.some((h) => p === h || p.startsWith(h + '/'));
	}

	function tabTap(item: NavItem) {
		haptics.tick();
		goto(item.href);
	}

	// ---- Workspace long-press quick-create gesture ----
	let target = $state<GestureTarget>('idle');
	const gesturing = $derived(target !== 'idle');
	let engaged = false; // long-press fired this interaction
	let startX = 0;
	let startY = 0;
	let timer: ReturnType<typeof setTimeout> | undefined;
	let capturedEl: HTMLElement | null = null;
	let capturedId: number | null = null;

	function todayIso(): string {
		return new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD, local
	}

	function releaseCapture() {
		try {
			if (capturedEl && capturedId !== null) capturedEl.releasePointerCapture?.(capturedId);
		} catch {
			/* already released */
		}
		capturedEl = null;
		capturedId = null;
	}

	function wsDown(e: PointerEvent) {
		engaged = false;
		startX = e.clientX;
		startY = e.clientY;
		capturedEl = e.currentTarget as HTMLElement;
		capturedId = e.pointerId;
		// Capture ONLY once the long-press engages — a plain tap never captures the
		// pointer, so it can never wedge or swallow taps on other controls.
		timer = setTimeout(() => {
			engaged = true;
			target = 'journal';
			haptics.impact();
			try {
				capturedEl?.setPointerCapture?.(capturedId as number);
			} catch {
				/* ignore */
			}
		}, LONG_PRESS_MS);
	}

	function wsMove(e: PointerEvent) {
		const dx = e.clientX - startX;
		const dy = e.clientY - startY;
		if (!engaged) {
			if (shouldAbortPress(dx, dy)) clearTimeout(timer); // a scroll, not a hold
			return;
		}
		const next = targetForDelta(dx, dy);
		if (next !== target) {
			target = next;
			haptics.tick();
		}
	}

	function wsUp() {
		clearTimeout(timer);
		if (!engaged) {
			releaseCapture();
			tabTap(NAV_LEFT[1]); // plain tap → open Workspace
			return;
		}
		const action = actionForRelease(target);
		target = 'idle';
		engaged = false;
		releaseCapture();
		if (action === 'open-journal') {
			haptics.success();
			goto(`/journal/new?date=${todayIso()}`);
		} else if (action === 'open-note') {
			haptics.success();
			goto('/notes/new');
		}
	}

	function wsCancel() {
		clearTimeout(timer);
		target = 'idle';
		engaged = false;
		releaseCapture();
	}

	const chipLabel = $derived(
		target === 'note' ? 'New Note' : target === 'cancel' ? 'Release to cancel' : 'New Journal'
	);

	const Workspace = NAV_LEFT[1];
	const FarLeft = NAV_LEFT[0];

	// ---- Desktop auto-hide (web/hover devices only; touch stays pinned) ----
	let autoHide = $state(false);
	let revealed = $state(true);
	let hideTimer: ReturnType<typeof setTimeout> | undefined;

	function scheduleHide(delay = 2200) {
		clearTimeout(hideTimer);
		hideTimer = setTimeout(() => (revealed = false), delay);
	}
	function keepOpen() {
		clearTimeout(hideTimer);
		revealed = true;
	}
	function leave() {
		if (autoHide) scheduleHide(1200);
	}

	onMount(() => {
		// Only hover + fine-pointer devices (desktop browser). Touch/iOS: always shown.
		const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
		if (!mq.matches) return;
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
</script>

{#if autoHide && !revealed}
	<button class="peek" onmouseenter={keepOpen} aria-label="Show navigation">
		<span></span>
	</button>
{/if}

<nav
	class="mnav"
	class:gesturing
	class:autohide={autoHide}
	class:revealed
	onmouseenter={keepOpen}
	onmouseleave={leave}
	aria-label="Primary"
>
	<!-- left tabs -->
	<a
		href={FarLeft.href}
		class="item"
		class:active={isActive(FarLeft)}
		aria-current={isActive(FarLeft) ? 'page' : undefined}
		onclick={(e) => {
			e.preventDefault();
			tabTap(FarLeft);
		}}
	>
		<span class="bar" aria-hidden="true"></span>
		<FarLeft.icon class="ic" />
		<span class="lbl">{FarLeft.label}</span>
	</a>

	<!-- workspace tab with quick-create gesture -->
	<button
		type="button"
		class="item ws"
		class:active={isActive(Workspace)}
		aria-label="{Workspace.label} — hold for new journal, hold and drag right for new note"
		onpointerdown={wsDown}
		onpointermove={wsMove}
		onpointerup={wsUp}
		onpointercancel={wsCancel}
	>
		<span class="bar" aria-hidden="true"></span>
		<Workspace.icon class="ic" />
		<span class="lbl">{Workspace.label}</span>

		{#if gesturing}
			<span class="chip" class:note={target === 'note'} class:cancel={target === 'cancel'}>
				{chipLabel}
			</span>
		{/if}
	</button>

	<!-- elevated center: Dashboard -->
	<a
		href={DASHBOARD.href}
		class="center"
		class:active={isActive(DASHBOARD)}
		aria-current={isActive(DASHBOARD) ? 'page' : undefined}
		aria-label={DASHBOARD.label}
		onclick={(e) => {
			e.preventDefault();
			haptics.impact();
			goto(DASHBOARD.href);
		}}
	>
		<DASHBOARD.icon class="ic" />
	</a>

	<!-- right tabs -->
	{#each NAV_RIGHT as item (item.href)}
		{@const active = isActive(item)}
		<a
			href={item.href}
			class="item"
			class:active
			aria-current={active ? 'page' : undefined}
			onclick={(e) => {
				e.preventDefault();
				tabTap(item);
			}}
		>
			<span class="bar" aria-hidden="true"></span>
			<item.icon class="ic" />
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
		box-sizing: border-box;
		max-width: 100vw;
		display: flex;
		align-items: stretch;
		justify-content: space-around;
		gap: 1px;
		border-top: 1px solid var(--border);
		background: color-mix(in oklch, var(--card) 88%, transparent);
		backdrop-filter: blur(14px);
		padding: 5px 3px calc(5px + env(safe-area-inset-bottom));
		overflow: visible; /* let the elevated button + chip escape upward */
	}
	/* Desktop only: a floating, centered, rounded pill that tucks away until the
	   pointer nears the bottom edge. Touch/iOS keeps the full-width bar above. */
	.mnav.autohide {
		left: 50%;
		right: auto;
		bottom: 16px;
		width: min(560px, calc(100% - 2rem));
		gap: 4px;
		padding: 6px 12px;
		border: 1px solid var(--border);
		border-radius: 9999px;
		box-shadow: 0 18px 40px -16px rgb(0 0 0 / 0.55);
		transform: translateX(-50%);
		transition:
			transform 0.32s var(--ease-entrance),
			opacity 0.28s ease;
	}
	.mnav.autohide:not(.revealed) {
		transform: translate(-50%, calc(100% + 32px));
		opacity: 0;
		pointer-events: none;
	}
	.mnav.autohide .item {
		border-radius: 9999px;
		padding: 6px 8px;
	}
	.mnav.autohide .item.active {
		background: color-mix(in oklch, var(--primary) 12%, transparent);
	}
	.mnav.autohide .bar {
		display: none; /* the pill uses a filled active state, not the top tick */
	}
	.mnav.autohide .center {
		margin-top: -18px; /* gentler raise inside the floating dock */
		height: 50px;
		width: 50px;
		max-width: 50px;
	}
	/* Hover affordance shown while the desktop bar is tucked away. */
	.peek {
		position: fixed;
		bottom: 0;
		left: 50%;
		z-index: 39;
		display: grid;
		height: 22px;
		width: 140px;
		transform: translateX(-50%);
		place-items: center;
		background: transparent;
		border: none;
		cursor: pointer;
	}
	.peek span {
		height: 4px;
		width: 48px;
		border-radius: 9999px;
		background: color-mix(in oklch, var(--foreground) 22%, transparent);
		transition: background-color var(--duration-fast) ease;
	}
	.peek:hover span {
		background: var(--primary);
	}
	.item {
		position: relative;
		display: flex;
		min-width: 0;
		flex: 1;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		border: 0;
		background: none;
		border-radius: var(--radius-md);
		padding: 5px 2px 3px;
		font-size: 10px;
		line-height: 1;
		color: var(--muted-foreground);
		text-decoration: none;
		cursor: pointer;
		touch-action: manipulation; /* no tap delay / missed taps on iOS */
		-webkit-tap-highlight-color: transparent;
		-webkit-user-select: none;
		user-select: none;
		-webkit-touch-callout: none;
		transition: opacity var(--duration-fast) ease;
	}
	.ws {
		touch-action: none; /* own the drag so the page doesn't scroll mid-gesture */
	}
	.item.active {
		color: var(--primary);
	}
	.item:active {
		background: var(--accent);
	}
	/* dim the non-workspace tabs while the gesture is live */
	.mnav.gesturing .item:not(.ws),
	.mnav.gesturing .center {
		opacity: 0.4;
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
		transition: transform var(--duration-fast) var(--ease-entrance);
	}
	.ws.active :global(.ic),
	.mnav.gesturing .ws :global(.ic) {
		transform: scale(1.12);
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

	/* Elevated center Dashboard button */
	.center {
		position: relative;
		flex: 1;
		display: grid;
		place-items: center;
		align-self: center;
		justify-self: center;
		height: 54px;
		width: 54px;
		max-width: 54px;
		margin-top: -22px; /* raise above the bar */
		border-radius: 9999px;
		background: var(--primary);
		color: var(--primary-foreground);
		text-decoration: none;
		box-shadow: 0 10px 24px -8px color-mix(in oklch, var(--primary) 70%, transparent);
		transition:
			transform var(--duration-fast) var(--ease-entrance),
			box-shadow var(--duration-fast) ease;
		touch-action: manipulation;
		-webkit-tap-highlight-color: transparent;
	}
	.center :global(.ic) {
		height: 24px;
		width: 24px;
	}
	.center:active {
		transform: scale(0.92);
	}
	.center.active {
		box-shadow:
			0 0 0 3px color-mix(in oklch, var(--primary) 30%, transparent),
			0 10px 24px -8px color-mix(in oklch, var(--primary) 70%, transparent);
	}

	/* Floating quick-create chip above the Workspace tab */
	.chip {
		position: absolute;
		bottom: calc(100% + 12px);
		left: 50%;
		transform: translateX(-50%) translateY(0);
		white-space: nowrap;
		border-radius: 9999px;
		padding: 6px 12px;
		font-size: 12px;
		font-weight: 600;
		color: var(--primary-foreground);
		background: var(--primary);
		box-shadow: 0 12px 28px -10px rgb(0 0 0 / 0.55);
		pointer-events: none;
		transition:
			transform var(--duration-normal) var(--ease-entrance),
			background-color var(--duration-fast) ease,
			opacity var(--duration-fast) ease;
	}
	.chip::after {
		/* little pointer toward the button */
		content: '';
		position: absolute;
		top: 100%;
		left: 50%;
		transform: translateX(-50%);
		border: 5px solid transparent;
		border-top-color: var(--primary);
	}
	.chip.note {
		transform: translateX(-50%) translateX(64px);
		background: color-mix(in oklch, var(--primary) 70%, #22d3ee);
	}
	.chip.cancel {
		background: var(--muted);
		color: var(--muted-foreground);
		opacity: 0.85;
	}

	@media (prefers-reduced-motion: reduce) {
		.chip,
		.bar,
		.center,
		.item :global(.ic) {
			transition: none;
		}
	}
</style>
