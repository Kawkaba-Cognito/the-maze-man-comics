import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';
import { makeRng } from '../../../../shared/rng';
import { survivalRampFromRemaining } from '../../../../shared/survival';
import { useSurvivalCountdown, SurvivalCountdownBar } from '../../../../shared/SurvivalCountdown';
import KawkabSprite from '../../../../shared/KawkabSprite';
import { GAME_STIMULUS } from '../../../../shared/gamePalette';
import { createTrialLog } from '../../../../shared/trialLog';
import './taskSwitch.css';

/*
 * Task Switch — cued task switching (Rogers & Monsell, 1995).  [flexibility]
 *
 * A cue names the feature to answer on, then a coloured shape appears. The
 * RESPONSE KEYS NEVER MOVE: left is red-or-circle, right is blue-or-square. So
 * a red square wants the left key under COLOUR and the right key under SHAPE —
 * the same picture, two different answers, and the only thing that changed is
 * which rule is live.
 *
 * ── Why fixed keys, and why it matters ──
 * The obvious design relabels the buttons each trial ("Red / Blue", then
 * "Circle / Square"). That is easier to read and it measures almost nothing:
 * the player just matches a word to a picture and never holds a rule at all.
 * With fixed keys the mapping has to be carried in the head and reconfigured on
 * cue, which is the whole construct. It also produces CONGRUENCY for free —
 * red circle and blue square want the same key either way, red square and blue
 * circle conflict — so the game can show whether the ignored feature got
 * through anyway.
 *
 * ── What this replaced, and why ──
 * Card Sort (WCST) and Kawkab Hops (Brixton) both asked the player to infer a
 * hidden rule and then notice it had silently changed. Two thirds of the domain
 * was the same loop, and the loop punishes you for the one trial after a switch
 * that is unguessable by design. Here the rule is always stated. You lose time,
 * never fairness.
 *
 * Modes (shared ModeShell): Survival (60s) · Levels (100 each × 3 diff) · Pass n Play.
 */

/** Left key answers RED and CIRCLE; right key answers BLUE and SQUARE. */
const RED = GAME_STIMULUS[0];
const BLUE = GAME_STIMULUS[3];

export const TS_PP_TRIALS = 24;
export const TS_LEVEL_TRIALS = 24;
export const TS_WIN_ACC = 0.75;

/**
 * Difficulty is the preparation interval and how often the rule changes.
 *
 * The cue–stimulus interval is the honest lever: given ~1200 ms you can
 * reconfigure before the stimulus lands and the switch cost nearly vanishes;
 * at 150 ms you cannot, and you pay it on every switch. Switch PROPORTION is
 * the second lever — a run of repeats lets a set settle, so more switching is
 * more work even at the same interval.
 */
export function tsCfg(mode, diff, level, ramp) {
  if (mode === 'free') {
    const r = ramp ?? 0;
    return { csi: Math.round(1100 - r * 800), pSwitch: 0.3 + r * 0.35, deadline: Math.round(3000 - r * 900) };
  }
  if (mode === 'passplay') return { csi: 600, pSwitch: 0.5, deadline: 2600 };
  const f = ((level || 1) - 1) / 99;
  const base = diff === 'easy' ? { csi: 1100, p: 0.3, dl: 3200 }
    : diff === 'hard' ? { csi: 550, p: 0.5, dl: 2400 }
      : { csi: 800, p: 0.4, dl: 2800 };
  return {
    csi: Math.round(base.csi - f * (diff === 'hard' ? 400 : 500)),
    pSwitch: Math.min(0.65, base.p + f * 0.2),
    deadline: Math.round(base.dl - f * 700),
  };
}

/** One trial. `prevTask` null on the first, which is neither switch nor repeat. */
export function makeTrial(rng, prevTask, pSwitch) {
  const task = prevTask === null
    ? (rng() < 0.5 ? 'colour' : 'shape')
    : (rng() < pSwitch ? (prevTask === 'colour' ? 'shape' : 'colour') : prevTask);
  const colour = rng() < 0.5 ? 'red' : 'blue';
  const shape = rng() < 0.5 ? 'circle' : 'square';
  return {
    task,
    colour,
    shape,
    isSwitch: prevTask !== null && task !== prevTask,
    // Same key under either rule ⇒ congruent.
    congruent: (colour === 'red') === (shape === 'circle'),
    answer: task === 'colour'
      ? (colour === 'red' ? 'left' : 'right')
      : (shape === 'circle' ? 'left' : 'right'),
  };
}

