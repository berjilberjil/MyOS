<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { supabaseBrowser } from '$lib/supabase/client';
	import { goto, invalidateAll } from '$app/navigation';
	import { profileState } from '$lib/stores/profile.svelte';

	let email = $state('');
	let password = $state('');
	let code = $state('');
	let needMfa = $state(false);
	let factorId = $state('');
	let error = $state('');
	let busy = $state(false);

	function greetWord(): string {
		const h = new Date().getHours();
		if (h < 5) return 'Still up';
		if (h < 12) return 'Good morning';
		if (h < 17) return 'Good afternoon';
		if (h < 21) return 'Good evening';
		return 'Good night';
	}
	const hello = greetWord();

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

<div class="auth">
	<div class="dots" aria-hidden="true"></div>

	<div class="content kn-enter">
		<div class="avatar">
			<div class="bubble" aria-hidden="true">
				{#if needMfa}One more step 🔐{:else}Hey, let's go 🚀{/if}
			</div>
			<div class="float">
				<img class="ava" src={profileState.avatar} alt="{profileState.name}'s avatar" width="160" height="160" />
			</div>
		</div>

		<h1 class="greet">{hello},<br /><span class="name">{profileState.name}</span></h1>
		<p class="sub">
			{needMfa ? 'Enter your authenticator code to continue.' : 'Welcome back to your OS.'}
		</p>

		<div class="form">
			{#if !needMfa}
				<Input bind:value={email} placeholder="email" type="email" autocomplete="username" />
				<Input
					bind:value={password}
					placeholder="password"
					type="password"
					autocomplete="current-password"
					onkeydown={(e) => e.key === 'Enter' && signIn()}
				/>
				<Button class="mt-1 w-full" disabled={busy} onclick={signIn}>
					{busy ? 'Signing in…' : 'Sign in'}
				</Button>
			{:else}
				<Input
					bind:value={code}
					placeholder="6-digit code"
					inputmode="numeric"
					onkeydown={(e) => e.key === 'Enter' && verify()}
				/>
				<Button class="mt-1 w-full" disabled={busy} onclick={verify}>
					{busy ? 'Verifying…' : 'Verify'}
				</Button>
			{/if}
			{#if error}<p class="err">{error}</p>{/if}
		</div>

		<p class="foot">Private · single-user</p>
	</div>
</div>

<style>
	.auth {
		position: relative;
		display: grid;
		min-height: 100dvh;
		place-items: center;
		overflow: hidden;
		padding: 1.5rem;
		background: #000;
	}

	/* Flat black canvas with an even, subtle white dot grid — no glow, no tint. */
	.dots {
		position: fixed;
		inset: 0;
		z-index: 0;
		background-image: radial-gradient(circle, rgba(255, 255, 255, 0.1) 1px, transparent 1.5px);
		background-size: 24px 24px;
	}

	.content {
		position: relative;
		z-index: 1;
		display: flex;
		width: 100%;
		max-width: 22rem;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}

	/* Avatar = the raw PNG, no frame. */
	.avatar {
		position: relative;
		margin-bottom: 0.4rem;
	}
	.float {
		animation: float 5.5s ease-in-out infinite;
	}
	.ava {
		display: block;
		height: 160px;
		width: 160px;
		object-fit: contain;
		filter: drop-shadow(0 18px 32px rgb(0 0 0 / 0.6));
		transition: transform var(--duration-normal) var(--ease-entrance);
	}
	.avatar:hover .ava {
		transform: scale(1.04);
	}

	.bubble {
		position: absolute;
		top: 8px;
		right: -8px;
		z-index: 2;
		white-space: nowrap;
		border-radius: 9999px;
		border: 1px solid rgb(255 255 255 / 0.12);
		background: rgb(20 20 22 / 0.95);
		color: #fff;
		padding: 0.3rem 0.65rem;
		font-size: var(--text-xs);
		font-weight: 500;
		box-shadow: 0 8px 24px -10px rgb(0 0 0 / 0.6);
		opacity: 0;
		transform: translateY(6px) scale(0.9);
		transform-origin: bottom left;
		transition:
			opacity var(--duration-fast) ease,
			transform var(--duration-normal) var(--ease-entrance);
	}
	.bubble::after {
		content: '';
		position: absolute;
		bottom: -4px;
		left: 16px;
		height: 8px;
		width: 8px;
		rotate: 45deg;
		background: rgb(20 20 22 / 0.95);
		border-right: 1px solid rgb(255 255 255 / 0.12);
		border-bottom: 1px solid rgb(255 255 255 / 0.12);
	}
	.avatar:hover .bubble {
		opacity: 1;
		transform: translateY(0) scale(1);
	}

	.greet {
		font-size: var(--text-2xl);
		font-weight: 600;
		line-height: 1.1;
		letter-spacing: -0.02em;
		color: #fff;
	}
	.greet .name {
		color: var(--primary);
	}
	.sub {
		margin-top: 0.4rem;
		margin-bottom: 1.5rem;
		font-size: var(--text-sm);
		color: rgb(255 255 255 / 0.55);
	}

	.form {
		display: flex;
		width: 100%;
		flex-direction: column;
		gap: 0.6rem;
	}
	.err {
		font-size: var(--text-sm);
		color: var(--destructive);
	}
	.foot {
		margin-top: 1.25rem;
		font-size: var(--text-xs);
		color: rgb(255 255 255 / 0.4);
	}

	@keyframes float {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-7px);
		}
	}
</style>
