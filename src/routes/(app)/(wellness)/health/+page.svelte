<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { cn } from '$lib/utils';
	import { todayIso } from '$lib/finance/dates';
	import { recentHealth, upsertHealth } from '$lib/health/logs';
	import { kgToG, gToKg, hoursToMin, minToHours } from '$lib/health/units';
	import { MOODS } from '$lib/journal/types';

	const qc = useQueryClient();
	const logs = createQuery(() => ({ queryKey: ['health'], queryFn: () => recentHealth() }));

	let loggedOn = $state(todayIso());
	let weight = $state('');
	let sleep = $state('');
	let water = $state('');
	let mood = $state<string | null>(null);

	const save = createMutation(() => ({
		mutationFn: () =>
			upsertHealth(loggedOn, {
				weight_g: weight ? kgToG(Number(weight)) : null,
				sleep_min: sleep ? hoursToMin(Number(sleep)) : null,
				water_ml: water ? Number(water) : null,
				mood
			}),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['health'] });
			weight = '';
			sleep = '';
			water = '';
			mood = null;
		}
	}));

	const latestWeight = $derived((logs.data ?? []).find((l) => l.weight_g != null));
</script>

<div class="kn-stagger flex flex-col gap-4">

	{#if latestWeight?.weight_g != null}
		<Card.Root>
			<Card.Header>
				<Card.Description>Latest weight ({latestWeight.logged_on})</Card.Description>
				<Card.Title class="text-2xl">{gToKg(latestWeight.weight_g)} kg</Card.Title>
			</Card.Header>
		</Card.Root>
	{/if}

	<Card.Root>
		<Card.Header><Card.Title>Log day</Card.Title></Card.Header>
		<Card.Content class="flex flex-wrap items-end gap-2">
			<Input type="date" bind:value={loggedOn} class="w-40" />
			<Input type="number" step="0.1" placeholder="Weight kg" bind:value={weight} class="w-28" />
			<Input type="number" step="0.1" placeholder="Sleep hrs" bind:value={sleep} class="w-28" />
			<Input type="number" placeholder="Water ml" bind:value={water} class="w-28" />
			<div class="flex gap-1">
				{#each MOODS as m}
					<button class={cn('rounded-full border px-3 py-1 text-xs capitalize', mood === m ? 'bg-secondary' : 'border-border')} onclick={() => (mood = mood === m ? null : m)}>{m}</button>
				{/each}
			</div>
			<Button disabled={save.isPending} onclick={() => save.mutate()}>Save</Button>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header><Card.Title class="text-base">Recent</Card.Title></Card.Header>
		<Card.Content class="divide-y divide-border">
			{#each logs.data ?? [] as l (l.id)}
				<div class="flex flex-wrap items-center gap-x-4 py-2 text-sm">
					<span class="w-24 font-medium">{l.logged_on}</span>
					{#if l.weight_g != null}<span>{gToKg(l.weight_g)} kg</span>{/if}
					{#if l.sleep_min != null}<span>{minToHours(l.sleep_min)} h sleep</span>{/if}
					{#if l.water_ml != null}<span>{l.water_ml} ml</span>{/if}
					{#if l.mood}<span class="capitalize text-muted-foreground">{l.mood}</span>{/if}
				</div>
			{:else}
				<p class="py-6 text-center text-sm text-muted-foreground">No logs yet.</p>
			{/each}
		</Card.Content>
	</Card.Root>
</div>
