// src/lib/server/raceStore.ts
import phrases from '$lib/data/phrases.json';

export type Player = {
  id: string;
  name: string;
  progress: number;
  wpm: number;
  finished: boolean;
};

export type Room = {
  id: string;
  title: string;
  phrase: string;
  players: Map<string, Player>;
  subscribers: Set<SSEClient>;
  startedAt?: number;
  createdAt: number;
  updatedAt: number;

  // 🔐 비공개/암호/정원 기능 추가
  isPrivate?: boolean;
  passcode?: string;      // 암호 저장
  maxPlayers?: number;    // 최대 인원
};

export type SSEClient = {
  id: string;
  controller: ReadableStreamDefaultController<Uint8Array>;
  heartbeat: ReturnType<typeof setInterval>;
  closed: boolean;
};

const rooms = new Map<string, Room>();
const enc = new TextEncoder();

export function getOrCreateRoom(id: string) {
  return rooms.get(id) ?? createRoom({ id });
}

// 2) 방 생성은 이 함수만 사용
export function createRoom(params: {
  id?: string;
  title?: string;
  phrase?: string;
  isPrivate?: boolean;
  passcode?: string;
  maxPlayers?: number;
}) {
  const id = (params.id ?? crypto.randomUUID()).toLowerCase();
  if (rooms.has(id)) return rooms.get(id)!;

  const pool = phrases.items ?? [];
  const phrase = params.phrase ?? pool[Math.floor(Math.random() * pool.length)] ?? '연습 문구가 없습니다.';
  const now = Date.now();

  const room: Room = {
    id,
    title: (params.title?.trim() || `방 ${id.slice(0, 6)}`),
    phrase,
    players: new Map(),
    subscribers: new Set(),
    createdAt: now,
    updatedAt: now,
    isPrivate: !!params.isPrivate,
    passcode: params.passcode?.trim() || undefined,
    maxPlayers: typeof params.maxPlayers === 'number' ? params.maxPlayers : undefined
  };

  rooms.set(id, room);
  return room;
}


function safeEnqueue(room: Room, client: SSEClient, bytes: Uint8Array) {
  if (client.closed) return;
  try {
    client.controller.enqueue(bytes);
  } catch (e) {
    // 컨트롤러가 이미 닫힘 → 구독 해제
    unsubscribe(room, client);
  }
}

export function subscribe(room: Room, controller: ReadableStreamDefaultController<Uint8Array>): SSEClient {
  const client: SSEClient = {
    id: crypto.randomUUID(),
    controller,
    closed: false,
    heartbeat: setInterval(() => {
      // keep-alive, 실패 시 해제
      const ping = enc.encode(':hb\n\n');
      safeEnqueue(room, client, ping);
    }, 15000)
  };
  room.subscribers.add(client);

  // 초기 상태 전송(안전 enqueue)
  const init = enc.encode(`event: state\ndata: ${JSON.stringify(serialize(room))}\n\n`);
  safeEnqueue(room, client, init);

  return client;
}

export function unsubscribe(room: Room, client: SSEClient) {
  if (client.closed) return;
  client.closed = true;
  clearInterval(client.heartbeat);
  room.subscribers.delete(client);
  // controller.close() 를 여기서 굳이 호출할 필요는 없음(이미 닫혔을 수 있음)
}

export function send(room: Room, event: string, data: unknown) {
  room.updatedAt = Date.now();                       // ✅ 갱신
  const payload = enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  for (const s of Array.from(room.subscribers)) safeEnqueue(room, s, payload);
}

export function upsertPlayer(room: Room, partial: Partial<Player> & { id: string; name?: string }) {
  const cur = room.players.get(partial.id) ?? { id: partial.id, name: partial.name ?? 'player', progress: 0, wpm: 0, finished: false };
  const next = { ...cur, ...partial };
  room.players.set(next.id, next);
  room.updatedAt = Date.now();                       // ✅ 갱신
  send(room, 'players', serializePlayers(room));
}

export function serialize(room: Room) {
  return {
    roomId: room.id,
    phrase: room.phrase,
    players: serializePlayers(room),
    startedAt: room.startedAt ?? null,
    title: room.title,
    updatedAt: room.updatedAt
  };
}

export function serializePlayers(room: Room) {
  return Array.from(room.players.values());
}

export function listRooms() {
  const arr: Array<{
    id: string; title: string; createdAt: number; updatedAt: number;
    playersCount: number; spectatorsCount: number; phrasePreview: string;
    isPrivate?: boolean; maxPlayers?: number | null;
  }> = [];
  for (const r of rooms.values()) {
    arr.push({
      id: r.id,
      title: r.title,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      playersCount: r.players.size,
      spectatorsCount: r.subscribers.size,
      phrasePreview: r.phrase.length > 32 ? r.phrase.slice(0, 32) + "…" : r.phrase,
      isPrivate: !!r.isPrivate,
      maxPlayers: r.maxPlayers ?? null
    });
  }
  return arr.sort((a, b) => b.updatedAt - a.updatedAt);
}