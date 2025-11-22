<!-- src/lib/components/general/Header.svelte -->
<script lang="ts">
	import { UserRound, LogOut } from '@lucide/svelte';
	import { logout } from '$lib/auth';
	import { currentUser } from '$lib/auth';
	import { onMount } from 'svelte';
	import { navigating } from '$app/stores';

	let open = false;

	// Close dropdown on outside click
	function handleOutsideClick(event: MouseEvent) {
		const menu = document.getElementById('user-menu');
		const btn = document.getElementById('user-button');

		if (
			menu &&
			btn &&
			!menu.contains(event.target as Node) &&
			!btn.contains(event.target as Node)
		) {
			open = false;
		}
	}

	onMount(() => {
		document.addEventListener('click', handleOutsideClick);
		return () => document.removeEventListener('click', handleOutsideClick);
	});

	async function handleLogout() {
		await logout();

		// Redirect to login page
		window.location.href = '/login';
	}
</script>

<header
	class="relative sticky top-0 z-50 flex w-full items-center justify-between overflow-hidden border-b border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
>
	<!-- Left Label -->
	<a href="/" class="font-bold tracking-tight">SAM-CHF</a>

	<!-- Right User Icon -->
	<div class="relative">
		<button
			id="user-button"
			class="cursor-pointer rounded-full p-2 transition hover:bg-slate-100 active:bg-slate-200"
			on:click={() => (open = !open)}
			aria-label="User menu"
		>
			<UserRound class="h-6 w-6" />
		</button>

		{#if open}
			<div
				id="user-menu"
				class="animate-fadeIn absolute right-0 mt-2 w-40 rounded-lg border border-slate-200 bg-white py-2 shadow-lg"
			>
				<button
					class="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
					on:click={handleLogout}
				>
					<LogOut class="h-4 w-4" />
					Log out
				</button>
			</div>
		{/if}
	</div>

	<!-- Bottom navigation loader -->
	<div class="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 overflow-hidden">
		{#if $navigating}
			<div class="header-loader h-full w-1/3 bg-emerald-500" />
		{/if}
	</div>
</header>

<style>
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(-4px);
		}
		to {
			opacity: 1;
			transform: translateY(0px);
		}
	}
	.animate-fadeIn {
		animation: fadeIn 0.12s ease-out;
	}

	@keyframes headerSlide {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(300%);
		}
	}
	.header-loader {
		animation: headerSlide 0.9s ease-in-out infinite alternate;
	}
</style>
