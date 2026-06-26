<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { listNotes } from '$lib/notes/notes';

	const notes = createQuery(() => ({ queryKey: ['notes'], queryFn: () => listNotes() }));
</script>

<div class="kn-stagger flex flex-col gap-4">
	<div class="flex items-center justify-between">
		<h1 class="text-xl font-semibold tracking-tight">Notes</h1>
		<Button href="/notes/new">New note</Button>
	</div>

	<div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
		{#each notes.data ?? [] as n (n.id)}
			<a href="/notes/{n.id}">
				<Card.Root class="h-full transition-colors hover:bg-secondary/40">
					<Card.Header>
						<Card.Title class="text-base">{n.pinned ? '📌 ' : ''}{n.title || 'Untitled'}</Card.Title>
					</Card.Header>
					{#if n.body_text}
						<Card.Content><p class="line-clamp-4 text-sm text-muted-foreground">{n.body_text}</p></Card.Content>
					{/if}
				</Card.Root>
			</a>
		{:else}
			<p class="py-8 text-center text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">No notes yet.</p>
		{/each}
	</div>
</div>
