<!-- src/routes/visits/visit1/[id]/+page.svelte -->
<script lang="ts">
	import type { PageProps } from './$types';
	import {
		Calendar,
		Stethoscope,
		CheckCircle2,
		ArrowRight,
		UploadCloud,
		FileText,
		X
	} from '@lucide/svelte';
	import { fade, slide } from 'svelte/transition';

	let { data }: PageProps = $props();
	const { visit } = data;

	// Format due date on the client from visit.dueDate
	let dueDateLabel = $state('Not set');

	if (visit.dueDate) {
		const d = new Date(visit.dueDate);
		if (!Number.isNaN(d.getTime())) {
			dueDateLabel = d.toLocaleDateString('en-IN', {
				weekday: 'short',
				day: '2-digit',
				month: 'short',
				year: 'numeric'
			});
		}
	}

	let sentToHealthcare = $state(false);
	let safetyTestingDone = $state(false);
	let disposition = $state(''); // '', 'screening_failure', 'randomised'
	let reportFile: File | null = $state(null);

	function handleFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			reportFile = target.files[0];
		}
	}

	function clearFile() {
		reportFile = null;
	}
</script>

<main class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6">
	<div class="w-full max-w-lg space-y-8">
		<header class="space-y-4 text-center">
			<div class="space-y-1">
				<p class="text-xs font-bold tracking-widest text-gray-400 uppercase">Screening Phase</p>
				<h1 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
					Visit 1 (Screening)
				</h1>
			</div>

			<!-- 🔗 Quick navigation to participant details -->
			<p class="text-xs text-gray-500">
				Need to edit demographics?{' '}
				<a
					href={`/participants/${visit.participantId}`}
					class="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
				>
					Open participant details
				</a>
			</p>

			<div
				class="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-1.5 shadow-sm"
			>
				<Calendar size={14} class="text-red-500" />
				<span class="text-xs font-medium text-red-700">
					Due by: <span class="font-bold">{dueDateLabel}</span>
				</span>
			</div>
		</header>

		<div class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
			<div class="p-6 sm:p-8">
				<h2 class="mb-4 text-xs font-bold tracking-widest text-gray-400 uppercase">
					Required Actions
				</h2>

				<!-- STEP 1: Healthcare referral checkbox -->
				<label class="group relative block cursor-pointer">
					<input type="checkbox" bind:checked={sentToHealthcare} class="peer sr-only" />

					<div
						class="flex items-start gap-4 rounded-xl border-2 p-5 transition-all duration-200
                        {sentToHealthcare
							? 'border-emerald-500 bg-emerald-50/50'
							: 'border-gray-100 bg-gray-50 hover:border-emerald-200 hover:bg-white'}"
					>
						<div
							class="flex-shrink-0 rounded-full p-2 transition-colors duration-200
                            {sentToHealthcare
								? 'bg-emerald-100 text-emerald-600'
								: 'bg-white text-gray-400 shadow-sm'}"
						>
							{#if sentToHealthcare}
								<CheckCircle2 size={24} />
							{:else}
								<Stethoscope size={24} />
							{/if}
						</div>

						<div class="space-y-1 pt-1">
							<p
								class="font-semibold transition-colors duration-200
                                {sentToHealthcare ? 'text-emerald-900' : 'text-gray-900'}"
							>
								Refer to Healthcare
							</p>
							<p class="text-sm text-gray-500">
								Confirm that the patient has been sent for testing.
							</p>
						</div>

						<div class="ml-auto pt-1">
							<div
								class="flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors duration-200
                                {sentToHealthcare
									? 'border-emerald-500 bg-emerald-500'
									: 'border-gray-300 bg-white'}"
							>
								{#if sentToHealthcare}
									<CheckCircle2 size={14} class="text-white" />
								{/if}
							</div>
						</div>
					</div>
				</label>

				{#if sentToHealthcare}
					<div transition:slide={{ duration: 300, axis: 'y' }} class="space-y-4 pt-4">
						<!-- Text between the two checkboxes -->
						<p class="rounded-lg bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
							Call patient for safety if healthcare reports are satisfactory
						</p>

						<!-- STEP 2: Safety testing checkbox -->
						<label class="group relative block cursor-pointer">
							<input type="checkbox" bind:checked={safetyTestingDone} class="peer sr-only" />

							<div
								class="flex items-start gap-4 rounded-xl border-2 p-5 transition-all duration-200
                                {safetyTestingDone
									? 'border-emerald-500 bg-emerald-50/50'
									: 'border-gray-100 bg-gray-50 hover:border-emerald-200 hover:bg-white'}"
							>
								<div
									class="flex-shrink-0 rounded-full p-2 transition-colors duration-200
                                    {safetyTestingDone
										? 'bg-emerald-100 text-emerald-600'
										: 'bg-white text-gray-400 shadow-sm'}"
								>
									<CheckCircle2 size={24} />
								</div>

								<div class="space-y-1 pt-1">
									<p
										class="font-semibold transition-colors duration-200
                                        {safetyTestingDone ? 'text-emerald-900' : 'text-gray-900'}"
									>
										Safety testing
									</p>
									<p class="text-sm text-gray-500">
										Confirm that patient safety assessment has been completed.
									</p>
								</div>

								<div class="ml-auto pt-1">
									<div
										class="flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors duration-200
                                        {safetyTestingDone
											? 'border-emerald-500 bg-emerald-500'
											: 'border-gray-300 bg-white'}"
									>
										{#if safetyTestingDone}
											<CheckCircle2 size={14} class="text-white" />
										{/if}
									</div>
								</div>
							</div>
						</label>

						<!-- Upload section (no status message) -->
						<div transition:fade>
							<label class="mb-2 block text-xs font-bold tracking-widest text-gray-400 uppercase">
								Upload Report (Optional)
							</label>

							{#if !reportFile}
								<label
									class="group flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-6 text-center transition-all hover:border-emerald-400 hover:bg-emerald-50/30"
								>
									<div
										class="rounded-full bg-white p-2 shadow-sm ring-1 ring-gray-200 transition-all group-hover:ring-emerald-200"
									>
										<UploadCloud size={20} class="text-gray-400 group-hover:text-emerald-500" />
									</div>
									<p class="mt-2 text-sm font-medium text-gray-600 group-hover:text-emerald-600">
										Tap to upload PDF or Image
									</p>
									<input
										type="file"
										class="hidden"
										accept="image/*,.pdf"
										on:change={handleFileChange}
									/>
								</label>
							{:else}
								<div
									class="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-3"
								>
									<div class="flex items-center gap-3 overflow-hidden">
										<div class="rounded-lg bg-white p-2 text-emerald-600 shadow-sm">
											<FileText size={20} />
										</div>
										<div class="truncate">
											<p class="truncate text-sm font-medium text-emerald-900">
												{reportFile.name}
											</p>
											<p class="text-xs text-emerald-600">Ready to upload</p>
										</div>
									</div>
									<button
										on:click={clearFile}
										class="rounded-lg p-1.5 text-emerald-700 transition-colors hover:bg-emerald-200"
										aria-label="Remove file"
									>
										<X size={18} />
									</button>
								</div>
							{/if}
						</div>

						<!-- Disposition dropdown: only when safetyTestingDone -->
						{#if safetyTestingDone}
							<div class="space-y-2" transition:fade>
								<label
									class="block text-xs font-bold tracking-widest text-gray-400 uppercase"
									for="disposition"
								>
									Disposition
								</label>
								<select
									id="disposition"
									bind:value={disposition}
									class="block w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
								>
									<option value="">Select option</option>
									<option value="screening_failure">Screening failure</option>
									<option value="randomised">Randomised</option>
								</select>
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Bottom bar actions based on disposition -->
			{#if safetyTestingDone && disposition}
				<div transition:slide class="border-t border-gray-100 bg-gray-50 px-6 py-4 sm:px-8">
					{#if disposition === 'screening_failure'}
						<button
							type="button"
							class="group flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-500 active:scale-[0.98]"
						>
							<span>Conclude visit 1</span>
							<ArrowRight
								size={18}
								class="transition-transform duration-300 group-hover:translate-x-1"
							/>
						</button>
					{:else if disposition === 'randomised'}
						<button
							type="button"
							class="group flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-500 active:scale-[0.98]"
						>
							<span>Continue</span>
							<ArrowRight
								size={18}
								class="transition-transform duration-300 group-hover:translate-x-1"
							/>
						</button>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</main>
