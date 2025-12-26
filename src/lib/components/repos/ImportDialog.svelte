<script lang="ts">
	import Icon from '@iconify/svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import type { ImportResult, ManagedRepo } from '$lib/types/beads';

	interface Props {
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		onImport?: (repos: ManagedRepo[]) => void;
	}

	let { open = $bindable(false), onOpenChange, onImport }: Props = $props();

	let folderPath = $state('');
	let previousFolderPath = $state('');
	let recursive = $state(true);
	let isScanning = $state(false);
	let isImporting = $state(false);
	let scanResult = $state<ImportResult | null>(null);
	let scanError = $state<string | null>(null);

	function handleOpenChange(newOpen: boolean) {
		open = newOpen;
		onOpenChange?.(newOpen);
		if (!newOpen) {
			resetForm();
		}
	}

	function resetForm() {
		folderPath = '';
		previousFolderPath = '';
		recursive = true;
		scanResult = null;
		scanError = null;
		isScanning = false;
		isImporting = false;
	}

	async function scanFolder() {
		if (!folderPath.trim()) return;

		isScanning = true;
		scanResult = null;
		scanError = null;
		previousFolderPath = folderPath;

		try {
			const response = await fetch('/api/repos/scan', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					folderPath: folderPath.trim(),
					recursive
				})
			});

			if (response.ok) {
				const data = await response.json();
				scanResult = data.data;
			} else {
				const error = await response.json();
				scanError = error.message || 'Scan failed';
			}
		} catch (e) {
			scanError = 'Failed to connect to server';
		} finally {
			isScanning = false;
		}
	}

	async function importRepos() {
		if (!folderPath.trim()) return;

		isImporting = true;
		scanError = null;

		try {
			const response = await fetch('/api/repos/import', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					folderPath: folderPath.trim(),
					recursive
				})
			});

			if (response.ok) {
				const data = await response.json();
				const result: ImportResult = data.data;
				onImport?.(result.imported);
				handleOpenChange(false);
			} else {
				const error = await response.json();
				scanError = error.message || 'Import failed';
			}
		} catch (e) {
			scanError = 'Failed to connect to server';
		} finally {
			isImporting = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !isScanning && !isImporting) {
			scanFolder();
		}
	}

	function toggleRecursive() {
		recursive = !recursive;
		scanResult = null;
	}

	// Clear scan result when folder path changes (but not during initial mount)
	let shouldClearOnPathChange = $derived(folderPath !== previousFolderPath && previousFolderPath !== '');

	$effect(() => {
		if (shouldClearOnPathChange && scanResult) {
			scanResult = null;
		}
	});
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
	<Dialog.Content class="sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<Icon icon="mdi:folder-search" class="w-5 h-5" />
				Import Repositories
			</Dialog.Title>
			<Dialog.Description>
				Scan a folder to find and import multiple beads repositories at once.
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4 py-4">
			<div class="space-y-2">
				<label for="folder-path" class="text-sm font-medium">Folder Path</label>
				<div class="flex gap-2">
					<Input
						id="folder-path"
						bind:value={folderPath}
						placeholder="/path/to/projects"
						onkeydown={handleKeydown}
						disabled={isScanning || isImporting}
						class="flex-1"
					/>
					<Button
						variant="outline"
						onclick={scanFolder}
						disabled={!folderPath.trim() || isScanning || isImporting}
					>
						{#if isScanning}
							<Icon icon="mdi:loading" class="w-4 h-4 animate-spin" />
						{:else}
							<Icon icon="mdi:magnify" class="w-4 h-4" />
						{/if}
						Scan
					</Button>
				</div>
			</div>

			<div class="flex items-center gap-2">
				<button
					type="button"
					id="recursive-checkbox"
					role="checkbox"
					aria-checked={recursive}
					onclick={toggleRecursive}
					disabled={isScanning || isImporting}
					class="w-4 h-4 border rounded flex items-center justify-center transition-colors
						{recursive
						? 'bg-primary border-primary text-primary-foreground'
						: 'border-input bg-background'}
						disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{#if recursive}
						<Icon icon="mdi:check" class="w-3 h-3" />
					{/if}
				</button>
				<label for="recursive-checkbox" class="text-sm cursor-pointer select-none">
					Search subdirectories recursively
				</label>
			</div>

			{#if scanError}
				<div class="p-3 rounded-lg bg-red-50 border border-red-200 dark:bg-red-950 dark:border-red-900">
					<p class="text-sm text-red-800 dark:text-red-200 flex items-center gap-2">
						<Icon icon="mdi:alert-circle" class="w-4 h-4 shrink-0" />
						{scanError}
					</p>
				</div>
			{/if}

			{#if scanResult}
				<div class="space-y-3">
					<div class="flex items-center gap-2 text-sm font-medium">
						<Icon icon="mdi:folder-check" class="w-4 h-4" />
						Scan Results
					</div>

					{#if scanResult.imported.length > 0}
						<div class="space-y-2">
							<p class="text-xs text-muted-foreground flex items-center gap-1">
								<Icon icon="mdi:check-circle" class="w-3 h-3 text-green-600" />
								Found {scanResult.imported.length} repositories to import:
							</p>
							<div class="max-h-40 overflow-y-auto space-y-1 rounded-lg border p-2">
								{#each scanResult.imported as repo (repo.id)}
									<div class="flex items-center gap-2 text-sm py-1 px-2 rounded hover:bg-muted/50">
										<Icon icon="mdi:git" class="w-4 h-4 text-muted-foreground shrink-0" />
										<span class="truncate flex-1" title={repo.path}>{repo.name}</span>
										<Badge variant="outline" class="text-xs shrink-0">{repo.config.prefix}</Badge>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					{#if scanResult.skipped.length > 0}
						<div class="space-y-2">
							<p class="text-xs text-muted-foreground flex items-center gap-1">
								<Icon icon="mdi:skip-next" class="w-3 h-3 text-amber-600" />
								Skipping {scanResult.skipped.length} already managed:
							</p>
							<div class="max-h-24 overflow-y-auto space-y-1 text-xs text-muted-foreground rounded-lg border p-2">
								{#each scanResult.skipped as skippedPath (skippedPath)}
									<div class="truncate py-0.5 px-2" title={skippedPath}>{skippedPath}</div>
								{/each}
							</div>
						</div>
					{/if}

					{#if scanResult.errors.length > 0}
						<div class="space-y-2">
							<p class="text-xs text-muted-foreground flex items-center gap-1">
								<Icon icon="mdi:alert" class="w-3 h-3 text-red-600" />
								{scanResult.errors.length} errors:
							</p>
							<div class="max-h-24 overflow-y-auto space-y-1 text-xs rounded-lg border border-red-200 dark:border-red-900 p-2">
								{#each scanResult.errors as error (error.path)}
									<div class="py-0.5 px-2 text-red-700 dark:text-red-400">
										<span class="font-mono">{error.path}</span>: {error.error}
									</div>
								{/each}
							</div>
						</div>
					{/if}

					{#if scanResult.imported.length === 0 && scanResult.skipped.length === 0 && scanResult.errors.length === 0}
						<div class="p-4 rounded-lg bg-muted/50 text-center">
							<Icon icon="mdi:folder-off" class="w-8 h-8 mx-auto text-muted-foreground mb-2" />
							<p class="text-sm text-muted-foreground">No beads repositories found in this folder.</p>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<Dialog.Footer>
			<Button variant="outline" onclick={() => handleOpenChange(false)}>Cancel</Button>
			<Button
				onclick={importRepos}
				disabled={!scanResult || scanResult.imported.length === 0 || isImporting}
			>
				{#if isImporting}
					<Icon icon="mdi:loading" class="w-4 h-4 animate-spin" />
					Importing...
				{:else}
					<Icon icon="mdi:import" class="w-4 h-4" />
					Import {scanResult?.imported.length ?? 0} Repositories
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
