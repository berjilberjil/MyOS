<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Card from '$lib/components/ui/card';
	import { supabaseBrowser } from '$lib/supabase/client';
	import {
		profileState,
		setAvatar,
		resetAvatar,
		setName,
		fileToAvatar,
		DEFAULT_AVATAR
	} from '$lib/stores/profile.svelte';
	import { setTheme, themeState, type Theme } from '$lib/stores/theme.svelte';
	import Camera from '@lucide/svelte/icons/camera';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import LogOut from '@lucide/svelte/icons/log-out';

	let fileEl: HTMLInputElement;
	let name = $state('');
	let email = $state('');
	let status = $state('');
	let busy = $state(false);

	onMount(async () => {
		name = profileState.name;
		const { data } = await supabaseBrowser().auth.getUser();
		email = data.user?.email ?? '';
	});

	async function onPick(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (!file) return;
		busy = true;
		status = '';
		try {
			setAvatar(await fileToAvatar(file));
			status = 'Photo updated.';
			toast.success('Profile photo updated');
		} catch (err) {
			status = err instanceof Error ? err.message : 'Could not update photo.';
			toast.error('Could not update photo');
		}
		busy = false;
	}

	function reset() {
		resetAvatar();
		status = 'Photo reset to default.';
		toast.success('Photo reset to default');
	}

	function saveName() {
		setName(name);
		name = profileState.name;
		status = 'Name saved.';
		toast.success('Name saved');
	}

	const themes: { key: Theme; label: string }[] = [
		{ key: 'light', label: 'Light' },
		{ key: 'dark', label: 'Dark' },
		{ key: 'tui', label: 'Tokyo' },
		{ key: 'system', label: 'System' }
	];
	function pickTheme(t: Theme) {
		themeState.current = t;
		setTheme(t);
	}

	async function logout() {
		await supabaseBrowser().auth.signOut();
		await goto('/login');
	}

	const isDefault = $derived(profileState.avatar === DEFAULT_AVATAR);
</script>

<div class="kn-stagger mx-auto flex w-full max-w-2xl flex-col gap-4">
	<div>
		<h1 class="text-xl font-semibold tracking-tight">Profile</h1>
		<p class="text-sm text-muted-foreground">How you show up across MyOS.</p>
	</div>

	<Card.Root>
		<Card.Content class="flex flex-col gap-5 pt-6 sm:flex-row sm:items-center">
			<div class="ava-wrap">
				<img class="ava" src={profileState.avatar} alt={profileState.name} />
				<button
					class="ava-edit"
					onclick={() => fileEl.click()}
					disabled={busy}
					aria-label="Change photo"
				>
					<Camera class="size-4" />
				</button>
			</div>

			<div class="flex flex-1 flex-col gap-3">
				<div class="flex flex-wrap gap-2">
					<Button variant="outline" size="sm" class="gap-2" disabled={busy} onclick={() => fileEl.click()}>
						<Camera class="size-4" /> Change photo
					</Button>
					<Button
						variant="ghost"
						size="sm"
						class="gap-2"
						disabled={busy || isDefault}
						onclick={reset}
					>
						<RotateCcw class="size-4" /> Reset
					</Button>
				</div>
				<p class="text-xs text-muted-foreground">JPG or PNG. Cropped to a square, stored on this device.</p>
				{#if status}<p class="text-xs text-primary">{status}</p>{/if}
			</div>

			<input
				bind:this={fileEl}
				type="file"
				accept="image/png,image/jpeg,image/webp"
				class="hidden"
				onchange={onPick}
			/>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title>Display name</Card.Title>
			<Card.Description>Shown on the lock screen and sidebar.</Card.Description>
		</Card.Header>
		<Card.Content class="flex gap-2">
			<Input bind:value={name} placeholder="Your name" class="max-w-xs" onkeydown={(e) => e.key === 'Enter' && saveName()} />
			<Button size="sm" disabled={!name.trim() || name === profileState.name} onclick={saveName}>Save</Button>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title>Appearance</Card.Title>
			<Card.Description>Theme used everywhere.</Card.Description>
		</Card.Header>
		<Card.Content class="flex flex-wrap gap-2">
			{#each themes as t (t.key)}
				<Button
					variant={themeState.current === t.key ? 'default' : 'outline'}
					size="sm"
					onclick={() => pickTheme(t.key)}
				>
					{t.label}
				</Button>
			{/each}
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title>Account</Card.Title>
			<Card.Description>{email || 'Signed in'}</Card.Description>
		</Card.Header>
		<Card.Content>
			<Button variant="outline" size="sm" class="gap-2" onclick={logout}>
				<LogOut class="size-4" /> Log out
			</Button>
		</Card.Content>
	</Card.Root>
</div>

<style>
	.ava-wrap {
		position: relative;
		flex-shrink: 0;
		width: 96px;
		height: 96px;
	}
	.ava {
		height: 96px;
		width: 96px;
		border-radius: 9999px;
		object-fit: cover;
		object-position: center 18%;
		background: radial-gradient(
			circle at 50% 32%,
			color-mix(in oklch, var(--primary) 16%, var(--card)),
			var(--card)
		);
		box-shadow:
			0 0 0 1.5px color-mix(in oklch, var(--primary) 35%, transparent),
			0 0 0 5px color-mix(in oklch, var(--primary) 10%, transparent);
	}
	.ava-edit {
		position: absolute;
		right: -2px;
		bottom: -2px;
		display: grid;
		height: 30px;
		width: 30px;
		place-items: center;
		border-radius: 9999px;
		border: 2px solid var(--card);
		background: var(--primary);
		color: var(--primary-foreground);
		transition: transform var(--duration-fast) var(--ease-entrance);
	}
	.ava-edit:hover {
		transform: scale(1.08);
	}
	.ava-edit:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}
	.ava-edit:disabled {
		opacity: 0.6;
	}
</style>
