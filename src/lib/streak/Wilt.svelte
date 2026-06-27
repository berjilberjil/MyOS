<script lang="ts">
	let { size = 18 }: { size?: number } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="wilted flower">
	<path
		d="M48 88 C 46 62, 40 48, 58 36"
		stroke="#8a7256"
		stroke-width="6"
		fill="none"
		stroke-linecap="round"
	/>
	<g transform="translate(58 34)">
		<ellipse cx="0" cy="13" rx="7" ry="13" transform="rotate(-22 0 0)" fill="#b59a78" />
		<ellipse cx="0" cy="13" rx="7" ry="13" transform="rotate(12 0 0)" fill="#a98e6e" />
		<ellipse cx="0" cy="13" rx="7" ry="13" transform="rotate(44 0 0)" fill="#c4ab8a" />
		<circle cx="0" cy="2" r="6" fill="#7c6646" />
	</g>
</svg>
