<script lang="ts">
	import { Card, CardContent } from '$lib/components/ui/card';
	import TypeIcon from '$lib/components/shared/TypeIcon.svelte';
	import PriorityBadge from '$lib/components/shared/PriorityBadge.svelte';
	import Icon from '@iconify/svelte';
	import type { Issue } from '$lib/types/beads';

	interface Props {
		issue: Issue;
		onClick?: (issue: Issue) => void;
	}

	let { issue, onClick }: Props = $props();

	const isBlocked = $derived(issue.blockedBy.length > 0);
	const priorityLabel = $derived(`P${issue.priority}` as 'P0' | 'P1' | 'P2' | 'P3' | 'P4');

	function handleClick() {
		onClick?.(issue);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleClick();
		}
	}
</script>

<Card
	class="cursor-pointer transition-shadow hover:shadow-md {isBlocked
		? 'border-red-400 dark:border-red-600'
		: ''}"
	role="button"
	tabindex={0}
	onclick={handleClick}
	onkeydown={handleKeydown}
>
	<CardContent class="p-3">
		<div class="flex flex-col gap-2">
			<!-- ID and blocked indicator -->
			<div class="flex items-center justify-between">
				<span class="font-mono text-xs text-muted-foreground">{issue.id}</span>
				{#if isBlocked}
					<Icon icon="mdi:block-helper" class="h-4 w-4 text-red-500 dark:text-red-400" />
				{/if}
			</div>

			<!-- Title -->
			<h4 class="line-clamp-2 text-sm leading-tight font-medium">{issue.title}</h4>

			<!-- Type and Priority -->
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<TypeIcon type={issue.type} size={14} />
					<span class="text-xs text-muted-foreground capitalize">{issue.type}</span>
				</div>
				<PriorityBadge priority={priorityLabel} class="px-1.5 py-0 text-[10px]" />
			</div>

			<!-- Labels (if any, show first 2) -->
			{#if issue.labels.length > 0}
				<div class="flex flex-wrap gap-1">
					{#each issue.labels.slice(0, 2) as label (label)}
						<span class="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
							{label}
						</span>
					{/each}
					{#if issue.labels.length > 2}
						<span class="text-[10px] text-muted-foreground">
							+{issue.labels.length - 2}
						</span>
					{/if}
				</div>
			{/if}
		</div>
	</CardContent>
</Card>
