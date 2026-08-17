/*
 * Story Time — scene vocabulary, difficulty curve, and the question generator.
 *
 * Moved out of index.jsx on 2026-08-17 for two reasons. Plain Node cannot parse
 * `.jsx`, so a curve that lives in the component is UNGATEABLE where it sits —
 * story-grid was one of the four games `audit:curves` could only name, not
 * check. And the retrieval half is now a set of GENERATED questions, which is a
 * content bank: it needs `npm run validate:storyq` standing over it the way
 * validate:keeptrack stands over Keep Track's categories.
 *
 * ⚠ Every import here must carry its explicit `.js`. Vite resolves
 * extensionless paths; plain Node does not, and the gates run in Node — so
 * dropping one breaks the GATE, not the app, which is the failure that only
 * shows up in CI.
 *
 * ── What replaced the builder (2026-08-17) ──
 * Retrieval used to be: rebuild all five panels from a tray of place/cast/action
 * chips. It scored all-or-nothing per panel, so 13 of 15 features remembered
 * read out as 2/5, and it cost ~18 taps of craft work per round. It is now
 * KAWKAB ASKS: the hub-centre mascot puts a handful of questions about the
 * story — where it began, who was there, what came next, which came first, how
 * many scenes had company, and one scene that may never have happened at all.
 *
 * The questions are GENERATED from the beats rather than authored, because 45
 * stories × 6 questions × 2 languages is not a bank a human keeps correct. That
 * trade has a cost: a generator can produce a question with two right answers,
 * or a "did you see this?" lure that accidentally shows a real scene. Those are
 * exactly the failures `validate:storyq` asserts against, on every story and
 * across many seeds.
 */
import { levelFraction, tierStage } from '../../../../shared/difficulty.js';
import { STORIES } from './stories.js';

/* ── CONTENT ─────────────────────────────────────────────────────────────
 * Each background is a little SCENE: sky/wall gradient + a floor band + a few
 * anchored props (in the sky, along the far edges, or resting on the floor) so
 * the place reads at a glance and never blurs into another. Props hug the sides
 * and top so the centre-bottom stays clear for the characters. `floor` sets how
 * tall the ground band is (indoor rooms get a taller floor). Numeric
 * positions/sizes scale with the panel.
 */
