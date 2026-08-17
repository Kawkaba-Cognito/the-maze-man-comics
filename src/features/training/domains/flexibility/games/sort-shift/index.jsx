import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { IconBack } from '../../../../shared/TrainingIcons';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';
import { makeRng } from '../../../../shared/rng';
import { survivalRampFromRemaining } from '../../../../shared/survival';
import { useSurvivalCountdown, SurvivalCountdownBar } from '../../../../shared/SurvivalCountdown';
import KawkabSprite from '../../../../shared/KawkabSprite';
import { GAME_STIMULUS } from '../../../../shared/gamePalette';
import { SORT_SETS, ruleForTrio, setsForTier } from './sets';
import './sortShift.css';

/*
 * Sort It Another Way — generative sorting (D-KEFS Sorting Test, free-sort
 * condition).  [flexibility]
 *
 * Six cards. Split them three and three, then find ANOTHER way to split the
 * same six, and another. The first rule is free; the third costs you something,
 * because you have to let go of the dimension you just used.
 *
 * ── Why this and not another card task ──
 * WCST asks you to DISCOVER an examiner's rule from right/wrong feedback. This
 * asks you to GENERATE rules of your own, which is the other half of the
 * construct and the half the domain was missing. It also removes the thing that
 * made Card Sort unpleasant: there is no hidden rule and no silent switch, so
 * you are never wrong for failing to read the game's mind.
 *
 * ── The way this format usually breaks ──
 * The player finds a grouping that is genuinely sensible, the author never
 * listed it, and the game says no. So validity is DERIVED from the features on
 * the cards rather than matched against blessed answers, and every one of the
 * ten possible 3–3 splits of six cards is enumerated by `npm run validate:sort`
 * before any of this ships. See sets.js.
 *
 * Modes (shared ModeShell): Survival (60s) · Levels (100 each × 3 diff) · Pass n Play.
 */

const RED = GAME_STIMULUS[0];
const BLUE = GAME_STIMULUS[3];

export const SS_PP_TRIALS = 4;
export const SS_LEVEL_SETS = 3;

/** How many of a set's rules must be found to clear it. */
export function rulesNeeded(setDef, mode, diff, level, ramp) {
  const all = setDef.features.length;
  if (mode === 'free') return Math.min(all, (ramp ?? 0) < 0.4 ? 2 : all);
  if (mode === 'passplay') return all;
  const f = ((level || 1) - 1) / 99;
  if (diff === 'easy') return Math.min(all, f < 0.5 ? 2 : 3);
  return all;
}

