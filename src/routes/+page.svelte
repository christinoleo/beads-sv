<script lang="ts">
	import Icon from '@iconify/svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { getAppState } from '$lib/state/app.svelte';
	import { goto } from '$app/navigation';

	const appState = getAppState();

	let stats = $derived.by(() => {
		const repos = appState.repos;
		const totalRepos = repos.length;
		const totalIssues = repos.reduce((sum, r) => sum + (r.issueCount ?? 0), 0);
		const openIssues = repos.reduce((sum, r) => sum + (r.openCount ?? 0), 0);
		const closedIssues = totalIssues - openIssues;
		return { totalRepos, totalIssues, openIssues, closedIssues };
	});

	function handleRepoClick(repoId: string) {
		goto(`/repos/${repoId}/issues`);
	}
</script>

<svelte:head>
	<title>Dashboard - Beads</title>
</svelte:head>

<div class="container mx-auto max-w-6xl px-4 py-8">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="flex items-center gap-3 text-3xl font-bold tracking-tight">
			<Icon icon="mdi:view-dashboard" class="h-8 w-8" />
			Dashboard
		</h1>
		<p class="mt-1 text-muted-foreground">Overview of all your beads repositories</p>
	</div>

	<!-- Stats Cards -->
	<div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<Card.Root
			class="cursor-pointer transition-colors hover:border-primary/50"
			onclick={() => goto('/repos')}
		>
			<Card.Header class="pb-2">
				<Card.Title class="text-sm font-medium text-muted-foreground">Repositories</Card.Title>
			</Card.Header>
			<Card.Content>
				<div class="flex items-center gap-2">
					<Icon icon="mdi:folder-multiple" class="h-5 w-5 text-primary" />
					<span class="text-2xl font-bold">{stats.totalRepos}</span>
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="pb-2">
				<Card.Title class="text-sm font-medium text-muted-foreground">Total Issues</Card.Title>
			</Card.Header>
			<Card.Content>
				<div class="flex items-center gap-2">
					<Icon icon="mdi:file-document-multiple" class="h-5 w-5 text-blue-500" />
					<span class="text-2xl font-bold">{stats.totalIssues}</span>
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="pb-2">
				<Card.Title class="text-sm font-medium text-muted-foreground">Open Issues</Card.Title>
			</Card.Header>
			<Card.Content>
				<div class="flex items-center gap-2">
					<Icon icon="mdi:circle-outline" class="h-5 w-5 text-yellow-500" />
					<span class="text-2xl font-bold">{stats.openIssues}</span>
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="pb-2">
				<Card.Title class="text-sm font-medium text-muted-foreground">Closed Issues</Card.Title>
			</Card.Header>
			<Card.Content>
				<div class="flex items-center gap-2">
					<Icon icon="mdi:check-circle" class="h-5 w-5 text-green-500" />
					<span class="text-2xl font-bold">{stats.closedIssues}</span>
				</div>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Repositories Section -->
	{#if appState.repos.length === 0}
		<Card.Root class="p-8">
			<div class="flex flex-col items-center justify-center text-center">
				<Icon icon="mdi:folder-open-outline" class="mb-4 h-16 w-16 text-muted-foreground" />
				<h2 class="mb-2 text-xl font-semibold">No repositories yet</h2>
				<p class="mb-6 max-w-md text-muted-foreground">
					Add your first beads repository to start tracking issues.
				</p>
				<Button onclick={() => goto('/repos?add=true')}>
					<Icon icon="mdi:plus" class="h-4 w-4" />
					Add Repository
				</Button>
			</div>
		</Card.Root>
	{:else}
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<h2 class="text-xl font-semibold">Your Repositories</h2>
				<Button variant="outline" onclick={() => goto('/repos')}>
					<Icon icon="mdi:cog" class="h-4 w-4" />
					Manage
				</Button>
			</div>

			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each appState.repos as repo (repo.id)}
					<Card.Root
						class="cursor-pointer transition-colors hover:border-primary/50"
						onclick={() => handleRepoClick(repo.id)}
					>
						<Card.Header class="pb-2">
							<div class="flex items-center gap-2">
								<div
									class="h-3 w-3 rounded-full"
									style="background-color: {repo.color ?? '#6366f1'}"
								></div>
								<Card.Title class="text-base">{repo.name}</Card.Title>
							</div>
							<Card.Description class="truncate text-xs">{repo.path}</Card.Description>
						</Card.Header>
						<Card.Content>
							<div class="flex items-center gap-4 text-sm">
								<div class="flex items-center gap-1">
									<Icon icon="mdi:file-document" class="h-4 w-4 text-muted-foreground" />
									<span>{repo.issueCount ?? 0} issues</span>
								</div>
								{#if (repo.openCount ?? 0) > 0}
									<Badge variant="secondary">
										{repo.openCount} open
									</Badge>
								{:else}
									<Badge variant="outline" class="text-green-600">
										<Icon icon="mdi:check" class="mr-1 h-3 w-3" />
										All done
									</Badge>
								{/if}
							</div>
						</Card.Content>
					</Card.Root>
				{/each}
			</div>
		</div>
	{/if}
</div>