export const BACKGROUNDS = {
  home: { en: 'Home', ar: 'البيت', chip: '🏠', bg: 'linear-gradient(180deg,#fbe6cf 0%,#f4d3ab 100%)', ground: '#c69a67', floor: 30, amb: [
    { e: '🖼️', s: { top: 12, insetInlineStart: 14, fontSize: 20 } },
    { e: '🪟', s: { top: 10, insetInlineEnd: 14, fontSize: 24, opacity: 0.95 } },
    { e: '🛋️', s: { bottom: '20%', insetInlineStart: 8, fontSize: 30 } },
    { e: '🪴', s: { bottom: '22%', insetInlineEnd: 10, fontSize: 22 } },
  ] },
  street: { en: 'Street', ar: 'الطريق', chip: '🚸', bg: 'linear-gradient(180deg,#bfe3ff 0%,#e9f4ce 100%)', ground: '#9a948a', floor: 24, amb: [
    { e: '☀️', s: { top: 10, insetInlineEnd: 14, fontSize: 22 } },
    { e: '☁️', s: { top: 16, insetInlineStart: 18, fontSize: 18, opacity: 0.9, animation: 'sg-float 6s ease-in-out infinite' } },
    { e: '🏠', s: { bottom: '20%', insetInlineStart: 6, fontSize: 30 } },
    { e: '🌳', s: { bottom: '20%', insetInlineEnd: 8, fontSize: 28 } },
    { e: '🚦', s: { bottom: '22%', insetInlineStart: '50%', transform: 'translateX(-50%)', fontSize: 16, opacity: 0.85 } },
  ] },
  school: { en: 'School', ar: 'المدرسة', chip: '🏫', bg: 'linear-gradient(180deg,#d3ecff 0%,#c7ecd0 100%)', ground: '#8fbf72', floor: 22, amb: [
    { e: '🏫', s: { bottom: '18%', insetInlineStart: '50%', transform: 'translateX(-50%)', fontSize: 40 } },
    { e: '☀️', s: { top: 10, insetInlineEnd: 14, fontSize: 22 } },
    { e: '🚩', s: { top: 8, insetInlineStart: 16, fontSize: 18 } },
    { e: '🌳', s: { bottom: '18%', insetInlineEnd: 8, fontSize: 24 } },
  ] },
  classroom: { en: 'Classroom', ar: 'الصف', chip: '📚', bg: 'linear-gradient(180deg,#f3e7cd 0%,#ead6ae 100%)', ground: '#b98e58', floor: 30, amb: [
    { e: '🟩', s: { top: 12, insetInlineStart: 14, fontSize: 34 } },
    { e: '🕐', s: { top: 12, insetInlineEnd: 14, fontSize: 18 } },
    { e: '📚', s: { bottom: '22%', insetInlineEnd: 10, fontSize: 22 } },
    { e: '🪑', s: { bottom: '20%', insetInlineStart: 10, fontSize: 22 } },
  ] },
  kitchen: { en: 'Kitchen', ar: 'مطبخ', chip: '🍳', bg: 'linear-gradient(180deg,#fff1dc 0%,#ffdcae 100%)', ground: '#d79f63', floor: 32, amb: [
    { e: '🪟', s: { top: 10, insetInlineEnd: 14, fontSize: 22, opacity: 0.9 } },
    { e: '🍎', s: { top: 14, insetInlineStart: 16, fontSize: 18 } },
    { e: '🔥', s: { bottom: '24%', insetInlineStart: 12, fontSize: 22 } },
    { e: '🧺', s: { bottom: '22%', insetInlineEnd: 12, fontSize: 22 } },
  ] },
  garden: { en: 'Garden', ar: 'حديقة', chip: '🌷', bg: 'linear-gradient(180deg,#d7f0ff 0%,#cdeeae 100%)', ground: '#7fb85c', floor: 26, amb: [
    { e: '☀️', s: { top: 10, insetInlineEnd: 14, fontSize: 22 } },
    { e: '🦋', s: { top: 26, insetInlineStart: 22, fontSize: 16, animation: 'sg-fly 3s ease-in-out infinite' } },
    { e: '🌳', s: { bottom: '20%', insetInlineStart: 4, fontSize: 34 } },
    { e: '🌷', s: { bottom: '20%', insetInlineEnd: 8, fontSize: 20 } },
    { e: '🌻', s: { bottom: '20%', insetInlineEnd: 30, fontSize: 18 } },
  ] },
  park: { en: 'Park', ar: 'منتزه', chip: '⚽', bg: 'linear-gradient(180deg,#c6e8ff 0%,#a9dbf7 100%)', ground: '#78bd5f', floor: 26, amb: [
    { e: '☀️', s: { top: 10, insetInlineEnd: 14, fontSize: 24 } },
    { e: '☁️', s: { top: 16, insetInlineStart: 16, fontSize: 18, opacity: 0.9, animation: 'sg-float 7s ease-in-out infinite' } },
    { e: '🌳', s: { bottom: '20%', insetInlineStart: 6, fontSize: 32 } },
    { e: '🪑', s: { bottom: '20%', insetInlineEnd: 8, fontSize: 22 } },
  ] },
  beach: { en: 'Beach', ar: 'الشاطئ', chip: '🏖️', bg: 'linear-gradient(180deg,#aee2ff 0%,#ffe9bd 100%)', ground: '#f0d79a', floor: 30, amb: [
    { e: '☀️', s: { top: 10, insetInlineEnd: 14, fontSize: 24 } },
    { e: '🌴', s: { bottom: '24%', insetInlineStart: 6, fontSize: 32 } },
    { e: '⛱️', s: { bottom: '24%', insetInlineEnd: 8, fontSize: 26 } },
    { e: '🌊', s: { bottom: '26%', insetInlineStart: '50%', transform: 'translateX(-50%)', fontSize: 18, opacity: 0.85, animation: 'sg-sway 2.4s ease-in-out infinite' } },
  ] },
  pool: { en: 'Pool', ar: 'المسبح', chip: '🏊', bg: 'linear-gradient(180deg,#cdeeff 0%,#79cbe8 100%)', ground: '#39a6cf', floor: 40, amb: [
    { e: '☀️', s: { top: 10, insetInlineEnd: 14, fontSize: 22 } },
    { e: '🏖️', s: { top: 12, insetInlineStart: 14, fontSize: 18, opacity: 0.9 } },
    { e: '🛟', s: { bottom: '30%', insetInlineEnd: 10, fontSize: 24 } },
    { e: '💦', s: { bottom: '30%', insetInlineStart: 14, fontSize: 16, animation: 'sg-twinkle 1.8s ease-in-out infinite' } },
  ] },
  museum: { en: 'Museum', ar: 'المتحف', chip: '🖼️', bg: 'linear-gradient(180deg,#f0e8f8 0%,#dbccec 100%)', ground: '#a98ec6', floor: 28, amb: [
    { e: '🖼️', s: { top: 14, insetInlineStart: 14, fontSize: 24 } },
    { e: '🖼️', s: { top: 14, insetInlineEnd: 14, fontSize: 20 } },
    { e: '🏺', s: { bottom: '22%', insetInlineStart: 12, fontSize: 22 } },
    { e: '🗿', s: { bottom: '22%', insetInlineEnd: 12, fontSize: 24 } },
  ] },
  library: { en: 'Library', ar: 'المكتبة', chip: '📖', bg: 'linear-gradient(180deg,#f7ecd8 0%,#e6cfa2 100%)', ground: '#b58f5c', floor: 30, amb: [
    { e: '📚', s: { bottom: '22%', insetInlineStart: 6, fontSize: 30 } },
    { e: '📚', s: { bottom: '22%', insetInlineEnd: 6, fontSize: 30 } },
    { e: '🪔', s: { top: 12, insetInlineEnd: 16, fontSize: 18 } },
    { e: '🪜', s: { bottom: '22%', insetInlineStart: 34, fontSize: 22, opacity: 0.85 } },
  ] },
  space: { en: 'Space', ar: 'الفضاء', chip: '🌌', bg: 'linear-gradient(180deg,#080d24 0%,#232c56 100%)', ground: '#171f42', floor: 18, dark: true, amb: [
    { e: '🪐', s: { top: 12, insetInlineEnd: 14, fontSize: 26 } },
    { e: '⭐', s: { top: 12, insetInlineStart: 16, fontSize: 14, animation: 'sg-twinkle 2s ease-in-out infinite' } },
    { e: '✨', s: { top: 34, insetInlineEnd: 42, fontSize: 12, animation: 'sg-twinkle 1.8s ease-in-out 0.6s infinite' } },
    { e: '🌙', s: { bottom: '20%', insetInlineStart: 10, fontSize: 24 } },
    { e: '☄️', s: { top: 46, insetInlineStart: 30, fontSize: 16, animation: 'sg-fly 4s ease-in-out infinite' } },
  ] },
  stage: { en: 'Stage', ar: 'مسرح', chip: '🎤', bg: 'linear-gradient(180deg,#341a4c 0%,#7a4aa0 100%)', ground: '#3f2357', floor: 24, dark: true, amb: [
    { e: '🪩', s: { top: 8, insetInlineStart: '50%', transform: 'translateX(-50%)', fontSize: 26, animation: 'sg-spin 1.2s linear infinite' } },
    { e: '✨', s: { top: 30, insetInlineEnd: 22, fontSize: 14, animation: 'sg-twinkle 1.6s ease-in-out infinite' } },
    { e: '🎶', s: { top: 34, insetInlineStart: 20, fontSize: 16, animation: 'sg-note 2.2s ease-in-out infinite' } },
    { e: '🔦', s: { bottom: '22%', insetInlineStart: 10, fontSize: 20, opacity: 0.8 } },
    { e: '🔦', s: { bottom: '22%', insetInlineEnd: 10, fontSize: 20, opacity: 0.8, transform: 'scaleX(-1)' } },
  ] },
  bedroom: { en: 'Bedroom', ar: 'غرفة النوم', chip: '🛏️', bg: 'linear-gradient(180deg,#ede2f8 0%,#cdbce6 100%)', ground: '#a48cc4', floor: 32, amb: [
    { e: '🌙', s: { top: 12, insetInlineStart: 14, fontSize: 20 } },
    { e: '🖼️', s: { top: 12, insetInlineEnd: 16, fontSize: 16 } },
    { e: '🛏️', s: { bottom: '22%', insetInlineEnd: 6, fontSize: 34 } },
    { e: '🧸', s: { bottom: '22%', insetInlineStart: 12, fontSize: 22 } },
  ] },
  night: { en: 'Night', ar: 'ليل', chip: '🌙', bg: 'linear-gradient(180deg,#101d3f 0%,#3a5080 100%)', ground: '#25335a', floor: 24, dark: true, amb: [
    { e: '🌙', s: { top: 12, insetInlineEnd: 16, fontSize: 26 } },
    { e: '⭐', s: { top: 20, insetInlineStart: 18, fontSize: 14, animation: 'sg-twinkle 2.2s ease-in-out infinite' } },
    { e: '✨', s: { top: 40, insetInlineEnd: 46, fontSize: 12, animation: 'sg-twinkle 1.9s ease-in-out 0.5s infinite' } },
    { e: '🏘️', s: { bottom: '20%', insetInlineStart: 8, fontSize: 26, opacity: 0.92 } },
    { e: '🌳', s: { bottom: '20%', insetInlineEnd: 10, fontSize: 22, opacity: 0.9 } },
  ] },
};
export const BG_LIST = Object.keys(BACKGROUNDS);