export function SortShiftEngine({
  mode, diff, level, seed, attempt, onResult, onExit,
  isAr, playSfx, awardPoints, awardFreeRun,
}) {
  const isSurvival = mode === 'free';
  const targetSets = mode === 'passplay' ? (attempt?.trials || SS_PP_TRIALS) : SS_LEVEL_SETS;

  const rngRef = useRef(makeRng((seed ?? 1) >>> 0));
  const queueRef = useRef([]);
  const scoreRef = useRef(0);
  const clearedRef = useRef(0);
  const rulesRef = useRef(0);
  const setsDoneRef = useRef(0);
  const finishedRef = useRef(false);
  const rampRef = useRef(0);

  const [setDef, setSetDef] = useState(null);
  const [order, setOrder] = useState([]);       // shuffled card indices
  const [picked, setPicked] = useState([]);
  const [found, setFound] = useState([]);       // feature keys
  const [msg, setMsg] = useState(null);         // { text, tone }
  const [score, setScore] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [over, setOver] = useState(null);

  const t = useMemo(() => ({
    title: isAr ? 'رتّبها بطريقة أخرى' : 'Sort It Another Way',
    pick: isAr ? 'اختر ثلاث بطاقات تجمعها قاعدة واحدة' : 'Pick three cards that share one rule',
    submit: isAr ? 'أكّد التقسيم' : 'Submit this split',
    clear: isAr ? 'مسح' : 'Clear',
    nothing: isAr ? 'هذه الثلاث لا يجمعها شيء.' : 'Those three have nothing in common.',
    already: isAr ? 'هذه القاعدة وجدتها — ابحث عن غيرها.' : 'You already found that rule — find another.',
    got: (r) => (isAr ? `تقسيم ${r}. ` : `Split ${r}. `),
    another: isAr ? 'الآن جد طريقة أخرى.' : 'Now find another way.',
    allDone: isAr ? 'وجدت كل القواعد.' : 'You found every rule.',
    missed: isAr ? 'لم تجدها' : 'Missed',
    progress: (a, b) => (isAr ? `${a} من ${b} قواعد` : `${a} of ${b} rules`),
    next: isAr ? 'التالي' : 'Next',
    over: isAr ? 'انتهى البقاء' : 'Survival over',
    menu: isAr ? 'القائمة' : 'Menu',
    sets: isAr ? 'مجموعات' : 'Sets cleared',
    rules: isAr ? 'قواعد' : 'Rules found',
  }), [isAr]);

  /* A fresh bag per run, drawn from the tier's sets so a run never repeats a
   * set until the tier is exhausted. */
  const refillQueue = useCallback(() => {
    const tier = mode === 'free'
      ? (rampRef.current < 0.35 ? 'easy' : rampRef.current < 0.7 ? 'med' : 'hard')
      : mode === 'passplay' ? 'med' : (diff === 'easy' ? 'easy' : diff === 'hard' ? 'hard' : 'med');
    const pool = setsForTier(tier).slice();
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rngRef.current() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    queueRef.current = pool;
  }, [diff, mode]);

  const dealSet = useCallback(() => {
    if (!queueRef.current.length) refillQueue();
    const next = queueRef.current.shift() || SORT_SETS[0];
    const idx = next.cards.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(rngRef.current() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    setSetDef(next);
    setOrder(idx);
    setPicked([]);
    setFound([]);
    setRevealed(false);
    setMsg({ text: t.pick, tone: '' });
  }, [refillQueue, t.pick]);

  const finishSurvival = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setOver({ score: scoreRef.current, sets: clearedRef.current, rules: rulesRef.current });
    awardFreeRun?.('sort-shift', clearedRef.current);
    playSfx?.('error');
  }, [awardFreeRun, playSfx]);

  const remaining = useSurvivalCountdown(isSurvival && !over, finishSurvival);
  rampRef.current = isSurvival ? survivalRampFromRemaining(remaining) : 0;

  useEffect(() => {
    finishedRef.current = false;
    rngRef.current = makeRng((seed ?? 1) >>> 0);
    scoreRef.current = 0; clearedRef.current = 0; rulesRef.current = 0; setsDoneRef.current = 0;
    setScore(0); setOver(null);
    refillQueue();
    dealSet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, mode, diff, level]);

  const need = setDef ? rulesNeeded(setDef, mode, diff, level, rampRef.current) : 0;

  const advance = useCallback((cleared) => {
    setsDoneRef.current += 1;
    if (cleared) clearedRef.current += 1;
    if (!isSurvival && setsDoneRef.current >= targetSets) {
      if (finishedRef.current) return;
      finishedRef.current = true;
      if (mode === 'levels') onResult?.({ won: clearedRef.current >= targetSets, score: scoreRef.current });
      else onResult?.({ score: rulesRef.current });
      return;
    }
    dealSet();
  }, [dealSet, isSurvival, mode, onResult, targetSets]);

  const toggle = (cardIdx) => {
    if (revealed || finishedRef.current) return;
    playSfx?.('click');
    setPicked((prev) => (prev.includes(cardIdx)
      ? prev.filter((x) => x !== cardIdx)
      : prev.length < 3 ? [...prev, cardIdx] : prev));
  };

  const submit = () => {
    if (!setDef || picked.length !== 3 || revealed || finishedRef.current) return;
    const rule = ruleForTrio(setDef, picked);
    if (!rule) {
      setMsg({ text: t.nothing, tone: 'bad' });
      playSfx?.('lose');
      return;
    }
    if (found.includes(rule.key)) {
      setMsg({ text: t.already, tone: 'bad' });
      playSfx?.('lose');
      return;
    }
    const nextFound = [...found, rule.key];
    setFound(nextFound);
    setPicked([]);
    rulesRef.current += 1;
    /* Later rules are worth more: the first split is the one you were already
     * looking at, the third means you gave up a working idea. */
    const gain = 20 + nextFound.length * 15;
    scoreRef.current += gain;
    setScore(scoreRef.current);
    playSfx?.('win');
    awardPoints?.(1);
    const done = nextFound.length >= need;
    setMsg({
      text: t.got(isAr ? rule.ar : rule.en) + (done ? t.allDone : t.another),
      tone: 'good',
    });
    if (done) {
      setRevealed(true);
      setTimeout(() => { if (!finishedRef.current) advance(true); }, 1100);
    }
  };

  const giveUp = () => {
    if (revealed || finishedRef.current) return;
    playSfx?.('click');
    setRevealed(true);
    setTimeout(() => { if (!finishedRef.current) advance(false); }, 1600);
  };

  if (!setDef) return null;

  return (
    <div className="ct-ss-root" dir={isAr ? 'rtl' : 'ltr'}>
      <header className="ct-training-play-header">
        <button className="ct-training-chrome-btn" aria-label={t.menu} onClick={() => { playSfx?.('click'); onExit?.(); }}><IconBack size={18} c="currentColor" /></button>
        <div className="ct-training-play-header-body">
          <div className="ct-training-play-title">{t.title}</div>
          <div className="ct-training-play-sub">
            {isSurvival ? `${score}` : `${setsDoneRef.current + 1}/${targetSets}`} · {t.progress(found.length, need)}
          </div>
        </div>
        <div className="ct-training-chrome-spacer" aria-hidden="true" />
      </header>

      {isSurvival && !over ? <SurvivalCountdownBar remaining={remaining} /> : null}

      <div className="ct-ss-stage">
        <div className={`ct-ss-msg${msg?.tone ? ` is-${msg.tone}` : ''}`}>{msg?.text}</div>

        <div className="ct-ss-deck">
          {order.map((cardIdx) => {
            const card = setDef.cards[cardIdx];
            const at = picked.indexOf(cardIdx);
            return (
              <button
                key={card.w.en}
                type="button"
                className={`ct-ss-card${at >= 0 ? ' is-picked' : ''}`}
                onClick={() => toggle(cardIdx)}
                aria-pressed={at >= 0}
              >
                {at >= 0 ? <span className="ct-ss-pip">{at + 1}</span> : null}
                <span
                  className={`ct-ss-glyph ct-ss-glyph--${card.shape}`}
                  style={{ background: card.colour === 'red' ? RED : BLUE }}
                  aria-hidden="true"
                />
                <span className="ct-ss-word">{isAr ? card.w.ar : card.w.en}</span>
              </button>
            );
          })}
        </div>

        <ul className="ct-ss-rules">
          {setDef.features.slice(0, need).map((f) => {
            const got = found.includes(f.key);
            return (
              <li key={f.key} className={`ct-ss-rule${got ? ' is-found' : revealed ? ' is-missed' : ''}`}>
                {got || revealed ? (isAr ? f.ar : f.en) : '···'}
                {!got && revealed ? <span className="ct-ss-missed">{t.missed}</span> : null}
              </li>
            );
          })}
        </ul>

        <div className="ct-ss-actions">
          <button type="button" className="ct-fq-btn ct-fq-btn-pri" disabled={picked.length !== 3 || revealed} onClick={submit}>
            {t.submit}
          </button>
          <button type="button" className="ct-fq-btn" disabled={!picked.length || revealed} onClick={() => { playSfx?.('click'); setPicked([]); }}>
            {t.clear}
          </button>
          <button type="button" className="ct-fq-btn" disabled={revealed} onClick={giveUp}>
            {t.next}
          </button>
        </div>
      </div>

      {over ? (
        <div className="ct-ss-over">
          <div className="ct-ss-over-card">
            <KawkabSprite size={56} />
            <div className="ct-ss-over-title">{t.over}</div>
            <div className="ct-fq-rm ct-fq-rm-training ct-fq-assess-grid">
              <div className="ct-fq-rmi"><div className="ct-fq-rv">{over.score}</div><div className="ct-fq-rl">{isAr ? 'النقاط' : 'Score'}</div></div>
              <div className="ct-fq-rmi"><div className="ct-fq-rv">{over.sets}</div><div className="ct-fq-rl">{t.sets}</div></div>
              <div className="ct-fq-rmi"><div className="ct-fq-rv">{over.rules}</div><div className="ct-fq-rl">{t.rules}</div></div>
            </div>
            <div className="ct-ss-over-actions">
              <button type="button" className="ct-fq-btn ct-fq-btn-pri" onClick={() => { playSfx?.('click'); onExit?.(); }}>{t.menu}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function SortShiftGame({ onBack, workoutMode = false }) {
  const { currentLang, playSfx, awardPoints, awardFreeRun } = useApp();
  const isAr = currentLang === 'ar';
  return (
    <ModeShell
      storageKey="mm_flx_sortshift"
      scienceId="sort-shift"
      title={{ en: 'Sort It Another Way', ar: 'رتّبها بطريقة أخرى' }}
      hints={{
        free: { en: '60s survival · the rules get less obvious', ar: '٦٠ث بقاء · القواعد تصبح أخفى' },
        levels: { en: '3 difficulties · harder sets hide the rule in meaning', ar: '٣ صعوبات · القواعد الأصعب في المعنى' },
        pass: { en: 'Same cards for everyone · pass the device', ar: 'نفس البطاقات للجميع · مرّر الجهاز' },
      }}
      diffLabels={{ easy: { en: 'Easy', ar: 'سهل' }, med: { en: 'Medium', ar: 'متوسط' }, hard: { en: 'Hard', ar: 'صعب' } }}
      pass={{ trials: SS_PP_TRIALS, scoreLabel: { en: 'rules found', ar: 'قواعد' }, lowerBetter: false, diff: 'med' }}
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      workoutMode={workoutMode}
      renderEngine={(p) => (
        <SortShiftEngine
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
