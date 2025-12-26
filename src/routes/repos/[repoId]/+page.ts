import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	// Redirect to dashboard (epics) as the default landing page
	redirect(307, `/repos/${params.repoId}/epics`);
};
