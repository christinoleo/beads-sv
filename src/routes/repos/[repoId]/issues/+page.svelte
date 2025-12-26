<script lang="ts">
	import Icon from '@iconify/svelte';
	import IssueTable from '$lib/components/issues/IssueTable.svelte';
	import IssueFilters from '$lib/components/issues/IssueFilters.svelte';
	import IssueSheet from '$lib/components/issues/IssueSheet.svelte';
	import IssueForm from '$lib/components/issues/IssueForm.svelte';
	import { Button } from '$lib/components/ui/button';
	import { issuesState } from '$lib/state/issues.svelte';
	import type { PageData } from './$types';
	import type { Issue, IssueSort } from '$lib/types/beads';

	let { data }: { data: PageData } = $props();

	// Sheet and Form state
	let selectedIssue = $state<Issue | null>(null);
	let sheetOpen = $state(false);
	let formOpen = $state(false);
	let editingIssue = $state<Issue | null>(null);

	// Initialize state with server data
	$effect(() => {
		issuesState.initialize(data.issues, data.repoId);
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

	function handleEditFromSheet(issue: Issue) {
		// Close sheet and open form for editing
		sheetOpen = false;
		editingIssue = issue;
		formOpen = true;
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
			<Icon icon="mdi:plus" class="h-4 w-4 mr-2" />
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
		<div class="bg-destructive/10 text-destructive rounded-md border border-destructive/20 p-4">
			<p class="font-medium">Error loading issues</p>
			<p class="text-sm">{issuesState.error}</p>
		</div>
	{/if}

	<!-- Issues Table -->
	<IssueTable
		issues={issuesState.issues}
		sort={issuesState.sort}
		loading={issuesState.loading}
		onSort={handleSort}
		onIssueClick={handleIssueClick}
	/>

	<!-- Pagination Info -->
	{#if issuesState.total > 0}
		<div class="text-muted-foreground flex items-center justify-between text-sm">
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
	onEdit={handleEditFromSheet}
/>

<!-- Issue Create/Edit Form -->
<IssueForm
	issue={editingIssue}
	bind:open={formOpen}
	repoId={data.repoId}
	onOpenChange={handleFormOpenChange}
	onSuccess={handleFormSuccess}
/>
