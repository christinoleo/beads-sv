<script lang="ts">
	import Icon from '@iconify/svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import type { ManagedRepo, ValidationResult } from '$lib/types/beads';

	interface Props {
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		onAdd?: (repo: ManagedRepo) => void;
	}

	let { open = $bindable(false), onOpenChange, onAdd }: Props = $props();

	let path = $state('');
	let isValidating = $state(false);
	let isAdding = $state(false);
	let validationResult = $state<ValidationResult | null>(null);
	let addError = $state<string | null>(null);

	function handleOpenChange(newOpen: boolean) {
		open = newOpen;
		onOpenChange?.(newOpen);
		if (!newOpen) {
			resetForm();
		}
	}

	function resetForm() {
		path = '';
		validationResult = null;
		addError = null;
		isValidating = false;
		isAdding = false;
	}

	async function validatePath() {
		if (!path.trim()) return;

		isValidating = true;
		validationResult = null;
		addError = null;

		try {
			const response = await fetch('/api/repos/validate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ path: path.trim() })
			});

			if (response.ok) {
				const data = await response.json();
				validationResult = data.data;
			} else {
				const error = await response.json();
				validationResult = {
					isValid: false,
					error: error.message || 'Validation failed'
				};
			}
		} catch (e) {
			validationResult = {
				isValid: false,
				error: 'Failed to connect to server'
			};
		} finally {
			isValidating = false;
		}
	}

	async function addRepo() {
		if (!path.trim() || !validationResult?.isValid) return;

		isAdding = true;
		addError = null;

		try {
			const response = await fetch('/api/repos', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ path: path.trim() })
			});

			if (response.ok) {
				const data = await response.json();
				onAdd?.(data.data);
				handleOpenChange(false);
			} else {
				const error = await response.json();
				addError = error.message || 'Failed to add repository';
			}
		} catch (e) {
			addError = 'Failed to connect to server';
		} finally {
			isAdding = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !isValidating && !isAdding) {
			if (validationResult?.isValid) {
				addRepo();
			} else {
				validatePath();
			}
		}
	}
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<Icon icon="mdi:folder-plus" class="w-5 h-5" />
				Add Repository
			</Dialog.Title>
			<Dialog.Description>
				Enter the path to a beads repository to add it to your workspace.
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4 py-4">
			<div class="space-y-2">
				<label for="repo-path" class="text-sm font-medium">Repository Path</label>
				<div class="flex gap-2">
					<Input
						id="repo-path"
						bind:value={path}
						placeholder="/path/to/your/repo"
						onkeydown={handleKeydown}
						disabled={isValidating || isAdding}
						class="flex-1"
					/>
					<Button
						variant="outline"
						onclick={validatePath}
						disabled={!path.trim() || isValidating || isAdding}
					>
						{#if isValidating}
							<Icon icon="mdi:loading" class="w-4 h-4 animate-spin" />
						{:else}
							<Icon icon="mdi:check-circle-outline" class="w-4 h-4" />
						{/if}
						Validate
					</Button>
				</div>
			</div>

			{#if validationResult}
				<div
					class="p-3 rounded-lg border {validationResult.isValid
						? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-900'
						: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-900'}"
				>
					<div class="flex items-start gap-2">
						{#if validationResult.isValid}
							<Icon
								icon="mdi:check-circle"
								class="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5"
							/>
							<div class="space-y-2">
								<p class="text-sm font-medium text-green-800 dark:text-green-200">
									Valid beads repository
								</p>
								{#if validationResult.config}
									<div class="flex gap-2">
										<Badge variant="secondary" class="text-xs">
											Prefix: {validationResult.config.prefix}
										</Badge>
										{#if validationResult.config.version}
											<Badge variant="outline" class="text-xs">
												v{validationResult.config.version}
											</Badge>
										{/if}
									</div>
								{/if}
								{#if validationResult.warnings?.length}
									<div class="mt-2 space-y-1">
										{#each validationResult.warnings as warning, i (i)}
											<p class="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1">
												<Icon icon="mdi:alert" class="w-3 h-3 shrink-0 mt-0.5" />
												{warning}
											</p>
										{/each}
									</div>
								{/if}
							</div>
						{:else}
							<Icon
								icon="mdi:close-circle"
								class="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5"
							/>
							<p class="text-sm text-red-800 dark:text-red-200">
								{validationResult.error}
							</p>
						{/if}
					</div>
				</div>
			{/if}

			{#if addError}
				<div class="p-3 rounded-lg bg-red-50 border border-red-200 dark:bg-red-950 dark:border-red-900">
					<p class="text-sm text-red-800 dark:text-red-200 flex items-center gap-2">
						<Icon icon="mdi:alert-circle" class="w-4 h-4 shrink-0" />
						{addError}
					</p>
				</div>
			{/if}
		</div>

		<Dialog.Footer>
			<Button variant="outline" onclick={() => handleOpenChange(false)}>Cancel</Button>
			<Button
				onclick={addRepo}
				disabled={!validationResult?.isValid || isAdding}
			>
				{#if isAdding}
					<Icon icon="mdi:loading" class="w-4 h-4 animate-spin" />
					Adding...
				{:else}
					<Icon icon="mdi:plus" class="w-4 h-4" />
					Add Repository
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
