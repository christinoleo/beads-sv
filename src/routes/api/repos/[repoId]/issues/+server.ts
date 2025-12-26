import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { listIssues, createIssue } from '$lib/server/services/issue-service';
import type {
	IssueFilter,
	IssueSort,
	IssueStatus,
	IssueType,
	Priority,
	CreateIssueDto
} from '$lib/types/beads';

// GET /api/repos/[repoId]/issues - List issues with filters
export const GET: RequestHandler = async ({ params, url }) => {
	const filter: IssueFilter = {
		status: url.searchParams.getAll('status') as IssueStatus[],
		type: url.searchParams.getAll('type') as IssueType[],
		priority: url.searchParams.getAll('priority').map(Number) as Priority[],
		labels: url.searchParams.getAll('label'),
		search: url.searchParams.get('search') || undefined,
		parentId: url.searchParams.get('parentId') || undefined
	};

	const sort: IssueSort = {
		field: (url.searchParams.get('sortBy') as IssueSort['field']) || 'created',
		direction: (url.searchParams.get('sortDir') as IssueSort['direction']) || 'desc'
	};

	const page = parseInt(url.searchParams.get('page') || '1', 10);
	const pageSize = parseInt(url.searchParams.get('pageSize') || '50', 10);

	try {
		const result = await listIssues(params.repoId, { filter, sort, page, pageSize });
		return json({ success: true, data: result });
	} catch (e) {
		if ((e as Error).message === 'Repository not found') {
			throw error(404, { message: 'Repository not found' });
		}
		throw e;
	}
};

// POST /api/repos/[repoId]/issues - Create new issue
export const POST: RequestHandler = async ({ params, request }) => {
	const dto: CreateIssueDto = await request.json();

	if (!dto.title) {
		throw error(400, { message: 'Title is required' });
	}

	try {
		const issue = await createIssue(params.repoId, dto);
		return json({ success: true, data: issue }, { status: 201 });
	} catch (e) {
		if ((e as Error).message === 'Repository not found') {
			throw error(404, { message: 'Repository not found' });
		}
		throw e;
	}
};
