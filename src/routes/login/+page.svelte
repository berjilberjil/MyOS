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

<svelte:head>
	<link rel="preload" as="image" href="/me.webp" />
</svelte:head>

<div class="auth">
	<div class="dots" aria-hidden="true"></div>

	<div class="split kn-enter">
		<section class="welcome">
			<div class="float">
				<img
					class="ava"
					src={profileState.avatar}
					alt="{profileState.name}'s avatar"
					width="200"
					height="200"
					fetchpriority="high"
					decoding="async"
				/>
			</div>
			<h1 class="greet">{hello},<br /><span class="name">{profileState.name}</span></h1>
			<p class="sub">Welcome back to your OS.</p>
		</section>

		<section class="form-col">
			<h2 class="form-title">{needMfa ? 'Verify it’s you' : 'Sign in'}</h2>
			<p class="form-hint">
				{needMfa ? 'Enter your authenticator code.' : 'Use your owner credentials.'}
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
		</section>
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
	.dots {
		position: fixed;
		inset: 0;
		z-index: 0;
		background-image: radial-gradient(circle, rgba(255, 255, 255, 0.1) 1px, transparent 1.5px);
		background-size: 24px 24px;
	}

	.split {
		position: relative;
		z-index: 1;
		display: grid;
		width: 100%;
		max-width: 56rem;
		grid-template-columns: 1fr;
		gap: 2.5rem;
		align-items: center;
	}
	@media (min-width: 768px) {
		.split {
			grid-template-columns: 1.05fr 1fr;
			gap: 0;
		}
	}

	/* Left — welcome + avatar */
	.welcome {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 0.5rem;
	}
	@media (min-width: 768px) {
		.welcome {
			align-items: flex-start;
			text-align: left;
			padding-right: 3rem;
		}
	}
	.float {
		animation: float 5.5s ease-in-out infinite;
	}
	.ava {
		display: block;
		height: 200px;
		width: 200px;
		object-fit: contain;
		filter: drop-shadow(0 18px 32px rgb(0 0 0 / 0.6));
	}
	.greet {
		font-size: clamp(1.7rem, 4vw, 2.4rem);
		font-weight: 600;
		line-height: 1.1;
		letter-spacing: -0.02em;
		color: #fff;
		margin-top: 0.5rem;
	}
	.greet .name {
		color: var(--primary);
	}
	.sub {
		font-size: var(--text-sm);
		color: rgb(255 255 255 / 0.55);
	}

	/* Right — form */
	.form-col {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 0.6rem;
	}
	@media (min-width: 768px) {
		.form-col {
			border-left: 1px solid rgb(255 255 255 / 0.1);
			padding-left: 3rem;
		}
	}
	.form-title {
		font-size: var(--text-xl);
		font-weight: 600;
		color: #fff;
	}
	.form-hint {
		margin-top: -0.2rem;
		margin-bottom: 0.6rem;
		font-size: var(--text-sm);
		color: rgb(255 255 255 / 0.5);
	}
	.form {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}
	.err {
		font-size: var(--text-sm);
		color: var(--destructive);
	}
	.foot {
		margin-top: 1.1rem;
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
