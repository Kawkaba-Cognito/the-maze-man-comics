/*
 * practiceLog — the measurement layer under the Wellbeing practices.
 *
 * ── WHY THIS EXISTS ────────────────────────────────────────────────────────
 *
 * Before this, every practice was a black box: press Begin, a timer runs, the
 * screen says "Nicely done" — and Grounding ended by ASSERTING an outcome
 * ("Notice how everything slowed down a little") that the user may simply not
 * have had. Telling a distressed person their distress went down when it did
 * not is invalidating, and it teaches them the tool does not work for them.
 *
 * So the practice asks instead of asserts. A one-tap 0–10 rating before and
 * after is the standard clinical move (SUDS — subjective units of distress,
 * Wolpe 1969), and it buys four things at once:
 *
 *   1. HONESTY   — the screen reports the number the user gave, never a mood
 *                  the designer hoped for.
 *   2. EFFICACY  — self-monitoring is an active ingredient in its own right,
 *                  not just instrumentation. Rating your own state trains the
 *                  interoceptive discrimination these practices depend on.
 *   3. A REASON TO RETURN — a drop you can see is the only non-coercive
 *                  motivator available to a wellbeing app. It needs no streak.
 *   4. PERSONALISATION — with a handful of sessions the app can say which
 *                  practice actually works for THIS person (`signatureMove`),
 *                  which is a genuinely useful finding no content bank knows.
 *
 * ── WHAT IS DELIBERATELY *NOT* GAMIFIED ───────────────────────────────────
 *
 * ⚠ NOTHING HERE REWARDS A LOW SCORE OR PUNISHES A HIGH ONE, and that is the
 * whole design. The moment "calmer" pays out better than "still wound up", the
 * instrument stops measuring: users learn to report the number that wins. The
 * check-in is the one surface in the app that must stay uncontaminated, so:
 *
 *   · levels count SESSIONS DONE, never points gained;
 *   · there is no streak and no decay — a gap costs nothing, because guilt is
 *     precisely what sends an anxious user away from a wellbeing tool;
 *   · a session where distress ROSE is logged, kept, and shown as useful
 *     information, not hidden or scored as a failure.
 *
 * What IS gamified is the skill and the discovery: how many times you have
 * practised, what that unlocks, and what the data reveals about you.
 */
import { loadJson, saveJson } from '../../lib/storage';

const KEY = 'rx_practice_log_v1';
const MAX_SESSIONS = 240;

/** Practices that change a state and therefore carry a before/after check-in. */
export const MEASURED_PRACTICES = new Set(['breathe', 'grounding', 'pmr']);

/*
 * Skill tiers, by sessions completed for that practice.
 *
 * ⚠ The thresholds widen (1 → 3 → 8 → 15 → 30) rather than spacing evenly. A
 * flat ladder makes the FIRST step the slowest, which is the one step that has
 * to be free: someone opening a breathing exercise at 2am is not shopping for a
 * progression system, and a reward that arrives on session five arrives after
 * they have already stopped.
 */
export const SKILL_TIERS = [
  { at: 0, id: 'new', en: 'New', ar: 'جديد' },
  { at: 1, id: 'tried', en: 'Tried it', ar: 'جرّبتها' },
  { at: 3, id: 'learning', en: 'Learning', ar: 'أتعلّمها' },
  { at: 8, id: 'steady', en: 'Steady', ar: 'ثابتة' },
  { at: 15, id: 'practised', en: 'Practised', ar: 'متمكّن' },
  { at: 30, id: 'deep', en: 'Deep', ar: 'عميقة' },
];

const empty = () => ({ v: 1, sessions: [] });

export function loadPracticeLog() {
  const v = loadJson(KEY, null);
  if (!v || !Array.isArray(v.sessions)) return empty();
  return { v: 1, sessions: v.sessions.filter((s) => s && typeof s.p === 'string') };
}

function persist(state) {
  const trimmed = state.sessions.slice(-MAX_SESSIONS);
  saveJson(KEY, { v: 1, sessions: trimmed });
  return { v: 1, sessions: trimmed };
}

