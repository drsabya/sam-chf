// src/routes/apis/create-participant/+server.ts
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { db } from '$lib/firebase';
import {
	addDoc,
	collection,
	getDocs,
	limit,
	orderBy,
	query,
	serverTimestamp
} from 'firebase/firestore';

export const POST: RequestHandler = async () => {
	try {
		const participantsRef = collection(db, 'participants');

		// Get latest screeningNumber (or parse from screeningId) to determine the next one
		const q = query(participantsRef, orderBy('screeningNumber', 'desc'), limit(1));
		const snapshot = await getDocs(q);

		let nextNumber = 1;

		if (!snapshot.empty) {
			const lastDoc = snapshot.docs[0];
			const data = lastDoc.data() as { screeningNumber?: number; screeningId?: string };

			if (typeof data.screeningNumber === 'number') {
				nextNumber = data.screeningNumber + 1;
			} else if (typeof data.screeningId === 'string') {
				const match = data.screeningId.match(/^S(\d+)$/i);
				if (match) {
					nextNumber = Number(match[1]) + 1;
				}
			}
		}

		const screeningId = `S${nextNumber}`;
		const screeningNumber = nextNumber;

		// Default participant document
		const participantData = {
			screeningId,
			screeningNumber,
			firstName: '',
			middleName: '',
			lastName: '',
			education: '',
			randomised: false,
			createdAt: serverTimestamp()
		};

		const docRef = await addDoc(participantsRef, participantData);

		return json(
			{
				success: true,
				participantId: docRef.id,
				screeningId,
				screeningNumber
			},
			{ status: 201 }
		);
	} catch (error: unknown) {
		console.error('Error creating participant:', error);

		const message =
			error && typeof error === 'object' && 'message' in error
				? String((error as { message?: string }).message)
				: 'Failed to create participant';

		return json({ error: message }, { status: 500 });
	}
};
