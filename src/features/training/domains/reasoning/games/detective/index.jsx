import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';
import { makeRng } from '../../../../shared/rng';
import { FULL_BY_TIER, QUICK_BY_TIER } from './investigations';

/*
 * Detective Kawkab — free-form deduction investigations.
 *
 * The player IS the detective. Every mode runs the same loop:
 *   briefing → investigation board (tap hotspots to SEARCH the scene, tap
 *   people to INTERROGATE them — found clues unlock CONFRONTATION questions)
 *   → the player decides when to ACCUSE: pick the culprit + the clue(s) that
 *   prove it → verdict + deduction chain + epilogue.
 *
 *   LEVELS    → full cases (FULL_BY_TIER); easy/med/hard picks the tier.
 *   SURVIVAL  → compact cases (QUICK_BY_TIER), adaptive tier ramp, 3 lives —
 *               a wrong accusation costs a life.
 *   PASS-N-PLAY → same compact cases, seeded, 2 per player; culprits caught win.
 */

const DET_CSS = `
@keyframes dt-pop {0%{transform:scale(0.7);opacity:0}55%{transform:scale(1.07);opacity:1}100%{transform:scale(1);opacity:1}}
@keyframes dt-stamp {0%{transform:rotate(-8deg) scale(2.2);opacity:0}60%{transform:rotate(-8deg) scale(0.94);opacity:1}100%{transform:rotate(-8deg) scale(1);opacity:1}}
@keyframes dt-shake {0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-5px)}40%,80%{transform:translateX(5px)}}
@keyframes dt-slide {0%{transform:translateY(14px);opacity:0}100%{transform:translateY(0);opacity:1}}
@keyframes dt-bubble {0%{transform:translateY(8px) scale(0.96);opacity:0}100%{transform:translateY(0) scale(1);opacity:1}}
@keyframes dt-dot {0%,100%{box-shadow:0 0 0 0 rgba(210,59,59,0.6)}50%{box-shadow:0 0 0 6px rgba(210,59,59,0)}}
@keyframes dt-toast {0%{transform:translate(-50%,20px);opacity:0}12%,86%{transform:translate(-50%,0);opacity:1}100%{transform:translate(-50%,-8px);opacity:0}}
@keyframes dt-scan {0%,100%{transform:rotate(-14deg)}50%{transform:rotate(14deg)}}
@keyframes dt-typing {0%,100%{opacity:0.25}50%{opacity:1}}
@keyframes dt-spot {0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-50%) scale(1.08)}}
`;

const LIVES = 3;

const T = {
  en: {
    title: 'Detective Kawkab', caseNo: (n) => `Case #${n}`,
    introStamp: 'CASE FILE', start: '🔍 Start investigating',
    withAssistant: (n) => `with ${n}`, theSuspects: 'The suspects',
    boardHint: 'Search the scene · question the people · accuse when YOU are sure',
    searching: 'Searching…', nothingHere: 'Nothing useful here.', clueFound: 'CLUE FOUND',
    noted: (n) => `📓 Noted: ${n}`, ok: 'OK ›',
    notebook: '📓 Case notebook', evidence: '🔎 Evidence', testimony: '🗣 Testimony',
    emptyNote: 'Nothing yet. Search the scene and question people.',
    starHint: 'Tap a clue to star it while you think',
    witnessTag: 'witness', confrontTag: '⚡ CONFRONT',
    noMoreQ: 'No more questions — for now.', close: 'Close',
    accuse: '⚖️ Accuse', accuseTitle: 'The accusation',
    accuseWarn: 'One accusation only — make it count.',
    whoQ: 'Who did it?', proofQ: (n) => (n === 1 ? 'Which clue proves it?' : `Which ${n} clues prove it?`),
    confirmAccuse: '⚖️ Make the accusation', notYet: '‹ Keep investigating',
    fullWin: 'CASE CLOSED!', weakWin: 'Caught — but the proof was weak', lost: 'The culprit escaped!',
    culpritWas: (n) => `The culprit: ${n}`, itWas: (n) => `It was ${n}`,
    yourProof: 'Your proof', realProof: 'The proving clue(s)',
    chain: '🔎 The deduction', epilogueHead: '📖 Epilogue', caseClosed: 'CASE CLOSED',
    pts: (p) => `+${p} 🪙`, finish: 'Finish ›', next: 'Next case ›',
    cracked: (n) => `Cracked ${n}`,
    overTitle: 'Out of chances!', overSub: (n) => `${n} cases cracked`, again: 'Play again', menu: 'Menu',
    caughtSummary: (k, m) => `Culprit caught ✓ · proof ${k}/${m}`,
    missedSummary: 'The culprit escaped',
  },
  ar: {
    title: 'المحقّق كوكب', caseNo: (n) => `القضية رقم ${n}`,
    introStamp: 'ملف القضية', start: '🔍 ابدأ التحقيق',
    withAssistant: (n) => `مع ${n}`, theSuspects: 'المشتبه بهم',
    boardHint: 'فتّش المكان · استجوب الأشخاص · وجّه الاتهام حين تتأكد أنت',
    searching: 'جارٍ التفتيش…', nothingHere: 'لا شيء مفيد هنا.', clueFound: 'دليل جديد',
    noted: (n) => `📓 سُجّل: ${n}`, ok: 'حسناً ›',
    notebook: '📓 دفتر القضية', evidence: '🔎 الأدلة', testimony: '🗣 الأقوال',
    emptyNote: 'لا شيء بعد. فتّش المكان واستجوب الأشخاص.',
    starHint: 'المس أي دليل لتضع عليه نجمة وأنت تفكّر',
    witnessTag: 'شاهد', confrontTag: '⚡ واجِهه',
    noMoreQ: 'لا أسئلة أخرى — حالياً.', close: 'إغلاق',
    accuse: '⚖️ اتّهم', accuseTitle: 'الاتهام',
    accuseWarn: 'اتهام واحد فقط — اجعله صائباً.',
    whoQ: 'من الفاعل؟', proofQ: (n) => (n === 1 ? 'أي دليل يُثبت ذلك؟' : `أي ${n === 2 ? 'دليلين يثبتان' : 'أدلة تُثبت'} ذلك؟`),
    confirmAccuse: '⚖️ وجّه الاتهام', notYet: '‹ تابع التحقيق',
    fullWin: 'القضية مُغلقة!', weakWin: 'أُمسك الفاعل — لكن الإثبات ضعيف', lost: 'أفلت الفاعل!',
    culpritWas: (n) => `الفاعل: ${n}`, itWas: (n) => `كان الفاعل ${n}`,
    yourProof: 'إثباتك', realProof: 'الدليل الحاسم',
    chain: '🔎 الاستنتاج', epilogueHead: '📖 الخاتمة', caseClosed: 'القضية مُغلقة',
    pts: (p) => `+${p} 🪙`, finish: 'إنهاء ›', next: 'قضية تالية ›',
    cracked: (n) => `محلولة ${n}`,
    overTitle: 'انتهت الفرص!', overSub: (n) => `حُلّت ${n} قضايا`, again: 'العب مجدداً', menu: 'القائمة',
    caughtSummary: (k, m) => `أُمسك الفاعل ✓ · الإثبات ${k}/${m}`,
    missedSummary: 'أفلت الفاعل',
  },
};

