<script lang="ts">
	import { onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { useQueryClient } from '@tanstack/svelte-query';
	import { Input } from '$lib/components/ui/input';
	import { cn } from '$lib/utils';
	import NotesEditor from '$lib/notes/editor/NotesEditor.svelte';
	import { createEntry, updateEntry } from '$lib/journal/entries';
	import { uploadJournalImage, uploadJournalFile, signedUrlFor } from '$lib/journal/media';
	import { withPathMedia } from '$lib/notes/media';
	import { todayIso } from '$lib/finance/dates';
	import { MOODS, type JournalDoc, type JournalEntry } from '$lib/journal/types';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Download from '@lucide/svelte/icons/download';

	let { entry, date }: { entry?: JournalEntry; date?: string } = $props();

	const qc = useQueryClient();
	const entryId = entry?.id ?? crypto.randomUUID();

	/* svelte-ignore state_referenced_locally */
	let title = $state(entry?.title ?? '');
	/* svelte-ignore state_referenced_locally */
	let mood = $state<string | null>(entry?.mood ?? null);
	/* svelte-ignore state_referenced_locally */
	let occurredOn = $state(entry?.occurred_on ?? date ?? todayIso());
	/* svelte-ignore state_referenced_locally */
	let doc = $state<JournalDoc>(entry?.body_json ?? { type: 'doc', content: [] });

	/* svelte-ignore state_referenced_locally */
	let created = $state(!!entry);
	let touched = false;
	let saveState = $state<'idle' | 'saving' | 'saved'>('idle');
	let timer: ReturnType<typeof setTimeout> | undefined;

	async function handleImage(file: File): Promise<string> {
		const path = await uploadJournalImage(file, entryId);
		return signedUrlFor(path);
	}
	async function handleFile(file: File) {
		const up = await uploadJournalFile(file, entryId);
		return { src: await signedUrlFor(up.path), name: up.name, size: up.size, mime: up.mime };
	}

	async function persist() {
		saveState = 'saving';
		try {
			const body_json = withPathMedia($state.snapshot(doc) as JournalDoc);
			if (created) {
				await updateEntry(entryId, { title, body_json, mood, occurred_on: occurredOn });
			} else {
				await createEntry({ id: entryId, title, body_json, mood, occurred_on: occurredOn });
				created = true;
			}
			qc.invalidateQueries({ queryKey: ['journal'] });
			saveState = 'saved';
		} catch {
			saveState = 'idle';
			toast.error('Could not save entry');
		}
	}

	function markDirty() {
		touched = true;
	}

	$effect(() => {
		void [title, mood, occurredOn, doc];
		if (!touched) return;
		saveState = 'saving';
		clearTimeout(timer);
		timer = setTimeout(persist, 700);
	});

	onDestroy(() => clearTimeout(timer));

	async function back() {
		clearTimeout(timer);
		if (touched) await persist();
		goto('/journal');
	}
</script>

<div class="flex w-full max-w-3xl flex-col gap-3">
	<div class="no-print flex items-center justify-between gap-2">
		<button class="chip" onclick={back}>
			<ArrowLeft class="size-3.5" />
			Back
		</button>
		<div class="flex items-center gap-2">
			<span class="status">
				{#if saveState === 'saving'}Saving…{:else if saveState === 'saved'}Saved{/if}
			</span>
			<button class="chip" onclick={() => window.print()}>
				<Download class="size-3.5" />
				PDF
			</button>
		</div>
	</div>

	<div class="no-print flex flex-wrap items-center gap-2">
		<Input placeholder="Title" bind:value={title} oninput={markDirty} class="w-64" />
		<Input type="date" bind:value={occurredOn} oninput={markDirty} class="w-40" />
		<div class="flex gap-1">
			{#each MOODS as m}
				<button
					class={cn('rounded-full border px-3 py-1 text-xs capitalize', mood === m ? 'bg-secondary' : 'border-border')}
					onclick={() => {
						mood = mood === m ? null : m;
						markDirty();
					}}
				>
					{m}
				</button>
			{/each}
		</div>
	</div>

	<div class="print-area flex flex-col gap-3">
		<div class="print-only">
			<h1 style="font-size:1.8rem;font-weight:700;margin:0;">{title || 'Untitled'}</h1>
			<p style="color:#666;margin:.2rem 0 0;">{occurredOn}{mood ? ` · ${mood}` : ''}</p>
		</div>
		<NotesEditor
			content={doc}
			onUpdate={(d) => {
				doc = d;
				markDirty();
			}}
			onImageUpload={handleImage}
			onFileUpload={handleFile}
			placeholder="Write about your day, or press “/” for blocks…"
		/>
	</div>
</div>

<style>
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
</style>
