import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Issue, IssueType, IssueStatus, Priority, IssueFilter, IssueSort, CreateIssueDto, UpdateIssueDto, PaginatedResponse } from '$lib/types/beads';
import { parseIssue, serializeIssue } from '$lib/server/parser/issue-parser';
import { appConfig } from './app-config';

// JSONL issue format from beads CLI
interface JsonlIssue {
	id: string;
	title: string;
	description?: string;
	status: string;
	priority: number;
	issue_type: string;
	created_at: string;
	updated_at?: string;
	closed_at?: string;
	close_reason?: string;
	labels?: string[];
	dependencies?: Array<{
		issue_id: string;
		depends_on_id: string;
		type: string;
	}>;
}

function mapJsonlToIssue(jsonl: JsonlIssue, repoPath: string): Issue {
	// Map status
	let status: IssueStatus = 'open';
	if (jsonl.status === 'closed') status = 'closed';
	else if (jsonl.status === 'in_progress' || jsonl.status === 'in-progress') status = 'in_progress';

	// Map type
	const typeMap: Record<string, IssueType> = {
		task: 'task', bug: 'bug', feature: 'feature', epic: 'epic', chore: 'chore'
	};
	const type = typeMap[jsonl.issue_type] || 'task';

	// Map priority (ensure 0-4 range)
	const priority = Math.max(0, Math.min(4, jsonl.priority)) as Priority;

	// Process dependencies once
	const deps = jsonl.dependencies ?? [];
	const blockedBy = deps
		.filter(d => d.issue_id === jsonl.id && d.type === 'blocks')
		.map(d => d.depends_on_id);
	const blocks = deps
		.filter(d => d.depends_on_id === jsonl.id && d.type === 'blocks')
		.map(d => d.issue_id);
	const parentDep = deps.find(d => d.issue_id === jsonl.id && d.type === 'parent-child');

	return {
		id: jsonl.id,
		title: jsonl.title,
		type,
		status,
		priority,
		created: jsonl.created_at.split('T')[0],
		updated: jsonl.updated_at?.split('T')[0],
		closed: jsonl.closed_at?.split('T')[0],
		description: jsonl.description || '',
		labels: jsonl.labels || [],
		blockedBy,
		blocks,
		parentId: parentDep?.depends_on_id,
		filePath: path.join(repoPath, '.beads', 'issues.jsonl')
	};
}

async function loadIssuesFromJsonl(repoPath: string): Promise<Issue[]> {
	const jsonlPath = path.join(repoPath, '.beads', 'issues.jsonl');
	const issues: Issue[] = [];

	try {
		const content = await fs.readFile(jsonlPath, 'utf-8');
		const lines = content.trim().split('\n').filter(Boolean);

		for (const line of lines) {
			try {
				const jsonlIssue = JSON.parse(line) as JsonlIssue;
				issues.push(mapJsonlToIssue(jsonlIssue, repoPath));
			} catch (e) {
				console.warn(`Skipping unparseable JSONL line in ${jsonlPath}:`, e);
			}
		}
	} catch (e) {
		// Only silence ENOENT (file not found), log other errors
		if ((e as NodeJS.ErrnoException).code !== 'ENOENT') {
			console.error(`Error reading JSONL file ${jsonlPath}:`, e);
		}
	}

	return issues;
}

export class IssueNotFoundError extends Error {
	constructor(
		public repoId: string,
		public issueId: string
	) {
		super(`Issue not found: ${issueId} in ${repoId}`);
		this.name = 'IssueNotFoundError';
	}
}

export async function listIssues(
	repoId: string,
	options: { filter?: IssueFilter; sort?: IssueSort; page?: number; pageSize?: number } = {}
): Promise<PaginatedResponse<Issue>> {
	const { filter = {}, sort = { field: 'created', direction: 'desc' }, page = 1, pageSize = 50 } = options;

	const repo = await appConfig.getRepo(repoId);
	if (!repo) throw new Error('Repository not found');

	// Load issues from JSONL (beads CLI format)
	let issues = await loadIssuesFromJsonl(repo.path);

	// Fallback to markdown files if JSONL is empty
	if (issues.length === 0) {
		const issuesDir = path.join(repo.path, '.beads', 'issues');
		try {
			const files = await fs.readdir(issuesDir);

			for (const file of files) {
				if (!file.endsWith('.md')) continue;

				try {
					const filePath = path.join(issuesDir, file);
					const content = await fs.readFile(filePath, 'utf-8');
					const issue = parseIssue(content, filePath);
					issues.push(issue);
				} catch {
					// Skip unparseable files
				}
			}
		} catch (e) {
			if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
		}
	}

	// Apply filters
	if (filter.status?.length) {
		issues = issues.filter((i) => filter.status!.includes(i.status));
	}
	if (filter.type?.length) {
		issues = issues.filter((i) => filter.type!.includes(i.type));
	}
	if (filter.priority?.length) {
		issues = issues.filter((i) => filter.priority!.includes(i.priority));
	}
	if (filter.labels?.length) {
		issues = issues.filter((i) => filter.labels!.some((l) => i.labels.includes(l)));
	}
	if (filter.search) {
		const needle = filter.search.toLowerCase();
		issues = issues.filter(
			(i) => i.id.toLowerCase().includes(needle) || i.title.toLowerCase().includes(needle)
		);
	}
	if (filter.parentId) {
		issues = issues.filter((i) => i.parentId === filter.parentId);
	}

	// Apply sorting
	issues.sort((a, b) => {
		let cmp = 0;
		switch (sort.field) {
			case 'created':
				cmp = a.created.localeCompare(b.created);
				break;
			case 'updated':
				cmp = (a.updated || a.created).localeCompare(b.updated || b.created);
				break;
			case 'priority':
				cmp = a.priority - b.priority;
				break;
			case 'status':
				cmp = a.status.localeCompare(b.status);
				break;
			case 'title':
				cmp = a.title.localeCompare(b.title);
				break;
		}
		return sort.direction === 'desc' ? -cmp : cmp;
	});

	const total = issues.length;
	const start = (page - 1) * pageSize;
	const items = issues.slice(start, start + pageSize);

	return {
		items,
		total,
		page,
		pageSize,
		hasMore: start + pageSize < total
	};
}

