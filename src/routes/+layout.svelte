<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import AdRails from '$lib/components/AdRails.svelte';
	let { children } = $props();
</script>

<AdRails width={160} height={600} offsetTop={90}/>
<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>
{@render children?.()}
