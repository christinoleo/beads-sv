<script lang="ts">
	import Icon from '@iconify/svelte';
	import OverallStatsCard from '$lib/components/epics/OverallStatsCard.svelte';
	import EpicSummaryCard from '$lib/components/epics/EpicSummaryCard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Filter epic groups to only show groups with epics (exclude "No Epic" group)
	const epicsWithStats = $derived(data.epicGroups.filter((g) => g.epic !== null));

	// Sort epics by priority (lower = higher priority)
	const sortedEpics = $derived(
		[...epicsWithStats].sort((a, b) => (a.epic?.priority ?? 2) - (b.epic?.priority ?? 2))
	);

	// Separate active and completed epics
	const activeEpics = $derived(sortedEpics.filter((g) => g.epic?.status !== 'closed'));

	const completedEpics = $derived(sortedEpics.filter((g) => g.epic?.status === 'closed'));
</script>

<svelte:head>
	<title>Dashboard | {data.repo.name}</title>
</svelte:head>

<div class="space-y-6">
	<!-- Page Header -->
	<div>
		<h2 class="text-2xl font-bold tracking-tight">Dashboard</h2>
		<p class="text-muted-foreground">Project overview and epic progress</p>
	</div>

	<!-- Main Dashboard Grid -->
	<div class="grid gap-6 lg:grid-cols-3">
		<!-- Left: Overall Stats Card -->
		<div class="lg:col-span-1">
			<OverallStatsCard stats={data.overallStats} />
		</div>

		<!-- Right: Epic Cards Grid -->
		<div class="space-y-6 lg:col-span-2">
			<!-- Active Epics -->
			{#if activeEpics.length > 0}
				<div class="space-y-3">
					<h3 class="text-sm font-medium tracking-wide text-muted-foreground uppercase">
						Active Epics ({activeEpics.length})
					</h3>
					<div class="grid gap-4 sm:grid-cols-2">
						{#each activeEpics as group (group.epic?.id)}
							{#if group.epic}
								<EpicSummaryCard epic={group.epic} stats={group.stats} repoId={data.repoId} />
							{/if}
						{/each}
					</div>
				</div>
			{/if}

			<!-- Completed Epics -->
			{#if completedEpics.length > 0}
				<div class="space-y-3">
					<h3 class="text-sm font-medium tracking-wide text-muted-foreground uppercase">
						Completed Epics ({completedEpics.length})
					</h3>
					<div class="grid gap-4 sm:grid-cols-2">
						{#each completedEpics as group (group.epic?.id)}
							{#if group.epic}
								<EpicSummaryCard epic={group.epic} stats={group.stats} repoId={data.repoId} />
							{/if}
						{/each}
					</div>
				</div>
			{/if}

			<!-- No Epics State -->
			{#if epicsWithStats.length === 0}
				<div
					class="flex flex-col items-center justify-center rounded-lg border border-dashed py-16"
				>
					<Icon icon="mdi:flag-outline" class="mb-4 h-12 w-12 text-muted-foreground" />
					<h3 class="text-lg font-medium">No epics yet</h3>
					<p class="mt-1 text-sm text-muted-foreground">
						Create an epic to group related issues together.
					</p>
				</div>
			{/if}
		</div>
	</div>
</div>
