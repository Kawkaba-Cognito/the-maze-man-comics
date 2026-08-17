import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';
import { STR_COMMON } from '../../../../shared/trainingStrings';
import { makeRng } from '../../../../shared/rng';
import { createTrialLog } from '../../../../shared/trialLog';
import { TrainingPauseModal, TrainingPlayHeader } from '../../../../shared/TrainingChrome';
import {
  CATEGORIES, LEVELS_PER_TIER, levelCfg, survivalCfg, buildRound, isCorrect,
} from './data';
import './keepTrack.css';

/*
 * Keep Track (Miyake et al. 2000) — the memory domain's updating game.
 *
 * Words stream past, each tagged with its category. Two to four categories are
 * named as targets before the stream starts; at the end you type the LAST word
 * you saw in each. Every fresh exemplar of a tracked category has to overwrite
 * the one before it, which is what makes this updating rather than storage.
 *
 * Replaces Dual N-Back. Two reasons, in this order: N-Back punishes you for a
 * trial you could not have known — the same flaw that benched Card Sort and
 * Kawkab Hops — whereas here you always have an answer to give. And N-Back was
 * the one registered game on neither ModeShell nor STR_COMMON, so its pause,
 * quit and mode wording had drifted from the other eighteen games.
 *
 * Recall is TYPED, not multiple choice. Every other game in this domain hands
 * the items back to you; free recall is the only place the domain tests
 * producing a memory cold, which is where real memory complaints live.
 */

const UI = {
  en: {
    ...STR_COMMON.en,
    title: 'Keep Track',
    tag: 'working memory',
    hintFree: 'Endless — categories pile on as you go',
    hintLevels: '3 difficulties · 100 levels each',
    hintPass: 'Same stream for everyone · pass the device',
    watchThese: 'Keep track of these',
    watchSub: (n) => `${n} categor${n === 1 ? 'y' : 'ies'} to hold. Remember the LAST word you see in each.`,
    begin: 'Start the stream',
    lastIn: 'Last word in each category',
    typeHint: 'Type what you remember. Spelling slips are forgiven.',
    submit: 'Submit',
    // The feedback screen advances; it does not submit anything. Sharing the
    // 'Submit' label made two consecutive screens carry the same button.
    continueLbl: 'Continue',
    skip: 'I lost it',
    correct: 'Correct',
    roundScore: (c, t) => `${c} of ${t} recalled`,
    streamOf: (i, n) => `${i} / ${n}`,
    nextRound: 'Next round',
    runOver: 'Run ended',
    bestStage: (n) => `Best: round ${n}`,
    levelPassed: 'Level cleared',
    levelFailed: 'Not quite',
    needAll: 'Recall every category to clear the level.',
    updated: (n) => `${n} updates survived`,
  },
  ar: {
    ...STR_COMMON.ar,
    title: 'تتبّع الفئات',
    tag: 'ذاكرة عاملة',
    hintFree: 'بلا نهاية — تتراكم الفئات كلما تقدّمت',
    hintLevels: '٣ صعوبات · ١٠٠ مستوى لكل',
    hintPass: 'نفس التدفّق للجميع · مرّر الجهاز',
    watchThese: 'تتبّع هذه الفئات',
    watchSub: (n) => `${n} فئات عليك تتبّعها. تذكّر آخر كلمة تراها في كلٍّ منها.`,
    begin: 'ابدأ التدفّق',
    lastIn: 'آخر كلمة في كل فئة',
    typeHint: 'اكتب ما تتذكّره. أخطاء الإملاء البسيطة مقبولة.',
    submit: 'إرسال',
    continueLbl: 'التالي',
    skip: 'نسيتها',
    correct: 'صحيح',
    roundScore: (c, t) => `تذكّرت ${c} من ${t}`,
    streamOf: (i, n) => `${i} / ${n}`,
    nextRound: 'الجولة التالية',
    runOver: 'انتهت المحاولة',
    bestStage: (n) => `الأفضل: الجولة ${n}`,
    levelPassed: 'اجتزت المستوى',
    levelFailed: 'ليس تماماً',
    needAll: 'تذكّر كل الفئات لاجتياز المستوى.',
    updated: (n) => `${n} تحديثات صمدت`,
  },
};

