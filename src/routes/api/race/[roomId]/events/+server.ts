import type { RequestHandler } from './$types';
import { getOrCreateRoom, subscribe, unsubscribe } from '$lib/server/raceStore';

export const GET: RequestHandler = async ({ params, setHeaders }) => {
  const room = getOrCreateRoom(params.roomId);

  setHeaders({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive'
  });

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const client = subscribe(room, controller);
      (controller as any)._client = client; // detach reference for cancel
    },
    cancel() {
      const client = (this as any)._client;
      if (client) unsubscribe(room, client);
    }
  });

  return new Response(stream);
};
