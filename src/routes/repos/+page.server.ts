import type { PageServerLoad } from './$types';
import { appConfig } from '$lib/server/services/app-config';
import { enrichReposWithCounts } from '$lib/server/services/issue-service';

export const load: PageServerLoad = async () => {
	const repos = await appConfig.getRepos();
	const enrichedRepos = await enrichReposWithCounts(repos);
	return {
		repos: enrichedRepos
	};
};
