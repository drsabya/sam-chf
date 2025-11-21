// src/routes/+page.server.ts
import type { PageServerLoad } from './$types';
import { redirect, error } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase-admin';

/**
 * Shared domain types
 */
export type ParticipantType = {
	id: string;
	firstName: string;
	middleName?: string;
	lastName: string;
	phone: string;
	alternatePhone?: string;
	initials: string;
	age: number;
	sex: string;
	address: string;
	education: string;
	occupation: string;
	income: number;
	createdAt: string;
	createdBy?: string | null;
	signatureSrc?: string;
	screeningId?: number | null; // numeric part of "S1" → 1
	screeningFailure?: boolean;
	randomizationId?: number | null;
	randomizationCode?: string | null;
};

export type VisitType = {
	id: string;
	participantId: string;
	visitNumber: number;
	startDate: string;
	dueDate: string;
	completedOn?: string;

	// IMPORTANT DOCUMENTS
	safetySrc?: string | null;
	efficacySrc?: string | null;
	prescriptionSrc?: string | null;
	signatureSrc?: string | null;
	echoSrc?: string | null;
	ecgSrc?: string | null;
	uptSrc?: string | null;
	questionnaireVariant?: number | null;
	hospitalizationEvents?: number | null;
	worseningEvents?: number | null;
	death?: boolean;
};

type UpcomingVisitItem = {
	participantId: string;
	screeningId: number | null;
	createdAt: string;
	firstName: string;
	middleName?: string;
	lastName: string;
	address: string;
	dueDate: string; // ISO string
	isDeviation: boolean;
	visitNumber: number | null;
	visitId: string | null;
	status: string;
};

const ALLOWED_ROLES_FOR_DASHBOARD = [
	'admin',
	'pi',
	'coordinator',
	'data_entry',
	'viewer',
	'vendor',
	'lab'
] as const;

/**
 * Helper: normalise Firestore field (Timestamp | Date | string | null) to ISO string or ''.
 */
function toIsoString(value: any): string {
	if (!value) return '';

	// Admin SDK Timestamp
	if (typeof value.toDate === 'function') {
		return value.toDate().toISOString();
	}

	// Native Date
	if (value instanceof Date) {
		return value.toISOString();
	}

	// Already a string
	if (typeof value === 'string') {
		return value;
	}

	return '';
}

/**
 * Helper: extract trailing digits from "S1", "S23" etc. → number
 */
function extractScreeningNumberFromString(raw: string): number | null {
	const match = raw.match(/\d+$/);
	if (!match) return null;
	const n = parseInt(match[0], 10);
	return Number.isFinite(n) ? n : null;
}

