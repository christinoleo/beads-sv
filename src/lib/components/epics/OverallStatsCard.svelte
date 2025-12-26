<script lang="ts">
	import Icon from '@iconify/svelte';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import type { OverallStats } from '$lib/types/epic-stats';

	interface Props {
		stats: OverallStats;
	}

	let { stats }: Props = $props();

	const healthConfig = {
		good: {
			icon: 'mdi:check-circle',
			label: 'Healthy',
			class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
		},
		warning: {
			icon: 'mdi:alert-circle',
			label: 'Needs Attention',
			class: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
		},
		critical: {
			icon: 'mdi:alert-octagon',
			label: 'Critical',
			class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
		}
	};

	const health = $derived(healthConfig[stats.healthScore]);

	const progressColor = $derived.by(() => {
		if (stats.overallProgress === 100) return 'bg-green-500 dark:bg-green-400';
		if (stats.overallProgress >= 75) return 'bg-emerald-500 dark:bg-emerald-400';
		if (stats.overallProgress >= 50) return 'bg-yellow-500 dark:bg-yellow-400';
		if (stats.overallProgress >= 25) return 'bg-orange-500 dark:bg-orange-400';
		return 'bg-blue-500 dark:bg-blue-400';
	});
</script>

<Card class="h-full">
	<CardHeader class="pb-3">
		<div class="flex items-center justify-between">
			<CardTitle class="text-lg">Project Overview</CardTitle>
			<Badge class={health.class}>
				<Icon icon={health.icon} class="mr-1 h-3 w-3" />
				{health.label}
			</Badge>
		</div>
	</CardHeader>
	<CardContent class="space-y-6">
		<!-- Overall Progress -->
		<div class="space-y-2">
			<div class="flex items-center justify-between text-sm">
				<span class="text-muted-foreground">Overall Progress</span>
				<span class="font-semibold">{stats.overallProgress}%</span>
			</div>
			<div class="h-3 w-full overflow-hidden rounded-full bg-muted">
				<div
					class="h-full transition-all duration-500 ease-out {progressColor}"
					style="width: {stats.overallProgress}%"
				></div>
			</div>
			<p class="text-xs text-muted-foreground">
				{stats.closedIssues} of {stats.totalIssues} issues completed
			</p>
		</div>

		<!-- Stats Grid -->
		<div class="grid grid-cols-2 gap-4">
			<!-- Epics -->
			<div class="space-y-1">
				<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Epics</p>
				<div class="flex items-baseline gap-2">
					<span class="text-2xl font-bold">{stats.activeEpics}</span>
					<span class="text-sm text-muted-foreground">active</span>
				</div>
				<p class="text-xs text-muted-foreground">
					{stats.completedEpics} completed of {stats.totalEpics} total
				</p>
			</div>

			<!-- Issues -->
			<div class="space-y-1">
				<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Issues</p>
				<div class="flex items-baseline gap-2">
					<span class="text-2xl font-bold">{stats.openIssues + stats.inProgressIssues}</span>
					<span class="text-sm text-muted-foreground">open</span>
				</div>
				<p class="text-xs text-muted-foreground">
					{stats.inProgressIssues} in progress
				</p>
			</div>
		</div>

		<!-- Status Breakdown -->
		<div class="space-y-2">
			<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Status</p>
			<div class="flex gap-3 text-sm">
				{#if stats.blockedIssues > 0}
					<div class="flex items-center gap-1 text-red-600 dark:text-red-400">
						<Icon icon="mdi:block-helper" class="h-4 w-4" />
						<span>{stats.blockedIssues} blocked</span>
					</div>
				{/if}
				<div class="flex items-center gap-1 text-blue-600 dark:text-blue-400">
					<Icon icon="mdi:checkbox-blank-circle-outline" class="h-4 w-4" />
					<span>{stats.openIssues} ready</span>
				</div>
				<div class="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
					<Icon icon="mdi:progress-clock" class="h-4 w-4" />
					<span>{stats.inProgressIssues} active</span>
				</div>
			</div>
		</div>
	</CardContent>
</Card>
