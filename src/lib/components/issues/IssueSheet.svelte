<script lang="ts">
	import Icon from '@iconify/svelte';
	import * as Sheet from '$lib/components/ui/sheet';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import StatusBadge from '$lib/components/shared/StatusBadge.svelte';
	import PriorityBadge from '$lib/components/shared/PriorityBadge.svelte';
	import TypeIcon from '$lib/components/shared/TypeIcon.svelte';
	import type { Issue, IssueStatus, Priority } from '$lib/types/beads';
	import { marked } from 'marked';
	import DOMPurify from 'dompurify';

	interface Props {
		issue: Issue | null;
		open?: boolean;
		repoId: string;
		onOpenChange?: (open: boolean) => void;
		onIssueUpdate?: (issue: Issue) => void;
		onEdit?: (issue: Issue) => void;
	}

	let { issue, open = $bindable(false), repoId, onOpenChange, onIssueUpdate, onEdit }: Props = $props();

	let isUpdating = $state(false);
	let updateError = $state<string | null>(null);

	const statusOptions: { value: IssueStatus; label: string }[] = [
		{ value: 'open', label: 'Open' },
		{ value: 'in_progress', label: 'In Progress' },
		{ value: 'closed', label: 'Closed' }
	];

	const priorityOptions: { value: Priority; label: string }[] = [
		{ value: 0, label: 'P0 - Critical' },
		{ value: 1, label: 'P1 - High' },
		{ value: 2, label: 'P2 - Medium' },
		{ value: 3, label: 'P3 - Low' },
		{ value: 4, label: 'P4 - Minimal' }
	];

	function formatPriority(priority: Priority): `P${Priority}` {
		return `P${priority}` as `P${Priority}`;
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatRelativeDate(dateString: string): string {
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

		if (diffDays === 0) {
			const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
			if (diffHours === 0) {
				const diffMins = Math.floor(diffMs / (1000 * 60));
				return diffMins <= 1 ? 'Just now' : `${diffMins} minutes ago`;
			}
			return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
		}
		if (diffDays === 1) return 'Yesterday';
		if (diffDays < 7) return `${diffDays} days ago`;
		if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
		return formatDate(dateString);
	}

	function renderMarkdownSync(content: string): string {
		if (!content) return '';
		// marked.parse can return string synchronously when async option is not set
		const html = marked.parse(content, { async: false }) as string;
		return DOMPurify.sanitize(html);
	}

	const renderedDescription = $derived(issue?.description ? renderMarkdownSync(issue.description) : '');

	async function updateIssue(updates: { status?: IssueStatus; priority?: Priority }) {
		if (!issue) return;

		isUpdating = true;
		updateError = null;

		try {
			const response = await fetch(`/api/repos/${repoId}/issues/${issue.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updates)
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'Failed to update issue');
			}

			const result = await response.json();
			onIssueUpdate?.(result.data);
		} catch (e) {
			updateError = e instanceof Error ? e.message : 'An error occurred';
		} finally {
			isUpdating = false;
		}
	}

	function handleStatusChange(status: IssueStatus) {
		updateIssue({ status });
	}

	function handlePriorityChange(priority: Priority) {
		updateIssue({ priority });
	}

	function handleOpenChange(newOpen: boolean) {
		open = newOpen;
		onOpenChange?.(newOpen);
		if (!newOpen) {
			updateError = null;
		}
	}
</script>

<Sheet.Root bind:open onOpenChange={handleOpenChange}>
	<Sheet.Content side="right" class="w-full sm:max-w-lg overflow-y-auto">
		{#if issue}
			<Sheet.Header class="space-y-4">
				<div class="flex items-start gap-3">
					<TypeIcon type={issue.type} size={24} class="mt-1 shrink-0" />
					<div class="flex-1 min-w-0">
						<Sheet.Title class="text-xl font-semibold leading-tight">
							{issue.title}
						</Sheet.Title>
						<p class="text-sm text-muted-foreground mt-1">
							{issue.id}
						</p>
					</div>
				</div>
			</Sheet.Header>

			<div class="mt-6 space-y-6">
				<!-- Error Banner -->
				{#if updateError}
					<div class="bg-destructive/10 text-destructive rounded-md border border-destructive/20 p-3 flex items-center gap-2">
						<Icon icon="mdi:alert-circle" class="h-4 w-4 shrink-0" />
						<p class="text-sm">{updateError}</p>
						<Button variant="ghost" size="sm" class="ml-auto h-6 px-2" onclick={() => updateError = null}>
							<Icon icon="mdi:close" class="h-4 w-4" />
						</Button>
					</div>
				{/if}

				<!-- Status & Priority Section -->
				<div class="grid grid-cols-2 gap-4">
					<!-- Status Dropdown -->
					<div class="space-y-2">
						<span class="text-sm font-medium text-muted-foreground">Status</span>
						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								{#snippet child({ props })}
									<Button
										variant="outline"
										class="w-full justify-between"
										disabled={isUpdating}
										{...props}
									>
										<StatusBadge status={issue.status} />
										<Icon icon="mdi:chevron-down" class="h-4 w-4 ml-2 opacity-50" />
									</Button>
								{/snippet}
							</DropdownMenu.Trigger>
							<DropdownMenu.Content class="w-48">
								{#each statusOptions as option (option.value)}
									<DropdownMenu.Item
										onclick={() => handleStatusChange(option.value)}
										class="cursor-pointer"
									>
										<StatusBadge status={option.value} />
										{#if issue.status === option.value}
											<Icon icon="mdi:check" class="h-4 w-4 ml-auto" />
										{/if}
									</DropdownMenu.Item>
								{/each}
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					</div>

					<!-- Priority Dropdown -->
					<div class="space-y-2">
						<span class="text-sm font-medium text-muted-foreground">Priority</span>
						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								{#snippet child({ props })}
									<Button
										variant="outline"
										class="w-full justify-between"
										disabled={isUpdating}
										{...props}
									>
										<PriorityBadge priority={formatPriority(issue.priority)} />
										<Icon icon="mdi:chevron-down" class="h-4 w-4 ml-2 opacity-50" />
									</Button>
								{/snippet}
							</DropdownMenu.Trigger>
							<DropdownMenu.Content class="w-48">
								{#each priorityOptions as option (option.value)}
									<DropdownMenu.Item
										onclick={() => handlePriorityChange(option.value)}
										class="cursor-pointer"
									>
										<PriorityBadge priority={formatPriority(option.value)} />
										{#if issue.priority === option.value}
											<Icon icon="mdi:check" class="h-4 w-4 ml-auto" />
										{/if}
									</DropdownMenu.Item>
								{/each}
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					</div>
				</div>

				<Separator />

				<!-- Labels -->
				{#if issue.labels.length > 0}
					<div class="space-y-2">
						<span class="text-sm font-medium text-muted-foreground">Labels</span>
						<div class="flex flex-wrap gap-2">
							{#each issue.labels as label (label)}
								<Badge variant="secondary">{label}</Badge>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Description -->
				<div class="space-y-2">
					<span class="text-sm font-medium text-muted-foreground">Description</span>
					{#if renderedDescription}
						<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
						<div class="prose prose-sm dark:prose-invert max-w-none rounded-md bg-muted/30 p-4" tabindex="0">
							<!-- Content is sanitized with DOMPurify -->
							{@html renderedDescription}
						</div>
					{:else}
						<p class="text-sm text-muted-foreground italic">No description provided</p>
					{/if}
				</div>

				<!-- Relationships -->
				{#if issue.blockedBy.length > 0 || issue.blocks.length > 0}
					<Separator />

					<div class="space-y-4">
						{#if issue.blockedBy.length > 0}
							<div class="space-y-2">
								<span class="text-sm font-medium text-muted-foreground flex items-center gap-2">
									<Icon icon="mdi:block-helper" class="h-4 w-4 text-red-500" />
									Blocked By
								</span>
								<div class="flex flex-wrap gap-2">
									{#each issue.blockedBy as blockerId (blockerId)}
										<Badge variant="outline" class="border-red-200 text-red-700 dark:border-red-800 dark:text-red-300">
											{blockerId}
										</Badge>
									{/each}
								</div>
							</div>
						{/if}

						{#if issue.blocks.length > 0}
							<div class="space-y-2">
								<span class="text-sm font-medium text-muted-foreground flex items-center gap-2">
									<Icon icon="mdi:arrow-right-bold" class="h-4 w-4 text-orange-500" />
									Blocks
								</span>
								<div class="flex flex-wrap gap-2">
									{#each issue.blocks as blockedId (blockedId)}
										<Badge variant="outline" class="border-orange-200 text-orange-700 dark:border-orange-800 dark:text-orange-300">
											{blockedId}
										</Badge>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				{/if}

				<Separator />

				<!-- Metadata -->
				<div class="space-y-3">
					<div class="flex items-center justify-between text-sm">
						<span class="text-muted-foreground">Created</span>
						<span title={formatDate(issue.created)}>{formatRelativeDate(issue.created)}</span>
					</div>
					{#if issue.updated}
						<div class="flex items-center justify-between text-sm">
							<span class="text-muted-foreground">Last Modified</span>
							<span title={formatDate(issue.updated)}>{formatRelativeDate(issue.updated)}</span>
						</div>
					{/if}
					{#if issue.closed}
						<div class="flex items-center justify-between text-sm">
							<span class="text-muted-foreground">Closed</span>
							<span title={formatDate(issue.closed)}>{formatRelativeDate(issue.closed)}</span>
						</div>
					{/if}
					{#if issue.parentId}
						<div class="flex items-center justify-between text-sm">
							<span class="text-muted-foreground">Parent Epic</span>
							<Badge variant="outline">{issue.parentId}</Badge>
						</div>
					{/if}
				</div>
			</div>

			<Sheet.Footer class="mt-6 pt-6 border-t">
				<Button variant="outline" onclick={() => handleOpenChange(false)}>
					Close
				</Button>
				<Button onclick={() => onEdit?.(issue)}>
					<Icon icon="mdi:pencil" class="h-4 w-4 mr-2" />
					Edit Issue
				</Button>
			</Sheet.Footer>
		{:else}
			<div class="flex items-center justify-center h-64">
				<p class="text-muted-foreground">No issue selected</p>
			</div>
		{/if}
	</Sheet.Content>
</Sheet.Root>
