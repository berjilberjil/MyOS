<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import MonthNav from '$lib/components/finance/MonthNav.svelte';
	import { monthKey, todayIso } from '$lib/finance/dates';
	import { listByMonth } from '$lib/journal/entries';

	let month = $state(monthKey(todayIso()));
	const entries = createQuery(() => ({ queryKey: ['journal', month], queryFn: () => listByMonth(month) }));
</script>

<div class="kn-stagger flex flex-col gap-4">
	<div class="flex items-center justify-between">
		<h1 class="text-xl font-semibold tracking-tight">Journal</h1>
		<Button href="/journal/new">New entry</Button>
	</div>

	<MonthNav monthKey={month} onChange={(m) => (month = m)} />

	<div class="flex flex-col gap-2">
		{#each entries.data ?? [] as e (e.id)}
			<a href="/journal/{e.id}">
				<Card.Root class="transition-colors hover:bg-secondary/40">
					<Card.Header>
						<Card.Title class="text-base">
							{e.title || 'Untitled'}
							{#if e.mood}<span class="ml-2 text-xs capitalize text-muted-foreground">· {e.mood}</span>{/if}
						</Card.Title>
						<Card.Description>{e.occurred_on}</Card.Description>
					</Card.Header>
					{#if e.body_text}
						<Card.Content><p class="line-clamp-2 text-sm text-muted-foreground">{e.body_text}</p></Card.Content>
					{/if}
				</Card.Root>
			</a>
		{:else}
			<p class="py-8 text-center text-sm text-muted-foreground">No entries this month. Start writing.</p>
		{/each}
	</div>
</div>
