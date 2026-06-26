<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import MonthNav from '$lib/components/finance/MonthNav.svelte';
	import { monthKey, todayIso } from '$lib/finance/dates';
	import { listByMonth } from '$lib/journal/entries';
	import { toCsv, downloadCsv } from '$lib/export/csv';
	import Download from '@lucide/svelte/icons/download';

	let month = $state(monthKey(todayIso()));
	const entries = createQuery(() => ({ queryKey: ['journal', month], queryFn: () => listByMonth(month) }));

	let selected = $state<Set<string>>(new Set());
	function toggle(id: string) {
		const s = new Set(selected);
		s.has(id) ? s.delete(id) : s.add(id);
		selected = s;
	}
	function clear() {
		selected = new Set();
	}
	function exportCsv() {
		const rows = (entries.data ?? [])
			.filter((e) => selected.has(e.id))
			.map((e) => [e.title || 'Untitled', e.occurred_on, e.mood ?? '', e.body_text]);
		downloadCsv(
			`journal-${month}.csv`,
			toCsv(['Title', 'Date', 'Mood', 'Body'], rows)
		);
	}
</script>

<div class="kn-stagger flex flex-col gap-4">
	<div class="flex items-center justify-between gap-2">
		<MonthNav monthKey={month} onChange={(m) => (month = m)} />
		<div class="flex items-center gap-2">
			{#if selected.size}
				<span class="text-sm text-muted-foreground">{selected.size} selected</span>
				<Button variant="outline" size="sm" class="gap-1.5" onclick={exportCsv}>
					<Download class="size-3.5" /> Export CSV
				</Button>
				<Button variant="ghost" size="sm" onclick={clear}>Clear</Button>
			{/if}
			<Button href="/journal/new">New entry</Button>
		</div>
	</div>

	<div class="flex flex-col gap-2">
		{#each entries.data ?? [] as e (e.id)}
			<div class="relative">
				<input
					type="checkbox"
					class="absolute left-3 top-4 z-10 size-4 cursor-pointer"
					style="accent-color: var(--primary);"
					checked={selected.has(e.id)}
					onclick={(ev) => ev.stopPropagation()}
					onchange={() => toggle(e.id)}
					aria-label="Select entry"
				/>
				<a href="/journal/{e.id}">
					<Card.Root class="transition-colors hover:bg-secondary/40">
						<Card.Header>
							<Card.Title class="pl-7 text-base">
								{e.title || 'Untitled'}
								{#if e.mood}<span class="ml-2 text-xs capitalize text-muted-foreground">· {e.mood}</span>{/if}
							</Card.Title>
							<Card.Description class="pl-7">{e.occurred_on}</Card.Description>
						</Card.Header>
						{#if e.body_text}
							<Card.Content><p class="line-clamp-2 text-sm text-muted-foreground">{e.body_text}</p></Card.Content>
						{/if}
					</Card.Root>
				</a>
			</div>
		{:else}
			<p class="py-8 text-center text-sm text-muted-foreground">No entries this month. Start writing.</p>
		{/each}
	</div>
</div>
