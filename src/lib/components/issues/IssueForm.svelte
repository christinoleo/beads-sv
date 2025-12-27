<script lang="ts">
	import Icon from '@iconify/svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import StatusBadge from '$lib/components/shared/StatusBadge.svelte';
	import PriorityBadge from '$lib/components/shared/PriorityBadge.svelte';
	import TypeIcon from '$lib/components/shared/TypeIcon.svelte';
	import type {
		Issue,
		IssueType,
		IssueStatus,
		Priority,
		CreateIssueDto,
		UpdateIssueDto
	} from '$lib/types/beads';

	interface Props {
		issue?: Issue | null;
		open?: boolean;
		repoId: string;
		allIssues?: Issue[];
		onOpenChange?: (open: boolean) => void;
		onSuccess?: (issue: Issue) => void;
	}

	let { issue = null, open = $bindable(false), repoId, allIssues = [], onOpenChange, onSuccess }: Props = $props();

	const isEditing = $derived(!!issue);

	// Filter out current issue from available issues for dependencies
	const availableIssues = $derived(
		allIssues.filter((i) => i.id !== issue?.id)
	);

	// Form state
	let title = $state('');
	let type = $state<IssueType>('task');
	let status = $state<IssueStatus>('open');
	let priority = $state<Priority>(2);
	let description = $state('');
	let labelsInput = $state('');
	let labels = $state<string[]>([]);
	let closeReason = $state('');
	let blockedBy = $state<string[]>([]);
	let blocks = $state<string[]>([]);
	let blockedBySearch = $state('');
	let blocksSearch = $state('');
	let blockedByOpen = $state(false);
	let blocksOpen = $state(false);

	// Filtered issues for search
	const filteredBlockedByIssues = $derived(
		availableIssues.filter(
			(i) =>
				!blockedBy.includes(i.id) &&
				(i.id.toLowerCase().includes(blockedBySearch.toLowerCase()) ||
					i.title.toLowerCase().includes(blockedBySearch.toLowerCase()))
		)
	);

	const filteredBlocksIssues = $derived(
		availableIssues.filter(
			(i) =>
				!blocks.includes(i.id) &&
				(i.id.toLowerCase().includes(blocksSearch.toLowerCase()) ||
					i.title.toLowerCase().includes(blocksSearch.toLowerCase()))
		)
	);

	let isSubmitting = $state(false);
	let submitError = $state<string | null>(null);
	let validationErrors = $state<Record<string, string>>({});

	const typeOptions: { value: IssueType; label: string }[] = [
		{ value: 'task', label: 'Task' },
		{ value: 'bug', label: 'Bug' },
		{ value: 'feature', label: 'Feature' },
		{ value: 'epic', label: 'Epic' },
		{ value: 'chore', label: 'Chore' }
	];

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

	function formatPriority(p: Priority): `P${Priority}` {
		return `P${p}` as `P${Priority}`;
	}

	// Reset form when issue changes or dialog opens
	$effect(() => {
		if (open) {
			if (issue) {
				title = issue.title;
				type = issue.type;
				status = issue.status;
				priority = issue.priority;
				description = issue.description;
				labels = [...issue.labels];
				labelsInput = '';
				closeReason = issue.closeReason || '';
				blockedBy = [...(issue.blockedBy || [])];
				blocks = [...(issue.blocks || [])];
			} else {
				resetForm();
			}
		}
	});

	function resetForm() {
		title = '';
		type = 'task';
		status = 'open';
		priority = 2;
		description = '';
		labels = [];
		labelsInput = '';
		closeReason = '';
		blockedBy = [];
		blocks = [];
		blockedBySearch = '';
		blocksSearch = '';
		submitError = null;
		validationErrors = {};
	}

	function addBlockedBy(issueId: string) {
		if (!blockedBy.includes(issueId)) {
			blockedBy = [...blockedBy, issueId];
		}
		blockedBySearch = '';
		blockedByOpen = false;
	}

	function removeBlockedBy(issueId: string) {
		blockedBy = blockedBy.filter((id) => id !== issueId);
	}

	function addBlocks(issueId: string) {
		if (!blocks.includes(issueId)) {
			blocks = [...blocks, issueId];
		}
		blocksSearch = '';
		blocksOpen = false;
	}

	function removeBlocks(issueId: string) {
		blocks = blocks.filter((id) => id !== issueId);
	}

	function getIssueById(id: string): Issue | undefined {
		return allIssues.find((i) => i.id === id);
	}

	function handleOpenChange(newOpen: boolean) {
		open = newOpen;
		onOpenChange?.(newOpen);
		if (!newOpen) {
			resetForm();
		}
	}

	function validate(): boolean {
		const errors: Record<string, string> = {};

		if (!title.trim()) {
			errors.title = 'Title is required';
		} else if (title.trim().length < 3) {
			errors.title = 'Title must be at least 3 characters';
		}

		validationErrors = errors;
		return Object.keys(errors).length === 0;
	}

	function addLabel() {
		const label = labelsInput.trim();
		if (label && !labels.includes(label)) {
			labels = [...labels, label];
			labelsInput = '';
		}
	}

	function removeLabel(labelToRemove: string) {
		labels = labels.filter((l) => l !== labelToRemove);
	}

	function handleLabelKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			addLabel();
		}
	}

	async function handleSubmit() {
		if (!validate()) return;

		isSubmitting = true;
		submitError = null;

		try {
			if (isEditing && issue) {
				// Update existing issue
				const updateData: UpdateIssueDto = {
					title: title.trim(),
					type,
					status,
					priority,
					description: description.trim(),
					labels,
					closeReason: status === 'closed' ? closeReason.trim() || undefined : undefined,
					blockedBy,
					blocks
				};

				const response = await fetch(`/api/repos/${repoId}/issues/${issue.id}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(updateData)
				});

				if (!response.ok) {
					const error = await response.json();
					throw new Error(error.message || 'Failed to update issue');
				}

				const result = await response.json();
				onSuccess?.(result.data);
				handleOpenChange(false);
			} else {
				// Create new issue
				const createData: CreateIssueDto = {
					title: title.trim(),
					type,
					priority,
					description: description.trim(),
					labels,
					blockedBy,
					blocks
				};

				const response = await fetch(`/api/repos/${repoId}/issues`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(createData)
				});

				if (!response.ok) {
					const error = await response.json();
					throw new Error(error.message || 'Failed to create issue');
				}

				const result = await response.json();
				onSuccess?.(result.data);
				handleOpenChange(false);
			}
		} catch (e) {
			submitError = e instanceof Error ? e.message : 'An error occurred';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
	<Dialog.Content class="max-h-[90vh] overflow-y-auto sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<Icon icon={isEditing ? 'mdi:pencil' : 'mdi:plus-circle'} class="h-5 w-5" />
				{isEditing ? 'Edit Issue' : 'New Issue'}
			</Dialog.Title>
			<Dialog.Description>
				{isEditing
					? 'Update the issue details below.'
					: 'Fill in the details to create a new issue.'}
			</Dialog.Description>
		</Dialog.Header>

		<form
			onsubmit={(e) => {
				e.preventDefault();
				handleSubmit();
			}}
			class="space-y-6 py-4"
		>
			<!-- Title -->
			<div class="space-y-2">
				<label for="issue-title" class="text-sm font-medium">
					Title <span class="text-destructive">*</span>
				</label>
				<Input
					id="issue-title"
					bind:value={title}
					placeholder="Enter issue title"
					disabled={isSubmitting}
					class={validationErrors.title ? 'border-destructive' : ''}
				/>
				{#if validationErrors.title}
					<p class="text-sm text-destructive">{validationErrors.title}</p>
				{/if}
			</div>

			<!-- Type & Priority -->
			<div class="grid grid-cols-2 gap-4">
				<!-- Type -->
				<div class="space-y-2">
					<span class="text-sm font-medium">Type</span>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button
									variant="outline"
									class="w-full justify-between"
									disabled={isSubmitting}
									{...props}
								>
									<span class="flex items-center gap-2">
										<TypeIcon {type} size={16} />
										<span class="capitalize">{type}</span>
									</span>
									<Icon icon="mdi:chevron-down" class="h-4 w-4 opacity-50" />
								</Button>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content class="w-48">
							{#each typeOptions as option (option.value)}
								<DropdownMenu.Item onclick={() => (type = option.value)} class="cursor-pointer">
									<span class="flex items-center gap-2">
										<TypeIcon type={option.value} size={16} />
										<span>{option.label}</span>
									</span>
									{#if type === option.value}
										<Icon icon="mdi:check" class="ml-auto h-4 w-4" />
									{/if}
								</DropdownMenu.Item>
							{/each}
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</div>

				<!-- Priority -->
				<div class="space-y-2">
					<span class="text-sm font-medium">Priority</span>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button
									variant="outline"
									class="w-full justify-between"
									disabled={isSubmitting}
									{...props}
								>
									<PriorityBadge priority={formatPriority(priority)} />
									<Icon icon="mdi:chevron-down" class="h-4 w-4 opacity-50" />
								</Button>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content class="w-48">
							{#each priorityOptions as option (option.value)}
								<DropdownMenu.Item onclick={() => (priority = option.value)} class="cursor-pointer">
									<PriorityBadge priority={formatPriority(option.value)} />
									{#if priority === option.value}
										<Icon icon="mdi:check" class="ml-auto h-4 w-4" />
									{/if}
								</DropdownMenu.Item>
							{/each}
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</div>
			</div>

			<!-- Status (only when editing) -->
			{#if isEditing}
				<div class="space-y-2">
					<span class="text-sm font-medium">Status</span>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button
									variant="outline"
									class="w-full justify-between"
									disabled={isSubmitting}
									{...props}
								>
									<StatusBadge {status} />
									<Icon icon="mdi:chevron-down" class="h-4 w-4 opacity-50" />
								</Button>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content class="w-48">
							{#each statusOptions as option (option.value)}
								<DropdownMenu.Item onclick={() => (status = option.value)} class="cursor-pointer">
									<StatusBadge status={option.value} />
									{#if status === option.value}
										<Icon icon="mdi:check" class="ml-auto h-4 w-4" />
									{/if}
								</DropdownMenu.Item>
							{/each}
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</div>

				<!-- Close Reason (only when status is closed) -->
				{#if status === 'closed'}
					<div class="space-y-2">
						<label for="issue-close-reason" class="text-sm font-medium">
							Close Reason <span class="text-muted-foreground">(optional)</span>
						</label>
						<Textarea
							id="issue-close-reason"
							bind:value={closeReason}
							placeholder="Describe why this issue was closed..."
							rows={2}
							disabled={isSubmitting}
							class="min-h-[60px] resize-y"
						/>
					</div>
				{/if}
			{/if}

			<Separator />

			<!-- Description -->
			<div class="space-y-2">
				<label for="issue-description" class="text-sm font-medium">Description</label>
				<textarea
					id="issue-description"
					bind:value={description}
					placeholder="Describe the issue (supports Markdown)"
					rows={4}
					disabled={isSubmitting}
					class="flex min-h-[80px] w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
				></textarea>
				<p class="text-xs text-muted-foreground">Markdown formatting is supported</p>
			</div>

			<!-- Labels -->
			<div class="space-y-2">
				<label for="issue-labels" class="text-sm font-medium">Labels</label>
				<div class="flex gap-2">
					<Input
						id="issue-labels"
						bind:value={labelsInput}
						placeholder="Add a label"
						disabled={isSubmitting}
						onkeydown={handleLabelKeydown}
						class="flex-1"
					/>
					<Button
						type="button"
						variant="outline"
						onclick={addLabel}
						disabled={isSubmitting || !labelsInput.trim()}
					>
						<Icon icon="mdi:plus" class="h-4 w-4" />
					</Button>
				</div>
				{#if labels.length > 0}
					<div class="flex flex-wrap gap-2 pt-2">
						{#each labels as label (label)}
							<Badge variant="secondary" class="gap-1">
								{label}
								<button
									type="button"
									onclick={() => removeLabel(label)}
									disabled={isSubmitting}
									class="ml-1 rounded-full hover:text-destructive"
								>
									<Icon icon="mdi:close" class="h-3 w-3" />
								</button>
							</Badge>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Dependencies -->
			{#if availableIssues.length > 0}
				<Separator />

				<div class="space-y-4">
					<h3 class="text-sm font-medium">Dependencies</h3>

					<!-- Blocked By -->
					<div class="space-y-2">
						<label class="text-sm text-muted-foreground">Blocked by (must be done first)</label>
						<Collapsible.Root bind:open={blockedByOpen}>
							<Collapsible.Trigger
								class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground ring-offset-background hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
								disabled={isSubmitting}
							>
								<span class="flex items-center">
									<Icon icon="mdi:plus" class="mr-2 h-4 w-4" />
									Add blocker...
								</span>
								<Icon icon={blockedByOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'} class="h-4 w-4" />
							</Collapsible.Trigger>
							<Collapsible.Content class="mt-2 space-y-2">
								<Input
									placeholder="Search issues..."
									bind:value={blockedBySearch}
									disabled={isSubmitting}
								/>
								<div class="max-h-32 overflow-y-auto rounded-md border">
									{#if filteredBlockedByIssues.length === 0}
										<p class="p-2 text-center text-sm text-muted-foreground">No issues found</p>
									{:else}
										{#each filteredBlockedByIssues.slice(0, 8) as i (i.id)}
											<button
												type="button"
												class="flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm hover:bg-accent"
												onclick={() => addBlockedBy(i.id)}
											>
												<TypeIcon type={i.type} size={14} />
												<span class="font-mono text-xs text-muted-foreground">{i.id}</span>
												<span class="truncate">{i.title}</span>
											</button>
										{/each}
									{/if}
								</div>
							</Collapsible.Content>
						</Collapsible.Root>
						{#if blockedBy.length > 0}
							<div class="flex flex-wrap gap-2">
								{#each blockedBy as id (id)}
									{@const linkedIssue = getIssueById(id)}
									<Badge variant="outline" class="gap-1 border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950">
										<Icon icon="mdi:block-helper" class="h-3 w-3 text-red-500" />
										<span class="font-mono text-xs">{id}</span>
										{#if linkedIssue}
											<span class="max-w-24 truncate text-xs">{linkedIssue.title}</span>
										{/if}
										<button
											type="button"
											onclick={() => removeBlockedBy(id)}
											disabled={isSubmitting}
											class="ml-1 rounded-full hover:text-destructive"
											aria-label="Remove {id} from blockers"
										>
											<Icon icon="mdi:close" class="h-3 w-3" />
										</button>
									</Badge>
								{/each}
							</div>
						{/if}
					</div>

					<!-- Blocks -->
					<div class="space-y-2">
						<label class="text-sm text-muted-foreground">Blocks (depends on this)</label>
						<Collapsible.Root bind:open={blocksOpen}>
							<Collapsible.Trigger
								class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground ring-offset-background hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
								disabled={isSubmitting}
							>
								<span class="flex items-center">
									<Icon icon="mdi:plus" class="mr-2 h-4 w-4" />
									Add dependent...
								</span>
								<Icon icon={blocksOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'} class="h-4 w-4" />
							</Collapsible.Trigger>
							<Collapsible.Content class="mt-2 space-y-2">
								<Input
									placeholder="Search issues..."
									bind:value={blocksSearch}
									disabled={isSubmitting}
								/>
								<div class="max-h-32 overflow-y-auto rounded-md border">
									{#if filteredBlocksIssues.length === 0}
										<p class="p-2 text-center text-sm text-muted-foreground">No issues found</p>
									{:else}
										{#each filteredBlocksIssues.slice(0, 8) as i (i.id)}
											<button
												type="button"
												class="flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm hover:bg-accent"
												onclick={() => addBlocks(i.id)}
											>
												<TypeIcon type={i.type} size={14} />
												<span class="font-mono text-xs text-muted-foreground">{i.id}</span>
												<span class="truncate">{i.title}</span>
											</button>
										{/each}
									{/if}
								</div>
							</Collapsible.Content>
						</Collapsible.Root>
						{#if blocks.length > 0}
							<div class="flex flex-wrap gap-2">
								{#each blocks as id (id)}
									{@const linkedIssue = getIssueById(id)}
									<Badge variant="outline" class="gap-1 border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
										<Icon icon="mdi:arrow-right-bold" class="h-3 w-3 text-amber-500" />
										<span class="font-mono text-xs">{id}</span>
										{#if linkedIssue}
											<span class="max-w-24 truncate text-xs">{linkedIssue.title}</span>
										{/if}
										<button
											type="button"
											onclick={() => removeBlocks(id)}
											disabled={isSubmitting}
											class="ml-1 rounded-full hover:text-destructive"
											aria-label="Remove {id} from dependents"
										>
											<Icon icon="mdi:close" class="h-3 w-3" />
										</button>
									</Badge>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Error -->
			{#if submitError}
				<div
					class="flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-destructive"
				>
					<Icon icon="mdi:alert-circle" class="h-4 w-4 shrink-0" />
					<p class="text-sm">{submitError}</p>
				</div>
			{/if}
		</form>

		<Dialog.Footer>
			<Button variant="outline" onclick={() => handleOpenChange(false)} disabled={isSubmitting}>
				Cancel
			</Button>
			<Button onclick={handleSubmit} disabled={isSubmitting}>
				{#if isSubmitting}
					<Icon icon="mdi:loading" class="mr-2 h-4 w-4 animate-spin" />
					{isEditing ? 'Updating...' : 'Creating...'}
				{:else}
					<Icon icon={isEditing ? 'mdi:content-save' : 'mdi:plus'} class="mr-2 h-4 w-4" />
					{isEditing ? 'Save Changes' : 'Create Issue'}
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
