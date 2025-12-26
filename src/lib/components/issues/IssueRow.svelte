<script lang="ts">
	import * as Table from '$lib/components/ui/table';
	import StatusBadge from '$lib/components/shared/StatusBadge.svelte';
	import PriorityBadge from '$lib/components/shared/PriorityBadge.svelte';
	import TypeIcon from '$lib/components/shared/TypeIcon.svelte';
	import type { Issue, Priority } from '$lib/types/beads';

	interface Props {
		issue: Issue;
		onclick?: (issue: Issue) => void;
	}

	let { issue, onclick }: Props = $props();

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function formatPriority(priority: Priority): `P${Priority}` {
		return `P${priority}` as `P${Priority}`;
	}

	function handleClick() {
		if (onclick) {
			onclick(issue);
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleClick();
		}
	}
</script>

<Table.Row
	class="cursor-pointer transition-colors hover:bg-muted/50"
	onclick={handleClick}
	onkeydown={handleKeydown}
	tabindex={0}
	role="button"
>
	<!-- ID Column -->
	<Table.Cell class="font-mono text-sm">
		{issue.id}
	</Table.Cell>

	<!-- Title Column -->
	<Table.Cell class="max-w-md">
		<div class="flex items-center gap-2">
			<span class="truncate font-medium">{issue.title}</span>
			{#if issue.labels.length > 0}
				<div class="flex gap-1">
					{#each issue.labels.slice(0, 2) as label (label)}
						<span class="rounded-full bg-muted px-2 py-0.5 text-xs">{label}</span>
					{/each}
					{#if issue.labels.length > 2}
						<span class="text-xs text-muted-foreground">+{issue.labels.length - 2}</span>
					{/if}
				</div>
			{/if}
		</div>
	</Table.Cell>

	<!-- Type Column (hidden below sm) -->
	<Table.Cell class="hidden sm:table-cell">
		<div class="flex items-center gap-2">
			<TypeIcon type={issue.type} size={18} />
			<span class="text-sm text-muted-foreground capitalize">{issue.type}</span>
		</div>
	</Table.Cell>

	<!-- Status Column -->
	<Table.Cell>
		<StatusBadge status={issue.status} />
	</Table.Cell>

	<!-- Priority Column (hidden below md) -->
	<Table.Cell class="hidden md:table-cell">
		<PriorityBadge priority={formatPriority(issue.priority)} />
	</Table.Cell>

	<!-- Created Column (hidden below lg) -->
	<Table.Cell class="hidden text-sm text-muted-foreground lg:table-cell">
		{formatDate(issue.created)}
	</Table.Cell>
</Table.Row>
