import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import { TrainingMenuBar, TrainingPlayHeader, TrainingChallengeHandoff } from '../../../../shared/TrainingChrome';
import { TrainingDifficultySelect, TrainingLevelGrid } from '../../../../shared/TrainingScreens';
import { createTrialLog } from '../../../../shared/trialLog';
import MemoObject from '../memo-span/MemoObject';
import MemoSciencePanel, { memoTip } from '../memo-span/MemoSciencePanel';
import NBackModes from './NBackModes';
import {
  NB_LEVELS_PER_TIER, NB_DIFF_KEYS, NB_DM, NB_PASS_ACC,
  specForLevel, prepareLevelBlock, prepareFreeBlock, prepareChallengeSeed, prepareChallengeBlock,
  gradeBlock, starsForNBack, adaptiveNextN, isNbackLevelUnlocked,
  loadNbackProfile, saveNbackProfile, mergeNbackChallengeRow, compareNbackChallengeRows,
} from './nbackData';

const UI = {
  en: {
    hub: 'N-Back', tag: 'working memory', replayTutorial: 'How to play',
    freeMode: '♾️ Free mode', levelMode: '🎯 Level mode', challengeMode: '⚔️ Pass n Play',
    scienceLink: '🔬 Why this trains your brain', hubMapAria: 'Modes',
    hubNodeFreeHint: 'Adaptive — N rises with your accuracy',
    hubNodeLevelsHint: '100 levels · fixed N, faster pace',
    hubNodeChallengeHint: 'Same stream for all · pick a difficulty',
    pickDiff: 'Choose difficulty', pickDiffSub: 'Tap MATCH when the object repeats from N steps back.',
    diffDesc: { easy: '1–2 back · slower pace.', medium: '2–3 back · medium pace.', hard: '3–4 back · fast pace.' },
    levelsSub: (pop) => `${pop} · ${NB_LEVELS_PER_TIER} levels`,
    levelHeader: (diff, lv) => `${NB_DM[diff]?.label ?? diff} · L${lv}`,
    nBadge: (n) => `${n}-back`, match: 'MATCH', prompt: 'Same as N back?',
    getReady: 'Get ready…', trial: (i, tot) => `${i} / ${tot}`,
    resultsPass: 'Level passed!', resultsFail: 'Not quite — try again',
    accuracy: 'Accuracy', dprime: 'd′', hits: 'Hits', misses: 'Misses', false: 'False taps', stars: 'Stars',
    nextLv: 'Next level', retry: 'Retry', menu: 'Menu', again: 'Play again',
    freeTitle: 'Free mode', blockDone: 'Block complete', nextN: (n) => `Next: ${n}-back`,
    best: (n) => `Best: ${n}-back`,
    challengeTitle: '⚔️ Pass n Play', challengeSub: 'Same object stream for everyone · pass the device',
    chalPickDiff: 'Difficulty', players: 'Players (2–10)', addPl: '＋ Add player', startCh: '⚔️ Start',
    needTwo: 'Add at least 2 players.', chalRounds: 'Rounds', chalRoundsHint: 'Each player plays once per round',
    roundNofM: (n, m) => `Round ${n}/${m}`, chalTurnKicker: 'Your turn', chalBulletSame: 'Same stream this round',
    chalBulletPass: 'Start only when this player has the device', handTo: (n) => `Hand the device to ${n}.`,
    goReady: 'Start', chalMeta: (label, n) => `${label} · ${n}-back`, resultsChalTitle: 'Pass n Play results',
    chalResDetail: (acc, d) => `${acc}% · d′ ${d}`, newCh: 'New game',
  },
  ar: {
    hub: 'العودة-N', tag: 'ذاكرة عاملة', replayTutorial: 'كيف ألعب',
    freeMode: '♾️ وضع حر', levelMode: '🎯 وضع المستويات', challengeMode: '⚔️ مرّر والعب',
    scienceLink: '🔬 لماذا يدرّب دماغك', hubMapAria: 'الأوضاع',
    hubNodeFreeHint: 'تكيّفي — يرتفع N مع دقّتك',
    hubNodeLevelsHint: '١٠٠ مستوى · N ثابت وإيقاع أسرع',
    hubNodeChallengeHint: 'نفس التدفّق للجميع · اختر الصعوبة',
    pickDiff: 'اختر الصعوبة', pickDiffSub: 'اضغط «تطابق» عندما يتكرّر الشيء من قبل N خطوات.',
    diffDesc: { easy: '١–٢ عودة · إيقاع أبطأ.', medium: '٢–٣ عودة · إيقاع متوسط.', hard: '٣–٤ عودة · إيقاع سريع.' },
    levelsSub: (pop) => `${pop} · ${NB_LEVELS_PER_TIER} مستوى`,
    levelHeader: (diff, lv) => `${NB_DM[diff]?.label ?? diff} · ${lv}`,
    nBadge: (n) => `${n}-عودة`, match: 'تطابق', prompt: 'مثل قبل N؟',
    getReady: 'استعد…', trial: (i, tot) => `${i} / ${tot}`,
    resultsPass: 'اجتزت المستوى!', resultsFail: 'ليس بعد — حاول مجدداً',
    accuracy: 'الدقّة', dprime: 'd′', hits: 'إصابات', misses: 'فوات', false: 'ضغطات خاطئة', stars: 'نجوم',
    nextLv: 'المستوى التالي', retry: 'إعادة', menu: 'القائمة', again: 'العب مجدداً',
    freeTitle: 'وضع حر', blockDone: 'انتهت الجولة', nextN: (n) => `التالي: ${n}-عودة`,
    best: (n) => `الأفضل: ${n}-عودة`,
    challengeTitle: '⚔️ مرّر والعب', challengeSub: 'نفس التدفّق للجميع · مرّر الجهاز',
    chalPickDiff: 'الصعوبة', players: 'اللاعبون (2–10)', addPl: '＋ إضافة لاعب', startCh: '⚔️ ابدأ',
    needTwo: 'أضف لاعبين على الأقل.', chalRounds: 'الجولات', chalRoundsHint: 'كل لاعب يلعب مرة في الجولة',
    roundNofM: (n, m) => `الجولة ${n}/${m}`, chalTurnKicker: 'دورك', chalBulletSame: 'نفس التدفّق في هذه الجولة',
    chalBulletPass: 'ابدأ فقط عندما يكون الجهاز مع هذا اللاعب', handTo: (n) => `سلّم الجهاز إلى ${n}.`,
    goReady: 'ابدأ', chalMeta: (label, n) => `${label} · ${n}-عودة`, resultsChalTitle: 'نتائج مرّر والعب',
    chalResDetail: (acc, d) => `${acc}% · d′ ${d}`, newCh: 'لعبة جديدة',
  },
};

