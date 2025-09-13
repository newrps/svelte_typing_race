import type { RequestHandler } from './$types';
// ⬇️ 서버 스토어에서 함수들을 꼭 가져오세요
import { getOrCreateRoom, upsertPlayer, send } from '$lib/server/raceStore';

export const POST: RequestHandler = async ({ params, request }) => {
  const room = getOrCreateRoom(params.roomId);
  const { playerId, name, progress, wpm, finished } = await request.json();

  const wasAnyFinished = Array.from(room.players.values()).some(p => p.finished);

  const isFinished = Boolean(finished);
  const progNum = isFinished ? 1 : Math.max(0, Math.min(1, Number(progress ?? 0)));

  upsertPlayer(room, {
    id: playerId,
    name,
    progress: progNum,
    wpm: Math.max(0, Math.round(Number(wpm ?? 0))),
    finished: isFinished
  });

  if (isFinished && !wasAnyFinished) {
    send(room, 'winner', { playerId, name });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