export const CHARS = [
  { id: 'kawkab', en: 'Kawkab', ar: 'كوكب' },
  { id: 'star', en: 'Star', ar: 'ستار' },
  { id: 'noor', en: 'Noor', ar: 'نور' },
  { id: 'rami', en: 'Ramy', ar: 'رامي' },
  { id: 'lola', en: 'Lola', ar: 'لولا' },
];
export const CHAR_IDS = CHARS.map((c) => c.id);

// `en` is the third-person-singular form ("helps"); `enPl` is the bare/plural
// form used when two or more characters share the action ("help") — English
// verbs need to drop the -s for a plural subject ("Lola & Kawkab help").
export const ACTIONS = [
  { id: 'walk', e: '🚶', en: 'walks', enPl: 'walk', ar: 'يمشي' },
  { id: 'greet', e: '👋', en: 'meets', enPl: 'meet', ar: 'يقابل' },
  { id: 'hug', e: '🤗', en: 'hugs', enPl: 'hug', ar: 'يعانق' },
  { id: 'idea', e: '💡', en: 'gets an idea', enPl: 'get an idea', ar: 'تخطر له فكرة' },
  { id: 'tell', e: '💬', en: 'tells', enPl: 'tell', ar: 'يخبر' },
  { id: 'find', e: '🔍', en: 'discovers', enPl: 'discover', ar: 'يكتشف' },
  { id: 'help', e: '🤝', en: 'helps', enPl: 'help', ar: 'يساعد' },
  { id: 'build', e: '🔨', en: 'builds', enPl: 'build', ar: 'يبني' },
  { id: 'eat', e: '🍔', en: 'eats', enPl: 'eat', ar: 'يأكل' },
  { id: 'cook', e: '🍳', en: 'cooks', enPl: 'cook', ar: 'يطبخ' },
  { id: 'study', e: '📖', en: 'studies', enPl: 'study', ar: 'يدرس' },
  { id: 'read', e: '📕', en: 'reads', enPl: 'read', ar: 'يقرأ' },
  { id: 'ace', e: '💯', en: 'aces the test', enPl: 'ace the test', ar: 'يتفوّق' },
  { id: 'paint', e: '🎨', en: 'paints', enPl: 'paint', ar: 'يرسم' },
  { id: 'plant', e: '🌱', en: 'plants', enPl: 'plant', ar: 'يزرع' },
  { id: 'play', e: '⚽', en: 'plays', enPl: 'play', ar: 'يلعب' },
  { id: 'swim', e: '🏊', en: 'swims', enPl: 'swim', ar: 'يسبح' },
  { id: 'sing', e: '🎤', en: 'sings', enPl: 'sing', ar: 'يغنّي' },
  { id: 'dance', e: '🪩', en: 'dances', enPl: 'dance', ar: 'يرقص' },
  { id: 'fly', e: '🚀', en: 'blasts off', enPl: 'blast off', ar: 'ينطلق' },
  { id: 'win', e: '🏆', en: 'wins', enPl: 'win', ar: 'يفوز' },
  { id: 'gift', e: '🎁', en: 'gives a gift', enPl: 'give a gift', ar: 'يُهدي' },
  { id: 'cheer', e: '🎉', en: 'celebrates', enPl: 'celebrate', ar: 'يحتفل' },
  { id: 'sleep', e: '😴', en: 'sleeps', enPl: 'sleep', ar: 'ينام' },
];
export const ACTION_IDS = ACTIONS.map((a) => a.id);

