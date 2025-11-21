// src/routes/apis/visits/visit1/+server.ts

import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import admin from 'firebase-admin';
import { adminDb } from '$lib/server/firebase-admin';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json().catch(() => ({}));
		const participantId: string | undefined = body?.participantId;

		if (!participantId) {
			return json(
				{
					ok: false,
					error: 'Missing participantId in request body.'
				},
				{ status: 400 }
			);
		}

		const visitsRef = adminDb.collection('visits');

		// START DATE = NOW
		const start = new Date();

		// DUE DATE = 14 DAYS FROM NOW
		const due = new Date(start);
		due.setDate(due.getDate() + 14);

		// 1️⃣ Create Visit 1 with Firestore Timestamps
		const docRef = await visitsRef.add({
			participantId,
			visitNumber: 1,
			startDate: admin.firestore.Timestamp.fromDate(start),
			dueDate: admin.firestore.Timestamp.fromDate(due),
			completedOn: null,

			// Visit 1 documents
			safetySrc: null,
			efficacySrc: null,
			prescriptionSrc: null,
			signatureSrc: null,
			echoSrc: null,
			ecgSrc: null,
			uptSrc: null,
			questionnaireVariant: null,
			hospitalizationEvents: null,
			worseningEvents: null,
			death: false,

			createdAt: admin.firestore.Timestamp.now()
		});

		return json(
			{
				ok: true,
				visitId: docRef.id,
				visitNumber: 1,
				participantId
			},
			{ status: 201 }
		);
	} catch (err: unknown) {
		console.error('Error creating Visit 1:', err);

		const message =
			err && typeof err === 'object' && 'message' in err
				? String((err as { message?: string }).message)
				: 'Failed to create Visit 1.';

		return json(
			{
				ok: false,
				error: message
			},
			{ status: 500 }
		);
	}
};
