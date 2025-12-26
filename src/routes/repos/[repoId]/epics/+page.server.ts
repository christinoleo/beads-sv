import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { listIssues } from '$lib/server/services/issue-service';
import { groupIssuesByEpic, getEpics, calculateOverallStats } from '$lib/utils/group-by-epic';

export const load: PageServerLoad = async ({ params, parent }) => {
	// Get repo from parent layout
	const { repo } = await parent();

	try {
		// Load all issues to find epics and their children
		const allIssues = await listIssues(params.repoId, {
			pageSize: 1000 // Load all issues
		});

		// Get epics and group issues
		const epics = getEpics(allIssues.items);
		const epicGroups = groupIssuesByEpic(allIssues.items, epics);

		// Calculate overall stats
		const overallStats = calculateOverallStats(allIssues.items, epics);

		return {
			epicGroups,
			overallStats,
			repoId: params.repoId,
			repo
		};
	} catch (e) {
		if ((e as Error).message === 'Repository not found') {
			throw error(404, { message: 'Repository not found' });
		}
		throw error(500, { message: 'Failed to load dashboard' });
	}
};
