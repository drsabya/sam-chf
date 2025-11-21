// src/routes/visits/visit1/[id]/+page.server.ts
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase-admin';

export type VisitType = {
	id: string;
	participantId: string;
	visitNumber: number;
	startDate: string;
	dueDate: string;
	scheduledOn?: string | null;
	completedOn?: string | null;

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

export type ParticipantLite = {
	id: string;
	screeningId: number | null;
	firstName: string;
	middleName?: string;
	lastName: string;
	initials: string;
	phone: string;
	randomizationId: number | null;
};

/** Normalize Firestore Timestamp | string | Date → ISO string */
function norm(value: any): string {
	if (!value) return '';
	if (value instanceof Date) return value.toISOString();
	if (typeof value?.toDate === 'function') return value.toDate().toISOString();
	if (typeof value === 'string') return value;
	return '';
}

/** Normalize nullable date fields */
function normNullable(value: any): string | null {
	const v = norm(value);
	return v || null;
}

export const load = (async ({ params }) => {
	const { id } = params;
	if (!id) throw error(400, 'Missing visit id');

	// -------------------------------
	// 1) FETCH VISIT (Admin SDK)
	// -------------------------------
	const visitSnap = await adminDb.collection('visits').doc(id).get();
	if (!visitSnap.exists) throw error(404, 'Visit not found');

	const data = visitSnap.data() as FirebaseFirestore.DocumentData;

	const visit: VisitType = {
		id: visitSnap.id,
		participantId: (data.participantId as string) ?? (data.participant_id as string) ?? '',

		visitNumber: typeof data.visitNumber === 'number' ? data.visitNumber : (data.visit_number ?? 1),

		startDate: norm(data.startDate ?? data.start_date ?? data.createdAt),
		dueDate: norm(data.dueDate ?? data.due_date),
		scheduledOn: normNullable(data.scheduledOn ?? data.scheduled_on),
		completedOn: normNullable(data.completedOn ?? data.completed_on),

		// DOCUMENT UPLOADS
		safetySrc: data.safetySrc ?? data.safety_src ?? null,
		efficacySrc: data.efficacySrc ?? data.efficacy_src ?? null,
		prescriptionSrc: data.prescriptionSrc ?? data.prescription_src ?? null,
		signatureSrc: data.signatureSrc ?? data.signature_src ?? null,
		echoSrc: data.echoSrc ?? data.echo_src ?? null,
		ecgSrc: data.ecgSrc ?? data.ecg_src ?? null,
		uptSrc: data.uptSrc ?? data.upt_src ?? null,

		// OTHER FIELDS
		questionnaireVariant:
			typeof data.questionnaireVariant === 'number'
				? data.questionnaireVariant
				: (data.questionnaire_variant ?? null),

		hospitalizationEvents:
			typeof data.hospitalizationEvents === 'number'
				? data.hospitalizationEvents
				: (data.hospitalization_events ?? null),

		worseningEvents:
			typeof data.worseningEvents === 'number'
				? data.worseningEvents
				: (data.worsening_events ?? null),

		death: data.death ?? false
	};

	// ------------------------------------
	// 2) FETCH PARTICIPANT DETAILS
	// ------------------------------------
	const participantId = visit.participantId;
	if (!participantId) throw error(500, 'Visit missing participantId');

	const pSnap = await adminDb.collection('participants').doc(participantId).get();
	if (!pSnap.exists) throw error(404, 'Participant not found');

	const p = pSnap.data() as FirebaseFirestore.DocumentData;

	const participant: ParticipantLite = {
		id: pSnap.id,
		screeningId: p.screeningId ?? p.screening_id ?? null,
		firstName: p.firstName ?? '',
		middleName: p.middleName ?? '',
		lastName: p.lastName ?? '',
		initials: p.initials ?? '',
		phone: p.phone ?? '',
		randomizationId: p.randomizationId ?? p.randomization_id ?? null
	};

	return {
		visit,
		participant
	};
}) satisfies PageServerLoad;
