import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';
import { makeRng } from '../../../../shared/rng';
import { RIDDLES, TIER_LISTS } from './cases';

/*
 * Detective — authored deduction riddles (bilingual). Every case is a different
 * story with different logic: physical impossibilities, self-betraying details,
 * statement logic, timeline arithmetic, forensic reasoning.
 *
 * Per case: CASE FILE intro → the dossier (story, established facts, testimony
 * cards — tap any card to pencil-check it while you think) → answer the question
 * → step-by-step deduction chain, whether you were right or wrong.
 *
 * One hint per case highlights the item that cracks it (costs a point in
 * Survival). Levels: easy=tier 1, medium=tier 2, hard=tier 3, cases in a fixed
 * order per tier. Survival: tiers ramp up, 3 lives, a spoiled case never
 * repeats within the run. Pass n Play: same seeded cases for every player.
 */

const DET_CSS = `
@keyframes dt-pop {0%{transform:scale(0.7);opacity:0}55%{transform:scale(1.07);opacity:1}100%{transform:scale(1);opacity:1}}
@keyframes dt-stamp {0%{transform:rotate(-14deg) scale(2.4);opacity:0}60%{transform:rotate(-14deg) scale(0.94);opacity:1}100%{transform:rotate(-14deg) scale(1);opacity:1}}
@keyframes dt-shake {0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-5px)}40%,80%{transform:translateX(5px)}}
@keyframes dt-slide {0%{transform:translateY(14px);opacity:0}100%{transform:translateY(0);opacity:1}}
@keyframes dt-glow {0%,100%{box-shadow:0 0 0 2px rgba(192,57,43,0.25)}50%{box-shadow:0 0 0 4px rgba(192,57,43,0.55)}}
`;

const LIVES = 3;

const T = {
  en: {
    title: 'Detective', caseNo: (n) => `Case #${n}`,
    introStamp: 'CASE FILE', open: '🔍 Open the case',
    facts: '📌 Established facts', testimony: '🗣 Testimony', theQ: '❓ The question',
    tapNote: 'Tap a card to pencil-check it while you think',
    hint: '💡 Hint', hintCost: '💡 Hint (−1 point)', hinted: 'Focus on the glowing card…',
    yourAnswer: 'Your answer:', confirm: 'Confirm', back: 'Not sure yet',
    solved: 'Case cracked! 🎉', missed: 'Not quite…', theTruth: (a) => `The answer: ${a}`,
    chain: 'The deduction', caseClosed: 'CASE CLOSED',
    pts: (p) => `+${p} 🪙`, bFull: '+3 solved', bHint: '−1 hint used',
    next: 'Next case ›', cont: 'Continue',
    overTitle: 'Out of chances!', overSub: (n) => `${n} cases cracked`, again: 'Play again', menu: 'Menu',
    summaryWin: 'Cracked ✓', summaryLose: 'Not cracked',
  },
  ar: {
    title: 'المحقّق', caseNo: (n) => `القضية رقم ${n}`,
    introStamp: 'ملف القضية', open: '🔍 افتح القضية',
    facts: '📌 وقائع ثابتة', testimony: '🗣 الأقوال', theQ: '❓ السؤال',
    tapNote: 'المس أي بطاقة لتضع عليها علامة وأنت تفكّر',
    hint: '💡 تلميح', hintCost: '💡 تلميح (−١ نقطة)', hinted: 'ركّز على البطاقة المتوهّجة…',
    yourAnswer: 'جوابك:', confirm: 'تأكيد', back: 'لست متأكداً بعد',
    solved: 'حُلّت القضية! 🎉', missed: 'ليس تماماً…', theTruth: (a) => `الجواب: ${a}`,
    chain: 'الاستنتاج', caseClosed: 'القضية مُغلقة',
    pts: (p) => `+${p} 🪙`, bFull: '+٣ للحل', bHint: '−١ للتلميح',
    next: 'قضية تالية ›', cont: 'متابعة',
    overTitle: 'انتهت الفرص!', overSub: (n) => `حُلّت ${n} قضايا`, again: 'العب مجدداً', menu: 'القائمة',
    summaryWin: 'حُلّت ✓', summaryLose: 'لم تُحَل',
  },
};

