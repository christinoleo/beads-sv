import type { Issue } from '$lib/types/beads';
import type {
	EpicStats,
	EpicGroup,
	GroupedIssuesByStatus,
	SwimlaneData,
	OverallStats
} from '$lib/types/epic-stats';

/**
 * Calculate statistics for a set of issues
 */
export function calculateStats(issues: Issue[]): EpicStats {
	const total = issues.length;
	const open = issues.filter((i) => i.status === 'open' && i.blockedBy.length === 0).length;
	const inProgress = issues.filter((i) => i.status === 'in_progress').length;
	const closed = issues.filter((i) => i.status === 'closed').length;
	const blocked = issues.filter((i) => i.status !== 'closed' && i.blockedBy.length > 0).length;

	const progressPercent = total > 0 ? Math.round((closed / total) * 100) : 0;

	return { total, open, inProgress, closed, blocked, progressPercent };
}

/**
 * Group issues by their parent epic
 * Epics sorted by priority, "No Epic" group at the end
 */
export function groupIssuesByEpic(allIssues: Issue[], epics: Issue[]): EpicGroup[] {
	const groups: EpicGroup[] = [];

	// Create a map of epic ID to its child issues (excluding epics themselves)
	const nonEpicIssues = allIssues.filter((i) => i.type !== 'epic');

	// Sort epics by priority (lower = higher priority)
	const sortedEpics = [...epics].sort((a, b) => a.priority - b.priority);

	// Create groups for each epic
	for (const epic of sortedEpics) {
		const children = nonEpicIssues.filter((i) => i.parentId === epic.id);
		groups.push({
			epic,
			issues: children,
			stats: calculateStats(children)
		});
	}

	// Create "No Epic" group for orphan issues
	const orphanIssues = nonEpicIssues.filter((i) => !i.parentId);
	if (orphanIssues.length > 0) {
		groups.push({
			epic: null,
			issues: orphanIssues,
			stats: calculateStats(orphanIssues)
		});
	}

	return groups;
}

/**
 * Group issues by their status for board columns
 */
export function groupIssuesByStatus(issues: Issue[]): GroupedIssuesByStatus {
	return {
		blocked: issues.filter((i) => i.status !== 'closed' && i.blockedBy.length > 0),
		ready: issues.filter((i) => i.status === 'open' && i.blockedBy.length === 0),
		inProgress: issues.filter((i) => i.status === 'in_progress'),
		closed: issues.filter((i) => i.status === 'closed')
	};
}

/**
 * Build swimlane data from epic groups
 */
export function buildSwimlanes(groups: EpicGroup[]): SwimlaneData[] {
	return groups.map((group) => ({
		epic: group.epic,
		stats: group.stats,
		columns: groupIssuesByStatus(group.issues)
	}));
}

/**
 * Calculate overall project statistics
 */
export function calculateOverallStats(allIssues: Issue[], epics: Issue[]): OverallStats {
	const nonEpicIssues = allIssues.filter((i) => i.type !== 'epic');

	const totalEpics = epics.length;
	const activeEpics = epics.filter((e) => e.status !== 'closed').length;
	const completedEpics = epics.filter((e) => e.status === 'closed').length;

	const totalIssues = nonEpicIssues.length;
	const openIssues = nonEpicIssues.filter(
		(i) => i.status === 'open' && i.blockedBy.length === 0
	).length;
	const inProgressIssues = nonEpicIssues.filter((i) => i.status === 'in_progress').length;
	const closedIssues = nonEpicIssues.filter((i) => i.status === 'closed').length;
	const blockedIssues = nonEpicIssues.filter(
		(i) => i.status !== 'closed' && i.blockedBy.length > 0
	).length;

	const overallProgress = totalIssues > 0 ? Math.round((closedIssues / totalIssues) * 100) : 0;

	// Health score based on blocked ratio
	const openAndInProgress = totalIssues - closedIssues;
	const blockedRatio = openAndInProgress > 0 ? blockedIssues / openAndInProgress : 0;

	let healthScore: 'good' | 'warning' | 'critical';
	if (blockedRatio > 0.3) {
		healthScore = 'critical';
	} else if (blockedRatio > 0.1) {
		healthScore = 'warning';
	} else {
		healthScore = 'good';
	}

	return {
		totalEpics,
		activeEpics,
		completedEpics,
		totalIssues,
		openIssues,
		inProgressIssues,
		closedIssues,
		blockedIssues,
		overallProgress,
		healthScore
	};
}

/**
 * Get all epics from a list of issues
 */
export function getEpics(issues: Issue[]): Issue[] {
	return issues.filter((i) => i.type === 'epic');
}

/**
 * Build complete swimlane data from all issues
 */
export function buildSwimlanesFromIssues(allIssues: Issue[]): SwimlaneData[] {
	const epics = getEpics(allIssues);
	const groups = groupIssuesByEpic(allIssues, epics);
	return buildSwimlanes(groups);
}
