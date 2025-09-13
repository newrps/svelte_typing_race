// scripts/generate-phrases.mjs
// Node 18+ 권장. 외부 라이브러리 없이 1000개 문구를 자동 생성해 static/phrases.json 로 저장.
// 사용법 예시:
//   node scripts/generate-phrases.mjs --count 1000 --lang mix --min 15 --max 60 --sets basic,proverb,tech,code,pangram,number,symbols --out static/phrases.json

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ───────────────────────────────────────────────────────────────────────────────
// 간단한 옵션 파서 (의존성 없이)
const args = process.argv.slice(2);
const opt = {};
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a.startsWith("--")) {
    const key = a.slice(2);
    const next = args[i + 1];
    if (!next || next.startsWith("--")) {
      opt[key] = true;
    } else {
      opt[key] = next;
      i++;
    }
  }
}

const COUNT = Number(opt.count ?? 1000);
const LANG = String(opt.lang ?? "mix"); // "ko" | "en" | "mix"
const MIN_LEN = Number(opt.min ?? 15);
const MAX_LEN = Number(opt.max ?? 60);
const OUT = String(opt.out ?? path.join(process.cwd(), "static", "phrases.json"));
const SETS = String(opt.sets ?? "basic,proverb,tech,code,pangram,number,symbols")
  .split(",").map(s => s.trim()).filter(Boolean);

// ───────────────────────────────────────────────────────────────────────────────
// 재료 풀

// 한국어(기본)
const KO_SUBJ = ["고양이", "강아지", "학생", "개발자", "사용자", "드라이버", "팀원", "선생님", "로봇", "작가", "디자이너", "연구원", "운동선수"];
const KO_VERB = ["달린다", "웃는다", "생각한다", "집중한다", "연습한다", "작성한다", "수정한다", "기록한다", "탐색한다", "분석한다", "학습한다", "테스트한다"];
const KO_OBJ  = ["문장을", "코드를", "기록을", "노트를", "과제를", "프로젝트를", "데이터를", "사진을", "문서를", "아이디어를", "텍스트를"];
const KO_ADVB = ["빠르게", "천천히", "정확하게", "조용히", "꾸준히", "가볍게", "침착하게", "세심하게", "능숙하게", "즐겁게"];

const KO_PROVERB = [
  "바늘 도둑이 소 도둑 된다.", "하늘은 스스로 돕는 자를 돕는다.", "시작이 반이다.", "급할수록 돌아가라.",
  "세 살 버릇 여든 간다.", "호랑이 굴에 가야 호랑이 새끼를 잡는다.", "고생 끝에 낙이 온다.", "티끌 모아 태산."
];

// 영어(기본)
const EN_SUBJ = ["A cat", "A dog", "A student", "A developer", "The user", "The driver", "The team", "The robot", "The writer"];
const EN_VERB = ["runs", "laughs", "thinks", "focuses", "practices", "writes", "edits", "records", "explores", "analyzes", "tests"];
const EN_OBJ  = ["a sentence", "the code", "a note", "the project", "the data", "a photo", "the document", "an idea", "the text"];
const EN_ADVB = ["quickly", "slowly", "precisely", "silently", "steadily", "lightly", "calmly", "carefully", "smoothly", "happily"];

const EN_PANGRAM = [
  "The quick brown fox jumps over the lazy dog.",
  "Sphinx of black quartz, judge my vow.",
  "Pack my box with five dozen liquor jugs.",
  "How vexingly quick daft zebras jump!",
  "Waltz, bad nymph, for quick jigs vex."
];

// 기술/코드 스타일(짧은 문구 위주, JSON 안전한 따옴표 사용)
const TECH_SNIPS = [
  "npm run dev",
  "git commit -m \"feat: add race mode\"",
  "const sum = (a, b) => a + b;",
  "for (let i = 0; i < n; i++) {}",
  "console.log(\"hello world\")",
  "<div class=\"box\"></div>",
  "SELECT * FROM users WHERE active = 1;",
  "curl -i https://example.com",
  "function debounce(fn, ms) { /* ... */ }",
  "try { /* ... */ } catch (e) { /* ... */ }",
  "await fetch('/api/race')",
  "export default function App() {}",
  "pnpm install",
  "yarn build",
  "docker compose up -d",
  "kubectl get pods"
];

