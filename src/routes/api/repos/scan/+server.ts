import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { appConfig } from '$lib/server/services/app-config';
import { scanForBeadsRepos } from '$lib/server/services/repo-validator';
import type { ImportResult } from '$lib/types/beads';
import path from 'node:path';

// POST /api/repos/scan - Scan folder for beads repos (preview, don't import)
export const POST: RequestHandler = async ({ request }) => {
	const { folderPath, recursive = true } = await request.json();

	if (!folderPath) {
		throw error(400, { message: 'Folder path is required' });
	}

	const result: ImportResult = {
		imported: [],
		skipped: [],
		errors: []
	};

	// Scan for repos
	let found: { path: string; config: { prefix: string } }[];
	try {
		found = await scanForBeadsRepos(folderPath, { recursive });
	} catch (e) {
		throw error(400, { message: `Cannot scan folder: ${(e as Error).message}` });
	}

	// Get existing repos
	const existingRepos = await appConfig.getRepos();
	const existingPaths = new Set(existingRepos.map((r) => r.path));

	// Create preview result (don't actually import)
	for (const { path: repoPath, config } of found) {
		if (existingPaths.has(repoPath)) {
			result.skipped.push(repoPath);
			continue;
		}

		// Create a preview repo object (without actually adding it)
		result.imported.push({
			id: crypto.randomUUID(), // temporary ID for preview
			path: repoPath,
			name: path.basename(repoPath),
			config,
			lastSyncedAt: new Date().toISOString(),
			isValid: true
		});
	}

	return json({
		success: true,
		data: result
	});
};
