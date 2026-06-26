<script lang="ts">
	import { goto } from '$app/navigation';
	import { useQueryClient } from '@tanstack/svelte-query';
	import { Button } from '$lib/components/ui/button';
	import NotesEditor from '$lib/notes/editor/NotesEditor.svelte';
	import { createNote, updateNote, type Note } from '$lib/notes/notes';
	import { uploadNoteImage, uploadNoteFile, withPathMedia } from '$lib/notes/media';
	import { signedUrlFor } from '$lib/journal/media';
	import type { JournalDoc } from '$lib/journal/types';
	import Pin from '@lucide/svelte/icons/pin';
	import Link2 from '@lucide/svelte/icons/link';

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
	let copied = $state(false);

	async function handleImage(file: File): Promise<string> {
		const path = await uploadNoteImage(file, noteId);
		return signedUrlFor(path);
	}
	async function handleFile(file: File) {
		const up = await uploadNoteFile(file, noteId);
		return { src: await signedUrlFor(up.path), name: up.name, size: up.size, mime: up.mime };
	}

	function share() {
		navigator.clipboard?.writeText(`${location.origin}/notes/${noteId}`);
		copied = true;
		setTimeout(() => (copied = false), 1600);
	}

	async function save() {
		saving = true;
		try {
			const body_json = withPathMedia($state.snapshot(doc) as JournalDoc);
			if (note) await updateNote(note.id, { title, body_json, pinned });
			else await createNote({ id: noteId, title, body_json, pinned });
			qc.invalidateQueries({ queryKey: ['notes'] });
			goto('/notes');
		} finally {
			saving = false;
		}
	}
</script>

<div class="mx-auto flex w-full max-w-3xl flex-col gap-4">
	<div class="flex items-center justify-between gap-2">
		<button
			class="chip"
			class:on={pinned}
			onclick={() => (pinned = !pinned)}
			aria-pressed={pinned}
		>
			<Pin class="size-3.5" />
			{pinned ? 'Pinned' : 'Pin'}
		</button>
		<div class="flex items-center gap-2">
			<button class="chip" onclick={share}>
				<Link2 class="size-3.5" />
				{copied ? 'Copied' : 'Share'}
			</button>
			<Button variant="ghost" size="sm" onclick={() => goto('/notes')}>Cancel</Button>
			<Button size="sm" disabled={saving} onclick={save}>{saving ? 'Saving…' : 'Save'}</Button>
		</div>
	</div>

	<input
		class="title-input"
		placeholder="Untitled"
		bind:value={title}
	/>

	<NotesEditor content={doc} onUpdate={(d) => (doc = d)} onImageUpload={handleImage} onFileUpload={handleFile} />
</div>

<style>
	.title-input {
		width: 100%;
		background: transparent;
		border: none;
		outline: none;
		font-size: 2rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		color: var(--foreground);
		padding: 0;
	}
	.title-input::placeholder {
		color: color-mix(in oklch, var(--muted-foreground) 60%, transparent);
	}
	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		border-radius: 9999px;
		border: 1px solid var(--border);
		padding: 0.3rem 0.7rem;
		font-size: var(--text-xs);
		color: var(--muted-foreground);
		transition: background-color var(--duration-fast) ease, color var(--duration-fast) ease;
	}
	.chip:hover {
		background: var(--accent);
		color: var(--accent-foreground);
	}
	.chip.on {
		background: color-mix(in oklch, var(--primary) 14%, transparent);
		border-color: color-mix(in oklch, var(--primary) 40%, var(--border));
		color: var(--primary);
	}
</style>
