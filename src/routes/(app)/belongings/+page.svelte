<script lang="ts">
	import { createQuery, useQueryClient } from '@tanstack/svelte-query';
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
		uploadBelongingImage,
		PURCHASE_CATEGORIES,
		CLOTHING_CATEGORIES
	} from '$lib/belongings/belongings';
	import BelongingThumb from '$lib/belongings/BelongingThumb.svelte';
	import { toast } from 'svelte-sonner';
	import Plus from '@lucide/svelte/icons/plus';
	import Minus from '@lucide/svelte/icons/minus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import ImagePlus from '@lucide/svelte/icons/image-plus';

	const qc = useQueryClient();
	const list = createQuery(() => ({ queryKey: ['belongings'], queryFn: () => listBelongings() }));
	function invalidate() {
		qc.invalidateQueries({ queryKey: ['belongings'] });
	}

	const all = $derived(list.data ?? []);
	const purchases = $derived(all.filter((b) => b.kind === 'purchase'));
	const clothing = $derived(all.filter((b) => b.kind === 'clothing'));
	const totalSpent = $derived(sumPaise(purchases.map((p) => p.cost_paise ?? 0)));
	const byCategory = $derived.by(() => {
		const m = new Map<string, number>();
		for (const p of purchases) m.set(p.category, (m.get(p.category) ?? 0) + (p.cost_paise ?? 0));
		return [...m.entries()].sort((a, b) => b[1] - a[1]);
	});

	function serverCount(cat: string): number {
		return clothing.filter((c) => c.category === cat).reduce((s, c) => s + c.qty, 0);
	}
	function photosFor(cat: string) {
		return clothing.filter((c) => c.category === cat && c.image_path);
	}

	// Optimistic counts: clicks update instantly; writes are debounced + batched.
	let pending = $state<Record<string, number>>({});
	const timers: Record<string, ReturnType<typeof setTimeout>> = {};
	function shown(cat: string): number {
		return Math.max(0, serverCount(cat) + (pending[cat] ?? 0));
	}
	const wardrobeTotal = $derived(CLOTHING_CATEGORIES.reduce((s, c) => s + shown(c), 0));

	function bump(cat: string, d: number) {
		const next = (pending[cat] ?? 0) + d;
		if (serverCount(cat) + next < 0) return;
		pending[cat] = next;
		clearTimeout(timers[cat]);
		timers[cat] = setTimeout(() => flush(cat), 550);
	}
	async function flush(cat: string) {
		const d = pending[cat] ?? 0;
		delete pending[cat];
		if (!d) return;
		try {
			if (d > 0) {
				await Promise.all(
					Array.from({ length: d }, () => addBelonging({ kind: 'clothing', category: cat, qty: 1 }))
				);
			} else {
				const rows = clothing
					.filter((c) => c.category === cat)
					.sort(
						(a, b) =>
							(a.image_path ? 1 : 0) - (b.image_path ? 1 : 0) || b.created_at.localeCompare(a.created_at)
					)
					.slice(0, -d);
				await Promise.all(rows.map((r) => removeBelonging(r.id)));
			}
		} catch {
			toast.error('Could not save wardrobe');
		}
		invalidate();
	}

	// Wardrobe photo (shared hidden input)
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
			await addBelonging({ kind: 'clothing', category: photoCat, qty: 1, image_path });
			invalidate();
			toast.success(`Photo added to ${photoCat}`);
		} catch {
			toast.error('Could not upload photo');
		}
	}

	// Purchase add (with optional photo)
	let pName = $state('');
	let pCat = $state(PURCHASE_CATEGORIES[0]);
	let pCost = $state('');
	let pDate = $state(todayIso());
	let pFile: HTMLInputElement;
	let pPhoto = $state<File | null>(null);
	let pSaving = $state(false);
	function onPurchasePhoto(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		pPhoto = input.files?.[0] ?? null;
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
		invalidate();
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
			<span class="text-sm text-muted-foreground">{wardrobeTotal} items</span>
		</Card.Header>
		<Card.Content>
			<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
				{#each CLOTHING_CATEGORIES as cat (cat)}
					{@const n = shown(cat)}
					{@const pics = photosFor(cat)}
					<div class={cn('flex flex-col gap-2.5 rounded-xl border p-3', n ? 'border-primary/40 bg-primary/5' : 'border-border')}>
						<div class="flex items-start justify-between">
							<div>
								<div class="text-xs text-muted-foreground">{cat}</div>
								<div class="text-3xl font-bold leading-none">{n}</div>
							</div>
							<button class="ph-btn" onclick={() => pickWardrobePhoto(cat)} aria-label="Add photo to {cat}" title="Add photo">
								<ImagePlus class="size-4" />
							</button>
						</div>

						{#if pics.length}
							<div class="flex flex-wrap gap-1">
								{#each pics as pic (pic.id)}
									<button class="thumb-wrap" onclick={() => del(pic.id)} title="Remove photo">
										{#if pic.image_path}<BelongingThumb path={pic.image_path} alt={cat} />{/if}
									</button>
								{/each}
							</div>
						{/if}

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
	.step {
		display: grid;
		height: 44px;
		flex: 1;
		place-items: center;
		border-radius: var(--radius-lg);
		border: 1px solid var(--border);
		color: var(--foreground);
		background: var(--card);
		transition: background-color var(--duration-fast) ease;
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
	.step-add:hover:not(:disabled) {
		background: color-mix(in oklch, var(--primary) 88%, black);
	}
	.ph-btn {
		display: grid;
		height: 30px;
		width: 30px;
		place-items: center;
		border-radius: var(--radius-md);
		border: 1px solid var(--border);
		color: var(--muted-foreground);
	}
	.ph-btn:hover {
		background: var(--accent);
		color: var(--foreground);
	}
	.thumb-wrap {
		height: 40px;
		width: 40px;
		overflow: hidden;
		border-radius: var(--radius-md);
		border: 1px solid var(--border);
	}
	.thumb-wrap:hover {
		outline: 2px solid var(--destructive);
	}
</style>
