<script lang="ts">
	import type { PageProps } from './$types';
	import { goto } from '$app/navigation';

	let { data }: PageProps = $props();
	const { participant, hasVisit1 } = data;

	// Local form state, pre-filled if values exist
	let firstName: string = participant.firstName ?? '';
	let middleName: string = participant.middleName ?? '';
	let lastName: string = participant.lastName ?? '';
	let address: string = participant.address ?? '';
	let phone: string = participant.phone ?? '';
	let age: string = participant.age != null ? String(participant.age) : '';
	let sex: string = participant.sex ?? '';
	let education: string = participant.education ?? '';
	let occupation: string = participant.occupation ?? '';
	let income: string = participant.income != null ? String(participant.income) : '';

	// --- Visit 1 creation + navigation ---
	let isCreatingVisit = false;
	let visitError: string | null = null;

	async function handleCreateVisit1() {
		if (!participant?.id) {
			visitError = 'Missing participant ID in page data.';
			return;
		}

		isCreatingVisit = true;
		visitError = null;

		try {
			const res = await fetch('/apis/visits/visit1', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					participantId: participant.id
				})
			});

			const data = await res.json().catch(() => null);

			if (!res.ok || data?.ok === false) {
				const message = data?.error ?? 'Could not create visit. Please try again.';
				throw new Error(message);
			}

			const visitId: string | undefined = data?.visitId;

			if (visitId) {
				goto(`/visits/visit1/${visitId}`);
			} else {
				visitError = 'Visit created, but no visit ID returned.';
			}
		} catch (err) {
			console.error('Error creating Visit 1:', err);
			visitError = err instanceof Error ? err.message : 'Could not create visit. Please try again.';
		} finally {
			isCreatingVisit = false;
		}
	}
</script>

