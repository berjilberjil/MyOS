<script lang="ts">
	import { goto } from '$app/navigation';
	import { useQueryClient } from '@tanstack/svelte-query';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { cn } from '$lib/utils';
	import Editor from '$lib/components/journal/Editor.svelte';
	import { createNote, updateNote, type Note } from '$lib/notes/notes';
	import type { JournalDoc } from '$lib/journal/types';

	let { note }: { note?: Note } = $props();

	const qc = useQueryClient();
	const noteId = note?.id ?? crypto.randomUUID();

	/* svelte-ignore state_referenced_locally */
	let title = $state(note?.title ?? '');
	/* svelte-ignore state_referenced_locally */
	let pinned = $state(note?.pinned ?? false);
	/* svelte-ignore state_referenced_locally */
	let doc = $state<JournalDoc>(note?.body_json ?? { type: 'doc', content: [] });
	let saving = $state(false);

	async function save() {
		saving = true;
		try {
			const body_json = $state.snapshot(doc) as JournalDoc;
			if (note) await updateNote(note.id, { title, body_json, pinned });
			else await createNote({ id: noteId, title, body_json, pinned });
			qc.invalidateQueries({ queryKey: ['notes'] });
			goto('/notes');
		} finally {
			saving = false;
		}
	}
</script>

<div class="flex flex-col gap-3">
	<div class="flex flex-wrap items-center gap-2">
		<Input placeholder="Title" bind:value={title} class="w-64" />
		<button
			class={cn('rounded-full border px-3 py-1 text-xs', pinned ? 'bg-secondary' : 'border-border')}
			onclick={() => (pinned = !pinned)}
		>
			📌 {pinned ? 'Pinned' : 'Pin'}
		</button>
	</div>

	<Editor content={doc} onUpdate={(d) => (doc = d)} />

	<div class="flex gap-2">
		<Button disabled={saving} onclick={save}>{saving ? 'Saving…' : 'Save note'}</Button>
		<Button variant="ghost" onclick={() => goto('/notes')}>Cancel</Button>
	</div>
</div>
