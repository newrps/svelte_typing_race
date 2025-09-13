<script lang="ts">
  export let data: { rooms: Array<{ id:string; title:string; playersCount:number; spectatorsCount:number; }> };

  let newTitle = '';
  let newId = '';      // 비워두면 자동 생성
  let newPhrase = '';  // 비워두면 랜덤
  let creating = false;

  async function createRoom() {
    if (creating) return;
    creating = true;
    try {
      const res = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newId.trim() || undefined,
          title: newTitle.trim() || undefined,
          phrase: newPhrase.trim() || undefined
        })
      });
      if (!res.ok) { alert('방 생성 실패'); return; }
      const data = await res.json();
      location.href = `/race/${data.roomId}`;
    } finally {
      creating = false;
    }
  }
</script>

<svelte:head><title>방 선택 / 생성</title></svelte:head>

<div class="wrap">
  <h1>방 선택 / 생성</h1>

  <!-- ✅ 방 생성 폼 -->
  <section class="create">
    <h2>새 방 만들기</h2>
    <div class="row">
      <input class="input" placeholder="방 제목 (예: 점심 레이스)" bind:value={newTitle} />
      <input class="input" placeholder="방 ID (선택, 비우면 자동)" bind:value={newId} />
    </div>
    <textarea class="input" rows="2" placeholder="문구 고정(선택). 비우면 랜덤 문구가 설정됩니다." bind:value={newPhrase}></textarea>
    <div class="actions">
      <button class="btn" on:click={createRoom} disabled={creating}>
        {creating ? '생성 중…' : '생성 후 입장'}
      </button>
      <a class="btn ghost" href="/">홈</a>
    </div>
  </section>

  <!-- 방 목록 -->
  <section class="list">
    <h2>열려 있는 방</h2>
    {#if (data.rooms?.length ?? 0) === 0}
      <p>열려 있는 방이 없습니다. 위에서 새로 만들어 보세요.</p>
    {:else}
      <ul class="rooms">
        {#each data.rooms as r}
          <li class="room">
            <div class="left">
              <div class="title">{r.title}</div>
              <div class="meta">
                <code>{r.id}</code>
                <span>• 참가 {r.playersCount}</span>
                <span>• 관전 {r.spectatorsCount}</span>
              </div>
            </div>
            <div class="right">
              <a class="btn" href={`/race/${r.id}`}>입장</a>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</div>

<style>
  .room {
  display: flex;
  justify-content: space-between;
  align-items: center; /* 세로 중앙 정렬 */
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 12px;
  gap: 10px; /* 왼쪽과 오른쪽 요소 간 간격 추가 */
}

.room .left {
  flex-grow: 1; /* 남은 공간을 모두 차지하도록 */
  min-width: 0; /* flexbox에서 콘텐츠가 넘칠 때를 대비하여 최소 너비 설정 */
}

.room .right {
  flex-shrink: 0; /* 공간이 부족해도 줄어들지 않도록 */
}
  .wrap { max-width: 900px; margin: 32px auto; padding: 0 16px; font-family: system-ui,-apple-system,Segoe UI,Roboto,sans-serif; }
  h1 { font-size: 24px; margin-bottom: 16px; }
  h2 { font-size: 18px; margin: 16px 0 8px; }
  .row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
  .input { width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; }
  .actions { display:flex; gap:8px; margin: 8px 0 16px; }
  .btn { padding: 10px 14px; border-radius: 8px; background:#111827; color:#fff; border:none; cursor:pointer; text-decoration:none;}
  .btn:hover { background:#0b1220; }
  .btn.ghost { background:#f3f4f6; color:#111827; }
  .rooms { list-style:none; padding:0; margin:12px 0 0; display:flex; flex-direction:column; gap:10px; }
  .room { display:flex; justify-content:space-between; align-items:center; border:1px solid #e5e7eb; border-radius:10px; padding:12px; }
  .title { font-weight:700; margin-bottom:4px; }
  .meta { color:#6b7280; display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
</style>
