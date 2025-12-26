<script lang="ts">
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import TypeIcon from '$lib/components/shared/TypeIcon.svelte';
	import PriorityBadge from '$lib/components/shared/PriorityBadge.svelte';
	import StatusBadge from '$lib/components/shared/StatusBadge.svelte';
	import type { Issue } from '$lib/types/beads';
	import type { EpicStats } from '$lib/types/epic-stats';

	interface Props {
		epic: Issue;
		stats: EpicStats;
		repoId: string;
	}

	let { epic, stats, repoId }: Props = $props();

	const priorityLabel = $derived(`P${epic.priority}` as 'P0' | 'P1' | 'P2' | 'P3' | 'P4');

	const progressColor = $derived.by(() => {
		if (stats.progressPercent === 100) return 'bg-green-500 dark:bg-green-400';
		if (stats.progressPercent >= 75) return 'bg-emerald-500 dark:bg-emerald-400';
		if (stats.progressPercent >= 50) return 'bg-yellow-500 dark:bg-yellow-400';
		if (stats.progressPercent >= 25) return 'bg-orange-500 dark:bg-orange-400';
		return 'bg-blue-500 dark:bg-blue-400';
	});

	function goToBoard() {
		goto(`/repos/${repoId}/board`);
	}

	function goToIssues() {
		goto(`/repos/${repoId}/issues?parentId=${epic.id}`);
	}
</script>

<Card class="transition-shadow hover:shadow-md">
	<CardContent class="p-4">
		<div class="space-y-3">
			<!-- Header -->
			<div class="flex items-start justify-between gap-2">
				<div class="flex min-w-0 items-center gap-2">
					<TypeIcon type="epic" size={18} />
					<span class="font-mono text-sm text-muted-foreground">{epic.id}</span>
				</div>
				<div class="flex shrink-0 items-center gap-2">
					<PriorityBadge priority={priorityLabel} />
					<StatusBadge status={epic.status} />
				</div>
			</div>

			<!-- Title -->
			<h3 class="line-clamp-2 leading-tight font-medium">{epic.title}</h3>

			<!-- Progress -->
			<div class="space-y-1">
				<div class="flex items-center justify-between text-xs">
					<span class="text-muted-foreground">{stats.closed} / {stats.total} completed</span>
					<span class="font-medium">{stats.progressPercent}%</span>
				</div>
				<div class="h-2 w-full overflow-hidden rounded-full bg-muted">
					<div
						class="h-full transition-all duration-300 ease-out {progressColor}"
						style="width: {stats.progressPercent}%"
					></div>
				</div>
			</div>

			<!-- Stats -->
			<div class="flex items-center gap-2 text-xs text-muted-foreground">
				{#if stats.blocked > 0}
					<Badge
						variant="outline"
						class="border-red-300 text-red-700 dark:border-red-700 dark:text-red-300"
					>
						<Icon icon="mdi:block-helper" class="mr-1 h-3 w-3" />
						{stats.blocked} blocked
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
				{#if stats.open > 0}
					<Badge
						variant="outline"
						class="border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300"
					>
						{stats.open} ready
					</Badge>
				{/if}
			</div>

			<!-- Actions -->
			<div class="flex gap-2 pt-1">
				<Button variant="outline" size="sm" class="flex-1" onclick={goToBoard}>
					<Icon icon="mdi:view-column" class="mr-1 h-4 w-4" />
					Board
				</Button>
				<Button variant="outline" size="sm" class="flex-1" onclick={goToIssues}>
					<Icon icon="mdi:format-list-bulleted" class="mr-1 h-4 w-4" />
					Issues
				</Button>
			</div>
		</div>
	</CardContent>
</Card>
