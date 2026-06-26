<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { moduleNodes } from '$lib/mindmap/graph';
	import { radialLayout } from '$lib/mindmap/layout';

	const SIZE = 640;
	const C = SIZE / 2;
	const R = 230;

	const nodes = createQuery(() => ({ queryKey: ['mindmap', 'modules'], queryFn: () => moduleNodes() }));

	const positioned = $derived.by(() => {
		const data = nodes.data ?? [];
		const pts = radialLayout(data.length, R, C, C);
		return data.map((n, i) => ({ ...n, ...pts[i] }));
	});
</script>

<div class="kn-stagger flex flex-col gap-4">
	<h1 class="text-xl font-semibold tracking-tight">Life map</h1>
	<p class="text-sm text-muted-foreground">How everything connects. Center is you; branches are your modules.</p>

	<div class="overflow-auto rounded-lg border border-border bg-card p-2">
		<svg viewBox="0 0 {SIZE} {SIZE}" class="mx-auto block w-full max-w-2xl" role="img" aria-label="Life mindmap">
			{#each positioned as n (n.key)}
				<line x1={C} y1={C} x2={n.x} y2={n.y} stroke="var(--border)" stroke-width="2" />
			{/each}

			{#each positioned as n (n.key)}
				<a href={n.href} aria-label={n.label}>
					<circle cx={n.x} cy={n.y} r="44" fill="var(--secondary)" stroke="var(--border)" stroke-width="1.5" />
					<text x={n.x} y={n.y - 4} text-anchor="middle" class="fill-foreground text-[13px] font-medium">{n.label}</text>
					<text x={n.x} y={n.y + 14} text-anchor="middle" class="fill-muted-foreground text-[11px]">{n.count} items</text>
				</a>
			{/each}

			<circle cx={C} cy={C} r="52" fill="var(--primary)" />
			<text x={C} y={C + 5} text-anchor="middle" class="fill-primary-foreground text-base font-semibold">You</text>
		</svg>
	</div>
</div>
