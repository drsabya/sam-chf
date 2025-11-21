export type VisitType = {
	id: string;
	participantId: string;
	visitNumber: number;
	startDate: string;
	dueDate: string;
	// scheduledOn: string | null; // 👉 default null when not scheduled
	completedOn: string | null; // 👉 default null when visit not completed

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
