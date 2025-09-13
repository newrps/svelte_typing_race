import type { PageLoad } from './$types';

export const load = async ({ fetch }) => {
  const res = await fetch('/api/rooms');
  const data = await res.json().catch(() => ({ rooms: [] }));
  return { rooms: data.rooms ?? [] };
};
