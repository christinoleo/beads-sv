<script lang="ts">
	import Icon from '@iconify/svelte';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import StatusBadge from '$lib/components/shared/StatusBadge.svelte';
	import PriorityBadge from '$lib/components/shared/PriorityBadge.svelte';
	import TypeIcon from '$lib/components/shared/TypeIcon.svelte';
	import EpicProgress from './EpicProgress.svelte';
	import type { Issue, Priority } from '$lib/types/beads';
	import { cn } from '$lib/utils';

	interface EpicStats {
		total: number;
		open: number;
		inProgress: number;
		closed: number;
	}

	interface Props {
		epic: Issue;
		children: Issue[];
		class?: string;
		onEpicClick?: (epic: Issue) => void;
		onChildClick?: (child: Issue) => void;
	}

	let { epic, children, class: className, onEpicClick, onChildClick }: Props = $props();

	let isExpanded = $state(false);

	const stats: EpicStats = $derived({
		total: children.length,
		open: children.filter((c) => c.status === 'open').length,
		inProgress: children.filter((c) => c.status === 'in_progress').length,
		closed: children.filter((c) => c.status === 'closed').length
	});

	const descriptionPreview = $derived.by(() => {
		if (!epic.description) return '';
		const maxLength = 150;
		if (epic.description.length <= maxLength) return epic.description;
		return epic.description.slice(0, maxLength).trim() + '...';
	});

	function formatPriority(priority: Priority): `P${Priority}` {
		return `P${priority}` as `P${Priority}`;
	}

	function handleToggleExpand() {
		isExpanded = !isExpanded;
	}

	function handleEpicClick() {
		if (onEpicClick) {
			onEpicClick(epic);
		}
	}

	function handleChildClick(child: Issue) {
		if (onChildClick) {
			onChildClick(child);
		}
	}

	function handleKeydown(event: KeyboardEvent, handler: () => void) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handler();
		}
	}
</script>

<Card.Root class={cn('transition-shadow hover:shadow-md', className)}>
	<Card.Header class="pb-3">
		<div class="flex items-start justify-between gap-4">
			<div class="flex-1 space-y-1">
				<div class="flex items-center gap-2">
					<TypeIcon type="epic" size={20} />
					<span class="text-muted-foreground font-mono text-sm">{epic.id}</span>
				</div>
				<button
					type="button"
					class="text-left hover:underline focus:outline-none focus:underline"
					onclick={handleEpicClick}
					onkeydown={(e) => handleKeydown(e, handleEpicClick)}
				>
					<Card.Title class="text-lg">{epic.title}</Card.Title>
				</button>
			</div>
			<div class="flex flex-shrink-0 items-center gap-2">
				<StatusBadge status={epic.status} />
				<PriorityBadge priority={formatPriority(epic.priority)} />
			</div>
		</div>
		{#if descriptionPreview}
			<p class="text-muted-foreground mt-2 text-sm">{descriptionPreview}</p>
		{/if}
	</Card.Header>

	<Card.Content class="space-y-4">
		<!-- Progress -->
		<EpicProgress completed={stats.closed} total={stats.total} size="md" />

		<!-- Stats -->
		<div class="flex flex-wrap gap-4 text-sm">
			<div class="flex items-center gap-1.5">
				<div class="h-2 w-2 rounded-full bg-blue-500"></div>
				<span class="text-muted-foreground">Open:</span>
				<span class="font-medium">{stats.open}</span>
			</div>
			<div class="flex items-center gap-1.5">
				<div class="h-2 w-2 rounded-full bg-yellow-500"></div>
				<span class="text-muted-foreground">In Progress:</span>
				<span class="font-medium">{stats.inProgress}</span>
			</div>
			<div class="flex items-center gap-1.5">
				<div class="h-2 w-2 rounded-full bg-green-500"></div>
				<span class="text-muted-foreground">Closed:</span>
				<span class="font-medium">{stats.closed}</span>
			</div>
		</div>

		<!-- Expand/Collapse Button -->
		{#if children.length > 0}
			<Button
				variant="ghost"
				size="sm"
				class="w-full justify-between"
				onclick={handleToggleExpand}
			>
				<span>{isExpanded ? 'Hide' : 'Show'} child issues ({children.length})</span>
				<Icon
					icon={isExpanded ? 'mdi:chevron-up' : 'mdi:chevron-down'}
					class="h-4 w-4 transition-transform"
				/>
			</Button>

			<!-- Collapsible Child Issues -->
			{#if isExpanded}
				<div class="border-muted space-y-2 border-t pt-4">
					{#each children as child (child.id)}
						<button
							type="button"
							class="hover:bg-muted/50 flex w-full items-center justify-between rounded-md p-2 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
							onclick={() => handleChildClick(child)}
							onkeydown={(e) => handleKeydown(e, () => handleChildClick(child))}
						>
							<div class="flex items-center gap-3">
								<TypeIcon type={child.type} size={16} />
								<span class="text-muted-foreground font-mono text-xs">{child.id}</span>
								<span class="text-sm">{child.title}</span>
							</div>
							<div class="flex items-center gap-2">
								<StatusBadge status={child.status} />
							</div>
						</button>
					{/each}
				</div>
			{/if}
		{:else}
			<p class="text-muted-foreground text-center text-sm">No child issues</p>
		{/if}
	</Card.Content>
</Card.Root>
