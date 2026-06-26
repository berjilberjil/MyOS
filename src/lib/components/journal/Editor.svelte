<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Image from '@tiptap/extension-image';
	import Placeholder from '@tiptap/extension-placeholder';
	import { Button } from '$lib/components/ui/button';
	import type { JournalDoc } from '$lib/journal/types';

	let {
		content,
		onUpdate,
		onImageUpload
	}: {
		content: JournalDoc;
		onUpdate: (doc: JournalDoc) => void;
		onImageUpload?: (file: File) => Promise<string>;
	} = $props();

	let element: HTMLDivElement;
	let editor: Editor | undefined;
	let fileInput: HTMLInputElement;

	onMount(() => {
		editor = new Editor({
			element,
			extensions: [
				StarterKit,
				Image,
				Placeholder.configure({ placeholder: 'Write about your day…' })
			],
			content: content && Object.keys(content).length ? content : undefined,
			onUpdate: ({ editor }) => onUpdate(editor.getJSON() as JournalDoc)
		});
	});
	onDestroy(() => editor?.destroy());

	function cmd(fn: () => void) {
		fn();
		editor?.commands.focus();
	}

	async function onPick(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file || !onImageUpload || !editor) return;
		const src = await onImageUpload(file);
		editor.chain().focus().setImage({ src }).run();
		fileInput.value = '';
	}
</script>

<div class="rounded-lg border border-border">
	<div class="flex flex-wrap gap-1 border-b border-border p-1">
		<Button variant="ghost" size="sm" onclick={() => cmd(() => editor?.chain().focus().toggleBold().run())}><b>B</b></Button>
		<Button variant="ghost" size="sm" onclick={() => cmd(() => editor?.chain().focus().toggleItalic().run())}><i>I</i></Button>
		<Button variant="ghost" size="sm" onclick={() => cmd(() => editor?.chain().focus().toggleHeading({ level: 2 }).run())}>H2</Button>
		<Button variant="ghost" size="sm" onclick={() => cmd(() => editor?.chain().focus().toggleBulletList().run())}>• List</Button>
		<Button variant="ghost" size="sm" onclick={() => cmd(() => editor?.chain().focus().toggleBlockquote().run())}>❝</Button>
		{#if onImageUpload}
			<Button variant="ghost" size="sm" onclick={() => fileInput.click()}>🖼 Image</Button>
			<input bind:this={fileInput} type="file" accept="image/*" class="hidden" onchange={onPick} />
		{/if}
	</div>
	<div
		bind:this={element}
		class="prose prose-sm dark:prose-invert max-w-none min-h-48 p-3 focus-within:outline-none [&_.ProseMirror]:outline-none [&_img]:rounded-lg"
	></div>
</div>
