import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';
import { makeRng } from '../../../../shared/rng';
import { ANIM_CSS, BACKGROUNDS, CHARS, ACTIONS, CharacterArt, PanelStage } from '../../../memory/games/story-grid';

/*
 * Detective — a narrated mystery RIDDLE (deductive reasoning, bilingual).
 *
 * Plays like a little detective movie: a themed crime with stakes, then each
 * suspect's alibi told as a richly-narrated, touchable scene (every suspect has
 * a physical "tell"). The detective's clues point at the culprit; deduce who
 * fits every clue and accuse — then get the full reasoning.
 *
 * Cases are generated so exactly one suspect fits all clues (always solvable),
 * with authored case themes, narration and a misdirection for flavour.
 *   Levels · Survival (3 wrong = out) · Pass n Play.
 */

const DET_CSS = `
@keyframes dt-pop {0%{transform:scale(0.7);opacity:0}55%{transform:scale(1.07);opacity:1}100%{transform:scale(1);opacity:1}}
@keyframes dt-hop {0%,100%{transform:translateY(0)}30%{transform:translateY(-9%)}60%{transform:translateY(0)}}
@keyframes dt-find {0%{transform:translateY(6px) scale(0.7);opacity:0}50%{transform:scale(1.05);opacity:1}100%{transform:scale(1);opacity:1}}
`;

const LIVES = 3;
const bigSize = () => Math.min(300, typeof window !== 'undefined' ? window.innerWidth - 36 : 300);

// ── case themes (the crime + its story) ──
const CASES = [
  { e: '🏆', place: 'museum', thing: { en: 'golden trophy', ar: 'الكأس الذهبية' }, setup: { en: 'The shining golden trophy stood proudly in the museum — then, in a blink, it was GONE!', ar: 'وقفت الكأس الذهبية بفخر في المتحف — وفي لمحة، اختفت!' }, q: { en: 'Who took the trophy?', ar: 'مَن أخذ الكأس؟' } },
  { e: '🍰', place: 'kitchen', thing: { en: 'birthday cake', ar: 'كعكة العيد' }, setup: { en: 'A giant birthday cake waited in the kitchen. Everyone looked away for one minute… and a big slice had vanished!', ar: 'انتظرت كعكة عيد ضخمة في المطبخ. التفت الجميع للحظة… وإذا بقطعة كبيرة قد اختفت!' }, q: { en: 'Who took the slice?', ar: 'مَن أخذ القطعة؟' } },
  { e: '🎈', place: 'park', thing: { en: 'giant red balloon', ar: 'البالون الأحمر العملاق' }, setup: { en: 'The giant red balloon was tied tight at the party — until someone let it fly far into the sky!', ar: 'رُبط البالون الأحمر العملاق بإحكام في الحفل — حتى أطلقه أحدهم ليطير بعيداً في السماء!' }, q: { en: 'Who set it free?', ar: 'مَن أطلقه؟' } },
  { e: '📕', place: 'library', thing: { en: 'magic story book', ar: 'كتاب القصص السحري' }, setup: { en: 'The rare magic story book sat on the library shelf. After lunch, the shelf was empty!', ar: 'كان كتاب القصص السحري النادر على رفّ المكتبة. وبعد الغداء، صار الرفّ فارغاً!' }, q: { en: 'Who took the book?', ar: 'مَن أخذ الكتاب؟' } },
  { e: '🔑', place: 'garden', thing: { en: 'treasure key', ar: 'مفتاح الكنز' }, setup: { en: 'The little treasure key hung by the garden gate. Then — poof — it was hidden away!', ar: 'عُلّق مفتاح الكنز الصغير عند بوابة الحديقة. ثم — وفجأة — أُخفي!' }, q: { en: 'Who hid the key?', ar: 'مَن أخفى المفتاح؟' } },
  { e: '🍪', place: 'kitchen', thing: { en: 'last cookie', ar: 'آخر بسكويتة' }, setup: { en: 'One last cookie sat in the jar, and everyone promised not to touch it… but the jar is empty now!', ar: 'بقيت بسكويتة أخيرة في الجرّة، ووعد الجميع بألا يلمسها أحد… لكن الجرّة فارغة الآن!' }, q: { en: 'Who ate the cookie?', ar: 'مَن أكل البسكويتة؟' } },
];

