<script lang="ts">
  import { onMount } from 'svelte';

  export let params: { roomId: string };

  let name = '';
  let joined = false;
  let playerId: string | null = null;
  let roomTitle = '';
  let phrase = '';
  let typed = '';
  let startedAt: number | null = null;
  let finishedAt: number | null = null;
  let elapsed = 0;
  let timer: number | null = null;

  type PlayerView = { id: string; name: string; progress: number; wpm: number; finished: boolean };
  let players: PlayerView[] = [];

  let inputEl: HTMLInputElement;

  function startTimer() {
    if (startedAt) return;
    startedAt = Date.now();
    timer = setInterval(() => {
      if (startedAt && !finishedAt) elapsed = (Date.now() - startedAt) / 1000;
    }, 50) as unknown as number;
  }

  function correctCount(localTyped: string, localPhrase: string) {
    let c = 0;
    const min = Math.min(localTyped.length, localPhrase.length);
    for (let i = 0; i < min; i++) {
      if (localTyped[i] === localPhrase[i]) c++; else break;
    }
    return c;
  }

  $: total = phrase.length;
  $: correct = [...typed].filter((ch, i) => ch === phrase[i]).length;
  $: minutes = elapsed > 0 ? elapsed / 60 : 0;
  $: wpm = minutes > 0 ? Math.round((correct / 5) / minutes) : 0;
  $: progress = total ? Math.min(typed.length / total, 1) : 0;

  let passcode = '';
  async function joinRoom() {
    if (!name.trim()) name = 'player';
    const res = await fetch(`/api/race/${params.roomId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, passcode })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (err?.error === 'passcode_required') { alert('암호가 필요하거나 틀렸습니다.'); return; }
      if (err?.error === 'room_full') { alert('정원이 가득 찼습니다.'); return; }
      alert('입장에 실패했습니다.'); return;
    }
    const data = await res.json();
    playerId = data.playerId;
    phrase = data.room.phrase;
    players = data.room.players;
    roomTitle = data.room.title || roomTitle;
    joined = true;
    connectSSE();
    setTimeout(() => inputEl?.focus(), 50);
  }

  let es: EventSource | null = null;
  function connectSSE() {
    es = new EventSource(`/api/race/${params.roomId}/events`);
    es.addEventListener('state', (e: MessageEvent) => {
      const s = JSON.parse(e.data);
      console.log(s);
      phrase = s.phrase;
      players = s.players;
      roomTitle = s.title || roomTitle;
    });
    es.addEventListener('players', (e: MessageEvent) => {
      players = JSON.parse(e.data);
    });
    es.addEventListener('winner', (e: MessageEvent) => {
      const w = JSON.parse(e.data);
      console.log('winner:', w);
    });
  }

  function charClass(i: number) {
    if (i < typed.length) return typed[i] === phrase[i] ? 'ok' : 'bad';
    return 'pending';
  }

  async function onInput(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    if (!startedAt && val.length > 0) startTimer();

    // 로컬에서 즉시 진행률 계산
    const totalLocal = phrase.length;
    const correctLocal = correctCount(val, phrase);
    const progressLocal = totalLocal ? Math.min(correctLocal / totalLocal, 1) : 0;

    typed = val;

    const isFinished = val === phrase;

    if (playerId) {
      await fetch(`/api/race/${params.roomId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          name,
          progress: isFinished ? 1 : progressLocal, // ✅ 완주 시 100%
          wpm,
          finished: isFinished
        })
      });
    }

    if (isFinished) {
      finishedAt = Date.now();
      if (timer) clearInterval(timer);
      elapsed = startedAt ? (finishedAt - startedAt) / 1000 : elapsed;
    }
  }

  function resetLocal() {
    typed = '';
    startedAt = null;
    finishedAt = null;
    elapsed = 0;
    inputEl?.focus();
  }

  


  onMount(() => {
    if (!es) connectSSE();
    return () => {
      if (es) es.close();
      if (timer) clearInterval(timer);
    };
  });
</script>

<svelte:head>
  <title>타자 대결 | 방 {roomTitle || params.roomId}</title>
</svelte:head>

<div class="wrap">
  <h1>타자 대결 — 방 <code>{roomTitle || params.roomId}</code></h1>

  {#if !joined}
    <div class="join">
      <input class="name" placeholder="닉네임" bind:value={name} />
      <!--<input class="name" placeholder="암호(비공개 방일 때만)" bind:value={passcode} />-->
      <button class="btn" on:click={joinRoom}>입장</button>
    </div>
  {:else}
    <div class="layout">
      <section class="left">
      <div class="panel phrase">
        {#each phrase.split('') as ch, i}
          <span class={i < typed.length ? (typed[i] === ch ? 'ok' : 'bad') : 'pending'}>
            {ch}
          </span>
        {/each}
      </div>
        <input
          bind:this={inputEl}
          class="input"
          type="text"
          placeholder="여기에 타이핑하세요"
          value={typed}
          on:input={onInput}
          autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
        />
        <div class="stats">
          <div>진행률: {(progress * 100).toFixed(1)}%</div>
          <div>WPM: {wpm}</div>
          <div>시간: {elapsed.toFixed(2)}s</div>
        </div>
        <button class="btn ghost" on:click={resetLocal}>재도전(내 입력만 초기화)</button>
      </section>

      <aside class="right">
        <h3>참가자</h3>
        <ul class="players">
          {#each players as p}
            <li class="player">
              <div class="row">
                <strong>{p.name}</strong>
                <span class="mini">{p.finished ? 100 : Math.round(p.progress * 100)}% • {p.wpm} WPM {p.finished ? '🏁' : ''}</span>
              </div>
              <div class="bar">
                <div class="fill" style={`width:${p.finished ? 100 : Math.round(p.progress * 100)}%`}></div>
              </div>
            </li>
          {/each}
        </ul>
      </aside>
    </div>
  {/if}
</div>

<style>
  .wrap { max-width: 1000px; margin: 40px auto; padding: 0 16px; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
  h1 { font-size: 22px; margin-bottom: 14px; }
  code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }
  .join { display: flex; gap: 8px; }
  .name { flex: 1; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; }
  .btn { padding: 10px 14px; border-radius: 8px; background: #111827; color: #fff; border: none; cursor: pointer; }
  .btn:hover { background: #0b1220; }
  .btn.ghost { background: #f3f4f6; color: #111827; }
  .layout { display: grid; grid-template-columns: 3fr 2fr; gap: 20px; }
  .panel.phrase { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; min-height: 84px; background: #fafafa; line-height: 1.8; font-size: 18px; user-select: none; margin-bottom: 10px; }
  .input { width: 100%; padding: 12px 14px; font-size: 18px; border: 1px solid #d1d5db; border-radius: 8px; outline: none; }
  .input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.2); }
  .stats { display: flex; gap: 16px; font-size: 14px; color: #374151; margin: 10px 0 12px; }
  .ok { color:#16a34a !important; font-weight:700; }
  .bad { color:#dc2626 !important; background:rgba(220,38,38,.12); border-radius:3px; font-weight:700; }
  .pending { color: #6b7280; }
  aside.right h3 { margin: 8px 0; }
  .players { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
  .player .row { display: flex; align-items: baseline; justify-content: space-between; }
  .mini { color: #6b7280; font-size: 12px; }
  .bar { height: 10px; background: #e5e7eb; border-radius: 6px; overflow: hidden; }
  .fill { height: 100%; background: #10b981; }
  
  @media (max-width: 900px) { .layout { grid-template-columns: 1fr; } }
</style>