/* ── DIFFICULTY ──────────────────────────────────────────────────────────
 * Four levers, and every one of them is something the player feels:
 *   len            how many scenes the story has (how much to hold)
 *   memoPerPanel   SECONDS PER SCENE to watch — the encode budget, expressed
 *                  per panel so a longer story does not look like a gift. This
 *                  is the audit:fq lesson: gate the time that reaches a human,
 *                  not the raw countdown.
 *   questions      how many things Kawkab asks afterwards
 *   opts           how many answers each question offers (the guessing floor)
 *
 * ⚠ `memo` (the whole countdown) rises with difficulty because a six-scene
 * story genuinely takes longer to read than a four-scene one. Per PANEL it
 * falls, which is the honest direction, and it is the field `audit:curves`
 * checks. Do not gate raw `memo` — a harder tier would read as easier.
 */
export const BASE = {
  easy: { len: 4, m0: 55, m1: 44, q0: 4, q1: 5, o0: 3, o1: 3 },
  med: { len: 5, m0: 62, m1: 48, q0: 5, q1: 6, o0: 3, o1: 4 },
  hard: { len: 6, m0: 70, m1: 52, q0: 6, q1: 6, o0: 4, o1: 4 },
};
export const LEVELS_PER_TIER = 100;
export const MIN_OPTS = 2;
/**
 * Seconds a player gets per scene, at the very hardest setting. The narration is
 * 25–40 authored words, which is ~8s of calm reading — below this the levels stop
 * measuring memory and start measuring reading speed. `audit:pacing` gates it.
 */
