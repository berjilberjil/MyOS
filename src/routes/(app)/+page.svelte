<script lang="ts">
	import * as Card from '$lib/components/ui/card';
</script>

<div class="kn-stagger flex flex-col gap-4">
	<h1 class="text-xl font-semibold tracking-tight">Dashboard</h1>
	<Card.Root>
		<Card.Header>
			<Card.Title>Welcome to MyOS</Card.Title>
			<Card.Description>Your private life operating system.</Card.Description>
		</Card.Header>
		<Card.Content>
			<p class="text-sm text-muted-foreground">
				Foundation shell is live. Finance, journal, health, goals, and the mindmap dashboard
				plug in from here.
			</p>
		</Card.Content>
	</Card.Root>
</div>
