import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
  // Vite 번들에 포함되도록 import도 가능하지만, 예시에서는 fetch 사용
  const res = await fetch('/phrases.json'); // 아래 라우트에서 제공
  const data = await res.json();
  return { phrases: data.items as string[] };
};
