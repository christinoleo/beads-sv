import type { PageServerLoad } from './$types';
import { appConfig } from '$lib/server/services/app-config';

export const load: PageServerLoad = async () => {
	const repos = await appConfig.getRepos();
	return {
		repos
	};
};
