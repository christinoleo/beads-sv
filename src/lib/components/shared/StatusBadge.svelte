<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';

	type Status = 'open' | 'in_progress' | 'closed';

	interface Props {
		status: Status;
		class?: string;
	}

	let { status, class: className }: Props = $props();

	const statusColors: Record<Status, string> = {
		open: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
		in_progress:
			'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
		closed:
			'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
	};

	const statusLabels: Record<Status, string> = {
		open: 'Open',
		in_progress: 'In Progress',
		closed: 'Closed'
	};
</script>

<Badge variant="outline" class="{statusColors[status]} {className}">
	{statusLabels[status]}
</Badge>