export const MIN_SEC_PER_PANEL = 8.4;

/** Level config. Front-loaded (^0.85), same curve kit as every other game. */
export function levelCfg(diff, level) {
  const b = BASE[diff] || BASE.med;
  const f = levelFraction(level, LEVELS_PER_TIER);
  // The per-scene floor is enforced HERE, structurally, rather than trusted to
  // the hand-tuned m0/m1 numbers staying kind as the story lengths change.
  const memo = Math.max(
    Math.ceil(b.len * MIN_SEC_PER_PANEL),
    Math.round(b.m0 + (b.m1 - b.m0) * f),
  );
  return {
    len: b.len,
    memo,
    memoPerPanel: Math.round((memo / b.len) * 100) / 100,
    questions: Math.round(b.q0 + (b.q1 - b.q0) * f),
    opts: Math.round(b.o0 + (b.o1 - b.o0) * f),
    f,
  };
}

/**
 * Survival: one continuous ramp across the three tiers, then past them.
 *
 * ⚠ The watch clock is budgeted PER SCENE and floored at 8.4s. The first version
 * of this ramp scaled the whole countdown (52 − stage×1.1, floor 30s) while the
 * story grew to six scenes, which handed the player 5s a scene by stage 20 —
 * below the time needed to read one. `audit:pacing` caught it. Once the clock is
 * floored, the ramp continues through LOAD: more scenes, more questions, more
 * options per question.
 */
export function survivalCfg(stage) {
  const len = Math.min(6, 3 + Math.floor(stage / 2));
  const perPanel = Math.max(MIN_SEC_PER_PANEL, Math.round((13 - stage * 0.22) * 100) / 100);
  // ceil, not round: rounding the total down can push the per-scene budget back
  // under the floor the line above just enforced (it did — by 70ms).
  const memo = Math.ceil(len * perPanel);
  return {
    len,
    memo,
    memoPerPanel: Math.round((memo / len) * 100) / 100,
    questions: Math.min(8, 3 + Math.floor(stage / 2)),
    opts: Math.min(4, 3 + Math.floor(stage / 4)),
    ...tierStage(stage),
  };
}

/** Pass n Play: everyone gets the same story and the same questions. */
export function passCfg() {
  return { len: 5, memo: 48, memoPerPanel: 9.6, questions: 5, opts: 3 };
}

/**
 * Did this round pass? One miss is forgiven on a five- or six-question round —
 * all-or-nothing over six probes turns a good memory into a failed level, which
 * is the complaint that retired the builder in the first place.
 */
export function levelPassed(correct, total) {
  return correct >= total - (total >= 5 ? 1 : 0);
}

/* ── STORY PICKING ───────────────────────────────────────────────────────── */
const shuffleR = (arr, rng) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
const pickR = (arr, rng) => arr[Math.floor(rng() * arr.length)];

/**
 * Cast one story of `n` acts. `exclude` holds recently played ids so a session
 * never replays the same tale back to back.
 */
