<script lang="ts">
	import type { PageProps } from './$types';

	type UpcomingVisitItem = {
		participantId: string;
		screeningId: number | null;
		createdAt: string;
		firstName: string;
		middleName?: string;
		lastName: string;
		address: string;
		dueDate: string; // ISO
		isDeviation: boolean;
		visitNumber: number | null;
		visitId: string | null;
		status: string;
		randomizationId?: string | null; // ✅ added for pill on right
	};

	let { data }: PageProps = $props();
	const { upcomingVisits } = data as { upcomingVisits: UpcomingVisitItem[] };

	const getFullName = (p: UpcomingVisitItem) =>
		[p.firstName, p.middleName, p.lastName]
			.map((x) => x?.trim())
			.filter((x) => x && x.length > 0)
			.join(' ');

	const formatDate = (dateStr: string | null) => {
		if (!dateStr) return '';
		return new Date(dateStr).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	};

	const getHref = (v: UpcomingVisitItem) => {
		// If there's a visit, go to the visit page; otherwise go to participant page
		if (v.visitId && v.visitNumber != null) {
			return `/visits/visit${v.visitNumber}/${v.visitId}`;
		}
		return `/participants/${v.participantId}`;
	};

	// Show as S1, S2, …
	const formatScreeningId = (id: number | null) => {
		if (id == null) return '—';
		return `S${id}`;
	};

	// Avatar badge content → V1, V2, …
	const formatVisitBadge = (visitNumber: number | null) => {
		if (!visitNumber) return '—';
		return `V${visitNumber}`;
	};
</script>

<main class="min-h-screen bg-slate-50 px-6 py-12 text-slate-900 sm:py-20">
	<div class="mx-auto w-full max-w-2xl space-y-12">
		<header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h1 class="text-3xl font-bold tracking-tight text-slate-900">SAM-CHF Trial</h1>
				<p class="mt-1 text-sm text-slate-500">Upcoming Visits &amp; Follow-Up Dashboard</p>
			</div>

			<a
				href="/screening"
				class="group inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 hover:shadow-emerald-600/30 active:scale-95"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="opacity-80"><path d="M5 12h14" /><path d="M12 5v14" /></svg
				>
				New Screening
			</a>
		</header>

		<section class="space-y-6">
			<div class="flex items-center justify-between border-b border-slate-200 pb-4">
				<h2 class="text-sm font-semibold tracking-wide text-slate-500 uppercase">
					Upcoming Visits
					<span class="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
						>{upcomingVisits.length}</span
					>
				</h2>
				<a
					href="/participants"
					class="text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
				>
					View all participants &rarr;
				</a>
			</div>

			{#if upcomingVisits.length === 0}
				<div
					class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center"
				>
					<div class="rounded-full bg-slate-100 p-3">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="text-slate-400"
							><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle
								cx="9"
								cy="7"
								r="4"
							/><line x1="19" x2="19" y1="8" y2="14" /><line x1="22" x2="16" y1="11" y2="11" /></svg
						>
					</div>
					<h3 class="mt-4 text-sm font-semibold text-slate-900">No upcoming visits</h3>
					<p class="mt-1 text-sm text-slate-500">
						All visits are up to date. Create a new screening to add more participants.
					</p>
				</div>
			{:else}
				<ul class="space-y-3">
					{#each upcomingVisits as v}
						<li>
							<a
								href={getHref(v)}
								class="group relative flex items-center justify-between overflow-hidden rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5 transition-all hover:shadow-md hover:ring-emerald-500/50"
							>
								<div class="flex items-center gap-4">
									<!-- Avatar badge: visit number as V1 / V2 / V3... -->
									<div
										class="flex h-12 min-w-[3rem] items-center justify-center rounded-xl bg-emerald-50 px-3 font-mono text-xs font-bold text-emerald-700 transition-colors group-hover:bg-emerald-100"
									>
										{formatVisitBadge(v.visitNumber)}
									</div>

									<div class="flex flex-col gap-0.5">
										<!-- Name -->
										<span class="text-base font-medium text-slate-900">
											{getFullName(v) || 'Unnamed participant'}
										</span>

										<span
											class="text-xs font-medium"
											class:text-red-600={v.isDeviation}
											class:text-emerald-600={!v.isDeviation}
										>
											{#if v.isDeviation}
												Deviation – overdue since {formatDate(v.dueDate)}
											{:else}
												Due on {formatDate(v.dueDate)}
											{/if}
										</span>
									</div>
								</div>

								<!-- Right side: screening ID + randomization ID pills (like participants page) -->
								<div class="flex flex-shrink-0 items-center gap-2">
									<div
										class="rounded-md bg-emerald-300 px-2 py-1 text-xs font-semibold tracking-wide text-gray-900 uppercase"
									>
										{formatScreeningId(v.screeningId)}
									</div>

									{#if v.randomizationId}
										<div
											class="rounded-md bg-purple-200 px-2 py-1 text-xs font-semibold tracking-wide text-gray-900 uppercase"
										>
											{v.randomizationId}
										</div>
									{/if}
								</div>
							</a>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	</div>
</main>
