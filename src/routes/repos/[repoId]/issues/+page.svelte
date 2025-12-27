<script lang="ts">
	import Icon from '@iconify/svelte';
	import IssueGroup from '$lib/components/issues/IssueGroup.svelte';
	import IssueFilters from '$lib/components/issues/IssueFilters.svelte';
	import IssueSheet from '$lib/components/issues/IssueSheet.svelte';
	import IssueForm from '$lib/components/issues/IssueForm.svelte';
	import { Button } from '$lib/components/ui/button';
	import { issuesState } from '$lib/state/issues.svelte';
	import { groupIssuesByEpic, getEpics } from '$lib/utils/group-by-epic';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import type { Issue, IssueSort } from '$lib/types/beads';

	let { data }: { data: PageData } = $props();

	// Sheet and Form state
	let selectedIssue = $state<Issue | null>(null);
	let sheetOpen = $state(false);
	let formOpen = $state(false);
	let editingIssue = $state<Issue | null>(null);

	// Watch for ?new=true URL param to open the form
	$effect(() => {
		if ($page.url.searchParams.get('new') === 'true') {
			editingIssue = null;
			formOpen = true;
			// Clear the param from URL
			goto($page.url.pathname, { replaceState: true });
		}
	});

	// Initialize state with server data
	$effect(() => {
		issuesState.initialize(data.issues, data.repoId);
	});

	// Group issues by epic
	const epicGroups = $derived.by(() => {
		const epics = getEpics(issuesState.issues);
		return groupIssuesByEpic(issuesState.issues, epics);
	});

	// Refetch when filters/sort change
	$effect(() => {
		// Only refetch if we have a repoId and the query params have changed
		const params = issuesState.queryParams;
		if (issuesState.currentRepoId && params) {
			// Use a small delay to debounce rapid changes
			const timeoutId = setTimeout(() => {
				issuesState.fetchIssues(issuesState.currentRepoId!);
			}, 50);
			return () => clearTimeout(timeoutId);
		}
	});

	function handleSort(field: IssueSort['field']) {
		issuesState.setSort(field);
	}

	function handleIssueClick(issue: Issue) {
		selectedIssue = issue;
		sheetOpen = true;
	}

	function handleSheetOpenChange(open: boolean) {
		sheetOpen = open;
		if (!open) {
			selectedIssue = null;
		}
	}

	function handleIssueUpdate(updatedIssue: Issue) {
		// Update the selected issue with new data
		selectedIssue = updatedIssue;
		// Refresh the issues list
		issuesState.refresh();
	}

	function handleNewIssue() {
		editingIssue = null;
		formOpen = true;
	}

	function handleFormOpenChange(open: boolean) {
		formOpen = open;
		if (!open) {
			editingIssue = null;
		}
	}

	function handleFormSuccess(issue: Issue) {
		// Refresh the issues list
		issuesState.refresh();
		// If we were editing the currently selected issue, update it
		if (selectedIssue && selectedIssue.id === issue.id) {
			selectedIssue = issue;
		}
	}

	function handleIssueNavigate(issueId: string) {
		// Find the issue in our list and open it
		const targetIssue = issuesState.issues.find((i) => i.id === issueId);
		if (targetIssue) {
			selectedIssue = targetIssue;
			sheetOpen = true;
		}
	}
</script>

<svelte:head>
	<title>Issues | {data.repo.name}</title>
</svelte:head>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-2xl font-bold tracking-tight">Issues</h2>
			<p class="text-muted-foreground">
				{#if issuesState.hasFilters}
					Showing {issuesState.filteredCount} of {issuesState.total} issues
				{:else}
					{issuesState.total} issues
				{/if}
			</p>
		</div>
		<Button onclick={handleNewIssue}>
			<Icon icon="mdi:plus" class="mr-2 h-4 w-4" />
			New Issue
		</Button>
	</div>

	<!-- Filters -->
	<IssueFilters
		search={issuesState.filter.search || ''}
		statusFilter={issuesState.filter.status || []}
		typeFilter={issuesState.filter.type || []}
		priorityFilter={issuesState.filter.priority || []}
		onSearchChange={issuesState.setSearch}
		onStatusChange={issuesState.setStatusFilter}
		onTypeChange={issuesState.setTypeFilter}
		onPriorityChange={issuesState.setPriorityFilter}
		onClearFilters={issuesState.clearFilters}
		hasFilters={issuesState.hasFilters}
	/>

	<!-- Error State -->
	{#if issuesState.error}
		<div class="rounded-md border border-destructive/20 bg-destructive/10 p-4 text-destructive">
			<p class="font-medium">Error loading issues</p>
			<p class="text-sm">{issuesState.error}</p>
		</div>
	{/if}

	<!-- Loading State -->
	{#if issuesState.loading}
		<div class="flex h-64 items-center justify-center rounded-lg border border-dashed">
			<div class="flex items-center gap-2">
				<Icon icon="mdi:loading" class="h-5 w-5 animate-spin" />
				<span class="text-muted-foreground">Loading issues...</span>
			</div>
		</div>
	{:else if epicGroups.length === 0}
		<div class="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed">
			<Icon icon="mdi:folder-open-outline" class="mb-2 h-10 w-10 text-muted-foreground" />
			<p class="text-muted-foreground">No issues found</p>
		</div>
	{:else}
		<!-- Issue Groups -->
		<div class="space-y-4">
			{#each epicGroups as group (group.epic?.id ?? 'no-epic')}
				<IssueGroup
					{group}
					sort={issuesState.sort}
					onSort={handleSort}
					onIssueClick={handleIssueClick}
				/>
			{/each}
		</div>
	{/if}

	<!-- Pagination Info -->
	{#if issuesState.total > 0}
		<div class="flex items-center justify-between text-sm text-muted-foreground">
			<span>
				Page {issuesState.page} of {Math.ceil(issuesState.total / issuesState.pageSize)}
			</span>
			{#if issuesState.hasMore}
				<span>More issues available</span>
			{/if}
		</div>
	{/if}
</div>

<!-- Issue Detail Sheet -->
<IssueSheet
	issue={selectedIssue}
	bind:open={sheetOpen}
	repoId={data.repoId}
	onOpenChange={handleSheetOpenChange}
	onIssueUpdate={handleIssueUpdate}
	onIssueNavigate={handleIssueNavigate}
/>

<!-- Issue Create/Edit Form -->
<IssueForm
	issue={editingIssue}
	bind:open={formOpen}
	repoId={data.repoId}
	allIssues={issuesState.issues}
	onOpenChange={handleFormOpenChange}
	onSuccess={handleFormSuccess}
/>
