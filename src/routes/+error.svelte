<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';

  // SvelteKit의 에러 객체 타입을 명시적으로 정의합니다.
  type SvelteKitError = {
    status: number;
    message: string;
  };

  // $page.status를 먼저 사용하고, 에러 객체에 status가 있다면 그 값을 사용합니다.
  // 에러 객체의 타입을 SvelteKitError로 단언(as SvelteKitError)하여 타입 오류를 해결합니다.
  $: currentStatus = $page.status ?? ($page.error as SvelteKitError)?.status ?? null;

  onMount(() => {
    if (!browser) return;

    if (currentStatus === 404) {
      // 히스토리 오염 없이 리다이렉트
      goto('/rooms', { replaceState: true }).catch(() => {
        // goto가 실패할 경우를 대비한 대체 방법
        location.replace('/rooms');
      });
    }
  });
</script>

{#if currentStatus !== 404}
  <div class="error-container">
    <h1 class="text-4xl font-bold">{currentStatus ?? 'Error'}</h1>
    <p class="mt-4 text-gray-600">
      {#if $page.error}
        <!-- 에러 메시지가 있다면 출력 -->
        {$page.error.message}
      {/if}
    </p>
  </div>
{/if}

<style>
  .error-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100vh;
    text-align: center;
    background-color: #f8f8f8;
  }
</style>



### **변경 사항 설명**

1.  **타입 명시적 정의**: `SvelteKitError` 타입을 직접 정의하여 `$page.error`가 가질 수 있는 `status`와 `message` 속성을 명확하게 했습니다.
2.  **타입 단언**: `$page.error` 객체를 사용할 때 **`as SvelteKitError`**를 사용하여 TypeScript에게 "이 객체는 `SvelteKitError` 타입이야"라고 알려줍니다. 이렇게 하면 `status` 속성에 접근할 때 더 이상 타입 에러가 발생하지 않습니다.
3.  **UI 개선**: 에러 메시지가 있을 경우에만 표시하도록 UI 로직을 추가했습니다. 또한, 기본적인 스타일을 추가하여 에러 페이지가 더 보기 좋게 만들었습니다.

이제 코드를 수정하면 타입스크립트 에러 없이 404 페이지를 올바르게 처리할 수 있습니다.