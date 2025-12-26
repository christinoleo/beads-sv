<script lang="ts">
	import type { Snippet } from 'svelte';
	import { innerWidth } from 'svelte/reactivity/window';
	import { setAppState } from '$lib/state/app.svelte';
	import type { ManagedRepo } from '$lib/types/beads';
	import Sidebar from './Sidebar.svelte';
	import Header from './Header.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import * as Sheet from '$lib/components/ui/sheet';

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

	// Derived: is mobile viewport (< 768px)
	const isMobile = $derived((innerWidth.current ?? 1024) < 768);

	// Auto-close mobile menu on resize to desktop
	$effect(() => {
		if (!isMobile && appState.mobileMenuOpen) {
			appState.closeMobileMenu();
		}
	});
</script>

<Tooltip.Provider>
	<div class="flex h-screen w-full overflow-hidden bg-background">
		<!-- Desktop Sidebar (hidden on mobile) -->
		<div class="hidden md:block">
			<Sidebar />
		</div>

		<!-- Mobile Sidebar (Sheet overlay) -->
		<Sheet.Root
			open={appState.mobileMenuOpen}
			onOpenChange={(open) => appState.setMobileMenuOpen(open)}
		>
			<Sheet.Content side="left" class="w-64 p-0">
				<Sidebar mobile={true} onNavigate={() => appState.closeMobileMenu()} />
			</Sheet.Content>
		</Sheet.Root>

		<!-- Main Content Area -->
		<div class="flex flex-1 flex-col overflow-hidden">
			<!-- Header -->
			<Header />

			<!-- Page Content -->
			<main class="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
				{@render children()}
			</main>
		</div>
	</div>
</Tooltip.Provider>
