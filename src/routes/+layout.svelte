<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Header from '$lib/components/general/Header.svelte';

	import { currentUser, authReady, initAuthListener } from '$lib/auth';
	import { onMount } from 'svelte';

	let { children } = $props();

	// Set up Firebase Auth listener once on the client
	onMount(() => {
		initAuthListener();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if !$authReady}
	<!-- Optional: auth still resolving, show nothing or a tiny loader -->
{:else if $currentUser}
	<!-- User is logged in -->
	<Header />
{/if}

{@render children()}
