// src/routes/apis/visit1/conclude/+server.ts
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { db } from '$lib/firebase';
import {
	doc,
	getDoc,
	updateDoc,
	collection,
	getDocs,
	query,
	orderBy,
	limit,
	addDoc,
	serverTimestamp
} from 'firebase/firestore';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json().catch(() => ({}));
		const { visitId } = body as { visitId?: string };

		if (!visitId) {
			return json({ error: 'visitId is required' }, { status: 400 });
		}

		// 1. Load Visit 1 document
		const visitRef = doc(db, 'visits', visitId);
		const visitSnap = await getDoc(visitRef);

		if (!visitSnap.exists()) {
			return json({ error: 'Visit not found' }, { status: 404 });
		}

		const visitData = visitSnap.data() as any;

		if (visitData.visit_number !== 1) {
			// Not strictly required, but safer
			return json({ error: 'Only Visit 1 can be concluded via this endpoint.' }, { status: 400 });
		}

		const participantId: string | undefined = visitData.participantId;
		if (!participantId) {
			return json(
				{ error: 'Visit document is missing participantId. Cannot conclude.' },
				{ status: 400 }
			);
		}

		// 2 & 3. Compute next randomizedId and update participant
		const participantsRef = collection(db, 'participants');

		const qMax = query(participantsRef, orderBy('randomizedId', 'desc'), limit(1));
		const maxSnap = await getDocs(qMax);

		let nextRandomizedId = 1;

		if (!maxSnap.empty) {
			const topDoc = maxSnap.docs[0].data() as any;
			const current =
				typeof topDoc.randomizedId === 'number'
					? topDoc.randomizedId
					: parseInt(topDoc.randomizedId ?? '0', 10);

			if (!Number.isNaN(current) && current > 0) {
				nextRandomizedId = current + 1;
			}
		}

		const participantRef = doc(db, 'participants', participantId);

		await updateDoc(participantRef, {
			randomizedId: nextRandomizedId
		});

		// 2. Mark visit 1 as completed (and optionally store randomizedId on visit also)
		await updateDoc(visitRef, {
			completed: true,
			randomizedId: nextRandomizedId,
			updatedAt: serverTimestamp()
		});

		// 4. Create Visit 2 based on Visit 1 data
		const visitsRef = collection(db, 'visits');

		// Shallow copy Visit 1 data
		const newVisitData: any = {
			...visitData,
			visit_number: 2,
			completed: false,
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp()
		};

		// Remove any fields you definitely don't want to copy
		delete newVisitData.id;
		delete newVisitData.__name__;

		const newVisitRef = await addDoc(visitsRef, newVisitData);

		return json({
			success: true,
			randomizedId: nextRandomizedId,
			visit2Id: newVisitRef.id
		});
	} catch (err) {
		console.error('Error concluding Visit 1:', err);
		return json(
			{
				error: 'Could not conclude Visit 1 and create Visit 2. Please try again.'
			},
			{ status: 500 }
		);
	}
};
