<script lang="ts">
	import AppTopBar from '$lib/components/layout/MobileTopBar.svelte';
	import BottomNav from '$lib/components/layout/MobileNav.svelte';
	import QuickAdd from '$lib/components/finance/QuickAdd.svelte';
	import { onMount } from 'svelte';
	import { useQueryClient } from '@tanstack/svelte-query';
	import { initFinanceSync } from '$lib/finance/sync';
	import { notify, notifyEnabled } from '$lib/notify';
	import { loggedJournalDates } from '$lib/streak/data';
	import { localToday } from '$lib/streak/streak';

	let { children } = $props();

	const qc = useQueryClient();
	onMount(() => {
		const stop = initFinanceSync(() => qc.invalidateQueries({ queryKey: ['finance'] }));
		// Daily journal nudge, at most once per day.
		if (notifyEnabled()) {
			const today = localToday(new Date());
			if (localStorage.getItem('notify-last') !== today) {
				loggedJournalDates(today)
					.then((logged) => {
						if (!logged.has(today)) {
							setTimeout(() => {
								notify('MyOS', "Write today's journal to keep your streak alive 🔥");
								localStorage.setItem('notify-last', today);
							}, 4000);
						}
					})
					.catch(() => {});
			}
		}
		return stop;
	});
</script>

<div class="flex h-dvh flex-col">
	<AppTopBar />
	<div
		class="kn-enter min-h-0 flex-1 overflow-auto p-4 pb-[calc(5.25rem+env(safe-area-inset-bottom))] md:px-6 md:pb-6"
		style="scrollbar-gutter: stable;"
	>
		<div class="mx-auto w-full max-w-[1500px]">
			{@render children()}
		</div>
	</div>
</div>

<BottomNav />
<QuickAdd />
