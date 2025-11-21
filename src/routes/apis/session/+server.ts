// src/routes/api/session/+server.ts
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { adminAuth } from '$lib/server/firebase-admin';

const EXPIRES_IN_MS = 5 * 24 * 60 * 60 * 1000; // 5 days
const EXPIRES_IN_SEC = EXPIRES_IN_MS / 1000;

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const { idToken } = await request.json();

		if (!idToken || typeof idToken !== 'string') {
			return json({ error: 'Missing idToken' }, { status: 400 });
		}

		// Optional but nice sanity check
		await adminAuth.verifyIdToken(idToken);

		const sessionCookie = await adminAuth.createSessionCookie(idToken, {
			expiresIn: EXPIRES_IN_MS
		});

		cookies.set('__session', sessionCookie, {
			path: '/',
			httpOnly: true,
			secure: false, // you can switch to true in production with https
			sameSite: 'lax',
			maxAge: EXPIRES_IN_SEC
		});

		return json({ status: 'ok' });
	} catch (err) {
		console.error('Failed to create session cookie:', err);
		return json({ error: 'Failed to create session cookie' }, { status: 401 });
	}
};

export const DELETE: RequestHandler = async ({ cookies }) => {
	cookies.delete('__session', { path: '/' });
	return json({ status: 'logged_out' });
};