const ALIBIS = [
  { place: 'beach', actions: ['swim', 'play'] }, { place: 'pool', actions: ['swim'] },
  { place: 'kitchen', actions: ['eat', 'cook'] }, { place: 'garden', actions: ['plant'] },
  { place: 'park', actions: ['play'] }, { place: 'stage', actions: ['dance', 'sing'] },
  { place: 'library', actions: ['read'] }, { place: 'classroom', actions: ['study', 'read'] },
  { place: 'museum', actions: ['paint'] }, { place: 'bedroom', actions: ['sleep', 'read'] },
];

// Per action: how the scene reads (gerund + a physical TELL), the matching crime
// CLUE the detective finds, and the ground EVIDENCE you can tap to discover.
const NARR = {
  swim: { en: 'splashing in the water', ar: 'يلهو في الماء', tell: { en: 'soaked and dripping wet', ar: 'مبلّلٌ يقطر ماءً' }, clue: { en: 'a trail of dripping water', ar: 'أثراً من الماء المتقاطر' }, find: { e: '💧', en: 'Wet, dripping footprints.', ar: 'آثار أقدام مبللة.' } },
  play: { en: 'kicking a ball about', ar: 'يركل الكرة', tell: { en: 'grass stains on both knees', ar: 'بقع عشب على ركبتيه' }, clue: { en: 'fresh grass stains', ar: 'بقع عشب طازجة' }, find: { e: '⚽', en: 'A ball left on the ground.', ar: 'كرة متروكة على الأرض.' } },
  eat: { en: 'munching a snack', ar: 'يقضم وجبة خفيفة', tell: { en: 'crumbs around the mouth', ar: 'فُتاتٌ حول فمه' }, clue: { en: 'a sprinkle of crumbs', ar: 'رشّة من الفُتات' }, find: { e: '🍽️', en: 'Crumbs scattered around.', ar: 'فُتات متناثر حولها.' } },
  cook: { en: 'stirring a big pot', ar: 'يحرّك قدراً كبيراً', tell: { en: 'a warm smell of food', ar: 'رائحة طعام دافئة' }, clue: { en: 'a warm cooking smell', ar: 'رائحة طبخ دافئة' }, find: { e: '🍳', en: 'A warm cooking smell.', ar: 'رائحة طبخ دافئة.' } },
  plant: { en: 'planting bright flowers', ar: 'يزرع أزهاراً زاهية', tell: { en: 'muddy hands', ar: 'ويداه موحلتان' }, clue: { en: 'muddy fingerprints', ar: 'بصمات موحلة' }, find: { e: '🌱', en: 'Bits of soil on the ground.', ar: 'بقايا تراب على الأرض.' } },
  read: { en: 'reading a thick book', ar: 'يقرأ كتاباً سميكاً', tell: { en: 'quiet as a mouse', ar: 'هادئاً كالفأر' }, clue: { en: 'a bookmark dropped nearby', ar: 'فاصل كتاب سقط قريباً' }, find: { e: '📖', en: 'An open book nearby.', ar: 'كتاب مفتوح قريب.' } },
  study: { en: 'studying hard', ar: 'يدرس بجدّ', tell: { en: 'ink on the fingers', ar: 'حبرٌ على أصابعه' }, clue: { en: 'a smudge of ink', ar: 'لطخة حبر' }, find: { e: '✏️', en: 'Scattered notes.', ar: 'أوراق متناثرة.' } },
  dance: { en: 'spinning to music', ar: 'يدور مع الموسيقى', tell: { en: 'still humming a tune', ar: 'وما زال يدندن' }, clue: { en: 'music still echoing', ar: 'موسيقى ما زال صداها' }, find: { e: '🎵', en: 'Music still playing.', ar: 'موسيقى ما زالت تُعزف.' } },
  sing: { en: 'singing out loud', ar: 'يغنّي بصوت عالٍ', tell: { en: 'a happy, tired voice', ar: 'وصوته مرهقٌ من الفرح' }, clue: { en: 'a song stuck in the air', ar: 'أغنية عالقة في الهواء' }, find: { e: '🎤', en: 'A microphone left out.', ar: 'ميكروفون متروك.' } },
  paint: { en: 'painting a picture', ar: 'يرسم لوحة', tell: { en: 'colourful smudges on both hands', ar: 'بقع ألوان على يديه' }, clue: { en: 'colourful paint smudges', ar: 'بقع طلاء ملوّنة' }, find: { e: '🎨', en: 'Fresh paint splatters.', ar: 'رشّات طلاء طازجة.' } },
  sleep: { en: 'taking a cosy nap', ar: 'يأخذ قيلولة', tell: { en: 'yawning and sleepy', ar: 'يتثاءب وناعس' }, clue: { en: 'a soft snore from the room', ar: 'شخيرٌ خفيف من الغرفة' }, find: { e: '💤', en: 'A cosy pillow.', ar: 'وسادة مريحة.' } },
};
const HERRINGS = [
  { e: '🐚', en: 'Just a seashell.', ar: 'مجرّد صدفة.' }, { e: '🪙', en: 'An old coin.', ar: 'عملة قديمة.' },
  { e: '🐛', en: 'A little bug.', ar: 'حشرة صغيرة.' }, { e: '🍂', en: 'A dry leaf.', ar: 'ورقة جافة.' }, { e: '🧦', en: 'A lost sock.', ar: 'جورب مفقود.' },
];