export const load: PageServerLoad = async ({ locals }) => {
	// 0️⃣ Auth / RBAC checks from hooks.server.ts
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	if (!locals.role || !(ALLOWED_ROLES_FOR_DASHBOARD as readonly string[]).includes(locals.role)) {
		throw error(403, 'You do not have permission to view this dashboard.');
	}

	// 1️⃣ Load all participants (Admin SDK) as ParticipantType[]
	const participantsSnap = await adminDb
		.collection('participants')
		.orderBy('createdAt', 'desc')
		.get();

	const participants: ParticipantType[] = participantsSnap.docs.map((docSnap) => {
		const data = docSnap.data() as FirebaseFirestore.DocumentData;

		const createdAtIso: string = toIsoString(data.createdAt) || new Date().toISOString();

		// 🔹 screeningId is stored as "S1", "S2", ... → we keep numeric part here
		let screeningId: number | null = null;
		if (typeof data.screeningId === 'number') {
			screeningId = data.screeningId;
		} else if (typeof data.screeningId === 'string') {
			screeningId = extractScreeningNumberFromString(data.screeningId);
		}

		return {
			id: docSnap.id,
			firstName: data.firstName ?? '',
			middleName: data.middleName,
			lastName: data.lastName ?? '',
			phone: data.phone ?? '',
			alternatePhone: data.alternatePhone,
			initials: data.initials ?? '',
			age: typeof data.age === 'number' ? data.age : 0,
			sex: data.sex ?? '',
			address: data.address ?? '',
			education: data.education ?? '',
			occupation: data.occupation ?? '',
			income: typeof data.income === 'number' ? data.income : 0,
			createdAt: createdAtIso,
			createdBy: data.createdBy ?? null,
			signatureSrc: data.signatureSrc,
			screeningId,
			screeningFailure: data.screeningFailure ?? false,
			randomizationId:
				typeof data.randomizationId === 'number' || data.randomizationId === null
					? data.randomizationId
					: null,
			randomizationCode: typeof data.randomizationCode === 'string' ? data.randomizationCode : null
		};
	});

	// 2️⃣ Load all visits and group by participantId (Admin SDK) as VisitType[]
	const visitsSnap = await adminDb.collection('visits').get();

	const visitsByParticipant: Record<string, VisitType[]> = {};

	visitsSnap.forEach((docSnap) => {
		const data = docSnap.data() as FirebaseFirestore.DocumentData;
		const participantId: string | undefined = data.participantId;

		if (!participantId) return;

		const startDateIso: string = toIsoString(data.startDate);
		const dueDateIso: string = toIsoString(data.dueDate);
		const completedOnIso: string = toIsoString(data.completedOn);

		const visit: VisitType = {
			id: docSnap.id,
			participantId,
			visitNumber: typeof data.visitNumber === 'number' ? data.visitNumber : 0,
			startDate: startDateIso,
			dueDate: dueDateIso,
			completedOn: completedOnIso || undefined,
			safetySrc: data.safetySrc ?? null,
			efficacySrc: data.efficacySrc ?? null,
			prescriptionSrc: data.prescriptionSrc ?? null,
			signatureSrc: data.signatureSrc ?? null,
			echoSrc: data.echoSrc ?? null,
			ecgSrc: data.ecgSrc ?? null,
			uptSrc: data.uptSrc ?? null,
			questionnaireVariant:
				typeof data.questionnaireVariant === 'number' ? data.questionnaireVariant : null,
			hospitalizationEvents:
				typeof data.hospitalizationEvents === 'number' ? data.hospitalizationEvents : null,
			worseningEvents: typeof data.worseningEvents === 'number' ? data.worseningEvents : null,
			death: data.death ?? false
		};

		if (!visitsByParticipant[participantId]) {
			visitsByParticipant[participantId] = [];
		}
		visitsByParticipant[participantId].push(visit);
	});

	// 3️⃣ Build upcoming visit list per participant
	const nowMs = Date.now();
	const upcomingVisits: UpcomingVisitItem[] = [];

	for (const p of participants) {
		// Skip screening failures from the dashboard
		if (p.screeningFailure) continue;

		const visits = visitsByParticipant[p.id] ?? [];

		const hasVisit1 = visits.some((v) => v.visitNumber === 1);

		// Find earliest upcoming (no completedOn) visit with a dueDate
		const upcomingVisit = visits
			.filter((v) => !v.completedOn && v.dueDate)
			.sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];

		if (upcomingVisit && upcomingVisit.dueDate) {
			const dueMs = Date.parse(upcomingVisit.dueDate);
			const isDeviation = !Number.isNaN(dueMs) && dueMs < nowMs;

			upcomingVisits.push({
				participantId: p.id,
				screeningId: p.screeningId ?? null,
				createdAt: p.createdAt,
				firstName: p.firstName,
				middleName: p.middleName,
				lastName: p.lastName,
				address: p.address,
				dueDate: upcomingVisit.dueDate,
				isDeviation,
				visitNumber: upcomingVisit.visitNumber || null,
				visitId: upcomingVisit.id,
				status:
					upcomingVisit.visitNumber != null
						? `Upcoming Visit V${upcomingVisit.visitNumber}`
						: 'Upcoming visit'
			});
		} else if (!hasVisit1) {
			// No Visit 1 created at all → "Visit 1 not created" with due date = createdAt + 14 days
			const baseMs = Date.parse(p.createdAt);
			if (Number.isNaN(baseMs)) continue;

			const dueMs = baseMs + 14 * 24 * 60 * 60 * 1000;
			const dueDate = new Date(dueMs).toISOString();
			const isDeviation = dueMs < nowMs;

			upcomingVisits.push({
				participantId: p.id,
				screeningId: p.screeningId ?? null,
				createdAt: p.createdAt,
				firstName: p.firstName,
				middleName: p.middleName,
				lastName: p.lastName,
				address: p.address,
				dueDate,
				isDeviation,
				visitNumber: 1,
				visitId: null,
				status: 'Visit 1 not created'
			});
		}
	}

	// 4️⃣ Sort by due date (earliest first)
	upcomingVisits.sort((a, b) => Date.parse(a.dueDate) - Date.parse(b.dueDate));

	return {
		upcomingVisits
	};
};
