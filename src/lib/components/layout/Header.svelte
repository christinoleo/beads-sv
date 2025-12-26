<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import * as Command from '$lib/components/ui/command';
	import { getAppState } from '$lib/state/app.svelte';

	const appState = getAppState();

	// Local state for command dialog that syncs with app state
	let searchOpen = $state(false);

	// Sync local state with app state
	$effect(() => {
		searchOpen = appState.searchOpen;
	});

	function handleOpenChange(open: boolean) {
		searchOpen = open;
		appState.setSearchOpen(open);
	}

	interface Breadcrumb {
		label: string;
		href: string;
	}

	const breadcrumbs = $derived.by(() => {
		const crumbs: Breadcrumb[] = [{ label: 'Home', href: '/' }];
		const pathname = $page.url.pathname;
		const segments = pathname.split('/').filter(Boolean);

		let currentPath = '';
		for (let i = 0; i < segments.length; i++) {
			const segment = segments[i];
			currentPath += `/${segment}`;

			if (segment === 'repos') {
				crumbs.push({ label: 'Repositories', href: '/repos' });
			} else if (segment === 'add' && segments[i - 1] === 'repos') {
				crumbs.push({ label: 'Add Repository', href: currentPath });
			} else if (segment === 'issues') {
				crumbs.push({ label: 'Issues', href: currentPath });
			} else if (segments[i - 1] === 'repos' && segment !== 'add') {
				// This is a repo ID
				const repo = appState.repos.find((r) => r.id === segment);
				if (repo) {
					crumbs.push({ label: repo.name, href: currentPath });
				}
			} else if (segments[i - 1] === 'issues') {
				// This is an issue ID
				crumbs.push({ label: segment, href: currentPath });
			}
		}

		return crumbs;
	});

	function handleSearchSelect(value: string) {
		handleOpenChange(false);
		if (value.startsWith('repo:')) {
			const repoId = value.replace('repo:', '');
			goto(`/repos/${repoId}`);
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
			event.preventDefault();
			handleOpenChange(!searchOpen);
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<header class="flex h-14 items-center gap-4 border-b bg-background px-4">
	<!-- Breadcrumbs -->
	<nav class="flex items-center gap-1 text-sm">
		{#each breadcrumbs as crumb, index (crumb.href)}
			{#if index > 0}
				<Icon icon="mdi:chevron-right" class="h-4 w-4 text-muted-foreground" />
			{/if}
			{#if index === breadcrumbs.length - 1}
				<span class="font-medium">{crumb.label}</span>
			{:else}
				<a
					href={crumb.href}
					class="text-muted-foreground transition-colors hover:text-foreground"
				>
					{crumb.label}
				</a>
			{/if}
		{/each}
	</nav>

	<div class="flex-1"></div>

	<!-- Search Button -->
	<Button
		variant="outline"
		class="relative h-9 w-full max-w-sm justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
		onclick={() => handleOpenChange(true)}
	>
		<Icon icon="mdi:magnify" class="mr-2 h-4 w-4" />
		<span class="hidden lg:inline-flex">Search...</span>
		<span class="inline-flex lg:hidden">Search...</span>
		<kbd
			class="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex"
		>
			<span class="text-xs">Ctrl</span>K
		</kbd>
	</Button>

	<!-- Theme Toggle (placeholder) -->
	<Button variant="ghost" size="icon" onclick={() => appState.setTheme(appState.theme === 'dark' ? 'light' : 'dark')}>
		<Icon icon="mdi:theme-light-dark" class="h-5 w-5" />
		<span class="sr-only">Toggle theme</span>
	</Button>
</header>

<!-- Search Command Dialog -->
<Command.Dialog bind:open={searchOpen} onOpenChange={handleOpenChange}>
	<Command.Input placeholder="Search repositories and issues..." />
	<Command.List>
		<Command.Empty>No results found.</Command.Empty>
		<Command.Group heading="Repositories">
			{#each appState.repos as repo (repo.id)}
				<Command.Item
					value="repo:{repo.id}"
					onSelect={() => handleSearchSelect(`repo:${repo.id}`)}
				>
					<div
						class="mr-2 h-3 w-3 rounded-full"
						style="background-color: {repo.color ?? '#6366f1'}"
					></div>
					<span>{repo.name}</span>
					{#if repo.openCount !== undefined}
						<span class="ml-auto text-xs text-muted-foreground">
							{repo.openCount} open
						</span>
					{/if}
				</Command.Item>
			{/each}
		</Command.Group>
		<Command.Separator />
		<Command.Group heading="Actions">
			<Command.Item value="add-repo" onSelect={() => { handleOpenChange(false); goto('/repos/add'); }}>
				<Icon icon="mdi:plus" class="mr-2 h-4 w-4" />
				<span>Add Repository</span>
			</Command.Item>
		</Command.Group>
	</Command.List>
</Command.Dialog>