// 숫자/기호 훈련
const SYMBOL_SNIPS = [
  "[ ] { } ( ) < >", "~ ! @ # $ % ^ & * _ + - =",
  "1 2 3 4 5 6 7 8 9 0", "01 23 45 67 89",
  "2025-09-13 17:45", "3.1415926535", "100%, 50%, 25%",
  "C:\\Users\\Typing\\Race", "/usr/local/bin", "email@example.com"
];

// 템플릿
const TEMPLATES_KO = [
  (s, o, v, a) => `${s}가 ${o} ${a} ${v}.`,
  (s, o, v, a) => `${a} ${s}는 오늘도 ${o} ${v}.`,
  (s, o, v, a) => `${s}가 ${v} ${o} ${a}.`,
  (s, o, v, a) => `${s}는 ${a} ${o} ${v} 것으로 실력을 키운다.`
];

const TEMPLATES_EN = [
  (s, o, v, a) => `${s} ${v} ${o} ${a}.`,
  (s, o, v, a) => `${a.charAt(0).toUpperCase() + a.slice(1)}, ${s.toLowerCase()} ${v} ${o}.`,
  (s, o, v, a) => `${s} ${v} ${a} with ${o}.`
];

// ───────────────────────────────────────────────────────────────────────────────
// 유틸
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

function normalize(s) {
  // JSON/타자 비교 안정성을 위해 표준화 + 제로폭/비분리공백 제거
  return s.normalize("NFC").replace(/\u200B|\u200C|\u00A0/g, "");
}

function genBasicKo() {
  const s = pick(KO_SUBJ), o = pick(KO_OBJ), v = pick(KO_VERB), a = pick(KO_ADVB);
  return pick(TEMPLATES_KO)(s, o, v, a);
}
function genBasicEn() {
  const s = pick(EN_SUBJ), o = pick(EN_OBJ), v = pick(EN_VERB), a = pick(EN_ADVB);
  return pick(TEMPLATES_EN)(s, o, v, a);
}

function genProverbKo() { return pick(KO_PROVERB); }
function genTech()      { return pick(TECH_SNIPS); }
function genSymbols()   { return pick(SYMBOL_SNIPS); }
function genPangram()   { return pick(EN_PANGRAM); }

// 길이 필터
function acceptableLen(s) {
  const n = [...s].length;
  return n >= MIN_LEN && n <= MAX_LEN;
}

// 메인 생성기
function* generator() {
  while (true) {
    let cat = pick(SETS);
    let s = "";

    if (cat === "basic") {
      if (LANG === "ko") s = genBasicKo();
      else if (LANG === "en") s = genBasicEn();
      else s = Math.random() < 0.6 ? genBasicKo() : genBasicEn();
    } else if (cat === "proverb") {
      s = genProverbKo();
    } else if (cat === "tech") {
      s = genTech();
    } else if (cat === "code") {
      s = genTech();
    } else if (cat === "pangram") {
      s = genPangram();
    } else if (cat === "number" || cat === "symbols") {
      s = genSymbols();
    } else {
      // fallback
      s = genBasicKo();
    }

    s = normalize(s).replace(/\s+/g, " ").trim();

    // 길이 보정: 너무 짧으면 부가어를 붙여 살짝 늘림
    if ([...s].length < MIN_LEN) {
      const pad = LANG === "en" ? " Keep practicing." : " 꾸준히 연습하자.";
      s = (s + " " + pad).trim();
    }

    yield s;
  }
}

// 중복 제거 + 개수 채우기
function buildList() {
  const uniq = new Set();
  const out = [];
  const gen = generator();

  let attempts = 0;
  const MAX_ATTEMPTS = COUNT * 20;

  while (out.length < COUNT && attempts < MAX_ATTEMPTS) {
    attempts++;
    const s = gen.next().value;
    const key = s.toLowerCase();
    if (!acceptableLen(s)) continue;
    if (uniq.has(key)) continue;
    uniq.add(key);
    out.push(s);
  }
  if (out.length < COUNT) {
    console.warn(`⚠️ 생성 실패: 목표 ${COUNT}개 중 ${out.length}개만 생성되었습니다. (길이 범위/옵션을 조정해 보세요)`);
  }
  return out;
}

// 저장
function saveJSON(items) {
  const obj = { items };
  const json = JSON.stringify(obj, null, 2);
  const outPath = OUT;

  const dir = path.dirname(outPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(outPath, json, "utf-8");
  console.log(`✅ 생성 완료: ${items.length}개 → ${outPath}`);
}

// 실행
const items = buildList();
saveJSON(items);
