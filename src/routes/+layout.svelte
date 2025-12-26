<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import AppShell from '$lib/components/layout/AppShell.svelte';

	let { data, children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Beads - Issue Tracker</title>
</svelte:head>

<AppShell repos={data.repos}>
	{@render children()}
</AppShell>
