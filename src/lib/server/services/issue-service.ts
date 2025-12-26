import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Issue, IssueFilter, IssueSort, CreateIssueDto, UpdateIssueDto, PaginatedResponse } from '$lib/types/beads';
import { parseIssue, serializeIssue } from '$lib/server/parser/issue-parser';
import { appConfig } from './app-config';

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

	const issuesDir = path.join(repo.path, '.beads', 'issues');
	let issues: Issue[] = [];

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