const placeName = (id, isAr) => { const b = BACKGROUNDS[id]; return b ? (isAr ? b.ar : b.en) : id; };
const actWord = (id, isAr) => { const a = ACTIONS.find((x) => x.id === id); return a ? (isAr ? a.ar : a.en) : id; };
const charName = (id, isAr) => { const c = CHARS.find((x) => x.id === id); return c ? (isAr ? c.ar : c.en) : id; };
const pick = (a, rng) => a[Math.floor(rng() * a.length)];
const shuffleR = (arr, rng) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const hashId = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };

function makeCase(rng, cfg) {
  const { K, clueMode } = cfg;
  const theme = pick(CASES, rng);
  const charIds = shuffleR(CHARS.map((c) => c.id), rng).slice(0, K);
  const units = [];
  const usedA = new Set();
  for (const al of shuffleR(ALIBIS, rng)) {
    const act = shuffleR(al.actions, rng).find((a) => !usedA.has(a));
    if (!act) continue;
    units.push({ place: al.place, action: act });
    usedA.add(act);
    if (units.length >= K) break;
  }
  const suspects = charIds.map((id, i) => ({ id, place: units[i].place, action: units[i].action }));
  const culprit = suspects[Math.floor(rng() * suspects.length)];
  if (clueMode === 'both') {
    const others = suspects.filter((s) => s.id !== culprit.id);
    if (others[0]) others[0].place = culprit.place;
    if (others[1]) others[1].action = culprit.action;
  }
  const clues = [];
  if (clueMode === 'place' || clueMode === 'both') clues.push({ type: 'place', value: culprit.place, en: `The footprints led back from the ${placeName(culprit.place, false)}.`, ar: `قادت آثار الأقدام من ${placeName(culprit.place, true)}.` });
  if (clueMode === 'action' || clueMode === 'both') { const n = NARR[culprit.action]; clues.push({ type: 'action', value: culprit.action, en: `At the scene, the detective found ${n.clue.en}.`, ar: `في مكان الحادث، وجد المحقّق ${n.clue.ar}.` }); }
  const innocent = pick(suspects.filter((s) => s.id !== culprit.id), rng);
  return { theme, suspects: shuffleR(suspects, rng), culpritId: culprit.id, innocentId: innocent.id, clues };
}

const levelCfg = (diff, level) => {
  const f = ((level || 1) - 1) / 99;
  if (diff === 'easy') return { K: 3, clueMode: f < 0.5 ? 'place' : 'action' };
  if (diff === 'hard') return { K: f < 0.4 ? 4 : 5, clueMode: 'both' };
  return { K: 4, clueMode: f < 0.5 ? 'action' : 'both' };
};
const survivalCfg = (stage) => ({ K: Math.min(5, 3 + Math.floor(stage / 3)), clueMode: stage < 2 ? 'place' : stage < 5 ? 'action' : 'both' });
const passCfgFor = () => ({ K: 4, clueMode: 'both' });

