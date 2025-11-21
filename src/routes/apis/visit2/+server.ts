// src/routes/apis/visit2/+server.ts
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { db } from '$lib/firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json().catch(() => ({}));
		const { participantId, fromVisitId } = body as {
			participantId?: string;
			fromVisitId?: string;
		};

		if (!participantId && !fromVisitId) {
			return json(
				{ error: 'At least participantId or fromVisitId must be provided.' },
				{ status: 400 }
			);
		}

		let baseData: any = null;
		let resolvedParticipantId: string | undefined = participantId;

		if (fromVisitId) {
			const baseRef = doc(db, 'visits', fromVisitId);
			const baseSnap = await getDoc(baseRef);

			if (!baseSnap.exists()) {
				return json({ error: 'Base visit not found.' }, { status: 404 });
			}

			baseData = baseSnap.data() as any;
			if (!resolvedParticipantId) {
				resolvedParticipantId = baseData.participantId;
			}
		}

		if (!resolvedParticipantId) {
			return json(
				{ error: 'Could not resolve participantId from input or base visit.' },
				{ status: 400 }
			);
		}

		const visitsRef = collection(db, 'visits');

		const payload: any = {
			...(baseData ?? {}),
			participantId: resolvedParticipantId,
			visit_number: 2,
			completed: false,
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp()
		};

		// Strip fields we should not duplicate
		delete payload.id;
		delete payload.__name__;

		const newRef = await addDoc(visitsRef, payload);

		return json({
			success: true,
			visit: {
				id: newRef.id,
				...payload
			}
		});
	} catch (err) {
		console.error('Error creating Visit 2:', err);
		return json({ error: 'Could not create Visit 2. Please try again.' }, { status: 500 });
	}
};
