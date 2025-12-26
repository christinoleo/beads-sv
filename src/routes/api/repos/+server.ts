import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { appConfig } from '$lib/server/services/app-config';
import { validateBeadsRepo } from '$lib/server/services/repo-validator';
import type { AddRepoDto } from '$lib/types/beads';

// GET /api/repos - List all managed repos
export const GET: RequestHandler = async () => {
	const repos = await appConfig.getRepos();
	return json({ success: true, data: repos });
};

// POST /api/repos - Add a new repo
export const POST: RequestHandler = async ({ request }) => {
	const dto: AddRepoDto = await request.json();

	if (!dto.path) {
		throw error(400, { message: 'Path is required' });
	}

	// Validate the path is a valid beads repo
	const validation = await validateBeadsRepo(dto.path);
	if (!validation.isValid) {
		throw error(400, { message: validation.error || 'Invalid beads repository' });
	}

	try {
		const repo = await appConfig.addRepo({
			...dto,
			config: validation.config!
		});
		return json({ success: true, data: repo }, { status: 201 });
	} catch (e) {
		if ((e as Error).message === 'Repository already managed') {
			throw error(409, { message: 'Repository already managed' });
		}
		throw e;
	}
};
