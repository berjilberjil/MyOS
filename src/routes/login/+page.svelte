<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Card from '$lib/components/ui/card';
	import { supabaseBrowser } from '$lib/supabase/client';
	import { goto, invalidateAll } from '$app/navigation';

	let email = $state('');
	let password = $state('');
	let code = $state('');
	let needMfa = $state(false);
	let factorId = $state('');
	let error = $state('');
	let busy = $state(false);

	async function signIn() {
		busy = true;
		error = '';
		const sb = supabaseBrowser();
		const { error: e } = await sb.auth.signInWithPassword({ email, password });
		if (e) {
			error = e.message;
			busy = false;
			return;
		}
		const { data } = await sb.auth.mfa.listFactors();
		const totp = data?.totp?.[0];
		if (totp) {
			factorId = totp.id;
			needMfa = true;
			busy = false;
		} else {
			await invalidateAll();
			await goto('/');
		}
	}

	async function verify() {
		busy = true;
		error = '';
		const sb = supabaseBrowser();
		const { data: ch, error: ce } = await sb.auth.mfa.challenge({ factorId });
		if (ce || !ch) {
			error = ce?.message ?? 'Challenge failed';
			busy = false;
			return;
		}
		const { error: e } = await sb.auth.mfa.verify({ factorId, challengeId: ch.id, code });
		if (e) {
			error = e.message;
			busy = false;
			return;
		}
		await invalidateAll();
		await goto('/');
	}
</script>

<div class="grid h-dvh place-items-center p-4">
	<Card.Root class="kn-enter w-full max-w-sm">
		<Card.Header>
			<Card.Title>MyOS</Card.Title>
			<Card.Description>{needMfa ? 'Enter your authenticator code' : 'Sign in'}</Card.Description>
		</Card.Header>
		<Card.Content class="flex flex-col gap-3">
			{#if !needMfa}
				<Input bind:value={email} placeholder="email" type="email" autocomplete="username" />
				<Input
					bind:value={password}
					placeholder="password"
					type="password"
					autocomplete="current-password"
					onkeydown={(e) => e.key === 'Enter' && signIn()}
				/>
				<Button class="w-full" disabled={busy} onclick={signIn}>Sign in</Button>
			{:else}
				<Input
					bind:value={code}
					placeholder="6-digit code"
					inputmode="numeric"
					onkeydown={(e) => e.key === 'Enter' && verify()}
				/>
				<Button class="w-full" disabled={busy} onclick={verify}>Verify</Button>
			{/if}
			{#if error}<p class="text-sm text-destructive">{error}</p>{/if}
		</Card.Content>
	</Card.Root>
</div>
