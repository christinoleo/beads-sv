import type {
	Issue,
	IssueFilter,
	IssueSort,
	IssueStatus,
	IssueType,
	Priority,
	PaginatedResponse
} from '$lib/types/beads';

export interface IssuesState {
	issues: Issue[];
	total: number;
	page: number;
	pageSize: number;
	hasMore: boolean;
	loading: boolean;
	error: string | null;
	filter: IssueFilter;
	sort: IssueSort;
}

function createIssuesState() {
	let issues = $state<Issue[]>([]);
	let total = $state(0);
	let page = $state(1);
	let pageSize = $state(50);
	let hasMore = $state(false);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let filter = $state<IssueFilter>({
		status: [],
		type: [],
		priority: [],
		labels: [],
		search: undefined
	});
	let sort = $state<IssueSort>({
		field: 'created',
		direction: 'desc'
	});

	let currentRepoId = $state<string | null>(null);

	// Build query params from filter and sort
	const queryParams = $derived.by(() => {
		const params = new URLSearchParams();

		if (filter.status && filter.status.length > 0) {
			filter.status.forEach((s) => params.append('status', s));
		}
		if (filter.type && filter.type.length > 0) {
			filter.type.forEach((t) => params.append('type', t));
		}
		if (filter.priority && filter.priority.length > 0) {
			filter.priority.forEach((p) => params.append('priority', String(p)));
		}
		if (filter.labels && filter.labels.length > 0) {
			filter.labels.forEach((l) => params.append('label', l));
		}
		if (filter.search) {
			params.set('search', filter.search);
		}
		if (filter.parentId) {
			params.set('parentId', filter.parentId);
		}

		params.set('sortBy', sort.field);
		params.set('sortDir', sort.direction);
		params.set('page', String(page));
		params.set('pageSize', String(pageSize));

		return params.toString();
	});

	// Derived filtered count
	const filteredCount = $derived(issues.length);
	const hasFilters = $derived(
		(filter.status && filter.status.length > 0) ||
			(filter.type && filter.type.length > 0) ||
			(filter.priority && filter.priority.length > 0) ||
			!!filter.search
	);

	async function fetchIssues(repoId: string) {
		currentRepoId = repoId;
		loading = true;
		error = null;

		try {
			const response = await fetch(`/api/repos/${repoId}/issues?${queryParams}`);
			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error?.message || 'Failed to fetch issues');
			}

			const data = result.data as PaginatedResponse<Issue>;
			issues = data.items;
			total = data.total;
			page = data.page;
			pageSize = data.pageSize;
			hasMore = data.hasMore;
		} catch (e) {
			error = e instanceof Error ? e.message : 'An error occurred';
			issues = [];
		} finally {
			loading = false;
		}
	}

	async function refresh() {
		if (currentRepoId) {
			await fetchIssues(currentRepoId);
		}
	}

	function setFilter(newFilter: Partial<IssueFilter>) {
		filter = { ...filter, ...newFilter };
		page = 1; // Reset to first page on filter change
	}

	function setStatusFilter(statuses: IssueStatus[]) {
		setFilter({ status: statuses });
	}

	function setTypeFilter(types: IssueType[]) {
		setFilter({ type: types });
	}

	function setPriorityFilter(priorities: Priority[]) {
		setFilter({ priority: priorities });
	}

	function setSearch(search: string) {
		setFilter({ search: search || undefined });
	}

	function clearFilters() {
		filter = {
			status: [],
			type: [],
			priority: [],
			labels: [],
			search: undefined
		};
		page = 1;
	}

	function setSort(field: IssueSort['field']) {
		if (sort.field === field) {
			// Toggle direction
			sort = { field, direction: sort.direction === 'asc' ? 'desc' : 'asc' };
		} else {
			// New field, default to desc for created/updated, asc for others
			const defaultDir = field === 'created' || field === 'priority' ? 'desc' : 'asc';
			sort = { field, direction: defaultDir };
		}
	}

	function setPage(newPage: number) {
		page = newPage;
	}

	function setPageSize(newPageSize: number) {
		pageSize = newPageSize;
		page = 1;
	}

	// Initialize with server data
	function initialize(data: PaginatedResponse<Issue>, repoId: string) {
		issues = data.items;
		total = data.total;
		page = data.page;
		pageSize = data.pageSize;
		hasMore = data.hasMore;
		currentRepoId = repoId;
		loading = false;
		error = null;
	}

	return {
		get issues() {
			return issues;
		},
		get total() {
			return total;
		},
		get page() {
			return page;
		},
		get pageSize() {
			return pageSize;
		},
		get hasMore() {
			return hasMore;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		get filter() {
			return filter;
		},
		get sort() {
			return sort;
		},
		get filteredCount() {
			return filteredCount;
		},
		get hasFilters() {
			return hasFilters;
		},
		get queryParams() {
			return queryParams;
		},
		get currentRepoId() {
			return currentRepoId;
		},
		fetchIssues,
		refresh,
		setFilter,
		setStatusFilter,
		setTypeFilter,
		setPriorityFilter,
		setSearch,
		clearFilters,
		setSort,
		setPage,
		setPageSize,
		initialize
	};
}

// Export a singleton instance for global state
export const issuesState = createIssuesState();

// Export factory for creating isolated instances (useful for testing)
export { createIssuesState };
