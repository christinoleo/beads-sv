<script lang="ts">
	import Icon from '@iconify/svelte';

	type IssueType = 'bug' | 'feature' | 'task' | 'epic' | 'chore';

	interface Props {
		type: IssueType;
		size?: number;
		class?: string;
	}

	let { type, size = 16, class: className }: Props = $props();

	const typeIcons: Record<IssueType, string> = {
		bug: 'mdi:bug',
		feature: 'mdi:star-four-points',
		task: 'mdi:checkbox-marked',
		epic: 'mdi:flag',
		chore: 'mdi:broom'
	};

	const typeColors: Record<IssueType, string> = {
		bug: 'text-red-500 dark:text-red-400',
		feature: 'text-purple-500 dark:text-purple-400',
		task: 'text-blue-500 dark:text-blue-400',
		epic: 'text-orange-500 dark:text-orange-400',
		chore: 'text-gray-500 dark:text-gray-400'
	};
</script>

<Icon
	icon={typeIcons[type]}
	width={size}
	height={size}
	class="{typeColors[type]} {className}"
/>
