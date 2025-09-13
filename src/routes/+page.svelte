<script lang="ts">
  import { onMount } from "svelte";

  let phrase = "";
  let typed = "";
  let startedAt: number | null = null;
  let finishedAt: number | null = null;
  let elapsed = 0;
  let timer: number | null = null;
  let inputEl: HTMLInputElement;

  $: total = phrase.length;
  $: correct = [...typed].filter((ch, i) => ch === phrase[i]).length;
  $: minutes = elapsed > 0 ? elapsed / 60 : 0;
  $: wpm = minutes > 0 ? Math.round((correct / 5) / minutes) : 0;
  $: progress = total ? Math.min(typed.length / total, 1) : 0;

  function startTimer() {
    if (startedAt) return;
    startedAt = Date.now();
    timer = setInterval(() => {
      if (startedAt && !finishedAt) elapsed = (Date.now() - startedAt) / 1000;
    }, 50) as unknown as number;
  }

  async function loadPhrase() {
    const res = await fetch("/phrases.json");
    const data = await res.json();
    phrase = data.items[Math.floor(Math.random() * data.items.length)];
    reset();
  }

  function reset() {
    typed = "";
    startedAt = null;
    finishedAt = null;
    elapsed = 0;
    if (timer) clearInterval(timer);
    setTimeout(() => inputEl?.focus(), 50);
  }

  function onInput(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    if (!startedAt && val.length > 0) startTimer();
    typed = val;
    if (val === phrase) {
      finishedAt = Date.now();
      if (timer) clearInterval(timer);
      elapsed = startedAt ? (finishedAt - startedAt) / 1000 : elapsed;
    }
  }

  onMount(loadPhrase);
</script>

<svelte:head><title>싱글 모드 타자 연습</title></svelte:head>

<div class="wrap">
  <h1>싱글 모드 타자 연습</h1>
  <p><a class="btn ghost" href="/rooms">멀티플레이 →</a></p>

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

  <button class="btn" on:click={reset}>다시하기</button>
  <button class="btn ghost" on:click={loadPhrase}>새 문구</button>
</div>

<style>
  .wrap { max-width: 700px; margin: 40px auto; padding: 0 16px; font-family: system-ui, sans-serif; }
  h1 { font-size: 22px; margin-bottom: 14px; }
  .btn { padding: 8px 12px; border-radius: 8px; background:#111827; color:#fff; text-decoration:none; margin-right:8px; }
  .btn.ghost { background:#f3f4f6; color:#111827; }
  .panel.phrase { border:1px solid #e5e7eb; border-radius:8px; padding:16px; min-height:84px; background:#fafafa; line-height:1.8; font-size:18px; user-select:none; margin-bottom:10px; }
  .input { width:100%; padding:12px 14px; font-size:18px; border:1px solid #d1d5db; border-radius:8px; outline:none; }
  .input:focus { border-color:#6366f1; box-shadow:0 0 0 3px rgba(99,102,241,0.2); }
  .stats { display:flex; gap:16px; font-size:14px; color:#374151; margin:10px 0 12px; }
  .ok { color:#16a34a; }
  .bad { color:#dc2626; background:rgba(220,38,38,0.06); border-radius:3px; }
  .pending { color:#6b7280; }
</style>