const shuffleR = (arr, rng) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const tierForDiff = { easy: 0, med: 1, hard: 2 };

// Content fallbacks so partially-authored tiers never break a mode.
const FULL_POOLS = FULL_BY_TIER.map((l) => (l.length ? l : FULL_BY_TIER[0]));
const QUICK_POOLS = QUICK_BY_TIER.map((l, i) => (l.length ? l : FULL_POOLS[i]));

// ── survival: adaptive tier ramp with per-tier anti-repeat bags ──
function makePools(rng) {
  return [0, 1, 2].map((tierI) => ({ list: shuffleR(QUICK_POOLS[tierI], rng), idx: 0, lastId: null }));
}
// d → tier target rises 0→2 over ~8 solves, ±0.65 noise for variety; each tier
// deals its whole bag before reshuffling (never repeating the last case seen).
function pickAdaptive(d, pools, rng) {
  const target = Math.min(2, d * 0.25);
  let tierI = Math.round(target + (rng() - 0.5) * 1.3);
  tierI = Math.max(0, Math.min(2, tierI));
  const pool = pools[tierI];
  if (pool.idx >= pool.list.length) {
    pool.list = shuffleR(QUICK_POOLS[tierI], rng);
    if (pool.list.length > 1 && pool.list[0].id === pool.lastId) {
      const last = pool.list.length - 1;
      [pool.list[0], pool.list[last]] = [pool.list[last], pool.list[0]];
    }
    pool.idx = 0;
  }
  const c = pool.list[pool.idx++];
  pool.lastId = c.id;
  return c;
}

