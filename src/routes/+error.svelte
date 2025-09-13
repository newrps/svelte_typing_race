<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';

  // $page.status가 가장 신뢰할 수 있음
  $: currentStatus = $page.status ?? (/** @ts-ignore */ $page?.error?.status) ?? null;

  onMount(() => {
    if (!browser) return;

    if (currentStatus === 404) {
      // 히스토리 오염 없애기
      goto('/rooms', { replaceState: true }).catch(() => {
        location.replace('/rooms');
      });
    }
  });
</script>

{#if currentStatus !== 404}
  <h1>{currentStatus ?? 'Error'}</h1>
  <!-- 필요시 에러 메시지 출력 -->
{/if}
