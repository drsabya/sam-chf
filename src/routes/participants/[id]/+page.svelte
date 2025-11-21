<!-- src/routes/participants/[id]/+page.svelte -->
<script lang="ts">
	import type { PageProps } from './$types';
	import { goto } from '$app/navigation';
	import { Phone } from '@lucide/svelte';

	let { data }: PageProps = $props();
	const { participant, visits, hasVisit1 } = data;

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

	// Tabs: 'details' | 'visits'
	let activeTab = $state<'details' | 'visits'>('details');

	function formatDate(dateString: string | null | undefined): string {
		if (!dateString) return 'Not set';
		const d = new Date(dateString);
		if (Number.isNaN(d.getTime())) return 'Not set';
		return d.toLocaleDateString('en-IN', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	}

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

<main class="flex min-h-screen items-start justify-center bg-gray-50 px-4 py-12 sm:px-6">
	<div class="w-full max-w-2xl space-y-8">
		<header class="space-y-2 text-center">
			<h1 class="text-2xl tracking-tight text-gray-900 sm:text-3xl">
				{#if participant.initials}
					<span class="font-thin text-gray-600">{participant.initials}</span>
					<span class="mx-2 align-middle text-2xl text-gray-300">•</span>
				{/if}
				<span class="font-bold">{participant.screeningId}</span>
			</h1>

			<!-- {#if participant.screenedOn} -->
			<p class="text-sm font-medium text-gray-500">
				{participant.firstName}
				{participant.middleName}
				{participant.lastName}
			</p>
			<!-- {/if} -->

			{#if participant.phone}
				<div class="mt-3 flex items-center justify-center gap-3 text-sm text-gray-700">
					<a
						href={`tel:${participant.phone}`}
						class="inline-flex items-center gap-2 font-medium text-emerald-700 hover:underline"
					>
						<Phone class="h-4 w-4" />
						<span>{participant.phone}</span>
					</a>
				</div>
			{/if}
		</header>

		<!-- Tabs -->
		<div class="mx-auto flex w-full max-w-md rounded-full bg-gray-100 p-1 text-xs font-medium">
			<button
				type="button"
				class={`flex-1 rounded-full px-3 py-2 text-center transition sm:px-4 sm:py-2.5 sm:text-sm ${
					activeTab === 'details'
						? 'bg-white text-gray-900 shadow-sm'
						: 'text-gray-500 hover:text-gray-900'
				}`}
				on:click={() => (activeTab = 'details')}
			>
				Details
			</button>
			<button
				type="button"
				class={`flex-1 rounded-full px-3 py-2 text-center transition sm:px-4 sm:py-2.5 sm:text-sm ${
					activeTab === 'visits'
						? 'bg-white text-gray-900 shadow-sm'
						: 'text-gray-500 hover:text-gray-900'
				}`}
				on:click={() => (activeTab = 'visits')}
			>
				Visits
			</button>
		</div>

		{#if activeTab === 'details'}
			<section class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
				<div class="p-6 sm:p-8">
					<h2 class="mb-6 text-xs font-bold tracking-widest text-gray-400 uppercase">
						Core Details
					</h2>

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
							<label class="block text-xs font-semibold text-gray-700" for="address">
								Address
							</label>
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
									Save
								</button>
							</div>

							{#if !hasVisit1}
								<div class="relative py-2">
									<div class="absolute inset-0 flex items-center" aria-hidden="true">
										<div class="w-full border-t border-gray-100" />
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
		{:else if activeTab === 'visits'}
			<section class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
				<div class="space-y-4 p-6 sm:p-8">
					<div class="flex items-baseline justify-between">
						<h2 class="text-xs font-bold tracking-widest text-gray-400 uppercase">Visits</h2>
						<p class="text-xs text-gray-500">
							{#if visits.length === 0}
								No visits created yet.
							{:else}
								{visits.length} visit{visits.length === 1 ? '' : 's'}
							{/if}
						</p>
					</div>

					{#if visits.length === 0}
						<p class="rounded-xl bg-gray-50 px-4 py-3 text-xs text-gray-600">
							No visits are available for this participant yet. Create Visit 1 from the Details tab
							after saving core details.
						</p>
					{:else}
						<ul class="space-y-3">
							{#each visits as visit}
								<li
									on:click={() => goto(`/visits/visit${visit.visitNumber}/${visit.id}`)}
									class="flex cursor-pointer items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 transition hover:bg-gray-100 active:scale-[0.99]"
								>
									<div>
										<p class="text-sm font-semibold text-gray-900">
											Visit {visit.visitNumber}
										</p>
										<p class="text-xs text-gray-600">
											{#if visit.completedOn}
												Completed on: {formatDate(visit.completedOn)}
											{:else if visit.dueDate}
												Due on: {formatDate(visit.dueDate)}
											{:else}
												Due date not set
											{/if}
										</p>
									</div>

									<div>
										{#if visit.completedOn}
											<span
												class="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700"
											>
												Completed
											</span>
										{:else}
											<span
												class="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-[11px] font-medium text-amber-700"
											>
												Pending
											</span>
										{/if}
									</div>
								</li>
							{/each}
						</ul>
					{/if}
				</div>
			</section>
		{/if}
	</div>
</main>
