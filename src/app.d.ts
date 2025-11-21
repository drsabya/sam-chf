// src/app.d.ts
// See https://kit.svelte.dev/docs/types#app

declare global {
	namespace App {
		interface Locals {
			// Set in src/hooks.server.ts
			user: {
				uid: string;
				email: string | null;
				name: string | null;
				picture: string | null;
			} | null;

			// One of your trial roles, or null if unknown/unauthorised
			role: 'admin' | 'pi' | 'coordinator' | 'data_entry' | 'viewer' | 'vendor' | 'lab' | null;
		}

		// You can extend other interfaces later if needed:
		// interface PageData {}
		// interface Error {}
		// interface PageState {}
	}
}

export {};