/**
 * Record one completed practice.
 *
 * `before`/`after` are 0–10 or null — null is a first-class case, not a gap to
 * be filled with a default. Someone can skip the check-in (mid-panic, that is
 * the right call) and the session still counts toward their skill tier; it just
 * contributes nothing to the averages. Defaulting a skipped rating to 5 would
 * quietly invent data, which is the failure mode this whole module exists to
 * avoid.
 */
export function logPracticeSession({ practice, before = null, after = null, seconds = 0, meta = null }) {
  if (!practice) return loadPracticeLog();
  const st = loadPracticeLog();
  st.sessions.push({
    p: practice,
    at: Date.now(),
    b: Number.isFinite(before) ? before : null,
    a: Number.isFinite(after) ? after : null,
    s: Math.round(seconds) || 0,
    ...(meta ? { m: meta } : {}),
  });
  return persist(st);
}

const sessionsFor = (st, practice) => st.sessions.filter((s) => s.p === practice);
/** Only sessions with BOTH ends rated can speak about change. */
const rated = (list) => list.filter((s) => Number.isFinite(s.b) && Number.isFinite(s.a));

/**
 * Everything the app knows about one practice for this user.
 *
 * `avgDrop` is positive when distress FELL, so the number a user reads as
 * "good" is a positive one. `bestDrop` may be 0 or negative and is still
 * returned — see the header: a practice that has never helped is a finding,
 * and hiding it would make the "signature move" below a horoscope.
 */
export function getPracticeStats(practice, st = loadPracticeLog()) {
  const list = sessionsFor(st, practice);
  const withBoth = rated(list);
  const drops = withBoth.map((s) => s.b - s.a);
  const runs = list.length;
  const avgDrop = drops.length ? drops.reduce((x, y) => x + y, 0) / drops.length : null;
  return {
    runs,
    ratedRuns: drops.length,
    avgDrop,
    bestDrop: drops.length ? Math.max(...drops) : null,
    lastDrop: drops.length ? drops[drops.length - 1] : null,
    minutes: Math.round(list.reduce((x, s) => x + (s.s || 0), 0) / 60),
    tier: tierFor(runs),
    nextTier: nextTierFor(runs),
  };
}

export function tierFor(runs) {
  let t = SKILL_TIERS[0];
  for (const tier of SKILL_TIERS) if (runs >= tier.at) t = tier;
  return t;
}

export function nextTierFor(runs) {
  const next = SKILL_TIERS.find((t) => t.at > runs);
  return next ? { ...next, remaining: next.at - runs } : null;
}

/**
 * The practice that has actually worked best FOR THIS PERSON.
 *
 * ⚠ Gated at MIN_RUNS_FOR_SIGNATURE rated sessions each on at least two
 * practices, and it stays null until then. An n-of-1 comparison drawn from one
 * session per practice is noise wearing a conclusion's clothes — and because it
 * would be presented as a personal insight, a wrong one is worse than none:
 * the user reorganises their coping around a coin flip. Same reasoning as the
 * personalization model's cold-start gate.
 */
export const MIN_RUNS_FOR_SIGNATURE = 2;

export function getSignatureMove(st = loadPracticeLog()) {
  const scored = [...MEASURED_PRACTICES]
    .map((p) => ({ practice: p, ...getPracticeStats(p, st) }))
    .filter((s) => s.ratedRuns >= MIN_RUNS_FOR_SIGNATURE && s.avgDrop != null);
  if (scored.length < 2) return null;
  scored.sort((a, b) => b.avgDrop - a.avgDrop);
  const top = scored[0];
  if (top.avgDrop <= 0) return null; // nothing has helped yet — say nothing
  return top;
}

/** Totals across every measured practice — for the landing's progress strip. */
export function getPracticeTotals(st = loadPracticeLog()) {
  const all = st.sessions;
  const withBoth = rated(all);
  const drops = withBoth.map((s) => s.b - s.a);
  return {
    runs: all.length,
    minutes: Math.round(all.reduce((x, s) => x + (s.s || 0), 0) / 60),
    ratedRuns: drops.length,
    avgDrop: drops.length ? drops.reduce((x, y) => x + y, 0) / drops.length : null,
  };
}

