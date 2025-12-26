<script lang="ts">
	import * as Table from '$lib/components/ui/table';
	import IssueRow from './IssueRow.svelte';
	import Icon from '@iconify/svelte';
	import type { Issue, IssueSort } from '$lib/types/beads';

	interface Props {
		issues: Issue[];
		sort: IssueSort;
		loading?: boolean;
		onSort: (field: IssueSort['field']) => void;
		onIssueClick?: (issue: Issue) => void;
	}

	let { issues, sort, loading = false, onSort, onIssueClick }: Props = $props();

	type SortableColumn = {
		key: IssueSort['field'] | 'id' | 'type';
		label: string;
		sortable: boolean;
		sortKey?: IssueSort['field'];
	};

	const columns: SortableColumn[] = [
		{ key: 'id', label: 'ID', sortable: false },
		{ key: 'title', label: 'Title', sortable: true, sortKey: 'title' },
		{ key: 'type', label: 'Type', sortable: false },
		{ key: 'status', label: 'Status', sortable: true, sortKey: 'status' },
		{ key: 'priority', label: 'Priority', sortable: true, sortKey: 'priority' },
		{ key: 'created', label: 'Created', sortable: true, sortKey: 'created' }
	];

	function getSortIcon(column: SortableColumn): string {
		if (!column.sortable || !column.sortKey) return '';
		if (sort.field !== column.sortKey) return 'mdi:unfold-more-horizontal';
		return sort.direction === 'asc' ? 'mdi:arrow-up' : 'mdi:arrow-down';
	}

	function handleHeaderClick(column: SortableColumn) {
		if (column.sortable && column.sortKey) {
			onSort(column.sortKey);
		}
	}

	function handleHeaderKeydown(event: KeyboardEvent, column: SortableColumn) {
		if ((event.key === 'Enter' || event.key === ' ') && column.sortable) {
			event.preventDefault();
			handleHeaderClick(column);
		}
	}
</script>

<div class="rounded-md border">
	<Table.Root>
		<Table.Header>
			<Table.Row>
				{#each columns as column (column.key)}
					<Table.Head
						class={column.sortable
							? 'hover:bg-muted/50 cursor-pointer select-none transition-colors'
							: ''}
						onclick={() => handleHeaderClick(column)}
						onkeydown={(e) => handleHeaderKeydown(e, column)}
						tabindex={column.sortable ? 0 : undefined}
						role={column.sortable ? 'button' : undefined}
						aria-sort={column.sortable && column.sortKey === sort.field
							? sort.direction === 'asc'
								? 'ascending'
								: 'descending'
							: undefined}
					>
						<div class="flex items-center gap-1">
							<span>{column.label}</span>
							{#if column.sortable}
								<Icon
									icon={getSortIcon(column)}
									class="text-muted-foreground h-4 w-4 {sort.field === column.sortKey
										? 'text-foreground'
										: ''}"
								/>
							{/if}
						</div>
					</Table.Head>
				{/each}
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#if loading}
				<Table.Row>
					<Table.Cell colspan={columns.length} class="h-32 text-center">
						<div class="flex items-center justify-center gap-2">
							<Icon icon="mdi:loading" class="h-5 w-5 animate-spin" />
							<span class="text-muted-foreground">Loading issues...</span>
						</div>
					</Table.Cell>
				</Table.Row>
			{:else if issues.length === 0}
				<Table.Row>
					<Table.Cell colspan={columns.length} class="h-32 text-center">
						<div class="flex flex-col items-center justify-center gap-2">
							<Icon icon="mdi:folder-open-outline" class="text-muted-foreground h-10 w-10" />
							<span class="text-muted-foreground">No issues found</span>
						</div>
					</Table.Cell>
				</Table.Row>
			{:else}
				{#each issues as issue (issue.id)}
					<IssueRow {issue} onclick={onIssueClick} />
				{/each}
			{/if}
		</Table.Body>
	</Table.Root>
</div>
