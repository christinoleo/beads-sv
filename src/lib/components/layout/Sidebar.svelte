<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { getAppState } from '$lib/state/app.svelte';
	import { cn } from '$lib/utils';

	const appState = getAppState();

	function handleRepoClick(repoId: string) {
		appState.setCurrentRepo(repoId);
		goto(`/repos/${repoId}`);
	}

	function handleAddRepo() {
		goto('/repos?add=true');
	}

	function getRepoColor(color?: string): string {
		return color ?? '#6366f1';
	}
</script>

<aside
	class={cn(
		'flex h-full flex-col border-r bg-muted/30 transition-all duration-300',
		appState.sidebarCollapsed ? 'w-16' : 'w-64'
	)}
>
	<!-- Header -->
	<div class="flex h-14 items-center justify-between border-b px-3">
		{#if !appState.sidebarCollapsed}
			<a href="/" class="flex items-center gap-2 font-semibold">
				<Icon icon="mdi:folder-multiple" class="h-5 w-5 text-primary" />
				<span>Beads</span>
			</a>
		{/if}
		<Button
			variant="ghost"
			size="icon"
			onclick={() => appState.toggleSidebar()}
			class={cn(appState.sidebarCollapsed && 'mx-auto')}
		>
			<Icon
				icon={appState.sidebarCollapsed ? 'mdi:menu' : 'mdi:chevron-left'}
				class="h-5 w-5"
			/>
			<span class="sr-only">Toggle sidebar</span>
		</Button>
	</div>

	<!-- Repos List -->
	<div class="flex-1 overflow-y-auto py-2">
		{#if !appState.sidebarCollapsed}
			<div class="px-3 py-2">
				<h2 class="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
					Repositories
				</h2>
			</div>
		{/if}

		<nav class="space-y-1 px-2">
			{#each appState.repos as repo (repo.id)}
				{@const isActive = $page.params.repoId === repo.id}
				{#if appState.sidebarCollapsed}
					<Tooltip.Root>
						<Tooltip.Trigger>
							<Button
								variant={isActive ? 'secondary' : 'ghost'}
								size="icon"
								class="w-full"
								onclick={() => handleRepoClick(repo.id)}
								disabled={!repo.isValid}
							>
								<div
									class="h-3 w-3 rounded-full"
									style="background-color: {getRepoColor(repo.color)}"
								></div>
								<span class="sr-only">{repo.name}</span>
							</Button>
						</Tooltip.Trigger>
						<Tooltip.Content side="right">
							<p>{repo.name}</p>
							{#if !repo.isValid}
								<p class="text-xs text-destructive">{repo.errorMessage}</p>
							{/if}
						</Tooltip.Content>
					</Tooltip.Root>
				{:else}
					<Button
						variant={isActive ? 'secondary' : 'ghost'}
						class={cn(
							'w-full justify-start gap-3',
							!repo.isValid && 'opacity-60'
						)}
						onclick={() => handleRepoClick(repo.id)}
						disabled={!repo.isValid}
					>
						<div
							class="h-3 w-3 shrink-0 rounded-full"
							style="background-color: {getRepoColor(repo.color)}"
						></div>
						<span class="truncate">{repo.name}</span>
						{#if repo.openCount !== undefined && repo.openCount > 0}
							<span class="ml-auto text-xs text-muted-foreground">
								{repo.openCount}
							</span>
						{/if}
					</Button>
				{/if}
			{:else}
				{#if !appState.sidebarCollapsed}
					<div class="px-3 py-4 text-center text-sm text-muted-foreground">
						No repositories yet
					</div>
				{/if}
			{/each}
		</nav>
	</div>

	<!-- Footer -->
	<div class="border-t p-2">
		{#if appState.sidebarCollapsed}
			<Tooltip.Root>
				<Tooltip.Trigger>
					<Button variant="outline" size="icon" class="w-full" onclick={handleAddRepo}>
						<Icon icon="mdi:plus" class="h-5 w-5" />
						<span class="sr-only">Add Repository</span>
					</Button>
				</Tooltip.Trigger>
				<Tooltip.Content side="right">
					<p>Add Repository</p>
				</Tooltip.Content>
			</Tooltip.Root>
		{:else}
			<Button variant="outline" class="w-full justify-start gap-2" onclick={handleAddRepo}>
				<Icon icon="mdi:plus" class="h-4 w-4" />
				Add Repository
			</Button>
		{/if}
	</div>
</aside>
