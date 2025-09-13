<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.png';
	import AdRails from '$lib/components/AdRails.svelte';
	import ogimg from '$lib/assets/og_img.png';
	let { children } = $props();
</script>

<AdRails width={160} height={600} offsetTop={90}/>
<svelte:head>
	<link rel="icon" href={favicon} />
    <meta property="og:title" content="잼잼 타자 게임 - 당신의 한계에 도전하세요!" />
    <meta property="og:description" content="실시간 멀티플레이 타자 게임 'zamzam'에서 친구들과 타자 실력을 겨뤄보세요. 스릴 넘치는 경쟁이 당신을 기다립니다! 점심내기도 가능해요." />
    <meta property="og:url" content="https://zam.zam.kr" />
    <meta property="og:image" content={ogimg} />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="잠잠 타자 게임 - 당신의 한계에 도전하세요!" />
    <meta name="twitter:description" content="실시간 멀티플레이 타자 게임 'zamzam'에서 친구들과 타자 실력을 겨뤄보세요. 스릴 넘치는 경쟁이 당신을 기다립니다!" />
    <meta name="twitter:image" content={ogimg} />	
</svelte:head>
{@render children?.()}
