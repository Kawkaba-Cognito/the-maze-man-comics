import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { IconBack } from '../../../../shared/TrainingIcons';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';
import { makeRng } from '../../../../shared/rng';
import { survivalRampFromRemaining } from '../../../../shared/survival';
import { useSurvivalCountdown, SurvivalCountdownBar } from '../../../../shared/SurvivalCountdown';
import KawkabSprite from '../../../../shared/KawkabSprite';
import { GAME_STIMULUS } from '../../../../shared/gamePalette';
import { SORT_SETS, ruleForTrio, setsForTier, levelCfg, LADDER_LEVELS } from './sets';
import DomCoach from '../../../../shared/tutorials/coach/DomCoach';
import { SORT_SHIFT_COACH } from '../../../../shared/tutorials/coach/scripts/sort-shift';
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
 * Modes (shared ModeShell): Survival (60s) · Levels (ONE ladder of 50) · Pass n Play.
 */

const RED = GAME_STIMULUS[0];
const BLUE = GAME_STIMULUS[3];

export const SS_PP_TRIALS = 4;
export const SS_LEVEL_SETS = 3;

/** How many of a set's rules must be found to clear it. */
export function rulesNeeded(setDef, mode, level, ramp) {
  const all = setDef.features.length;
  if (mode === 'free') return Math.min(all, (ramp ?? 0) < 0.4 ? 2 : all);
  if (mode === 'passplay') return all;
  // ONE LADDER: the band says how many rules the level asks for.
  return Math.min(all, levelCfg(level).rules);
}

export function SortShiftEngine({
  mode, level, seed, attempt, onResult, onExit,
  isAr, playSfx, awardPoints, awardFreeRun, coach,
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
  /*
   * ── The live-board coach (COACH-PLAN.md Phase 1) ──
   * Survival only. The taught submit is a REAL scored submit on the real cards;
   * only the 60s clock is held. See SortShiftCoach.
   */
  const stageRef = useRef(null);
  const coachOpen = coach?.open || false;

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
    /* The band's WEIGHTED pool, not a single tier. With only three sets per
       tier, drawing from one tier alone cycled the same three boards for a
       whole band — see the note in sets.js. The bag now holds every set the
       band can serve, each repeated in proportion to its weight, so a run
       still never repeats a set until the bag is empty. */
    const tier = mode === 'free'
      ? (rampRef.current < 0.35 ? 'easy' : rampRef.current < 0.7 ? 'med' : 'hard')
      : null;
    const pool = [];
    if (tier) {
      pool.push(...setsForTier(tier));
    } else {
      const cfg = levelCfg(mode === 'passplay' ? (level || 25) : level);
      for (const [t, w] of Object.entries(cfg.tiers)) {
        const reps = Math.max(1, Math.round(w * 10));
        for (let r = 0; r < reps; r++) pool.push(...setsForTier(t));
      }
    }
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rngRef.current() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    queueRef.current = pool;
  }, [level, mode]);

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

  /* ⚠ The survival clock stops for the lesson — reading must never cost time. */
  const remaining = useSurvivalCountdown(isSurvival && !over && !coachOpen, finishSurvival);
  rampRef.current = isSurvival ? survivalRampFromRemaining(remaining) : 0;

  useEffect(() => {
    finishedRef.current = false;
    rngRef.current = makeRng((seed ?? 1) >>> 0);
    scoreRef.current = 0; clearedRef.current = 0; rulesRef.current = 0; setsDoneRef.current = 0;
    setScore(0); setOver(null);
    refillQueue();
    dealSet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, mode, level]);

  const need = setDef ? rulesNeeded(setDef, mode, level, rampRef.current) : 0;

  // Open the lesson once a Survival set is actually dealt and pointable.
  useEffect(() => {
    if (!coach?.armed || coach.open || mode !== 'free') return;
    if (!setDef || over) return;
    coach.begin();
  }, [coach, mode, setDef, over]);

  // Never strand it on a screen with no cards — it would hold the clock forever.
  useEffect(() => {
    if (coachOpen && over) coach?.end();
  }, [coachOpen, over, coach]);

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

      {/* The `data-coach` attributes are the coach's whole pointing contract —
          see SortShiftCoach and shared/tutorials/coach/anchors.js. */}
      <div className="ct-ss-stage" ref={stageRef}>
        <div className={`ct-ss-msg${msg?.tone ? ` is-${msg.tone}` : ''}`}>{msg?.text}</div>

        <div className="ct-ss-deck" data-coach="deck">
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

        <ul className="ct-ss-rules" data-coach="rules">
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

        <div className="ct-ss-actions" data-coach="actions">
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

        {coachOpen && (
          <DomCoach
            isAr={isAr}
            playSfx={playSfx}
            stageRef={stageRef}
            pack={SORT_SHIFT_COACH}
            /* A rule actually LANDING, not the Submit press: a submit naming no
               rule, or one already found, is rejected by the game and must not
               advance the lesson either.
               ⚠ The lesson deliberately ends before the second rule. Waiting for
               it is the obvious design and a trap — finding a second split is the
               hard part, so an await step there could park a new player in a
               tutorial they cannot leave, on the one screen where being stuck is
               the intended experience. */
            satisfiedFor={() => found.length > 0}
            onFinish={() => coach?.end()}
            onSkip={() => coach?.end()}
          />
        )}
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
        levels: { en: '50 levels · harder sets hide the rule in meaning', ar: '٥٠ مستوى · القواعد الأصعب في المعنى' },
        pass: { en: 'Same cards for everyone · pass the device', ar: 'نفس البطاقات للجميع · مرّر الجهاز' },
      }}
      /* ONE LADDER — no easy/med/hard. See sets.js LADDER. */
      ladder={{ levels: LADDER_LEVELS }}
      pass={{ trials: SS_PP_TRIALS, scoreLabel: { en: 'rules found', ar: 'قواعد' }, lowerBetter: false }}
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      workoutMode={workoutMode}
      renderEngine={(p) => (
        <SortShiftEngine
          key={`${p.mode}-${p.level}-${p.seed}`}
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
