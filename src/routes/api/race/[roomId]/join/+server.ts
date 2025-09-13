import type { RequestHandler } from './$types';
import { getOrCreateRoom, upsertPlayer, serialize } from '$lib/server/raceStore';

export const POST: RequestHandler = async ({ params, request }) => {
  const { name, passcode } = await request.json().catch(() => ({}));
  const room = getOrCreateRoom(params.roomId);

  // 비공개 방: 암호 확인
  if (room.isPrivate) {
    if (!passcode || passcode !== room.passcode) {
      return new Response(JSON.stringify({ error: 'passcode_required' }), { status: 401 });
    }
  }
  // 최대 인원 체크
  if (room.maxPlayers && room.players.size >= room.maxPlayers) {
    return new Response(JSON.stringify({ error: 'room_full' }), { status: 403 });
  }

  const id = crypto.randomUUID();
  upsertPlayer(room, { id, name: name?.slice(0, 20) || 'player' });
  return new Response(JSON.stringify({ playerId: id, room: serialize(room) }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
