<script lang="ts">
	import Icon from '@iconify/svelte';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import type { ManagedRepo } from '$lib/types/beads';

	interface Props {
		repo: ManagedRepo;
		onRemove?: (repo: ManagedRepo) => void;
		onOpen?: (repo: ManagedRepo) => void;
	}

	let { repo, onRemove, onOpen }: Props = $props();

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

<Card.Root class="relative hover:shadow-md transition-shadow">
	<Card.Header class="pb-2">
		<div class="flex items-start justify-between gap-2">
			<div class="flex items-center gap-2 min-w-0">
				{#if repo.color}
					<div
						class="w-3 h-3 rounded-full shrink-0"
						style="background-color: {repo.color}"
					></div>
				{:else}
					<Icon icon="mdi:git" class="w-5 h-5 text-muted-foreground shrink-0" />
				{/if}
				<Card.Title class="text-lg truncate">{repo.name}</Card.Title>
			</div>
			{#if !repo.isValid}
				<Badge variant="destructive" class="shrink-0">
					<Icon icon="mdi:alert" class="w-3 h-3 mr-1" />
					Invalid
				</Badge>
			{/if}
		</div>
		<Card.Description class="flex items-center gap-1 text-xs">
			<Icon icon="mdi:folder-outline" class="w-4 h-4 shrink-0" />
			<span class="truncate" title={repo.path}>{truncatePath(repo.path)}</span>
		</Card.Description>
	</Card.Header>

	<Card.Content class="pb-3">
		<div class="flex flex-wrap gap-2">
			<Badge variant="secondary" class="gap-1">
				<Icon icon="mdi:file-document-outline" class="w-3 h-3" />
				{repo.issueCount ?? 0} issues
			</Badge>
			<Badge variant="outline" class="gap-1">
				<Icon icon="mdi:circle-outline" class="w-3 h-3" />
				{repo.openCount ?? 0} open
			</Badge>
			<Badge variant="outline" class="gap-1">
				<Icon icon="mdi:tag-outline" class="w-3 h-3" />
				{repo.config.prefix}
			</Badge>
		</div>

		{#if repo.errorMessage}
			<p class="mt-2 text-xs text-destructive flex items-start gap-1">
				<Icon icon="mdi:alert-circle" class="w-4 h-4 shrink-0 mt-0.5" />
				<span>{repo.errorMessage}</span>
			</p>
		{/if}
	</Card.Content>

	<Card.Footer class="pt-0 flex items-center justify-between">
		<span class="text-xs text-muted-foreground flex items-center gap-1">
			<Icon icon="mdi:sync" class="w-3 h-3" />
			{formatDate(repo.lastSyncedAt)}
		</span>
		<div class="flex gap-1">
			<Button variant="ghost" size="icon-sm" onclick={() => onOpen?.(repo)} title="Open repository">
				<Icon icon="mdi:open-in-new" class="w-4 h-4" />
			</Button>
			<Button
				variant="ghost"
				size="icon-sm"
				onclick={() => onRemove?.(repo)}
				title="Remove repository"
				class="text-destructive hover:text-destructive"
			>
				<Icon icon="mdi:trash-can-outline" class="w-4 h-4" />
			</Button>
		</div>
	</Card.Footer>
</Card.Root>
