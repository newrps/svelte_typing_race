import type { RequestHandler } from "./$types";

// raceStore에서 목록 함수를 가져옵니다.
// $lib 별칭이 안 먹으면 아래 줄을 주석 처리하고, 그 아래 상대경로 import 사용으로 바꾸세요.
import { listRooms } from "$lib/server/raceStore";
// import { listRooms } from "../../../lib/server/raceStore"; // ← $lib가 안 되면 이 줄 사용

export const GET: RequestHandler = async () => {
  try {
    const rooms = listRooms ? listRooms() : [];
    return new Response(JSON.stringify({ rooms }), {
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
    });
  } catch (e) {
    // raceStore가 아직 없다면 빈 목록으로라도 동작하게
    return new Response(JSON.stringify({ rooms: [] }), {
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
    });
  }
};