export function makeStory(n, rng, exclude = [], stories = STORIES) {
  const byLen = stories.filter((s) => s.beats.length === n);
  const pool0 = byLen.length ? byLen : stories;
  const fresh = pool0.filter((s) => !exclude.includes(s.id));
  const src = fresh.length ? fresh : pool0;
  const script = pickR(src, rng);
  // Fixed-cast stories name real characters in `who`; generic ones cast H/F at random.
  const fixed = !!script.fixed;
  const cast = shuffleR(CHAR_IDS, rng);
  const roleChar = fixed ? {} : { H: cast[0], F: cast[1] };
  // `narr` rides along so the watch captions and the recap can tell the actual
  // authored story, not a reconstructed verb phrase.
  const target = script.beats.map((b) => ({
    bg: b.bg,
    chars: fixed ? [...b.who] : b.who.map((r) => roleChar[r]),
    action: b.action,
    say: b.say || null,
    item: b.item || null,
    narr: b.narr || null,
  }));
  return { id: script.id, title: script.title || null, moral: script.moral || null, roleChar, target };
}

/* ── QUESTIONS ───────────────────────────────────────────────────────────
 * Six kinds, all derived from the beats. Each returns
 *   { kind, prompt: {en, ar}, ref, options, answer }
 * where an option is one of
 *   { kind: 'place', value: bgId }
 *   { kind: 'face',  value: [charId, …] }
 *   { kind: 'panel', panel: {bg, chars, action} }
 *   { kind: 'num',   value: 3 }
 *   { kind: 'bool',  value: true }
 * and `answer` is the index of the correct one. `ref` is the scene the question
 * is asked ABOUT (drawn above the options) or null.
 *
 * Prompts are written here rather than in the component because a question and
 * its wording are one thing: a generator that emits a prompt the options do not
 * answer is the bug this file exists to prevent.
 */
export const Q_STR = {
  place: {
    first: { en: 'Where did the story begin?', ar: 'أين بدأت القصة؟' },
    last: { en: 'Where did the story end?', ar: 'أين انتهت القصة؟' },
    mid: { en: (n) => `Where was scene ${n}?`, ar: (n) => `أين كان المشهد ${n}؟` },
  },
  who: {
    first: { en: 'Who was in the first scene?', ar: 'من كان في المشهد الأول؟' },
    last: { en: 'Who was in the last scene?', ar: 'من كان في المشهد الأخير؟' },
    mid: { en: (n) => `Who was in scene ${n}?`, ar: (n) => `من كان في المشهد ${n}؟` },
  },
  next: { en: 'What happened right after this?', ar: 'ما الذي حدث بعد هذا مباشرة؟' },
  first: { en: 'Which of these happened first?', ar: 'أيّ هذين حدث أولاً؟' },
  countCast: { en: 'How many scenes had more than one character?', ar: 'كم مشهداً ظهرت فيه أكثر من شخصية؟' },
  countPlace: { en: 'How many different places did the story visit?', ar: 'كم مكاناً مختلفاً زارته القصة؟' },
  lure: { en: 'Did you see this scene?', ar: 'هل رأيت هذا المشهد؟' },
  yes: { en: 'Yes, I saw it', ar: 'نعم، رأيته' },
  no: { en: 'No, that never happened', ar: 'لا، لم يحدث أبداً' },
};

const sameCast = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
const samePanel = (a, b) => a.bg === b.bg && a.action === b.action && sameCast(a.chars, b.chars);
const bare = (b) => ({ bg: b.bg, chars: [...b.chars], action: b.action });
const ordinalPrompt = (group, i, len) => {
  if (i === 0) return group.first;
  if (i === len - 1) return group.last;
  return { en: group.mid.en(i + 1), ar: group.mid.ar(i + 1) };
};

/** Distractor places: ones the story used elsewhere first, then the wider list. */
function placeLures(target, exclude, n, rng) {
  const inStory = [...new Set(target.map((b) => b.bg))].filter((x) => !exclude.includes(x));
  const outside = BG_LIST.filter((x) => !exclude.includes(x) && !inStory.includes(x));
  return [...shuffleR(inStory, rng), ...shuffleR(outside, rng)].slice(0, n);
}

/**
 * Distractor casts. A wrong answer should be a RECOMBINATION of people the
 * story used — "was Ramy there too?" — not a stranger nobody saw, which turns a
 * memory question into a spot-the-new-face question. Other scenes' casts come
 * first for that reason; strangers are the fallback when the story is too small.
 */
