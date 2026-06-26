import { Extension } from '@tiptap/core';
import type { Editor, Range } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { domainOf, faviconOf } from './blocks';

export interface SlashItem {
	title: string;
	sub: string;
	icon: string;
	keywords: string;
	run: (p: { editor: Editor; range: Range }) => void;
}

function pick(editor: Editor, kind: 'image' | 'file') {
	const p = (editor.storage as unknown as Record<string, unknown>).notesPick as
		| { image?: () => void; file?: () => void }
		| undefined;
	p?.[kind]?.();
}

const ITEMS: SlashItem[] = [
	{ title: 'Text', sub: 'Plain paragraph', icon: '¶', keywords: 'text paragraph plain body', run: ({ editor, range }) => editor.chain().focus().deleteRange(range).setParagraph().run() },
	{ title: 'Heading 1', sub: 'Large section heading', icon: 'H1', keywords: 'h1 heading title big', run: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run() },
	{ title: 'Heading 2', sub: 'Medium heading', icon: 'H2', keywords: 'h2 heading subtitle', run: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run() },
	{ title: 'Heading 3', sub: 'Small heading', icon: 'H3', keywords: 'h3 heading', run: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run() },
	{ title: 'To-do', sub: 'Checklist with checkboxes', icon: '☑', keywords: 'todo task checkbox checklist', run: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleTaskList().run() },
	{ title: 'Bullet list', sub: 'Unordered list', icon: '•', keywords: 'bullet unordered list ul', run: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBulletList().run() },
	{ title: 'Numbered list', sub: 'Ordered list', icon: '1.', keywords: 'numbered ordered list ol', run: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleOrderedList().run() },
	{ title: 'Toggle', sub: 'Collapsible section', icon: '▸', keywords: 'toggle details collapse fold', run: ({ editor, range }) => editor.chain().focus().deleteRange(range).setDetails().run() },
	{ title: 'Quote', sub: 'Capture a quote', icon: '❝', keywords: 'quote blockquote', run: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBlockquote().run() },
	{ title: 'Code', sub: 'Code block', icon: '</>', keywords: 'code codeblock snippet', run: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run() },
	{ title: 'Divider', sub: 'Horizontal rule', icon: '―', keywords: 'divider hr horizontal rule line', run: ({ editor, range }) => editor.chain().focus().deleteRange(range).setHorizontalRule().run() },
	{ title: 'Callout', sub: 'Highlighted note', icon: '💡', keywords: 'callout note info highlight', run: ({ editor, range }) => editor.chain().focus().deleteRange(range).insertContent({ type: 'callout', content: [{ type: 'paragraph' }] }).run() },
	{ title: 'Image', sub: 'Upload an image', icon: '🖼', keywords: 'image picture photo upload', run: ({ editor, range }) => { editor.chain().focus().deleteRange(range).run(); pick(editor, 'image'); } },
	{ title: 'PDF / File', sub: 'Upload a file', icon: '📄', keywords: 'pdf file attachment upload document', run: ({ editor, range }) => { editor.chain().focus().deleteRange(range).run(); pick(editor, 'file'); } },
	{ title: 'Bookmark', sub: 'Link as a card', icon: '🔖', keywords: 'bookmark link url web preview', run: ({ editor, range }) => { const url = window.prompt('Paste a link'); editor.chain().focus().deleteRange(range).run(); if (url) editor.chain().focus().insertContent({ type: 'bookmark', attrs: { href: url, domain: domainOf(url), favicon: faviconOf(url) } }).run(); } }
];

export const SlashCommand = Extension.create({
	name: 'slashCommand',
	addProseMirrorPlugins() {
		return [
			Suggestion<SlashItem>({
				editor: this.editor,
				char: '/',
				allowSpaces: false,
				startOfLine: false,
				command: ({ editor, range, props }) => props.run({ editor, range }),
				items: ({ query }) => {
					const q = query.toLowerCase();
					return ITEMS.filter((i) => (i.title + ' ' + i.keywords).toLowerCase().includes(q)).slice(0, 10);
				},
				render: () => {
					let el: HTMLDivElement;
					let items: SlashItem[] = [];
					let selected = 0;
					let run: (i: SlashItem) => void = () => {};

					const draw = () => {
						el.innerHTML = '';
						if (!items.length) {
							const empty = document.createElement('div');
							empty.className = 'slash-empty';
							empty.textContent = 'No blocks';
							el.appendChild(empty);
							return;
						}
						items.forEach((it, idx) => {
							const row = document.createElement('button');
							row.type = 'button';
							row.className = 'slash-item' + (idx === selected ? ' is-sel' : '');
							const ic = document.createElement('span');
							ic.className = 'slash-ic';
							ic.textContent = it.icon;
							const meta = document.createElement('span');
							meta.className = 'slash-meta';
							const t = document.createElement('span');
							t.className = 'slash-title';
							t.textContent = it.title;
							const s = document.createElement('span');
							s.className = 'slash-sub';
							s.textContent = it.sub;
							meta.append(t, s);
							row.append(ic, meta);
							row.addEventListener('mousedown', (e) => {
								e.preventDefault();
								run(it);
							});
							row.addEventListener('mouseenter', () => {
								selected = idx;
								highlight();
							});
							el.appendChild(row);
						});
					};
					const highlight = () => {
						[...el.children].forEach((c, i) => c.classList.toggle('is-sel', i === selected));
					};
					const place = (rect: DOMRect | null | undefined) => {
						if (!rect) return;
						const maxTop = window.innerHeight - 340;
						el.style.left = `${Math.min(rect.left, window.innerWidth - 300)}px`;
						el.style.top = `${Math.min(rect.bottom + 6, maxTop)}px`;
					};

					return {
						onStart: (props) => {
							items = props.items;
							selected = 0;
							run = (it) => props.command(it);
							el = document.createElement('div');
							el.className = 'slash-menu';
							document.body.appendChild(el);
							draw();
							place(props.clientRect?.());
						},
						onUpdate: (props) => {
							items = props.items;
							selected = 0;
							el.style.display = '';
							draw();
							place(props.clientRect?.());
						},
						onKeyDown: (props) => {
							const k = props.event.key;
							if (!items.length && k !== 'Escape') return false;
							if (k === 'ArrowDown') {
								selected = (selected + 1) % items.length;
								highlight();
								return true;
							}
							if (k === 'ArrowUp') {
								selected = (selected - 1 + items.length) % items.length;
								highlight();
								return true;
							}
							if (k === 'Enter') {
								if (items[selected]) run(items[selected]);
								return true;
							}
							if (k === 'Escape') {
								el.style.display = 'none';
								return true;
							}
							return false;
						},
						onExit: () => {
							el?.remove();
						}
					};
				}
			})
		];
	}
});