/* ── The engine: one round is watch → recall ──────────────────────────────── */
function KeepTrackEngine({
  mode, diff, level, seed, attempt, onResult, onExit, isAr, playSfx, awardFreeRun,
}) {
  const t = isAr ? UI.ar : UI.en;
  const lang = isAr ? 'ar' : 'en';

  const [stage, setStage] = useState(0);           // survival round index
  const [step, setStep] = useState('brief');       // brief | stream | recall | feedback
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [paused, setPaused] = useState(false);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [ppRound, setPpRound] = useState(0);

  const trialLogRef = useRef(null);
  const timerRef = useRef(null);
  const pausedRef = useRef(false);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  const cfg = useMemo(() => {
    if (mode === 'free') return survivalCfg(stage);
    if (mode === 'passplay') return levelCfg(diff, 40);
    return levelCfg(diff, level || 1);
  }, [mode, diff, level, stage]);

  const round = useMemo(() => {
    const rng = seed != null ? makeRng((seed >>> 0) + stage * 7919 + ppRound * 104729) : Math.random;
    return buildRound(cfg, lang, rng);
  }, [cfg, lang, seed, stage, ppRound]);

  useEffect(() => {
    trialLogRef.current = createTrialLog({
      game: 'keep-track',
      mode: mode === 'free' ? 'free' : mode === 'passplay' ? 'challenge' : 'level',
      meta: { diff, lv: level, targets: cfg.targets, rate: cfg.rate },
    });
    return () => { trialLogRef.current?.discard?.(); };
    // One log per engine mount, matching the other ModeShell games.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Advance the stream on a timer; pausing genuinely stops it.
  useEffect(() => {
    if (step !== 'stream') return undefined;
    if (idx >= round.stream.length) {
      setStep('recall');
      return undefined;
    }
    timerRef.current = setTimeout(() => {
      if (pausedRef.current) return;
      setIdx((i) => i + 1);
    }, cfg.rate);
    return () => clearTimeout(timerRef.current);
  }, [step, idx, round.stream.length, cfg.rate]);

  // Re-arm the tick that was swallowed while paused.
  useEffect(() => {
    if (step !== 'stream' || paused) return undefined;
    if (timerRef.current) return undefined;
    timerRef.current = setTimeout(() => setIdx((i) => i + 1), cfg.rate);
    return () => clearTimeout(timerRef.current);
  }, [paused, step, cfg.rate]);

  const startStream = useCallback(() => {
    playSfx?.('click');
    setIdx(0);
    setAnswers({});
    setStep('stream');
  }, [playSfx]);

  const submit = useCallback(() => {
    const marks = round.targets.map((cat) => {
      const ok = isCorrect(answers[cat.id] || '', round.answers[cat.id] || '');
      trialLogRef.current?.trial({ ok, cat: cat.id });
      return { cat, ok, expected: round.answers[cat.id], given: answers[cat.id] || '' };
    });
    const got = marks.filter((m) => m.ok).length;
    playSfx?.(got === marks.length ? 'win' : got ? 'click' : 'error');
    setTotalCorrect((n) => n + got);
    setFeedback({ marks, got, of: marks.length });
    setStep('feedback');
  }, [answers, round, playSfx]);

  const advance = useCallback(() => {
    const got = feedback?.got ?? 0;
    const of = feedback?.of ?? 0;

    if (mode === 'levels') {
      const won = got === of;
      trialLogRef.current?.finish?.({ result: { got, of } });
      onResult?.({ won, score: got, summary: won ? t.updated(of) : t.needAll });
      return;
    }
    if (mode === 'passplay') {
      const next = ppRound + 1;
      const trials = attempt?.trials || 4;
      if (next >= trials) {
        trialLogRef.current?.finish?.({ result: { score: totalCorrect + got } });
        onResult?.({ score: totalCorrect + got });
        return;
      }
      setPpRound(next);
      setFeedback(null);
      setStep('brief');
      return;
    }
    // Survival: a perfect round advances; anything less ends the run.
    if (got === of) {
      setStage((s) => s + 1);
      setFeedback(null);
      setStep('brief');
      return;
    }
    awardFreeRun?.('keep-track', stage);
    trialLogRef.current?.finish?.({ result: { stage } });
    setStep('over');
  }, [feedback, mode, ppRound, attempt, totalCorrect, onResult, t, stage, awardFreeRun]);

  const headerLabel = mode === 'free'
    ? `${t.freeHeader} · ${stage + 1}`
    : mode === 'passplay'
      ? `${t.challengeHeader} · ${ppRound + 1}/${attempt?.trials || 4}`
      : `${t.levelMode} · L${level}`;

  const current = round.stream[Math.min(idx, round.stream.length - 1)];
  const currentCat = CATEGORIES.find((c) => c.id === current?.catId);

  return (
    <div className="ct-training-root ct-kt-root" dir={isAr ? 'rtl' : 'ltr'}>
      {/* The shared PLAY header, not TrainingMenuBar — that one is the hub/lobby
          bar (full width, 18px gutter) and using it mid-play put this game's
          back button in a different place and size from every other game's.
          The pause also had its own glyph (ct-kt-pausebtn "❚❚"); it now goes
          through the header's pause slot like everywhere else. */}
      <TrainingPlayHeader
        isAr={isAr}
        playSfx={playSfx}
        title={headerLabel}
        onMenu={() => onExit?.()}
        menuAriaLabel={t.menu}
        onPause={step === 'stream' ? () => setPaused(true) : undefined}
        pauseAriaLabel={t.paused}
      />

      <div className="ct-kt-stage">
        {step === 'brief' && (
          <div className="ct-kt-panel">
            <h2 className="ct-kt-h">{t.watchThese}</h2>
            <p className="ct-kt-sub">{t.watchSub(round.targets.length)}</p>
            <div className="ct-kt-cats">
              {round.targets.map((c) => (
                <span key={c.id} className="ct-kt-cat">{c.name[lang]}</span>
              ))}
            </div>
            <button type="button" className="ct-training-btn ct-training-btn--pri" onClick={startStream}>
              {t.begin}
            </button>
          </div>
        )}

        {step === 'stream' && current && (
          <div className="ct-kt-panel">
            <div className="ct-kt-word" key={idx}>{current.word}</div>
            <div className="ct-kt-wordcat">{currentCat?.name[lang]}</div>
            <div className="ct-kt-track">
              {round.targets.map((c) => (
                <span key={c.id} className="ct-kt-cat ct-kt-cat--dim">{c.name[lang]}</span>
              ))}
            </div>
            <div className="ct-kt-count">{t.streamOf(idx + 1, round.stream.length)}</div>
          </div>
        )}

        {step === 'recall' && (
          <div className="ct-kt-panel">
            <h2 className="ct-kt-h">{t.lastIn}</h2>
            <p className="ct-kt-sub">{t.typeHint}</p>
            <div className="ct-kt-form">
              {round.targets.map((c, i) => (
                <label key={c.id} className="ct-kt-field">
                  <span className="ct-kt-fieldname">{c.name[lang]}</span>
                  <input
                    type="text"
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    dir={isAr ? 'rtl' : 'ltr'}
                    value={answers[c.id] || ''}
                    autoFocus={i === 0}
                    onChange={(e) => setAnswers((a) => ({ ...a, [c.id]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter' && i === round.targets.length - 1) submit(); }}
                  />
                </label>
              ))}
            </div>
            <button type="button" className="ct-training-btn ct-training-btn--pri" onClick={submit}>
              {t.submit}
            </button>
          </div>
        )}

        {step === 'feedback' && feedback && (
          <div className="ct-kt-panel">
            <h2 className="ct-kt-h">{t.roundScore(feedback.got, feedback.of)}</h2>
            <div className="ct-kt-marks">
              {feedback.marks.map((m) => (
                <div key={m.cat.id} className={`ct-kt-mark${m.ok ? ' ok' : ''}`}>
                  <span className="ct-kt-fieldname">{m.cat.name[lang]}</span>
                  <span className="ct-kt-expected">{m.expected}</span>
                  {!m.ok && m.given ? <span className="ct-kt-given">{m.given}</span> : null}
                </div>
              ))}
            </div>
            <button type="button" className="ct-training-btn ct-training-btn--pri" onClick={advance}>
              {mode === 'levels' ? t.continueLbl : t.nextRound}
            </button>
          </div>
        )}

        {step === 'over' && (
          <div className="ct-kt-panel">
            <h2 className="ct-kt-h">{t.runOver}</h2>
            <p className="ct-kt-sub">{t.bestStage(stage + 1)}</p>
            <div className="ct-kt-actions">
              <button
                type="button"
                className="ct-training-btn ct-training-btn--pri"
                onClick={() => {
                  playSfx?.('click');
                  setStage(0); setTotalCorrect(0); setFeedback(null); setStep('brief');
                }}
              >
                {t.freePlayAgain}
              </button>
              <button type="button" className="ct-training-btn ct-training-btn--ghost" onClick={() => onExit?.()}>
                {t.menu}
              </button>
            </div>
          </div>
        )}
      </div>

      <TrainingPauseModal
        open={paused}
        showRestart={false}
        labels={{ paused: t.paused, resume: t.resume, quitMenu: t.quitMenu }}
        onResume={() => { setPaused(false); playSfx?.('click'); }}
        onQuitMenu={() => { playSfx?.('click'); onExit?.(); }}
      />
    </div>
  );
}

export default function KeepTrackGame({ onBack, workoutMode = false }) {
  const { currentLang, playSfx, awardFreeRun } = useApp();
  const isAr = currentLang === 'ar';
  return (
    <ModeShell
      storageKey="mm_mem_keeptrack"
      gameId="keep-track"
      scienceId="keep-track"
      title={{ en: UI.en.title, ar: UI.ar.title }}
      hints={{
        free: { en: UI.en.hintFree, ar: UI.ar.hintFree },
        levels: { en: UI.en.hintLevels, ar: UI.ar.hintLevels },
        pass: { en: UI.en.hintPass, ar: UI.ar.hintPass },
      }}
      diffLabels={{
        easy: { en: 'Easy', ar: 'سهل' },
        med: { en: 'Medium', ar: 'متوسط' },
        hard: { en: 'Hard', ar: 'صعب' },
      }}
      levelCount={LEVELS_PER_TIER}
      pass={{ trials: 4, scoreLabel: { en: 'recalled', ar: 'تذكّر' }, lowerBetter: false, diff: 'med' }}
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      workoutMode={workoutMode}
      renderEngine={(p) => (
        <KeepTrackEngine
          {...p}
          isAr={isAr}
          playSfx={playSfx}
          awardFreeRun={awardFreeRun}
        />
      )}
    />
  );
}

export { UI as KEEP_TRACK_UI };
