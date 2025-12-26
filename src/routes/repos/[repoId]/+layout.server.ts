import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { appConfig } from '$lib/server/services/app-config';

export const load: LayoutServerLoad = async ({ params }) => {
	const repo = await appConfig.getRepo(params.repoId);

	if (!repo) {
		throw error(404, {
			message: 'Repository not found'
		});
	}

	return {
		repo
	};
};
