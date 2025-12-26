<script lang="ts">
	import BoardColumn from '$lib/components/board/BoardColumn.svelte';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import type { Issue } from '$lib/types/beads';

	let { data }: { data: PageData } = $props();

	// Categorize issues into columns
	const blockedIssues = $derived(
		data.issues.items.filter(
			(issue) =>
				issue.status !== 'closed' &&
				issue.blockedBy.length > 0
		)
	);

	const readyIssues = $derived(
		data.issues.items.filter(
			(issue) =>
				issue.status === 'open' &&
				issue.blockedBy.length === 0
		)
	);

	const inProgressIssues = $derived(
		data.issues.items.filter((issue) => issue.status === 'in_progress')
	);

	const closedIssues = $derived(
		data.issues.items.filter((issue) => issue.status === 'closed')
	);

	function handleIssueClick(issue: Issue) {
		goto(`/repos/${data.repoId}/issues/${issue.id}`);
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
			{data.issues.total} issues across all columns
		</p>
	</div>

	<!-- Kanban Board -->
	<div class="grid min-h-0 flex-1 gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
		<!-- Blocked Column -->
		<BoardColumn
			title="Blocked"
			type="blocked"
			issues={blockedIssues}
			onIssueClick={handleIssueClick}
		/>

		<!-- Ready Column -->
		<BoardColumn
			title="Ready"
			type="ready"
			issues={readyIssues}
			onIssueClick={handleIssueClick}
		/>

		<!-- In Progress Column -->
		<BoardColumn
			title="In Progress"
			type="in-progress"
			issues={inProgressIssues}
			onIssueClick={handleIssueClick}
		/>

		<!-- Closed Column -->
		<BoardColumn
			title="Closed"
			type="closed"
			issues={closedIssues}
			onIssueClick={handleIssueClick}
		/>
	</div>
</div>