const DENIALS = { en: ['It wasn’t me!', 'I was busy!', 'Not me, detective!'], ar: ['لم أكن أنا!', 'كنت مشغولاً!', 'لست أنا أيها المحقّق!'] };
function suspectNarr(s, isAr) {
  const n = NARR[s.action];
  if (isAr) return `كان ${charName(s.id, true)} ${n.ar} في ${placeName(s.place, true)}، ${n.tell.ar}.`;
  return `${charName(s.id, false)} was ${n.en} at the ${placeName(s.place, false)}, ${n.tell.en}.`;
}
function setupNarr(c, isAr) {
  const s = isAr ? c.theme.setup.ar : c.theme.setup.en;
  const innocent = charName(c.innocentId, isAr);
  return isAr ? `🕵️ ${s} في البداية، اشتبه الجميع في ${innocent}!` : `🕵️ ${s} At first, everyone suspected ${innocent}!`;
}

function spotsFor(s, isCulprit, theme, isAr) {
  const herr = HERRINGS[hashId(s.id + s.place) % HERRINGS.length];
  const af = NARR[s.action].find;
  const spots = [
    { key: 'char', x: 0.5, y: 0.52, r: 0.22, e: '💬', en: `${charName(s.id, false)}: "${DENIALS.en[hashId(s.id) % DENIALS.en.length]}"`, ar: `${charName(s.id, true)}: «${DENIALS.ar[hashId(s.id) % DENIALS.ar.length]}»`, hop: true },
    { key: 'ground', x: 0.26, y: 0.84, r: 0.17, e: af.e, en: af.en, ar: af.ar },
    { key: 'herr', x: 0.79, y: 0.82, r: 0.15, e: herr.e, en: herr.en, ar: herr.ar },
  ];
  if (isCulprit) spots.push({ key: 'hidden', x: 0.5, y: 0.92, r: 0.13, e: theme.e, en: 'Aha! Evidence of the crime is hidden here!', ar: 'آها! دليل الجريمة مخبّأ هنا!' });
  return spots;
}

function buildExplanation(c, isAr) {
  const nm = (id) => charName(id, isAr);
  const lines = c.clues.map((cl) => {
    const who = c.suspects.filter((s) => (cl.type === 'place' ? s.place === cl.value : s.action === cl.value)).map((s) => nm(s.id)).join(isAr ? ' و ' : ', ');
    const what = cl.type === 'place'
      ? (isAr ? `كان من ${placeName(cl.value, true)}` : `was at the ${placeName(cl.value, false)}`)
      : (isAr ? `كان ${actWord(cl.value, true)}` : `was ${actWord(cl.value, false)}`);
    return isAr ? `الدليل (${what}) ← ${who}` : `Clue (${what}) → ${who}`;
  });
  const concl = c.clues.length > 1
    ? (isAr ? `الوحيد الذي يطابق الدليلين هو ${nm(c.culpritId)} — القضية مُغلقة! 🕵️` : `Only ${nm(c.culpritId)} matches BOTH clues — case closed! 🕵️`)
    : (isAr ? `الوحيد الذي يطابق الدليل هو ${nm(c.culpritId)} — القضية مُغلقة! 🕵️` : `Only ${nm(c.culpritId)} fits the clue — case closed! 🕵️`);
  return { lines, concl };
}

