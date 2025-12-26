<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import Icon from '@iconify/svelte';
	import type { IssueStatus, IssueType, Priority } from '$lib/types/beads';

	interface Props {
		search: string;
		statusFilter: IssueStatus[];
		typeFilter: IssueType[];
		priorityFilter: Priority[];
		onSearchChange: (search: string) => void;
		onStatusChange: (statuses: IssueStatus[]) => void;
		onTypeChange: (types: IssueType[]) => void;
		onPriorityChange: (priorities: Priority[]) => void;
		onClearFilters: () => void;
		hasFilters: boolean;
	}

	let {
		search,
		statusFilter,
		typeFilter,
		priorityFilter,
		onSearchChange,
		onStatusChange,
		onTypeChange,
		onPriorityChange,
		onClearFilters,
		hasFilters
	}: Props = $props();

	const statusOptions: { value: IssueStatus; label: string }[] = [
		{ value: 'open', label: 'Open' },
		{ value: 'in_progress', label: 'In Progress' },
		{ value: 'closed', label: 'Closed' }
	];

	const typeOptions: { value: IssueType; label: string; icon: string }[] = [
		{ value: 'bug', label: 'Bug', icon: 'mdi:bug' },
		{ value: 'feature', label: 'Feature', icon: 'mdi:star-four-points' },
		{ value: 'task', label: 'Task', icon: 'mdi:checkbox-marked' },
		{ value: 'epic', label: 'Epic', icon: 'mdi:flag' },
		{ value: 'chore', label: 'Chore', icon: 'mdi:broom' }
	];

	const priorityOptions: { value: Priority; label: string }[] = [
		{ value: 0, label: 'P0 - Critical' },
		{ value: 1, label: 'P1 - High' },
		{ value: 2, label: 'P2 - Medium' },
		{ value: 3, label: 'P3 - Low' },
		{ value: 4, label: 'P4 - Minimal' }
	];

	function toggleStatus(status: IssueStatus) {
		const newStatuses = statusFilter.includes(status)
			? statusFilter.filter((s) => s !== status)
			: [...statusFilter, status];
		onStatusChange(newStatuses);
	}

	function toggleType(type: IssueType) {
		const newTypes = typeFilter.includes(type)
			? typeFilter.filter((t) => t !== type)
			: [...typeFilter, type];
		onTypeChange(newTypes);
	}

	function togglePriority(priority: Priority) {
		const newPriorities = priorityFilter.includes(priority)
			? priorityFilter.filter((p) => p !== priority)
			: [...priorityFilter, priority];
		onPriorityChange(newPriorities);
	}

	let searchInput = $state(search);
	let debounceTimer: ReturnType<typeof setTimeout>;

	function handleSearchInput(event: Event) {
		const value = (event.target as HTMLInputElement).value;
		searchInput = value;
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			onSearchChange(value);
		}, 300);
	}

	$effect(() => {
		searchInput = search;
	});
</script>

<div class="flex flex-wrap items-center gap-3">
	<!-- Search Input -->
	<div class="relative min-w-[200px] flex-1 md:max-w-xs">
		<Icon icon="mdi:magnify" class="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
		<Input
			type="search"
			placeholder="Search issues..."
			value={searchInput}
			oninput={handleSearchInput}
			class="pl-9"
		/>
	</div>

	<!-- Status Filter -->
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			<Button variant="outline" size="sm" class="gap-2">
				<Icon icon="mdi:circle-outline" class="h-4 w-4" />
				Status
				{#if statusFilter.length > 0}
					<span class="bg-primary text-primary-foreground ml-1 rounded-full px-1.5 text-xs">
						{statusFilter.length}
					</span>
				{/if}
				<Icon icon="mdi:chevron-down" class="h-4 w-4" />
			</Button>
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="start" class="w-48">
			{#each statusOptions as option (option.value)}
				<DropdownMenu.CheckboxItem
					checked={statusFilter.includes(option.value)}
					onCheckedChange={() => toggleStatus(option.value)}
				>
					{option.label}
				</DropdownMenu.CheckboxItem>
			{/each}
		</DropdownMenu.Content>
	</DropdownMenu.Root>

	<!-- Type Filter -->
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			<Button variant="outline" size="sm" class="gap-2">
				<Icon icon="mdi:shape-outline" class="h-4 w-4" />
				Type
				{#if typeFilter.length > 0}
					<span class="bg-primary text-primary-foreground ml-1 rounded-full px-1.5 text-xs">
						{typeFilter.length}
					</span>
				{/if}
				<Icon icon="mdi:chevron-down" class="h-4 w-4" />
			</Button>
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="start" class="w-48">
			{#each typeOptions as option (option.value)}
				<DropdownMenu.CheckboxItem
					checked={typeFilter.includes(option.value)}
					onCheckedChange={() => toggleType(option.value)}
				>
					<Icon icon={option.icon} class="mr-2 h-4 w-4" />
					{option.label}
				</DropdownMenu.CheckboxItem>
			{/each}
		</DropdownMenu.Content>
	</DropdownMenu.Root>

	<!-- Priority Filter -->
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			<Button variant="outline" size="sm" class="gap-2">
				<Icon icon="mdi:flag-outline" class="h-4 w-4" />
				Priority
				{#if priorityFilter.length > 0}
					<span class="bg-primary text-primary-foreground ml-1 rounded-full px-1.5 text-xs">
						{priorityFilter.length}
					</span>
				{/if}
				<Icon icon="mdi:chevron-down" class="h-4 w-4" />
			</Button>
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="start" class="w-48">
			{#each priorityOptions as option (option.value)}
				<DropdownMenu.CheckboxItem
					checked={priorityFilter.includes(option.value)}
					onCheckedChange={() => togglePriority(option.value)}
				>
					{option.label}
				</DropdownMenu.CheckboxItem>
			{/each}
		</DropdownMenu.Content>
	</DropdownMenu.Root>

	<!-- Clear Filters -->
	{#if hasFilters}
		<Button variant="ghost" size="sm" onclick={onClearFilters} class="gap-2">
			<Icon icon="mdi:close" class="h-4 w-4" />
			Clear filters
		</Button>
	{/if}
</div>
