<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		completed: number;
		total: number;
		showLabel?: boolean;
		size?: 'sm' | 'md' | 'lg';
		class?: string;
	}

	let { completed, total, showLabel = true, size = 'md', class: className }: Props = $props();

	const percentage = $derived(total > 0 ? Math.round((completed / total) * 100) : 0);

	const progressColor = $derived.by(() => {
		if (percentage === 100) return 'bg-green-500 dark:bg-green-400';
		if (percentage >= 75) return 'bg-emerald-500 dark:bg-emerald-400';
		if (percentage >= 50) return 'bg-yellow-500 dark:bg-yellow-400';
		if (percentage >= 25) return 'bg-orange-500 dark:bg-orange-400';
		return 'bg-blue-500 dark:bg-blue-400';
	});

	const sizeClasses = {
		sm: 'h-1.5',
		md: 'h-2',
		lg: 'h-3'
	};

	const labelSizeClasses = {
		sm: 'text-xs',
		md: 'text-sm',
		lg: 'text-base'
	};
</script>

<div class={cn('flex flex-col gap-1', className)}>
	{#if showLabel}
		<div class={cn('flex items-center justify-between', labelSizeClasses[size])}>
			<span class="text-muted-foreground">
				{completed} / {total} completed
			</span>
			<span class="font-medium">{percentage}%</span>
		</div>
	{/if}
	<div class={cn('bg-muted w-full overflow-hidden rounded-full', sizeClasses[size])}>
		<div
			class={cn('h-full transition-all duration-300 ease-out', progressColor)}
			style="width: {percentage}%"
		></div>
	</div>
</div>