const T = {
  en: { title: 'Detective', investigate: '🔍 Tap the scene to investigate', accuseHint: 'So… who did it?', nothing: '🔍 Nothing here…', sceneOfCrime: 'The scene of the crime…', solved: 'Case solved! 🎉', wrong: (n) => `Wrong! It was ${n}.`, why: 'The deduction:', cont: 'Next case ›', overTitle: 'Out of guesses!', overSub: (n) => `${n} cases solved`, again: 'Play again', menu: 'Menu', summaryWin: 'Solved ✓', summaryLose: 'Not solved', notes: 'Detective’s clues' },
  ar: { title: 'المحقّق', investigate: '🔍 المس المشهد للتحقيق', accuseHint: 'إذاً… مَن الفاعل؟', nothing: '🔍 لا شيء هنا…', sceneOfCrime: 'مكان الحادث…', solved: 'حُلّت القضية! 🎉', wrong: (n) => `خطأ! كان ${n}.`, why: 'الاستنتاج:', cont: 'قضية تالية ›', overTitle: 'نفدت المحاولات!', overSub: (n) => `حُلّت ${n} قضايا`, again: 'العب مجدداً', menu: 'القائمة', summaryWin: 'حُلّت ✓', summaryLose: 'لم تُحَل', notes: 'أدلّة المحقّق' },
};

