<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { todayIso } from '$lib/finance/dates';
	import { recentFitness, addFitness, totalDuration } from '$lib/health/logs';
	import { kmToM, mToKm } from '$lib/health/units';

	const qc = useQueryClient();
	const logs = createQuery(() => ({ queryKey: ['fitness'], queryFn: () => recentFitness() }));

	let loggedOn = $state(todayIso());
	let activity = $state('');
	let duration = $state('');
	let distance = $state('');
	let calories = $state('');

	const add = createMutation(() => ({
		mutationFn: () =>
			addFitness({
				logged_on: loggedOn,
				activity,
				duration_min: Number(duration) || 0,
				distance_m: distance ? kmToM(Number(distance)) : null,
				calories: calories ? Number(calories) : null
			}),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['fitness'] });
			activity = '';
			duration = '';
			distance = '';
			calories = '';
		}
	}));

	const weekMin = $derived(totalDuration(logs.data ?? [], todayIso(), 7));
</script>

<div class="kn-stagger flex flex-col gap-4">
	<h1 class="text-xl font-semibold tracking-tight">Fitness</h1>

	<Card.Root>
		<Card.Header>
			<Card.Description>This week</Card.Description>
			<Card.Title class="text-2xl">{weekMin} min active</Card.Title>
		</Card.Header>
	</Card.Root>

	<Card.Root>
		<Card.Header><Card.Title>Log workout</Card.Title></Card.Header>
		<Card.Content class="flex flex-wrap items-end gap-2">
			<Input type="date" bind:value={loggedOn} class="w-40" />
			<Input placeholder="Activity (e.g. Run)" bind:value={activity} class="w-40" />
			<Input type="number" placeholder="Minutes" bind:value={duration} class="w-28" />
			<Input type="number" step="0.1" placeholder="Distance km" bind:value={distance} class="w-28" />
			<Input type="number" placeholder="Calories" bind:value={calories} class="w-28" />
			<Button disabled={!activity || add.isPending} onclick={() => add.mutate()}>Add</Button>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header><Card.Title class="text-base">Recent</Card.Title></Card.Header>
		<Card.Content class="divide-y divide-border">
			{#each logs.data ?? [] as l (l.id)}
				<div class="flex flex-wrap items-center gap-x-4 py-2 text-sm">
					<span class="w-24 font-medium">{l.logged_on}</span>
					<span class="capitalize">{l.activity}</span>
					<span>{l.duration_min} min</span>
					{#if l.distance_m != null}<span>{mToKm(l.distance_m)} km</span>{/if}
					{#if l.calories != null}<span>{l.calories} cal</span>{/if}
				</div>
			{:else}
				<p class="py-6 text-center text-sm text-muted-foreground">No workouts logged.</p>
			{/each}
		</Card.Content>
	</Card.Root>
</div>
