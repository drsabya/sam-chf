<!-- src/routes/login/+page.svelte -->
<script lang="ts">
	import { loginWithEmailPassword, authError } from '$lib/auth';
	import { goto } from '$app/navigation';
	import { get } from 'svelte/store';
	import { getAuth } from 'firebase/auth';

	let email = '';
	let password = '';
	let error: string | null = null;
	let loading = false;

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		error = null;
		loading = true;

		try {
			await loginWithEmailPassword(email.trim(), password);

			const auth = getAuth();
			const user = auth.currentUser;

			if (!user) throw new Error('Login succeeded but user not found.');

			const idToken = await user.getIdToken(true);

			const res = await fetch('/apis/session', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ idToken })
			});

			if (!res.ok) {
				let apiError = 'Failed to establish secure session.';
				try {
					const data = await res.json();
					if (data?.error) apiError = data.error;
				} catch {}
				throw new Error(apiError);
			}

			goto('/');
		} catch (e: any) {
			const storeError = get(authError);
			error = storeError ?? e?.message ?? 'Login failed';
		} finally {
			loading = false;
		}
	}
</script>

<section
	class="flex min-h-screen items-center justify-center bg-slate-100 px-4 font-mono text-slate-800"
>
	<div class="w-full max-w-md space-y-6">
		<header class="space-y-1 text-center">
			<p class="text-[10px] tracking-[0.28em] text-slate-500 uppercase">SAM-CHF · WORKSPACE</p>
			<h1 class="text-xl font-bold tracking-tight">Sign in</h1>
			<p class="text-[11px] text-slate-500">Access restricted to study personnel.</p>
		</header>

		<form
			class="space-y-5 rounded-2xl border border-slate-300 bg-white px-6 py-7 shadow-[0_6px_28px_rgba(0,0,0,0.06)]"
			on:submit|preventDefault={handleSubmit}
		>
			<label class="block text-[11px] font-semibold tracking-[0.14em] text-slate-600 uppercase">
				<span class="mb-1 block">Email</span>
				<input
					type="email"
					bind:value={email}
					required
					placeholder="yourname@gmail.com"
					class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
				/>
			</label>

			<label class="block text-[11px] font-semibold tracking-[0.14em] text-slate-600 uppercase">
				<span class="mb-1 block">Password</span>
				<input
					type="password"
					bind:value={password}
					required
					autocomplete="current-password"
					placeholder="••••••••••"
					class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
				/>
			</label>

			{#if error}
				<p class="text-[11px] leading-snug text-red-600">
					{error}
				</p>
			{/if}

			<button
				type="submit"
				class="flex w-full items-center justify-center rounded-xl bg-slate-900 py-2.5 text-xs font-bold tracking-[0.22em] text-white uppercase transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
				disabled={loading}
			>
				{#if loading}
					<span class="inline-flex items-center gap-2">
						<span
							class="h-3 w-3 animate-spin rounded-full border border-white border-b-transparent"
						/>
						<span>Signing in…</span>
					</span>
				{:else}
					<span>Sign in</span>
				{/if}
			</button>

			<p class="pt-2 text-center text-[10px] text-slate-500">
				By signing in, you agree to confidentiality guidelines.
			</p>
		</form>
	</div>
</section>
