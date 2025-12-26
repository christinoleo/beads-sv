<script lang="ts">
	import type { Snippet } from 'svelte';
	import { setAppState } from '$lib/state/app.svelte';
	import type { ManagedRepo } from '$lib/types/beads';
	import Sidebar from './Sidebar.svelte';
	import Header from './Header.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';

	interface Props {
		repos?: ManagedRepo[];
		children: Snippet;
	}

	let { repos = [], children }: Props = $props();

	// Initialize app state - must use initialRepos to avoid reactivity warning
	const initialRepos = repos;
	const appState = setAppState(initialRepos);

	// Sync repos if they change from server (e.g., on navigation)
	$effect(() => {
		appState.setRepos(repos);
	});
</script>

<Tooltip.Provider>
	<div class="flex h-screen w-full overflow-hidden bg-background">
		<!-- Sidebar -->
		<Sidebar />

		<!-- Main Content Area -->
		<div class="flex flex-1 flex-col overflow-hidden">
			<!-- Header -->
			<Header />

			<!-- Page Content -->
			<main class="flex-1 overflow-auto p-6">
				{@render children()}
			</main>
		</div>
	</div>
</Tooltip.Provider>
