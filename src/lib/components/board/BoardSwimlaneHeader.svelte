<script lang="ts">
	import Icon from '@iconify/svelte';
	import { Badge } from '$lib/components/ui/badge';
	import TypeIcon from '$lib/components/shared/TypeIcon.svelte';
	import PriorityBadge from '$lib/components/shared/PriorityBadge.svelte';
	import EpicProgress from '$lib/components/epics/EpicProgress.svelte';
	import type { Issue } from '$lib/types/beads';
	import type { EpicStats } from '$lib/types/epic-stats';

	interface Props {
		epic: Issue | null;
		stats: EpicStats;
		isCollapsed?: boolean;
		onToggle?: () => void;
	}

	let { epic, stats, isCollapsed = false, onToggle }: Props = $props();

	const priorityLabel = $derived(
		epic ? (`P${epic.priority}` as 'P0' | 'P1' | 'P2' | 'P3' | 'P4') : 'P2'
	);
</script>

<button
	type="button"
	class="flex w-full items-center gap-3 rounded-lg bg-muted/50 px-4 py-3 text-left transition-colors hover:bg-muted/80"
	onclick={onToggle}
>
	<!-- Collapse chevron -->
	<Icon
		icon={isCollapsed ? 'mdi:chevron-right' : 'mdi:chevron-down'}
		class="h-5 w-5 shrink-0 text-muted-foreground transition-transform"
	/>

	<!-- Epic info -->
	<div class="flex min-w-0 flex-1 items-center gap-3">
		{#if epic}
			<TypeIcon type="epic" size={20} />
			<span class="font-mono text-sm text-muted-foreground">{epic.id}</span>
			<span class="truncate font-medium">{epic.title}</span>
			<PriorityBadge priority={priorityLabel} class="shrink-0" />
		{:else}
			<Icon icon="mdi:folder-outline" class="h-5 w-5 text-muted-foreground" />
			<span class="font-medium text-muted-foreground">No Epic</span>
		{/if}
	</div>

	<!-- Stats -->
	<div class="flex shrink-0 items-center gap-4">
		<!-- Issue counts -->
		<div class="flex items-center gap-2 text-xs text-muted-foreground">
			{#if stats.blocked > 0}
				<Badge
					variant="outline"
					class="border-red-300 text-red-700 dark:border-red-700 dark:text-red-300"
				>
					<Icon icon="mdi:block-helper" class="mr-1 h-3 w-3" />
					{stats.blocked}
				</Badge>
			{/if}
			{#if stats.open > 0}
				<Badge
					variant="outline"
					class="border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300"
				>
					{stats.open} ready
				</Badge>
			{/if}
			{#if stats.inProgress > 0}
				<Badge
					variant="outline"
					class="border-yellow-300 text-yellow-700 dark:border-yellow-700 dark:text-yellow-300"
				>
					{stats.inProgress} in progress
				</Badge>
			{/if}
		</div>

		<!-- Progress bar -->
		<div class="w-32">
			<EpicProgress completed={stats.closed} total={stats.total} size="sm" showLabel={false} />
		</div>
		<span class="w-12 text-right text-sm font-medium">{stats.progressPercent}%</span>
	</div>
</button>
