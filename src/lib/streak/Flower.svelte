<script lang="ts">
	let { size = 64, dim = false }: { size?: number; dim?: boolean } = $props();
	const id = `fl-${Math.round(size)}-${dim ? 'd' : 'l'}`;
	const petals = [0, 60, 120, 180, 240, 300];
</script>

<svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="streak flower">
	<defs>
		<radialGradient id={`${id}-p`} cx="50%" cy="35%" r="70%">
			<stop offset="0" stop-color={dim ? '#9aa0a6' : '#ff9ecd'} />
			<stop offset="1" stop-color={dim ? '#6b7075' : '#ec4899'} />
		</radialGradient>
	</defs>
	<!-- leaves -->
	<path d="M50 70 C 36 78, 26 76, 22 66 C 34 62, 46 64, 50 72 Z" fill={dim ? '#5b6b53' : '#3aa75f'} />
	<path d="M50 70 C 64 78, 74 76, 78 66 C 66 62, 54 64, 50 72 Z" fill={dim ? '#516149' : '#2f9351'} />
	<rect x="48" y="44" width="4" height="30" rx="2" fill={dim ? '#5b6b53' : '#3aa75f'} />
	<!-- petals -->
	<g>
		{#each petals as deg}
			<ellipse cx="50" cy="22" rx="12" ry="20" transform={`rotate(${deg} 50 40)`} fill={`url(#${id}-p)`} />
		{/each}
	</g>
	<circle cx="50" cy="40" r="12" fill={dim ? '#8a8d91' : '#ffd24a'} />
	<circle cx="50" cy="40" r="6" fill={dim ? '#b7babd' : '#ffe9a8'} />
</svg>
