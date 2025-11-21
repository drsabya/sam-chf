// src/routes/apis/visits/visit1/scheduled/+server.ts
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase-admin';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { visitId, scheduledOn } = body as {
			visitId?: string;
			scheduledOn?: string;
		};

		if (!visitId || !scheduledOn) {
			return json({ ok: false, error: 'Missing visitId or scheduledOn' }, { status: 400 });
		}

		// Update Firestore document for this visit
		const ref = adminDb.collection('visits').doc(visitId);
		await ref.update({
			scheduledOn, // camelCase
			scheduled_on: scheduledOn // snake_case (for legacy)
		});

		return json({ ok: true });
	} catch (err) {
		console.error('Error updating scheduledOn:', err);
		return json({ ok: false, error: 'Failed to update scheduled date' }, { status: 500 });
	}
};
