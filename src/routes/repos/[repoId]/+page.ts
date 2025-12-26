import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	redirect(307, `/repos/${params.repoId}/issues`);
};
