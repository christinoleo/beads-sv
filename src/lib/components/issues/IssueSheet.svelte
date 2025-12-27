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
	import CloseIssueDialog from '$lib/components/issues/CloseIssueDialog.svelte';
	import type { Issue, IssueStatus, IssueType, Priority } from '$lib/types/beads';

	interface Props {
		issue: Issue | null;
		open?: boolean;
		repoId: string;
		onOpenChange?: (open: boolean) => void;
		onIssueUpdate?: (issue: Issue) => void;
		onIssueNavigate?: (issueId: string) => void;
	}

	let { issue, open = $bindable(false), repoId, onOpenChange, onIssueUpdate, onIssueNavigate }: Props = $props();

	let isUpdating = $state(false);
	let updateError = $state<string | null>(null);
	let saveStatus = $state<'idle' | 'saving' | 'saved'>('idle');
	let closeDialogOpen = $state(false);

	// Local editable values
	let editTitle = $state('');
	let editDescription = $state('');
	let editType = $state<IssueType>('task');

	// Keep a local copy of the issue to show during close animation
	let displayIssue = $state<Issue | null>(null);

	// Update displayIssue and local values when issue changes
	$effect(() => {
		if (issue) {
			displayIssue = issue;
			editTitle = issue.title;
			editDescription = issue.description || '';
			editType = issue.type;
		}
	});

	// Clear displayIssue after sheet closes (after animation completes)
	$effect(() => {
		if (!open && displayIssue) {
			const timeout = setTimeout(() => {
				displayIssue = null;
				saveStatus = 'idle';
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

	// Debounced auto-save for text fields
	let saveTimeout: ReturnType<typeof setTimeout> | null = null;

	function scheduleAutoSave() {
		if (saveTimeout) clearTimeout(saveTimeout);
		saveTimeout = setTimeout(() => {
			saveTextChanges();
		}, 800);
	}

	async function saveTextChanges() {
		if (!displayIssue) return;

		const updates: Partial<Issue> = {};
		if (editTitle.trim() && editTitle !== displayIssue.title) updates.title = editTitle.trim();
		if (editDescription !== displayIssue.description) updates.description = editDescription;

		if (Object.keys(updates).length === 0) return;

		await saveUpdates(updates);
	}

	async function saveUpdates(updates: Partial<Issue>) {
		if (!displayIssue) return;

		isUpdating = true;
		saveStatus = 'saving';
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
			saveStatus = 'saved';
			setTimeout(() => {
				if (saveStatus === 'saved') saveStatus = 'idle';
			}, 2000);
		} catch (e) {
			updateError = e instanceof Error ? e.message : 'An error occurred';
			saveStatus = 'idle';
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

	function handleStatusChange(status: IssueStatus) {
		if (status === 'closed' && displayIssue?.status !== 'closed') {
			// Show close dialog instead of immediately closing
			closeDialogOpen = true;
		} else {
			saveUpdates({ status });
		}
	}

	async function handleCloseConfirm(closeReason: string) {
		await saveUpdates({ status: 'closed', closeReason: closeReason || undefined });
		// Only close dialog if save succeeded (no error)
		if (!updateError) {
			closeDialogOpen = false;
		}
	}

	function handlePriorityChange(priority: Priority) {
		saveUpdates({ priority });
	}

	function handleTypeChange(type: IssueType) {
		editType = type;
		saveUpdates({ type });
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
	<Sheet.Content
		side="right"
		class="flex w-full flex-col overflow-y-auto p-0 sm:max-w-xl lg:max-w-2xl"
	>
		{#if displayIssue}
			<!-- Header -->
			<div class="shrink-0 border-b px-6 py-4">
				<div class="flex items-start gap-3">
					<!-- Type dropdown -->
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<button
									class="rounded-lg bg-muted/50 p-2 transition-colors hover:bg-muted"
									{...props}
								>
									<TypeIcon type={editType} size={24} />
								</button>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content class="w-40">
							{#each typeOptions as option (option.value)}
								<DropdownMenu.Item
									onclick={() => handleTypeChange(option.value)}
									class="cursor-pointer"
								>
									<TypeIcon type={option.value} size={16} />
									<span class="ml-2">{option.label}</span>
									{#if editType === option.value}
										<Icon icon="mdi:check" class="ml-auto h-4 w-4" />
									{/if}
								</DropdownMenu.Item>
							{/each}
						</DropdownMenu.Content>
					</DropdownMenu.Root>

					<div class="min-w-0 flex-1 space-y-2">
						<!-- Editable Title -->
						<Input
							bind:value={editTitle}
							oninput={scheduleAutoSave}
							class="h-auto border-transparent bg-transparent px-2 py-1.5 text-lg font-semibold hover:border-input focus:border-input"
							placeholder="Issue title"
						/>
						<div class="flex items-center gap-2 px-2">
							<Badge variant="outline" class="font-mono text-xs">
								{displayIssue.id}
							</Badge>
							<!-- Save status indicator -->
							{#if saveStatus === 'saving'}
								<span class="flex items-center gap-1 text-xs text-muted-foreground">
									<Icon icon="mdi:loading" class="h-3 w-3 animate-spin" />
									Saving...
								</span>
							{:else if saveStatus === 'saved'}
								<span class="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
									<Icon icon="mdi:check" class="h-3 w-3" />
									Saved
								</span>
							{/if}
						</div>
					</div>
				</div>
			</div>

			<!-- Scrollable Content -->
			<div class="flex-1 space-y-5 overflow-y-auto px-6 py-4">
				<!-- Error Banner -->
				{#if updateError}
					<div
						class="flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-destructive"
					>
						<Icon icon="mdi:alert-circle" class="h-4 w-4 shrink-0" />
						<p class="text-sm">{updateError}</p>
						<Button
							variant="ghost"
							size="sm"
							class="ml-auto h-6 px-2"
							onclick={() => (updateError = null)}
						>
							<Icon icon="mdi:close" class="h-4 w-4" />
						</Button>
					</div>
				{/if}

				<!-- Status & Priority Row -->
				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
					<!-- Status Dropdown -->
					<div class="space-y-1.5">
						<span class="text-xs font-medium tracking-wide text-muted-foreground uppercase"
							>Status</span
						>
						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								{#snippet child({ props })}
									<Button
										variant="outline"
										class="h-9 w-full justify-between"
										disabled={isUpdating}
										{...props}
									>
										<StatusBadge status={displayIssue?.status ?? 'open'} />
										<Icon icon="mdi:chevron-down" class="ml-2 h-4 w-4 opacity-50" />
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
											<Icon icon="mdi:check" class="ml-auto h-4 w-4" />
										{/if}
									</DropdownMenu.Item>
								{/each}
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					</div>

					<!-- Priority Dropdown -->
					<div class="space-y-1.5">
						<span class="text-xs font-medium tracking-wide text-muted-foreground uppercase"
							>Priority</span
						>
						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								{#snippet child({ props })}
									<Button
										variant="outline"
										class="h-9 w-full justify-between"
										disabled={isUpdating}
										{...props}
									>
										<PriorityBadge priority={formatPriority(displayIssue?.priority ?? 2)} />
										<Icon icon="mdi:chevron-down" class="ml-2 h-4 w-4 opacity-50" />
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
											<Icon icon="mdi:check" class="ml-auto h-4 w-4" />
										{/if}
									</DropdownMenu.Item>
								{/each}
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					</div>
				</div>

				<!-- Labels -->
				{#if displayIssue.labels.length > 0}
					<div class="space-y-1.5">
						<span class="text-xs font-medium tracking-wide text-muted-foreground uppercase"
							>Labels</span
						>
						<div class="flex flex-wrap gap-1.5">
							{#each displayIssue.labels as label (label)}
								<Badge variant="secondary" class="text-xs">{label}</Badge>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Description - Always Editable -->
				<div class="space-y-1.5">
					<span class="text-xs font-medium tracking-wide text-muted-foreground uppercase"
						>Description</span
					>
					<Textarea
						bind:value={editDescription}
						oninput={scheduleAutoSave}
						class="min-h-[140px] resize-y border-transparent bg-muted/30 hover:border-input focus:border-input"
						placeholder="Add a description..."
					/>
				</div>

				<!-- Relationships -->
				{#if displayIssue.blockedBy.length > 0 || displayIssue.blocks.length > 0}
					<Separator />

					<div class="space-y-3">
						{#if displayIssue.blockedBy.length > 0}
							<div class="space-y-1.5">
								<span
									class="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase"
								>
									<Icon icon="mdi:block-helper" class="h-3.5 w-3.5 text-red-500" />
									Blocked By
								</span>
								<div class="flex flex-wrap gap-1.5">
									{#each displayIssue.blockedBy as blockerId (blockerId)}
										<button
											type="button"
											onclick={() => onIssueNavigate?.(blockerId)}
											class="inline-flex"
										>
											<Badge
												variant="outline"
												class="cursor-pointer border-red-200 text-xs text-red-700 transition-colors hover:bg-red-100 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900"
											>
												<Icon icon="mdi:open-in-new" class="mr-1 h-3 w-3" />
												{blockerId}
											</Badge>
										</button>
									{/each}
								</div>
							</div>
						{/if}

						{#if displayIssue.blocks.length > 0}
							<div class="space-y-1.5">
								<span
									class="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase"
								>
									<Icon icon="mdi:arrow-right-bold" class="h-3.5 w-3.5 text-orange-500" />
									Blocks
								</span>
								<div class="flex flex-wrap gap-1.5">
									{#each displayIssue.blocks as blockedId (blockedId)}
										<button
											type="button"
											onclick={() => onIssueNavigate?.(blockedId)}
											class="inline-flex"
										>
											<Badge
												variant="outline"
												class="cursor-pointer border-orange-200 text-xs text-orange-700 transition-colors hover:bg-orange-100 dark:border-orange-800 dark:text-orange-300 dark:hover:bg-orange-900"
											>
												<Icon icon="mdi:open-in-new" class="mr-1 h-3 w-3" />
												{blockedId}
											</Badge>
										</button>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				{/if}

				<Separator />

				<!-- Metadata -->
				<div class="space-y-2 text-sm">
					<div class="flex items-center justify-between">
						<span class="text-muted-foreground">Created</span>
						<span class="text-foreground" title={formatDate(displayIssue.created)}
							>{formatRelativeDate(displayIssue.created)}</span
						>
					</div>
					{#if displayIssue.updated}
						<div class="flex items-center justify-between">
							<span class="text-muted-foreground">Updated</span>
							<span class="text-foreground" title={formatDate(displayIssue.updated)}
								>{formatRelativeDate(displayIssue.updated)}</span
							>
						</div>
					{/if}
					{#if displayIssue.closed}
						<div class="flex items-center justify-between">
							<span class="text-muted-foreground">Closed</span>
							<span class="text-foreground" title={formatDate(displayIssue.closed)}
								>{formatRelativeDate(displayIssue.closed)}</span
							>
						</div>
						{#if displayIssue.closeReason}
							<div class="space-y-1">
								<span class="text-muted-foreground">Close Reason</span>
								<p class="text-sm text-foreground">{displayIssue.closeReason}</p>
							</div>
						{/if}
					{/if}
					{#if displayIssue.parentId}
						<div class="flex items-center justify-between">
							<span class="text-muted-foreground">Parent Epic</span>
							<Badge variant="outline" class="text-xs">{displayIssue.parentId}</Badge>
						</div>
					{/if}
				</div>
			</div>
		{:else}
			<div class="flex h-64 items-center justify-center">
				<p class="text-muted-foreground">No issue selected</p>
			</div>
		{/if}
	</Sheet.Content>
</Sheet.Root>

<CloseIssueDialog
	bind:open={closeDialogOpen}
	issueId={displayIssue?.id}
	issueTitle={displayIssue?.title}
	onConfirm={handleCloseConfirm}
/>
