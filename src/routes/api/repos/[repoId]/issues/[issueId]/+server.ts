import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getIssue, updateIssue, deleteIssue, IssueNotFoundError } from '$lib/server/services/issue-service';
import type { UpdateIssueDto } from '$lib/types/beads';

// GET /api/repos/[repoId]/issues/[issueId] - Get single issue
export const GET: RequestHandler = async ({ params }) => {
	try {
		const issue = await getIssue(params.repoId, params.issueId);
		return json({ success: true, data: issue });
	} catch (e) {
		if (e instanceof IssueNotFoundError) {
			throw error(404, { message: 'Issue not found' });
		}
		if ((e as Error).message === 'Repository not found') {
			throw error(404, { message: 'Repository not found' });
		}
		throw e;
	}
};

// PATCH /api/repos/[repoId]/issues/[issueId] - Update issue
export const PATCH: RequestHandler = async ({ params, request }) => {
	const dto: UpdateIssueDto = await request.json();

	try {
		const issue = await updateIssue(params.repoId, params.issueId, dto);
		return json({ success: true, data: issue });
	} catch (e) {
		if (e instanceof IssueNotFoundError) {
			throw error(404, { message: 'Issue not found' });
		}
		if ((e as Error).message === 'Repository not found') {
			throw error(404, { message: 'Repository not found' });
		}
		throw e;
	}
};

// DELETE /api/repos/[repoId]/issues/[issueId] - Delete issue
export const DELETE: RequestHandler = async ({ params }) => {
	try {
		await deleteIssue(params.repoId, params.issueId);
		return json({ success: true });
	} catch (e) {
		if (e instanceof IssueNotFoundError) {
			throw error(404, { message: 'Issue not found' });
		}
		if ((e as Error).message === 'Repository not found') {
			throw error(404, { message: 'Repository not found' });
		}
		throw e;
	}
};
