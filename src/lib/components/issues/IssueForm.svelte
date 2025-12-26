<script lang="ts">
	import Icon from '@iconify/svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import StatusBadge from '$lib/components/shared/StatusBadge.svelte';
	import PriorityBadge from '$lib/components/shared/PriorityBadge.svelte';
	import TypeIcon from '$lib/components/shared/TypeIcon.svelte';
	import type { Issue, IssueType, IssueStatus, Priority, CreateIssueDto, UpdateIssueDto } from '$lib/types/beads';

	interface Props {
		issue?: Issue | null;
		open?: boolean;
		repoId: string;
		onOpenChange?: (open: boolean) => void;
		onSuccess?: (issue: Issue) => void;
	}

	let { issue = null, open = $bindable(false), repoId, onOpenChange, onSuccess }: Props = $props();

	const isEditing = $derived(!!issue);

	// Form state
	let title = $state('');
	let type = $state<IssueType>('task');
	let status = $state<IssueStatus>('open');
	let priority = $state<Priority>(2);
	let description = $state('');
	let labelsInput = $state('');
	let labels = $state<string[]>([]);

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
		submitError = null;
		validationErrors = {};
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
					labels
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
					labels
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
	<Dialog.Content class="sm:max-w-lg max-h-[90vh] overflow-y-auto">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<Icon icon={isEditing ? 'mdi:pencil' : 'mdi:plus-circle'} class="h-5 w-5" />
				{isEditing ? 'Edit Issue' : 'New Issue'}
			</Dialog.Title>
			<Dialog.Description>
				{isEditing ? 'Update the issue details below.' : 'Fill in the details to create a new issue.'}
			</Dialog.Description>
		</Dialog.Header>

		<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-6 py-4">
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
								<DropdownMenu.Item
									onclick={() => type = option.value}
									class="cursor-pointer"
								>
									<span class="flex items-center gap-2">
										<TypeIcon type={option.value} size={16} />
										<span>{option.label}</span>
									</span>
									{#if type === option.value}
										<Icon icon="mdi:check" class="h-4 w-4 ml-auto" />
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
								<DropdownMenu.Item
									onclick={() => priority = option.value}
									class="cursor-pointer"
								>
									<PriorityBadge priority={formatPriority(option.value)} />
									{#if priority === option.value}
										<Icon icon="mdi:check" class="h-4 w-4 ml-auto" />
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
								<DropdownMenu.Item
									onclick={() => status = option.value}
									class="cursor-pointer"
								>
									<StatusBadge status={option.value} />
									{#if status === option.value}
										<Icon icon="mdi:check" class="h-4 w-4 ml-auto" />
									{/if}
								</DropdownMenu.Item>
							{/each}
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</div>
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
					class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
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
									class="hover:text-destructive ml-1 rounded-full"
								>
									<Icon icon="mdi:close" class="h-3 w-3" />
								</button>
							</Badge>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Error -->
			{#if submitError}
				<div class="bg-destructive/10 text-destructive rounded-md border border-destructive/20 p-3 flex items-center gap-2">
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
					<Icon icon="mdi:loading" class="h-4 w-4 animate-spin mr-2" />
					{isEditing ? 'Updating...' : 'Creating...'}
				{:else}
					<Icon icon={isEditing ? 'mdi:content-save' : 'mdi:plus'} class="h-4 w-4 mr-2" />
					{isEditing ? 'Save Changes' : 'Create Issue'}
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
