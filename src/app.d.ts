// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			session: import('@supabase/supabase-js').Session | null;
		}
		// interface PageData {}
		// interface Platform {}
	}

	interface Window {
		google: typeof google;
	}
}

/// <reference types="@types/google.maps" />

export {};
