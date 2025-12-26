import { getContext, setContext } from 'svelte';
import { browser } from '$app/environment';
import type { ManagedRepo, AppPreferences } from '$lib/types/beads';

const APP_STATE_KEY = Symbol('app-state');
const THEME_STORAGE_KEY = 'beads-theme';

export type Theme = 'light' | 'dark' | 'system';

export interface AppState {
	repos: ManagedRepo[];
	currentRepoId: string | null;
	sidebarCollapsed: boolean;
	theme: Theme;
	searchOpen: boolean;
}

function getInitialTheme(): Theme {
	if (!browser) return 'system';
	const stored = localStorage.getItem(THEME_STORAGE_KEY);
	if (stored === 'light' || stored === 'dark' || stored === 'system') {
		return stored;
	}
	return 'system';
}

function applyTheme(theme: Theme) {
	if (!browser) return;

	const root = document.documentElement;
	const isDark =
		theme === 'dark' ||
		(theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

	root.classList.toggle('dark', isDark);
	localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function createAppState(initialRepos: ManagedRepo[] = []) {
	let repos = $state<ManagedRepo[]>(initialRepos);
	let currentRepoId = $state<string | null>(null);
	let sidebarCollapsed = $state(false);
	let theme = $state<Theme>(getInitialTheme());
	let searchOpen = $state(false);

	// Apply theme on initialization and changes
	$effect(() => {
		applyTheme(theme);
	});

	// Listen for system theme changes when using 'system' mode
	if (browser) {
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		mediaQuery.addEventListener('change', () => {
			if (theme === 'system') {
				applyTheme('system');
			}
		});
	}

	const currentRepo = $derived(repos.find((r) => r.id === currentRepoId) ?? null);
	const validRepos = $derived(repos.filter((r) => r.isValid));
	const invalidRepos = $derived(repos.filter((r) => !r.isValid));
	const totalOpenIssues = $derived(repos.reduce((sum, r) => sum + (r.openCount ?? 0), 0));

	function setRepos(newRepos: ManagedRepo[]) {
		repos = newRepos;
	}

	function addRepo(repo: ManagedRepo) {
		repos = [...repos, repo];
	}

	function updateRepo(id: string, updates: Partial<ManagedRepo>) {
		repos = repos.map((r) => (r.id === id ? { ...r, ...updates } : r));
	}

	function removeRepo(id: string) {
		repos = repos.filter((r) => r.id !== id);
		if (currentRepoId === id) {
			currentRepoId = null;
		}
	}

	function setCurrentRepo(id: string | null) {
		currentRepoId = id;
	}

	function toggleSidebar() {
		sidebarCollapsed = !sidebarCollapsed;
	}

	function setSidebarCollapsed(collapsed: boolean) {
		sidebarCollapsed = collapsed;
	}

	function setTheme(newTheme: Theme) {
		theme = newTheme;
	}

	function toggleSearch() {
		searchOpen = !searchOpen;
	}

	function setSearchOpen(open: boolean) {
		searchOpen = open;
	}

	return {
		// Reactive getters
		get repos() {
			return repos;
		},
		get currentRepoId() {
			return currentRepoId;
		},
		get currentRepo() {
			return currentRepo;
		},
		get sidebarCollapsed() {
			return sidebarCollapsed;
		},
		get theme() {
			return theme;
		},
		get searchOpen() {
			return searchOpen;
		},
		get validRepos() {
			return validRepos;
		},
		get invalidRepos() {
			return invalidRepos;
		},
		get totalOpenIssues() {
			return totalOpenIssues;
		},

		// Actions
		setRepos,
		addRepo,
		updateRepo,
		removeRepo,
		setCurrentRepo,
		toggleSidebar,
		setSidebarCollapsed,
		setTheme,
		toggleSearch,
		setSearchOpen
	};
}

export type AppStateContext = ReturnType<typeof createAppState>;

export function setAppState(initialRepos: ManagedRepo[] = []): AppStateContext {
	const state = createAppState(initialRepos);
	setContext(APP_STATE_KEY, state);
	return state;
}

export function getAppState(): AppStateContext {
	const state = getContext<AppStateContext>(APP_STATE_KEY);
	if (!state) {
		throw new Error(
			'App state not found. Did you forget to call setAppState in a parent component?'
		);
	}
	return state;
}