function castLures(target, answer, n, rng) {
  const out = [];
  const seen = [answer];
  const add = (set) => {
    if (!set.length || seen.some((s) => sameCast(s, set))) return;
    seen.push(set); out.push(set);
  };
  shuffleR(target.map((b) => b.chars), rng).forEach((c) => add([...c]));
  const storyCast = [...new Set(target.flatMap((b) => b.chars))];
  const strangers = CHAR_IDS.filter((c) => !storyCast.includes(c));
  shuffleR(storyCast, rng).forEach((a) => {
    add([a]);
    shuffleR([...storyCast, ...strangers], rng).forEach((b) => { if (a !== b) add([a, b]); });
  });
  shuffleR(strangers, rng).forEach((s) => add([s]));
  return out.slice(0, n);
}

function qPlace(story, rng, opts, used) {
  const len = story.target.length;
  const free = story.target.map((_, i) => i).filter((i) => !used.place.includes(i));
  if (!free.length) return null;
  const i = pickR(free, rng);
  used.place.push(i);
  const answer = story.target[i].bg;
  const lures = placeLures(story.target, [answer], opts - 1, rng);
  if (!lures.length) return null;
  const options = shuffleR([answer, ...lures], rng).map((v) => ({ kind: 'place', value: v }));
  return {
    kind: 'place',
    beat: i,
    prompt: ordinalPrompt(Q_STR.place, i, len),
    ref: null,
    options,
    answer: options.findIndex((o) => o.value === answer),
  };
}

function qWho(story, rng, opts, used) {
  const len = story.target.length;
  const free = story.target.map((_, i) => i).filter((i) => !used.who.includes(i));
  if (!free.length) return null;
  const i = pickR(free, rng);
  used.who.push(i);
  const answer = [...story.target[i].chars];
  const lures = castLures(story.target, answer, opts - 1, rng);
  if (!lures.length) return null;
  const options = shuffleR([answer, ...lures], rng).map((v) => ({ kind: 'face', value: v }));
  return {
    kind: 'who',
    beat: i,
    prompt: ordinalPrompt(Q_STR.who, i, len),
    ref: null,
    options,
    answer: options.findIndex((o) => sameCast(o.value, answer)),
  };
}

function qNext(story, rng, opts) {
  const len = story.target.length;
  if (len < 3) return null;
  const i = Math.floor(rng() * (len - 1));
  const answer = story.target[i + 1];
  // Candidates are OTHER real scenes: a wrong answer is a true event out of
  // place, which is what an order question should be testing. A scene that is
  // IDENTICAL to the true next one is dropped — some stories repeat a place,
  // cast and action exactly, and two identical panels make the question
  // unanswerable however well it is remembered.
  // …and two lures identical to EACH OTHER are dropped for the same reason:
  // `winning-goal` plays the same scene in the park twice, and the gate caught
  // it offering that panel as two separate options.
  const others = [];
  story.target.forEach((b, j) => {
    if (j === i || j === i + 1) return;
    const p = bare(b);
    if (samePanel(p, bare(answer))) return;
    if (others.some((o) => samePanel(o, p))) return;
    others.push(p);
  });
  const room = Math.max(MIN_OPTS, Math.min(opts, others.length + 1));
  const lures = shuffleR(others, rng).slice(0, room - 1);
  if (!lures.length) return null;
  const options = shuffleR([answer, ...lures], rng).map((b) => ({ kind: 'panel', panel: bare(b) }));
  return {
    kind: 'next',
    beat: i,
    prompt: Q_STR.next,
    ref: bare(story.target[i]),
    options,
    answer: options.findIndex((o) => samePanel(o.panel, bare(answer))),
  };
}

function qFirst(story, rng) {
  const len = story.target.length;
  if (len < 2) return null;
  // Prefer a non-adjacent pair: "which came first" between neighbours is a coin
  // toss on a story you half-remember, and reads as a trick rather than a probe.
  const pairs = [];
  for (let a = 0; a < len; a++) for (let b = a + 1; b < len; b++) pairs.push([a, b]);
  const spaced = pairs.filter(([a, b]) => b - a >= 2);
  const [i, j] = pickR(spaced.length ? spaced : pairs, rng);
  const early = bare(story.target[i]);
  const late = bare(story.target[j]);
  if (samePanel(early, late)) return null; // a story that repeats a scene exactly
  const options = shuffleR([early, late], rng).map((p) => ({ kind: 'panel', panel: p }));
  return {
    kind: 'first',
    beat: i,
    other: j,
    prompt: Q_STR.first,
    ref: null,
    options,
    answer: options.findIndex((o) => samePanel(o.panel, early)),
  };
}

