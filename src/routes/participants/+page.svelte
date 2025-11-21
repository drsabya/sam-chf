<!-- src/routes/participants/+page.svelte -->
<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let search = $state('');

	let participants = $derived(data.participants ?? []);

	let filteredParticipants = $derived.by(() => {
		const q = search.toLowerCase().trim();

		return !q
			? participants
			: participants.filter((p) => {
					const firstName = (p.firstName ?? '').toLowerCase();
					const middleName = (p.middleName ?? '').toLowerCase();
					const lastName = (p.lastName ?? '').toLowerCase();
					const screeningId = (p.screeningId ?? '').toLowerCase();
					const randomizationId = (p.randomizationId ?? '').toLowerCase();

					return (
						firstName.includes(q) ||
						middleName.includes(q) ||
						lastName.includes(q) ||
						screeningId.includes(q) ||
						randomizationId.includes(q)
					);
				});
	});
</script>

<section class="mx-auto max-w-2xl px-4 py-6">
	<!-- Search bar -->
	<div class="mb-4">
		<input
			type="text"
			bind:value={search}
			class="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400
				focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
			placeholder="Search name, screening id or randomisation id"
		/>
	</div>

	{#if !data.participants || data.participants.length === 0}
		<p class="text-sm text-gray-500">No participants found.</p>
	{:else if filteredParticipants.length === 0}
		<p class="text-sm text-gray-500">No matching participants.</p>
	{:else}
		<ul>
			{#each filteredParticipants as p}
				<li class="border-b border-gray-200">
					<a
						href={`/participants/${p.id}`}
						class="flex items-center justify-between gap-3 py-3 hover:bg-gray-50"
					>
						<!-- LEFT SIDE -->
						<div class="flex min-w-0 flex-col gap-0.5">
							<div class="truncate text-base font-semibold text-gray-900">
								{p.firstName}
								{#if p.middleName}
									{' '}{p.middleName}{/if}
								{' '}{p.lastName}
							</div>
						</div>

						<!-- RIGHT SIDE: Screening ID + Randomization ID pills -->
						<div class="flex flex-shrink-0 items-center gap-2">
							<div
								class="rounded-md bg-emerald-300 px-2 py-1 text-xs font-semibold tracking-wide text-gray-900 uppercase"
							>
								{p.screeningId}
							</div>

							{#if p.randomizationId}
								<div
									class="rounded-md bg-purple-200 px-2 py-1 text-xs font-semibold tracking-wide text-gray-900 uppercase"
								>
									{p.randomizationId}
								</div>
							{/if}
						</div>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</section>
