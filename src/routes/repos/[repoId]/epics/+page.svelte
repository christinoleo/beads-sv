<script lang="ts">
	import Icon from '@iconify/svelte';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import EpicCard from '$lib/components/epics/EpicCard.svelte';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import type { Issue } from '$lib/types/beads';

	let { data }: { data: PageData } = $props();

	type FilterOption = 'all' | 'active' | 'completed';
	type SortOption = 'priority' | 'progress' | 'name';

	let filterOption = $state<FilterOption>('all');
	let sortOption = $state<SortOption>('priority');

	const filteredEpics = $derived.by(() => {
		let result = [...data.epics];

		// Apply filter
		switch (filterOption) {
			case 'active':
				// Has open or in-progress children
				result = result.filter((e) => e.stats.open > 0 || e.stats.inProgress > 0);
				break;
			case 'completed':
				// All children are closed (and has children)
				result = result.filter((e) => e.stats.total > 0 && e.stats.closed === e.stats.total);
				break;
			// 'all' - no filtering needed
		}

		// Apply sort
		switch (sortOption) {
			case 'priority':
				result.sort((a, b) => a.epic.priority - b.epic.priority);
				break;
			case 'progress':
				result.sort((a, b) => b.stats.progressPercent - a.stats.progressPercent);
				break;
			case 'name':
				result.sort((a, b) => a.epic.title.localeCompare(b.epic.title));
				break;
		}

		return result;
	});

	const filterLabels: Record<FilterOption, string> = {
		all: 'All Epics',
		active: 'Active',
		completed: 'Completed'
	};

	const sortLabels: Record<SortOption, string> = {
		priority: 'Priority',
		progress: 'Progress',
		name: 'Name'
	};

	function handleEpicClick(epic: Issue) {
		goto(`/repos/${data.repoId}/issues/${epic.id}`);
	}

	function handleChildClick(child: Issue) {
		goto(`/repos/${data.repoId}/issues/${child.id}`);
	}

	function setFilter(option: FilterOption) {
		filterOption = option;
	}

	function setSort(option: SortOption) {
		sortOption = option;
	}
</script>

<svelte:head>
	<title>Epics | {data.repo.name}</title>
</svelte:head>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-2xl font-bold tracking-tight">Epics</h2>
			<p class="text-muted-foreground">
				{filteredEpics.length} of {data.epics.length} epics
			</p>
		</div>
	</div>

	<!-- Filters and Sort Controls -->
	<div class="flex flex-wrap items-center gap-4">
		<!-- Filter Dropdown -->
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Button variant="outline" size="sm" class="gap-2" {...props}>
						<Icon icon="mdi:filter-outline" class="h-4 w-4" />
						{filterLabels[filterOption]}
						<Icon icon="mdi:chevron-down" class="h-4 w-4" />
					</Button>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="start">
				<DropdownMenu.RadioGroup value={filterOption}>
					<DropdownMenu.RadioItem value="all" onclick={() => setFilter('all')}>
						All Epics
					</DropdownMenu.RadioItem>
					<DropdownMenu.RadioItem value="active" onclick={() => setFilter('active')}>
						Active (has open children)
					</DropdownMenu.RadioItem>
					<DropdownMenu.RadioItem value="completed" onclick={() => setFilter('completed')}>
						Completed (all children closed)
					</DropdownMenu.RadioItem>
				</DropdownMenu.RadioGroup>
			</DropdownMenu.Content>
		</DropdownMenu.Root>

		<!-- Sort Dropdown -->
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Button variant="outline" size="sm" class="gap-2" {...props}>
						<Icon icon="mdi:sort" class="h-4 w-4" />
						Sort: {sortLabels[sortOption]}
						<Icon icon="mdi:chevron-down" class="h-4 w-4" />
					</Button>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="start">
				<DropdownMenu.RadioGroup value={sortOption}>
					<DropdownMenu.RadioItem value="priority" onclick={() => setSort('priority')}>
						Priority
					</DropdownMenu.RadioItem>
					<DropdownMenu.RadioItem value="progress" onclick={() => setSort('progress')}>
						Progress %
					</DropdownMenu.RadioItem>
					<DropdownMenu.RadioItem value="name" onclick={() => setSort('name')}>
						Name
					</DropdownMenu.RadioItem>
				</DropdownMenu.RadioGroup>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>

	<!-- Epics Grid -->
	{#if filteredEpics.length > 0}
		<div class="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
			{#each filteredEpics as epicData (epicData.epic.id)}
				<EpicCard
					epic={epicData.epic}
					children={epicData.children}
					onEpicClick={handleEpicClick}
					onChildClick={handleChildClick}
				/>
			{/each}
		</div>
	{:else if data.epics.length === 0}
		<!-- No epics at all -->
		<div class="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
			<Icon icon="mdi:flag-outline" class="text-muted-foreground mb-4 h-12 w-12" />
			<h3 class="text-lg font-medium">No epics yet</h3>
			<p class="text-muted-foreground mt-1 text-sm">
				Create an epic to group related issues together.
			</p>
		</div>
	{:else}
		<!-- No epics matching filter -->
		<div class="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
			<Icon icon="mdi:filter-off-outline" class="text-muted-foreground mb-4 h-12 w-12" />
			<h3 class="text-lg font-medium">No matching epics</h3>
			<p class="text-muted-foreground mt-1 text-sm">
				Try adjusting your filter to see more epics.
			</p>
			<Button variant="outline" size="sm" class="mt-4" onclick={() => setFilter('all')}>
				Show all epics
			</Button>
		</div>
	{/if}
</div>
