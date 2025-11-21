// src/routes/apis/visit1/+server.ts
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { db } from '$lib/firebase';
import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const participantId: unknown = body?.participantId;

		if (!participantId || typeof participantId !== 'string') {
			return json({ error: 'participantId is required' }, { status: 400 });
		}

		// Reference to the `visits` collection
		const visitsRef = collection(db, 'visits');
		const visitRef = doc(visitsRef); // auto-generated ID

		// Use Firestore Timestamp explicitly
		const now = Timestamp.fromDate(new Date());
		const endDate = Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

		const visitData = {
			id: visitRef.id,
			participant_id: participantId,
			visit_number: 1,
			completed: false,
			created_at: now,
			end_date: endDate
		};

		await setDoc(visitRef, visitData);

		return json({ success: true, visit: visitData }, { status: 201 });
	} catch (error: unknown) {
		console.error('Error creating Visit 1:', error);

		const message =
			error && typeof error === 'object' && 'message' in error
				? String((error as { message?: string }).message)
				: 'Failed to create visit';

		// Bubble up the real error message so you see it in the UI
		return json({ error: message }, { status: 500 });
	}
};
