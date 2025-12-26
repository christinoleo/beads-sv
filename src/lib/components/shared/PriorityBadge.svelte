<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';

	type Priority = 'P0' | 'P1' | 'P2' | 'P3' | 'P4';

	interface Props {
		priority: Priority;
		class?: string;
	}

	let { priority, class: className }: Props = $props();

	const priorityColors: Record<Priority, string> = {
		P0: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
		P1: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
		P2: 'bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
		P3: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
		P4: 'bg-gray-50 text-gray-500 border-gray-100 dark:bg-gray-900 dark:text-gray-500 dark:border-gray-800'
	};

	const priorityLabels: Record<Priority, string> = {
		P0: 'P0 - Critical',
		P1: 'P1 - High',
		P2: 'P2 - Medium',
		P3: 'P3 - Low',
		P4: 'P4 - Minimal'
	};
</script>

<Badge variant="outline" class="{priorityColors[priority]} {className}">
	{priorityLabels[priority]}
</Badge>
