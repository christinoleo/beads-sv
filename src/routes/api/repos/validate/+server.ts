import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateBeadsRepo } from '$lib/server/services/repo-validator';

// POST /api/repos/validate - Validate a path as a beads repo
export const POST: RequestHandler = async ({ request }) => {
	const { path } = await request.json();

	if (!path) {
		throw error(400, { message: 'Path is required' });
	}

	const validation = await validateBeadsRepo(path);
	return json({ success: true, data: validation });
};