export async function getIssue(repoId: string, issueId: string): Promise<Issue> {
	const repo = await appConfig.getRepo(repoId);
	if (!repo) throw new Error('Repository not found');

	// Try JSONL first
	const issues = await loadIssuesFromJsonl(repo.path);
	const jsonlIssue = issues.find(i => i.id === issueId);
	if (jsonlIssue) return jsonlIssue;

	// Fallback to markdown file
	const filePath = path.join(repo.path, '.beads', 'issues', `${issueId}.md`);

	try {
		const content = await fs.readFile(filePath, 'utf-8');
		return parseIssue(content, filePath);
	} catch (e) {
		if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
			throw new IssueNotFoundError(repoId, issueId);
		}
		throw e;
	}
}

export async function createIssue(repoId: string, dto: CreateIssueDto): Promise<Issue> {
	const repo = await appConfig.getRepo(repoId);
	if (!repo) throw new Error('Repository not found');

	// Generate new issue ID
	const nextId = repo.config.nextId || 1;
	const issueId = `${repo.config.prefix}-${nextId}`;

	const issue: Issue = {
		id: issueId,
		title: dto.title,
		type: dto.type || 'task',
		status: 'open',
		priority: dto.priority ?? 2,
		created: new Date().toISOString().split('T')[0],
		description: dto.description || '',
		labels: dto.labels || [],
		blockedBy: [],
		blocks: [],
		parentId: dto.parentId,
		filePath: path.join(repo.path, '.beads', 'issues', `${issueId}.md`)
	};

	// Write issue file
	const issuesDir = path.join(repo.path, '.beads', 'issues');
	await fs.mkdir(issuesDir, { recursive: true });
	await fs.writeFile(issue.filePath, serializeIssue(issue), 'utf-8');

	// Update nextId in config
	await appConfig.updateRepo(repoId, {
		config: { ...repo.config, nextId: nextId + 1 }
	});

	return issue;
}

export async function updateIssue(repoId: string, issueId: string, dto: UpdateIssueDto): Promise<Issue> {
	const existing = await getIssue(repoId, issueId);

	const updated: Issue = {
		...existing,
		...dto,
		updated: new Date().toISOString().split('T')[0]
	};

	if (dto.status === 'closed' && existing.status !== 'closed') {
		updated.closed = new Date().toISOString().split('T')[0];
	}

	await fs.writeFile(existing.filePath, serializeIssue(updated), 'utf-8');

	return updated;
}

export async function deleteIssue(repoId: string, issueId: string): Promise<void> {
	const issue = await getIssue(repoId, issueId);
	await fs.unlink(issue.filePath);
}

// Enrich a repo with issue counts
export async function enrichRepoWithCounts<T extends { id: string }>(repo: T): Promise<T & { issueCount: number; openCount: number }> {
	try {
		// Load all issues to get accurate counts (no pagination limit)
		const repoData = await appConfig.getRepo(repo.id);
		if (!repoData) {
			return { ...repo, issueCount: 0, openCount: 0 };
		}

		const issues = await loadIssuesFromJsonl(repoData.path);
		const openCount = issues.filter(i => i.status !== 'closed').length;

		return {
			...repo,
			issueCount: issues.length,
			openCount
		};
	} catch (e) {
		console.error(`Failed to enrich repo ${repo.id}:`, e);
		return {
			...repo,
			issueCount: 0,
			openCount: 0
		};
	}
}

// Enrich multiple repos in parallel
export async function enrichReposWithCounts<T extends { id: string }>(repos: T[]): Promise<(T & { issueCount: number; openCount: number })[]> {
	return Promise.all(repos.map(enrichRepoWithCounts));
}
