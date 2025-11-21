<!-- src/routes/recruitment/+page.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';

	let hasLvefLow = false;
	let hasNoRecentEvents = false;

	let isSubmitting = false;
	let errorMessage: string | null = null;

	// All core criteria must be ticked
	$: allChecked = hasLvefLow && hasNoRecentEvents;

	async function handleStartScreening() {
		if (!allChecked || isSubmitting) return;

		isSubmitting = true;
		errorMessage = null;

		try {
			// 1. Create participant (screeningId auto-generated on server)
			const participantResponse = await fetch('/apis/participant/create', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({})
			});

			let participantData: any = {};
			try {
				participantData = await participantResponse.json();
			} catch {
				// ignore JSON parse error; we'll throw a generic error below
			}

			if (!participantResponse.ok || !participantData?.participantId) {
				throw new Error(
					participantData?.error || 'Failed to create participant. Please try again.'
				);
			}

			const participantId: string = participantData.participantId;

			// 2. Create Visit 1 for this participant
			const visitResponse = await fetch('/apis/visits/visit1', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ participantId })
			});

			let visitData: any = {};
			try {
				visitData = await visitResponse.json();
			} catch {
				// ignore JSON parse error; we'll throw a generic error below
			}

			if (!visitResponse.ok || visitData?.error) {
				throw new Error(visitData?.error || 'Failed to create Visit 1. Please try again.');
			}

			// 3. Navigate to participant page
			await goto(`/participants/${participantId}`);
		} catch (error: unknown) {
			console.error('Error starting screening:', error);
			const message =
				error && typeof error === 'object' && 'message' in error
					? String((error as { message?: string }).message)
					: 'Something went wrong while starting screening. Please try again.';
			errorMessage = message;
		} finally {
			isSubmitting = false;
		}
	}
</script>

<main class="flex min-h-screen items-start justify-center bg-gray-50 px-6 py-16 text-gray-900">
	<div class="w-full max-w-3xl space-y-12 pb-16">
		<!-- Eligibility checkboxes -->
		<section class="space-y-6">
			<p class="mt-2 rounded bg-amber-100 p-2 text-center text-xs font-semibold text-amber-700">
				Do not generate ID if eligibility criteria are not met.
			</p>
			<h2 class="text-center text-sm font-semibold tracking-[0.18em] text-gray-500 uppercase">
				CORE ELIGIBILITY
			</h2>

			<form class="space-y-4">
				<!-- Criterion 1 -->
				<label
					class="flex cursor-pointer items-center gap-4 rounded-2xl border border-gray-300 bg-white px-5 py-4 shadow-sm transition hover:border-emerald-400"
				>
					<input
						type="checkbox"
						bind:checked={hasLvefLow}
						class="mt-1 h-6 w-6 shrink-0 rounded-lg border-gray-400 text-emerald-500 accent-emerald-500 focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
					/>
					<div>
						<p class="text-base font-medium text-gray-900">LVEF &lt; 40% in last 2 weeks.</p>
					</div>
				</label>

				<!-- Criterion 2 -->
				<label
					class="flex cursor-pointer items-start gap-4 rounded-2xl border border-gray-300 bg-white px-5 py-4 shadow-sm transition hover:border-emerald-400"
				>
					<input
						type="checkbox"
						bind:checked={hasNoRecentEvents}
						class="mt-1 h-6 w-6 shrink-0 rounded-lg border-gray-400 text-emerald-500 accent-emerald-500 focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
					/>
					<div>
						<p class="text-base font-medium text-gray-900">
							No hospitalization MI, Stroke, CABG (planned or done), or worsening HF in last 4 weeks
						</p>
					</div>
				</label>
			</form>
		</section>

		<!-- Start Screening button (full width, bigger, enabled only when all checked) -->
		<div class="">
			<button
				type="button"
				on:click={handleStartScreening}
				disabled={!allChecked || isSubmitting}
				class="mb-1 w-full rounded-lg px-6 py-4 text-base font-semibold shadow-sm transition
					{allChecked && !isSubmitting
					? 'bg-emerald-600 text-white hover:bg-emerald-500'
					: 'cursor-not-allowed bg-gray-300 text-gray-500'}"
			>
				{isSubmitting ? 'Generating…' : 'Generate Screening ID'}
			</button>

			{#if errorMessage}
				<p class="text-sm text-red-600">{errorMessage}</p>
			{/if}
		</div>
	</div>
</main>
