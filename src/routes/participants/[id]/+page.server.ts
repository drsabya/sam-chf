// src/routes/participants/[id]/+page.server.ts

import type { PageServerLoad, Actions } from './$types';
import { error, fail } from '@sveltejs/kit';
import admin from 'firebase-admin';
import { adminDb } from '$lib/server/firebase-admin';

// -------------------------------------------
// What we expose to the page
// -------------------------------------------
type ParticipantData = {
	id: string;
	screeningId: string;
	createdAt: string | null;
	firstName: string;
	middleName: string;
	lastName: string;
	initials: string;
	address: string;
	phone: string;
	alternatePhone: string;
	sex: string;
	age: number | null;
	education: string;
	occupation: string;
	income: number | null;
	screenedOn: string | null;
};

type VisitSummary = {
	id: string;
	visitNumber: number;
	startDate: string | null;
	dueDate: string | null;
	completedOn: string | null;
};

// -------------------------------------------
// Helpers
// -------------------------------------------
function formatScreenedOn(dateString: string | null): string | null {
	if (!dateString) return null;
	const d = new Date(dateString);
	return d.toLocaleDateString('en-IN', {
		day: '2-digit',
		month: 'short',
		year: 'numeric'
	});
}

function computeInitials(firstName: string, middleName: string, lastName: string): string {
	const f = firstName?.trim().charAt(0) ?? '';
	const m = middleName?.trim().charAt(0) ?? '';
	const l = lastName?.trim().charAt(0) ?? '';
	return (f + m + l).toUpperCase();
}

function tsToIso(value: unknown): string | null {
	if (!value) return null;

	if (value instanceof admin.firestore.Timestamp) {
		return value.toDate().toISOString();
	}
	if (value instanceof Date) {
		return value.toISOString();
	}
	if (typeof value === 'string') {
		return value;
	}
	return null;
}

// -------------------------------------------
// LOAD
// -------------------------------------------
export const load = (async ({ params }) => {
	const { id } = params;
	if (!id) throw error(400, 'Missing participant id');

	// ----- 1. Load participant via adminDb -----
	const ref = adminDb.collection('participants').doc(id);
	const snap = await ref.get();

	if (!snap.exists) throw error(404, 'Participant not found');

	const data = snap.data() as Record<string, any>;

	const createdAtIso = tsToIso(data.createdAt);

	const firstName = data.firstName ?? '';
	const middleName = data.middleName ?? '';
	const lastName = data.lastName ?? '';
	const initials = data.initials ?? computeInitials(firstName, middleName, lastName);

	const participant: ParticipantData = {
		id,
		screeningId: data.screeningId ?? '',
		createdAt: createdAtIso,
		firstName,
		middleName,
		lastName,
		initials,
		address: data.address ?? '',
		phone: data.phone ?? '',
		alternatePhone: data.alternatePhone ?? '',
		sex: data.sex ?? '',
		age: typeof data.age === 'number' ? data.age : null,
		education: data.education ?? '',
		occupation: data.occupation ?? '',
		income: typeof data.income === 'number' ? data.income : null,
		screenedOn: formatScreenedOn(createdAtIso)
	};

	// ----- 2. Load visits via adminDb -----
	const visitsSnap = await adminDb.collection('visits').where('participantId', '==', id).get();

	const visits: VisitSummary[] = visitsSnap.docs.map((docSnap) => {
		const v = docSnap.data() as Record<string, any>;

		const startDateIso = tsToIso(v.startDate);
		const dueDateIso = tsToIso(v.dueDate);
		const completedOnIso = tsToIso(v.completedOn);

		return {
			id: docSnap.id,
			visitNumber: typeof v.visitNumber === 'number' ? v.visitNumber : NaN,
			startDate: startDateIso,
			dueDate: dueDateIso,
			completedOn: completedOnIso
		};
	});

	const hasVisit1 = visits.some((v) => v.visitNumber === 1);

	return { participant, visits, hasVisit1 };
}) satisfies PageServerLoad;

// -------------------------------------------
// ACTIONS
// -------------------------------------------
export const actions: Actions = {
	save: async ({ request, params }) => {
		const { id } = params;
		if (!id) throw error(400, 'Missing participant id');

		const formData = await request.formData();

		const firstName = String(formData.get('firstName') ?? '').trim();
		const middleName = String(formData.get('middleName') ?? '').trim();
		const lastName = String(formData.get('lastName') ?? '').trim();
		const address = String(formData.get('address') ?? '').trim();
		const phone = String(formData.get('phone') ?? '').trim();
		const sex = String(formData.get('sex') ?? '').trim();
		const education = String(formData.get('education') ?? '').trim();
		const occupation = String(formData.get('occupation') ?? '').trim();

		const ageRaw = String(formData.get('age') ?? '').trim();
		const incomeRaw = String(formData.get('income') ?? '').trim();

		const age = ageRaw === '' ? null : Number(ageRaw);
		const income = incomeRaw === '' ? null : Number(incomeRaw);

		const initials = computeInitials(firstName, middleName, lastName);

		try {
			await adminDb.collection('participants').doc(id).update({
				firstName,
				middleName,
				lastName,
				address,
				phone,
				sex,
				education,
				occupation,
				age,
				income,
				initials
			});

			return { success: true };
		} catch (err) {
			console.error('Error updating participant:', err);
			return fail(500, {
				error: 'Could not save participant details. Please try again.'
			});
		}
	}
};