/** Last N sessions of one practice, oldest→newest, for a sparkline. */
export function getRecentDrops(practice, n = 8, st = loadPracticeLog()) {
  return rated(sessionsFor(st, practice)).slice(-n).map((s) => ({ before: s.b, after: s.a, drop: s.b - s.a }));
}

export function clearPracticeLog() {
  saveJson(KEY, empty());
  return empty();
}

/* ── The router: what a person needs right now ──────────────────────────────
 *
 * Eight practices behind a five-planet scatter is a menu, not a tool. A person
 * who is actually distressed does not browse — and the mapping below is not a
 * matter of taste, it is what each practice's mechanism can and cannot do:
 *
 *   panic     → GROUNDING. An orienting/attention-shift task (the 5-4-3-2-1
 *               walk used in trauma and DBT work). Deliberately NOT breathing:
 *               breath-focus during acute panic can amplify the very
 *               interoceptive cues the panic is feeding on, and a breath-hold
 *               pattern can reproduce the symptoms outright.
 *   racing    → BREATHE, coherent pattern. Slow paced breathing at ~5.5/min is
 *               the vagal-tone lever; it wants a mind that can follow a pacer.
 *   tense     → PMR. The complaint is somatic and PMR is the somatic tool.
 *   sleepless → PMR then sleep sounds — the wind-down order, not the reverse.
 *   flat      → no practice claims to lift flat mood in 3 minutes, so this one
 *               routes to MEANING rather than pretending. Honesty is the
 *               feature: a router that always has an answer is a router nobody
 *               believes twice.
 */
export const NEED_STATES = [
  {
    id: 'panic', icon: '🌊',
    en: 'Panicky, heart racing', ar: 'ذعر ونبض متسارع',
    practice: 'grounding',
    whyEn: 'Grounding pulls attention outward through your senses — the fastest way back into the room.',
    whyAr: 'التأريض يسحب انتباهك للخارج عبر حواسك — أسرع طريق للعودة إلى اللحظة.',
  },
  {
    id: 'racing', icon: '💭',
    en: "Can't stop thinking", ar: 'لا أستطيع إيقاف التفكير',
    practice: 'breathe', pattern: 'coherent',
    whyEn: 'A slow, even breath at about 5.5 a minute gives a busy mind one simple thing to follow.',
    whyAr: 'نفَس بطيء ومنتظم بمعدل ٥٫٥ في الدقيقة يمنح العقل المشغول شيئاً واحداً بسيطاً يتبعه.',
  },
  {
    id: 'tense', icon: '🪢',
    en: 'Tight, tense body', ar: 'جسد مشدود ومتوتّر',
    practice: 'pmr',
    whyEn: 'When the complaint is in the body, work the body: tense and release each group and feel the difference.',
    whyAr: 'عندما تكون الشكوى في الجسد، اعمل على الجسد: شُدّ كل مجموعة عضلية ثم أرخِها ولاحظ الفرق.',
  },
  {
    id: 'sleepless', icon: '🌙',
    en: "Winding down for sleep", ar: 'أستعدّ للنوم',
    practice: 'pmr',
    whyEn: 'Muscle relaxation first, then sounds if you want them — body before background.',
    whyAr: 'استرخاء العضلات أولاً، ثم الأصوات إن أردت — الجسد قبل الخلفية.',
  },
  {
    id: 'flat', icon: '🫥',
    en: 'Flat, low, unmotivated', ar: 'خمول وفتور وقلة دافع',
    practice: 'ikigai',
    whyEn: "Honestly: none of the calming tools lift a flat mood in three minutes. This one asks a different question instead.",
    whyAr: 'بصراحة: لا أداة تهدئة ترفع المزاج الخامل في ثلاث دقائق. هذه تطرح سؤالاً مختلفاً بدلاً من ذلك.',
  },
];

export function needStateById(id) {
  return NEED_STATES.find((n) => n.id === id) || null;
}
