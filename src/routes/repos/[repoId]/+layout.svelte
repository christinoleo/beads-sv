<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs';
	import { Button } from '$lib/components/ui/button';
	import Icon from '@iconify/svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: any } = $props();

	const repo = $derived(data.repo);

	// Determine active tab based on current route
	const activeTab = $derived.by(() => {
		const pathname = $page.url.pathname;
		if (pathname.includes('/board')) return 'board';
		if (pathname.includes('/epics')) return 'epics';
		return 'issues';
	});

	function handleTabChange(value: string) {
		const basePath = `/repos/${repo.id}`;
		switch (value) {
			case 'issues':
				goto(`${basePath}/issues`);
				break;
			case 'board':
				goto(`${basePath}/board`);
				break;
			case 'epics':
				goto(`${basePath}/epics`);
				break;
		}
	}
</script>

<div class="flex min-h-screen flex-col">
	<!-- Header -->
	<header
		class="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
	>
		<div class="container flex h-14 items-center justify-between px-4">
			<div class="flex items-center gap-4">
				<!-- Back to repos -->
				<Button variant="ghost" size="icon" href="/" class="h-8 w-8">
					<Icon icon="mdi:arrow-left" class="h-4 w-4" />
				</Button>

				<!-- Repo info -->
				<div class="flex items-center gap-2">
					{#if repo.color}
						<div class="h-3 w-3 rounded-full" style="background-color: {repo.color}"></div>
					{/if}
					<h1 class="text-lg font-semibold">{repo.name}</h1>
					<span class="font-mono text-sm text-muted-foreground">({repo.config.prefix})</span>
				</div>
			</div>

			<div class="flex items-center gap-2">
				<Button variant="outline" size="sm" class="gap-2">
					<Icon icon="mdi:plus" class="h-4 w-4" />
					New Issue
				</Button>
				<Button variant="ghost" size="icon" class="h-8 w-8">
					<Icon icon="mdi:cog-outline" class="h-4 w-4" />
				</Button>
			</div>
		</div>
	</header>

	<!-- Navigation Tabs -->
	<div class="border-b">
		<div class="container px-4">
			<Tabs.Root value={activeTab} onValueChange={handleTabChange}>
				<Tabs.List
					class="h-12 w-auto justify-start gap-4 rounded-none border-b-0 bg-transparent p-0"
				>
					<Tabs.Trigger
						value="epics"
						class="relative h-12 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pt-2 pb-3 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
					>
						<Icon icon="mdi:view-dashboard-outline" class="mr-2 h-4 w-4" />
						Dashboard
					</Tabs.Trigger>
					<Tabs.Trigger
						value="issues"
						class="relative h-12 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pt-2 pb-3 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
					>
						<Icon icon="mdi:format-list-bulleted" class="mr-2 h-4 w-4" />
						Issues
						{#if repo.issueCount !== undefined}
							<span class="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
								{repo.issueCount}
							</span>
						{/if}
					</Tabs.Trigger>
					<Tabs.Trigger
						value="board"
						class="relative h-12 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pt-2 pb-3 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
					>
						<Icon icon="mdi:view-column-outline" class="mr-2 h-4 w-4" />
						Board
					</Tabs.Trigger>
				</Tabs.List>
			</Tabs.Root>
		</div>
	</div>

	<!-- Main Content -->
	<main class="container flex-1 px-4 py-6">
		{@render children()}
	</main>
</div>
