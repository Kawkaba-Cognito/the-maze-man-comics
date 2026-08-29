import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../../../context/AppContext';
import GroupShell, { GroupHow } from '../_shared/GroupShell';
import GroupPlayerSetup, { loadGroupPlayerNames, saveGroupPlayerNames } from '../_shared/GroupPlayerSetup';
import { createDrawer } from '../_shared/drawWithoutRepeat';
import { SETS, SET_COUNT, loadPlayed, setPlayed, nextUnplayed, setCovers } from './sets';
import { shuffle, rnd } from '../_shared/groupTheme';
import KawkabSprite from '../../../training/shared/KawkabSprite';
import { WHEEL_VALUES, WHEEL_BANK, STREAK_POOLS, RANKED_PUZZLES } from './data';
import './wheel.css';

/*
 * THE WHEEL — a three-game night for teams, hosted by Dr Kawkab.
 *
 * One scoreboard carries across all three: anchoring (spin a meaningless number
 * then estimate a truth), push-your-luck (higher/lower with a pot you can bank),
 * and ordering (five cards, scored on all ten pairwise relationships).
 *
 * ── Why this is built on the group kit rather than ported as-is ──
 * It arrived as a standalone HTML file with its own fonts, palette, chrome and
 * a hand-rolled no-repeat pool. All four of those already exist here and are
 * better: GroupShell gives it the same header, back button and paper as the
 * other party games; createDrawer remembers what has been drawn ACROSS SESSIONS
 * in localStorage, where the original only remembered within one night.
 *
 * ── Repeats ──
 * Three independent drawers, one per game. A team can therefore never see the
 * same question twice in a night, and rarely across many nights. The content
 * itself is checked by `npm run validate:wheel`, which is where "no repeats"
 * is actually enforced — two prompts over the same five cards is a repeat the
 * drawer cannot see, and that check is what caught three of them.
 */

const ACCENT = '#b9842f';
const TEAM_COLOURS = ['#4a6fa5', '#c45c26', '#1d8a52', '#b9842f'];

const wheelDrawer = createDrawer('mm_group_thewheel_wheel_v1', { maxRecent: 220 });
const streakDrawer = createDrawer('mm_group_thewheel_streak_v1', { maxRecent: 80 });
const rankedDrawer = createDrawer('mm_group_thewheel_ranked_v1', { maxRecent: 140 });

/** Rounds per team, per game. */
const LENGTHS = {
  quick: { wheel: 3, streak: 2, ranked: 3 },
  standard: { wheel: 5, streak: 3, ranked: 4 },
  marathon: { wheel: 8, streak: 4, ranked: 6 },
};

const fmtNum = (n) => (Number.isInteger(n) ? n.toLocaleString('en-US') : n.toLocaleString('en-US', { maximumFractionDigits: 2 }));

/*
 * ── SCORING ──────────────────────────────────────────────────────────────
 *
 * ⚠ EVERY ROUND OF EVERY GAME IS WORTH 0–5. NOTHING MAY PAY MORE (2026-08-29).
 *
 * It used to pay in the hundreds, on three different scales that did not agree
 * with each other: a Game 1 round could return ~270 (a continuous accuracy
 * curve × a 1.0–1.6 difficulty weight, + 40 bullseye, + 20 anchor-proof, + up
 * to 50 streak), Game 3 up to 220, and a hot Game 2 run about 150. Every one of
 * those numbers was defensible on its own and the whole was unreadable: nobody
 * at a table can tell whether 247 was a good round, or why the team that felt
 * like it was losing is somehow ahead.
 *
 * A party scoreboard has to be sayable out loud. "Four out of five" is; "247"
 * is not. The three games keep their distinct SHAPES — estimate under an
 * anchor, push your luck, order five cards — and now share one legible scale.
 *
 * The lessons survive as they can inside a 0–5 band:
 *   • GAME 1 bands are multiples of the QUESTION'S OWN tolerance, so a tight
 *     question and a loose one both pay 5 for "you got it" — the reason the old
 *     formula used relative error rather than raw units.
 *   • Anchoring is a PENALTY now, not a bonus: a bonus would push a round past
 *     5, and the cap is the point. Drift toward the number you were shown and
 *     you cannot take full marks.
 */
function scoreEstimate(guess, q, verdict) {
  const relErr = Math.abs(guess - q.truth) / Math.max(Math.abs(q.truth), 1e-9);
  /* Bands measured in MULTIPLES OF THE QUESTION'S OWN TOLERANCE, so a tight
     question and a loose one both pay 5 for "you got it" — the same reason the
     old formula scaled by relative error rather than by units. */
  const tolShare = Math.max(q.tol / Math.max(Math.abs(q.truth), 1e-9), 0.01);
  const k = relErr / tolShare;
  let base;
  if (verdict === 'bull' || k <= 1) base = 5;
  else if (k <= 2) base = 4;
  else if (k <= 4) base = 3;
  else if (k <= 8) base = 2;
  else if (k <= 16) base = 1;
  else base = 0;
  /* The anchoring lesson survives as a PENALTY rather than a bonus, because a
     bonus would push the round past 5 and the whole point is that a round is
     worth 0–5. Drift toward the meaningless number you were just shown and you
     cannot take full marks. */
  const pulled = verdict === 'pulled';
  const total = Math.max(0, pulled ? Math.min(base, 3) - 1 : base);
  return { total, relErr: relErr * 100, bullseye: verdict === 'bull' ? 1 : 0, pulled };
}

