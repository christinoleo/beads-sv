import type { LayoutServerLoad } from './$types';
import { appConfig } from '$lib/server/services/app-config';

export const load: LayoutServerLoad = async () => {
	const repos = await appConfig.getRepos();

	return {
		repos
	};
};
