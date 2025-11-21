import { json, error } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase-admin';

export const POST = async ({ request }) => {
	try {
		const { visitId, field, objectKey } = await request.json();

		if (!visitId || !field || !objectKey) {
			throw error(400, 'Missing required fields');
		}

		// Updated field name (e.g., healthcareSrc, safetySrc)
		const firestoreField = `${field}Src`;

		await adminDb
			.collection('visits')
			.doc(visitId)
			.update({
				[firestoreField]: objectKey
			});

		return json({ ok: true });
	} catch (err) {
		console.error('Upload save failed:', err);
		throw error(500, 'Failed to save upload info');
	}
};