/*
 * GAME 2 · a run is worth the number of correct calls you BANK, capped at 5.
 * The push-your-luck shape survives untouched — keep calling to raise what you
 * are holding, lose it all if you call wrong — but the ceiling means a hot
 * streak cannot bury the other two games, and "I banked 4" is a thing a person
 * can say out loud. The old escalating pot with 1.5x/2x milestones paid up to
 * ~150 for one lucky run.
 */
const RUN_CAP = 5;
const runWorth = (calls) => Math.min(RUN_CAP, calls);

/*
 * GAME 3 · the ten pairwise relationships, mapped onto 0–5. A flawless line is
 * 5; below that each band is two pairs wide. Position credit is gone: it was
 * there to separate two answers with equal pairs, which is a distinction worth
 * making on a 220-point scale and invisible on a 5-point one.
 */
function scoreOrder(pick, correct) {
  let pairs = 0; let total = 0;
  for (let i = 0; i < correct.length; i++) {
    for (let j = i + 1; j < correct.length; j++) {
      total += 1;
      if (pick.indexOf(correct[i]) < pick.indexOf(correct[j])) pairs += 1;
    }
  }
  const exact = correct.reduce((n, it, i) => n + (pick.indexOf(it) === i ? 1 : 0), 0);
  const perfect = pairs === total;
  const pts = perfect ? 5 : Math.min(4, Math.floor(pairs / 2));
  return { pairs, total, exact, perfect, pts };
}

