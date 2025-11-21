// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';
import { adminAuth, adminDb } from '$lib/server/firebase-admin';

const VALID_ROLES = [
	'admin',
	'pi',
	'coordinator',
	'data_entry',
	'viewer',
	'vendor',
	'lab'
] as const;

type Role = (typeof VALID_ROLES)[number];

export const handle: Handle = async ({ event, resolve }) => {
	// Default: unauthenticated
	event.locals.user = null;
	event.locals.role = null;

	// Get Firebase session cookie (set by your login flow later)
	const sessionCookie = event.cookies.get('__session');

	if (!sessionCookie) {
		// No cookie → anonymous request
		return resolve(event);
	}

	try {
		// Verify the session cookie (true = check revocation)
		const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);

		// Attach basic Firebase user info to locals
		event.locals.user = {
			uid: decodedClaims.uid,
			email: decodedClaims.email ?? null,
			name: decodedClaims.name ?? null,
			picture: decodedClaims.picture ?? null
		};

		// Look up role from /users/{uid}
		const userDocRef = adminDb.collection('users').doc(decodedClaims.uid);
		const userDocSnap = await userDocRef.get();

		if (userDocSnap.exists) {
			const data = userDocSnap.data() as { role?: string | null };

			const maybeRole = data.role;
			if (maybeRole && (VALID_ROLES as readonly string[]).includes(maybeRole)) {
				// TS now knows this is a valid Role
				event.locals.role = maybeRole as Role;
			} else {
				// Unknown / bad role → treat as no role
				event.locals.role = null;
			}
		} else {
			// No user doc → treat as unauthorised later in page loads
			event.locals.role = null;
		}
	} catch (err) {
		console.warn('🔐 Invalid or expired session cookie:', err);

		// Clear bad/expired cookie
		event.cookies.delete('__session', { path: '/' });

		// Keep locals.user = null, locals.role = null
	}

	return resolve(event);
};
