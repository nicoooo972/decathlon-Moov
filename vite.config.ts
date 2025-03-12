import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { pwaConfiguration } from './pwa-config';

export default defineConfig({
	plugins: [
		tailwindcss(), 
		sveltekit(),
		SvelteKitPWA(pwaConfiguration)
	]
});
