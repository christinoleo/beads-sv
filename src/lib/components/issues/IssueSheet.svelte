<script lang="ts">
	import Icon from '@iconify/svelte';
	import * as Sheet from '$lib/components/ui/sheet';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import StatusBadge from '$lib/components/shared/StatusBadge.svelte';
	import PriorityBadge from '$lib/components/shared/PriorityBadge.svelte';
	import TypeIcon from '$lib/components/shared/TypeIcon.svelte';
	import type { Issue, IssueStatus, IssueType, Priority } from '$lib/types/beads';
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

	// Inline editing state
	let isEditing = $state(false);
	let editTitle = $state('');
	let editDescription = $state('');
	let editType = $state<IssueType>('task');

	// Keep a local copy of the issue to show during close animation
	let displayIssue = $state<Issue | null>(null);

	// Update displayIssue when issue changes, but only when opening or when issue updates
	$effect(() => {
		if (issue) {
			displayIssue = issue;
		}
	});

	// Clear displayIssue after sheet closes (after animation completes)
	$effect(() => {
		if (!open && displayIssue) {
			const timeout = setTimeout(() => {
				displayIssue = null;
				isEditing = false;
			}, 300); // Match sheet animation duration
			return () => clearTimeout(timeout);
		}
	});

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

	const typeOptions: { value: IssueType; label: string }[] = [
		{ value: 'task', label: 'Task' },
		{ value: 'bug', label: 'Bug' },
		{ value: 'feature', label: 'Feature' },
		{ value: 'epic', label: 'Epic' },
		{ value: 'chore', label: 'Chore' }
	];

	function startEditing() {
		if (!displayIssue) return;
		editTitle = displayIssue.title;
		editDescription = displayIssue.description || '';
		editType = displayIssue.type;
		isEditing = true;
	}

	function cancelEditing() {
		isEditing = false;
		updateError = null;
	}

	async function saveChanges() {
		if (!displayIssue) return;

		const updates: Partial<Issue> = {};
		if (editTitle !== displayIssue.title) updates.title = editTitle;
		if (editDescription !== displayIssue.description) updates.description = editDescription;
		if (editType !== displayIssue.type) updates.type = editType;

		if (Object.keys(updates).length === 0) {
			isEditing = false;
			return;
		}

		isUpdating = true;
		updateError = null;

		try {
			const response = await fetch(`/api/repos/${repoId}/issues/${displayIssue.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updates)
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'Failed to update issue');
			}

			const result = await response.json();
			displayIssue = result.data;
			onIssueUpdate?.(result.data);
			isEditing = false;
		} catch (e) {
			updateError = e instanceof Error ? e.message : 'An error occurred';
		} finally {
			isUpdating = false;
		}
	}

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

	const renderedDescription = $derived(displayIssue?.description ? renderMarkdownSync(displayIssue.description) : '');

	async function updateIssue(updates: { status?: IssueStatus; priority?: Priority }) {
		if (!displayIssue) return;

		isUpdating = true;
		updateError = null;

		try {
			const response = await fetch(`/api/repos/${repoId}/issues/${displayIssue.id}`, {
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
	<Sheet.Content side="right" class="w-full sm:max-w-xl lg:max-w-2xl overflow-y-auto p-0">
		{#if displayIssue}
			<!-- Header with colored accent -->
			<div class="bg-muted/50 border-b px-6 py-5">
				<div class="flex items-start gap-4">
					{#if isEditing}
						<!-- Type dropdown when editing -->
						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								{#snippet child({ props })}
									<button class="p-2 rounded-lg bg-background shadow-sm border hover:bg-muted/50 transition-colors" {...props}>
										<TypeIcon type={editType} size={28} />
									</button>
								{/snippet}
							</DropdownMenu.Trigger>
							<DropdownMenu.Content class="w-40">
								{#each typeOptions as option (option.value)}
									<DropdownMenu.Item
										onclick={() => editType = option.value}
										class="cursor-pointer"
									>
										<TypeIcon type={option.value} size={16} />
										<span class="ml-2">{option.label}</span>
										{#if editType === option.value}
											<Icon icon="mdi:check" class="h-4 w-4 ml-auto" />
										{/if}
									</DropdownMenu.Item>
								{/each}
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					{:else}
						<div class="p-2 rounded-lg bg-background shadow-sm border">
							<TypeIcon type={displayIssue.type} size={28} />
						</div>
					{/if}
					<div class="flex-1 min-w-0">
						{#if isEditing}
							<Input
								bind:value={editTitle}
								class="text-xl font-semibold h-auto py-1 px-2"
								placeholder="Issue title"
							/>
						{:else}
							<Sheet.Title class="text-xl font-semibold leading-tight pr-8">
								{displayIssue.title}
							</Sheet.Title>
						{/if}
						<div class="flex items-center gap-2 mt-2">
							<Badge variant="outline" class="font-mono text-xs">
								{displayIssue.id}
							</Badge>
							<span class="text-xs text-muted-foreground capitalize">{isEditing ? editType : displayIssue.type}</span>
						</div>
					</div>
				</div>
			</div>

			<div class="px-6 py-5 space-y-6">
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
										<StatusBadge status={displayIssue.status} />
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
										{#if displayIssue.status === option.value}
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
										<PriorityBadge priority={formatPriority(displayIssue.priority)} />
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
										{#if displayIssue.priority === option.value}
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
				{#if displayIssue.labels.length > 0}
					<div class="space-y-2">
						<span class="text-sm font-medium text-muted-foreground">Labels</span>
						<div class="flex flex-wrap gap-2">
							{#each displayIssue.labels as label (label)}
								<Badge variant="secondary">{label}</Badge>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Description -->
				<div class="space-y-2">
					<span class="text-sm font-medium text-muted-foreground">Description</span>
					{#if isEditing}
						<Textarea
							bind:value={editDescription}
							class="min-h-[120px] resize-y"
							placeholder="Add a description... (Markdown supported)"
						/>
					{:else if renderedDescription}
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
				{#if displayIssue.blockedBy.length > 0 || displayIssue.blocks.length > 0}
					<Separator />

					<div class="space-y-4">
						{#if displayIssue.blockedBy.length > 0}
							<div class="space-y-2">
								<span class="text-sm font-medium text-muted-foreground flex items-center gap-2">
									<Icon icon="mdi:block-helper" class="h-4 w-4 text-red-500" />
									Blocked By
								</span>
								<div class="flex flex-wrap gap-2">
									{#each displayIssue.blockedBy as blockerId (blockerId)}
										<Badge variant="outline" class="border-red-200 text-red-700 dark:border-red-800 dark:text-red-300">
											{blockerId}
										</Badge>
									{/each}
								</div>
							</div>
						{/if}

						{#if displayIssue.blocks.length > 0}
							<div class="space-y-2">
								<span class="text-sm font-medium text-muted-foreground flex items-center gap-2">
									<Icon icon="mdi:arrow-right-bold" class="h-4 w-4 text-orange-500" />
									Blocks
								</span>
								<div class="flex flex-wrap gap-2">
									{#each displayIssue.blocks as blockedId (blockedId)}
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
						<span title={formatDate(displayIssue.created)}>{formatRelativeDate(displayIssue.created)}</span>
					</div>
					{#if displayIssue.updated}
						<div class="flex items-center justify-between text-sm">
							<span class="text-muted-foreground">Last Modified</span>
							<span title={formatDate(displayIssue.updated)}>{formatRelativeDate(displayIssue.updated)}</span>
						</div>
					{/if}
					{#if displayIssue.closed}
						<div class="flex items-center justify-between text-sm">
							<span class="text-muted-foreground">Closed</span>
							<span title={formatDate(displayIssue.closed)}>{formatRelativeDate(displayIssue.closed)}</span>
						</div>
					{/if}
					{#if displayIssue.parentId}
						<div class="flex items-center justify-between text-sm">
							<span class="text-muted-foreground">Parent Epic</span>
							<Badge variant="outline">{displayIssue.parentId}</Badge>
						</div>
					{/if}
				</div>
			</div>

			<!-- Footer -->
			<div class="border-t bg-muted/30 px-6 py-4 flex items-center justify-end gap-3">
				{#if isEditing}
					<Button variant="outline" onclick={cancelEditing} disabled={isUpdating}>
						Cancel
					</Button>
					<Button onclick={saveChanges} disabled={isUpdating}>
						{#if isUpdating}
							<Icon icon="mdi:loading" class="h-4 w-4 mr-2 animate-spin" />
							Saving...
						{:else}
							<Icon icon="mdi:content-save" class="h-4 w-4 mr-2" />
							Save Changes
						{/if}
					</Button>
				{:else}
					<Button variant="outline" onclick={() => handleOpenChange(false)}>
						Close
					</Button>
					<Button onclick={startEditing}>
						<Icon icon="mdi:pencil" class="h-4 w-4 mr-2" />
						Edit Issue
					</Button>
				{/if}
			</div>
		{:else}
			<div class="flex items-center justify-center h-64">
				<p class="text-muted-foreground">No issue selected</p>
			</div>
		{/if}
	</Sheet.Content>
</Sheet.Root>
