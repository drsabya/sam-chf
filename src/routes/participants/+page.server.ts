// src/routes/participants/+page.server.ts
import type { PageServerLoad } from './$types';
import { adminDb } from '$lib/server/firebase-admin';

type ParticipantListItem = {
	id: string;
	firstName: string;
	middleName?: string;
	lastName: string;
	screeningId: string;
	randomizationId: string | null;
};

export const load = (async () => {
	const snapshot = await adminDb.collection('participants').get();

	// Step 1: Convert docs → raw array
	const raw = snapshot.docs.map((doc) => {
		const data = doc.data() as any;

		return {
			id: doc.id,
			firstName: data.firstName ?? '',
			middleName: data.middleName ?? '',
			lastName: data.lastName ?? '',
			screeningId: data.screeningId ?? null,
			randomizationId: data.randomizationId !== undefined ? data.randomizationId : null
		};
	});

	// Step 2: Filter out rows with no screeningId
	const participants: ParticipantListItem[] = raw
		.filter((p) => p.screeningId !== null)
		// Step 3: Sort by numeric portion of S1, S2, S3...
		.sort((a, b) => {
			const aNum = parseInt(a.screeningId.replace(/\D/g, ''), 10) || 0;
			const bNum = parseInt(b.screeningId.replace(/\D/g, ''), 10) || 0;
			return bNum - aNum; // descending
		});

	return { participants };
}) satisfies PageServerLoad;
