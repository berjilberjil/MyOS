<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import Wilt from './Wilt.svelte';

	interface Props {
		daysPracticed: number;
		freezesUsed: number;
		streak: number;
		streakGoal: number;
	}
	let { daysPracticed, freezesUsed, streak, streakGoal }: Props = $props();

	const pct = $derived(Math.min(100, Math.round((streak / Math.max(1, streakGoal)) * 100)));
</script>

<div class="stats">
	<div class="row">
		<div class="stat">
			<span class="ic check"><Check class="size-4" strokeWidth={3} /></span>
			<div class="meta">
				<span class="val">{daysPracticed}</span>
				<span class="lbl">Days bloomed</span>
			</div>
		</div>
		<div class="stat">
			<span class="ic wilt"><Wilt size={18} /></span>
			<div class="meta">
				<span class="val">{freezesUsed}</span>
				<span class="lbl">Wilted days</span>
			</div>
		</div>
	</div>

	<div class="goal">
		<div class="goal-head">
			<span class="goal-title">Bloom Goal</span>
			<span class="goal-num">{streak} / {streakGoal}</span>
		</div>
		<div class="track">
			<div class="fill" style="width: {pct}%"></div>
			<span class="cap"><CalendarDays class="size-4" /></span>
		</div>
	</div>
</div>

<style>
	.stats {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
	}
	.row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}
	.stat {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		border-radius: var(--radius-lg);
		border: 1px solid var(--border);
		background: var(--card);
		padding: 0.7rem 0.85rem;
	}
	.ic {
		display: grid;
		height: 28px;
		width: 28px;
		flex-shrink: 0;
		place-items: center;
		border-radius: 9999px;
		color: #fff;
	}
	.ic.check {
		background: #ec4899;
	}
	.ic.wilt {
		background: color-mix(in oklch, #8a7256 28%, transparent);
	}
	.meta {
		display: flex;
		flex-direction: column;
		line-height: 1.1;
	}
	.val {
		font-size: 1.3rem;
		font-weight: 800;
	}
	.lbl {
		font-size: var(--text-xs);
		color: var(--muted-foreground);
	}

	.goal {
		border-radius: var(--radius-lg);
		border: 1px solid var(--border);
		background: var(--card);
		padding: 0.8rem 0.9rem 1rem;
	}
	.goal-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		margin-bottom: 0.6rem;
	}
	.goal-title {
		font-size: var(--text-base);
		font-weight: 700;
	}
	.goal-num {
		font-size: var(--text-sm);
		font-weight: 700;
		color: #ec4899;
	}
	.track {
		position: relative;
		height: 16px;
		border-radius: 9999px;
		background: color-mix(in oklch, var(--foreground) 10%, transparent);
		overflow: visible;
	}
	.fill {
		height: 100%;
		border-radius: 9999px;
		background: linear-gradient(90deg, #ff85c2, #ec4899);
		transition: width 0.8s var(--ease-entrance);
		min-width: 16px;
	}
	.cap {
		position: absolute;
		right: -6px;
		top: 50%;
		display: grid;
		height: 26px;
		width: 26px;
		transform: translateY(-50%);
		place-items: center;
		border-radius: 6px;
		background: #ec4899;
		color: #fff;
		box-shadow: 0 0 0 3px var(--card);
	}
</style>
