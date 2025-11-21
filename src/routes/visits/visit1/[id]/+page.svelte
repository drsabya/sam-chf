<!-- src/routes/visits/visit1/[id]/+page.svelte -->
<script lang="ts">
	import type { PageProps } from './$types';
	import {
		Calendar,
		ArrowRight,
		UploadCloud,
		FileText,
		X,
		CloudUpload,
		Printer,
		Phone
	} from '@lucide/svelte';
	import { fade } from 'svelte/transition';
	import jsPDF from 'jspdf';

	let { data }: PageProps = $props();
	let visit = $state(data.visit);
	let participant = $state(data.participant);

	// ---- Derived helpers ----
	const fullName = $derived(
		[participant.firstName, participant.middleName, participant.lastName]
			.map((x) => x?.trim())
			.filter((x) => x && x.length > 0)
			.join(' ')
	);

	const hasRandomization = $derived(participant.randomizationId != null);

	// ---- R2 public base URL (for viewing files) ----
	const PUBLIC_R2_URL = 'https://pub-4cd2e47347704d5dab6e20a0bbd4b079.r2.dev';

	function getFileUrl(key?: string | null): string | null {
		if (!key) return null;
		return `${PUBLIC_R2_URL}/${key}`;
	}

	function getFileNameFromKey(key?: string | null): string | null {
		if (!key) return null;
		const parts = key.split('/');
		return parts[parts.length - 1] || null;
	}

	// ---- Print helper ----
	function printFromUrl(url: string | null) {
		if (!url) return;
		const win = window.open(url, '_blank');
		if (!win) return;
		win.addEventListener('load', () => {
			try {
				win.focus();
				win.print();
			} catch {
				// ignore print errors
			}
		});
	}

	// ---- Date helpers ----
	function formatLabel(dateIso: string): string {
		const d = new Date(dateIso);
		if (Number.isNaN(d.getTime())) return 'Not set';
		return d.toLocaleDateString('en-IN', {
			weekday: 'short',
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	}

	function getOpdDateOptions(startIso: string, endIso: string): { value: string; label: string }[] {
		const start = new Date(startIso);
		const end = new Date(endIso);
		if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];

		const results: { value: string; label: string }[] = [];
		const current = new Date(start);

		while (current <= end) {
			const day = current.getDay(); // 0=Sun,1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat

			// OPD days: Tue (2), Wed (3), Fri (5)
			if (day === 2 || day === 3 || day === 5) {
				const iso = current.toISOString();
				results.push({ value: iso, label: formatLabel(iso) });
			}

			current.setDate(current.getDate() + 1);
		}

		return results;
	}

	// ---- Dates & labels ----
	let dueDateLabel = $state('Not set');
	if (visit.dueDate) {
		dueDateLabel = formatLabel(visit.dueDate);
	}

	const opdDateOptions = getOpdDateOptions(visit.startDate, visit.dueDate);
	let scheduledOnValue = $state(visit.scheduledOn ?? opdDateOptions[0]?.value ?? '');
	let scheduledOnLabel = $state(scheduledOnValue ? formatLabel(scheduledOnValue) : 'Not scheduled');

	$effect(() => {
		if (scheduledOnValue) {
			scheduledOnLabel = formatLabel(scheduledOnValue);
		} else {
			scheduledOnLabel = 'Not scheduled';
		}
	});

	// ---- Save Scheduled On ----
	let savingScheduledOn = $state(false);
	let saveError = $state<string | null>(null);
	let saveSuccess = $state(false);

	async function saveScheduledOn() {
		if (!scheduledOnValue) return;
		savingScheduledOn = true;
		saveError = null;
		saveSuccess = false;

		try {
			const res = await fetch('/apis/visits/visit1/scheduled', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					visitId: visit.id,
					scheduledOn: scheduledOnValue
				})
			});

			const payload = await res.json().catch(() => ({}));

			if (!res.ok || !payload?.ok) {
				throw new Error(payload?.error || 'Failed to update scheduled date.');
			}

			saveSuccess = true;
		} catch (err) {
			saveError =
				err && typeof err === 'object' && 'message' in err
					? String((err as { message?: string }).message)
					: 'Failed to update scheduled date.';
		} finally {
			savingScheduledOn = false;
		}
	}

	// ---- Upload state (now supports multiple files per field) ----
	let ecgFiles: File[] = $state([]);
	let echoFiles: File[] = $state([]);
	let efficacyReportFiles: File[] = $state([]);
	let safetyReportFiles: File[] = $state([]);

	let uploadingField = $state<string | null>(null); // 'ecg' | 'echo' | 'efficacy' | 'safety'
	let lastUploadedField = $state<string | null>(null);
	let uploadError = $state<string | null>(null);

	// hidden inputs for re-upload
	let ecgReuploadInput: HTMLInputElement | null = null;
	let echoReuploadInput: HTMLInputElement | null = null;
	let efficacyReuploadInput: HTMLInputElement | null = null;
	let safetyReuploadInput: HTMLInputElement | null = null;

	function handleEcgFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			ecgFiles = [...ecgFiles, ...Array.from(target.files)];
		}
	}

	function clearEcgFiles() {
		ecgFiles = [];
	}

	function handleEchoFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			echoFiles = [...echoFiles, ...Array.from(target.files)];
		}
	}

	function clearEchoFiles() {
		echoFiles = [];
	}

	function handleEfficacyFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			efficacyReportFiles = [...efficacyReportFiles, ...Array.from(target.files)];
		}
	}

	function clearEfficacyFiles() {
		efficacyReportFiles = [];
	}

	function handleSafetyFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			safetyReportFiles = [...safetyReportFiles, ...Array.from(target.files)];
		}
	}

	function clearSafetyFiles() {
		safetyReportFiles = [];
	}

	function fileToDataURL(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = reject;
			reader.readAsDataURL(file);
		});
	}

	function loadImage(src: string): Promise<HTMLImageElement> {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => resolve(img);
			img.onerror = reject;
			img.src = src;
		});
	}

	function isImageFile(file: File): boolean {
		return file.type.startsWith('image/');
	}

	/**
	 * Converts one or more image files to a single multi-page PDF.
	 * - Each image maintains aspect ratio and fits within A4.
	 * - If there are NO image files: falls back to returning the first file as-is.
	 */
	async function convertFilesToSinglePdf(files: File[]): Promise<File> {
		if (files.length === 0) {
			throw new Error('No files to convert');
		}

		const imageFiles = files.filter(isImageFile);

		if (imageFiles.length === 0) {
			return files[0]; // fallback PDF
		}

		const pdf = new jsPDF({
			orientation: 'portrait',
			unit: 'pt',
			format: 'a4'
		});

		const pageWidth = pdf.internal.pageSize.getWidth(); // 595
		const pageHeight = pdf.internal.pageSize.getHeight(); // 842

		for (let i = 0; i < imageFiles.length; i++) {
			const imgFile = imageFiles[i];
			const dataUrl = await fileToDataURL(imgFile);
			const img = await loadImage(dataUrl);

			const imgW = img.naturalWidth || img.width;
			const imgH = img.naturalHeight || img.height;

			// ---- Maintain aspect ratio within A4 ----
			const scale = Math.min(pageWidth / imgW, pageHeight / imgH);
			const finalW = imgW * scale;
			const finalH = imgH * scale;

			// ---- Center image on A4 ----
			const x = (pageWidth - finalW) / 2;
			const y = (pageHeight - finalH) / 2;

			if (i > 0) pdf.addPage();

			pdf.addImage(dataUrl, imgFile.type === 'image/png' ? 'PNG' : 'JPEG', x, y, finalW, finalH);
		}

		const baseName = (imageFiles[0]?.name || files[0].name).replace(/\.\w+$/, '');
		const pdfBlob = pdf.output('blob');

		return new File([pdfBlob], `${baseName}.pdf`, {
			type: 'application/pdf'
		});
	}

	// ---- R2 upload helper (shared for all 4) ----
	async function uploadFileToR2(file: File, field: string) {
		if (!file) return null;

		uploadingField = field;
		uploadError = null;
		lastUploadedField = null;

		try {
			// 1️⃣ Ask backend for presigned URL
			const presignRes = await fetch('/apis/r2/presign', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					visitId: visit.id,
					field, // "ecg", "echo", "efficacy", "safety"
					filename: file.name
				})
			});

			const data = await presignRes.json();
			if (!data.ok) {
				throw new Error('Failed to get upload URL');
			}

			const { url, objectKey } = data;

			// 2️⃣ Upload file directly to R2
			const uploadRes = await fetch(url, {
				method: 'PUT',
				body: file
			});

			if (!uploadRes.ok) {
				throw new Error('Upload failed');
			}

			// 3️⃣ Save the R2 key to Firestore
			const saveRes = await fetch('/apis/visits/visit1/upload', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					visitId: visit.id,
					field, // this becomes ecgSrc, echoSrc, etc.
					objectKey
				})
			});

			const saveData = await saveRes.json().catch(() => ({}));
			if (!saveData.ok) {
				throw new Error('Upload saved in R2 but Firestore update failed');
			}

			// 4️⃣ Update local visit object so UI immediately shows uploaded state
			if (field === 'ecg') {
				visit.ecgSrc = objectKey;
			} else if (field === 'echo') {
				visit.echoSrc = objectKey;
			} else if (field === 'efficacy') {
				visit.efficacySrc = objectKey;
			} else if (field === 'safety') {
				visit.safetySrc = objectKey;
			}

			lastUploadedField = field;
			return objectKey;
		} catch (err: any) {
			console.error('Upload error:', err);
			uploadError =
				err && typeof err === 'object' && 'message' in err
					? String((err as { message?: string }).message)
					: 'Upload failed';
			return null;
		} finally {
			uploadingField = null;
		}
	}

	// ---- Voucher + disposition state ----
	let voucherStatus = $state<'given' | 'not_given' | ''>('');
	let disposition = $state<'success' | 'failure' | ''>('');

	const primaryButtonLabel = $derived(
		disposition === 'failure'
			? 'Conclude visit'
			: disposition === 'success' && !hasRandomization
				? 'Randomize patient'
				: 'Continue'
	);

	const primaryButtonColorClasses = $derived(
		disposition === 'failure'
			? 'bg-red-600 hover:bg-red-500 disabled:bg-red-300'
			: 'bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-300'
	);
