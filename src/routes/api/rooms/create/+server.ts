import type { RequestHandler } from './$types';
import { createRoom } from '$lib/server/raceStore';

export const POST: RequestHandler = async ({ request }) => {
  const { id, title, phrase } = await request.json().catch(() => ({}));
  const room = createRoom({
    id: id?.toString().trim() || undefined,
    title: title?.toString().trim() || undefined,
    phrase: phrase?.toString().trim() || undefined
  });
  return new Response(JSON.stringify({ roomId: room.id, title: room.title }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