const shuffleR = (arr, rng) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const tierForDiff = { easy: 0, med: 1, hard: 2 };

// Survival: shuffled tier 1, then tier 2, then tier 3; afterwards endless
// reshuffles of the full library (a long run may revisit, a case never repeats
// until everything has been seen).
function survivalSeq(rng) {
  const seq = [...shuffleR(TIER_LISTS[0], rng), ...shuffleR(TIER_LISTS[1], rng), ...shuffleR(TIER_LISTS[2], rng)];
  for (let i = 0; i < 6; i++) seq.push(...shuffleR(RIDDLES, rng));
  return seq;
}

function DetectiveEngine({ mode, diff, level, seed, attempt, onResult, onExit, isAr, playSfx, awardPoints }) {
  const t = isAr ? T.ar : T.en;
  const rng = useMemo(() => (seed != null ? makeRng(seed) : Math.random), [seed]);
  const ppTrials = mode === 'passplay' ? (attempt?.trials ?? 3) : 0;

  const livesRef = useRef(LIVES);
  const solvedRef = useRef(0);
  const stageRef = useRef(0);
  const ppDoneRef = useRef(0);
  const ppSolvedRef = useRef(0);
  const caseNoRef = useRef(0);
  const seqRef = useRef(null);

  const [c, setC] = useState(null);
  const [phase, setPhase] = useState('intro'); // intro | play | verdict
  const [checked, setChecked] = useState(() => new Set());
  const [hinted, setHinted] = useState(false);
  const [picked, setPicked] = useState(null);
  const [verdict, setVerdict] = useState(null);
  const [lives, setLives] = useState(LIVES);
  const [over, setOver] = useState(null);

  const caseFor = useCallback(() => {
    if (mode === 'levels') {
      const list = TIER_LISTS[tierForDiff[diff] ?? 1];
      return list[((level || 1) - 1) % list.length];
    }
    if (mode === 'passplay') {
      if (!seqRef.current) seqRef.current = shuffleR(TIER_LISTS[1], rng);
      return seqRef.current[ppDoneRef.current % seqRef.current.length];
    }
    if (!seqRef.current) seqRef.current = survivalSeq(rng);
    return seqRef.current[stageRef.current % seqRef.current.length];
  }, [mode, diff, level, rng]);

  const newCase = useCallback(() => {
    setC(caseFor());
    caseNoRef.current += 1;
    setPhase('intro'); setChecked(new Set()); setHinted(false); setPicked(null); setVerdict(null);
  }, [caseFor]);

  useEffect(() => {
    livesRef.current = LIVES; solvedRef.current = 0; stageRef.current = 0; setLives(LIVES);
    ppDoneRef.current = 0; ppSolvedRef.current = 0; caseNoRef.current = 0; seqRef.current = null;
    setOver(null);
    newCase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  const toggleCheck = (key) => { playSfx?.('click'); setChecked((p) => { const n = new Set(p); if (n.has(key)) n.delete(key); else n.add(key); return n; }); };

  const useHint = () => { if (hinted) return; playSfx?.('click'); setHinted(true); };

  const confirmAnswer = () => {
    const ok = picked === c.answer;
    const pts = ok && mode === 'free' ? Math.max(1, 3 - (hinted ? 1 : 0)) : 0;
    setVerdict({ ok, pts });
    setPhase('verdict');
    playSfx?.(ok ? 'win' : 'error');
  };

  const verdictNext = () => {
    playSfx?.('click');
    const { ok, pts } = verdict;
    if (mode === 'levels') { onResult({ won: ok, score: ok ? 1 : 0, summary: ok ? t.summaryWin : t.summaryLose }); return; }
    if (mode === 'passplay') {
      if (ok) ppSolvedRef.current += 1;
      ppDoneRef.current += 1;
      if (ppDoneRef.current >= ppTrials) { onResult({ score: ppSolvedRef.current }); return; }
      newCase(); return;
    }
    stageRef.current += 1; // solution was revealed either way — never replay this case
    if (ok) { solvedRef.current += 1; awardPoints?.(pts); newCase(); return; }
    livesRef.current -= 1; setLives(livesRef.current);
    if (livesRef.current <= 0) { playSfx?.('lose'); setOver({ solved: solvedRef.current }); return; }
    newCase();
  };

  const boot = () => { livesRef.current = LIVES; solvedRef.current = 0; stageRef.current = 0; setLives(LIVES); ppDoneRef.current = 0; ppSolvedRef.current = 0; caseNoRef.current = 0; seqRef.current = null; setOver(null); newCase(); };

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
  const L = (o) => (isAr ? o.ar : o.en);
  const hud = mode === 'levels' ? (isAr ? `مستوى ${level}` : `Level ${level}`)
    : mode === 'passplay' ? (isAr ? `قضية ${Math.min(ppDoneRef.current + 1, ppTrials)}/${ppTrials}` : `Case ${Math.min(ppDoneRef.current + 1, ppTrials)}/${ppTrials}`)
      : (isAr ? `محلولة ${solvedRef.current}` : `Cracked ${solvedRef.current}`);
  const answerOpt = c.options.find((o) => o.id === c.answer);
  const keyGlow = (where, i) => hinted && c.key.in === where && c.key.i === i;

  const card = (where, i, inner) => (
    <button
      key={`${where}${i}`} type="button"
      onClick={() => toggleCheck(`${where}${i}`)}
      style={{ ...S.card, ...(checked.has(`${where}${i}`) ? S.cardChecked : null), ...(keyGlow(where, i) ? S.cardGlow : null) }}
    >
      {inner}
      {checked.has(`${where}${i}`) && <span style={S.checkMark}>✔</span>}
    </button>
  );

  return (
    <div style={S.root} dir={isAr ? 'rtl' : 'ltr'}>
      <style>{DET_CSS}</style>
      <header className="ct-training-play-header">
        <button className="ct-training-chrome-btn" aria-label={t.menu} onClick={() => { playSfx?.('click'); onExit?.(); }}>‹</button>
        <div className="ct-training-play-header-body">
          <div className="ct-training-play-title">{`🕵️ ${t.title} · ${t.caseNo(caseNoRef.current)}`}</div>
          <div className="ct-training-play-sub">{hud}{mode === 'free' ? ` · ${'♥'.repeat(Math.max(0, lives))}` : ''}</div>
        </div>
        <div className="ct-training-chrome-spacer" aria-hidden="true" />
      </header>

      {/* ── CASE FILE intro ── */}
      {phase === 'intro' && (
        <div style={S.body}>
          <div style={S.fileCard}>
            <div style={S.stamp}>{t.introStamp} #{caseNoRef.current}</div>
            <div style={{ fontSize: 52, textAlign: 'center', marginTop: 6 }}>{c.e}</div>
            <h2 style={S.caseTitle}>{L(c.title)}</h2>
            <p style={S.setup}>{L(c.intro)}</p>
            <button type="button" style={{ ...S.primary, alignSelf: 'center', marginTop: 8 }} onClick={() => { playSfx?.('click'); setPhase('play'); }}>{t.open}</button>
          </div>
        </div>
      )}

      {/* ── the dossier ── */}
      {phase === 'play' && (
        <div style={S.body}>
          <div style={S.dossierHead}>
            <span style={{ fontSize: 22 }}>{c.e}</span>
            <span style={S.dossierTitle}>{L(c.title)}</span>
          </div>
          <p style={S.intro}>{L(c.intro)}</p>

          <div style={S.sectionHead}>{t.facts}</div>
          {c.facts.map((f, i) => card('facts', i, (
            <span style={S.cardRow}><span style={{ fontSize: 18, flexShrink: 0 }}>{f.e}</span><span style={S.factTxt}>{L(f)}</span></span>
          )))}

          {c.wits.length > 0 && <div style={S.sectionHead}>{t.testimony}</div>}
          {c.wits.map((w, i) => card('wits', i, (
            <span style={S.cardRow}>
              <span style={{ fontSize: 24, flexShrink: 0 }}>{w.e}</span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, textAlign: 'start' }}>
                <span style={S.witName}>{L(w.name)}</span>
                <span style={S.witTxt}>{L(w)}</span>
              </span>
            </span>
          )))}

          <div style={S.tapNote}>{t.tapNote}</div>

          <div style={S.qBox}>
            <div style={S.qHead}>{t.theQ}</div>
            <div style={S.qTxt}>{L(c.q)}</div>
          </div>

          <button type="button" style={{ ...S.hintBtn, opacity: hinted ? 0.55 : 1 }} onClick={useHint} disabled={hinted}>
            {hinted ? t.hinted : (mode === 'free' ? t.hintCost : t.hint)}
          </button>

          <div style={S.choices}>
            {c.options.map((o) => (
              <button key={o.id} type="button" style={{ ...S.choice, ...(picked === o.id ? S.choiceOn : null) }} onClick={() => { playSfx?.('click'); setPicked(o.id); }}>
                <span style={{ fontSize: 20 }}>{o.e}</span>
                <span style={S.choiceTxt}>{L(o)}</span>
              </button>
            ))}
          </div>

          {picked != null && (
            <div style={S.confirmRow}>
              <button type="button" style={S.primary} onClick={confirmAnswer}>⚖️ {t.confirm}</button>
              <button type="button" style={S.ghostSm} onClick={() => { playSfx?.('click'); setPicked(null); }}>{t.back}</button>
            </div>
          )}
        </div>
      )}

      {/* ── verdict ── */}
      {phase === 'verdict' && verdict && (
        <div style={S.body}>
          <div style={{ ...S.verdictCard, animation: verdict.ok ? 'dt-slide 0.3s ease-out' : 'dt-shake 0.4s ease-out' }}>
            <div style={{ ...S.verdictTitle, color: verdict.ok ? '#2e8b57' : '#d23b3b' }}>{verdict.ok ? t.solved : t.missed}</div>
            <div style={S.truth}><span style={{ fontSize: 22 }}>{answerOpt.e}</span><span>{t.theTruth(L(answerOpt))}</span></div>
            <div style={{ position: 'relative', width: '100%' }}>
              <div style={S.explain}>
                <div style={S.explainHead}>🔎 {t.chain}</div>
                {c.sol.map((s, i) => (
                  <div key={i} style={S.solStep}>
                    <span style={S.solNum}>{i + 1}</span>
                    <span style={S.solTxt}>{L(s)}</span>
                  </div>
                ))}
              </div>
              {verdict.ok && <div style={S.closedStamp}>{t.caseClosed}</div>}
            </div>
            {mode === 'free' && verdict.ok && (
              <div style={S.bonusRow}>
                <span style={S.ptsChip}>{t.pts(verdict.pts)}</span>
                <span style={S.bonusChip}>{t.bFull}</span>
                {hinted && <span style={S.bonusChip}>{t.bHint}</span>}
              </div>
            )}
            {mode === 'free' && !verdict.ok && <div style={S.livesLeft}>{'♥'.repeat(Math.max(0, livesRef.current - 1))}{'♡'.repeat(Math.min(LIVES, LIVES - livesRef.current + 1))}</div>}
            <button type="button" style={S.primary} onClick={verdictNext}>{mode === 'levels' ? t.cont : t.next}</button>
          </div>
        </div>
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
        free: { en: 'A different riddle every case · 3 misses out', ar: 'لغز مختلف في كل قضية · ٣ أخطاء وتخرج' },
        levels: { en: 'Real deduction riddles — every case a new story', ar: 'ألغاز استنتاج حقيقية — كل قضية حكاية جديدة' },
        pass: { en: 'Same cases for all · most cracked wins', ar: 'نفس القضايا للجميع · الأكثر حلّاً يفوز' },
      }}
      diffLabels={{ easy: { en: 'Easy', ar: 'سهل' }, med: { en: 'Medium', ar: 'متوسط' }, hard: { en: 'Hard', ar: 'صعب' } }}
      pass={{ trials: 3, scoreLabel: { en: 'cracked', ar: 'محلولة' }, lowerBetter: false, diff: 'med' }}
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
  body: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '8px 16px calc(16px + env(safe-area-inset-bottom))', maxWidth: 480, width: '100%', margin: '0 auto', overflowY: 'auto' },

  // case-file intro
  fileCard: { position: 'relative', width: '100%', background: '#fbf3e4', border: '2px solid #d9c294', borderRadius: 16, padding: '34px 16px 18px', display: 'flex', flexDirection: 'column', gap: 8, boxShadow: '4px 4px 0 rgba(26,18,8,0.18)', animation: 'dt-slide 0.35s ease-out', marginTop: 10 },
  stamp: { position: 'absolute', top: 10, insetInlineStart: 12, transform: 'rotate(-14deg)', border: '3px solid #c0392b', color: '#c0392b', fontFamily: "'Bangers','Cairo',cursive", fontSize: 16, letterSpacing: 1.5, padding: '2px 10px', borderRadius: 6, opacity: 0.9, animation: 'dt-stamp 0.5s ease-out' },
  caseTitle: { margin: 0, fontWeight: 900, fontSize: 'clamp(18px, 5vw, 22px)', color: '#2d2210', textAlign: 'center' },
  setup: { margin: 0, fontWeight: 700, fontSize: 'clamp(14px, 3.9vw, 15.5px)', color: '#3a2c18', lineHeight: 1.5, textAlign: 'center' },

  // dossier
  dossierHead: { display: 'flex', alignItems: 'center', gap: 8, width: '100%', marginTop: 2 },
  dossierTitle: { fontWeight: 900, fontSize: 16.5, color: '#2d2210' },
  intro: { margin: 0, width: '100%', fontWeight: 700, fontSize: 'clamp(13.5px, 3.7vw, 15px)', color: '#3a2c18', lineHeight: 1.5 },
  sectionHead: { width: '100%', fontSize: 11.5, fontWeight: 900, color: '#a35a48', textTransform: 'uppercase', letterSpacing: 0.7, marginTop: 4 },
  card: { position: 'relative', width: '100%', background: '#fffdf8', border: '1.5px solid #e3d6c4', borderRadius: 12, padding: '8px 12px', cursor: 'pointer', textAlign: 'start', font: 'inherit', color: 'inherit' },
  cardChecked: { background: '#f4f0e4', borderColor: '#b9a87c', opacity: 0.82 },
  cardGlow: { borderColor: '#c0392b', animation: 'dt-glow 1.2s ease-in-out infinite' },
  cardRow: { display: 'flex', gap: 10, alignItems: 'flex-start', minWidth: 0 },
  factTxt: { fontWeight: 800, fontSize: 13.5, color: '#5a4a32', lineHeight: 1.45 },
  witName: { fontWeight: 900, fontSize: 12, color: '#a37b2f' },
  witTxt: { fontWeight: 700, fontSize: 13.5, color: '#2d3a55', lineHeight: 1.45 },
  checkMark: { position: 'absolute', top: 4, insetInlineEnd: 8, fontSize: 13, color: '#7a8a2f', fontWeight: 900 },
  tapNote: { fontWeight: 700, fontSize: 11, color: '#a49a88' },
  qBox: { width: '100%', background: '#fff3ee', border: '1.5px solid #ecc9bd', borderRadius: 12, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 3 },
  qHead: { fontSize: 11, fontWeight: 900, color: '#a35a48', textTransform: 'uppercase', letterSpacing: 0.6 },
  qTxt: { fontWeight: 900, fontSize: 15, color: '#5a3a2f' },
  hintBtn: { padding: '7px 16px', borderRadius: 999, border: '2px solid #d8cab4', background: '#fff', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', color: '#6a5a42' },
  choices: { display: 'flex', flexDirection: 'column', gap: 7, width: '100%' },
  choice: { display: 'flex', gap: 10, alignItems: 'center', padding: '10px 13px', borderRadius: 13, border: '2px solid #d8cab4', background: '#fffdf8', cursor: 'pointer', textAlign: 'start', font: 'inherit', color: 'inherit', animation: 'dt-pop 0.3s ease-out' },
  choiceOn: { borderColor: '#c0392b', background: '#fdf0ee', boxShadow: '0 0 0 2px rgba(192,57,43,0.3)' },
  choiceTxt: { fontWeight: 800, fontSize: 14, color: '#2d2210', lineHeight: 1.35 },
  confirmRow: { display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' },

  // verdict
  verdictCard: { width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginTop: 8 },
  verdictTitle: { fontWeight: 900, fontSize: 20 },
  truth: { display: 'flex', gap: 8, alignItems: 'center', fontWeight: 900, fontSize: 15, color: '#2d2210' },
  explain: { width: '100%', background: '#fffdf8', border: '2px solid #e3d6c4', borderRadius: 14, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 },
  explainHead: { fontWeight: 900, fontSize: 12, color: '#7a6a52', textTransform: 'uppercase', letterSpacing: 0.6 },
  solStep: { display: 'flex', gap: 9, alignItems: 'flex-start' },
  solNum: { flexShrink: 0, width: 20, height: 20, borderRadius: 10, background: '#b9842f', color: '#fff', fontWeight: 900, fontSize: 11.5, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  solTxt: { fontWeight: 700, fontSize: 13.5, color: '#3a3a3a', lineHeight: 1.45 },
  closedStamp: { position: 'absolute', top: -8, insetInlineEnd: 6, transform: 'rotate(-14deg)', border: '3px solid #2e8b57', color: '#2e8b57', fontFamily: "'Bangers','Cairo',cursive", fontSize: 15, letterSpacing: 1.5, padding: '2px 10px', borderRadius: 6, background: 'rgba(255,253,248,0.9)', animation: 'dt-stamp 0.6s ease-out 0.2s both' },
  bonusRow: { display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' },
  ptsChip: { fontWeight: 900, fontSize: 15, color: '#7a5a1f', background: '#fdeecb', border: '2px solid #b9842f', borderRadius: 999, padding: '3px 12px' },
  bonusChip: { fontWeight: 800, fontSize: 11.5, color: '#5a4a32', background: '#f4ecdd', border: '1.5px solid #d8cab4', borderRadius: 999, padding: '2px 9px' },
  livesLeft: { fontWeight: 900, fontSize: 16, color: '#d23b3b', letterSpacing: 2 },

  primary: { padding: '12px 26px', borderRadius: 14, border: '2px solid #1a1208', background: '#2e8b57', color: '#fff', fontWeight: 900, fontSize: 15, cursor: 'pointer', boxShadow: '3px 3px 0 #1a1208' },
  ghost: { padding: '12px 20px', borderRadius: 14, border: '2px solid #cdbfa6', background: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', color: '#4a3c28' },
  ghostSm: { padding: '9px 14px', borderRadius: 12, border: '2px solid #cdbfa6', background: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer', color: '#4a3c28' },
  overWrap: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24, textAlign: 'center' },
  overTitle: { margin: '4px 0 0', fontWeight: 900, fontSize: 24, color: '#2d2210' },
  overSub: { margin: 0, fontWeight: 700, color: '#5a4a32' },
  btnRow: { display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 14 },
};
