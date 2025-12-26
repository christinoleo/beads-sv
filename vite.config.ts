import devtoolsJson from 'vite-plugin-devtools-json';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { socketIOPlugin } from './src/lib/server/socket';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), devtoolsJson(), socketIOPlugin()]
});
