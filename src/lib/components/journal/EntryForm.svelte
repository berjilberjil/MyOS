<script lang="ts">
	import { goto } from '$app/navigation';
	import { useQueryClient } from '@tanstack/svelte-query';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { cn } from '$lib/utils';
	import Editor from './Editor.svelte';
	import { createEntry, updateEntry } from '$lib/journal/entries';
	import { uploadJournalImage, signedUrlFor, withPathImages } from '$lib/journal/media';
	import { todayIso } from '$lib/finance/dates';
	import { MOODS, type JournalDoc, type JournalEntry } from '$lib/journal/types';

	let { entry }: { entry?: JournalEntry } = $props();

	const qc = useQueryClient();
	const entryId = entry?.id ?? crypto.randomUUID();

	// EntryForm is remounted per entry via {#key}, so capturing initial prop values is intended.
	/* svelte-ignore state_referenced_locally */
	let title = $state(entry?.title ?? '');
	/* svelte-ignore state_referenced_locally */
	let mood = $state<string | null>(entry?.mood ?? null);
	/* svelte-ignore state_referenced_locally */
	let occurredOn = $state(entry?.occurred_on ?? todayIso());
	/* svelte-ignore state_referenced_locally */
	let doc = $state<JournalDoc>(entry?.body_json ?? { type: 'doc', content: [] });
	let saving = $state(false);

	async function handleImage(file: File): Promise<string> {
		const path = await uploadJournalImage(file, entryId);
		return signedUrlFor(path);
	}

	async function save() {
		saving = true;
		try {
			// doc is a Svelte $state proxy; snapshot to a plain object before cloning/serializing.
			const body_json = withPathImages($state.snapshot(doc) as JournalDoc);
			if (entry) {
				await updateEntry(entry.id, { title, body_json, mood, occurred_on: occurredOn });
			} else {
				await createEntry({ id: entryId, title, body_json, mood, occurred_on: occurredOn });
			}
			qc.invalidateQueries({ queryKey: ['journal'] });
			goto('/journal');
		} finally {
			saving = false;
		}
	}
</script>

<div class="flex flex-col gap-3">
	<div class="flex flex-wrap items-center gap-2">
		<Input placeholder="Title" bind:value={title} class="w-64" />
		<Input type="date" bind:value={occurredOn} class="w-40" />
		<div class="flex gap-1">
			{#each MOODS as m}
				<button
					class={cn('rounded-full border px-3 py-1 text-xs capitalize', mood === m ? 'bg-secondary' : 'border-border')}
					onclick={() => (mood = mood === m ? null : m)}
				>
					{m}
				</button>
			{/each}
		</div>
	</div>

	<Editor content={doc} onUpdate={(d) => (doc = d)} onImageUpload={handleImage} />

	<div class="flex gap-2">
		<Button disabled={saving} onclick={save}>{saving ? 'Saving…' : 'Save entry'}</Button>
		<Button variant="ghost" onclick={() => goto('/journal')}>Cancel</Button>
	</div>
</div>