</script>

<main class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6">
	<div class="w-full max-w-lg space-y-8">
		<header class="space-y-4 text-center">
			<div class="space-y-1">
				<p class="text-xs font-bold tracking-widest text-gray-400 uppercase">Screening Phase</p>

				<!-- V1 + initials + IDs in one line -->
				<div class="flex flex-wrap items-center justify-center gap-3">
					<h1 class="font-bold tracking-tight text-gray-900">V1</h1>

					{#if participant.initials}
						<span class="font-medium text-gray-500">
							{participant.initials}
						</span>
					{/if}

					<span
						class="inline-flex items-center rounded bg-emerald-300 px-2 py-1 font-semibold text-black"
					>
						{participant.screeningId ?? '—'}
					</span>

					{#if participant.randomizationId != null}
						<span
							class="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800"
						>
							<span class="tracking-wide uppercase">Randomization ID</span>
							<span class="ml-1 font-bold">
								{participant.randomizationId}
							</span>
						</span>
					{/if}
				</div>
			</div>

			<!-- Patient name + phone -->
			<div class="flex flex-wrap items-center justify-center gap-3 text-sm font-medium">
				<p class="text-gray-800">
					{fullName}
				</p>

				{#if participant.phone}
					<a
						href={`tel:${participant.phone}`}
						class="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700"
					>
						<Phone size={14} />
						<span>{participant.phone}</span>
					</a>
				{/if}
			</div>

			<!-- Due date chip only -->
			<div class="flex flex-wrap items-center justify-center gap-3">
				<div
					class="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-1.5 shadow-sm"
				>
					<Calendar size={14} class="text-red-500" />
					<span class="text-xs font-medium text-red-700">
						Due by: <span class="font-bold">{dueDateLabel}</span>
					</span>
				</div>
			</div>
		</header>

		<div class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
			<div class="p-6 sm:p-8">
				<!-- Editable Scheduled OPD section (amber theme) -->
				<div class="mb-6 rounded-xl border border-amber-100 bg-amber-50/50 p-4">
					<div class="flex items-center justify-between gap-2">
						<div>
							<p class="text-xs font-bold tracking-widest text-amber-700 uppercase">
								Scheduled OPD Date
							</p>
							<p class="mt-1 text-xs text-amber-800">
								Current:&nbsp;
								<span class="font-semibold">{scheduledOnLabel}</span>
							</p>
							<p class="mt-1 text-xs text-amber-800">
								Choose any Tue / Wed / Fri between start and due date.
							</p>
						</div>
					</div>

					<div class="mt-4 space-y-3">
						<select
							bind:value={scheduledOnValue}
							class="block w-full rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/40 focus:outline-none"
						>
							{#if opdDateOptions.length === 0}
								<option value="">No OPD days available in this window</option>
							{:else}
								<option value="">Select OPD day</option>
								{#each opdDateOptions as opt}
									<option value={opt.value}>{opt.label}</option>
								{/each}
							{/if}
						</select>

						<div class="flex items-center justify-between gap-3">
							<button
								type="button"
								on:click={saveScheduledOn}
								disabled={!scheduledOnValue || savingScheduledOn}
								class="inline-flex items-center justify-center rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-amber-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-amber-300"
							>
								{#if savingScheduledOn}
									Saving…
								{:else}
									Save OPD date
								{/if}
							</button>

							{#if saveSuccess}
								<p class="text-xs font-medium text-amber-700">Saved successfully.</p>
							{:else if saveError}
								<p class="text-xs font-medium text-red-600">{saveError}</p>
							{/if}
						</div>
					</div>
				</div>

				<h2 class="mb-4 text-xs font-bold tracking-widest text-gray-400 uppercase">
					Required Actions
				</h2>

				<div class="space-y-6">
					<!-- ECG -->
					<div transition:fade>
						<p class="mb-1 text-sm font-semibold text-gray-800">12-lead ECG</p>

						{#if visit.ecgSrc && ecgFiles.length === 0}
							<!-- compact uploaded state with actions -->
							<div
								class="flex items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2"
							>
								<div class="flex items-center gap-2 overflow-hidden">
									<div class="rounded-lg bg-white p-1.5 text-emerald-600 shadow-sm">
										<FileText size={18} />
									</div>
									<span class="truncate text-left text-xs font-semibold text-emerald-800">
										{getFileNameFromKey(visit.ecgSrc)}
									</span>
								</div>
								<div class="flex items-center gap-1.5">
									<button
										type="button"
										on:click={() => printFromUrl(getFileUrl(visit.ecgSrc))}
										class="rounded-md p-1.5 text-emerald-700 hover:bg-emerald-100"
										title="Print"
									>
										<Printer size={16} />
									</button>
									<button
										type="button"
										on:click={() => ecgReuploadInput?.click()}
										class="rounded-md p-1.5 text-emerald-700 hover:bg-emerald-100"
										title="Re-upload"
									>
										<CloudUpload size={16} />
									</button>
								</div>
							</div>

							<input
								bind:this={ecgReuploadInput}
								type="file"
								class="hidden"
								accept="image/*,.pdf"
								multiple
								on:change={handleEcgFileChange}
							/>
						{:else if ecgFiles.length === 0}
							<!-- first-time upload (no existing file) -->
							<label
								class="group flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-6 text-center transition-all hover:border-emerald-400 hover:bg-emerald-50/30"
							>
								<div
									class="rounded-full bg-white p-2 shadow-sm ring-1 ring-gray-200 transition-all group-hover:ring-emerald-200"
								>
									<UploadCloud size={20} class="text-gray-400 group-hover:text-emerald-500" />
								</div>
								<p class="mt-2 text-sm font-medium text-gray-600 group-hover:text-emerald-600">
									Tap to select ECG PDF / Images
								</p>
								<input
									type="file"
									class="hidden"
									accept="image/*,.pdf"
									multiple
									on:change={handleEcgFileChange}
								/>
							</label>
						{:else}
							<!-- files chosen but not yet uploaded -->
							<div class="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
								<div class="flex items-center justify-between gap-3 overflow-hidden">
									<div class="flex items-center gap-3 overflow-hidden">
										<div class="rounded-lg bg-white p-2 text-emerald-600 shadow-sm">
											<FileText size={20} />
										</div>
										<div class="truncate">
											<p class="truncate text-sm font-medium text-emerald-900">
												{ecgFiles.length === 1
													? ecgFiles[0].name
													: `${ecgFiles.length} files selected`}
											</p>
											<p class="text-xs text-emerald-600">
												{uploadingField === 'ecg'
													? 'Uploading…'
													: 'Ready to convert to PDF and upload'}
											</p>
										</div>
									</div>
									<button
										on:click={clearEcgFiles}
										class="rounded-lg p-1.5 text-emerald-700 transition-colors hover:bg-emerald-200"
										aria-label="Remove files"
									>
										<X size={18} />
									</button>
								</div>
								<button
									type="button"
									on:click={async () => {
										if (ecgFiles.length === 0 || uploadingField) return;

										let fileToUpload: File;

										// If exactly one non-image file (e.g. a single PDF), keep as-is
										if (ecgFiles.length === 1 && !isImageFile(ecgFiles[0])) {
											fileToUpload = ecgFiles[0];
										} else {
											// Multiple images, or mix with at least one image → multi-page PDF
											fileToUpload = await convertFilesToSinglePdf(ecgFiles);
										}

										const key = await uploadFileToR2(fileToUpload, 'ecg');
										if (key) {
											clearEcgFiles();
										}
									}}
									disabled={ecgFiles.length === 0 || !!uploadingField}
									class="inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
								>
									{uploadingField === 'ecg' ? 'Uploading…' : 'Convert to PDF & upload ECG'}
								</button>
							</div>
						{/if}
					</div>

					<!-- 2D Echo -->
					<div transition:fade>
						<p class="mb-1 text-sm font-semibold text-gray-800">2D Echo</p>

						{#if visit.echoSrc && echoFiles.length === 0}
							<div
								class="flex items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2"
							>
								<div class="flex items-center gap-2 overflow-hidden">
									<div class="rounded-lg bg-white p-1.5 text-emerald-600 shadow-sm">
										<FileText size={18} />
									</div>
									<span class="truncate text-left text-xs font-semibold text-emerald-800">
										{getFileNameFromKey(visit.echoSrc)}
									</span>
								</div>
								<div class="flex items-center gap-1.5">
									<button
										type="button"
										on:click={() => printFromUrl(getFileUrl(visit.echoSrc))}
										class="rounded-md p-1.5 text-emerald-700 hover:bg-emerald-100"
										title="Print"
									>
										<Printer size={16} />
									</button>
									<button
										type="button"
										on:click={() => echoReuploadInput?.click()}
										class="rounded-md p-1.5 text-emerald-700 hover:bg-emerald-100"
										title="Re-upload"
									>
										<CloudUpload size={16} />
									</button>
								</div>
							</div>

							<input
								bind:this={echoReuploadInput}
								type="file"
								class="hidden"
								accept="image/*,.pdf"
								multiple
								on:change={handleEchoFileChange}
							/>
						{:else if echoFiles.length === 0}
							<label
								class="group flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-6 text-center transition-all hover:border-emerald-400 hover:bg-emerald-50/30"
							>
								<div
									class="rounded-full bg-white p-2 shadow-sm ring-1 ring-gray-200 transition-all group-hover:ring-emerald-200"
								>
									<UploadCloud size={20} class="text-gray-400 group-hover:text-emerald-500" />
								</div>
								<p class="mt-2 text-sm font-medium text-gray-600 group-hover:text-emerald-600">
									Tap to select Echo PDF / Images
								</p>
								<input
									type="file"
									class="hidden"
									accept="image/*,.pdf"
									multiple
									on:change={handleEchoFileChange}
								/>
							</label>
						{:else}
							<div class="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
								<div class="flex items-center justify-between gap-3 overflow-hidden">
									<div class="flex items-center gap-3 overflow-hidden">
										<div class="rounded-lg bg-white p-2 text-emerald-600 shadow-sm">
											<FileText size={20} />
										</div>
										<div class="truncate">
											<p class="truncate text-sm font-medium text-emerald-900">
												{echoFiles.length === 1
													? echoFiles[0].name
													: `${echoFiles.length} files selected`}
											</p>
											<p class="text-xs text-emerald-600">
												{uploadingField === 'echo'
													? 'Uploading…'
													: 'Ready to convert to PDF and upload'}
											</p>
										</div>
									</div>
									<button
										on:click={clearEchoFiles}
										class="rounded-lg p-1.5 text-emerald-700 transition-colors hover:bg-emerald-200"
										aria-label="Remove files"
									>
										<X size={18} />
									</button>
								</div>
								<button
									type="button"
									on:click={async () => {
										if (echoFiles.length === 0 || uploadingField) return;

										let fileToUpload: File;

										if (echoFiles.length === 1 && !isImageFile(echoFiles[0])) {
											fileToUpload = echoFiles[0];
										} else {
											fileToUpload = await convertFilesToSinglePdf(echoFiles);
										}

										const key = await uploadFileToR2(fileToUpload, 'echo');
										if (key) {
											clearEchoFiles();
										}
									}}
									disabled={echoFiles.length === 0 || !!uploadingField}
									class="inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
								>
									{uploadingField === 'echo' ? 'Uploading…' : 'Convert to PDF & upload Echo'}
								</button>
							</div>
						{/if}
					</div>

					<!-- Efficacy report -->
					<div transition:fade>
						<p class="mb-1 text-sm font-semibold text-gray-800">
							Efficacy report
							<span class="block text-xs font-normal text-gray-500">
								(NT-pro BNP, TSH, Homocysteine)
							</span>
						</p>

						{#if visit.efficacySrc && efficacyReportFiles.length === 0}
							<div
								class="flex items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2"
							>
								<div class="flex items-center gap-2 overflow-hidden">
									<div class="rounded-lg bg-white p-1.5 text-emerald-600 shadow-sm">
										<FileText size={18} />
									</div>
									<span class="truncate text-left text-xs font-semibold text-emerald-800">
										{getFileNameFromKey(visit.efficacySrc)}
									</span>
								</div>
								<div class="flex items-center gap-1.5">
									<button
										type="button"
										on:click={() => printFromUrl(getFileUrl(visit.efficacySrc))}
										class="rounded-md p-1.5 text-emerald-700 hover:bg-emerald-100"
										title="Print"
									>
										<Printer size={16} />
									</button>
									<button
										type="button"
										on:click={() => efficacyReuploadInput?.click()}
										class="rounded-md p-1.5 text-emerald-700 hover:bg-emerald-100"
										title="Re-upload"
									>
										<CloudUpload size={16} />
									</button>
								</div>
							</div>

							<input
								bind:this={efficacyReuploadInput}
								type="file"
								class="hidden"
								accept="image/*,.pdf"
								multiple
								on:change={handleEfficacyFileChange}
							/>
						{:else if efficacyReportFiles.length === 0}
							<label
								class="group flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-6 text-center transition-all hover:border-emerald-400 hover:bg-emerald-50/30"
							>
								<div
									class="rounded-full bg-white p-2 shadow-sm ring-1 ring-gray-200 transition-all group-hover:ring-emerald-200"
								>
									<UploadCloud size={20} class="text-gray-400 group-hover:text-emerald-500" />
								</div>
								<p class="mt-2 text-sm font-medium text-gray-600 group-hover:text-emerald-600">
									Tap to upload PDF or Images
								</p>
								<input
									type="file"
									class="hidden"
									accept="image/*,.pdf"
									multiple
									on:change={handleEfficacyFileChange}
								/>
							</label>
						{:else}
							<div class="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
								<div class="flex items-center justify-between gap-3 overflow-hidden">
									<div class="flex items-center gap-3 overflow-hidden">
										<div class="rounded-lg bg-white p-2 text-emerald-600 shadow-sm">
											<FileText size={20} />
										</div>
										<div class="truncate">
											<p class="truncate text-sm font-medium text-emerald-900">
												{efficacyReportFiles.length === 1
													? efficacyReportFiles[0].name
													: `${efficacyReportFiles.length} files selected`}
											</p>
											<p class="text-xs text-emerald-600">
												{uploadingField === 'efficacy'
													? 'Uploading…'
													: 'Ready to convert to PDF and upload'}
											</p>
										</div>
									</div>
									<button
										on:click={clearEfficacyFiles}
										class="rounded-lg p-1.5 text-emerald-700 transition-colors hover:bg-emerald-200"
										aria-label="Remove files"
									>
										<X size={18} />
									</button>
								</div>
								<button
									type="button"
									on:click={async () => {
										if (efficacyReportFiles.length === 0 || uploadingField) return;

										let fileToUpload: File;

										if (efficacyReportFiles.length === 1 && !isImageFile(efficacyReportFiles[0])) {
											fileToUpload = efficacyReportFiles[0];
										} else {
											fileToUpload = await convertFilesToSinglePdf(efficacyReportFiles);
										}

										const key = await uploadFileToR2(fileToUpload, 'efficacy');
										if (key) {
											clearEfficacyFiles();
										}
									}}
									disabled={efficacyReportFiles.length === 0 || !!uploadingField}
									class="inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
								>
									{uploadingField === 'efficacy'
										? 'Uploading…'
										: 'Convert to PDF & upload efficacy report'}
								</button>
							</div>
						{/if}
					</div>

					<!-- Safety report -->
					<div transition:fade>
						<p class="mb-1 text-sm font-semibold text-gray-800">
							Safety report
							<span class="block text-xs font-normal text-gray-500">
								(ECG/Echo/other safety investigations summary)
							</span>
						</p>

						{#if visit.safetySrc && safetyReportFiles.length === 0}
							<div
								class="flex items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2"
							>
								<div class="flex items-center gap-2 overflow-hidden">
									<div class="rounded-lg bg-white p-1.5 text-emerald-600 shadow-sm">
										<FileText size={18} />
									</div>
									<span class="truncate text-left text-xs font-semibold text-emerald-800">
										{getFileNameFromKey(visit.safetySrc)}
									</span>
								</div>
								<div class="flex items-center gap-1.5">
									<button
										type="button"
										on:click={() => printFromUrl(getFileUrl(visit.safetySrc))}
										class="rounded-md p-1.5 text-emerald-700 hover:bg-emerald-100"
										title="Print"
									>
										<Printer size={16} />
									</button>
									<button
										type="button"
										on:click={() => safetyReuploadInput?.click()}
										class="rounded-md p-1.5 text-emerald-700 hover:bg-emerald-100"
										title="Re-upload"
									>
										<CloudUpload size={16} />
									</button>
								</div>
							</div>

							<input
								bind:this={safetyReuploadInput}
								type="file"
								class="hidden"
								accept="image/*,.pdf"
								multiple
								on:change={handleSafetyFileChange}
							/>
						{:else if safetyReportFiles.length === 0}
							<label
								class="group flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-6 text-center transition-all hover:border-emerald-400 hover:bg-emerald-50/30"
							>
								<div
									class="rounded-full bg-white p-2 shadow-sm ring-1 ring-gray-200 transition-all group-hover:ring-emerald-200"
								>
									<UploadCloud size={20} class="text-gray-400 group-hover:text-emerald-500" />
								</div>
								<p class="mt-2 text-sm font-medium text-gray-600 group-hover:text-emerald-600">
									Tap to upload PDF or Images
								</p>
								<input
									type="file"
									class="hidden"
									accept="image/*,.pdf"
									multiple
									on:change={handleSafetyFileChange}
								/>
							</label>
						{:else}
							<div class="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
								<div class="flex items-center justify-between gap-3 overflow-hidden">
									<div class="flex items-center gap-3 overflow-hidden">
										<div class="rounded-lg bg-white p-2 text-emerald-600 shadow-sm">
											<FileText size={20} />
										</div>
										<div class="truncate">
											<p class="truncate text-sm font-medium text-emerald-900">
												{safetyReportFiles.length === 1
													? safetyReportFiles[0].name
													: `${safetyReportFiles.length} files selected`}
											</p>
											<p class="text-xs text-emerald-600">
												{uploadingField === 'safety'
													? 'Uploading…'
													: 'Ready to convert to PDF and upload'}
											</p>
										</div>
									</div>
									<button
										on:click={clearSafetyFiles}
										class="rounded-lg p-1.5 text-emerald-700 transition-colors hover:bg-emerald-200"
										aria-label="Remove files"
									>
										<X size={18} />
									</button>
								</div>
								<button
									type="button"
									on:click={async () => {
										if (safetyReportFiles.length === 0 || uploadingField) return;

										let fileToUpload: File;

										if (safetyReportFiles.length === 1 && !isImageFile(safetyReportFiles[0])) {
											fileToUpload = safetyReportFiles[0];
										} else {
											fileToUpload = await convertFilesToSinglePdf(safetyReportFiles);
										}

										const key = await uploadFileToR2(fileToUpload, 'safety');
										if (key) {
											clearSafetyFiles();
										}
									}}
									disabled={safetyReportFiles.length === 0 || !!uploadingField}
									class="inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
								>
									{uploadingField === 'safety'
										? 'Uploading…'
										: 'Convert to PDF & upload safety report'}
								</button>
							</div>
						{/if}

						<!-- Voucher radio group -->
						<div class="mt-4 space-y-2">
							<p class="text-xs font-bold tracking-widest text-gray-400 uppercase">
								Voucher status
							</p>
							<div class="space-y-2">
								<label class="flex items-center gap-2 text-sm text-gray-800">
									<input
										type="radio"
										class="h-4 w-4 text-emerald-600"
										bind:group={voucherStatus}
										value="given"
									/>
									<span>Voucher given</span>
								</label>
								<label class="flex items-center gap-2 text-sm text-gray-800">
									<input
										type="radio"
										class="h-4 w-4 text-emerald-600"
										bind:group={voucherStatus}
										value="not_given"
									/>
									<span>Voucher not given</span>
								</label>
							</div>
						</div>
					</div>

					{#if lastUploadedField}
						<p class="text-xs font-medium text-emerald-700">
							Upload saved for: {lastUploadedField.toUpperCase()}
						</p>
					{/if}

					{#if uploadError}
						<p class="text-xs font-medium text-red-600">
							{uploadError}
						</p>
					{/if}

					<!-- Screening outcome radio group -->
					<div class="space-y-2" transition:fade>
						<p class="block text-xs font-bold tracking-widest text-gray-400 uppercase">
							Screening outcome
						</p>
						<div class="space-y-2">
							<label class="flex items-center gap-2 text-sm text-gray-800">
								<input
									type="radio"
									class="h-4 w-4 text-emerald-600"
									bind:group={disposition}
									value="success"
								/>
								<span>Screening success</span>
							</label>
							<label class="flex items-center gap-2 text-sm text-gray-800">
								<input
									type="radio"
									class="h-4 w-4 text-red-600"
									bind:group={disposition}
									value="failure"
								/>
								<span>Screening failure</span>
							</label>
						</div>
					</div>
				</div>
			</div>

			<!-- Bottom bar actions based on screening outcome + randomization -->
			<div class="border-t border-gray-100 bg-gray-50 px-6 py-4 sm:px-8">
				<button
					type="button"
					disabled={!disposition}
					class={`group flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all active:scale-[0.98] disabled:cursor-not-allowed ${primaryButtonColorClasses}`}
				>
					<span>{primaryButtonLabel}</span>
					<ArrowRight
						size={18}
						class="transition-transform duration-300 group-hover:translate-x-1"
					/>
				</button>
			</div>
		</div>
	</div>
</main>
