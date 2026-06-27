<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { cn } from '$lib/utils';
	import { todayIso } from '$lib/finance/dates';
	import { recentFitness, addFitness, totalDuration, recentHealth, upsertHealth } from '$lib/health/logs';
	import { kmToM, mToKm, kgToG, gToKg, hoursToMin, minToHours } from '$lib/health/units';
	import { MOODS } from '$lib/journal/types';
	import { toast } from 'svelte-sonner';

	const qc = useQueryClient();
	const fitness = createQuery(() => ({ queryKey: ['fitness'], queryFn: () => recentFitness() }));
	const health = createQuery(() => ({ queryKey: ['health'], queryFn: () => recentHealth() }));

	// Health log
	let hDate = $state(todayIso());
	let weight = $state('');
	let sleep = $state('');
	let water = $state('');
	let mood = $state<string | null>(null);
	const saveHealth = createMutation(() => ({
		mutationFn: () =>
			upsertHealth(hDate, {
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
			toast.success('Day logged');
		}
	}));

	// Workout log
	let fDate = $state(todayIso());
	let activity = $state('');
	let duration = $state('');
	let distance = $state('');
	let calories = $state('');
	const addWorkout = createMutation(() => ({
		mutationFn: () =>
			addFitness({
				logged_on: fDate,
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
			toast.success('Workout logged');
		}
	}));

	const weekMin = $derived(totalDuration(fitness.data ?? [], todayIso(), 7));
	const latestWeight = $derived((health.data ?? []).find((l) => l.weight_g != null));
</script>

<div class="kn-stagger flex flex-col gap-4">
	<div class="grid gap-3 sm:grid-cols-2">
		<Card.Root>
			<Card.Header>
				<Card.Description>This week</Card.Description>
				<Card.Title class="text-2xl">{weekMin} min active</Card.Title>
			</Card.Header>
		</Card.Root>
		<Card.Root>
			<Card.Header>
				<Card.Description>Latest weight{latestWeight ? ` (${latestWeight.logged_on})` : ''}</Card.Description>
				<Card.Title class="text-2xl">
					{latestWeight?.weight_g != null ? `${gToKg(latestWeight.weight_g)} kg` : '—'}
				</Card.Title>
			</Card.Header>
		</Card.Root>
	</div>

	<Card.Root>
		<Card.Header><Card.Title>Log day</Card.Title></Card.Header>
		<Card.Content class="flex flex-wrap items-end gap-2">
			<Input type="date" bind:value={hDate} class="w-40" />
			<Input type="number" step="0.1" placeholder="Weight kg" bind:value={weight} class="w-28" />
			<Input type="number" step="0.1" placeholder="Sleep hrs" bind:value={sleep} class="w-28" />
			<Input type="number" placeholder="Water ml" bind:value={water} class="w-28" />
			<div class="flex gap-1">
				{#each MOODS as mo}
					<button class={cn('rounded-full border px-3 py-1 text-xs capitalize', mood === mo ? 'bg-secondary' : 'border-border')} onclick={() => (mood = mood === mo ? null : mo)}>{mo}</button>
				{/each}
			</div>
			<Button disabled={saveHealth.isPending} onclick={() => saveHealth.mutate()}>Save</Button>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header><Card.Title>Log workout</Card.Title></Card.Header>
		<Card.Content class="flex flex-wrap items-end gap-2">
			<Input type="date" bind:value={fDate} class="w-40" />
			<Input placeholder="Activity (e.g. Run)" bind:value={activity} class="w-40" />
			<Input type="number" placeholder="Minutes" bind:value={duration} class="w-28" />
			<Input type="number" step="0.1" placeholder="Distance km" bind:value={distance} class="w-28" />
			<Input type="number" placeholder="Calories" bind:value={calories} class="w-28" />
			<Button disabled={!activity || addWorkout.isPending} onclick={() => addWorkout.mutate()}>Add</Button>
		</Card.Content>
	</Card.Root>

	<div class="grid gap-3 lg:grid-cols-2">
		<Card.Root>
			<Card.Header><Card.Title class="text-base">Recent workouts</Card.Title></Card.Header>
			<Card.Content class="divide-y divide-border">
				{#each fitness.data ?? [] as l (l.id)}
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

		<Card.Root>
			<Card.Header><Card.Title class="text-base">Recent days</Card.Title></Card.Header>
			<Card.Content class="divide-y divide-border">
				{#each health.data ?? [] as l (l.id)}
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
</div>
