<script lang="ts">
	import { createQuery, useQueryClient } from '@tanstack/svelte-query';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { cn } from '$lib/utils';
	import { todayIso } from '$lib/finance/dates';
	import { formatINR, toPaise, fromPaise, sumPaise } from '$lib/money';
	import {
		listBelongings,
		addBelonging,
		updateBelonging,
		removeBelonging,
		uploadBelongingImage,
		PURCHASE_CATEGORIES,
		CLOTHING_CATEGORIES,
		type Belonging
	} from '$lib/belongings/belongings';
	import BelongingThumb from '$lib/belongings/BelongingThumb.svelte';
	import { toast } from 'svelte-sonner';
	import Plus from '@lucide/svelte/icons/plus';
	import Minus from '@lucide/svelte/icons/minus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import ImagePlus from '@lucide/svelte/icons/image-plus';
	import X from '@lucide/svelte/icons/x';

	const qc = useQueryClient();
	const list = createQuery(() => ({ queryKey: ['belongings'], queryFn: () => listBelongings() }));
	function invalidate() {
		qc.invalidateQueries({ queryKey: ['belongings'] });
	}
	function refetch() {
		return qc.refetchQueries({ queryKey: ['belongings'] });
	}

	const all = $derived(list.data ?? []);
	const purchases = $derived(all.filter((b) => b.kind === 'purchase'));
	const countRows = $derived(new Map(all.filter((b) => b.kind === 'clothing').map((b) => [b.category, b])));
	function galleryFor(cat: string): Belonging[] {
		return all.filter((b) => b.kind === 'wardrobe_photo' && b.category === cat);
	}

	const totalSpent = $derived(sumPaise(purchases.map((p) => p.cost_paise ?? 0)));
	const byCategory = $derived.by(() => {
		const m = new Map<string, number>();
		for (const p of purchases) m.set(p.category, (m.get(p.category) ?? 0) + (p.cost_paise ?? 0));
		return [...m.entries()].sort((a, b) => b[1] - a[1]);
	});

	// ---- Wardrobe (optimistic, no flicker) ----
	let qtyOverride = $state<Record<string, number>>({});
	let priceOverride = $state<Record<string, string>>({});
	const timers: Record<string, ReturnType<typeof setTimeout>> = {};
	const ptimers: Record<string, ReturnType<typeof setTimeout>> = {};

	function serverQty(cat: string): number {
		return countRows.get(cat)?.qty ?? 0;
	}
	function shown(cat: string): number {
		return qtyOverride[cat] ?? serverQty(cat);
	}
	function priceStr(cat: string): string {
		if (priceOverride[cat] !== undefined) return priceOverride[cat];
		const cp = countRows.get(cat)?.cost_paise;
		return cp != null ? String(fromPaise(cp)) : '';
	}
	function valueOf(cat: string): number {
		const p = Number(priceStr(cat)) || 0;
		return shown(cat) * toPaise(p);
	}
	const wardrobeItems = $derived(CLOTHING_CATEGORIES.reduce((s, c) => s + shown(c), 0));
	const wardrobeValue = $derived(CLOTHING_CATEGORIES.reduce((s, c) => s + valueOf(c), 0));

	async function commitClothing(cat: string, patch: { qty?: number; cost_paise?: number | null }) {
		const row = countRows.get(cat);
		if (row) await updateBelonging(row.id, patch);
		else await addBelonging({ kind: 'clothing', category: cat, qty: patch.qty ?? 0, cost_paise: patch.cost_paise ?? null });
	}

	function bump(cat: string, d: number) {
		const next = Math.max(0, shown(cat) + d);
		qtyOverride[cat] = next;
		clearTimeout(timers[cat]);
		timers[cat] = setTimeout(() => flushQty(cat), 500);
	}
	async function flushQty(cat: string) {
		const target = qtyOverride[cat];
		if (target === undefined) return;
		try {
			await commitClothing(cat, { qty: target });
			await refetch();
		} catch {
			toast.error('Could not save count');
		}
		if (qtyOverride[cat] === target) delete qtyOverride[cat]; // keep newer edits
	}

	function setPrice(cat: string, val: string) {
		priceOverride[cat] = val;
		clearTimeout(ptimers[cat]);
		ptimers[cat] = setTimeout(() => flushPrice(cat), 700);
	}
	async function flushPrice(cat: string) {
		const val = priceOverride[cat];
		if (val === undefined) return;
		try {
			await commitClothing(cat, { cost_paise: val ? toPaise(Number(val)) : null });
			await refetch();
		} catch {
			toast.error('Could not save price');
		}
		if (priceOverride[cat] === val) delete priceOverride[cat];
	}

	// Wardrobe photos (shared hidden input)
	let wardrobeFile: HTMLInputElement;
	let photoCat = $state('');
	function pickWardrobePhoto(cat: string) {
		photoCat = cat;
		wardrobeFile.click();
	}
	async function onWardrobePhoto(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (!file) return;
		try {
			const image_path = await uploadBelongingImage(file);
			await addBelonging({ kind: 'wardrobe_photo', category: photoCat, qty: 1, image_path });
			invalidate();
			toast.success(`Photo added to ${photoCat}`);
		} catch {
			toast.error('Could not upload photo');
		}
	}

	// Purchases
	let pName = $state('');
	let pCat = $state(PURCHASE_CATEGORIES[0]);
	let pCost = $state('');
	let pDate = $state(todayIso());
	let pFile: HTMLInputElement;
	let pPhoto = $state<File | null>(null);
	let pSaving = $state(false);
	function onPurchasePhoto(e: Event) {
		pPhoto = (e.currentTarget as HTMLInputElement).files?.[0] ?? null;
	}
	async function addPurchase() {
		if (!pName) return;
		pSaving = true;
		try {
			const image_path = pPhoto ? await uploadBelongingImage(pPhoto) : undefined;
			await addBelonging({
				kind: 'purchase',
				name: pName,
				category: pCat,
				cost_paise: pCost ? toPaise(Number(pCost)) : null,
				acquired_on: pDate,
				image_path
			});
			invalidate();
			pName = '';
			pCost = '';
			pPhoto = null;
			toast.success('Purchase added');
		} catch {
			toast.error('Could not add purchase');
		}
		pSaving = false;
	}

	async function del(id: string) {
		await removeBelonging(id);
		await refetch();
		toast.success('Removed');
	}
