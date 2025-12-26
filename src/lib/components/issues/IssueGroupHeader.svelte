<script lang="ts">
	import Icon from '@iconify/svelte';
	import { Badge } from '$lib/components/ui/badge';
	import TypeIcon from '$lib/components/shared/TypeIcon.svelte';
	import PriorityBadge from '$lib/components/shared/PriorityBadge.svelte';
	import type { Issue } from '$lib/types/beads';
	import type { EpicStats } from '$lib/types/epic-stats';

	interface Props {
		epic: Issue | null;
		stats: EpicStats;
		isOpen: boolean;
	}

	let { epic, stats, isOpen }: Props = $props();

	const priorityLabel = $derived(
		epic ? (`P${epic.priority}` as 'P0' | 'P1' | 'P2' | 'P3' | 'P4') : 'P2'
	);

	const progressColor = $derived.by(() => {
		if (stats.progressPercent === 100) return 'bg-green-500 dark:bg-green-400';
		if (stats.progressPercent >= 75) return 'bg-emerald-500 dark:bg-emerald-400';
		if (stats.progressPercent >= 50) return 'bg-yellow-500 dark:bg-yellow-400';
		if (stats.progressPercent >= 25) return 'bg-orange-500 dark:bg-orange-400';
		return 'bg-blue-500 dark:bg-blue-400';
	});
</script>

<div class="flex w-full items-center gap-3 px-4 py-3">
	<!-- Expand/Collapse chevron -->
	<Icon
		icon={isOpen ? 'mdi:chevron-down' : 'mdi:chevron-right'}
		class="h-5 w-5 shrink-0 text-muted-foreground transition-transform"
	/>

	<!-- Epic info -->
	<div class="flex min-w-0 flex-1 items-center gap-3">
		{#if epic}
			<TypeIcon type="epic" size={18} />
			<span class="font-mono text-sm text-muted-foreground">{epic.id}</span>
			<span class="truncate font-medium">{epic.title}</span>
			<PriorityBadge priority={priorityLabel} class="shrink-0" />
		{:else}
			<Icon icon="mdi:folder-outline" class="h-5 w-5 text-muted-foreground" />
			<span class="font-medium text-muted-foreground">No Epic</span>
		{/if}
	</div>

	<!-- Stats summary -->
	<div class="flex shrink-0 items-center gap-4">
		<!-- Quick stat badges -->
		<div class="hidden items-center gap-2 text-xs sm:flex">
			{#if stats.blocked > 0}
				<Badge
					variant="outline"
					class="border-red-300 text-red-700 dark:border-red-700 dark:text-red-300"
				>
					<Icon icon="mdi:block-helper" class="mr-1 h-3 w-3" />
					{stats.blocked}
				</Badge>
			{/if}
			<Badge variant="secondary" class="text-muted-foreground">
				{stats.total}
				{stats.total === 1 ? 'issue' : 'issues'}
			</Badge>
		</div>

		<!-- Compact progress bar -->
		<div class="flex items-center gap-2">
			<div class="h-2 w-20 overflow-hidden rounded-full bg-muted">
				<div
					class="h-full transition-all duration-300 ease-out {progressColor}"
					style="width: {stats.progressPercent}%"
				></div>
			</div>
			<span class="w-10 text-right text-sm font-medium text-muted-foreground"
				>{stats.progressPercent}%</span
			>
		</div>
	</div>
</div>
