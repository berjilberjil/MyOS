<script lang="ts">
	import { page } from '$app/state';
	import { createQuery } from '@tanstack/svelte-query';
	import NoteForm from '$lib/components/notes/NoteForm.svelte';
	import { notesRepo } from '$lib/notes/notes';

	const id = $derived(page.params.id ?? '');
	const note = createQuery(() => ({ queryKey: ['notes', 'one', id], queryFn: () => notesRepo.get(id) }));
</script>

<div class="flex flex-col gap-4">
	<h1 class="text-xl font-semibold tracking-tight">Edit note</h1>
	{#if note.data}
		{#key note.data.id}
			<NoteForm note={note.data} />
		{/key}
	{:else if note.isLoading}
		<p class="text-sm text-muted-foreground">Loading…</p>
	{:else}
		<p class="text-sm text-muted-foreground">Note not found.</p>
	{/if}
</div>
