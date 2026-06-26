<script lang="ts">
	import { Spinner } from '$lib/components/ui/spinner';
	import { Toaster as Sonner, type ToasterProps as SonnerProps } from 'svelte-sonner';
	import { mode } from 'mode-watcher';

	let { ...restProps }: SonnerProps = $props();
</script>

<Sonner
	theme={mode.current}
	class="toaster group"
	style="--normal-bg: var(--color-popover); --normal-text: var(--color-popover-foreground); --normal-border: var(--color-border);"
	{...restProps}
	>{#snippet loadingIcon()}
		<Spinner size={16} />
	{/snippet}
	{#snippet successIcon()}{/snippet}
	{#snippet errorIcon()}{/snippet}
	{#snippet infoIcon()}{/snippet}
	{#snippet warningIcon()}{/snippet}
</Sonner>
