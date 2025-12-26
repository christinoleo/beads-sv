import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { appConfig } from '$lib/server/services/app-config';

// GET /api/repos/[repoId] - Get single repo
export const GET: RequestHandler = async ({ params }) => {
	const repo = await appConfig.getRepo(params.repoId);
	if (!repo) {
		throw error(404, { message: 'Repository not found' });
	}
	return json({ success: true, data: repo });
};

// DELETE /api/repos/[repoId] - Remove repo from managed list
export const DELETE: RequestHandler = async ({ params }) => {
	const repo = await appConfig.getRepo(params.repoId);
	if (!repo) {
		throw error(404, { message: 'Repository not found' });
	}

	await appConfig.removeRepo(params.repoId);
	return json({ success: true });
};

// PATCH /api/repos/[repoId] - Update repo settings
export const PATCH: RequestHandler = async ({ params, request }) => {
	const repo = await appConfig.getRepo(params.repoId);
	if (!repo) {
		throw error(404, { message: 'Repository not found' });
	}

	const updates = await request.json();
	const updated = await appConfig.updateRepo(params.repoId, updates);

	return json({ success: true, data: updated });
};
