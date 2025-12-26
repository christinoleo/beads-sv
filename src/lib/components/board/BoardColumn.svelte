<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import BoardCard from './BoardCard.svelte';
	import type { Issue } from '$lib/types/beads';
	import type { Snippet } from 'svelte';

	type ColumnType = 'blocked' | 'ready' | 'in-progress' | 'closed';

	interface Props {
		title: string;
		type: ColumnType;
		issues: Issue[];
		onIssueClick?: (issue: Issue) => void;
		emptySlot?: Snippet;
	}

	let { title, type, issues, onIssueClick, emptySlot }: Props = $props();

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
</script>

<div class="flex h-full min-h-0 flex-col rounded-lg border bg-muted/30">
	<!-- Column Header -->
	<div
		class="sticky top-0 z-10 flex items-center justify-between border-b-2 p-3 {headerBorderColors[
			type
		]}"
	>
		<div class="flex items-center gap-2">
			<h3 class="font-semibold">{title}</h3>
			<Badge variant="secondary" class="{columnColors[type]} text-xs">
				{issues.length}
			</Badge>
		</div>
	</div>

	<!-- Scrollable Cards Container -->
	<div class="flex-1 space-y-2 overflow-y-auto p-2">
		{#if issues.length === 0}
			{#if emptySlot}
				{@render emptySlot()}
			{:else}
				<div class="flex h-24 items-center justify-center text-sm text-muted-foreground">
					No issues
				</div>
			{/if}
		{:else}
			{#each issues as issue (issue.id)}
				<BoardCard {issue} onClick={onIssueClick} />
			{/each}
		{/if}
	</div>

	<!-- Drop Zone Indicator (for future drag-and-drop) -->
	<div class="border-dashed border-transparent p-2 transition-colors" data-drop-zone={type}>
		<!-- Visual indicator when dragging -->
	</div>
</div>
