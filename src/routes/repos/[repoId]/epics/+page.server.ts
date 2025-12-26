import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { listIssues } from '$lib/server/services/issue-service';
import type { Issue } from '$lib/types/beads';

export interface EpicWithChildren {
	epic: Issue;
	children: Issue[];
	stats: {
		total: number;
		open: number;
		inProgress: number;
		closed: number;
		progressPercent: number;
	};
}

export const load: PageServerLoad = async ({ params, parent }) => {
	// Get repo from parent layout
	const { repo } = await parent();

	try {
		// Load all issues to find epics and their children
		const allIssues = await listIssues(params.repoId, {
			pageSize: 1000 // Load all issues
		});

		// Filter epics (type === 'epic')
		const epics = allIssues.items.filter((issue) => issue.type === 'epic');

		// Build a map of epic ID to child issues
		const childrenMap = new Map<string, Issue[]>();

		// Initialize all epics with empty children arrays
		for (const epic of epics) {
			childrenMap.set(epic.id, []);
		}

		// Find all children (issues with parentId set to an epic's ID)
		for (const issue of allIssues.items) {
			if (issue.parentId && childrenMap.has(issue.parentId)) {
				childrenMap.get(issue.parentId)!.push(issue);
			}
		}

		// Build epic data with stats
		const epicsWithChildren: EpicWithChildren[] = epics.map((epic) => {
			const children = childrenMap.get(epic.id) || [];
			const open = children.filter((c) => c.status === 'open').length;
			const inProgress = children.filter((c) => c.status === 'in_progress').length;
			const closed = children.filter((c) => c.status === 'closed').length;
			const total = children.length;
			const progressPercent = total > 0 ? Math.round((closed / total) * 100) : 0;

			return {
				epic,
				children,
				stats: {
					total,
					open,
					inProgress,
					closed,
					progressPercent
				}
			};
		});

		return {
			epics: epicsWithChildren,
			repoId: params.repoId,
			repo
		};
	} catch (e) {
		if ((e as Error).message === 'Repository not found') {
			throw error(404, { message: 'Repository not found' });
		}
		throw error(500, { message: 'Failed to load epics' });
	}
};
