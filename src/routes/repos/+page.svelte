<script lang="ts">
	import Icon from '@iconify/svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import RepoCard from '$lib/components/repos/RepoCard.svelte';
	import AddRepoDialog from '$lib/components/repos/AddRepoDialog.svelte';
	import ImportDialog from '$lib/components/repos/ImportDialog.svelte';
	import type { ManagedRepo } from '$lib/types/beads';
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	let repos = $state<ManagedRepo[]>(data.repos);
	let searchQuery = $state('');
	let addDialogOpen = $state(false);
	let importDialogOpen = $state(false);
	let isRemoving = $state<string | null>(null);

	let filteredRepos = $derived.by(() => {
		if (!searchQuery.trim()) return repos;
		const query = searchQuery.toLowerCase();
		return repos.filter(
			(repo) =>
				repo.name.toLowerCase().includes(query) ||
				repo.path.toLowerCase().includes(query) ||
				repo.config.prefix.toLowerCase().includes(query)
		);
	});

	let stats = $derived.by(() => {
		const total = repos.length;
		const valid = repos.filter((r) => r.isValid).length;
		const totalIssues = repos.reduce((sum, r) => sum + (r.issueCount ?? 0), 0);
		const openIssues = repos.reduce((sum, r) => sum + (r.openCount ?? 0), 0);
		return { total, valid, totalIssues, openIssues };
	});

	function handleRepoAdded(repo: ManagedRepo) {
		repos = [...repos, repo];
	}

	function handleReposImported(imported: ManagedRepo[]) {
		repos = [...repos, ...imported];
	}

	async function handleRemoveRepo(repo: ManagedRepo) {
		if (!confirm(`Remove "${repo.name}" from your workspace?\n\nThis will only remove it from this app, not delete any files.`)) {
			return;
		}

		isRemoving = repo.id;

		try {
			const response = await fetch(`/api/repos/${repo.id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				repos = repos.filter((r) => r.id !== repo.id);
			} else {
				const error = await response.json();
				alert(error.message || 'Failed to remove repository');
			}
		} catch (e) {
			alert('Failed to connect to server');
		} finally {
			isRemoving = null;
		}
	}

	function handleOpenRepo(repo: ManagedRepo) {
		goto(`/repos/${repo.id}`);
	}
</script>

<svelte:head>
	<title>Repositories - Beads</title>
</svelte:head>

<div class="min-h-screen bg-background">
	<div class="container mx-auto px-4 py-8 max-w-6xl">
		<!-- Header -->
		<div class="flex flex-col gap-6 mb-8">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold tracking-tight flex items-center gap-3">
						<Icon icon="mdi:source-repository-multiple" class="w-8 h-8" />
						Repositories
					</h1>
					<p class="text-muted-foreground mt-1">
						Manage your beads repositories
					</p>
				</div>
				<div class="flex gap-2">
					<Button variant="outline" onclick={() => (importDialogOpen = true)}>
						<Icon icon="mdi:folder-search" class="w-4 h-4" />
						Import
					</Button>
					<Button onclick={() => (addDialogOpen = true)}>
						<Icon icon="mdi:plus" class="w-4 h-4" />
						Add Repository
					</Button>
				</div>
			</div>

			<!-- Stats Bar -->
			<div class="flex flex-wrap gap-3">
				<Badge variant="secondary" class="text-sm py-1 px-3">
					<Icon icon="mdi:folder-multiple" class="w-4 h-4 mr-1" />
					{stats.total} repositories
				</Badge>
				<Badge variant="outline" class="text-sm py-1 px-3">
					<Icon icon="mdi:file-document-multiple" class="w-4 h-4 mr-1" />
					{stats.totalIssues} total issues
				</Badge>
				<Badge variant="outline" class="text-sm py-1 px-3">
					<Icon icon="mdi:circle-outline" class="w-4 h-4 mr-1" />
					{stats.openIssues} open
				</Badge>
				{#if stats.total > stats.valid}
					<Badge variant="destructive" class="text-sm py-1 px-3">
						<Icon icon="mdi:alert" class="w-4 h-4 mr-1" />
						{stats.total - stats.valid} invalid
					</Badge>
				{/if}
			</div>

			<!-- Search Bar -->
			<div class="relative max-w-md">
				<Icon
					icon="mdi:magnify"
					class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
				/>
				<Input
					bind:value={searchQuery}
					placeholder="Search repositories..."
					class="pl-9"
				/>
				{#if searchQuery}
					<button
						onclick={() => (searchQuery = '')}
						class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
					>
						<Icon icon="mdi:close" class="w-4 h-4" />
					</button>
				{/if}
			</div>
		</div>

		<!-- Repository Grid -->
		{#if repos.length === 0}
			<div class="flex flex-col items-center justify-center py-16 px-4">
				<Icon icon="mdi:folder-open-outline" class="w-16 h-16 text-muted-foreground mb-4" />
				<h2 class="text-xl font-semibold mb-2">No repositories yet</h2>
				<p class="text-muted-foreground text-center mb-6 max-w-md">
					Add your first beads repository to start tracking issues and managing your projects.
				</p>
				<div class="flex gap-3">
					<Button variant="outline" onclick={() => (importDialogOpen = true)}>
						<Icon icon="mdi:folder-search" class="w-4 h-4" />
						Scan Folder
					</Button>
					<Button onclick={() => (addDialogOpen = true)}>
						<Icon icon="mdi:plus" class="w-4 h-4" />
						Add Repository
					</Button>
				</div>
			</div>
		{:else if filteredRepos.length === 0}
			<div class="flex flex-col items-center justify-center py-16 px-4">
				<Icon icon="mdi:magnify-close" class="w-12 h-12 text-muted-foreground mb-4" />
				<h2 class="text-lg font-semibold mb-2">No matching repositories</h2>
				<p class="text-muted-foreground text-center mb-4">
					No repositories match "{searchQuery}"
				</p>
				<Button variant="outline" onclick={() => (searchQuery = '')}>
					Clear search
				</Button>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each filteredRepos as repo (repo.id)}
					<div class:opacity-50={isRemoving === repo.id} class:pointer-events-none={isRemoving === repo.id}>
						<RepoCard
							{repo}
							onRemove={handleRemoveRepo}
							onOpen={handleOpenRepo}
						/>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Dialogs -->
<AddRepoDialog bind:open={addDialogOpen} onAdd={handleRepoAdded} />
<ImportDialog bind:open={importDialogOpen} onImport={handleReposImported} />
