import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { listIssues } from '$lib/server/services/issue-service';
import type { IssueFilter, IssueSort, IssueStatus, IssueType, Priority } from '$lib/types/beads';

export const load: PageServerLoad = async ({ params, url, parent }) => {
	// Get repo from parent layout
	const { repo } = await parent();

	// Parse filter params from URL
	const filter: IssueFilter = {
		status: url.searchParams.getAll('status') as IssueStatus[],
		type: url.searchParams.getAll('type') as IssueType[],
		priority: url.searchParams.getAll('priority').map(Number) as Priority[],
		labels: url.searchParams.getAll('label'),
		search: url.searchParams.get('search') || undefined,
		parentId: url.searchParams.get('parentId') || undefined
	};

	// Parse sort params
	const sort: IssueSort = {
		field: (url.searchParams.get('sortBy') as IssueSort['field']) || 'created',
		direction: (url.searchParams.get('sortDir') as IssueSort['direction']) || 'desc'
	};

	// Parse pagination
	const page = parseInt(url.searchParams.get('page') || '1', 10);
	const pageSize = parseInt(url.searchParams.get('pageSize') || '50', 10);

	try {
		const issues = await listIssues(params.repoId, { filter, sort, page, pageSize });

		return {
			issues,
			repoId: params.repoId,
			repo
		};
	} catch (e) {
		if ((e as Error).message === 'Repository not found') {
			throw error(404, { message: 'Repository not found' });
		}
		throw error(500, { message: 'Failed to load issues' });
	}
};