const STEP_GET_READY_MS = 800;
const rngSeed = () => (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;

export default function NBackGame({ onBack }) {
  const { playSfx, currentLang, awardTrainingWin, awardFreeRun } = useApp();
  const isAr = currentLang === 'ar';
  const t = isAr ? UI.ar : UI.en;

  const [profile, setProfile] = useState(() => loadNbackProfile());
  const [phase, setPhase] = useState('hub');
  const [diffKey, setDiffKey] = useState('easy');
  const [sciOpen, setSciOpen] = useState(false);
  const [block, setBlock] = useState(null);
  const [playStep, setPlayStep] = useState('idle'); // 'ready' | 'run'
  const [cur, setCur] = useState(null);
  const [showStim, setShowStim] = useState(false);
  const [idx, setIdx] = useState(-1);
  const [responded, setResponded] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [result, setResult] = useState(null);
  const [freeN, setFreeN] = useState(2);

  // challenge
  const [chalNames, setChalNames] = useState(['Player 1', 'Player 2']);
  const [chalSeed, setChalSeed] = useState(null);
  const [chalIdx, setChalIdx] = useState(0);
  const [chalScores, setChalScores] = useState([]);
  const [chalTurnOpen, setChalTurnOpen] = useState(false);
  const [chalRoundsTotal, setChalRoundsTotal] = useState(1);
  const [chalRoundIdx, setChalRoundIdx] = useState(0);
  const [chalDiff, setChalDiff] = useState('medium');

  const blockRef = useRef(null);
  const idxRef = useRef(-1);
  const respondedRef = useRef(false);
  const statsRef = useRef({ hit: 0, miss: 0, fa: 0, cr: 0 });
  const timersRef = useRef([]);
  const trialLogRef = useRef(null);
  const chalIdxRef = useRef(0);
  const chalNamesRef = useRef(chalNames);
  const chalScoresRef = useRef([]);
  const chalCycleRef = useRef(0);
  const chalRoundsTotalRef = useRef(1);
  const chalDiffRef = useRef('medium');
  const beginBlockRef = useRef(null);

  const doneMap = profile.done || {};

  const clearTimers = useCallback(() => { timersRef.current.forEach((id) => clearTimeout(id)); timersRef.current = []; }, []);
  useEffect(() => () => { clearTimers(); trialLogRef.current?.discard(); }, [clearTimers]);
  useEffect(() => { chalIdxRef.current = chalIdx; }, [chalIdx]);
  useEffect(() => { chalNamesRef.current = chalNames; }, [chalNames]);

  const scoreTrial = useCallback((i) => {
    const b = blockRef.current; if (!b) return;
    const n = b.spec.n;
    if (i < n) return;
    const isTarget = b.seq[i] === b.seq[i - n];
    const did = respondedRef.current;
    const s = statsRef.current;
    if (isTarget) (did ? s.hit++ : s.miss++); else (did ? s.fa++ : s.cr++);
    trialLogRef.current?.trial({ ok: isTarget === did, target: isTarget, resp: did, n });
  }, []);

  const finishBlock = useCallback(() => {
    clearTimers();
    const b = blockRef.current; if (!b) return;
    const grade = gradeBlock(statsRef.current);
    const n = b.spec.n;

    if (b.mode === 'challenge') {
      const i = chalIdxRef.current;
      const names = chalNamesRef.current;
      const base = [...chalScoresRef.current];
      base[i] = mergeNbackChallengeRow(base[i], grade, names[i]);
      chalScoresRef.current = base; setChalScores(base);
      trialLogRef.current?.finish({ score: grade.acc, n }); trialLogRef.current = null;
      setBlock(null); blockRef.current = null; setPlayStep('idle');
      if (i + 1 < names.length) { setChalIdx(i + 1); chalIdxRef.current = i + 1; setChalTurnOpen(true); return; }
      const cycle = chalCycleRef.current;
      if (cycle + 1 < chalRoundsTotalRef.current) {
        chalCycleRef.current = cycle + 1; setChalRoundIdx(cycle + 1);
        setChalSeed(prepareChallengeSeed(chalDiffRef.current));
        setChalIdx(0); chalIdxRef.current = 0; setChalTurnOpen(true); return;
      }
      setResult({ type: 'challenge', rows: [...base].sort(compareNbackChallengeRows) });
      setPhase('chalRes'); return;
    }

    if (b.mode === 'free') {
      trialLogRef.current?.finish({ score: grade.acc, n }); trialLogRef.current = null;
      awardFreeRun?.('nback', Math.max(0, n - 1));
      const nextN = adaptiveNextN(n, grade.acc);
      setProfile((prev) => { const best = Math.max(prev.bestN ?? 1, grade.acc >= 70 ? n : 0); if (best === (prev.bestN ?? 1)) return prev; const nx = { ...prev, bestN: best }; saveNbackProfile(nx); return nx; });
      setResult({ type: 'free', ...grade, n, nextN });
      setBlock(null); blockRef.current = null; setPlayStep('idle'); setPhase('freeRes'); return;
    }

    // level
    const won = grade.acc >= NB_PASS_ACC;
    const stars = starsForNBack(grade.acc);
    trialLogRef.current?.finish({ won, score: grade.acc, n }); trialLogRef.current = null;
    if (won) {
      awardTrainingWin('nback', b.spec.diff, b.spec.lv, NB_LEVELS_PER_TIER);
      setProfile((prev) => { const nx = { ...prev, done: { ...(prev.done || {}), [`${b.spec.diff}-${b.spec.lv}`]: true } }; saveNbackProfile(nx); return nx; });
    }
    setResult({ type: 'level', won, stars, ...grade, n, diff: b.spec.diff, lv: b.spec.lv });
    setBlock(null); blockRef.current = null; setPlayStep('idle'); setPhase('res');
  }, [awardFreeRun, awardTrainingWin, clearTimers]);

  const runTrial = useCallback((i) => {
    const b = blockRef.current; if (!b) return;
    if (i >= b.seq.length) { finishBlock(); return; }
    idxRef.current = i; setIdx(i);
    respondedRef.current = false; setResponded(false); setFeedback(null);
    setCur(b.seq[i]); setShowStim(true);
    timersRef.current.push(setTimeout(() => setShowStim(false), b.spec.stimMs));
    timersRef.current.push(setTimeout(() => { scoreTrial(i); runTrial(i + 1); }, b.spec.stimMs + b.spec.isiMs));
  }, [finishBlock, scoreTrial]);

  const beginBlock = useCallback((b) => {
    clearTimers();
    blockRef.current = b; setBlock(b);
    statsRef.current = { hit: 0, miss: 0, fa: 0, cr: 0 };
    idxRef.current = -1; setIdx(-1); setCur(null); setShowStim(false); setResponded(false); setFeedback(null);
    trialLogRef.current?.discard();
    trialLogRef.current = createTrialLog({ game: 'nback', mode: b.mode, meta: { n: b.spec.n, diff: b.spec.diff, lv: b.spec.lv } });
    setResult(null); setPhase('play'); setPlayStep('ready');
    timersRef.current.push(setTimeout(() => { setPlayStep('run'); runTrial(0); }, STEP_GET_READY_MS));
  }, [clearTimers, runTrial]);
  useEffect(() => { beginBlockRef.current = beginBlock; }, [beginBlock]);

  const onMatch = useCallback(() => {
    if (playStep !== 'run' || respondedRef.current || idxRef.current < 0) return;
    respondedRef.current = true; setResponded(true);
    const b = blockRef.current; const i = idxRef.current; const n = b.spec.n;
    const isTarget = i >= n && b.seq[i] === b.seq[i - n];
    setFeedback(isTarget ? 'good' : 'bad');
    playSfx(isTarget ? 'correct' : 'wrong');
  }, [playStep, playSfx]);

  const quitPlay = useCallback(() => {
    clearTimers(); trialLogRef.current?.discard(); trialLogRef.current = null;
    setBlock(null); blockRef.current = null; setPlayStep('idle');
    const mode = blockRef.current?.mode;
    if (mode === 'challenge') setPhase('chal'); else if (mode === 'level') setPhase('levels'); else setPhase('hub');
  }, [clearTimers]);

  const startLevel = (diff, lv) => beginBlock(prepareLevelBlock(diff, lv, rngSeed()));
  const startFree = (n) => beginBlock(prepareFreeBlock(n, rngSeed()));

  const openChallenge = () => {
    const names = chalNames.map((s, i) => s.trim() || `Player ${i + 1}`);
    if (names.length < 2) { window.alert(t.needTwo); return; }
    setChalNames(names); chalNamesRef.current = names;
    chalRoundsTotalRef.current = chalRoundsTotal; chalDiffRef.current = chalDiff; chalCycleRef.current = 0;
    setChalRoundIdx(0); setChalSeed(prepareChallengeSeed(chalDiff)); setChalIdx(0); chalIdxRef.current = 0;
    chalScoresRef.current = names.map((nm) => ({ nm, rounds: [], avgAcc: 0 })); setChalScores(chalScoresRef.current);
    setChalTurnOpen(true); setPhase('play'); setPlayStep('idle'); setBlock(null);
  };
  const startChallengeBlock = () => { if (!chalSeed) return; setChalTurnOpen(false); beginBlock(prepareChallengeBlock(chalSeed)); };

  const headerSub = () => {
    if (!block) return '';
    if (block.mode === 'challenge') return `${t.nBadge(block.spec.n)} · ${chalNames[chalIdx] ?? ''}`;
    return `${t.nBadge(block.spec.n)} · ${t.trial(Math.max(0, idx + 1), block.seq.length)}`;
  };

  return (
    <div className="cancellation-task-game ct-ms-root" dir={isAr ? 'rtl' : 'ltr'}>
      {phase === 'hub' && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light ct-ms-shell">
          <div className="ct-fq-screen ct-fq-training-screen ct-fq-training-screen--hub">
            <TrainingMenuBar onBack={onBack} playSfx={playSfx} hubSpaced variant="paper"
              center={<div className="ct-fq-hub-attn-head"><div className="ct-fq-hub-attn-big ct-ms-hub-title">{t.hub}</div><div className="ct-fq-hub-attn-sub">{t.tag}</div></div>} />
            <NBackModes t={t} isAr={isAr} playSfx={playSfx}
              onFree={() => startFree(Math.max(2, profile.bestN ?? 2))}
              onLevels={() => setPhase('diff')}
              onChallenge={() => setPhase('chal')}
              onScience={() => setSciOpen(true)} />
          </div>
        </div>
      )}

      {phase === 'diff' && (
        <TrainingDifficultySelect isAr={isAr} playSfx={playSfx} onBack={() => setPhase('hub')}
          title={t.pickDiff} blurb={t.pickDiffSub} diffKeys={NB_DIFF_KEYS} dm={NB_DM} descs={t.diffDesc}
          onPick={(k) => { setDiffKey(k); setPhase('levels'); }} />
      )}

      {phase === 'levels' && (
        <TrainingLevelGrid isAr={isAr} playSfx={playSfx} onBack={() => setPhase('diff')}
          title={NB_DM[diffKey].label} blurb={t.levelsSub(NB_DM[diffKey].pop)} count={NB_LEVELS_PER_TIER} lvc={NB_DM[diffKey].lvc}
          isUnlocked={(lv) => isNbackLevelUnlocked(diffKey, lv, doneMap)}
          isDone={(lv) => !!doneMap[`${diffKey}-${lv}`]}
          sublabel={(lv) => `${specForLevel(diffKey, lv).n}-back`}
          onPick={(lv) => startLevel(diffKey, lv)} />
      )}

      {phase === 'chal' && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light">
          <div className="ct-fq-screen ct-fq-training-screen">
            <TrainingMenuBar onBack={() => setPhase('hub')} playSfx={playSfx} variant="paper"
              center={<div style={{ textAlign: 'center' }}><div className="ct-fq-training-title ct-fq-training-title-sm">{t.challengeTitle}</div></div>} />
            <p className="ct-fq-sub ct-fq-training-blurb">{t.challengeSub}</p>
            <div className="ct-fq-card ct-fq-card-training">
              <h3>{t.chalPickDiff}</h3>
              <div className="ct-fq-rr ct-fq-rr-diff" role="group" aria-label={t.chalPickDiff}>
                {NB_DIFF_KEYS.map((k) => (
                  <button key={k} type="button" className={`ct-fq-rrb ct-fq-rrb-diff${chalDiff === k ? ' ct-fq-rrb-on ct-fq-rrb-on-training' : ''} ct-fq-rrb-training`}
                    onClick={() => { playSfx('click'); setChalDiff(k); }}>{NB_DM[k].label}</button>
                ))}
              </div>
              <h3 style={{ marginTop: 14 }}>{t.players}</h3>
              {chalNames.map((nm, i) => (
                <div key={i} className="ct-fq-pr">
                  <input value={nm} maxLength={20} onChange={(e) => { const n = [...chalNames]; n[i] = e.target.value; setChalNames(n); }} />
                  {chalNames.length > 2 && (<button type="button" className="ct-fq-prm" onClick={() => setChalNames(chalNames.filter((_, j) => j !== i))}>×</button>)}
                </div>
              ))}
              {chalNames.length < 10 && (<button type="button" className="ct-fq-apb ct-fq-apb-training" onClick={() => setChalNames([...chalNames, `Player ${chalNames.length + 1}`])}>{t.addPl}</button>)}
              <h3 style={{ marginTop: 14 }}>{t.chalRounds}</h3>
              <p className="ct-fq-sub" style={{ marginTop: 2, marginBottom: 8, fontSize: '0.78rem' }}>{t.chalRoundsHint}</p>
              <div className="ct-fq-rr" role="group" aria-label={t.chalRounds}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" className={`ct-fq-rrb${chalRoundsTotal === n ? ' ct-fq-rrb-on ct-fq-rrb-on-training' : ''} ct-fq-rrb-training`}
                    onClick={() => { playSfx('click'); setChalRoundsTotal(n); }}>{n}</button>
                ))}
              </div>
            </div>
            <button type="button" className="ct-fq-btn ct-fq-btn-pri" onClick={() => { playSfx('click'); openChallenge(); }}>{t.startCh}</button>
          </div>
        </div>
      )}

      {phase === 'play' && chalTurnOpen && !block && chalNames[chalIdx] && (
        <TrainingChallengeHandoff isAr={isAr} kicker={t.chalTurnKicker} playerName={chalNames[chalIdx]}
          roundLine={chalRoundsTotal > 1 ? t.roundNofM(chalRoundIdx + 1, chalRoundsTotal) : null}
          metaLine={t.chalMeta(NB_DM[chalDiff]?.label ?? '', chalSeed?.spec?.n ?? 3)}
          instruction={t.handTo(chalNames[chalIdx])} bullets={[t.chalBulletSame, t.chalBulletPass]}
          startLabel={t.goReady} onStart={startChallengeBlock} playSfx={playSfx} />
      )}

      {phase === 'play' && block && (
        <div className="ct-ms-play">
          <TrainingPlayHeader isAr={isAr} title={t.hub} subtitle={headerSub()} playSfx={playSfx} onMenu={quitPlay} onPause={null} />
          <div className="ct-nb-stage">
            <div className={`ct-nb-card${showStim ? ' ct-nb-card--on' : ''}${feedback ? ` ct-nb-card--${feedback}` : ''}`}>
              {playStep === 'run' && showStim && cur ? <MemoObject objectId={cur} isAr={isAr} size="lg" /> : <span className="ct-nb-card-dot" aria-hidden="true">{playStep === 'ready' ? '…' : '·'}</span>}
            </div>
            <p className="ct-nb-prompt">{playStep === 'ready' ? t.getReady : t.prompt}</p>
            <button type="button" className={`ct-nb-match${responded ? ' ct-nb-match--done' : ''}`} onPointerDown={onMatch} disabled={responded || playStep !== 'run'}>{t.match}</button>
          </div>
        </div>
      )}

      {phase === 'res' && result?.type === 'level' && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light ct-ms-shell">
          <div className="ct-fq-screen ct-fq-training-screen" style={{ textAlign: 'center' }}>
            <TrainingMenuBar variant="paper" playSfx={playSfx} onBack={() => setPhase('levels')}
              center={<div style={{ textAlign: 'center' }}><div className="ct-fq-training-title ct-fq-training-title-sm">{result.won ? t.resultsPass : t.resultsFail}</div></div>} />
            <div className="ct-fq-sbig">{result.acc}%</div>
            <div className="ct-fq-ies-lbl">{t.accuracy} · {t.nBadge(result.n)}</div>
            <div className="ct-fq-rm ct-fq-rm-training">
              <div className="ct-fq-rmi"><div className="ct-fq-rv">{result.dPrime}</div><div className="ct-fq-rl">{t.dprime}</div></div>
              <div className="ct-fq-rmi"><div className="ct-fq-rv">{result.hit}</div><div className="ct-fq-rl">{t.hits}</div></div>
              <div className="ct-fq-rmi"><div className="ct-fq-rv">{result.miss}</div><div className="ct-fq-rl">{t.misses}</div></div>
              <div className="ct-fq-rmi"><div className="ct-fq-rv">{'★'.repeat(result.stars)}{'☆'.repeat(3 - result.stars)}</div><div className="ct-fq-rl">{t.stars}</div></div>
            </div>
            <p className="ct-ms-result-tip">{memoTip(isAr, result.stars + result.acc)}</p>
            <div className="ct-ms-result-actions">
              {!result.won && <button type="button" className="ct-fq-btn ct-fq-btn-pri" onClick={() => startLevel(result.diff, result.lv)}>{t.retry}</button>}
              {result.won && result.lv < NB_LEVELS_PER_TIER && <button type="button" className="ct-fq-btn ct-fq-btn-pri" onClick={() => startLevel(result.diff, result.lv + 1)}>{t.nextLv}</button>}
              <button type="button" className="ct-fq-btn ct-fq-btn-ghost" onClick={() => setPhase('levels')}>{t.menu}</button>
            </div>
          </div>
        </div>
      )}

      {phase === 'freeRes' && result?.type === 'free' && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light ct-ms-shell">
          <div className="ct-fq-screen ct-fq-training-screen" style={{ textAlign: 'center' }}>
            <TrainingMenuBar variant="paper" playSfx={playSfx} onBack={() => setPhase('hub')}
              center={<div style={{ textAlign: 'center' }}><div className="ct-fq-training-title ct-fq-training-title-sm">{t.blockDone}</div></div>} />
            <div className="ct-fq-sbig">{result.acc}%</div>
            <div className="ct-fq-ies-lbl">{t.accuracy} · {t.nBadge(result.n)}</div>
            <div className="ct-fq-rm ct-fq-rm-training">
              <div className="ct-fq-rmi"><div className="ct-fq-rv">{result.dPrime}</div><div className="ct-fq-rl">{t.dprime}</div></div>
              <div className="ct-fq-rmi"><div className="ct-fq-rv">{result.hit}</div><div className="ct-fq-rl">{t.hits}</div></div>
              <div className="ct-fq-rmi"><div className="ct-fq-rv">{result.miss}</div><div className="ct-fq-rl">{t.misses}</div></div>
              <div className="ct-fq-rmi"><div className="ct-fq-rv">{result.fa}</div><div className="ct-fq-rl">{t.false}</div></div>
            </div>
            <p className="ct-ms-result-tip">{memoTip(isAr, result.acc)}</p>
            <button type="button" className="ct-fq-btn ct-fq-btn-pri" onClick={() => startFree(result.nextN)}>{t.nextN(result.nextN)}</button>
            <button type="button" className="ct-fq-btn ct-fq-btn-ghost" onClick={() => setPhase('hub')}>{t.menu}</button>
          </div>
        </div>
      )}

      {phase === 'chalRes' && result?.type === 'challenge' && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light ct-ms-shell">
          <div className="ct-fq-screen ct-fq-training-screen">
            <TrainingMenuBar onBack={() => setPhase('hub')} playSfx={playSfx} variant="paper"
              center={<div style={{ textAlign: 'center' }}><div className="ct-fq-training-title ct-fq-training-title-sm">{t.resultsChalTitle}</div></div>} />
            {result.rows.map((row, i) => (
              <div key={row.nm + i} className={`ct-fq-lbr ct-fq-lbr-training ${i === 0 ? 'win' : ''}`}>
                <div className="ct-fq-lbrk">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</div>
                <div><div className="ct-fq-lbnm">{row.nm}</div><div className="ct-fq-lbdt">{t.chalResDetail(row.avgAcc, row.last?.dPrime ?? 0)}</div></div>
                <div className="ct-fq-lbsc">{row.avgAcc}%</div>
              </div>
            ))}
            <button type="button" className="ct-fq-btn ct-fq-btn-pri" onClick={() => { setChalSeed(null); setChalTurnOpen(false); setPhase('chal'); }}>{t.newCh}</button>
            <button type="button" className="ct-fq-btn ct-fq-btn-ghost" onClick={() => setPhase('hub')}>{t.menu}</button>
          </div>
        </div>
      )}

      {sciOpen && <MemoSciencePanel isAr={isAr} onClose={() => setSciOpen(false)} />}
    </div>
  );
}
