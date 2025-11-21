<!-- src/routes/recruitment/consent/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import HindiConsent from '$lib/consent/HindiConsent.svelte';

	// Modal state
	let showConsent = false;

	let canvas: HTMLCanvasElement | null = null;
	let ctx: CanvasRenderingContext2D | null = null;
	let drawing = false;
	let hasSigned = false;

	function setupCanvas() {
		if (!canvas) return;
		const rect = canvas.getBoundingClientRect();
		const ratio = window.devicePixelRatio || 1;

		canvas.width = rect.width * ratio;
		canvas.height = rect.height * ratio;

		const context = canvas.getContext('2d');
		if (!context) return;

		ctx = context;
		ctx.scale(ratio, ratio);
		ctx.lineJoin = 'round';
		ctx.lineCap = 'round';
		ctx.lineWidth = 2;
		ctx.strokeStyle = '#020617';
		clearCanvas();
	}

	onMount(() => {
		setupCanvas();
		window.addEventListener('resize', setupCanvas);
		return () => window.removeEventListener('resize', setupCanvas);
	});

	function getCoords(event: PointerEvent) {
		if (!canvas) return { x: 0, y: 0 };
		const rect = canvas.getBoundingClientRect();
		return {
			x: event.clientX - rect.left,
			y: event.clientY - rect.top
		};
	}

	function handlePointerDown(event: PointerEvent) {
		if (!ctx) return;
		const { x, y } = getCoords(event);
		drawing = true;
		ctx.beginPath();
		ctx.moveTo(x, y);
	}

	function handlePointerMove(event: PointerEvent) {
		if (!drawing || !ctx) return;
		const { x, y } = getCoords(event);
		ctx.lineTo(x, y);
		ctx.stroke();
	}

	function stopDrawing() {
		if (drawing) {
			drawing = false;
			hasSigned = true;
		}
	}

	function clearCanvas() {
		if (!canvas || !ctx) return;
		const rect = canvas.getBoundingClientRect();
		ctx.clearRect(0, 0, rect.width, rect.height);
		hasSigned = false;
	}

	function handleContinue() {
		console.log('Consent confirmed');
		// TODO: save signature + consent metadata and navigate
	}
</script>

<!-- MAIN PAGE -->
<main class="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10 text-slate-900">
	<div class="w-full max-w-3xl space-y-10">
		<div
			class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs tracking-[0.2em] text-slate-500 uppercase shadow-sm"
		>
			<span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
			Consent &amp; Signature
		</div>

		<section class="space-y-3">
			<h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">
				<span class="mb-1 block text-sm text-slate-500 sm:text-base"> SAM-CHF Trial </span>
				<span class="block font-bold"> Participant Consent – Signature Capture </span>
			</h1>
			<p class="max-w-2xl text-sm text-slate-600 sm:text-base">
				Please review the consent form with the participant. Once all questions are answered and
				consent is confirmed, request the participant to sign below.
			</p>

			<!-- VIEW CONSENT BUTTON -->
			<button
				class="mt-4 inline-flex items-center rounded-full bg-slate-800 px-4 py-2 text-sm text-white hover:bg-slate-700"
				on:click={() => (showConsent = true)}
			>
				View Full Consent (Hindi)
			</button>
		</section>

		<!-- SIGNATURE CARD -->
		<section
			class="space-y-4 rounded-2xl border border-slate-200 bg-white px-4 py-5 shadow-sm sm:px-6 sm:py-6"
		>
			<div class="flex items-center justify-between gap-3">
				<div>
					<h2 class="text-sm font-semibold tracking-[0.18em] text-slate-500 uppercase">
						Participant Signature
					</h2>
					<p class="mt-1 text-xs text-slate-500">Sign inside the box.</p>
				</div>

				<button
					type="button"
					on:click={clearCanvas}
					class="inline-flex items-center justify-center rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
				>
					Clear
				</button>
			</div>

			<div class="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 px-3 py-3">
				<div class="relative h-64 sm:h-72">
					<canvas
						bind:this={canvas}
						class="h-full w-full touch-none rounded-lg bg-white shadow-inner"
						on:pointerdown={handlePointerDown}
						on:pointermove={handlePointerMove}
						on:pointerup={stopDrawing}
						on:pointerleave={stopDrawing}
					/>
				</div>
			</div>
		</section>

		<section class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<p class="text-xs text-slate-500">
				By continuing, you confirm the participant fully understands and voluntarily consents.
			</p>

			<button
				type="button"
				on:click={handleContinue}
				disabled={!hasSigned}
				class="inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-medium shadow-sm transition-colors
          {hasSigned
					? 'bg-emerald-500 text-white hover:bg-emerald-400'
					: 'cursor-not-allowed bg-slate-200 text-slate-500'}"
			>
				Continue
			</button>
		</section>
	</div>
</main>

<!-- CONSENT MODAL VIA COMPONENT -->
{#if showConsent}
	<HindiConsent onClose={() => (showConsent = false)} />
{/if}
