import type { Issue } from './beads';

export interface EpicStats {
	total: number;
	open: number;
	inProgress: number;
	closed: number;
	blocked: number;
	progressPercent: number;
}

export interface EpicGroup {
	epic: Issue | null; // null = "No Epic" group
	issues: Issue[];
	stats: EpicStats;
}

export interface GroupedIssuesByStatus {
	blocked: Issue[];
	ready: Issue[];
	inProgress: Issue[];
	closed: Issue[];
}

export interface SwimlaneData {
	epic: Issue | null;
	stats: EpicStats;
	columns: GroupedIssuesByStatus;
}

export interface OverallStats {
	totalEpics: number;
	activeEpics: number;
	completedEpics: number;
	totalIssues: number;
	openIssues: number;
	inProgressIssues: number;
	closedIssues: number;
	blockedIssues: number;
	overallProgress: number;
	healthScore: 'good' | 'warning' | 'critical';
}