function DetectiveEngine({ mode, diff, level, seed, attempt, onResult, onExit, isAr, playSfx, awardPoints }) {
  const t = isAr ? T.ar : T.en;
  const rng = useMemo(() => (seed != null ? makeRng(seed) : Math.random), [seed]);
  const ppTrials = mode === 'passplay' ? (attempt?.trials ?? 3) : 0;

  const livesRef = useRef(LIVES);
  const solvedRef = useRef(0);
  const stageRef = useRef(0);
  const ppDoneRef = useRef(0);
  const ppSolvedRef = useRef(0);
  const poofTimer = useRef(null);

  const [c, setC] = useState(null);
  const [idx, setIdx] = useState(0); // 0 = setup beat; 1..K = suspect beats
  const [picked, setPicked] = useState(null);
  const [reveal, setReveal] = useState(false);
  const [lives, setLives] = useState(LIVES);
  const [over, setOver] = useState(null);
  const [revealed, setRevealed] = useState(() => new Set());
  const [finding, setFinding] = useState(null);
  const [hop, setHop] = useState(false);

  const cfgFor = useCallback(() => {
    if (mode === 'levels') return levelCfg(diff, level);
    if (mode === 'passplay') return passCfgFor();
    return survivalCfg(stageRef.current);
  }, [mode, diff, level]);

  const newCase = useCallback(() => {
    setC(makeCase(rng, cfgFor()));
    setIdx(0); setPicked(null); setReveal(false);
    setRevealed(new Set()); setFinding(null);
  }, [rng, cfgFor]);

  useEffect(() => {
    if (mode === 'free') { livesRef.current = LIVES; solvedRef.current = 0; stageRef.current = 0; setLives(LIVES); }
    ppDoneRef.current = 0; ppSolvedRef.current = 0; setOver(null);
    newCase();
    return () => clearTimeout(poofTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  useEffect(() => { setFinding(null); }, [idx]);

  const beats = c ? c.suspects.length + 1 : 0; // setup + suspects
  const isSetup = idx === 0;
  const sus = c && !isSetup ? c.suspects[idx - 1] : null;
  const isCulpritScene = sus && sus.id === c.culpritId;
  const spots = useMemo(() => (sus ? spotsFor(sus, isCulpritScene, c.theme, isAr) : []), [sus, isCulpritScene, c, isAr]);

  const onSceneTap = (e) => {
    if (isSetup) { setFinding({ e: c.theme.e, text: t.sceneOfCrime, n: (finding?.n || 0) + 1 }); playSfx?.('click'); return; }
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width; const y = (e.clientY - r.top) / r.height;
    const asp = r.height / r.width;
    let hit = null;
    for (const sp of spots) { if (Math.hypot(x - sp.x, (y - sp.y) * asp) < sp.r) { hit = sp; break; } }
    if (hit) {
      setRevealed((prev) => new Set(prev).add(`${idx}:${hit.key}`));
      setFinding({ e: hit.e, text: isAr ? hit.ar : hit.en, n: (finding?.n || 0) + 1 });
      playSfx?.(hit.key === 'herr' ? 'click' : 'collect');
      if (hit.hop) { setHop(true); clearTimeout(poofTimer.current); poofTimer.current = setTimeout(() => setHop(false), 520); }
    } else { setFinding({ e: '', text: t.nothing, n: (finding?.n || 0) + 1 }); playSfx?.('click'); }
  };

  const accuse = (id) => {
    if (reveal || !c) return;
    setPicked(id);
    setIdx(c.suspects.findIndex((s) => s.id === c.culpritId) + 1);
    setReveal(true);
    playSfx?.(id === c.culpritId ? 'win' : 'error');
  };

  const advance = () => {
    playSfx?.('click');
    const ok = picked === c.culpritId;
    if (mode === 'levels') { onResult({ won: ok, score: ok ? 1 : 0, summary: ok ? t.summaryWin : t.summaryLose }); return; }
    if (mode === 'passplay') {
      if (ok) ppSolvedRef.current += 1;
      ppDoneRef.current += 1;
      if (ppDoneRef.current >= ppTrials) { onResult({ score: ppSolvedRef.current }); return; }
      newCase(); return;
    }
    if (ok) { solvedRef.current += 1; stageRef.current += 1; awardPoints?.(3); newCase(); }
    else { livesRef.current -= 1; setLives(livesRef.current); if (livesRef.current <= 0) { playSfx?.('lose'); setOver({ solved: solvedRef.current }); } else newCase(); }
  };

  const boot = () => { livesRef.current = LIVES; solvedRef.current = 0; stageRef.current = 0; setLives(LIVES); setOver(null); newCase(); };

  const hud = mode === 'levels' ? (isAr ? `مستوى ${level}` : `Level ${level}`)
    : mode === 'passplay' ? (isAr ? `قضية ${Math.min(ppDoneRef.current + 1, ppTrials)}/${ppTrials}` : `Case ${Math.min(ppDoneRef.current + 1, ppTrials)}/${ppTrials}`)
      : (isAr ? `محلولة ${solvedRef.current}` : `Solved ${solvedRef.current}`);

  if (over && mode === 'free') {
    return (
      <div style={S.root} dir={isAr ? 'rtl' : 'ltr'}>
        <style>{DET_CSS}</style>
        <div style={S.overWrap}>
          <div style={{ fontSize: 46 }}>🕵️</div>
          <h2 style={S.overTitle}>{t.overTitle}</h2>
          <p style={S.overSub}>{t.overSub(over.solved)}</p>
          <div style={S.btnRow}>
            <button type="button" style={S.primary} onClick={() => { playSfx?.('click'); boot(); }}>{t.again}</button>
            <button type="button" style={S.ghost} onClick={() => { playSfx?.('click'); onExit?.(); }}>{t.menu}</button>
          </div>
        </div>
      </div>
    );
  }

  if (!c) return <div style={S.root} dir={isAr ? 'rtl' : 'ltr'} />;
  const size = bigSize();
  const exp = reveal ? buildExplanation(c, isAr) : null;
  const narration = isSetup ? setupNarr(c, isAr) : suspectNarr(sus, isAr);
  const panel = isSetup ? { bg: c.theme.place, chars: [], action: null } : { bg: sus.place, chars: [sus.id], action: sus.action };
  const say = isSetup ? null : `${charName(sus.id, isAr)} · ${placeName(sus.place, isAr)}`;

  return (
    <div style={S.root} dir={isAr ? 'rtl' : 'ltr'}>
      <style>{ANIM_CSS}{DET_CSS}</style>
      <header className="ct-training-play-header">
        <button className="ct-training-chrome-btn" aria-label={t.menu} onClick={() => { playSfx?.('click'); onExit?.(); }}>‹</button>
        <div className="ct-training-play-header-body">
          <div className="ct-training-play-title">{`${c.theme.e} ${t.title}`}</div>
          <div className="ct-training-play-sub">{hud}{mode === 'free' ? ` · ${'♥'.repeat(Math.max(0, lives))}` : ''}</div>
        </div>
        <div className="ct-training-chrome-spacer" aria-hidden="true" />
      </header>

      <div style={S.body}>
        {/* clues / detective notes */}
        <div style={S.clues}>
          <div style={S.cluesHead}>🔎 {t.notes}</div>
          {c.clues.map((cl, i) => (<div key={i} style={S.clue}><span>👁️</span><span>{isAr ? cl.ar : cl.en}</span></div>))}
        </div>

        {/* narrated, touchable scene */}
        <div style={{ position: 'relative', width: size, height: size * 0.82 }}>
          {!isSetup && <span style={S.sceneName}>{charName(sus.id, isAr)}</span>}
          <div style={{ width: '100%', height: '100%', animation: hop ? 'dt-hop 0.5s ease-out' : 'none' }}>
            <PanelStage panel={panel} size={size} say={say} />
          </div>
          <div onPointerDown={onSceneTap} style={{ position: 'absolute', inset: 0, cursor: 'pointer', touchAction: 'manipulation' }} />
          {spots.map((sp) => revealed.has(`${idx}:${sp.key}`) && (
            <span key={sp.key} style={{ position: 'absolute', left: `${sp.x * 100}%`, top: `${sp.y * 100}%`, transform: 'translate(-50%,-50%)', fontSize: 20, pointerEvents: 'none', animation: 'dt-find 0.3s ease-out' }}>{sp.e || '✓'}</span>
          ))}
        </div>

        {/* narration (the movie) */}
        <div style={S.narr}>{narration}</div>
        <div style={{ ...S.finding, visibility: finding ? 'visible' : 'hidden' }} key={finding?.n}>
          {finding?.e ? <span style={{ fontSize: 18 }}>{finding.e}</span> : null}
          <span>{finding?.text || ' '}</span>
        </div>

        <div style={S.dots}>
          {Array.from({ length: beats }).map((_, i) => (
            <button key={i} type="button" style={{ ...S.dot, ...(i === idx ? S.dotOn : null) }} onClick={() => { playSfx?.('click'); setIdx(i); }}>{i === 0 ? '🎬' : i}</button>
          ))}
        </div>

        {reveal ? (
          <div style={S.resultWrap}>
            <div style={{ ...S.resultMsg, color: picked === c.culpritId ? '#2e8b57' : '#d23b3b' }}>{picked === c.culpritId ? t.solved : t.wrong(charName(c.culpritId, isAr))}</div>
            <div style={S.explain}>
              <div style={S.explainHead}>{t.why}</div>
              {exp.lines.map((ln, i) => <div key={i} style={S.explainLine}>{ln}</div>)}
              <div style={S.explainConcl}>{exp.concl}</div>
            </div>
            <button type="button" style={S.primary} onClick={advance}>{t.cont}</button>
          </div>
        ) : (
          <>
            <div style={S.investigate}>{t.investigate}</div>
            <div style={S.accuseHint}>{t.accuseHint}</div>
            <div style={S.choices}>
              {c.suspects.map((s) => (
                <button key={s.id} type="button" style={S.choice} onClick={() => accuse(s.id)}>
                  <div style={S.choiceArt}><CharacterArt id={s.id} size={42} /></div>
                  <span style={S.choiceName}>{charName(s.id, isAr)}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function DetectiveGame({ onBack, workoutMode = false }) {
  const { currentLang, playSfx, awardPoints } = useApp();
  const isAr = currentLang === 'ar';
  return (
    <ModeShell
      storageKey="mm_reason_detective"
      scienceId="detective"
      title={{ en: 'Detective', ar: 'المحقّق' }}
      hints={{
        free: { en: 'Endless mysteries · 3 wrong guesses out', ar: 'ألغاز لا تنتهي · ٣ أخطاء وتخرج' },
        levels: { en: 'Mysteries get trickier each level', ar: 'الألغاز تزداد صعوبة كل مستوى' },
        pass: { en: 'Same mystery for all · most solved wins', ar: 'نفس اللغز للجميع · الأكثر حلّاً يفوز' },
      }}
      diffLabels={{ easy: { en: 'Easy', ar: 'سهل' }, med: { en: 'Medium', ar: 'متوسط' }, hard: { en: 'Hard', ar: 'صعب' } }}
      pass={{ trials: 3, scoreLabel: { en: 'solved', ar: 'محلولة' }, lowerBetter: false, diff: 'med' }}
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      workoutMode={workoutMode}
      renderEngine={(p) => (
        <DetectiveEngine key={`${p.mode}-${p.diff}-${p.level}-${p.seed}`} {...p} isAr={isAr} playSfx={playSfx} awardPoints={awardPoints} />
      )}
    />
  );
}

const S = {
  root: { position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', background: 'var(--color-training-palette-surface, #fff7f2)', color: '#2d2d2d', fontFamily: "'Outfit', system-ui, sans-serif" },
  body: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, padding: '8px 16px calc(16px + env(safe-area-inset-bottom))', maxWidth: 460, width: '100%', margin: '0 auto', overflowY: 'auto' },
  clues: { display: 'flex', flexDirection: 'column', gap: 5, width: '100%', background: '#fff3ee', border: '1.5px solid #ecc9bd', borderRadius: 12, padding: '8px 12px' },
  cluesHead: { fontSize: 11, fontWeight: 900, color: '#a35a48', textTransform: 'uppercase', letterSpacing: 0.6 },
  clue: { display: 'flex', gap: 8, alignItems: 'flex-start', fontWeight: 700, fontSize: 'clamp(13px, 3.6vw, 15px)', color: '#7a3b2f', lineHeight: 1.3 },
  sceneName: { position: 'absolute', top: -8, insetInlineStart: -6, zIndex: 2, background: '#b9842f', color: '#fff', fontWeight: 900, fontSize: 12, padding: '2px 10px', borderRadius: 999, border: '2px solid #fffdf8' },
  narr: { fontWeight: 700, fontSize: 'clamp(13.5px, 3.8vw, 15.5px)', color: '#3a2c18', textAlign: 'center', lineHeight: 1.4, maxWidth: 360, minHeight: 22 },
  finding: { display: 'flex', alignItems: 'center', gap: 8, minHeight: 24, fontWeight: 800, fontSize: 13.5, color: '#3a2c18', background: '#fff8ec', border: '1.5px solid #e3c489', borderRadius: 999, padding: '3px 13px', animation: 'dt-find 0.3s ease-out' },
  dots: { display: 'flex', gap: 7, flexWrap: 'wrap', justifyContent: 'center' },
  dot: { minWidth: 28, height: 28, padding: '0 6px', borderRadius: 14, border: '2px solid #d8cab4', background: '#fff', color: '#b3a288', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  dotOn: { background: '#b9842f', color: '#fff', borderColor: '#b9842f' },
  investigate: { fontWeight: 700, fontSize: 12.5, color: '#8a7f6f' },
  accuseHint: { fontWeight: 900, fontSize: 14, color: '#5a4a32' },
  choices: { display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  choice: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '6px 8px', borderRadius: 14, border: '2px solid #1a1208', background: '#fffdf8', cursor: 'pointer', boxShadow: '2px 2px 0 #1a1208', animation: 'dt-pop 0.3s ease-out' },
  choiceArt: { width: 44, height: 44, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'hidden' },
  choiceName: { fontSize: 11.5, fontWeight: 800, color: '#2d2210' },
  resultWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%', marginTop: 2 },
  resultMsg: { fontWeight: 900, fontSize: 17, textAlign: 'center' },
  explain: { width: '100%', background: '#fffdf8', border: '2px solid #e3d6c4', borderRadius: 14, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 5 },
  explainHead: { fontWeight: 900, fontSize: 12, color: '#7a6a52', textTransform: 'uppercase', letterSpacing: 0.6 },
  explainLine: { fontWeight: 600, fontSize: 13.5, color: '#3a3a3a', lineHeight: 1.35 },
  explainConcl: { fontWeight: 800, fontSize: 14, color: '#2e8b57', marginTop: 2 },
  primary: { padding: '12px 26px', borderRadius: 14, border: '2px solid #1a1208', background: '#2e8b57', color: '#fff', fontWeight: 900, fontSize: 15, cursor: 'pointer', boxShadow: '3px 3px 0 #1a1208' },
  ghost: { padding: '12px 20px', borderRadius: 14, border: '2px solid #cdbfa6', background: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', color: '#4a3c28' },
  overWrap: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24, textAlign: 'center' },
  overTitle: { margin: '4px 0 0', fontWeight: 900, fontSize: 24, color: '#2d2210' },
  overSub: { margin: 0, fontWeight: 700, color: '#5a4a32' },
  btnRow: { display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 14 },
};
