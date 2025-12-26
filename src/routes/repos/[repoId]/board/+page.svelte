<script lang="ts">
	import BoardSwimlane from '$lib/components/board/BoardSwimlane.svelte';
	import IssueSheet from '$lib/components/issues/IssueSheet.svelte';
	import { invalidate } from '$app/navigation';
	import type { PageData } from './$types';
	import type { Issue } from '$lib/types/beads';

	let { data }: { data: PageData } = $props();

	// Sheet state
	let selectedIssue = $state<Issue | null>(null);
	let sheetOpen = $state(false);

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
		selectedIssue = updatedIssue;
		// Refresh the board data
		invalidate('app:issues');
	}
</script>

<svelte:head>
	<title>Board | {data.repo.name}</title>
</svelte:head>

<div class="flex h-full flex-col">
	<!-- Page Header -->
	<div class="mb-6">
		<h2 class="text-2xl font-bold tracking-tight">Board</h2>
		<p class="text-muted-foreground">
			{data.issues.total} issues across {data.swimlanes.length}
			{data.swimlanes.length === 1 ? 'group' : 'groups'}
		</p>
	</div>

	<!-- Swimlane Board -->
	<div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
		{#if data.swimlanes.length === 0}
			<div class="flex h-64 items-center justify-center rounded-lg border border-dashed">
				<p class="text-muted-foreground">No issues found</p>
			</div>
		{:else}
			{#each data.swimlanes as swimlane (swimlane.epic?.id ?? 'no-epic')}
				<BoardSwimlane {swimlane} onIssueClick={handleIssueClick} />
			{/each}
		{/if}
	</div>
</div>

<!-- Issue Detail Sheet -->
<IssueSheet
	issue={selectedIssue}
	bind:open={sheetOpen}
	repoId={data.repoId}
	onOpenChange={handleSheetOpenChange}
	onIssueUpdate={handleIssueUpdate}
/>
