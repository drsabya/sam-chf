// src/routes/apis/participant/create/+server.ts

import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import admin from 'firebase-admin';
import { adminDb } from '$lib/server/firebase-admin';

/**
 * Extract trailing number from: "S1", "S23", "3", etc.
 */
function extractScreeningNumber(raw: unknown): number {
	if (!raw) return 0;

	if (typeof raw === 'number' && Number.isFinite(raw)) {
		return raw;
	}

	if (typeof raw === 'string') {
		const match = raw.match(/\d+$/);
		if (match) {
			const n = parseInt(match[0], 10);
			return Number.isFinite(n) ? n : 0;
		}
	}

	return 0;
}

export const POST: RequestHandler = async () => {
	try {
		const participantsRef = adminDb.collection('participants');

		// 1️⃣ Read all participants → compute next screening number
		const snapshot = await participantsRef.get();
		let maxNumber = 0;

		snapshot.forEach((docSnap) => {
			const data = docSnap.data() as { screeningId?: unknown };
			const n = extractScreeningNumber(data.screeningId);
			if (n > maxNumber) maxNumber = n;
		});

		const nextNumber = maxNumber + 1;
		const nextScreeningId = `S${nextNumber}`;

		// 2️⃣ Create new participant
		const now = new Date();

		const docRef = await participantsRef.add({
			firstName: '',
			middleName: '',
			lastName: '',
			phone: '',
			alternatePhone: '',
			initials: '',
			age: 0,
			sex: '',
			address: '',
			education: '',
			occupation: '',
			income: 0,

			createdAt: admin.firestore.Timestamp.fromDate(now),
			createdBy: null,
			signatureSrc: null,

			screeningId: nextScreeningId,
			screeningFailure: false,

			randomizationId: null, // string | null logically, stored as nullable
			randomizationCode: null
		});

		return json(
			{
				ok: true,
				participantId: docRef.id,
				screeningId: nextScreeningId
			},
			{ status: 201 }
		);
	} catch (err: any) {
		console.error('Error creating participant:', err);

		return json(
			{
				ok: false,
				error: err?.message ?? 'Failed to create participant.'
			},
			{ status: 500 }
		);
	}
};
