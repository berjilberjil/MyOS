<script lang="ts">
	import { onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { useQueryClient } from '@tanstack/svelte-query';
	import NotesEditor from '$lib/notes/editor/NotesEditor.svelte';
	import { createNote, updateNote, type Note } from '$lib/notes/notes';
	import { uploadNoteImage, uploadNoteFile, withPathMedia } from '$lib/notes/media';
	import { signedUrlFor } from '$lib/journal/media';
	import type { JournalDoc } from '$lib/journal/types';
	import Pin from '@lucide/svelte/icons/pin';
	import Link2 from '@lucide/svelte/icons/link';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Download from '@lucide/svelte/icons/download';

	let { note }: { note?: Note } = $props();

	const qc = useQueryClient();
	const savedId = note?.id ?? crypto.randomUUID();

	/* svelte-ignore state_referenced_locally */
	let title = $state(note?.title ?? '');
	/* svelte-ignore state_referenced_locally */
	let pinned = $state(note?.pinned ?? false);
	/* svelte-ignore state_referenced_locally */
	let doc = $state<JournalDoc>(note?.body_json ?? { type: 'doc', content: [] });

	/* svelte-ignore state_referenced_locally */
	let created = $state(!!note);
	let touched = false;
	let saveState = $state<'idle' | 'saving' | 'saved'>('idle');
	let copied = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;

	async function handleImage(file: File): Promise<string> {
		const path = await uploadNoteImage(file, savedId);
		return signedUrlFor(path);
	}
	async function handleFile(file: File) {
		const up = await uploadNoteFile(file, savedId);
		return { src: await signedUrlFor(up.path), name: up.name, size: up.size, mime: up.mime };
	}

	async function persist() {
		saveState = 'saving';
		try {
			const body_json = withPathMedia($state.snapshot(doc) as JournalDoc);
			if (created) {
				await updateNote(savedId, { title, body_json, pinned });
			} else {
				await createNote({ id: savedId, title, body_json, pinned });
				created = true;
			}
			qc.invalidateQueries({ queryKey: ['notes'] });
			saveState = 'saved';
		} catch {
			saveState = 'idle';
		}
	}

	function markDirty() {
		touched = true;
	}

	// Debounced auto-save whenever the note changes.
	$effect(() => {
		void [title, pinned, doc];
		if (!touched) return;
		saveState = 'saving';
		clearTimeout(timer);
		timer = setTimeout(persist, 700);
	});

	onDestroy(() => clearTimeout(timer));

	function share() {
		navigator.clipboard?.writeText(`${location.origin}/notes/${savedId}`);
		copied = true;
		setTimeout(() => (copied = false), 1600);
	}

	async function back() {
		clearTimeout(timer);
		if (touched) await persist();
		goto('/notes');
	}
</script>

<div class="mx-auto flex w-full max-w-3xl flex-col gap-4">
	<div class="no-print flex items-center justify-between gap-2">
		<button class="chip" onclick={back}>
			<ArrowLeft class="size-3.5" />
			Back
		</button>
		<div class="flex items-center gap-2">
			<span class="status">
				{#if saveState === 'saving'}Saving…{:else if saveState === 'saved'}Saved{/if}
			</span>
			<button class="chip" class:on={pinned} onclick={() => { pinned = !pinned; markDirty(); }} aria-pressed={pinned}>
				<Pin class="size-3.5" />
				{pinned ? 'Pinned' : 'Pin'}
			</button>
			<button class="chip" onclick={() => window.print()}>
				<Download class="size-3.5" />
				PDF
			</button>
			<button class="chip" onclick={share}>
				<Link2 class="size-3.5" />
				{copied ? 'Copied' : 'Share'}
			</button>
		</div>
	</div>

	<div class="print-area flex flex-col gap-4">
		<input class="title-input" placeholder="Untitled" bind:value={title} oninput={markDirty} />

		<NotesEditor
			content={doc}
			onUpdate={(d) => {
				doc = d;
				markDirty();
			}}
			onImageUpload={handleImage}
			onFileUpload={handleFile}
		/>
	</div>
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
	.status {
		min-width: 3.5rem;
		text-align: right;
		font-size: var(--text-xs);
		color: var(--muted-foreground);
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