const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export function TaskSwitchEngine({
  mode, diff, level, seed, attempt, onResult, onExit,
  isAr, playSfx, awardPoints, awardFreeRun,
}) {
  const isSurvival = mode === 'free';
  const targetTrials = mode === 'passplay' ? (attempt?.trials || TS_PP_TRIALS) : TS_LEVEL_TRIALS;

  const rngRef = useRef(makeRng((seed ?? 1) >>> 0));
  const prevTaskRef = useRef(null);
  const nRef = useRef(0);
  const okRef = useRef(0);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const logRef = useRef([]);
  /* The in-memory logRef above drives THIS run's results panel and dies with it.
     trialLogRef persists the same responses so switch cost can be tracked across
     sessions, which is the whole point of measuring a switch cost. */
  const trialLogRef = useRef(null);
  const onsetRef = useRef(0);
  const acceptRef = useRef(false);
  const finishedRef = useRef(false);
  const timersRef = useRef([]);
  const rampRef = useRef(0);

  const [trial, setTrial] = useState(null);
  const [showStim, setShowStim] = useState(false);
  const [feedback, setFeedback] = useState(null); // 'ok' | 'bad' | 'slow'
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [done, setDone] = useState(0);
  const [over, setOver] = useState(null);

  const clearTimers = () => { timersRef.current.forEach(clearTimeout); timersRef.current = []; };
  const later = (fn, ms) => { timersRef.current.push(setTimeout(fn, ms)); };

  const t = useMemo(() => ({
    title: isAr ? 'تبديل المهمة' : 'Task Switch',
    answerColour: isAr ? 'أجب عن اللون' : 'Answer the colour',
    answerShape: isAr ? 'أجب عن الشكل' : 'Answer the shape',
    left: isAr ? 'أحمر / دائرة' : 'Red / Circle',
    right: isAr ? 'أزرق / مربّع' : 'Blue / Square',
    ready: isAr ? 'استعد…' : 'Ready…',
    ok: isAr ? 'صحيح' : 'Correct',
    bad: isAr ? 'المفتاح الخطأ' : 'Wrong key',
    slow: isAr ? 'بطيء جداً' : 'Too slow',
    over: isAr ? 'انتهى البقاء' : 'Survival over',
    again: isAr ? 'العب مجدداً' : 'Play again',
    menu: isAr ? 'القائمة' : 'Menu',
    cost: isAr ? 'كلفة التبديل' : 'Switch cost',
    cong: isAr ? 'أثر التوافق' : 'Congruency',
    acc: isAr ? 'الدقة' : 'Accuracy',
    keysHint: isAr
      ? 'المفتاحان ثابتان: اليسار أحمر أو دائرة، اليمين أزرق أو مربّع.'
      : 'The keys never move: left is red or circle, right is blue or square.',
  }), [isAr]);

  const finishSurvival = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    acceptRef.current = false;
    clearTimers();
    const hits = logRef.current.filter((d) => d.ok);
    const rep = mean(hits.filter((d) => !d.isSwitch).map((d) => d.rt));
    const swi = mean(hits.filter((d) => d.isSwitch).map((d) => d.rt));
    setOver({
      score: scoreRef.current,
      correct: okRef.current,
      total: nRef.current,
      cost: rep != null && swi != null ? Math.round(swi - rep) : null,
    });
    trialLogRef.current?.finish({
      correct: okRef.current,
      total: nRef.current,
      switchCost: rep != null && swi != null ? Math.round(swi - rep) : null,
    });
    awardFreeRun?.('task-switch', okRef.current);
    playSfx?.('error');
  }, [awardFreeRun, playSfx]);

  const remaining = useSurvivalCountdown(isSurvival && !over, finishSurvival);
  rampRef.current = isSurvival ? survivalRampFromRemaining(remaining) : 0;

  const finishRound = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    acceptRef.current = false;
    clearTimers();
    const acc = nRef.current ? okRef.current / nRef.current : 0;
    trialLogRef.current?.finish({ correct: okRef.current, total: nRef.current, acc });
    if (mode === 'levels') onResult?.({ won: acc >= TS_WIN_ACC, score: scoreRef.current });
    else onResult?.({ score: okRef.current });
  }, [mode, onResult]);

  const nextTrial = useCallback(() => {
    if (finishedRef.current) return;
    if (!isSurvival && nRef.current >= targetTrials) { finishRound(); return; }
    const cfg = tsCfg(mode, diff, level, rampRef.current);
    const tr = makeTrial(rngRef.current, prevTaskRef.current, cfg.pSwitch);
    prevTaskRef.current = tr.task;
    setTrial(tr);
    setShowStim(false);
    setFeedback(null);
    later(() => {
      if (finishedRef.current) return;
      setShowStim(true);
      onsetRef.current = performance.now();
      acceptRef.current = true;
      // A deadline keeps a stalled trial from parking the run forever, and is
      // itself a difficulty lever.
      later(() => {
        if (!acceptRef.current || finishedRef.current) return;
        acceptRef.current = false;
        nRef.current += 1;
        comboRef.current = 0;
        setCombo(0);
        setDone(nRef.current);
        setFeedback('slow');
        playSfx?.('lose');
        later(nextTrial, 520);
      }, cfg.deadline);
    }, cfg.csi);
  }, [diff, finishRound, isSurvival, level, mode, playSfx, targetTrials]);

  useEffect(() => {
    finishedRef.current = false;
    nRef.current = 0; okRef.current = 0; scoreRef.current = 0; comboRef.current = 0;
    logRef.current = []; prevTaskRef.current = null;
    rngRef.current = makeRng((seed ?? 1) >>> 0);
    trialLogRef.current?.discard();
    trialLogRef.current = createTrialLog({
      game: 'task-switch',
      mode: mode === 'passplay' ? 'challenge' : mode,
      meta: { diff, lv: level },
    });
    setScore(0); setCombo(0); setDone(0); setOver(null);
    later(nextTrial, 500);
    return () => { clearTimers(); trialLogRef.current?.discard(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, mode, diff, level]);

  const respond = useCallback((side) => {
    if (!acceptRef.current || finishedRef.current || !trial) return;
    acceptRef.current = false;
    const rt = performance.now() - onsetRef.current;
    const ok = side === trial.answer;
    nRef.current += 1;
    logRef.current.push({ rt, ok, isSwitch: trial.isSwitch, congruent: trial.congruent });
    trialLogRef.current?.trial({
      rt: Math.round(rt), ok, sw: !!trial.isSwitch, con: !!trial.congruent,
    });
    if (ok) {
      okRef.current += 1;
      comboRef.current += 1;
      /* Faster is worth more, and a switch trial pays a premium — the point of
       * the game is the switch, so the score should say so. */
      const speed = Math.max(0, Math.round((1400 - Math.min(rt, 1400)) / 40));
      const gain = 10 + speed + (trial.isSwitch ? 8 : 0) + Math.min(comboRef.current, 10);
      scoreRef.current += gain;
      setScore(scoreRef.current);
      setCombo(comboRef.current);
      playSfx?.('win');
      awardPoints?.(1);
    } else {
      comboRef.current = 0;
      setCombo(0);
      playSfx?.('lose');
    }
    setDone(nRef.current);
    setFeedback(ok ? 'ok' : 'bad');
    setShowStim(false);
    later(nextTrial, ok ? 420 : 700);
  }, [awardPoints, nextTrial, playSfx, trial]);

  useEffect(() => {
    const onKey = (e) => {
      const k = e.key.toLowerCase();
      if (k === 'f' || e.key === 'ArrowLeft') { e.preventDefault(); respond('left'); }
      else if (k === 'j' || e.key === 'ArrowRight') { e.preventDefault(); respond('right'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [respond]);

  const hits = logRef.current.filter((d) => d.ok);
  const repM = mean(hits.filter((d) => !d.isSwitch).map((d) => d.rt));
  const swiM = mean(hits.filter((d) => d.isSwitch).map((d) => d.rt));
  const conM = mean(hits.filter((d) => d.congruent).map((d) => d.rt));
  const incM = mean(hits.filter((d) => !d.congruent).map((d) => d.rt));

  return (
    <div className="ct-ts-root" dir={isAr ? 'rtl' : 'ltr'}>
      <header className="ct-training-play-header">
        <button className="ct-training-chrome-btn" aria-label={t.menu} onClick={() => { playSfx?.('click'); onExit?.(); }}>‹</button>
        <div className="ct-training-play-header-body">
          <div className="ct-training-play-title">{t.title}</div>
          <div className="ct-training-play-sub">
            {isSurvival ? `${score}` : `${done}/${targetTrials}`}
            {combo > 1 ? ` · ×${combo}` : ''}
          </div>
        </div>
        <div className="ct-training-chrome-spacer" aria-hidden="true" />
      </header>

      {isSurvival && !over ? <SurvivalCountdownBar remaining={remaining} /> : null}

      <div className="ct-ts-stage">
        <div className={`ct-ts-cue${trial ? ' is-live' : ''}`}>
          {trial ? (trial.task === 'colour' ? t.answerColour : t.answerShape) : t.ready}
        </div>

        <div className="ct-ts-stim" aria-live="polite">
          {showStim && trial ? (
            <span
              className={`ct-ts-shape ct-ts-shape--${trial.shape}`}
              style={{ background: trial.colour === 'red' ? RED : BLUE }}
              aria-label={`${trial.colour} ${trial.shape}`}
            />
          ) : null}
        </div>

        <div className={`ct-ts-verdict${feedback ? ` is-${feedback}` : ''}`}>
          {feedback === 'ok' ? t.ok : feedback === 'bad' ? t.bad : feedback === 'slow' ? t.slow : ''}
        </div>

        <div className="ct-ts-keys">
          <button type="button" className="ct-ts-key" onClick={() => respond('left')}>
            <span className="ct-ts-key-face">
              <span className="ct-ts-chip ct-ts-chip--circle" style={{ background: RED }} />
            </span>
            {t.left}
            <small>F</small>
          </button>
          <button type="button" className="ct-ts-key" onClick={() => respond('right')}>
            <span className="ct-ts-key-face">
              <span className="ct-ts-chip ct-ts-chip--square" style={{ background: BLUE }} />
            </span>
            {t.right}
            <small>J</small>
          </button>
        </div>
        <p className="ct-ts-hint">{t.keysHint}</p>
      </div>

      {over ? (
        <div className="ct-ts-over">
          <div className="ct-ts-over-card">
            <KawkabSprite size={56} />
            <div className="ct-ts-over-title">{t.over}</div>
            <div className="ct-fq-rm ct-fq-rm-training ct-fq-assess-grid">
              <div className="ct-fq-rmi"><div className="ct-fq-rv">{over.score}</div><div className="ct-fq-rl">{isAr ? 'النقاط' : 'Score'}</div></div>
              <div className="ct-fq-rmi"><div className="ct-fq-rv">{over.total ? Math.round((over.correct / over.total) * 100) : 0}%</div><div className="ct-fq-rl">{t.acc}</div></div>
              <div className="ct-fq-rmi"><div className="ct-fq-rv">{over.cost != null ? `+${over.cost}` : '—'}</div><div className="ct-fq-rl">{t.cost}</div></div>
              <div className="ct-fq-rmi">
                <div className="ct-fq-rv">{conM != null && incM != null ? `+${Math.round(incM - conM)}` : '—'}</div>
                <div className="ct-fq-rl">{t.cong}</div>
              </div>
            </div>
            <p className="ct-ts-over-note">
              {isAr
                ? 'كلفة التبديل هي الفارق بين محاولة تغيّرت فيها القاعدة وأخرى لم تتغيّر.'
                : 'Switch cost is how much slower you are on a trial where the rule just changed.'}
              {repM != null && swiM != null
                ? ` (${Math.round(repM)}ms → ${Math.round(swiM)}ms)`
                : ''}
            </p>
            <div className="ct-ts-over-actions">
              <button type="button" className="ct-fq-btn ct-fq-btn-pri" onClick={() => { playSfx?.('click'); onExit?.(); }}>{t.menu}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function TaskSwitchGame({ onBack, workoutMode = false }) {
  const { currentLang, playSfx, awardPoints, awardFreeRun } = useApp();
  const isAr = currentLang === 'ar';
  return (
    <ModeShell
      storageKey="mm_flx_taskswitch"
      scienceId="task-switch"
      title={{ en: 'Task Switch', ar: 'تبديل المهمة' }}
      hints={{
        free: { en: '60s survival · less warning as you go', ar: '٦٠ث بقاء · تحذير أقل كلما تقدّمت' },
        levels: { en: '3 difficulties · shorter warning, more switching', ar: '٣ صعوبات · تحذير أقصر وتبديل أكثر' },
        pass: { en: 'Same trials for everyone · pass the device', ar: 'نفس المحاولات للجميع · مرّر الجهاز' },
      }}
      diffLabels={{ easy: { en: 'Easy', ar: 'سهل' }, med: { en: 'Medium', ar: 'متوسط' }, hard: { en: 'Hard', ar: 'صعب' } }}
      pass={{ trials: TS_PP_TRIALS, scoreLabel: { en: 'correct', ar: 'صحيحة' }, lowerBetter: false, diff: 'med' }}
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      workoutMode={workoutMode}
      renderEngine={(p) => (
        <TaskSwitchEngine
          key={`${p.mode}-${p.diff}-${p.level}-${p.seed}`}
          {...p}
          isAr={isAr}
          playSfx={playSfx}
          awardPoints={awardPoints}
          awardFreeRun={awardFreeRun}
        />
      )}
    />
  );
}