// ══════════════════════════════════════════════════════════════════════════
// INVESTIGATION ENGINE — all modes
// ══════════════════════════════════════════════════════════════════════════
function InvestigationEngine({ mode, diff, level, seed, attempt, onResult, onExit, isAr, playSfx, awardPoints }) {
  const t = isAr ? T.ar : T.en;
  const L = (o) => (o ? (isAr ? o.ar : o.en) : '');
  const rng = useMemo(() => (seed != null ? makeRng(seed) : Math.random), [seed]);
  const ppTrials = mode === 'passplay' ? (attempt?.trials ?? 2) : 0;

  // run-level refs (survive across cases in survival / pass-n-play)
  const livesRef = useRef(LIVES);
  const solvedRef = useRef(0);
  const caseNoRef = useRef(0);
  const ppDoneRef = useRef(0);
  const ppSolvedRef = useRef(0);
  const seqRef = useRef(null);
  const dRef = useRef(0);
  const poolsRef = useRef(null);
  const timersRef = useRef([]);
  const later = useCallback((fn, ms) => { timersRef.current.push(setTimeout(fn, ms)); }, []);
  useEffect(() => () => { timersRef.current.forEach(clearTimeout); }, []);

  const [c, setC] = useState(null);
  const [phase, setPhase] = useState('briefing'); // briefing | board | verdict | over
  const [overlay, setOverlay] = useState(null);   // {t:'search',h} | {t:'chat',sid} | {t:'note'} | {t:'accuse'}
  const [found, setFound] = useState([]);         // clue ids, in discovery order
  const [searched, setSearched] = useState(() => new Set());
  const [asked, setAsked] = useState(() => new Set());
  const [transcripts, setTranscripts] = useState({});
  const [pendingSid, setPendingSid] = useState(null);
  const [starred, setStarred] = useState(() => new Set());
  const [toast, setToast] = useState(null);
  const [searchStage, setSearchStage] = useState('scan');
  const [accuseSid, setAccuseSid] = useState(null);
  const [accuseEv, setAccuseEv] = useState([]);
  const [verdict, setVerdict] = useState(null);
  const [lives, setLives] = useState(LIVES);

  const caseFor = useCallback(() => {
    if (mode === 'levels') {
      const list = FULL_POOLS[tierForDiff[diff] ?? 1];
      return list[((level || 1) - 1) % list.length];
    }
    if (mode === 'passplay') {
      if (!seqRef.current) seqRef.current = shuffleR(QUICK_POOLS[1], rng);
      return seqRef.current[ppDoneRef.current % seqRef.current.length];
    }
    if (!poolsRef.current) poolsRef.current = makePools(rng);
    return pickAdaptive(dRef.current, poolsRef.current, rng);
  }, [mode, diff, level, rng]);

  const newCase = useCallback(() => {
    timersRef.current.forEach(clearTimeout); timersRef.current = [];
    setC(caseFor());
    caseNoRef.current += 1;
    foundRef.current = new Set();
    setPhase('briefing'); setOverlay(null); setFound([]); setSearched(new Set());
    setAsked(new Set()); setTranscripts({}); setPendingSid(null); setStarred(new Set());
    setToast(null); setAccuseSid(null); setAccuseEv([]); setVerdict(null);
  }, [caseFor]);

  useEffect(() => {
    livesRef.current = LIVES; setLives(LIVES); solvedRef.current = 0; caseNoRef.current = 0;
    ppDoneRef.current = 0; ppSolvedRef.current = 0; seqRef.current = null;
    dRef.current = 0; poolsRef.current = null;
    newCase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, level, diff]);

  // ── derived case tables ──
  const people = useMemo(() => (c ? [...c.suspects, ...(c.witnesses || [])] : []), [c]);
  const clueById = useMemo(() => { const m = {}; (c?.clues || []).forEach((cl) => { m[cl.id] = cl; }); return m; }, [c]);
  const testimonyIds = useMemo(() => {
    const s = new Set();
    people.forEach((p) => p.questions.forEach((q) => { if (q.givesClue) s.add(q.givesClue); }));
    return s;
  }, [people]);

  const foundSet = useMemo(() => new Set(found), [found]);
  const foundRef = useRef(new Set());

  const addClue = useCallback((id) => {
    if (foundRef.current.has(id)) return;
    foundRef.current.add(id);
    setFound((prev) => [...prev, id]);
    const cl = clueById[id];
    if (cl) setToast({ key: Date.now(), name: isAr ? cl.name.ar : cl.name.en });
  }, [clueById, isAr]);

  // ── interactions ──
  const openSearch = (h) => {
    playSfx?.('click');
    setSearchStage('scan');
    setOverlay({ t: 'search', h });
    later(() => {
      setSearchStage('done');
      setSearched((p) => new Set(p).add(h.id));
      if (h.clueId) { addClue(h.clueId); playSfx?.('win'); }
    }, 700);
  };

  const ask = (person, q) => {
    const key = `${person.id}:${q.id}`;
    if (asked.has(key) || pendingSid) return;
    playSfx?.('click');
    setAsked((p) => new Set(p).add(key));
    setTranscripts((p) => ({ ...p, [person.id]: [...(p[person.id] || []), { who: 'k', text: q.q }] }));
    setPendingSid(person.id);
    later(() => {
      setPendingSid(null);
      setTranscripts((p) => ({ ...p, [person.id]: [...(p[person.id] || []), { who: 's', text: q.a }] }));
      if (q.givesClue) { addClue(q.givesClue); playSfx?.('win'); }
      if (q.reaction) later(() => {
        setTranscripts((p) => ({ ...p, [person.id]: [...(p[person.id] || []), { who: 'n', text: q.reaction }] }));
      }, 500);
    }, 650);
  };

  const confrontReady = useCallback((person) =>
    person.questions.some((q) => q.needsClue && foundSet.has(q.needsClue) && !asked.has(`${person.id}:${q.id}`)),
  [foundSet, asked]);

  // ── the accusation ──
  const needEv = c ? c.solution.evidence.length : 1;
  const confirmAccuse = () => {
    const culpritOk = accuseSid === c.solution.culprit;
    const hits = accuseEv.filter((id) => c.solution.evidence.includes(id)).length;
    const full = culpritOk && hits === needEv;
    let pts = 0;
    if (culpritOk) pts = mode === 'levels' ? 6 + 2 * hits : 3 + hits;
    if (pts > 0 && mode !== 'passplay') awardPoints?.(pts);
    setVerdict({ culpritOk, hits, full, pts, picked: [...accuseEv] });
    setOverlay(null);
    setPhase('verdict');
    playSfx?.(culpritOk ? 'win' : 'error');
  };

  const afterVerdict = () => {
    playSfx?.('click');
    const { culpritOk, hits } = verdict;
    if (mode === 'levels') {
      onResult({ won: culpritOk, score: hits, summary: culpritOk ? t.caughtSummary(hits, needEv) : t.missedSummary });
      return;
    }
    if (mode === 'passplay') {
      if (culpritOk) ppSolvedRef.current += 1;
      ppDoneRef.current += 1;
      if (ppDoneRef.current >= ppTrials) { onResult({ score: ppSolvedRef.current }); return; }
      newCase(); return;
    }
    // survival
    if (culpritOk) { solvedRef.current += 1; dRef.current += 1; newCase(); return; }
    livesRef.current -= 1; setLives(livesRef.current);
    if (livesRef.current <= 0) { playSfx?.('lose'); setPhase('over'); return; }
    dRef.current = Math.max(0, dRef.current - 4);
    newCase();
  };

  const boot = () => {
    livesRef.current = LIVES; setLives(LIVES); solvedRef.current = 0; caseNoRef.current = 0;
    ppDoneRef.current = 0; ppSolvedRef.current = 0; seqRef.current = null; dRef.current = 0; poolsRef.current = null;
    newCase();
  };

  // ── chat autoscroll ──
  const chatRef = useRef(null);
  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [transcripts, pendingSid]);

  if (!c) return <div style={S.root} dir={isAr ? 'rtl' : 'ltr'} />;

  const hud = mode === 'passplay'
    ? (isAr ? `قضية ${Math.min(ppDoneRef.current + 1, ppTrials)}/${ppTrials}` : `Case ${Math.min(ppDoneRef.current + 1, ppTrials)}/${ppTrials}`)
    : mode === 'free'
      ? `${t.cracked(solvedRef.current)} · ${'★'.repeat(c.tier)}${'☆'.repeat(3 - c.tier)} · ${'♥'.repeat(Math.max(0, lives))}`
      : `${isAr ? `مستوى ${level}` : `Level ${level}`} · ${L(c.title)}`;

  const culpritOpt = c.suspects.find((s) => s.id === c.solution.culprit);
  const chatPerson = overlay?.t === 'chat' ? people.find((p) => p.id === overlay.sid) : null;

  // ═════ SURVIVAL GAME OVER ═════
  if (phase === 'over') {
    return (
      <div style={S.root} dir={isAr ? 'rtl' : 'ltr'}>
        <style>{DET_CSS}</style>
        <div style={S.overWrap}>
          <div style={{ fontSize: 46 }}>🕵️</div>
          <h2 style={S.overTitle}>{t.overTitle}</h2>
          <p style={S.overSub}>{t.overSub(solvedRef.current)}</p>
          <div style={S.btnRow}>
            <button type="button" style={S.primary} onClick={() => { playSfx?.('click'); boot(); }}>{t.again}</button>
            <button type="button" style={S.ghost} onClick={() => { playSfx?.('click'); onExit?.(); }}>{t.menu}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={S.root} dir={isAr ? 'rtl' : 'ltr'}>
      <style>{DET_CSS}</style>
      <header className="ct-training-play-header">
        <button className="ct-training-chrome-btn" aria-label={t.menu} onClick={() => { playSfx?.('click'); onExit?.(); }}>‹</button>
        <div className="ct-training-play-header-body">
          <div className="ct-training-play-title">{`🕵️ ${t.title}`}</div>
          <div className="ct-training-play-sub">{hud}</div>
        </div>
        <div className="ct-training-chrome-spacer" aria-hidden="true" />
      </header>

      {/* ═════ BRIEFING ═════ */}
      {phase === 'briefing' && (
        <div style={S.body}>
          <div style={S.fileCard}>
            <div style={S.stampRow}><span style={S.stamp}>{t.introStamp}{mode !== 'levels' ? ` #${caseNoRef.current}` : ''}</span><span style={{ fontSize: 40 }}>{c.e}</span></div>
            <h2 style={S.caseTitle}>{L(c.title)}</h2>
            <div style={S.chipRow}>
              <span style={S.metaChip}>📍 {L(c.setting)}</span>
              {c.assistant && <span style={S.metaChip}>{c.assistant.e} {t.withAssistant(L(c.assistant.name))}</span>}
            </div>
            <p style={S.setup}>{L(c.briefing)}</p>
            <div style={S.sectionHead}>{t.theSuspects}</div>
            <div style={S.suspectGrid}>
              {c.suspects.map((s) => (
                <div key={s.id} style={S.suspectCard}>
                  <span style={S.suspectEmoji}>{s.e}</span>
                  <span style={S.suspectName}>{L(s.name)}</span>
                  <span style={S.suspectDesc}>{L(s.role)}</span>
                </div>
              ))}
            </div>
            <button type="button" style={{ ...S.primary, alignSelf: 'center', marginTop: 8 }} onClick={() => { playSfx?.('click'); setPhase('board'); }}>{t.start}</button>
          </div>
        </div>
      )}

      {/* ═════ INVESTIGATION BOARD ═════ */}
      {phase === 'board' && (
        <div style={S.boardWrap}>
          <div style={S.scene(c.bg)} dir="ltr">
            <div style={S.sceneTitle} dir={isAr ? 'rtl' : 'ltr'}>{c.e} {L(c.setting)}</div>
            {c.hotspots.map((h) => {
              const done = searched.has(h.id);
              const gotClue = done && h.clueId;
              return (
                <button key={h.id} type="button" onClick={() => openSearch(h)}
                  style={{ ...S.hotspot, left: `${h.pos.x}%`, top: `${h.pos.y}%`, opacity: done ? 0.62 : 1, animation: done ? 'none' : 'dt-spot 2.6s ease-in-out infinite' }}>
                  <span style={S.hotspotEmoji}>{h.e}</span>
                  <span style={S.hotspotLabel} dir={isAr ? 'rtl' : 'ltr'}>{L(h.name)}</span>
                  {done && <span style={S.hotspotDone}>{gotClue ? '✔' : '·'}</span>}
                </button>
              );
            })}
          </div>

          <div style={S.boardHint}>{t.boardHint}</div>

          <div style={S.peopleRow}>
            {people.map((p) => {
              const isWitness = !c.suspects.includes(p) && !c.suspects.some((s) => s.id === p.id);
              const hot = confrontReady(p);
              return (
                <button key={p.id} type="button" style={S.personChip} onClick={() => { playSfx?.('click'); setOverlay({ t: 'chat', sid: p.id }); }}>
                  <span style={{ ...S.personAvatar, ...(hot ? S.personAvatarHot : null) }}>{p.e}{hot && <span style={S.confrontDot}>⚡</span>}</span>
                  <span style={S.personName}>{L(p.name)}</span>
                  {isWitness && <span style={S.witnessTag}>{t.witnessTag}</span>}
                </button>
              );
            })}
          </div>

          <div style={S.bottomBar}>
            <button type="button" style={S.noteBtn} onClick={() => { playSfx?.('click'); setOverlay({ t: 'note' }); }}>
              📓 {t.notebook.replace('📓 ', '')}{found.length > 0 && <span style={S.noteBadge}>{found.length}</span>}
            </button>
            <button type="button" disabled={found.length === 0} style={{ ...S.accuseBtn, opacity: found.length === 0 ? 0.5 : 1 }}
              onClick={() => { playSfx?.('click'); setAccuseSid(null); setAccuseEv([]); setOverlay({ t: 'accuse' }); }}>
              {t.accuse}
            </button>
          </div>
        </div>
      )}

      {/* ═════ VERDICT ═════ */}
      {phase === 'verdict' && verdict && (
        <div style={S.body}>
          <div style={{ ...S.verdictCard, animation: verdict.culpritOk ? 'dt-slide 0.3s ease-out' : 'dt-shake 0.4s ease-out' }}>
            {verdict.full && <div style={S.closedStamp}>{t.caseClosed}</div>}
            <div style={{ ...S.verdictTitle, color: verdict.culpritOk ? (verdict.full ? '#2e8b57' : '#b06a2a') : '#d23b3b' }}>
              {verdict.culpritOk ? (verdict.full ? t.fullWin : t.weakWin) : t.lost}
            </div>
            <div style={S.truth}>
              <span style={{ fontSize: 24 }}>{culpritOpt.e}</span>
              <span>{verdict.culpritOk ? t.culpritWas(L(culpritOpt.name)) : t.itWas(L(culpritOpt.name))}</span>
            </div>

            {verdict.picked.length > 0 && (
              <div style={S.proofRow}>
                <span style={S.proofHead}>{t.yourProof}:</span>
                {verdict.picked.map((id) => (
                  <span key={id} style={{ ...S.proofChip, borderColor: c.solution.evidence.includes(id) ? '#2e8b57' : '#d23b3b', color: c.solution.evidence.includes(id) ? '#2e8b57' : '#d23b3b' }}>
                    {c.solution.evidence.includes(id) ? '✔' : '✘'} {clueById[id]?.e} {L(clueById[id]?.name)}
                  </span>
                ))}
              </div>
            )}
            {!verdict.full && (
              <div style={S.proofRow}>
                <span style={S.proofHead}>{t.realProof}:</span>
                {c.solution.evidence.map((id) => (
                  <span key={id} style={{ ...S.proofChip, borderColor: '#b9842f', color: '#7a5a1f' }}>{clueById[id]?.e} {L(clueById[id]?.name)}</span>
                ))}
              </div>
            )}

            <div style={S.explain}>
              <div style={S.explainHead}>{t.chain}</div>
              {c.solution.explanation.map((s, i) => (
                <div key={i} style={S.solStep}>
                  <span style={S.solNum}>{i + 1}</span>
                  <span style={S.solTxt}>{L(s)}</span>
                </div>
              ))}
            </div>

            {verdict.culpritOk && (
              <div style={S.epilogueCard}>
                <div style={S.explainHead}>{t.epilogueHead}</div>
                <p style={S.epilogueText}>{L(c.solution.epilogue)}</p>
              </div>
            )}

            {verdict.pts > 0 && <span style={S.ptsChip}>{t.pts(verdict.pts)}</span>}
            {mode === 'free' && !verdict.culpritOk && (
              <div style={S.livesLeft}>{'♥'.repeat(Math.max(0, livesRef.current - 1))}{'♡'.repeat(Math.min(LIVES, LIVES - livesRef.current + 1))}</div>
            )}
            <button type="button" style={S.primary} onClick={afterVerdict}>{mode === 'levels' ? t.finish : t.next}</button>
          </div>
        </div>
      )}

      {/* ═════ SEARCH POPUP ═════ */}
      {overlay?.t === 'search' && (
        <div style={S.dim} onClick={() => searchStage === 'done' && setOverlay(null)}>
          <div style={S.popCard} onClick={(e) => e.stopPropagation()}>
            {searchStage === 'scan' ? (
              <>
                <div style={{ fontSize: 44, animation: 'dt-scan 0.5s ease-in-out infinite' }}>🔍</div>
                <div style={S.popTitle}>{L(overlay.h.name)}</div>
                <div style={S.popSub}>{t.searching}</div>
              </>
            ) : overlay.h.clueId ? (
              <>
                <div style={S.clueStamp}>{t.clueFound}</div>
                <div style={{ fontSize: 40 }}>{clueById[overlay.h.clueId]?.e}</div>
                <div style={S.popTitle}>{L(clueById[overlay.h.clueId]?.name)}</div>
                <p style={S.popText}>{L(clueById[overlay.h.clueId]?.text)}</p>
                <button type="button" style={S.primary} onClick={() => { playSfx?.('click'); setOverlay(null); }}>{t.ok}</button>
              </>
            ) : (
              <>
                <div style={{ fontSize: 40 }}>{overlay.h.e}</div>
                <div style={S.popTitle}>{L(overlay.h.name)}</div>
                <p style={S.popText}>{L(overlay.h.empty) || t.nothingHere}</p>
                <button type="button" style={S.ghostSm} onClick={() => { playSfx?.('click'); setOverlay(null); }}>{t.ok}</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ═════ INTERROGATION CHAT ═════ */}
      {chatPerson && (
        <div style={S.sheet}>
          <div style={S.sheetHead}>
            <button className="ct-training-chrome-btn" aria-label={t.close} onClick={() => { playSfx?.('click'); setOverlay(null); }}>‹</button>
            <span style={{ fontSize: 30 }}>{chatPerson.e}</span>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span style={S.chatName}>{L(chatPerson.name)}</span>
              <span style={S.chatRole}>{L(chatPerson.role)}</span>
            </div>
          </div>
          <div ref={chatRef} style={S.chatScroll}>
            {(transcripts[chatPerson.id] || []).map((b, i) => (
              b.who === 'n'
                ? <div key={i} style={S.bubbleNote}>{L(b.text)}</div>
                : (
                  <div key={i} style={{ ...S.bubbleRow, justifyContent: b.who === 'k' ? 'flex-end' : 'flex-start' }}>
                    {b.who !== 'k' && <span style={S.bubbleAvatar}>{chatPerson.e}</span>}
                    <div style={{ ...S.bubble, ...(b.who === 'k' ? S.bubbleK : S.bubbleS) }}>
                      {b.who === 'k' && <span style={S.bubbleWho}>🕵️ {t.title}</span>}
                      {L(b.text)}
                    </div>
                    {b.who === 'k' && <span style={S.bubbleAvatar}>🕵️</span>}
                  </div>
                )
            ))}
            {pendingSid === chatPerson.id && (
              <div style={{ ...S.bubbleRow, justifyContent: 'flex-start' }}>
                <span style={S.bubbleAvatar}>{chatPerson.e}</span>
                <div style={{ ...S.bubble, ...S.bubbleS, letterSpacing: 3, animation: 'dt-typing 0.9s ease-in-out infinite' }}>•••</div>
              </div>
            )}
          </div>
          <div style={S.qChips}>
            {(() => {
              const visible = chatPerson.questions.filter((q) => !q.needsClue || foundSet.has(q.needsClue));
              const remaining = visible.filter((q) => !asked.has(`${chatPerson.id}:${q.id}`));
              if (remaining.length === 0) return <div style={S.noMoreQ}>{t.noMoreQ}</div>;
              return remaining.map((q) => (
                <button key={q.id} type="button" disabled={!!pendingSid}
                  style={{ ...S.qChip, ...(q.needsClue ? S.qChipHot : null), opacity: pendingSid ? 0.55 : 1 }}
                  onClick={() => ask(chatPerson, q)}>
                  {q.needsClue && <span style={S.confrontTag}>{t.confrontTag}</span>}
                  {L(q.q)}
                </button>
              ));
            })()}
          </div>
        </div>
      )}

      {/* ═════ NOTEBOOK ═════ */}
      {overlay?.t === 'note' && (
        <div style={S.sheet}>
          <div style={S.sheetHead}>
            <button className="ct-training-chrome-btn" aria-label={t.close} onClick={() => { playSfx?.('click'); setOverlay(null); }}>‹</button>
            <span style={S.chatName}>{t.notebook}</span>
          </div>
          <div style={S.noteScroll}>
            {found.length === 0 && <div style={S.emptyNote}>{t.emptyNote}</div>}
            {['ev', 'wit'].map((kind) => {
              const ids = found.filter((id) => (kind === 'wit') === testimonyIds.has(id));
              if (ids.length === 0) return null;
              return (
                <div key={kind} style={{ display: 'flex', flexDirection: 'column', gap: 7, width: '100%' }}>
                  <div style={S.sectionHead}>{kind === 'ev' ? t.evidence : t.testimony}</div>
                  {ids.map((id) => {
                    const cl = clueById[id];
                    return (
                      <button key={id} type="button" onClick={() => { playSfx?.('click'); setStarred((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; }); }}
                        style={{ ...S.card, ...(starred.has(id) ? S.cardStar : null) }}>
                        <span style={S.cardRow}>
                          <span style={{ fontSize: 20, flexShrink: 0 }}>{cl.e}</span>
                          <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, textAlign: 'start' }}>
                            <span style={S.clueName}>{L(cl.name)}</span>
                            <span style={S.clueTxt}>{L(cl.text)}</span>
                          </span>
                        </span>
                        {starred.has(id) && <span style={S.starMark}>⭐</span>}
                      </button>
                    );
                  })}
                </div>
              );
            })}
            {found.length > 0 && <div style={S.tapNote}>{t.starHint}</div>}
          </div>
        </div>
      )}

      {/* ═════ ACCUSATION ═════ */}
      {overlay?.t === 'accuse' && (
        <div style={S.sheet}>
          <div style={S.sheetHead}>
            <button className="ct-training-chrome-btn" aria-label={t.close} onClick={() => { playSfx?.('click'); setOverlay(null); }}>‹</button>
            <span style={S.chatName}>{t.accuseTitle}</span>
          </div>
          <div style={S.noteScroll}>
            <div style={S.accuseWarn}>⚠️ {t.accuseWarn}</div>
            <div style={S.sectionHead}>{t.whoQ}</div>
            <div style={S.accuseGrid}>
              {c.suspects.map((s) => (
                <button key={s.id} type="button" style={{ ...S.accuseCard, ...(accuseSid === s.id ? S.accuseCardOn : null) }}
                  onClick={() => { playSfx?.('click'); setAccuseSid(s.id); }}>
                  <span style={{ fontSize: 30 }}>{s.e}</span>
                  <span style={S.suspectName}>{L(s.name)}</span>
                </button>
              ))}
            </div>
            {accuseSid && (
              <>
                <div style={S.sectionHead}>{t.proofQ(needEv)}</div>
                {found.map((id) => {
                  const cl = clueById[id];
                  const on = accuseEv.includes(id);
                  return (
                    <button key={id} type="button"
                      style={{ ...S.card, ...(on ? S.cardEvOn : null) }}
                      onClick={() => {
                        playSfx?.('click');
                        setAccuseEv((prev) => on ? prev.filter((x) => x !== id)
                          : (prev.length >= needEv ? [...prev.slice(1), id] : [...prev, id]));
                      }}>
                      <span style={S.cardRow}>
                        <span style={{ fontSize: 18, flexShrink: 0 }}>{cl.e}</span>
                        <span style={S.clueName}>{L(cl.name)}</span>
                      </span>
                      {on && <span style={S.checkMark}>✔</span>}
                    </button>
                  );
                })}
                <div style={S.confirmRow}>
                  <button type="button" disabled={accuseEv.length !== needEv}
                    style={{ ...S.primary, opacity: accuseEv.length !== needEv ? 0.5 : 1 }} onClick={confirmAccuse}>
                    {t.confirmAccuse}
                  </button>
                  <button type="button" style={S.ghostSm} onClick={() => { playSfx?.('click'); setOverlay(null); }}>{t.notYet}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ═════ CLUE TOAST ═════ */}
      {toast && phase === 'board' && (
        <div key={toast.key} style={S.toast} onAnimationEnd={() => setToast(null)}>{t.noted(toast.name)}</div>
      )}
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
        free: { en: 'Quick cases · one accusation each · 3 misses out', ar: 'قضايا سريعة · اتهام واحد لكل قضية · ٣ أخطاء وتخرج' },
        levels: { en: 'Search the scene, interrogate suspects, prove it', ar: 'فتّش المكان، استجوب المشتبه بهم، وأثبت التهمة' },
        pass: { en: 'Same cases for all · most culprits caught wins', ar: 'نفس القضايا للجميع · من يمسك فاعلين أكثر يفوز' },
      }}
      diffLabels={{ easy: { en: 'Easy', ar: 'سهل' }, med: { en: 'Medium', ar: 'متوسط' }, hard: { en: 'Hard', ar: 'صعب' } }}
      pass={{ trials: 2, scoreLabel: { en: 'culprits caught', ar: 'فاعلون أُمسكوا' }, lowerBetter: false, diff: 'med' }}
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      workoutMode={workoutMode}
      renderEngine={(p) => <InvestigationEngine key={`inv-${p.mode}-${p.diff}-${p.level}-${p.seed}`} {...p} isAr={isAr} playSfx={playSfx} awardPoints={awardPoints} />}
    />
  );
}

// ══════════════════════════════════════════════════════════════════════════
const S = {
  root: { position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', background: 'var(--color-training-palette-surface, #fff7f2)', color: '#2d2d2d', fontFamily: "'Outfit', system-ui, sans-serif" },
  body: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '8px 16px calc(16px + env(safe-area-inset-bottom))', maxWidth: 480, width: '100%', margin: '0 auto', overflowY: 'auto' },

  // briefing
  fileCard: { position: 'relative', width: '100%', background: '#fbf3e4', border: '2px solid #d9c294', borderRadius: 16, padding: '12px 16px 18px', display: 'flex', flexDirection: 'column', gap: 8, boxShadow: '4px 4px 0 rgba(26,18,8,0.18)', animation: 'dt-slide 0.35s ease-out', marginTop: 10 },
  stampRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, minHeight: 44 },
  stamp: { display: 'inline-block', transform: 'rotate(-8deg)', border: '3px solid #c0392b', color: '#c0392b', fontFamily: "'Bangers','Cairo',cursive", fontSize: 16, letterSpacing: 1.5, padding: '2px 10px', borderRadius: 6, opacity: 0.9, animation: 'dt-stamp 0.5s ease-out' },
  caseTitle: { margin: 0, fontWeight: 900, fontSize: 'clamp(18px, 5vw, 22px)', color: '#2d2210', textAlign: 'center' },
  chipRow: { display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' },
  metaChip: { fontWeight: 800, fontSize: 12.5, color: '#7a5a1e', background: '#fff1d8', border: '1.5px solid #e3c489', borderRadius: 999, padding: '3px 12px' },
  setup: { margin: 0, fontWeight: 700, fontSize: 'clamp(14px, 3.9vw, 15.5px)', color: '#3a2c18', lineHeight: 1.5 },
  sectionHead: { width: '100%', fontSize: 11.5, fontWeight: 900, color: '#a35a48', textTransform: 'uppercase', letterSpacing: 0.7, marginTop: 4 },
  suspectGrid: { display: 'flex', flexDirection: 'column', gap: 7, width: '100%' },
  suspectCard: { display: 'flex', flexDirection: 'column', gap: 1, background: '#fffdf8', border: '1.5px solid #e3d6c4', borderRadius: 12, padding: '8px 12px' },
  suspectEmoji: { fontSize: 22 },
  suspectName: { fontWeight: 900, fontSize: 13.5, color: '#2d2210' },
  suspectDesc: { fontWeight: 700, fontSize: 12.5, color: '#6a5a42', lineHeight: 1.4 },

  // board
  boardWrap: { flex: 1, display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 14px calc(12px + env(safe-area-inset-bottom))', maxWidth: 520, width: '100%', margin: '0 auto', minHeight: 0 },
  scene: (bg) => ({ position: 'relative', width: '100%', flex: '0 0 auto', height: 'clamp(210px, 40vh, 340px)', borderRadius: 16, border: '3px solid #1a1208', boxShadow: '4px 4px 0 rgba(26,18,8,0.22)', background: `radial-gradient(circle at 30% 20%, ${bg?.[0] || '#fdf3e0'}, ${bg?.[1] || '#f1dcbc'})`, overflow: 'hidden' }),
  sceneTitle: { position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', fontWeight: 900, fontSize: 12.5, color: '#3a2c18', background: 'rgba(255,253,248,0.85)', border: '1.5px solid #d9c294', borderRadius: 999, padding: '3px 12px', whiteSpace: 'nowrap', zIndex: 2 },
  hotspot: { position: 'absolute', transform: 'translate(-50%,-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer', padding: 4, font: 'inherit' },
  hotspotEmoji: { fontSize: 30, filter: 'drop-shadow(1px 2px 1px rgba(26,18,8,0.25))' },
  hotspotLabel: { fontWeight: 800, fontSize: 10, color: '#3a2c18', background: 'rgba(255,253,248,0.9)', border: '1px solid #d9c294', borderRadius: 999, padding: '1px 7px', whiteSpace: 'nowrap' },
  hotspotDone: { position: 'absolute', top: -2, right: -2, fontSize: 12, fontWeight: 900, color: '#2e8b57', background: '#fffdf8', border: '1.5px solid #2e8b57', borderRadius: 999, width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  boardHint: { fontWeight: 700, fontSize: 11, color: '#a49a88', textAlign: 'center' },
  peopleRow: { display: 'flex', gap: 8, overflowX: 'auto', padding: '4px 2px', flex: '0 0 auto' },
  personChip: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: 2, font: 'inherit', flexShrink: 0, minWidth: 72 },
  personAvatar: { position: 'relative', width: 52, height: 52, borderRadius: 999, background: '#fffdf8', border: '2.5px solid #d8cab4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 27 },
  personAvatarHot: { borderColor: '#d23b3b', animation: 'dt-dot 1.2s ease-in-out infinite' },
  confrontDot: { position: 'absolute', top: -5, right: -5, fontSize: 13, background: '#fffdf8', border: '1.5px solid #d23b3b', borderRadius: 999, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  personName: { fontWeight: 800, fontSize: 11, color: '#2d2210', maxWidth: 84, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  witnessTag: { fontWeight: 900, fontSize: 8.5, color: '#7a6a52', background: '#f4ecdd', border: '1px solid #d8cab4', borderRadius: 5, padding: '0 5px', textTransform: 'uppercase', letterSpacing: 0.5 },
  bottomBar: { display: 'flex', gap: 10, marginTop: 'auto', paddingTop: 4 },
  noteBtn: { position: 'relative', flex: 1, padding: '12px 14px', borderRadius: 14, border: '2px solid #cdbfa6', background: '#fffdf8', fontWeight: 900, fontSize: 14, cursor: 'pointer', color: '#4a3c28' },
  noteBadge: { position: 'absolute', top: -7, insetInlineEnd: -4, minWidth: 22, height: 22, borderRadius: 999, background: '#b9842f', color: '#fff', fontWeight: 900, fontSize: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px', border: '2px solid #fffdf8' },
  accuseBtn: { flex: 1, padding: '12px 14px', borderRadius: 14, border: '2px solid #1a1208', background: '#c0392b', color: '#fff', fontWeight: 900, fontSize: 15, cursor: 'pointer', boxShadow: '3px 3px 0 #1a1208' },

  // search popup
  dim: { position: 'absolute', inset: 0, background: 'rgba(26,18,8,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 22, zIndex: 9 },
  popCard: { width: '100%', maxWidth: 360, background: '#fffdf8', border: '2.5px solid #1a1208', borderRadius: 18, boxShadow: '5px 5px 0 rgba(26,18,8,0.3)', padding: '18px 18px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center', animation: 'dt-pop 0.25s ease-out' },
  popTitle: { fontWeight: 900, fontSize: 16, color: '#2d2210' },
  popSub: { fontWeight: 700, fontSize: 13, color: '#8a7a62' },
  popText: { margin: 0, fontWeight: 700, fontSize: 14, color: '#3a2c18', lineHeight: 1.5 },
  clueStamp: { display: 'inline-block', transform: 'rotate(-6deg)', border: '2.5px solid #2e8b57', color: '#2e8b57', fontFamily: "'Bangers','Cairo',cursive", fontSize: 14, letterSpacing: 1.5, padding: '1px 9px', borderRadius: 6, animation: 'dt-stamp 0.45s ease-out' },

  // sheets (chat / notebook / accuse)
  sheet: { position: 'absolute', inset: 0, top: 0, background: 'var(--color-training-palette-surface, #fff7f2)', display: 'flex', flexDirection: 'column', zIndex: 8, animation: 'dt-slide 0.22s ease-out' },
  sheetHead: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '2px solid #ecdfc8', flexShrink: 0 },
  chatName: { fontWeight: 900, fontSize: 15.5, color: '#2d2210' },
  chatRole: { fontWeight: 700, fontSize: 11.5, color: '#8a7a62', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  chatScroll: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 9, padding: '14px 14px 8px', maxWidth: 520, width: '100%', margin: '0 auto' },
  bubbleRow: { display: 'flex', gap: 7, alignItems: 'flex-end', width: '100%' },
  bubbleAvatar: { fontSize: 20, flexShrink: 0, marginBottom: 2 },
  bubble: { maxWidth: '78%', padding: '8px 12px', borderRadius: 15, fontWeight: 700, fontSize: 14, lineHeight: 1.45, animation: 'dt-bubble 0.22s ease-out', display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'start' },
  bubbleK: { background: '#e4f2e9', border: '1.5px solid #9ecfb2', color: '#1e3a2b', borderEndEndRadius: 4 },
  bubbleS: { background: '#fffdf8', border: '1.5px solid #e3d6c4', color: '#3a2c18', borderEndStartRadius: 4 },
  bubbleWho: { fontWeight: 900, fontSize: 10, color: '#2e8b57', textTransform: 'uppercase', letterSpacing: 0.5 },
  bubbleNote: { alignSelf: 'center', fontWeight: 700, fontStyle: 'italic', fontSize: 12.5, color: '#7a6a52', background: '#fff8ec', border: '1.5px dashed #e3c489', borderRadius: 12, padding: '6px 12px', maxWidth: '88%', textAlign: 'center', animation: 'dt-bubble 0.22s ease-out' },
  qChips: { display: 'flex', flexDirection: 'column', gap: 7, padding: '10px 14px calc(14px + env(safe-area-inset-bottom))', borderTop: '2px solid #ecdfc8', flexShrink: 0, maxWidth: 520, width: '100%', margin: '0 auto' },
  qChip: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, padding: '9px 13px', borderRadius: 13, border: '2px solid #d8cab4', background: '#fffdf8', cursor: 'pointer', textAlign: 'start', font: 'inherit', fontWeight: 800, fontSize: 13.5, color: '#2d2210', animation: 'dt-pop 0.25s ease-out' },
  qChipHot: { borderColor: '#d23b3b', background: '#fdf0ee', boxShadow: '0 0 0 2px rgba(210,59,59,0.18)' },
  confrontTag: { fontWeight: 900, fontSize: 9.5, color: '#d23b3b', letterSpacing: 0.6 },
  noMoreQ: { fontWeight: 700, fontSize: 12.5, color: '#a49a88', textAlign: 'center', padding: 4 },

  // notebook / accuse
  noteScroll: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 16px calc(16px + env(safe-area-inset-bottom))', maxWidth: 480, width: '100%', margin: '0 auto' },
  emptyNote: { fontWeight: 700, fontSize: 13.5, color: '#a49a88', textAlign: 'center', marginTop: 30 },
  card: { position: 'relative', width: '100%', background: '#fffdf8', border: '1.5px solid #e3d6c4', borderRadius: 12, padding: '8px 12px', cursor: 'pointer', textAlign: 'start', font: 'inherit', color: 'inherit' },
  cardStar: { borderColor: '#b9842f', background: '#fff8ec' },
  cardEvOn: { borderColor: '#c0392b', background: '#fdf0ee', boxShadow: '0 0 0 2px rgba(192,57,43,0.3)' },
  cardRow: { display: 'flex', gap: 10, alignItems: 'flex-start', minWidth: 0 },
  clueName: { fontWeight: 900, fontSize: 13, color: '#2d2210' },
  clueTxt: { fontWeight: 700, fontSize: 12.5, color: '#5a4a32', lineHeight: 1.45 },
  starMark: { position: 'absolute', top: 4, insetInlineEnd: 8, fontSize: 13 },
  checkMark: { position: 'absolute', top: 6, insetInlineEnd: 9, fontSize: 13, color: '#c0392b', fontWeight: 900 },
  tapNote: { fontWeight: 700, fontSize: 11, color: '#a49a88', textAlign: 'center' },
  accuseWarn: { fontWeight: 800, fontSize: 12.5, color: '#a35a48', background: '#fff3ee', border: '1.5px solid #ecc9bd', borderRadius: 12, padding: '8px 12px', textAlign: 'center' },
  accuseGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 8, width: '100%' },
  accuseCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '10px 6px', borderRadius: 13, border: '2px solid #d8cab4', background: '#fffdf8', cursor: 'pointer', font: 'inherit', textAlign: 'center' },
  accuseCardOn: { borderColor: '#c0392b', background: '#fdf0ee', boxShadow: '0 0 0 2px rgba(192,57,43,0.3)' },
  confirmRow: { display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', marginTop: 6 },

  // verdict
  verdictCard: { position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginTop: 8, paddingBottom: 8 },
  closedStamp: { alignSelf: 'center', transform: 'rotate(-8deg)', border: '3px solid #2e8b57', color: '#2e8b57', fontFamily: "'Bangers','Cairo',cursive", fontSize: 17, letterSpacing: 1.5, padding: '2px 12px', borderRadius: 6, background: 'rgba(255,253,248,0.9)', animation: 'dt-stamp 0.6s ease-out 0.15s both', marginTop: 4 },
  verdictTitle: { fontWeight: 900, fontSize: 20, textAlign: 'center' },
  truth: { display: 'flex', gap: 8, alignItems: 'center', fontWeight: 900, fontSize: 15, color: '#2d2210', textAlign: 'center' },
  proofRow: { display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' },
  proofHead: { fontWeight: 900, fontSize: 11.5, color: '#7a6a52', textTransform: 'uppercase', letterSpacing: 0.5 },
  proofChip: { fontWeight: 800, fontSize: 12, border: '1.5px solid', borderRadius: 999, padding: '2px 10px', background: '#fffdf8' },
  explain: { width: '100%', background: '#fffdf8', border: '2px solid #e3d6c4', borderRadius: 14, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 },
  explainHead: { fontWeight: 900, fontSize: 12, color: '#7a6a52', textTransform: 'uppercase', letterSpacing: 0.6 },
  solStep: { display: 'flex', gap: 9, alignItems: 'flex-start' },
  solNum: { flexShrink: 0, width: 20, height: 20, borderRadius: 10, background: '#b9842f', color: '#fff', fontWeight: 900, fontSize: 11.5, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  solTxt: { fontWeight: 700, fontSize: 13.5, color: '#3a3a3a', lineHeight: 1.45 },
  epilogueCard: { width: '100%', background: '#fbf3e4', border: '2px solid #d9c294', borderRadius: 14, padding: '12px 15px', display: 'flex', flexDirection: 'column', gap: 6 },
  epilogueText: { margin: 0, fontWeight: 700, fontSize: 'clamp(13.5px, 3.7vw, 15px)', color: '#3a2c18', lineHeight: 1.55 },
  ptsChip: { fontWeight: 900, fontSize: 15, color: '#7a5a1f', background: '#fdeecb', border: '2px solid #b9842f', borderRadius: 999, padding: '3px 12px' },
  livesLeft: { fontWeight: 900, fontSize: 16, color: '#d23b3b', letterSpacing: 2 },

  // toast
  toast: { position: 'absolute', bottom: 'calc(84px + env(safe-area-inset-bottom))', left: '50%', transform: 'translateX(-50%)', background: '#2d2210', color: '#fff8ec', fontWeight: 800, fontSize: 13, borderRadius: 999, padding: '8px 16px', whiteSpace: 'nowrap', zIndex: 10, animation: 'dt-toast 1.9s ease-in-out both', maxWidth: '92%', overflow: 'hidden', textOverflow: 'ellipsis' },

  primary: { padding: '12px 26px', borderRadius: 14, border: '2px solid #1a1208', background: '#2e8b57', color: '#fff', fontWeight: 900, fontSize: 15, cursor: 'pointer', boxShadow: '3px 3px 0 #1a1208' },
  ghost: { padding: '12px 20px', borderRadius: 14, border: '2px solid #cdbfa6', background: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', color: '#4a3c28' },
  ghostSm: { padding: '9px 14px', borderRadius: 12, border: '2px solid #cdbfa6', background: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer', color: '#4a3c28' },
  overWrap: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24, textAlign: 'center' },
  overTitle: { margin: '4px 0 0', fontWeight: 900, fontSize: 24, color: '#2d2210' },
  overSub: { margin: 0, fontWeight: 700, color: '#5a4a32' },
  btnRow: { display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 14 },
};
