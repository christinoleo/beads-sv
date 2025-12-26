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
	import { page } from '$app/stores';
	import { getAppState } from '$lib/state/app.svelte';

	let { data }: { data: PageData } = $props();

	const appState = getAppState();

	let repos = $state<ManagedRepo[]>(data.repos);
	let searchQuery = $state('');
	let addDialogOpen = $state($page.url.searchParams.get('add') === 'true');
	let importDialogOpen = $state(false);
	let isRemoving = $state<string | null>(null);

	// Clear URL param when dialog closes
	$effect(() => {
		if (!addDialogOpen && $page.url.searchParams.get('add') === 'true') {
			goto('/repos', { replaceState: true });
		}
	});

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
		appState.addRepo(repo);
	}

	function handleReposImported(imported: ManagedRepo[]) {
		repos = [...repos, ...imported];
		imported.forEach((repo) => appState.addRepo(repo));
	}

	async function handleRemoveRepo(repo: ManagedRepo) {
		if (
			!confirm(
				`Remove "${repo.name}" from your workspace?\n\nThis will only remove it from this app, not delete any files.`
			)
		) {
			return;
		}

		isRemoving = repo.id;

		try {
			const response = await fetch(`/api/repos/${repo.id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				repos = repos.filter((r) => r.id !== repo.id);
				appState.removeRepo(repo.id);
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
	<div class="container mx-auto max-w-6xl px-4 py-8">
		<!-- Header -->
		<div class="mb-8 flex flex-col gap-6">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="flex items-center gap-3 text-3xl font-bold tracking-tight">
						<Icon icon="mdi:source-repository-multiple" class="h-8 w-8" />
						Repositories
					</h1>
					<p class="mt-1 text-muted-foreground">Manage your beads repositories</p>
				</div>
				<div class="flex gap-2">
					<Button variant="outline" onclick={() => (importDialogOpen = true)}>
						<Icon icon="mdi:folder-search" class="h-4 w-4" />
						Import
					</Button>
					<Button onclick={() => (addDialogOpen = true)}>
						<Icon icon="mdi:plus" class="h-4 w-4" />
						Add Repository
					</Button>
				</div>
			</div>

			<!-- Stats Bar -->
			<div class="flex flex-wrap gap-3">
				<Badge variant="secondary" class="px-3 py-1 text-sm">
					<Icon icon="mdi:folder-multiple" class="mr-1 h-4 w-4" />
					{stats.total} repositories
				</Badge>
				<Badge variant="outline" class="px-3 py-1 text-sm">
					<Icon icon="mdi:file-document-multiple" class="mr-1 h-4 w-4" />
					{stats.totalIssues} total issues
				</Badge>
				<Badge variant="outline" class="px-3 py-1 text-sm">
					<Icon icon="mdi:circle-outline" class="mr-1 h-4 w-4" />
					{stats.openIssues} open
				</Badge>
				{#if stats.total > stats.valid}
					<Badge variant="destructive" class="px-3 py-1 text-sm">
						<Icon icon="mdi:alert" class="mr-1 h-4 w-4" />
						{stats.total - stats.valid} invalid
					</Badge>
				{/if}
			</div>

			<!-- Search Bar -->
			<div class="relative max-w-md">
				<Icon
					icon="mdi:magnify"
					class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
				/>
				<Input bind:value={searchQuery} placeholder="Search repositories..." class="pl-9" />
				{#if searchQuery}
					<button
						onclick={() => (searchQuery = '')}
						class="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
					>
						<Icon icon="mdi:close" class="h-4 w-4" />
					</button>
				{/if}
			</div>
		</div>

		<!-- Repository Grid -->
		{#if repos.length === 0}
			<div class="flex flex-col items-center justify-center px-4 py-16">
				<Icon icon="mdi:folder-open-outline" class="mb-4 h-16 w-16 text-muted-foreground" />
				<h2 class="mb-2 text-xl font-semibold">No repositories yet</h2>
				<p class="mb-6 max-w-md text-center text-muted-foreground">
					Add your first beads repository to start tracking issues and managing your projects.
				</p>
				<div class="flex gap-3">
					<Button variant="outline" onclick={() => (importDialogOpen = true)}>
						<Icon icon="mdi:folder-search" class="h-4 w-4" />
						Scan Folder
					</Button>
					<Button onclick={() => (addDialogOpen = true)}>
						<Icon icon="mdi:plus" class="h-4 w-4" />
						Add Repository
					</Button>
				</div>
			</div>
		{:else if filteredRepos.length === 0}
			<div class="flex flex-col items-center justify-center px-4 py-16">
				<Icon icon="mdi:magnify-close" class="mb-4 h-12 w-12 text-muted-foreground" />
				<h2 class="mb-2 text-lg font-semibold">No matching repositories</h2>
				<p class="mb-4 text-center text-muted-foreground">
					No repositories match "{searchQuery}"
				</p>
				<Button variant="outline" onclick={() => (searchQuery = '')}>Clear search</Button>
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each filteredRepos as repo (repo.id)}
					<div
						class:opacity-50={isRemoving === repo.id}
						class:pointer-events-none={isRemoving === repo.id}
					>
						<RepoCard {repo} onRemove={handleRemoveRepo} onOpen={handleOpenRepo} />
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Dialogs -->
<AddRepoDialog bind:open={addDialogOpen} onAdd={handleRepoAdded} />
<ImportDialog bind:open={importDialogOpen} onImport={handleReposImported} />