function qCount(story, rng, opts) {
  const len = story.target.length;
  const withCompany = story.target.filter((b) => b.chars.length > 1).length;
  const places = new Set(story.target.map((b) => b.bg)).size;
  // "How many scenes had company" is dead when the answer is none or all of
  // them — the player can answer it without remembering anything. Fall back to
  // counting places, which cannot be degenerate in the same way.
  const useCast = withCompany > 0 && withCompany < len;
  const truth = useCast ? withCompany : places;
  const lo = useCast ? 0 : 1;
  const near = [];
  for (let d = 1; near.length < 6; d++) {
    if (truth - d >= lo) near.push(truth - d);
    if (truth + d <= len) near.push(truth + d);
    if (d > len) break;
  }
  const lures = shuffleR(near, rng).slice(0, Math.max(MIN_OPTS - 1, opts - 1));
  if (!lures.length) return null;
  const options = shuffleR([truth, ...lures], rng)
    .map((v) => ({ kind: 'num', value: v }))
    .sort((a, b) => a.value - b.value);
  return {
    kind: 'count',
    variant: useCast ? 'cast' : 'place',
    prompt: useCast ? Q_STR.countCast : Q_STR.countPlace,
    ref: null,
    options,
    answer: options.findIndex((o) => o.value === truth),
  };
}

/**
 * The lure: a scene shown back, which either happened or was quietly stitched
 * together from two that did. Half the rounds show a REAL scene — otherwise
 * "no" is always right and the question teaches nothing after the second time.
 */
function qLure(story, rng) {
  const len = story.target.length;
  const real = rng() < 0.5;
  if (real) {
    const p = bare(pickR(story.target, rng));
    const options = shuffleR([{ kind: 'bool', value: true }, { kind: 'bool', value: false }], rng);
    return { kind: 'lure', real: true, prompt: Q_STR.lure, ref: p, options, answer: options.findIndex((o) => o.value === true) };
  }
  let fake = null;
  for (let tries = 0; tries < 40 && !fake; tries++) {
    const a = Math.floor(rng() * len);
    const b = Math.floor(rng() * len);
    if (a === b) continue;
    const cand = { bg: story.target[a].bg, chars: [...story.target[b].chars], action: story.target[b].action };
    if (!story.target.some((beat) => samePanel(bare(beat), cand))) fake = cand;
  }
  if (!fake) {
    // Every recombination of this story's own parts happens to be real (one
    // place, one cast, one action). Borrow a place it never visited instead.
    const unused = BG_LIST.filter((b) => !story.target.some((beat) => beat.bg === b));
    if (!unused.length) return null;
    const src = pickR(story.target, rng);
    fake = { bg: pickR(unused, rng), chars: [...src.chars], action: src.action };
  }
  const options = shuffleR([{ kind: 'bool', value: true }, { kind: 'bool', value: false }], rng);
  return { kind: 'lure', real: false, prompt: Q_STR.lure, ref: fake, options, answer: options.findIndex((o) => o.value === false) };
}

/**
 * Build the round's questions. The lure always goes LAST when it is available —
 * it is the one probe that can only be asked once the story feels settled.
 * Returns fewer than `count` only for a story too small to support them, never
 * a malformed question: `validate:storyq` asserts both halves of that.
 */
export function buildQuestions(story, rng, cfg) {
  const count = Math.max(1, cfg.questions || 4);
  const opts = Math.max(MIN_OPTS, cfg.opts || 3);
  const used = { place: [], who: [] };
  const makers = [
    () => qPlace(story, rng, opts, used),
    () => qWho(story, rng, opts, used),
    () => qNext(story, rng, opts),
    () => qFirst(story, rng),
    () => qCount(story, rng, opts),
  ];
  const out = [];
  // one of each kind first, then a second pass for the repeatable kinds
  for (const make of shuffleR(makers, rng)) {
    if (out.length >= count - 1) break;
    const q = make();
    if (q) out.push(q);
  }
  const repeatable = [
    () => qPlace(story, rng, opts, used),
    () => qWho(story, rng, opts, used),
    () => qNext(story, rng, opts),
  ];
  let guard = 0;
  while (out.length < count - 1 && guard < 12) {
    const q = pickR(repeatable, rng)();
    if (q) out.push(q);
    guard += 1;
  }
  const lure = qLure(story, rng);
  if (lure) out.push(lure);
  else {
    const extra = qPlace(story, rng, opts, used) || qCount(story, rng, opts);
    if (extra) out.push(extra);
  }
  return out.slice(0, count);
}