export default function TheWheelGame({ onBack }) {
  const { currentLang, playSfx } = useApp();
  const isAr = currentLang === 'ar';

  const t = useMemo(() => ({
    title: isAr ? 'العجلة' : 'The Wheel',
    tagline: isAr ? 'ثلاث ألعاب. لوحة نتائج واحدة.' : 'Three games. One scoreboard.',
    how: isAr
      ? 'ثلاث ألعاب متصلة تتقاسم نفس النتيجة، وكل جولة من ٠ إلى ٥. أولاً: أدر العجلة لرقم لا معنى له ثم خمّن الحقيقة — الانجرار وراء الرقم يكلّفك نقطة. ثانياً: هل الشيء التالي أعلى أم أقل من الذي أمامك؟ كل إجابة صحيحة ترفع رصيدك، وخطأ واحد يضيّع الجولة — فاسحب قبل ذلك. ثالثاً: رتّب خمس بطاقات — كل زوج صحيح يُحتسب.'
      : 'Three connected games share one scoreboard, and every round is worth 0–5. First: spin a meaningless number, then estimate the truth — drifting toward the number costs you a point. Second: is the next thing higher or lower than the one in front of you? Each correct call raises your run and one miss loses it, so bank before that. Third: order five cards — every correctly ordered pair counts.',
    teams: isAr ? 'الفرق' : 'Teams',
    length: isAr ? 'طول الليلة' : 'Night length',
    setsLabel: isAr ? 'مجموعة الليلة' : 'Tonight’s set',
    setsHint: isAr
      ? 'كل مجموعة أسئلة مختلفة تماماً. العب واحدة الليلة وضع علامة عليها، ثم خذ التالية في المرة القادمة.'
      : 'Each set is entirely different questions. Play one tonight, tick it off, take the next one next time.',
    setName: (n) => (isAr ? `المجموعة ${n}` : `Set ${n}`),
    setDone: isAr ? 'لُعبت' : 'Played',
    setTick: (n) => (isAr ? `علّم المجموعة ${n} كملعوبة` : `Mark set ${n} as played`),
    setsAllDone: isAr ? 'لعبت كل المجموعات — ابدأ من جديد' : 'Every set played — start again',
    setShort: isAr
      ? 'هذه الليلة أطول من المجموعة. سنكمل من بقية البنك.'
      : 'This night is longer than one set. The rest will come from the wider bank.',
    quick: isAr ? 'سريعة' : 'Quick',
    standard: isAr ? 'عادية' : 'Standard',
    marathon: isAr ? 'ماراثون' : 'Marathon',
    start: isAr ? 'ابدأ الليلة' : 'Start the night',
    spin: isAr ? 'أدر العجلة' : 'Spin the wheel',
    spinFirst: isAr ? 'أدر أولاً — السؤال مخفي' : 'Spin first — the question stays hidden',
    said: isAr ? 'العجلة تقول' : 'The wheel says',
    lock: isAr ? 'ثبّت التخمين' : 'Lock it in',
    wheelSaid: isAr ? 'العجلة' : 'The wheel',
    youSaid: isAr ? 'أنت' : 'You said',
    truth: isAr ? 'الحقيقة' : 'The answer',
    next: isAr ? 'التالي' : 'Next',
    higher: isAr ? '▲ أعلى' : '▲ Higher',
    lower: isAr ? '▼ أقل' : '▼ Lower',
    vs: isAr ? 'مقابل' : 'versus',
    /* Names the two things being compared, in both directions of the sentence,
       because "Higher" on its own never said higher THAN WHAT. */
    askHL: (next, cur) => (isAr
      ? `هل ${next} أعلى أم أقل من ${cur}؟`
      : `Is ${next} higher or lower than ${cur}?`),
    bank: isAr ? 'اسحب' : 'Bank',
    run: isAr ? 'الجولة' : 'Run',
    streak: isAr ? 'المتتالية' : 'Streak',
    pot: isAr ? 'الرصيد' : 'Pot',
    nextWorth: isAr ? 'التالي يساوي' : 'Next worth',
    reveal: isAr ? 'اكشف الترتيب' : 'Reveal the order',
    undo: isAr ? '↶ تراجع' : '↶ Undo',
    reset: isAr ? 'إعادة' : 'Reset',
    selected: (a, b) => (isAr ? `${a} من ${b} مختارة` : `${a} / ${b} selected`),
    champion: isAr ? 'بطل الليلة' : 'Champion of the night',
    tie: isAr ? 'تعادل' : 'Dead heat',
    again: isAr ? 'العب مجدداً' : 'Play again',
    done: isAr ? 'إنهاء' : 'Finish',
    matchCard: isAr ? 'بطاقة المباراة' : 'Match card',
    startGame: (n) => (isAr ? `ابدأ اللعبة ${n}` : `Start game ${n}`),
    seeFinal: isAr ? 'النتيجة النهائية' : 'See the final result',
    played: isAr ? 'انتهت' : 'Played',
    upNext: isAr ? 'التالية' : 'Up next',
    locked: isAr ? 'مقفلة' : 'Locked',
  }), [isAr]);

  const GAME_NAMES = useMemo(() => [
    { name: isAr ? 'العجلة' : 'The Wheel', blurb: isAr ? 'أدر، ثم خمّن الحقيقة.' : 'Spin, then estimate the truth.' },
    { name: isAr ? 'المتتالية' : 'Streak', blurb: isAr ? 'أعلى أم أقل — واسحب قبل أن تخسر.' : 'Higher or lower — bank before you lose it.' },
    { name: isAr ? 'الترتيب' : 'Ranked', blurb: isAr ? 'خمس بطاقات، عشرة أزواج.' : 'Five cards, ten pairs.' },
  ], [isAr]);

  // setup | hub | wheel | streak | ranked | final
  const [phase, setPhase] = useState('setup');
  const [names, setNames] = useState(() => loadGroupPlayerNames(1, 4).slice(0, 2));
  const [lengthKey, setLengthKey] = useState('standard');
  const [setIdx, setSetIdx] = useState(() => nextUnplayed());
  const [played, setPlayedState] = useState(() => loadPlayed());
  const [teams, setTeams] = useState([]);
  const [gameIdx, setGameIdx] = useState(0);
  const [host, setHost] = useState({ text: '', mood: '' });

  const say = useCallback((text, mood = '') => setHost({ text, mood }), []);

  /* ── Game 1 state ── */
  const [wRound, setWRound] = useState(0);
  const [wStage, setWStage] = useState('spin'); // spin | spinning | guess | reveal
  const [wQ, setWQ] = useState(null);
  const [wAnchor, setWAnchor] = useState(null);
  const [wGuess, setWGuess] = useState(0);
  const [wResult, setWResult] = useState(null);
  const [wRot, setWRot] = useState(0);
  const [flap, setFlap] = useState(0);
  const rotRef = useRef(0);
  const rafRef = useRef(0);

  /* ── Game 2 state ── */
  const [sIdx, setSIdx] = useState(0);
  const [sRun, setSRun] = useState(null);
  const [sMsg, setSMsg] = useState({ text: '', tone: '' });
  const [sOver, setSOver] = useState(false);
  const sLock = useRef(false);

  /* ── Game 3 state ── */
  const [rIdx, setRIdx] = useState(0);
  const [rPuzzle, setRPuzzle] = useState(null);
  const [rCards, setRCards] = useState([]);
  const [rPick, setRPick] = useState([]);
  const [rResult, setRResult] = useState(null);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const L = LENGTHS[lengthKey];
  /* Teams do not exist until the night starts, but the set picker has to warn
     BEFORE that — so size the warning off the names entered so far. */
  const teamCount = Math.min(4, Math.max(1, names.filter((n) => String(n).trim()).length));
  const schedule = useMemo(() => {
    if (!teams.length) return { wheel: 0, streak: 0, ranked: 0 };
    return { wheel: teams.length * L.wheel, streak: teams.length * L.streak, ranked: teams.length * L.ranked };
  }, [teams.length, L]);

  const addScore = useCallback((teamIdx, pts, key) => {
    setTeams((prev) => prev.map((tm, i) => (i === teamIdx
      ? { ...tm, score: tm.score + pts, per: { ...tm.per, [key]: tm.per[key] + pts } }
      : tm)));
  }, []);

  /* ── Setup ─────────────────────────────────────────────────────────────── */
  const beginNight = () => {
    playSfx?.('click');
    const cleaned = saveGroupPlayerNames(names).slice(0, 4);
    setTeams(cleaned.map((n, i) => ({
      name: n.toUpperCase(), colour: TEAM_COLOURS[i], score: 0,
      per: { wheel: 0, streak: 0, ranked: 0 },
      stats: { bulls: 0, pulled: 0, errSum: 0, rounds: 0, resist: 0, best: 0, busts: 0, pairs: 0, pairsOf: 0, exact: 0, perfect: 0 },
    })));
    setGameIdx(0);
    setPhase('hub');
    say(isAr ? 'ثلاث ألعاب، لوحة واحدة. لا أعذار بينها.' : 'Three games, one scoreboard. No excuses in between.', 'cheer');
  };

  /* ── Game 1 ────────────────────────────────────────────────────────────── */
  const startWheel = () => { setWRound(0); setPhase('wheel'); beginWheelRound(0); };

  const beginWheelRound = (round) => {
    setWStage('spin'); setWQ(null); setWAnchor(null); setWResult(null);
    const tm = teams[round % teams.length];
    say(isAr ? `${tm.name}: أدر أولاً. السؤال يظهر بعد توقف العجلة.`
      : `${tm.name}: spin first. The question appears only once it lands.`);
  };

  const doSpin = () => {
    if (wStage !== 'spin') return;
    playSfx?.('click');
    setWStage('spinning');
    const q = wheelDrawer.draw(SETS[setIdx].wheel, (x) => x.id) || wheelDrawer.draw(WHEEL_BANK, (x) => x.id);
    const anchor = Math.random() < 0.5 ? q.low : q.high;
    setWQ(q); setWAnchor(anchor);
    say(isAr ? 'رقم بلا معنى قادم. من فضلك تعلّق به عاطفياً.'
      : 'Here comes a completely meaningless number. Please become attached to it.');

    const idx = WHEEL_VALUES.indexOf(anchor);
    const target = idx * 30 + 15 + (Math.random() * 16 - 8);
    const cur = ((rotRef.current % 360) + 360) % 360;
    let delta = ((360 - target) - cur) % 360;
    if (delta < 0) delta += 360;
    const end = rotRef.current + 360 * (4 + rnd(3)) + delta;
    const from = rotRef.current;
    const t0 = performance.now();
    const DUR = 3200;
    let lastSeg = -1;
    const step = (now) => {
      const p = Math.min(1, (now - t0) / DUR);
      const eased = 1 - (1 - p) ** 3;
      const rot = from + (end - from) * eased;
      setWRot(rot);
      const seg = Math.floor((((rot % 360) + 360) % 360) / 30);
      if (seg !== lastSeg) { lastSeg = seg; setFlap((f) => f + 1); }
      if (p < 1) { rafRef.current = requestAnimationFrame(step); return; }
      rotRef.current = end;
      playSfx?.('collect');
      setWGuess(q.dec ? Math.round(((q.min + q.max) / 2) * 10) / 10 : Math.round((q.min + q.max) / 2));
      setWStage('guess');
      say(isAr ? 'الآن السؤال. الرقم جاء أولاً — لا تدعه يقودك.'
        : 'Now the question. The number came first — try not to let it drive.');
    };
    rafRef.current = requestAnimationFrame(step);
  };

  const lockEstimate = () => {
    if (wStage !== 'guess' || !wQ) return;
    playSfx?.('click');
    const q = wQ;
    const dir = wAnchor > q.truth ? 1 : -1;
    const drift = (wGuess - q.truth) * dir;
    const absErr = Math.abs(wGuess - q.truth);
    const verdict = absErr <= q.tol ? 'bull' : drift > q.tol ? 'pulled' : 'resisted';
    const ti = wRound % teams.length;
    const sc = scoreEstimate(wGuess, q, verdict);
    addScore(ti, sc.total, 'wheel');
    setTeams((prev) => prev.map((tm, i) => (i === ti ? {
      ...tm,
      stats: {
        ...tm.stats, rounds: tm.stats.rounds + 1, errSum: tm.stats.errSum + sc.relErr,
        bulls: tm.stats.bulls + (verdict === 'bull' ? 1 : 0),
        pulled: tm.stats.pulled + (verdict === 'pulled' ? 1 : 0),
        resist: verdict === 'pulled' ? 0 : tm.stats.resist + 1,
      },
    } : tm)));
    setWResult({ verdict, ...sc, drift });
    setWStage('reveal');
    playSfx?.(verdict === 'pulled' ? 'error' : 'win');
    if (verdict === 'bull') say(isAr ? 'إصابة مباشرة. كوكبي كله فخور.' : 'Bullseye. My entire planet is proud.', 'cheer');
    else if (verdict === 'resisted') say(isAr ? 'قاومت الرقم. هذا هو المطلوب بالضبط.' : 'You resisted the number. That is the whole exercise.', 'cheer');
    else say(isAr ? 'العجلة دخلت رأسك. يوجد مكان هناك على ما يبدو.' : 'The wheel got into your head. Apparently there was room.', 'shake');
  };

  const nextWheel = () => {
    playSfx?.('click');
    const n = wRound + 1;
    if (n >= schedule.wheel) { setGameIdx(1); setPhase('hub'); say(isAr ? 'اللعبة الأولى انتهت. النتيجة تُحمل معكم.' : 'Game one is done. The score travels with you.', 'cheer'); return; }
    setWRound(n); beginWheelRound(n);
  };

  /* ── Game 2 ────────────────────────────────────────────────────────────── */
  const startStreak = () => { setSIdx(0); setPhase('streak'); beginRun(0); };

  const beginRun = (idx) => {
    const pool = streakDrawer.draw(SETS[setIdx].streak, (p) => p.id) || streakDrawer.draw(STREAK_POOLS, (p) => p.id);
    setSRun({ pool, items: shuffle(pool.items), at: 0, pot: 0, calls: 0 });
    setSMsg({ text: isAr ? 'أعلى أم أقل؟' : 'Higher or lower?', tone: '' });
    setSOver(false);
    sLock.current = false;
    const tm = teams[idx % teams.length];
    say(isAr ? `${tm.name}: ابنِ الرصيد، ثم قرّر متى تتحوّل شجاعتك إلى طمع.`
      : `${tm.name}: build the pot, then decide when your courage becomes greed.`);
  };

  const call = (dir) => {
    if (sLock.current || !sRun) return;
    const { items, at } = sRun;
    if (at >= items.length - 1) return;
    sLock.current = true;
    playSfx?.('click');
    const cur = items[at];
    const next = items[at + 1];
    const right = dir === 1 ? next.v > cur.v : next.v < cur.v;
    const ti = sIdx % teams.length;
    if (right) {
      const run = { ...sRun, at: at + 1, calls: sRun.calls + 1, pot: runWorth(sRun.calls + 1) };
      setSRun(run);
      setSMsg({ text: isAr ? `✓ صحيح · ${run.pot}/${RUN_CAP}` : `✓ Correct · ${run.pot}/${RUN_CAP}`, tone: 'good' });
      playSfx?.('collect');
      say(isAr ? 'صحيح. الرصيد يكبر. والطمع يدخل الغرفة.' : 'Correct. The pot grows. Greed enters the room.', 'cheer');
      if (run.at >= items.length - 1) {
        // Pool exhausted — bank automatically rather than strand the run.
        const paid = runWorth(run.calls);
        addScore(ti, paid, 'streak');
        setTeams((prev) => prev.map((tm, i) => (i === ti ? { ...tm, stats: { ...tm.stats, best: Math.max(tm.stats.best, run.calls) } } : tm)));
        setSMsg({ text: isAr ? `نفدت الحقائق — سُحب ${paid}` : `Facts exhausted — banked ${paid}`, tone: 'good' });
        setSOver(true);
      }
      setTimeout(() => { sLock.current = false; }, 260);
    } else {
      setSRun({ ...sRun, at: at + 1, pot: 0 });
      setSMsg({ text: isAr ? `✗ خطأ — ضاعت الجولة` : '✗ Wrong — the run is lost', tone: 'bad' });
      setTeams((prev) => prev.map((tm, i) => (i === ti ? { ...tm, stats: { ...tm.stats, busts: tm.stats.busts + 1, best: Math.max(tm.stats.best, sRun.calls) } } : tm)));
      playSfx?.('error');
      say(isAr ? 'انفجر. الرصيد ذهب. لست غاضباً — حاجباي غاضبان.' : 'Boom. Pot gone. I am not angry; my eyebrows are.', 'shake');
      setSOver(true);
    }
  };

  const bank = () => {
    if (sLock.current || !sRun || !sRun.pot || sOver) return;
    playSfx?.('win');
    const ti = sIdx % teams.length;
    const paid = runWorth(sRun.calls);
    addScore(ti, paid, 'streak');
    setTeams((prev) => prev.map((tm, i) => (i === ti ? { ...tm, stats: { ...tm.stats, best: Math.max(tm.stats.best, sRun.calls) } } : tm)));
    setSMsg({ text: isAr ? `سُحب +${paid}` : `Banked +${paid}`, tone: 'good' });
    setSOver(true);
    say(isAr ? 'سُحب. معقول. معقول بشكل مريب.' : 'Banked. Sensible. Suspiciously sensible.', 'cheer');
  };

  const nextRun = () => {
    playSfx?.('click');
    const n = sIdx + 1;
    if (n >= schedule.streak) { setGameIdx(2); setPhase('hub'); say(isAr ? 'اللعبة الثانية انتهت.' : 'Game two is done.', 'cheer'); return; }
    setSIdx(n); beginRun(n);
  };

  /* ── Game 3 ────────────────────────────────────────────────────────────── */
  const startRanked = () => { setRIdx(0); setPhase('ranked'); beginPuzzle(0); };

  const beginPuzzle = (idx) => {
    const p = rankedDrawer.draw(SETS[setIdx].ranked, (x) => x.id) || rankedDrawer.draw(RANKED_PUZZLES, (x) => x.id);
    setRPuzzle(p); setRCards(shuffle(p.items)); setRPick([]); setRResult(null);
    const tm = teams[idx % teams.length];
    say(isAr ? `${tm.name}: خمس بطاقات، عشرة أزواج. اضغط بطاقة مختارة لإلغائها.`
      : `${tm.name}: five cards, ten pairs. Tap a chosen card again to take it back.`);
  };

  const toggleCard = (item) => {
    if (rResult) return;
    playSfx?.('click');
    setRPick((prev) => (prev.includes(item)
      ? prev.filter((x) => x !== item)
      : prev.length < rCards.length ? [...prev, item] : prev));
  };

  const revealOrder = () => {
    if (!rPuzzle || rPick.length !== rCards.length || rResult) return;
    playSfx?.('click');
    const correct = [...rPuzzle.items].sort((a, b) => a.v - b.v);
    const { pairs, total, exact, perfect, pts } = scoreOrder(rPick, correct);
    const ti = rIdx % teams.length;
    addScore(ti, pts, 'ranked');
    setTeams((prev) => prev.map((tm, i) => (i === ti ? {
      ...tm, stats: { ...tm.stats, pairs: tm.stats.pairs + pairs, pairsOf: tm.stats.pairsOf + total, exact: tm.stats.exact + exact, perfect: tm.stats.perfect + (perfect ? 1 : 0) },
    } : tm)));
    setRResult({ correct, pairs, total, exact, pts, perfect });
    playSfx?.(perfect ? 'win' : 'collect');
    say(perfect
      ? (isAr ? 'خط مثالي. عشرة من عشرة أزواج.' : 'Perfect line. Ten pairs out of ten.')
      : (isAr ? 'اهتزّ الترتيب. لوحة النتائج لا تهتم بمشاعرك.' : 'The line wobbled. The scoreboard does not care about your feelings.'),
    perfect ? 'cheer' : '');
  };

  const nextPuzzle = () => {
    playSfx?.('click');
    const n = rIdx + 1;
    if (n >= schedule.ranked) { setGameIdx(3); setPhase('final'); say(isAr ? 'انتهت البطولة. أطالب بالتصفيق.' : 'The championship is complete. I demand applause.', 'cheer'); return; }
    setRIdx(n); beginPuzzle(n);
  };

  /* ── Shared bits of UI ─────────────────────────────────────────────────── */
  const Host = () => (
    <div className={`tw-host${host.mood ? ` is-${host.mood}` : ''}`}>
      <KawkabSprite size={54} className="tw-host-sprite" />
      <div className="tw-bubble">
        <b>{isAr ? 'د. كوكب · المقدّم' : 'DR KAWKAB · HOST'}</b>
        {host.text}
      </div>
    </div>
  );

  const Board = ({ activeIdx, key: which }) => (
    <div className="tw-board">
      {teams.map((tm, i) => (
        <div key={tm.name + i} className={`tw-team${i === activeIdx ? ' is-turn' : ''}`} style={{ '--tw-team': tm.colour }}>
          <div className="tw-team-name">{tm.name}</div>
          <div className="tw-team-score">{tm.score}</div>
          <div className="tw-team-sub">{which ? `${which} ${tm.per[which]}` : ''}</div>
        </div>
      ))}
    </div>
  );

  const Wheel = ({ big }) => (
    <div className="tw-wheelwrap">
      <div className="tw-wheelbox">
        <div key={flap} className="tw-pointer is-flap" />
        <div className="tw-wheel-outer" style={big ? undefined : { width: 150, height: 150 }}>
          <div className="tw-wheel" style={{ transform: `rotate(${wRot}deg)` }}>
            {WHEEL_VALUES.map((v, i) => (
              <div key={v} className="tw-seg" style={{ transform: `rotate(${i * 30 + 15}deg)` }}><b>{v}</b></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  /* ── Screens ───────────────────────────────────────────────────────────── */
  let body = null;

  if (phase === 'setup') {
    body = (
      <>
        <div className="gc-hero">{t.title}</div>
        <div className="gc-tagline">{t.tagline}</div>
        <GroupHow title={isAr ? 'كيف تُلعب' : 'How it works'} text={t.how} />
        <GroupPlayerSetup
          isAr={isAr} playSfx={playSfx} players={names} onPlayersChange={setNames}
          min={1} max={4} label={isAr ? 'الفرق (١–٤)' : 'Teams (1–4)'}
        />
        <div className="gc-label">{t.length}</div>
        <div className="gc-times">
          {['quick', 'standard', 'marathon'].map((k) => (
            <button
              key={k} type="button"
              className={`gc-time${lengthKey === k ? ' on' : ''}`}
              onClick={() => { playSfx?.('click'); setLengthKey(k); }}
            >
              {t[k]}
              <small style={{ display: 'block', opacity: 0.7 }}>
                {LENGTHS[k].wheel}·{LENGTHS[k].streak}·{LENGTHS[k].ranked}
              </small>
            </button>
          ))}
        </div>
        {/*
          The set picker. A host plans a games night, so the two things that
          matter are "which one is fresh" and "tick it when we're done" — the
          suggestion defaults to the lowest unplayed set so the common case is
          simply pressing Start.
        */}
        <div className="gc-label">{t.setsLabel}</div>
        <div className="gc-how-text tw-sets-hint">{t.setsHint}</div>
        <div className="tw-sets">
          {SETS.map((s) => {
            const done = played.has(s.index);
            const n = s.index + 1;
            return (
              <div key={s.index} className={`tw-set${setIdx === s.index ? ' is-on' : ''}${done ? ' is-done' : ''}`}>
                <button
                  type="button"
                  className="tw-set-pick"
                  aria-pressed={setIdx === s.index}
                  onClick={() => { playSfx?.('click'); setSetIdx(s.index); }}
                >
                  <span className="tw-set-name">{t.setName(n)}</span>
                  <span className="tw-set-meta">{s.wheel.length}·{s.streak.length}·{s.ranked.length}</span>
                </button>
                <label className="tw-set-tick">
                  <input
                    type="checkbox"
                    checked={done}
                    aria-label={t.setTick(n)}
                    onChange={(e) => {
                      playSfx?.('click');
                      setPlayedState(new Set(setPlayed(s.index, e.target.checked)));
                    }}
                  />
                  <span>{t.setDone}</span>
                </label>
              </div>
            );
          })}
        </div>
        {played.size >= SET_COUNT ? <div className="gc-how-text">{t.setsAllDone}</div> : null}
        {!setCovers(setIdx, { wheel: teamCount * L.wheel, streak: teamCount * L.streak, ranked: teamCount * L.ranked })
          ? <div className="gc-how-text tw-sets-warn">{t.setShort}</div> : null}
        <button type="button" className="gc-btn" onClick={beginNight}>{t.start}</button>
      </>
    );
  }

  if (phase === 'hub') {
    const ordered = [...teams].sort((a, b) => b.score - a.score);
    body = (
      <>
        <Host />
        <div className="gc-label">{t.matchCard}</div>
        <div className="tw-board">
          {ordered.map((tm, i) => (
            <div key={tm.name + i} className="tw-team is-turn" style={{ '--tw-team': tm.colour }}>
              <div className="tw-team-name">{i + 1}. {tm.name}</div>
              <div className="tw-team-score">{tm.score}</div>
            </div>
          ))}
        </div>
        {GAME_NAMES.map((g, i) => (
          <div key={g.name} className="gc-card tw-block" style={{ opacity: i === gameIdx ? 1 : 0.6 }}>
            <div className="gc-label" style={{ margin: 0 }}>
              {i + 1} · {g.name} — {i < gameIdx ? t.played : i === gameIdx ? t.upNext : t.locked}
            </div>
            {i === gameIdx ? <div className="gc-how-text">{g.blurb}</div> : null}
          </div>
        ))}
        <button
          type="button" className="gc-btn"
          onClick={() => {
            playSfx?.('click');
            if (gameIdx === 0) startWheel();
            else if (gameIdx === 1) startStreak();
            else if (gameIdx === 2) startRanked();
            else setPhase('final');
          }}
        >
          {gameIdx < 3 ? t.startGame(gameIdx + 1) : t.seeFinal}
        </button>
      </>
    );
  }

  if (phase === 'wheel') {
    const ti = wRound % teams.length;
    body = (
      <>
        <Board activeIdx={ti} key="wheel" />
        <Host />
        <Wheel big={wStage === 'spin' || wStage === 'spinning'} />
        <div className="tw-said">
          {wAnchor == null ? t.spinFirst : <>{t.said}<b>{wAnchor}</b></>}
        </div>
        {wStage === 'spin' ? (
          <button type="button" className="gc-btn" onClick={doSpin}>{t.spin}</button>
        ) : null}

        {wQ && wStage !== 'spinning' ? <div className="gc-question">{wQ.q}</div> : null}

        {wStage === 'guess' && wQ ? (
          <>
            <div className="tw-bigval">{wGuess}<small>{wQ.unit}</small></div>
            <input
              className="tw-slider" type="range"
              min={wQ.min} max={wQ.max} step={wQ.dec ? 0.1 : 1} value={wGuess}
              onChange={(e) => setWGuess(Number(e.target.value))}
              aria-label={wQ.q}
            />
            <div className="tw-caps"><span>{wQ.min}</span><span>{wQ.max}</span></div>
            <button type="button" className="gc-btn" onClick={lockEstimate}>{t.lock}</button>
          </>
        ) : null}

        {wStage === 'reveal' && wResult && wQ ? (
          <>
            <div className="tw-reveal">
              <div className="tw-rv"><span>{t.wheelSaid}</span><b>{wAnchor}</b></div>
              <div className="tw-rv"><span>{t.youSaid}</span><b>{fmtNum(wGuess)}</b></div>
              <div className="tw-rv is-truth"><span>{t.truth}</span><b>{fmtNum(wQ.truth)}</b></div>
            </div>
            <div className="tw-fact">{wQ.fact}</div>
            <div className={`tw-verdict is-${wResult.verdict}`}>
              {wResult.verdict === 'bull' ? (isAr ? '★ إصابة مباشرة' : '★ Bullseye — inside the tolerance window')
                : wResult.verdict === 'resisted' ? (isAr ? 'قاومت الرقم' : 'Resisted — you moved away from the anchor')
                  : (isAr ? 'جذبك الرقم' : 'Pulled — the anchor dragged your estimate toward it')}
            </div>
            {/* One line, one number out of five. The old readout showed the
                relative error, a difficulty multiplier, a bullseye bonus, an
                anchor-proof bonus and a streak bonus, then a total — six
                figures to explain a single round at a party. */}
            <div className="tw-points">
              {isAr ? 'خطأ نسبي' : 'Off by'} {wResult.relErr.toFixed(1)}%
              {wResult.pulled ? ` · ${isAr ? 'جذبك الرقم −1' : 'anchored −1'}` : ''}
              {' → '}<b>{teams[ti].name} +{wResult.total}/5</b>
            </div>
            <button type="button" className="gc-btn" onClick={nextWheel}>
              {wRound === schedule.wheel - 1 ? t.matchCard : t.next}
            </button>
          </>
        ) : null}
      </>
    );
  }

  if (phase === 'streak' && sRun) {
    const ti = sIdx % teams.length;
    const cur = sRun.items[sRun.at];
    const hasNext = sRun.at < sRun.items.length - 1;
    const worth = runWorth(sRun.calls + 1);
    body = (
      <>
        <Board activeIdx={ti} key="streak" />
        <Host />
        <div className="gc-label">{isAr ? sRun.pool.titleAr : sRun.pool.title}</div>
        <div className="tw-runbar">
          <div className="tw-runstat"><span>{t.run}</span><b>{Math.floor(sIdx / teams.length) + 1}/{L.streak}</b></div>
          <div className="tw-runstat"><span>{t.streak}</span><b>{sRun.calls}</b></div>
          <div className="tw-runstat"><span>{t.pot}</span><b>{sRun.pot}/{RUN_CAP}</b></div>
          <div className="tw-runstat"><span>{t.nextWorth}</span><b>{hasNext && !sOver ? `${worth}/${RUN_CAP}` : '—'}</b></div>
        </div>
        {/*
          ⚠ THE NEXT ITEM'S NAME MUST BE ON SCREEN. This showed only the current
          card and then asked "Higher or Lower?", while call() compared against
          items[at + 1] — an item the player was never shown. There was nothing
          to reason about and no way to be right on purpose: a coin flip wearing
          a quiz's clothes, and reported simply as "confusing".
          The value is hidden; the NAME is the whole question.
        */}
        <div className="tw-fact-card">
          <span>{cur.n}</span>
          <b>{fmtNum(cur.v)}{sRun.pool.unit}</b>
        </div>
        {hasNext && (
          <>
            <div className="tw-vs">{t.vs}</div>
            <div className="tw-fact-card tw-fact-card--ask">
              <span>{sRun.items[sRun.at + 1].n}</span>
              <b>?</b>
            </div>
            <div className="tw-ask">{t.askHL(sRun.items[sRun.at + 1].n, cur.n)}</div>
          </>
        )}
        <div className={`tw-msg${sMsg.tone ? ` is-${sMsg.tone}` : ''}`}>{sMsg.text}</div>
        {sOver ? (
          <button type="button" className="gc-btn" onClick={nextRun}>
            {sIdx === schedule.streak - 1 ? t.matchCard : t.next}
          </button>
        ) : (
          <div className="tw-dirs">
            <button type="button" className="gc-btn gc-btn--danger" disabled={!hasNext} onClick={() => call(-1)}>{t.lower}</button>
            <button type="button" className="gc-btn tw-bank" disabled={!sRun.pot} onClick={bank}>{t.bank} +{sRun.pot}</button>
            <button type="button" className="gc-btn gc-btn--ok" disabled={!hasNext} onClick={() => call(1)}>{t.higher}</button>
          </div>
        )}
      </>
    );
  }

  if (phase === 'ranked' && rPuzzle) {
    const ti = rIdx % teams.length;
    body = (
      <>
        <Board activeIdx={ti} key="ranked" />
        <Host />
        <div className="gc-question">{isAr ? rPuzzle.promptAr : rPuzzle.prompt}</div>
        {!rResult ? (
          <>
            <div className="gc-how-text">{t.selected(rPick.length, rCards.length)}</div>
            <div className="tw-cards">
              {rCards.map((it) => {
                const at = rPick.indexOf(it);
                return (
                  <button
                    key={it.n} type="button"
                    className={`tw-card${at >= 0 ? ' is-picked' : ''}`}
                    onClick={() => toggleCard(it)}
                  >
                    {at >= 0 ? <span className="tw-badge">{at + 1}</span> : null}
                    {it.n}
                  </button>
                );
              })}
            </div>
            <div className="gc-btn-col tw-block">
              <button type="button" className="gc-btn gc-btn--ghost" disabled={!rPick.length} onClick={() => { playSfx?.('click'); setRPick((p) => p.slice(0, -1)); }}>{t.undo}</button>
              <button type="button" className="gc-btn gc-btn--ghost" disabled={!rPick.length} onClick={() => { playSfx?.('click'); setRPick([]); }}>{t.reset}</button>
              {rPick.length === rCards.length ? <button type="button" className="gc-btn" onClick={revealOrder}>{t.reveal}</button> : null}
            </div>
          </>
        ) : (
          <>
            {rResult.correct.map((it, i) => {
              const slot = rPick.indexOf(it) + 1;
              const ok = slot === i + 1;
              return (
                <div key={it.n} className="tw-row">
                  <span className="tw-pos">{i + 1}</span>
                  <span>{it.n} <span className="tw-val">{fmtNum(it.v)}{rPuzzle.unit}</span></span>
                  <span className={ok ? 'tw-ok' : 'tw-no'}>{ok ? `✓ #${slot}` : `#${slot}`}</span>
                </div>
              );
            })}
            <div className="tw-points">
              {rResult.pairs}/{rResult.total} {isAr ? 'أزواج صحيحة' : 'pairs right'}{rResult.perfect ? ` · ${isAr ? 'ترتيب مثالي' : 'perfect line'}` : ''} → <b>{teams[ti].name} +{rResult.pts}/5</b>
            </div>
            <button type="button" className="gc-btn" onClick={nextPuzzle}>
              {rIdx === schedule.ranked - 1 ? t.matchCard : t.next}
            </button>
          </>
        )}
      </>
    );
  }

  if (phase === 'final') {
    const ordered = [...teams].sort((a, b) => b.score - a.score);
    const top = ordered[0]?.score ?? 0;
    const winners = ordered.filter((x) => x.score === top);
    body = (
      <>
        <Host />
        <div className="gc-hero">{winners.length === 1 ? ordered[0].name : t.tie}</div>
        <div className="gc-tagline">{winners.length === 1 ? t.champion : ''}</div>
        {ordered.map((tm, i) => (
          <div key={tm.name + i} className="gc-card tw-block">
            <div className="gc-label" style={{ margin: 0 }}>{i + 1}. {tm.name} — {tm.score}</div>
            <div className="gc-how-text">
              {GAME_NAMES[0].name} {tm.per.wheel} · {GAME_NAMES[1].name} {tm.per.streak} · {GAME_NAMES[2].name} {tm.per.ranked}
              <br />
              {isAr ? 'إصابات' : 'Bullseyes'} {tm.stats.bulls} · {isAr ? 'أطول متتالية' : 'Best streak'} {tm.stats.best} · {isAr ? 'أزواج' : 'Pairs'} {tm.stats.pairs}/{tm.stats.pairsOf}
            </div>
          </div>
        ))}
        <div className="gc-btn-col tw-block">
          <button type="button" className="gc-btn" onClick={() => { playSfx?.('click'); setPhase('setup'); }}>{t.again}</button>
          <button type="button" className="gc-btn gc-btn--ghost" onClick={onBack}>{t.done}</button>
        </div>
      </>
    );
  }

  return (
    <GroupShell
      isAr={isAr}
      title={t.title}
      onBack={onBack}
      accent={ACCENT}
      center={phase !== 'setup'}
      chip={phase === 'wheel' ? `${wRound + 1}/${schedule.wheel}`
        : phase === 'streak' ? `${sIdx + 1}/${schedule.streak}`
          : phase === 'ranked' ? `${rIdx + 1}/${schedule.ranked}` : null}
    >
      {body}
    </GroupShell>
  );
}
