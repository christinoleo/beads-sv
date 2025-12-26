import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { listIssues } from '$lib/server/services/issue-service';
import { buildSwimlanesFromIssues } from '$lib/utils/group-by-epic';

export const load: PageServerLoad = async ({ params, parent }) => {
	// Get repo from parent layout
	const { repo } = await parent();

	try {
		// Fetch all issues without pagination for board view
		const issues = await listIssues(params.repoId, {
			filter: {},
			sort: { field: 'priority', direction: 'asc' },
			page: 1,
			pageSize: 1000 // Large limit to get all issues for board
		});

		// Build swimlane data grouped by epic
		const swimlanes = buildSwimlanesFromIssues(issues.items);

		return {
			issues,
			swimlanes,
			repoId: params.repoId,
			repo
		};
	} catch (e) {
		if ((e as Error).message === 'Repository not found') {
			throw error(404, { message: 'Repository not found' });
		}
		throw error(500, { message: 'Failed to load issues for board' });
	}
};