<main class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6">
	<div class="w-full max-w-2xl space-y-8">
		<header class="space-y-2 text-center">
			<p class="text-xs font-bold tracking-widest text-gray-400 uppercase">Participant</p>

			<h1 class="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
				{participant.screeningId}
			</h1>

			{#if participant.initials}
				<p class="text-sm font-semibold text-gray-700">
					Initials: {participant.initials}
				</p>
			{/if}

			{#if participant.screenedOn}
				<p class="text-sm font-medium text-gray-500">
					Screened on: {participant.screenedOn}
				</p>
			{/if}
		</header>

		<section class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
			<div class="p-6 sm:p-8">
				<h2 class="mb-6 text-xs font-bold tracking-widest text-gray-400 uppercase">Core Details</h2>

				<form class="space-y-6" method="POST" action="?/save">
					<!-- Names -->
					<div class="grid gap-5 sm:grid-cols-3">
						<div class="space-y-1.5">
							<label class="block text-xs font-semibold text-gray-700" for="firstName">
								First Name
							</label>
							<input
								id="firstName"
								name="firstName"
								type="text"
								bind:value={firstName}
								class="block w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-emerald-500 focus:bg-white focus:ring-emerald-500 focus:outline-none"
								placeholder="First Name"
							/>
						</div>

						<div class="space-y-1.5">
							<label class="block text-xs font-semibold text-gray-700" for="middleName">
								Middle Name
							</label>
							<input
								id="middleName"
								name="middleName"
								type="text"
								bind:value={middleName}
								class="block w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-emerald-500 focus:bg-white focus:ring-emerald-500 focus:outline-none"
								placeholder="Middle Name"
							/>
						</div>

						<div class="space-y-1.5">
							<label class="block text-xs font-semibold text-gray-700" for="lastName">
								Last Name
							</label>
							<input
								id="lastName"
								name="lastName"
								type="text"
								bind:value={lastName}
								class="block w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-emerald-500 focus:bg-white focus:ring-emerald-500 focus:outline-none"
								placeholder="Last Name"
							/>
						</div>
					</div>

					<!-- Contact & Demographics -->
					<div class="grid gap-5 sm:grid-cols-3">
						<div class="space-y-1.5">
							<label class="block text-xs font-semibold text-gray-700" for="phone"> Phone </label>
							<input
								id="phone"
								name="phone"
								type="tel"
								bind:value={phone}
								class="block w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-emerald-500 focus:bg-white focus:ring-emerald-500 focus:outline-none"
								placeholder="Primary contact number"
							/>
						</div>

						<div class="space-y-1.5">
							<label class="block text-xs font-semibold text-gray-700" for="age"> Age </label>
							<input
								id="age"
								name="age"
								type="number"
								min="0"
								step="1"
								bind:value={age}
								class="block w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-emerald-500 focus:bg-white focus:ring-emerald-500 focus:outline-none"
								placeholder="Years"
							/>
						</div>

						<div class="space-y-1.5">
							<label class="block text-xs font-semibold text-gray-700" for="sex"> Sex </label>
							<select
								id="sex"
								name="sex"
								bind:value={sex}
								class="block w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-emerald-500 focus:bg-white focus:ring-emerald-500 focus:outline-none"
							>
								<option value="">Select</option>
								<option value="Male">Male</option>
								<option value="Female">Female</option>
								<option value="Other">Other</option>
							</select>
						</div>
					</div>

					<!-- Socioeconomic -->
					<div class="grid gap-5 sm:grid-cols-3">
						<div class="space-y-1.5">
							<label class="block text-xs font-semibold text-gray-700" for="education">
								Education
							</label>
							<input
								id="education"
								name="education"
								type="text"
								bind:value={education}
								class="block w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-emerald-500 focus:bg-white focus:ring-emerald-500 focus:outline-none"
								placeholder="Education level"
							/>
						</div>

						<div class="space-y-1.5">
							<label class="block text-xs font-semibold text-gray-700" for="occupation">
								Occupation
							</label>
							<input
								id="occupation"
								name="occupation"
								type="text"
								bind:value={occupation}
								class="block w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-emerald-500 focus:bg-white focus:ring-emerald-500 focus:outline-none"
								placeholder="Occupation"
							/>
						</div>

						<div class="space-y-1.5">
							<label class="block text-xs font-semibold text-gray-700" for="income">
								Annual Income
							</label>
							<input
								id="income"
								name="income"
								type="number"
								min="0"
								step="1"
								bind:value={income}
								class="block w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-emerald-500 focus:bg-white focus:ring-emerald-500 focus:outline-none"
								placeholder="₹ per year"
							/>
						</div>
					</div>

					<!-- Address -->
					<div class="space-y-1.5">
						<label class="block text-xs font-semibold text-gray-700" for="address"> Address </label>
						<textarea
							id="address"
							name="address"
							rows="3"
							bind:value={address}
							class="block w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-emerald-500 focus:bg-white focus:ring-emerald-500 focus:outline-none"
							placeholder="Enter full address here..."
						/>
					</div>

					<div class="space-y-3 pt-4">
						<div class="space-y-2">
							<button
								type="submit"
								class="flex w-full items-center justify-center rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-500 active:scale-[0.98]"
							>
								Continue
							</button>
						</div>

						{#if !hasVisit1}
							<div class="relative py-2">
								<div class="absolute inset-0 flex items-center" aria-hidden="true">
									<div class="w-full border-t border-gray-100"></div>
								</div>
								<div class="relative flex justify-center">
									<span class="bg-white px-2 text-xs tracking-widest text-gray-300 uppercase">
										Next Step
									</span>
								</div>
							</div>

							<div class="space-y-2">
								<button
									type="button"
									on:click={handleCreateVisit1}
									disabled={isCreatingVisit}
									class="group flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-zinc-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
								>
									{#if isCreatingVisit}
										<span class="animate-pulse">Creating Visit...</span>
									{:else}
										<span>Create Visit 1</span>
										<span class="transition-transform duration-300 group-hover:translate-x-1">
											→
										</span>
									{/if}
								</button>

								{#if visitError}
									<p class="text-center text-xs font-medium text-red-600">
										{visitError}
									</p>
								{/if}
							</div>
						{/if}
					</div>
				</form>
			</div>
		</section>
	</div>
</main>