</script>

<input bind:this={wardrobeFile} type="file" accept="image/*" class="hidden" onchange={onWardrobePhoto} />

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
				<div class="text-4xl font-bold tracking-tight">{formatINR(totalSpent + wardrobeValue)}</div>
				<div class="text-xs text-muted-foreground">purchases {formatINR(totalSpent)} · wardrobe {formatINR(wardrobeValue)}</div>
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

	<!-- Purchases -->
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
				<input bind:this={pFile} type="file" accept="image/*" class="hidden" onchange={onPurchasePhoto} />
				<Button variant="outline" class={cn('gap-1.5', pPhoto && 'border-primary text-primary')} onclick={() => pFile.click()}>
					<ImagePlus class="size-4" /> {pPhoto ? 'Photo ✓' : 'Photo'}
				</Button>
				<Button disabled={!pName || pSaving} onclick={addPurchase}>Add</Button>
			</div>

			<div class="divide-y divide-border">
				{#each purchases as p (p.id)}
					<div class="flex items-center gap-3 py-2 text-sm">
						{#if p.image_path}
							<span class="size-9 overflow-hidden rounded-md border border-border"><BelongingThumb path={p.image_path} alt={p.name} /></span>
						{/if}
						<span class="font-medium">{p.name || '—'}</span>
						<span class="rounded-full bg-secondary px-2 py-0.5 text-xs">{p.category}</span>
						<span class="text-muted-foreground">{p.acquired_on ?? ''}</span>
						<span class="ml-auto font-semibold">{p.cost_paise != null ? formatINR(p.cost_paise) : '—'}</span>
						<button class="text-muted-foreground hover:text-destructive" onclick={() => del(p.id)} aria-label="Remove">
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
			<span class="text-sm text-muted-foreground">{wardrobeItems} items · {formatINR(wardrobeValue)}</span>
		</Card.Header>
		<Card.Content>
			<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
				{#each CLOTHING_CATEGORIES as cat (cat)}
					{@const n = shown(cat)}
					{@const pics = galleryFor(cat)}
					<div class={cn('flex flex-col gap-3 rounded-xl border p-3.5', n ? 'border-primary/40 bg-primary/5' : 'border-border')}>
						<div class="flex items-start justify-between">
							<div>
								<div class="text-sm font-semibold">{cat}</div>
								<div class="text-3xl font-bold leading-none">{n}</div>
								{#if valueOf(cat) > 0}<div class="mt-0.5 text-xs text-muted-foreground">worth {formatINR(valueOf(cat))}</div>{/if}
							</div>
							<div class="flex items-center gap-1.5">
								<span class="text-xs text-muted-foreground">₹</span>
								<input
									class="price"
									type="number"
									step="1"
									placeholder="price"
									value={priceStr(cat)}
									oninput={(e) => setPrice(cat, e.currentTarget.value)}
									aria-label="Avg price for {cat}"
								/>
							</div>
						</div>

						<div class="gallery">
							{#each pics as pic (pic.id)}
								<div class="cell">
									{#if pic.image_path}<BelongingThumb path={pic.image_path} alt={cat} />{/if}
									<button class="x" onclick={() => del(pic.id)} aria-label="Delete photo"><X class="size-3" /></button>
								</div>
							{/each}
							<button class="cell add" onclick={() => pickWardrobePhoto(cat)} aria-label="Add photo to {cat}">
								<ImagePlus class="size-5" />
							</button>
						</div>

						<div class="flex gap-2">
							<button class="step" onclick={() => bump(cat, -1)} disabled={n === 0} aria-label="Remove one {cat}">
								<Minus class="size-5" />
							</button>
							<button class="step step-add" onclick={() => bump(cat, 1)} aria-label="Add one {cat}">
								<Plus class="size-5" />
							</button>
						</div>
					</div>
				{/each}
			</div>
		</Card.Content>
	</Card.Root>
</div>

<style>
	.price {
		width: 64px;
		height: 28px;
		border-radius: var(--radius-md);
		border: 1px solid var(--border);
		background: var(--background);
		padding: 0 0.4rem;
		font-size: var(--text-sm);
		text-align: right;
	}
	.gallery {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.4rem;
	}
	.cell {
		position: relative;
		aspect-ratio: 1;
		overflow: hidden;
		border-radius: var(--radius-md);
		border: 1px solid var(--border);
	}
	.cell.add {
		display: grid;
		place-items: center;
		color: var(--muted-foreground);
		background: var(--card);
	}
	.cell.add:hover {
		background: var(--accent);
		color: var(--foreground);
	}
	.x {
		position: absolute;
		right: 2px;
		top: 2px;
		display: grid;
		height: 18px;
		width: 18px;
		place-items: center;
		border-radius: 9999px;
		background: rgb(0 0 0 / 0.6);
		color: #fff;
		opacity: 0;
		transition: opacity var(--duration-fast) ease;
	}
	.cell:hover .x {
		opacity: 1;
	}
	.step {
		display: grid;
		height: 42px;
		flex: 1;
		place-items: center;
		border-radius: var(--radius-lg);
		border: 1px solid var(--border);
		color: var(--foreground);
		background: var(--card);
	}
	.step:hover:not(:disabled) {
		background: var(--accent);
	}
	.step:active:not(:disabled) {
		transform: scale(0.96);
	}
	.step:disabled {
		opacity: 0.35;
	}
	.step-add {
		flex: 2;
		background: var(--primary);
		border-color: var(--primary);
		color: var(--primary-foreground);
	}
	.step-add:hover {
		background: color-mix(in oklch, var(--primary) 88%, black);
	}
</style>
