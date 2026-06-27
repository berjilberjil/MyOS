<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { cn } from '$lib/utils';
	import { todayIso } from '$lib/finance/dates';
	import { formatINR, toPaise, sumPaise } from '$lib/money';
	import {
		listBelongings,
		addBelonging,
		removeBelonging,
		PURCHASE_CATEGORIES,
		CLOTHING_CATEGORIES,
		type Belonging
	} from '$lib/belongings/belongings';
	import { toast } from 'svelte-sonner';
	import Plus from '@lucide/svelte/icons/plus';
	import Minus from '@lucide/svelte/icons/minus';
	import Trash2 from '@lucide/svelte/icons/trash-2';

	const qc = useQueryClient();
	const list = createQuery(() => ({ queryKey: ['belongings'], queryFn: () => listBelongings() }));

	const all = $derived(list.data ?? []);
	const purchases = $derived(all.filter((b) => b.kind === 'purchase'));
	const clothing = $derived(all.filter((b) => b.kind === 'clothing'));
	const totalSpent = $derived(sumPaise(purchases.map((p) => p.cost_paise ?? 0)));
	const byCategory = $derived.by(() => {
		const m = new Map<string, number>();
		for (const p of purchases) m.set(p.category, (m.get(p.category) ?? 0) + (p.cost_paise ?? 0));
		return [...m.entries()].sort((a, b) => b[1] - a[1]);
	});
	const wardrobeTotal = $derived(clothing.reduce((s, c) => s + c.qty, 0));
	function countFor(cat: string): number {
		return clothing.filter((c) => c.category === cat).reduce((s, c) => s + c.qty, 0);
	}

	function invalidate() {
		qc.invalidateQueries({ queryKey: ['belongings'] });
	}

	// Add purchase
	let pName = $state('');
	let pCat = $state(PURCHASE_CATEGORIES[0]);
	let pCost = $state('');
	let pDate = $state(todayIso());
	const addPurchase = createMutation(() => ({
		mutationFn: () =>
			addBelonging({
				kind: 'purchase',
				name: pName,
				category: pCat,
				cost_paise: pCost ? toPaise(Number(pCost)) : null,
				acquired_on: pDate
			}),
		onSuccess: () => {
			invalidate();
			pName = '';
			pCost = '';
			toast.success('Purchase added');
		}
	}));

	const addCloth = createMutation(() => ({
		mutationFn: (cat: string) => addBelonging({ kind: 'clothing', category: cat, qty: 1 }),
		onSuccess: () => invalidate()
	}));
	const dropCloth = createMutation(() => ({
		mutationFn: async (cat: string) => {
			const row = clothing.filter((c) => c.category === cat)[0];
			if (row) await removeBelonging(row.id);
		},
		onSuccess: () => invalidate()
	}));
	const del = createMutation(() => ({
		mutationFn: (id: string) => removeBelonging(id),
		onSuccess: () => {
			invalidate();
			toast.success('Removed');
		}
	}));
</script>

<div class="kn-stagger flex flex-col gap-4">
	<div>
		<h1 class="text-xl font-semibold tracking-tight">Belongings</h1>
		<p class="text-sm text-muted-foreground">Everything I own — what it cost, and what's in the wardrobe.</p>
	</div>

	<!-- Spend summary -->
	<Card.Root>
		<Card.Content class="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<div class="text-xs uppercase tracking-wide text-muted-foreground">Total spent on stuff</div>
				<div class="text-4xl font-bold tracking-tight">{formatINR(totalSpent)}</div>
			</div>
			{#if byCategory.length}
				<div class="flex flex-wrap gap-2">
					{#each byCategory as [cat, paise] (cat)}
						<div class="rounded-full border border-border px-3 py-1.5 text-sm">
							<span class="text-muted-foreground">{cat}</span>
							<span class="ml-1.5 font-semibold">{formatINR(paise)}</span>
						</div>
					{/each}
				</div>
			{/if}
		</Card.Content>
	</Card.Root>

	<!-- Add + list purchases -->
	<Card.Root>
		<Card.Header><Card.Title>Purchases</Card.Title></Card.Header>
		<Card.Content class="flex flex-col gap-3">
			<div class="flex flex-wrap items-end gap-2">
				<Input placeholder="What did you buy?" bind:value={pName} class="w-56" />
				<select bind:value={pCat} class="h-9 rounded-md border border-border bg-background px-2 text-sm">
					{#each PURCHASE_CATEGORIES as c}<option value={c}>{c}</option>{/each}
				</select>
				<Input type="number" step="1" placeholder="₹ cost" bind:value={pCost} class="w-28" />
				<Input type="date" bind:value={pDate} class="w-40" />
				<Button disabled={!pName || addPurchase.isPending} onclick={() => addPurchase.mutate()}>Add</Button>
			</div>

			<div class="divide-y divide-border">
				{#each purchases as p (p.id)}
					<div class="flex items-center gap-3 py-2 text-sm">
						<span class="font-medium">{p.name || '—'}</span>
						<span class="rounded-full bg-secondary px-2 py-0.5 text-xs">{p.category}</span>
						<span class="text-muted-foreground">{p.acquired_on ?? ''}</span>
						<span class="ml-auto font-semibold">{p.cost_paise != null ? formatINR(p.cost_paise) : '—'}</span>
						<button class="text-muted-foreground hover:text-destructive" onclick={() => del.mutate(p.id)} aria-label="Remove">
							<Trash2 class="size-4" />
						</button>
					</div>
				{:else}
					<p class="py-6 text-center text-sm text-muted-foreground">No purchases logged yet.</p>
				{/each}
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Wardrobe -->
	<Card.Root>
		<Card.Header class="flex-row items-baseline justify-between">
			<Card.Title>Wardrobe</Card.Title>
			<span class="text-sm text-muted-foreground">{wardrobeTotal} items</span>
		</Card.Header>
		<Card.Content>
			<div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
				{#each CLOTHING_CATEGORIES as cat (cat)}
					{@const n = countFor(cat)}
					<div class={cn('flex flex-col gap-2 rounded-lg border p-3', n ? 'border-primary/40 bg-primary/5' : 'border-border')}>
						<div class="text-xs text-muted-foreground">{cat}</div>
						<div class="text-2xl font-bold leading-none">{n}</div>
						<div class="flex gap-1">
							<button class="step" onclick={() => dropCloth.mutate(cat)} disabled={!n} aria-label="Remove one">
								<Minus class="size-3.5" />
							</button>
							<button class="step grow" onclick={() => addCloth.mutate(cat)} aria-label="Add one">
								<Plus class="size-3.5" />
							</button>
						</div>
					</div>
				{/each}
			</div>
		</Card.Content>
	</Card.Root>
</div>

<style>
	.step {
		display: grid;
		height: 28px;
		place-items: center;
		border-radius: var(--radius-md);
		border: 1px solid var(--border);
		color: var(--foreground);
		padding-inline: 0.5rem;
	}
	.step:hover:not(:disabled) {
		background: var(--accent);
	}
	.step:disabled {
		opacity: 0.4;
	}
</style>
