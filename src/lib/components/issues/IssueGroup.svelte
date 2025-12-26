<script lang="ts">
	import * as Collapsible from '$lib/components/ui/collapsible';
	import IssueGroupHeader from './IssueGroupHeader.svelte';
	import IssueTable from './IssueTable.svelte';
	import type { Issue, IssueSort } from '$lib/types/beads';
	import type { EpicGroup } from '$lib/types/epic-stats';

	interface Props {
		group: EpicGroup;
		sort: IssueSort;
		onSort: (field: IssueSort['field']) => void;
		onIssueClick?: (issue: Issue) => void;
	}

	let { group, sort, onSort, onIssueClick }: Props = $props();

	let isOpen = $state(true);
</script>

<Collapsible.Root bind:open={isOpen} class="rounded-lg border">
	<Collapsible.Trigger class="w-full cursor-pointer rounded-lg transition-colors hover:bg-muted/50">
		<IssueGroupHeader epic={group.epic} stats={group.stats} {isOpen} />
	</Collapsible.Trigger>
	<Collapsible.Content>
		<div class="px-2 pb-2">
			<IssueTable issues={group.issues} {sort} {onSort} {onIssueClick} />
		</div>
	</Collapsible.Content>
</Collapsible.Root>
