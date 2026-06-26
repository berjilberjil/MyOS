<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { moduleVitals } from '$lib/mindmap/graph';
	import { MODULE_ICONS } from '$lib/nav';
	import LiquidTank from '$lib/dashboard/LiquidTank.svelte';

	const q = createQuery(() => ({ queryKey: ['dashboard', 'vitals'], queryFn: () => moduleVitals() }));
	const vitals = $derived(q.data ?? []);
</script>

<div class="flex h-full flex-col gap-3">
	<div class="shrink-0">
		<h1 class="text-xl font-semibold tracking-tight">Dashboard</h1>
		<div class="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
			<span>How alive each area is:</span>
			<span class="legend"><i class="dot water"></i>Water · thriving</span>
			<span class="legend"><i class="dot fuel"></i>Fuel · topping up</span>
			<span class="legend"><i class="dot fire"></i>Fire · needs you</span>
		</div>
	</div>

	<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
		{#each vitals as v, i (v.key)}
			<div class="kn-card" style="--kn-i: {i}">
				<LiquidTank
					label={v.label}
					href={v.href}
					count={v.count}
					level={v.level}
					status={v.state}
					icon={MODULE_ICONS[v.key]}
				/>
			</div>
		{/each}
	</div>
</div>

<style>
	.legend {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
	}
	.dot {
		height: 0.5rem;
		width: 0.5rem;
		border-radius: 9999px;
	}
	.water {
		background: #0ea5e9;
	}
	.fuel {
		background: #f59e0b;
	}
	.fire {
		background: #ef4444;
	}
</style>
