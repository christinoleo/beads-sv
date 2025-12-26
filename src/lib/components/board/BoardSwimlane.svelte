<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import BoardCard from './BoardCard.svelte';
	import BoardSwimlaneHeader from './BoardSwimlaneHeader.svelte';
	import type { Issue } from '$lib/types/beads';
	import type { SwimlaneData } from '$lib/types/epic-stats';

	type ColumnType = 'blocked' | 'ready' | 'in-progress' | 'closed';

	interface Props {
		swimlane: SwimlaneData;
		onIssueClick?: (issue: Issue) => void;
	}

	let { swimlane, onIssueClick }: Props = $props();

	let isCollapsed = $state(false);

	const columnColors: Record<ColumnType, string> = {
		blocked: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
		ready: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
		'in-progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
		closed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
	};

	const headerBorderColors: Record<ColumnType, string> = {
		blocked: 'border-red-300 dark:border-red-700',
		ready: 'border-blue-300 dark:border-blue-700',
		'in-progress': 'border-yellow-300 dark:border-yellow-700',
		closed: 'border-green-300 dark:border-green-700'
	};

	const columns: { key: keyof typeof swimlane.columns; title: string; type: ColumnType }[] = [
		{ key: 'blocked', title: 'Blocked', type: 'blocked' },
		{ key: 'ready', title: 'Ready', type: 'ready' },
		{ key: 'inProgress', title: 'In Progress', type: 'in-progress' },
		{ key: 'closed', title: 'Closed', type: 'closed' }
	];

	function toggleCollapse() {
		isCollapsed = !isCollapsed;
	}
</script>

<div class="rounded-lg border bg-card">
	<!-- Swimlane Header -->
	<BoardSwimlaneHeader
		epic={swimlane.epic}
		stats={swimlane.stats}
		{isCollapsed}
		onToggle={toggleCollapse}
	/>

	<!-- Collapsible Column Content -->
	{#if !isCollapsed}
		<div class="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 lg:grid-cols-4">
			{#each columns as column (column.key)}
				{@const issues = swimlane.columns[column.key]}
				<div class="flex min-h-[120px] flex-col rounded-lg bg-muted/30">
					<!-- Column Header -->
					<div
						class="sticky top-0 z-10 flex items-center justify-between border-b-2 p-2 {headerBorderColors[
							column.type
						]}"
					>
						<div class="flex items-center gap-2">
							<h4 class="text-sm font-medium">{column.title}</h4>
							<Badge variant="secondary" class="{columnColors[column.type]} text-xs">
								{issues.length}
							</Badge>
						</div>
					</div>

					<!-- Cards -->
					<div class="flex-1 space-y-2 p-2">
						{#if issues.length === 0}
							<div class="flex h-16 items-center justify-center text-xs text-muted-foreground">
								No issues
							</div>
						{:else}
							{#each issues as issue (issue.id)}
								<BoardCard {issue} onClick={onIssueClick} />
							{/each}
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
