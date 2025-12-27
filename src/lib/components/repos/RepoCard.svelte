<script lang="ts">
	import Icon from '@iconify/svelte';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import type { ManagedRepo } from '$lib/types/beads';

	interface Props {
		repo: ManagedRepo;
		href?: string;
		onRemove?: (repo: ManagedRepo) => void;
	}

	let { repo, href, onRemove }: Props = $props();

	function truncatePath(path: string, maxLength: number = 40): string {
		if (path.length <= maxLength) return path;
		const parts = path.split('/');
		let result = parts[parts.length - 1];
		for (let i = parts.length - 2; i >= 0; i--) {
			const newResult = parts[i] + '/' + result;
			if (newResult.length > maxLength - 3) {
				return '...' + '/' + result;
			}
			result = newResult;
		}
		return result;
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return 'Just now';
		if (diffMins < 60) return `${diffMins}m ago`;
		if (diffHours < 24) return `${diffHours}h ago`;
		if (diffDays < 7) return `${diffDays}d ago`;
		return date.toLocaleDateString();
	}
</script>

<a
	{href}
	class="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
>
	<Card.Root class="relative h-full transition-shadow hover:shadow-md hover:border-primary/50">
	<Card.Header class="pb-2">
		<div class="flex items-start justify-between gap-2">
			<div class="flex min-w-0 items-center gap-2">
				{#if repo.color}
					<div class="h-3 w-3 shrink-0 rounded-full" style="background-color: {repo.color}"></div>
				{:else}
					<Icon icon="mdi:git" class="h-5 w-5 shrink-0 text-muted-foreground" />
				{/if}
				<Card.Title class="truncate text-lg">{repo.name}</Card.Title>
			</div>
			{#if !repo.isValid}
				<Badge variant="destructive" class="shrink-0">
					<Icon icon="mdi:alert" class="mr-1 h-3 w-3" />
					Invalid
				</Badge>
			{/if}
		</div>
		<Card.Description class="flex items-center gap-1 text-xs">
			<Icon icon="mdi:folder-outline" class="h-4 w-4 shrink-0" />
			<span class="truncate" title={repo.path}>{truncatePath(repo.path)}</span>
		</Card.Description>
	</Card.Header>

	<Card.Content class="pb-3">
		<div class="flex flex-wrap gap-2">
			<Badge variant="secondary" class="gap-1">
				<Icon icon="mdi:file-document-outline" class="h-3 w-3" />
				{repo.issueCount ?? 0} issues
			</Badge>
			<Badge variant="outline" class="gap-1">
				<Icon icon="mdi:circle-outline" class="h-3 w-3" />
				{repo.openCount ?? 0} open
			</Badge>
			<Badge variant="outline" class="gap-1">
				<Icon icon="mdi:tag-outline" class="h-3 w-3" />
				{repo.config.prefix}
			</Badge>
		</div>

		{#if repo.errorMessage}
			<p class="mt-2 flex items-start gap-1 text-xs text-destructive">
				<Icon icon="mdi:alert-circle" class="mt-0.5 h-4 w-4 shrink-0" />
				<span>{repo.errorMessage}</span>
			</p>
		{/if}
	</Card.Content>

	<Card.Footer class="flex items-center justify-between pt-0">
		<span class="flex items-center gap-1 text-xs text-muted-foreground">
			<Icon icon="mdi:sync" class="h-3 w-3" />
			{formatDate(repo.lastSyncedAt)}
		</span>
		<Button
			variant="ghost"
			size="icon-sm"
			onclick={(e) => {
				e.preventDefault();
				e.stopPropagation();
				onRemove?.(repo);
			}}
			aria-label="Remove {repo.name} from workspace"
			class="text-destructive hover:text-destructive"
		>
			<Icon icon="mdi:trash-can-outline" class="h-4 w-4" />
		</Button>
	</Card.Footer>
	</Card.Root>
</a>
