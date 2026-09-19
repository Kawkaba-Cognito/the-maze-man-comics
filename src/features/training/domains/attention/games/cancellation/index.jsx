import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useLayoutEffect,
} from 'react';
import './cancelAtlas.css';
import PlayHud, { ShapeSvg } from '../../../../shared/PlayHud';
import PlayResults from '../../../../shared/PlayResults';
import GamePiece from '../../../../shared/GamePiece';
import {
  shapeArtLabel,
  shapeArtSetForRound,
  shapeArtUrl,
  shapesAreArtSafe,
} from '../../../../shared/shapeArt';
import { createStaircase } from './staircase';
import {
  searchOrganization,
  spatialBias,
  organisationBand,
} from '../../../../shared/searchMetrics.js';
import { useApp } from '../../../../../../context/AppContext';
import { loadJson, saveJson } from '../../../../../../lib/storage';
import {
  SH,
  DM,
  dmLabel,
  prepareLevelRound,
  prepareChallengeSeed,
  prepareChallengePlayState,
  prepareFreeRound,
  freeStageToDiffLv,
  computeRoundStats,
  isLevelUnlocked,
  getLvCfg,
  loadGameSettings,
  FREE_LIVES,
  freeRoundErrorCap,
  freeTapPoints,
  freeRoundClearPoints,
  freeWrongTapPenalty,
  PASS_PLAY_CONFIG,
  PLAY_BOARD,
  FQ_DIFF_KEYS,
  /* FQ_LEVELS_PER_TIER is deliberately NOT imported any more: its only use
     here was the "Next level" gate, which was comparing the wrong number
     (see the note at that call site). Nothing in this file should be
     reasoning about a 100-level tier — the player climbs a 60-rung ladder. */
  FQ_LADDER_LEVELS,
  ladderToTier,
  fqWaveShape,
  fqLadderRoundOpts,
  fqMigrateLadderReached,
  FQ_SECTIONS,
  FQ_MECHANIC_LABELS,
  FQ_MECHANIC_TEACH,
  fqSectionOf,
  fqIndexInSection,
  fqSetsForLevel,
  fqMechanicsAt,
  FQ_WRONG_TAP_PENALTY_SEC,
  fqWaveDifficultyLogit,
  fqLadderDifficultyLogit,
  fqLadderLevelForDifficulty,
  fqSurvivalDifficultyLogit,
  fqSurvivalStageForDifficulty,
} from '../../../../shared/focusQuestData';
import {
  freshAbility,
  updateAbility,
  difficultyForP,
  isSettled,
  abilityStandardError,
  DISPLAY_MIN_N,
} from '../../../../shared/abilityElo.js';
import { reliableChangePooled } from '../../../../assessment/assessmentNorms';
import {
  TrainingMenuBar,
  TrainingPauseModal,
  TrainingQuitModal,
  TrainingChallengeHandoff,
} from '../../../../shared/TrainingChrome';
import CancelPlanetPath, { atlasUrl, BAND_SIGIL } from './CancelPlanetPath.jsx';
import ModePlanetHub from '../../../../shared/ModePlanetHub';
import HubScienceLink from '../../../../shared/HubScienceLink';
import SurvivalIntro from '../../../../shared/SurvivalIntro';
import PassPlaySetup from '../../../../shared/PassPlaySetup';
import { useJuice } from '../../../../shared/juice/useJuice';
import { JuiceLayer } from '../../../../shared/juice/JuiceLayer';
import { ratingLabels } from '../../../../shared/juice/juiceUtils';
import { createTrialLog } from '../../../../shared/trialLog';
import { TUTORIAL_UI } from '../../../../shared/tutorials/tutorialContent';
import { useCoachRun } from '../../../../shared/tutorials/coach/useCoachRun';
import { coachIdFor } from '../../../../shared/tutorials/coach/coachRegistry';
import CancelTaskCoach from './CancelTaskCoach';
import { CANCEL_WORLD_LESSONS, hasWorldLesson } from '../../../../shared/tutorials/coach/scripts/cancel-task-worlds.js';
import {
  prepareAssessmentTrial,
  computeAssessmentSummary,
  saveAssessSession,
  loadAssessHistory,
  compositeBand,
  ASSESSMENT_PROTOCOL,
} from './assessmentData';
import { loadAssessProfile } from '../../../../assessment/assessmentProfile';
import AssessmentReady from '../../../../assessment/AssessmentReady';
import { STR_COMMON } from '../../../../shared/trainingStrings';

// The board. 2D since the 3D scene was retired — it drew a flat, face-on board
// through WebGL because this task cannot take perspective without invalidating
// its own metrics. See the header of CancelBoard2D.jsx.
import CancelBoard2D from './CancelBoard2D';

/** Merge one challenge pass into running per-player aggregates (avg IES/time/etc., total errors). */
function mergeChallengePlayerStats(prev, stats, errCount, nm) {
  const snap = { ...stats, errors: errCount };
  const rounds = [...(prev?.rounds || []), snap];
  const n = rounds.length;
  let iesSum = 0;
  let timeSum = 0;
  let tpsSum = 0;
  let scoreSum = 0;
  let errSum = 0;
  let cpSum = 0;
  /* ⚠ `acc` AND `avgRt` CAN BE null SINCE 2026-09-19 — a round with no responses
     no longer fabricates 100% / 999ms (see computeRoundStats). Summing a null
     silently yields NaN and renders as "NaN%", so they are averaged over the
     rounds that actually HAVE a value, and an all-null set returns null. */
  const accVals = [];
  const rtVals = [];
  for (const r of rounds) {
    iesSum += r.ies || 0;
    timeSum += r.timeUsed || 0;
    tpsSum += r.tps || 0;
    scoreSum += r.score || 0;
    errSum += r.errors || 0;
    cpSum += typeof r.cp === 'number' ? r.cp : 0;
    if (typeof r.acc === 'number') accVals.push(r.acc);
    if (typeof r.avgRt === 'number') rtVals.push(r.avgRt);
  }
  const avg = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);
  const accMean = avg(accVals);
  const rtMean = avg(rtVals);
  return {
    nm,
    rounds,
    ies: +(iesSum / n).toFixed(1),
    timeUsed: +(timeSum / n).toFixed(1),
    errors: errSum,
    cp: cpSum,
    acc: accMean != null ? Math.round(accMean) : null,
    avgRt: rtMean != null ? Math.round(rtMean) : null,
    tps: +(tpsSum / n).toFixed(3),
    score: +(scoreSum / n).toFixed(1),
  };
}

const PROFILE_KEY = 'mm_cancel_fq_v1';

function loadProfile() {
  const parsed = loadJson(PROFILE_KEY);
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return {
      tel: Array.isArray(parsed.tel) ? parsed.tel : [],
      done: parsed.done && typeof parsed.done === 'object' ? parsed.done : {},
      freeBest: parsed.freeBest ?? 0,
      freeBestScore: parsed.freeBestScore ?? 0,
      /* ⚠ THIS FUNCTION IS A WHITELIST, so a field it does not name is dropped
         on every load — silently, and only noticed a session later when the
         thing you earned is gone. `stars` had to be added here the moment it
         was written in `persistLevel`; CLAUDE.md records the identical trap
         costing the Wellbeing SRBAI ratings their persistence. Anything new
         stored on this profile must be listed here too. */
      stars: parsed.stars && typeof parsed.stars === 'object' ? parsed.stars : {},
    };
  }
  return { tel: [], done: {}, freeBest: 0, freeBestScore: 0, stars: {} };
}

function saveProfile(p) {
  // Persistence is optional. A full/blocked localStorage must never strand the
  // player on a cleared board before the result screen can render.
  saveJson(PROFILE_KEY, p);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const PREMIUM_TRAINING_MODES = new Set(['free', 'level', 'challenge']);

/*
 * Two independent conditions, both required.
 *
 * 1. MODE — assessment and adaptive keep the controlled abstract stimuli so
 *    their longitudinal scores stay comparable.
 * 2. READABILITY — the objects actually on this board must be tellable apart.
 *    Derived from the live cells rather than from the pool's tier name, so it
 *    cannot drift when the level data is edited: whatever the curriculum does
 *    next, a board whose shapes collide as illustrations falls back to geometry
 *    automatically. This is what keeps the hard tiers playable, where six of the
 *    near-identical silhouettes all became planets.
 */
function usesPremiumTrainingArt(round, cells) {
  if (!PREMIUM_TRAINING_MODES.has(round?.mode)) return false;
  if (!Array.isArray(cells) || !cells.length) return false;
  return shapesAreArtSafe(new Set(cells.map((cell) => cell.shape)));
}

/** One shape, drawn the way the board draws it — art when the round uses art. */
function TargetGlyph({ round, cells, shape, size, isAr }) {
  const color = round.targetCol || cells.find((cell) => cell.isT)?.fill || 'var(--game-ink)';
  const artSet = shapeArtSetForRound(round);
  const artUrl = usesPremiumTrainingArt(round, cells) ? shapeArtUrl(shape, artSet) : null;
  if (artUrl) {
    return (
      <GamePiece
        shape={shape}
        color={color}
        size={size}
        artUrl={artUrl}
        reduced
        ariaLabel={shapeArtLabel(shape, isAr, artSet)}
      />
    );
  }
  return <ShapeSvg shape={shape} color={color} size={size} />;
}

/*
 * ⚠ THE CUE HAS TO SHOW BOTH SHAPES ON A DUAL ROUND, AND THIS IS THE ONLY
 * PLACE THAT DECIDES WHAT THE PLAYER IS TOLD TO HUNT. Frost Hollow makes the
 * hunt a two-shape hunt (`FQ_LADDER` band 3, `dual`); a cue that kept showing
 * one of them would be telling the player half the rule while the board scored
 * them on all of it — the same shape as a "find A and B" board that contains no
 * B, which `buildCellsFromParams` is careful to make impossible.
 *
 * Deliberately sized DOWN when there are two, so the pair occupies about the
 * space one used to and nothing in the HUD or on the cue card has to reflow.
 */
function CancellationTarget({ round, cells, size, isAr }) {
  const shape = round.target in SH
    ? round.target
    : cells.find((cell) => cell.isT)?.shape || 'circle';
  const shape2 = round.target2 && round.target2 in SH && round.target2 !== shape
    ? round.target2
    : null;
  if (!shape2) {
    return <TargetGlyph round={round} cells={cells} shape={shape} size={size} isAr={isAr} />;
  }
  const each = Math.round(size * 0.74);
  return (
    <span className="cx-dual-cue" aria-hidden={false}>
      <TargetGlyph round={round} cells={cells} shape={shape} size={each} isAr={isAr} />
      <TargetGlyph round={round} cells={cells} shape={shape2} size={each} isAr={isAr} />
    </span>
  );
}

// Parse each shape's SVG markup into a real React element ONCE (cached), so the
// shape is rendered as a React-managed SVG child instead of being injected as an
// HTML string. Injecting markup with `dangerouslySetInnerHTML` on an <svg> node
// is the source of the intermittent "empty square / empty target" bug: setting
// `.innerHTML` on an SVG element during React reconciliation can occasionally
// leave a tile with no rendered shape. Proper React SVG children always render.


/** Universe constellation — 3 main mode planets + small 3D satellite. */
function FqAttentionLightModes({ t, isAr, onFree, onLevels, onChallenge, playSfx }) {
  // The game is now 3D everywhere — no separate "3D" tile; each mode is 3D.
  const items = [
    { k: 'free', lb: t.freeMode, hint: t.hubNodeFreeHint, on: onFree },
    { k: 'levels', lb: t.levelMode, hint: t.hubNodeLevelsHint, on: onLevels },
    { k: 'chal', lb: t.challengeMode, hint: t.hubNodeChallengeHint, on: onChallenge },
  ];
  // ⚠ 2026-09-13, owner: the mode-pick screen had drifted away from every other
  // game ("you changed the 3 modes visual … revert it to look like the others").
  // Back on the shared `ModePlanetHub` — same painted planets, same layout, same
  // ground as the other seventeen games. `CancelModeAtlas.jsx` is kept, unmounted;
  // swapping this one line back restores it.
  return <ModePlanetHub items={items} isAr={isAr} playSfx={playSfx} />;
}

/*
 * Master Prompt Step 8 — the results screen earns its emotion, through
 * PlayResults.jsx's existing `extra` slot (no fork of the shared component).
 * Two cases only: a band was just cleared (level results), or a personal
 * best was just set (Survival results). Never rendered for assess/adaptive
 * — those results screens don't render PlayResults' `extra` slot at all.
 */
function CxResultsExtra({ kind, t, bandTitle, nextBand, prevBest }) {
  if (kind === 'band' && nextBand) {
    return (
      <div className="cx-res">
        <img className="cx-res-sigil" src={atlasUrl(nextBand.sigil)} alt="" aria-hidden="true" />
        <div className="cx-res-head">{t.cxBandCleared(bandTitle)}</div>
        <div className="cx-res-sub">{t.cxNextBand(nextBand.title, nextBand.sub)}</div>
      </div>
    );
  }
  if (kind === 'best') {
    return (
      <div className="cx-res">
        <span className="cx-res-best">{t.cxNewBest}</span>
        <div className="cx-res-sub">{t.cxPrevBest(prevBest)}</div>
      </div>
    );
  }
  return null;
}

/**
 * THE SECOND FACTOR, on the results screen — how the board was searched, as
 * distinct from how much of it was cleared.
 *
 * ⚠ IT IS DELIBERATELY NOT SCORED AND NOT RANKED. There is no "good" search
 * order to beat: a systematic sweep is faster on a dense board, and the
 * literature reports organisation as largely independent of how much you find
 * (Mark et al. 2004). Presenting it as a fourth thing to win would turn an
 * observation into a target and teach people to perform tidiness for the meter.
 *
 * ⚠ IT RENDERS NOTHING RATHER THAN A ZERO when there were too few taps to read
 * a path. `searchOrganization` returns nulls below its own gate; a "0.00" in
 * that case would look like a measurement of a very bad search.
 *
 * ⚠ AND NOTHING RATHER THAN AN APOLOGY EITHER. Caught by playing level 1 rather
 * than by any gate: the early ladder deals THREE targets a wave, which is two
 * moves — below what best-r, the angle measure or a crossing count can mean
 * anything on. The first build printed "Not enough taps this round to read a
 * search path" there, so the block would have spent the first several levels
 * explaining its own absence. A player who has never seen this block is not
 * confused by not seeing it; it simply appears once there is a path to describe.
 */
/**
 * Change in ability since the baseline, on the Survival results.
 *
 * ⚠ IT REPORTS THE FLAT CASE TOO, and that is the point of having it. A
 * progress readout that only ever appears when the number went up is a
 * celebration, not a measurement — and since practice effects guarantee the
 * number eventually goes up, one that only speaks then is guaranteed to be
 * flattering rather than true.
 *
 * ⚠ THE RAW LOGIT AND THE RCI ARE NOT SHOWN. Neither means anything to a
 * player, and a number on screen carries authority a sentence does not
 * (SCI-02's lesson). The sentence is the finding.
 */
function CxProgressBlock({ t, prog }) {
  if (!prog) return null;
  const line = prog.reliable
    ? (prog.direction === 'up' ? t.progUp : t.progDown)
    : t.progFlat;
  return (
    <div className="cx-res cx-res--search">
      <div className="cx-res-head">{t.progTitle}</div>
      <div className="cx-res-sub">{line}</div>
      <div className="cx-res-sub cx-res-sub--fine">{t.progHint(prog.baseN)}</div>
    </div>
  );
}

function CxSearchBlock({ t, org }) {
  if (!org) return null;
  const band = organisationBand(org.orgScore);
  if (!band) return null;
  const bandLabel =
    band === 'systematic' ? t.searchSystematic : band === 'mixed' ? t.searchMixed : t.searchScattered;
  const n = (v) => (v == null ? '—' : v.toFixed(2));
  return (
    <div className="cx-res cx-res--search">
      <div className="cx-res-head">{t.searchTitle}</div>
      <div className="cx-res-sub"><b>{bandLabel}</b></div>
      <div className="cx-res-sub">
        {t.searchSweep} {n(org.bestR)} · {t.searchCrossings} {n(org.intersectRate)} · {t.searchGrid} {n(org.orgAngle)}
      </div>
      <div className="cx-res-sub cx-res-sub--fine">{t.searchHint}</div>
    </div>
  );
}

/**
 * Single consolidated play bar: back · target chip · live stats · pause, then
 * one slim time bar. Replaces the old stacked header + stats row + cue band +
 * two progress bars so the grid (the real task) gets the vertical space.
 * Owns its own rAF tick so the shape grid is not repainted every frame.
 */

/** One metric tile on the assessment results screen, with a colour band chip. */
function AssessMetricTile({ value, label, sub, band, bandLabel }) {
  return (
    <div className={`ct-fq-rmi ct-fq-assess-tile${band ? ` ct-fq-band-${band}` : ''}`}>
      <div className="ct-fq-rv">{value}</div>
      <div className="ct-fq-rl">{label}</div>
      {sub ? <div className="ct-fq-assess-tile-sub">{sub}</div> : null}
      {band ? <span className={`ct-fq-band-chip ct-fq-band-chip-${band}`}>{bandLabel}</span> : null}
    </div>
  );
}

const UI = {
  en: {
    ...STR_COMMON.en,
    back: '‹ BACK',
    title: 'CANCELLATION',
    subtitle: 'Selective attention & inhibition',
    freeMenuSub:
      'Endless rounds that ramp up · one life · the run ends if time runs out or you make too many wrong taps · score from taps, clears & streaks',
    freeStrikes: 'Errors',
    freeLvlLabel: (tier, lv) => `Survival · ${tier} ${lv}`,
    freeRoundsCleared: (n) => `Rounds cleared: ${n}`,
    roundsClearedLabel: 'Rounds cleared',
    freeBest: (n) => `Best clears: ${n}`,
    freeBestScoreLine: (n) => `Best score: ${n}`,
    freeIntroBody:
      'Endless practice that keeps getting harder. You have one life. Each round has its own timer — clear every target before it runs out. Run out of time, or make too many wrong taps in a round, and the run is over. Score on correct taps and full clears; streaks of clears multiply the bonus.',
    hubChamberKicker: '⟡ FOCUS QUEST ⟡',
    hubAttentionWord: 'Cancellation task',
    hubTrainingTag: 'training',
    resultsLevelPass: 'Level passed',
    resultsLevelRetryTitle: 'Try again',
    hubMapAria: 'Modes map — choose a path',
    hubNodeFreeHint: 'Endless · one life · ramps up',
    hubNodeLevelsHint: '60 levels · one ladder · unlock in order',
    hubNodeChallengeHint: 'Same board for all · pick a difficulty',
    thresholdMode: 'Threshold test',
    hubNodeThresholdHint: 'Adaptive · finds your level',
    adaptIntroTitle: 'Adaptive threshold',
    adaptIntroBody:
      'The board gets harder after two clean clears and easier after a miss, zeroing in on the hardest level you can reliably handle (~70% success). About 10–14 short rounds, no feedback during a round — just clear every target before time runs out. You get a single threshold score at the end.',
    adaptResTitle: 'Your threshold',
    adaptResLabel: 'Attention threshold',
    adaptResSub: '0–100',
    adaptResLevel: (tier, lv) => `${tier} · level ${lv}`,
    adaptResMeta: (tr, rev) => `${tr} rounds · ${rev} reversals`,
    adaptRoundLabel: (n) => `Round ${n}`,
    adaptAgain: 'Test again',
    /* ⚠ "bind features" WAS A STALE CLAIM. Colour conjunction was retired on
       2026-08-09 (`computeConjunctionStrength` returns a literal 0, and
       focusQuestData.js says so in as many words). The board has not asked
       anyone to bind a shape to a colour for over a year. What it does ask is
       that you hold a target template and reject look-alikes. */
    menuHint: 'Visual search training: hold a target in mind, reject the look-alikes, and sweep the field—like lab tasks for selective attention.',
    challengeSub: 'Same board for everyone · pick a difficulty · pass the device · best score wins',
    ready: (n) => `Ready — ${n}`,
    goReady: 'Start round',
    chalBulletSame: 'Same grid for every player this round',
    hubMenu: 'Same grid, fair compare.',
    found: 'Found',
    err: 'Errors',
    lvl: 'Level',
    pause: 'Pause',
    quit: 'Quit',
    restart: 'Restart level',
    quitLose: 'Progress on this round will be lost.',
    chalRoundsHint: 'Each player plays once per round · New fair grid each round',
    /* `a` arrives PRE-FORMATTED ('87%' or '—'), because accuracy can legitimately
       be null now — a round with no responses has no accuracy, and `null%` is
       what a bare `${a}%` would have rendered. */
    chalResDetail: (nr, t, e, a, tp) =>
      nr > 1
        ? `${nr}× · ${t}s avg · ${e} err total · ${a} · ${tp} t/s`
        : `${t}s · ${e} err · ${a} · ${tp} t/s`,
    targetsFound: 'Targets found',
    accuracy: 'Accuracy',
    /* ⚠ `accuracy` ABOVE IS NOT RENDERED ON THE LEVEL RESULTS ANY MORE, and the
       reason is the whole point of this pass. It labelled `found/(found+errors)`
       — a PRECISION — so a half-cleared board with no wrong taps read 100%.
       The two measures are now separate and separately labelled: the headline
       carries detection (found / targets) and `precision` carries the other.
       See CANCELLATION-TASK-PLAN.md §3.1. */
    focusScore: 'Focus score',
    focusScoreHint:
      'Focus score = targets found − wrong taps (the d2 test’s concentration score). Precision is the share of your taps that were right.',
    precision: 'Precision',
    /* ── The second factor. See CANCELLATION-TASK-PLAN.md §2.1 ──────────────
       ⚠ `searchHint` SAYS THE BLEND IS OURS, on purpose. The three numbers
       shown are published measures (Dalmaijer et al. 2015); the single word
       above them is an equal-thirds blend of those three that this app
       invented. Presenting our composite in the borrowed authority of the
       literature is the quiet half of the same problem SCI-02 exists for. */
    searchTitle: 'How you searched',
    searchSweep: 'Sweep',
    searchCrossings: 'Crossings',
    searchGrid: 'Along the grid',
    searchSystematic: 'Systematic',
    searchMixed: 'Mixed',
    searchScattered: 'Scattered',
    searchHint:
      'Measured separately from your score — in the research the two are largely independent. “Sweep” is how closely your order followed a row or column, “Crossings” how often your path crossed itself, “Along the grid” how straight your moves were. The one-word summary is this app’s own blend of those three.',
    /* ── Reliable change. See CANCELLATION-TASK-PLAN.md §3.7 ──────────────────
       ⚠ EVERY ONE OF THESE SAYS "ON THIS TASK", and that is not hedging. The
       claim the evidence supports is that practice improves performance on the
       trained task; broad transfer to everyday attention is contested. Dropping
       those three words turns a defensible sentence into an SCI-01 problem.
       ⚠ And the "no reliable change" line is written to be READ AS FINE, not as
       a failure. It is the most common honest outcome, and an app that frames
       it as disappointing is teaching people to distrust a true result. */
    progTitle: 'Since you started',
    progUp: 'Your level on this task has risen by more than measurement noise.',
    progDown: 'Your level on this task has fallen by more than measurement noise.',
    progFlat: 'No change beyond normal variation yet — which is what most short stretches look like.',
    progHint: (n) =>
      `Compared with your first ${n} boards, using a reliable-change criterion (Jacobson & Truax, 1991). Scores wobble on their own, so only movement bigger than that wobble is reported as change.`,
    timeRanOut: 'Time ran out',
    rt: 'Avg RT',
    countdownHint: 'Get ready…',
    survivalCueTitle: 'Your target',
    survivalCueTask: 'Find every tile showing this object.',
    survivalCueReady: 'READY · START',
    survivalCueHint: 'Take a good look. The timer starts only when you tap.',
    fixHint: 'Focus on the centre…',
    cueShape: 'Tap every tile that shows this object.',
    /* ⚠ The dual twin of cueShape. 'this object' is false on a two-shape round,
       and a cue that states the rule wrongly is worse than one that is vague.
       Edit WITH the Arabic copy further down. */
    cueShapeDual: 'Both of these count. Tap every tile showing either one.',
    /* ⚠ The AR twins of these five live in the other dict, ~150 lines down.
       This repo's most repeated bug is editing one half and leaving the other
       saying something else — see CLAUDE.md. Change them in pairs. */
    cueNewTarget: 'New target this set',
    cueNoGo: 'Leave this one alone',
    setOf: (a, b) => `Set ${a} of ${b}`,
    starsEarned: (n) => (n === 1 ? '1 star' : `${n} stars`),
    ruleNew: 'A new rule',
    ruleBegin: 'Begin',
    reviewTitle: 'World complete',
    /* The level map's "?" sheet — everything the removed header said, plus
       what it never did. ⚠ Edit this WITH its Arabic twin further down; a
       one-sided fix to a block this size is this repo's most repeated bug. */
    mapHelpOpen: 'How Level mode works',
    mapHelpTitle: 'Level mode',
    mapHelpClose: 'Got it',
    mapHelpRows: [
      { k: 'The climb', v: '60 levels in one ladder, six worlds of ten. Each world looks different because it is a different place, not a different colour.' },
      { k: 'A rule per world', v: 'Every world introduces one new rule and teaches it before you can fail it. Later worlds keep everything the earlier ones taught.' },
      { k: 'Stars', v: 'One for clearing it, one for clearing it without a wrong tap, one for finishing with a quarter of the clock still unspent.' },
      { k: 'Unlocking', v: 'Clear a level to open the next. Kawkab stands on the one you are up to.' },
      { k: 'The clock', v: 'Every level grants less slack than the one before, all the way up. The last world is meant to be at the edge of what you can reach.' },
    ],
    reviewStars: 'Stars collected',
    reviewAcc: 'Accuracy across the world',
    reviewTaught: 'What it taught',
    reviewNext: 'Next world',
    reviewOn: 'Onward',
    assessMode: '📊 Assessment',
    hubNodeAssessHint: 'Standardized test · track your attention',
    assessIntroTitle: 'Attention Assessment',
    assessIntroBody:
      'A standardized 4-trial Mesulam-style cancellation test (~4 min). A short unscored practice board comes first. Then each trial shows a fresh 7×7 board — find every matching tile within 50 seconds. Work quickly but accurately; wrong taps and missed targets both count.',
    assessIntroMeasures: 'It measures selective attention, processing speed, response inhibition, and attentional stability (how consistent your reaction times are).',
    assessIntroNote:
      'Self-referenced, not diagnostic. For a fair comparison, avoid immediate repeats and use the same device, posture, lighting, and similar time of day.',
    assessStart: 'Start assessment',
    assessPracticeLabel: 'Practice',
    assessThreshold: '🎚️ Adaptive threshold test',
    assessTrialLabel: (n, m) => `Trial ${n} / ${m}`,
    assessResTitle: 'Your results',
    assessIndex: 'Attention Index',
    assessIndexSub: 'Composite · 0–100',
    mDetection: 'Detection',
    mDetectionSub: 'targets found',
    mPrecision: 'Precision',
    mPrecisionSub: 'taps correct',
    mSpeed: 'Speed',
    mSpeedSub: 'targets/sec',
    mRt: 'Reaction',
    mRtSub: 'avg ms',
    mStability: 'Stability',
    mStabilitySub: 'RT consistency',
    mErrors: 'Errors',
    mErrorsSub: 'miss · false',
    mDPrime: 'Sensitivity',
    mDPrimeSub: 'd′ · signal vs noise',
    mBias: 'Response bias',
    mBiasSub: (lbl) => `criterion c · ${lbl}`,
    biasCautious: 'cautious',
    biasBalanced: 'balanced',
    biasImpulsive: 'impulsive',
    mBalance: 'Spatial balance',
    balanceLeft: 'leftward',
    balanceEven: 'even',
    balanceRight: 'rightward',
    scanL: 'starts L',
    scanR: 'starts R',
    scanMid: 'starts center',
    mBalanceSub: (dir, scan) => `${dir} · ${scan}`,
    mOrg: 'Search order',
    mOrgSub: (r) => `best R ${r}`,
    bandHigh: 'Strong',
    bandMid: 'Typical',
    bandLow: 'Developing',
    assessAgain: 'Test again',
    assessViewHistory: '📈 History',
    assessHistTitle: 'Assessment history',
    assessNoHistory: 'No sessions yet — run an assessment to start tracking.',
    assessHistBest: (n) => `Best index: ${n}`,
    assessHistRecent: 'Recent sessions',
    assessVsPrev: (d) => (d > 0 ? `▲ +${d}` : d < 0 ? `▼ ${d}` : '— 0'),
    /* ⚠ `sciTitle` / `sciParas` DELETED 2026-09-19 — they were declared here and
       referenced NOWHERE in the file. The best-written text in the game was
       unreachable, under a title ("Why this trains your brain") that SCI-01
       would not permit anyway. Two of the four paragraphs had also gone stale:
       they described a three-tier Easy/Medium/Hard structure retired in
       2026-08-28, and claimed Hard is conjunction search where "you must bind
       shape and colour" — conjunction was retired 2026-08-09.
       The honest-limits paragraph, which was the good one, now lives in
       `gameScience.js` under `cancel-task` and actually renders, in both
       languages, via the HubScienceLink already mounted in this file.
       Do not re-add a second copy here. */
    sciClose: 'Close',
    /* ⚠ `cxBands` DELETED 2026-09-19. It was a SECOND list of the same six
       worlds, and the two disagreed: it called band 3 "Crowded Sky · A denser
       board" while the map and the rule card call it "Frost Hollow · hunt two
       shapes" — band 3 introduces the DUAL target, not density. Clearing level
       20 therefore promised one thing and the next screen taught another.
       The results callout reads `FQ_SECTIONS` + `FQ_MECHANIC_LABELS` now, the
       same source the level map already used. One name, one place.
       Do not re-add a parallel list here; put world copy in focusQuestData.js. */
    cxNodeSub: (tc, sec, waves) => `${tc} targets · ${sec}s · ${waves} waves`,
    cxBandCleared: (title) => `Band cleared — ${title}`,
    cxNextBand: (title, sub) => `Next: ${title} · ${sub}`,
    cxNewBest: 'New personal best',
    cxPrevBest: (n) => `Previous best: ${n}`,
  },
  ar: {
    ...STR_COMMON.ar,
    back: '‹ رجوع',
    title: 'مهمة الإلغاء',
    subtitle: 'انتباه انتقائي وكبح استجابي',
    freeMenuSub:
      'جولات لا تنتهي وتزداد صعوبة · روح واحدة · تنتهي المحاولة إذا نفد الوقت أو أكثرت النقر الخاطئ في الجولة · النقاط للمسات والإكمال والسلسلة',
    freeStrikes: 'أخطاء',
    freeLvlLabel: (tier, lv) => `حر · ${tier} ${lv}`,
    freeRoundsCleared: (n) => `جولات ناجحة: ${n}`,
    roundsClearedLabel: 'جولات مكتملة',
    freeBest: (n) => `أفضل إكمال: ${n}`,
    freeBestScoreLine: (n) => `أفضل نقاط: ${n}`,
    freeIntroBody:
      'تدريب لا ينتهي ويزداد صعوبة باستمرار. لديك روح واحدة. لكل جولة مؤقتها الخاص — أكمل كل الأهداف قبل نفاده. إذا نفد الوقت أو أكثرت النقر الخاطئ في الجولة تنتهي المحاولة. اجمع النقاط باللمسات الصحيحة وإكمال الجولات؛ السلاسل تضاعف المكافأة.',
    hubChamberKicker: '⟡ مهمة التركيز ⟡',
    hubAttentionWord: 'مهمة الشطب',
    hubTrainingTag: 'تدريب',
    resultsLevelPass: 'المستوى اجتُاز',
    resultsLevelRetryTitle: 'حاول مجددًا',
    hubMapAria: 'خريطة الأوضاع — اختر مسارًا',
    hubNodeFreeHint: 'لا ينتهي · حياة واحدة · يزداد صعوبة',
    hubNodeLevelsHint: '٦٠ مستوى · سلّم واحد · بالترتيب',
    hubNodeChallengeHint: 'نفس اللوحة للجميع · اختر الصعوبة',
    thresholdMode: 'اختبار العتبة',
    hubNodeThresholdHint: 'تكيّفي · يحدّد مستواك',
    adaptIntroTitle: 'العتبة التكيّفية',
    adaptIntroBody:
      'تزداد اللوحة صعوبة بعد إكمالين نظيفين وتسهُل بعد أي خطأ، لتستقر عند أصعب مستوى يمكنك إتقانه باستمرار (نجاح ~٧٠٪). نحو ١٠–١٤ جولة قصيرة، بلا تغذية راجعة أثناء الجولة — فقط أكمل كل الأهداف قبل نفاد الوقت. تحصل على درجة عتبة واحدة في النهاية.',
    adaptResTitle: 'عتبتك',
    adaptResLabel: 'عتبة الانتباه',
    adaptResSub: '٠–١٠٠',
    adaptResLevel: (tier, lv) => `${tier} · مستوى ${lv}`,
    adaptResMeta: (tr, rev) => `${tr} جولات · ${rev} انعكاسات`,
    adaptRoundLabel: (n) => `جولة ${n}`,
    adaptAgain: 'أعد الاختبار',
    /* ⚠ «ربط السمات» كان ادعاءً قديماً — أُلغي التزاوج اللوني في ٢٠٢٦-٠٨-٠٩.
       انظر التعليق الإنجليزي. */
    menuHint: 'تدريب بحث بصري: احفظ الهدف في ذهنك، تجاهل الأشباه، وامسح الحقل كلّه—كمهام الانتباه الانتقائي في المختبر.',
    challengeSub: 'نفس اللوحة للجميع · اختر الصعوبة · مرّر الجهاز',
    ready: (n) => `جاهز — ${n}`,
    goReady: 'ابدأ الجولة',
    chalBulletSame: 'نفس الشبكة لكل اللاعبين في هذه الجولة',
    hubMenu: 'شبكة واحدة، مقارنة عادلة.',
    found: 'مُوجَد',
    err: 'أخطاء',
    lvl: 'مستوى',
    pause: 'إيقاف',
    quit: 'خروج',
    restart: 'إعادة المستوى',
    quitMenu: 'خروج للقائمة',
    quitLose: 'ستفقد تقدم هذه الجولة.',
    yesQuit: 'نعم',
    keep: 'إكمال',
    chalRoundsHint: 'كل لاعب يلعب مرة في الجولة · شبكة جديدة عادلة كل جولة',
    /* `a` يصل مُنسَّقاً مسبقاً — انظر التعليق الإنجليزي. */
    chalResDetail: (nr, t, e, a, tp) =>
      nr > 1
        ? `${nr}× · ${t}s معدل · ${e} أخطاء المجموع · ${a} · ${tp} هدف/ث`
        : `${t}s · ${e} أخطاء · ${a} · ${tp} هدف/ث`,
    targetsFound: 'الأهداف الموجودة',
    accuracy: 'الدقة',
    /* ⚠ الترجمة العربية كانت تستخدم «الدقة» للمفهومين معاً — انظر التعليق
       الإنجليزي أعلاه. القياسان صارا منفصلين الآن. */
    focusScore: 'درجة التركيز',
    focusScoreHint:
      'درجة التركيز = الأهداف الموجودة − النقرات الخاطئة (درجة التركيز في اختبار d2). أمّا الإتقان فهو نسبة نقراتك الصحيحة.',
    precision: 'الإتقان',
    /* ── العامل الثاني — انظر التعليق الإنجليزي. `searchHint` يذكر صراحةً أن
       الخلاصة من تأليف التطبيق لا من الأدبيات. */
    searchTitle: 'كيف بحثت',
    searchSweep: 'المسح',
    searchCrossings: 'التقاطعات',
    searchGrid: 'محاذاة الشبكة',
    searchSystematic: 'منهجي',
    searchMixed: 'متفاوت',
    searchScattered: 'متبعثر',
    searchHint:
      'يُقاس بمعزل عن درجتك — والبحث العلمي يجد الاثنين مستقلّين إلى حدّ بعيد. «المسح» مدى اتّباع ترتيبك لصفّ أو عمود، و«التقاطعات» كم مرّة تقاطع مسارك مع نفسه، و«محاذاة الشبكة» مدى استقامة حركاتك. أمّا الكلمة الواحدة فهي خلاصة من تأليف هذا التطبيق لهذه المقاييس الثلاثة.',
    /* ── التغيّر الموثوق — انظر التعليق الإنجليزي. كل جملة مقيّدة بـ«في هذه
       المهمة»، وسطر «لا تغيّر» مكتوب ليُقرأ كنتيجة طبيعية لا كإخفاق. */
    progTitle: 'منذ أن بدأت',
    progUp: 'ارتفع مستواك في هذه المهمة بما يتجاوز خطأ القياس.',
    progDown: 'انخفض مستواك في هذه المهمة بما يتجاوز خطأ القياس.',
    progFlat: 'لا تغيّر يتجاوز التذبذب المعتاد بعد — وهذا ما تبدو عليه معظم الفترات القصيرة.',
    progHint: (n) =>
      `مقارنةً بأول ${n.toLocaleString('ar-EG')} لوحة لعبتها، وفق معيار التغيّر الموثوق (جاكوبسون وتراكس، ١٩٩١). الدرجات تتذبذب من تلقاء نفسها، لذا لا يُعلَن عن تغيّر إلا إذا تجاوز ذلك التذبذب.`,
    timeRanOut: 'انتهى الوقت',
    rt: 'متوسط زمن الاستجابة',
    countdownHint: 'استعد…',
    survivalCueTitle: 'هدفك',
    survivalCueTask: 'اعثر على كل بطاقة تعرض هذا العنصر.',
    survivalCueReady: 'جاهز · ابدأ',
    survivalCueHint: 'انظر جيدًا. يبدأ المؤقت فقط عند الضغط.',
    fixHint: 'ركّز على المركز…',
    cueShape: 'المس كل مربع يحتوي على هذا الجسم.',
    cueShapeDual: 'كلاهما يُحتسب. المس كل مربع فيه أيّ منهما.',
    /* The AR half of the pairs added with the worlds — edited together with
       the EN half above, never alone. */
    cueNewTarget: 'هدف جديد في هذه الجولة',
    cueNoGo: 'اترك هذا ولا تلمسه',
    setOf: (a, b) => `الجولة ${a} من ${b}`,
    starsEarned: (n) => (n === 1 ? 'نجمة واحدة' : n === 2 ? 'نجمتان' : `${n} نجوم`),
    ruleNew: 'قاعدة جديدة',
    ruleBegin: 'ابدأ',
    reviewTitle: 'اكتمل العالم',
    /* The Arabic twin of `mapHelp*` above — the two are edited together. */
    mapHelpOpen: 'كيف يعمل وضع المستويات',
    mapHelpTitle: 'وضع المستويات',
    mapHelpClose: 'فهمت',
    mapHelpRows: [
      { k: 'الرحلة', v: '٦٠ مستوى في سلّم واحد، ستة عوالم في كل منها عشرة. كل عالم يبدو مختلفاً لأنه مكان مختلف، لا لون مختلف.' },
      { k: 'قاعدة لكل عالم', v: 'كل عالم يقدّم قاعدة جديدة ويعلّمها قبل أن تخطئ فيها. والعوالم اللاحقة تحتفظ بكل ما علّمته السابقة.' },
      { k: 'النجوم', v: 'نجمة لإتمامه، ونجمة لإتمامه دون نقرة خاطئة، ونجمة لإنهائه وربع الوقت ما زال باقياً.' },
      { k: 'الفتح', v: 'أتمم مستوى ليُفتح الذي يليه. وكوكب يقف على المستوى الذي وصلت إليه.' },
      { k: 'الوقت', v: 'كل مستوى يمنحك هامشاً أقل من الذي قبله، حتى القمة. والعالم الأخير مقصود أن يكون عند حدّ ما تستطيع.' },
    ],
    reviewStars: 'النجوم المجموعة',
    reviewAcc: 'الدقة في هذا العالم',
    reviewTaught: 'ما الذي علّمه',
    reviewNext: 'العالم التالي',
    reviewOn: 'إلى الأمام',
    assessMode: '📊 تقييم',
    hubNodeAssessHint: 'اختبار موحّد · تابع انتباهك',
    assessIntroTitle: 'تقييم الانتباه',
    assessIntroBody:
      'اختبار شطب موحّد من ٤ محاولات على نمط ميسولام (~٤ د). تبدأ بلوحة تدريب قصيرة غير محسوبة. ثم تعرض كل محاولة لوحة 7×7 جديدة — جِد كل المربعات المطابقة خلال ٥٠ ثانية. اعمل بسرعة وبدقة؛ النقر الخاطئ والأهداف المفقودة يُحتسبان.',
    assessIntroMeasures: 'يقيس الانتباه الانتقائي وسرعة المعالجة وكبح الاستجابة واستقرار الانتباه (مدى ثبات زمن استجابتك).',
    assessIntroNote:
      'مرجعي ذاتي وليس تشخيصاً. للمقارنة العادلة، تجنّب الإعادة الفورية واستخدم الجهاز والوضعية والإضاءة نفسها وفي وقت متقارب من اليوم.',
    assessStart: 'ابدأ التقييم',
    assessPracticeLabel: 'تدريب',
    assessThreshold: '🎚️ اختبار العتبة التكيّفي',
    assessTrialLabel: (n, m) => `محاولة ${n} / ${m}`,
    assessResTitle: 'نتائجك',
    assessIndex: 'مؤشر الانتباه',
    assessIndexSub: 'مركّب · ٠–١٠٠',
    mDetection: 'الاكتشاف',
    mDetectionSub: 'الأهداف المُوجَدة',
    mPrecision: 'الدقة',
    mPrecisionSub: 'نقرات صحيحة',
    mSpeed: 'السرعة',
    mSpeedSub: 'هدف/ث',
    mRt: 'زمن الاستجابة',
    mRtSub: 'متوسط مللي ثانية',
    mStability: 'الثبات',
    mStabilitySub: 'ثبات زمن الاستجابة',
    mErrors: 'الأخطاء',
    mErrorsSub: 'فوات · خاطئ',
    mDPrime: 'الحساسية',
    mDPrimeSub: 'd′ · إشارة مقابل ضوضاء',
    mBias: 'انحياز الاستجابة',
    mBiasSub: (lbl) => `المعيار c · ${lbl}`,
    biasCautious: 'متحفّظ',
    biasBalanced: 'متوازن',
    biasImpulsive: 'متهوّر',
    mBalance: 'التوازن المكاني',
    balanceLeft: 'نحو اليسار',
    balanceEven: 'متوازن',
    balanceRight: 'نحو اليمين',
    scanL: 'يبدأ يسارًا',
    scanR: 'يبدأ يمينًا',
    scanMid: 'يبدأ وسطًا',
    mBalanceSub: (dir, scan) => `${dir} · ${scan}`,
    mOrg: 'تنظيم البحث',
    mOrgSub: (r) => `أفضل R ${r}`,
    bandHigh: 'قوي',
    bandMid: 'معتاد',
    bandLow: 'قيد التطوّر',
    assessAgain: 'أعد الاختبار',
    assessViewHistory: '📈 السجل',
    assessHistTitle: 'سجل التقييمات',
    assessNoHistory: 'لا جلسات بعد — شغّل تقييماً لتبدأ المتابعة.',
    assessHistBest: (n) => `أفضل مؤشر: ${n}`,
    assessHistRecent: 'الجلسات الأخيرة',
    assessVsPrev: (d) => (d > 0 ? `▲ +${d}` : d < 0 ? `▼ ${d}` : '— 0'),
    /* ⚠ حُذف `sciTitle` / `sciParas` — انظر التعليق الإنجليزي. النص انتقل إلى
       `gameScience.js` حيث يُعرض فعلاً. لا تُعِد نسخة ثانية هنا. */
    sciClose: 'إغلاق',
    /* ⚠ حُذفت `cxBands` — كانت قائمة ثانية لنفس العوالم الستة وتناقض الخريطة.
       انظر التعليق الإنجليزي. أسماء العوالم في `FQ_SECTIONS` وحدها. */
    /* ⚠ ٣–١٠ takes the plural (جولات) and ١١+ the singular accusative (جولة).
       The ladder only ever asks for 3–8, so the second branch is defensive —
       but a number-carrying string that only happens to be right is how the EN
       and AR halves of a dict drift apart. */
    cxNodeSub: (tc, sec, waves) => `${tc.toLocaleString('ar-EG')} هدفًا · ${sec.toLocaleString('ar-EG')}ث · ${waves.toLocaleString('ar-EG')} ${waves >= 3 && waves <= 10 ? 'جولات' : 'جولة'}`,
    cxBandCleared: (title) => `اكتمل النطاق — ${title}`,
    cxNextBand: (title, sub) => `التالي: ${title} · ${sub}`,
    cxNewBest: 'أفضل نتيجة جديدة',
    cxPrevBest: (n) => `الأفضل سابقًا: ${n.toLocaleString('ar-EG')}`,
  },
};

export default function CancellationTaskGame({ onBack, workoutMode = false, assessmentMode = false, onAssessmentExit, onAssessmentComplete, assessmentLabel, assessmentStep, assessmentDomainId = 'attention' }) {
  const { playSfx, currentLang, awardLadderWin, awardFreeRun } = useApp();
  const isAr = currentLang === 'ar';
  const t = isAr ? UI.ar : UI.en;

  // WORKOUT MODE: launched from the Daily Workout — skip the hub and jump
  // straight into free play; the workout shell owns timing and exit.
  const workoutLaunched = useRef(false);
  useEffect(() => {
    if (workoutMode && !workoutLaunched.current) { workoutLaunched.current = true; startFreeMode(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutMode]);
  const settings = loadGameSettings();

  const [profile, setProfile] = useState(() => loadProfile());
  // When launched as an assessment (from the training-page fox), skip the game
  // hub and go straight into the standardized assessment intro.
  const [phase, setPhase] = useState(assessmentMode ? 'assessStart' : 'hub');

  const [round, setRound] = useState(null);
  const [cells, setCells] = useState([]);
  const [playStep, setPlayStep] = useState('idle');
  const [cdShow, setCdShow] = useState(false);
  // True for the 220ms the countdown veil takes to lift off the board
  // (Master Prompt Carry A) — the board underneath is already laid out and
  // completely static by this point; only the departing veil moves, and it
  // finishes BEFORE playStep becomes 'running', so it costs no measured time.
  const [cdLeaving, setCdLeaving] = useState(false);
  const [cdVal, setCdVal] = useState(3);
  // Central fixation cue shown before each assessment grid — controls the start
  // gaze so Center-of-Cancellation, scan laterality and RT have a clean origin.
  const [fixShow, setFixShow] = useState(false);
  // "Here's your target" cue. Levels use it as a brief automatic flash when
  // countdown is disabled; Survival keeps it open until the player explicitly
  // taps Ready, so studying the object never consumes round time.
  const [cueShow, setCueShow] = useState(false);
  const [found, setFound] = useState(0);
  const [errors, setErrors] = useState(0);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [quitOpen, setQuitOpen] = useState(false);
  // Mirrors clearingRef into render state: the ref alone blocks taps/scoring
  // correctly during the clear-celebration hold, but the board's own
  // `interactive` prop never saw it, so pieces stayed enabled and focusable
  // with no visible reason a tap did nothing.
  const [clearing, setClearing] = useState(false);
  // A wrong tap silently banked a 3s time cost with nothing on screen
  // connecting the two. A brief chip near the time bar makes the penalty
  // legible — never shown during the coach or assessment (see the gate at the
  // set site, which already suppresses the real penalty there too).
  const [penaltyFlash, setPenaltyFlash] = useState(null);
  const penaltyFlashTimeoutRef = useRef(null);
  const [lastResult, setLastResult] = useState(null);

  const [chalNames, setChalNames] = useState(['Player 1', 'Player 2']);
  const [chalSeed, setChalSeed] = useState(null);
  const [chalIdx, setChalIdx] = useState(0);
  const [chalTurnOpen, setChalTurnOpen] = useState(false);
  const [chalRoundsTotal, setChalRoundsTotal] = useState(1);
  const [chalRoundIdx, setChalRoundIdx] = useState(0);
  const [chalDiff, setChalDiff] = useState('hard');
  const chalDiffRef = useRef('hard');

  const tlRef = useRef(0);
  const tlimRef = useRef(0);
  const runRef = useRef(false);
  const timerRunIdRef = useRef(0);
  const pendingPenaltyRef = useRef(0);
  const lastTapRef = useRef(0);
  // Which cell the last accepted tap landed on — the debounce in onCellTap is
  // scoped to a repeat of THAT cell, never to the next tap anywhere.
  const lastTapIdxRef = useRef(-1);
  const tapsRef = useRef([]);
  const warned10Ref = useRef(false);
  const roundRef = useRef(null);
  const gridWrapRef = useRef(null);
  const talliesRef = useRef({ found: 0, errors: 0 });
  // Phase-1 per-response capture (feeds spatial / search-organization / SDT
  // metrics). cellsRef mirrors the cells array so tap handling can run its side
  // effects OUTSIDE the setCells updater (StrictMode double-invokes updaters in
  // dev, which would double-log). roundOrdRef = response rank within the round;
  // foundIdxRef = set of found target indices (for omission positions);
  // gridOnsetRef = perf timestamp when the grid became interactive (for tOn).
  const cellsRef = useRef([]);
  const roundOrdRef = useRef(0);
  const foundIdxRef = useRef(new Set());
  // Ordered list of found-target positions {idx,row,col} in tap order — needed
  // for Center-of-Cancellation and "which side did you scan first" laterality.
  const roundFoundSeqRef = useRef([]);
  const gridOnsetRef = useRef(0);
  const chalIdxRef = useRef(0);
  const chalNamesRef = useRef(chalNames);
  const chalScoresRef = useRef([]);
  const chalRoundsTotalRef = useRef(1);
  const chalCycleRef = useRef(0);
  const roundEndedRef = useRef(false);
  // ⚠ TRIAL (2026-09-12, owner: "add more waves to each level" — clarified
  // as multiple rounds back-to-back within one level, not a new mechanic).
  // A "level" on the ladder used to be exactly one board. Now it is
  // LEVEL_WAVES boards in a row, same (diff, li) config re-rolled fresh
  // each time via prepareLevelRound — clearing ALL of them is what wins
  // the level; losing ANY of them ends it immediately, same binary
  // semantics a single-round level already had. levelWaveStatsRef holds
  // each cleared wave's raw scoring inputs (never derived stats) so the
  // FINAL results screen can run computeRoundStats ONCE on the true totals
  // rather than averaging three already-rounded numbers.
  // ⚠ 2026-09-13: the count is no longer flat. It comes from the WORLD
  // (`fqSetsForLevel`) and runs 3 · 4 · 5 · 6 · 7 · 8 across the six of them —
  // so a level genuinely gets longer as the ladder climbs, which is what "each
  // level will be longer and has multiple sets" asked for. The constant stays
  // as the fallback for any caller that has no ladder level to ask about (Pass
  // n Play and the assessment never come through here, but
  // `r.wavesTotal ?? LEVEL_WAVES` is read in two places).
  // ⚠ 2026-09-18: and the waves are no longer IDENTICAL either. Each one is a
  // rung — targets climb and the clock tightens across the level — which is
  // what `fqLadderRoundOpts(lv, waveIdx)` carries into `prepareLevelRound`.
  const LEVEL_WAVES = 3;
  // The rule card waiting to be read, and the world review waiting to be shown.
  const [pendingRule, setPendingRule] = useState(null);
  const [sectionReview, setSectionReview] = useState(null);
  const levelWaveIdxRef = useRef(0);
  // The previous set's target, so the SWITCH rule can guarantee a change
  // rather than leave it to a re-roll that repeats about one time in six.
  const lastWaveTargetRef = useRef(null);
  const levelWaveStatsRef = useRef([]);
  // `startLevelGame` is declared further down this component (after
  // `endRound`), so `endRound`'s own useCallback cannot close over it
  // directly without a temporal-dead-zone error at render time — same
  // problem `endRoundRef` two names below already solves for the reverse
  // direction. Kept current by the effect right after startLevelGame's
  // own definition.
  const startLevelGameRef = useRef(null);
  // True for the brief hold between the last target falling and the round
  // actually ending (see the clear-celebration in onCellTap) — guards BOTH the
  // tap handler and the safety-net auto-win effect below so a stray tap or a
  // re-render during that hold cannot score a false alarm or re-fire the win.
  // Cleared inside endRound itself, the one choke point every path already
  // runs through.
  const clearingRef = useRef(false);
  // The celebration hold's setTimeout id — cleared on unmount and on
  // clearPlayRoundState so a hold in flight when the player quits/backs out
  // never fires endRound (persistLevel + a live AppContext award) against an
  // already-torn-down round.
  const clearHoldTimeoutRef = useRef(null);
  // 'win' now plays at the START of the clear-celebration hold (onCellTap),
  // not 420ms later when endRound actually runs — the ring plays silently and
  // the fanfare landed on the results screen. Set there, consumed (and reset)
  // by whichever endRound branch would otherwise have played it itself.
  const winPlayedRef = useRef(false);
  const endRoundRef = useRef((_won) => {});
  const trialLogRef = useRef(null);
  /* ── ABILITY (theta), the Rasch/Elo rating ────────────────────────────────
   * Held in a ref so an update mid-round cannot cause a re-render of a live
   * board, and mirrored into the profile so it survives the session.
   *
   * ⚠ IT ADVISES AND NEVER GATES. Progression is unlocked by clearing levels,
   * exactly as before; theta chooses which survival board to deal next and
   * which level to SUGGEST. A player who beat level 40 beat level 40.
   *
   * ⚠ Seeded from the player's own ladder progress, which is the best prior
   * available on a device with no backend — the alternative, a global zero,
   * would open a returning player's first survival run at a board far below
   * them and spend twenty trials climbing back. */
  const abilityRef = useRef(null);
  /* The profile, readable from a callback with no deps. `ensureAbility` runs
     inside endRound, which must not re-create itself every time the profile
     changes — that would tear down and rebuild the round-ending path mid-round. */
  const profileRef = useRef(profile);
  useEffect(() => { profileRef.current = profile; }, [profile]);
  /* ⚠ EVERY READ GOES THROUGH HERE. An earlier version had a lazy accessor that
     nothing ever called, so the ref stayed null and the seeding below never ran
     — theta would have started every player at 0 regardless of their ladder
     progress. eslint caught it as an unused variable, which is the only signal
     there was: seeding silently not happening looks exactly like seeding. */
  const ensureAbility = useCallback(() => {
    if (!abilityRef.current) {
      const stored = profileRef.current?.ability;
      abilityRef.current = stored && Number.isFinite(stored.theta)
        ? stored
        : freshAbility(fqLadderDifficultyLogit(
          Math.max(1, fqMigrateLadderReached(profileRef.current?.done || {}) || 1),
        ));
    }
    return abilityRef.current;
  }, []);
  /** Record one board against theta. `b` is that board's difficulty in logits. */
  const bankAbility = useCallback((b, cleared) => {
    const prev = ensureAbility();
    const next = updateAbility(prev, { b, cleared });
    abilityRef.current = next;
    setProfile((p) => {
      /* ⚠ THE BASELINE IS TAKEN ONCE, AT THE MOMENT THE ESTIMATE FIRST BECOMES
         SHOWABLE, and never moved afterwards. Re-baselining on every session
         would make "have you improved?" unanswerable: each comparison would be
         against a version of you that already included the improvement.
         Taken at n = DISPLAY_MIN_N rather than at n = 1 because theta's first
         boards are dominated by the seed and by a K of ~1.0 — a baseline there
         would be measuring the cold start, not the player. */
      const baseline = p.abilityBaseline
        || (next.n >= DISPLAY_MIN_N
          ? { theta: next.theta, n: next.n, ts: new Date().toISOString() }
          : null);
      const merged = {
        ...p,
        ability: { theta: next.theta, n: next.n },
        ...(baseline ? { abilityBaseline: baseline } : {}),
      };
      saveProfile(merged);
      return merged;
    });
    return next;
  }, [ensureAbility]);

  /**
   * Change in ability since the baseline, or null when there is nothing
   * defensible to say.
   *
   * ⚠ IT REPORTS "BEYOND MEASUREMENT NOISE", NOT "BETTER". Cognitive scores
   * move on their own — sleep, time of day, motivation — and an app that
   * celebrates every upward wobble is teaching a false lesson about the user's
   * own mind. |RCI| >= 1.96 (Jacobson & Truax 1991) is the criterion, and each
   * side carries its own standard error because a 20-board baseline is far less
   * precise than a 200-board follow-up.
   *
   * ⚠ THE CLAIM IS SCOPED TO THIS TASK, and that scoping is load-bearing rather
   * than cautious. Practice effects on cancellation are large and one-way
   * (Ruff 2&7: +11.4 on controlled-search speed at four weeks, with no
   * intervention), so a rise here is exactly what repetition produces. Saying
   * "on this task" is what makes reporting it honest at all — see the claim
   * boundary in CANCELLATION-TASK-PLAN.md §2.4.
   */
  const abilityProgress = useCallback(() => {
    const ab = abilityRef.current;
    const base = profileRef.current?.abilityBaseline;
    if (!ab || !isSettled(ab) || !base || !Number.isFinite(base.theta)) return null;
    if (ab.n <= base.n) return null;
    const sePre = abilityStandardError(base.n);
    const sePost = abilityStandardError(ab.n);
    const rc = reliableChangePooled(ab.theta - base.theta, sePre, sePost);
    if (!rc) return null;
    return { ...rc, delta: +(ab.theta - base.theta).toFixed(3), n: ab.n, baseN: base.n };
  }, []);

  const freeStageRef = useRef(0);
  /* Per-ROUND search paths for the whole survival run. Kept separate rather
     than concatenated: each board is its own search, and joining two boards'
     paths invents a jump between them that would report a tidy player as
     chaotic. Same reason the level's waves stay separate. */
  const freeSearchRef = useRef([]);
  const freeRoundsWonRef = useRef(0);
  const freeLivesRef = useRef(FREE_LIVES);
  const [freeLives, setFreeLives] = useState(FREE_LIVES);
  const [freeScore, setFreeScore] = useState(0);
  const freeScoreRef = useRef(0);
  const freeStreakRef = useRef(0);
  const assessTrialsRef = useRef([]);
  const assessTapsRef = useRef([]);
  const assessIdxRef = useRef(0);
  const assessPracticeAttemptsRef = useRef(0);
  const staircaseRef = useRef(null); // adaptive 2-down/1-up threshold engine
  const [assessResult, setAssessResult] = useState(null);
  const [assessHistory, setAssessHistory] = useState(() => loadAssessHistory());

  const juice = useJuice();
  const rLabels = ratingLabels(isAr);
  // Cancel-task teaches INSIDE the live Survival round (CancelTaskCoach) rather
  // than in a modal over a mock grid: Dr Kawkab and the pointing hand sit on the
  // real board and the player clears a real target. `coachOpen` holds the round
  // clock while that happens — see the timer effect — so reading costs no time.
  const tutLabels = TUTORIAL_UI[isAr ? 'ar' : 'en'];
  const tutReplayHint = tutLabels.replayTutorial;
  const boardApiRef = useRef(null);
  const startFreeModeRef = useRef(null);
  // The Survival "ready" card claims aria-modal — a real claim needs a focus
  // target, or a screen-reader user is told they're in a dialog and put
  // nowhere. Also makes Enter-to-start work without hunting for the button.
  const readyBtnRef = useRef(null);

  /*
   * The arm/open/persist machinery is `useCoachRun` (COACH-PLAN.md Phase 0), so
   * the other seventeen games get it from ModeShell instead of copying this.
   * `armed` = a run is owed (first ever visit, or the player pressed "How to
   * play"); it becomes `open` once a Survival round is actually on screen.
   *
   * ⚠ THE ID IS VERSIONED — `'cancel-task@coach1'`, from coachRegistry.js, never
   * the plain game key. `shouldRunOnboarding` keys off it in
   * `mm_tutorial_prefs_v2`, and the RETIRED three-slide carousel already wrote a
   * `'cancel-task'` flag: every player who opened this game before the
   * 2026-08-28 rewrite had `{skipped:true}` or `{completed:true}` stored, so
   * under the plain id `armed` would begin `false` and the new lesson — the one
   * that teaches decoys, the thing this game actually measures — would never
   * auto-run for them. Fresh installs only, silently. Bump the suffix again if
   * the lesson materially changes.
   */
  const coach = useCoachRun(coachIdFor('cancel-task'), {
    onReplay: () => {
      // The hub's "?" replays the lesson — but the lesson lives on a live
      // board, so arming it has to drop straight into Survival.
      startFreeModeRef.current?.();
    },
  });
  /*
   * ── THE WORLD LESSON (2026-09-17) ────────────────────────────────────────
   * A second, separate coach run: the one the ladder fires automatically when a
   * band introduces a rule. It is NOT routed through `useCoachRun`, and that is
   * deliberate — that hook is keyed to ONE id (`cancel-task@coach1`) and ending
   * a run writes that id's done-flag. Reusing it would mean finishing the
   * Tempest lesson silently marks the game's base onboarding as seen, so a
   * player who met Survival later would never get the introduction.
   */
  const [worldLesson, setWorldLesson] = useState(null);
  const worldLessonRef = useRef(null);
  worldLessonRef.current = worldLesson;

  /*
   * ⚠ EVERY GUARD IN THIS FILE READS `coachOpen`, SO THE WORLD LESSON MUST BE
   * PART OF IT. The round clock, the wrong-tap time penalty, the error tally
   * and the auto-win are all suppressed while a lesson is open — and CLAUDE.md
   * records that guarding only SOME of those is how a tutorial became losable
   * last time. Folding the two runs into one boolean here means none of those
   * call sites can forget about the new one.
   */
  const coachOpen = coach.open || !!worldLesson;
  const coachArmed = coach.armed;
  /* Read inside `onCellTap`, which is a stable callback and would otherwise
     close over a stale `coachOpen`. Same union, same reason. */
  const baseCoachOpenRef = coach.openRef;
  const coachOpenRef = useRef(false);
  coachOpenRef.current = baseCoachOpenRef.current || !!worldLesson;
  const openTutorial = coach.replay;
  const { end: coachRunEnd } = coach;

  const endCoach = useCallback(() => {
    coachRunEnd(() => {
      /*
       * ⚠ Hand the round back. While the coach is open the auto-win is
       * suppressed (see `onCellTap`), so a player who cleared every target
       * during the lesson would otherwise be left sitting on an empty board with
       * a running clock and nothing to tap. Resolve it here, once, on the way
       * out.
       */
      const cleared = (cellsRef.current || []).length > 0
        && !cellsRef.current.some((cell) => cell?.isT && !cell.tapped);
      if (cleared) endRoundRef.current?.(true);
    });
  }, [coachRunEnd]);

  useEffect(() => () => {
  }, []);

  useEffect(() => {
    chalIdxRef.current = chalIdx;
  }, [chalIdx]);
  useEffect(() => {
    chalNamesRef.current = chalNames;
  }, [chalNames]);

  // Reset per-response capture whenever a new round's board appears. Declared
  // BEFORE the timer effect so, in the same commit (challenge mode sets round +
  // running together), gridOnsetRef is zeroed here first and then stamped by the
  // timer effect — never the reverse.
  useEffect(() => {
    if (!round) return;
    cellsRef.current = round.cells;
    roundOrdRef.current = 0;
    foundIdxRef.current = new Set();
    roundFoundSeqRef.current = [];
    gridOnsetRef.current = 0;
  }, [round]);

  const doneMap = useMemo(() => profile.done || {}, [profile.done]);
  /* One-time conversion of the old per-tier record into a ladder position.
     Unlocked, not ticked — a ✓ on a level nobody played is a lie. */
  const ladderReached = useMemo(() => fqMigrateLadderReached(doneMap), [doneMap]);

  const persistLevel = useCallback(
    (r, stats, f, e, stars = 0) => {
      const p = { ...profile, tel: [...(profile.tel || [])], done: { ...doneMap } };
      /* ⚠ `ladderLv` IS RECORDED SINCE 2026-09-19 BECAUSE `lv` CANNOT ANSWER
         "which world was this?". `r.lv` is the AUTHORED level the round was
         built from (1–100 within a tier); on the ladder that is a tier index,
         which is the same confusion that once made the in-play HUD read L23 for
         ladder level 5. The world-completion review needs the rung.
         `sv` marks the stats version: rows without it carry an `acc` that is a
         PRECISION, not a detection, so a longitudinal reader must check. */
      p.tel.push({
        lv: r.lv,
        ladderLv: r.ladderLv ?? null,
        diff: r.diff,
        won: stats.won,
        timeUsed: stats.timeUsed,
        errors: e,
        found: f,
        tc: r.tc,
        acc: stats.acc,
        cp: stats.cp,
        precision: stats.precision,
        score: stats.score,
        ies: stats.ies,
        tps: stats.tps,
        avgRt: stats.avgRt,
        sv: stats.sv ?? null,
        mode: r.mode || null,
        ts: new Date().toISOString(),
      });
      if (stats.won && r.mode === 'level') {
        const lad = r.ladderLv ?? r.lv;
        p.done[`lad-${lad}`] = true;
        /*
         * ⚠ `Math.max` against what is already stored: a replay that goes
         * worse must never take a star back. The ladder is something you
         * climb, not a score you have to defend — and a player who returns to
         * an early level to practise a rule should not be punished for it.
         * The stars themselves are computed where the totals live (endRound);
         * this only records them.
         */
        if (stars > 0) {
          p.stars = { ...(p.stars || {}) };
          p.stars[lad] = Math.max(p.stars[lad] || 0, stars);
        }
      }
      saveProfile(p);
      setProfile(p);
    },
    [profile, doneMap],
  );

  const stopTimer = useCallback(() => {
    runRef.current = false;
    timerRunIdRef.current += 1;
  }, []);

  /** Drop any in-progress round so hub / challenge / diff never see a stale `round`. */
  const clearPlayRoundState = useCallback(() => {
    stopTimer();
    roundEndedRef.current = false;
    clearTimeout(clearHoldTimeoutRef.current);
    clearHoldTimeoutRef.current = null;
    clearingRef.current = false;
    setClearing(false);
    winPlayedRef.current = false;
    clearTimeout(penaltyFlashTimeoutRef.current);
    setPenaltyFlash(null);
    roundRef.current = null;
    setRound(null);
    setCells([]);
    setPlayStep('idle');
    setPauseOpen(false);
    setQuitOpen(false);
    setCdShow(false);
    setFixShow(false);
    setCueShow(false);
  }, [stopTimer]);

  /*
   * ── IS THIS CUE CARD A GATE, OR A GLIMPSE? ───────────────────────────────
   * Owner, 2026-09-18: "when i end a round the next round starts immediatly,
   * what should happen is that it shows me the object then i tap it, then the
   * next round starts."
   *
   * ⚠ THE PLAYER-PACED BEAT ALREADY EXISTED AND WAS RESERVED FOR SURVIVAL.
   * Every `round.mode === 'free' && cueShow` test in this file was really
   * asking "is this cue waiting for me?", and the answer was hard-coded to one
   * mode — so a wave boundary got `flashCue`'s 720ms glimpse (or a 1.5s
   * countdown) and dealt itself. That is the report: the object was shown, but
   * for less time than it takes to decide you have seen it.
   *
   * A wave boundary needs the gate MORE than a Survival boundary does, and by
   * more than the code suggests. Every wave is a fresh `prepareLevelRound`, so
   * the target is re-rolled EVERY time — measured on level 1, which has no
   * mechanics at all: set 1 hunted a crystal and set 2 a planet. The `switch`
   * world only makes that change *guaranteed* (via `avoidTarget`) rather than
   * likely. So the object on this card is new information at every boundary,
   * and it was on screen for 720ms.
   *
   * ⚠ Which also means `cx-cue-flag--switch` ("New target this set") is
   * narrower than the truth — it is gated on the `switch` mechanic, while the
   * target can differ on any level. Left as it is: the flag promises a
   * GUARANTEE, which is exactly what that world adds, and the gate now gives
   * every player time to see the object for themselves.
   *
   * ⚠ THE FIRST WAVE OF A LEVEL IS DELIBERATELY NOT A GATE. You have just
   * chosen that level off the map, having read its target count and clock on
   * the node itself; a confirm there is a tap between you and a level you
   * already asked for. The gate is for the boundaries you did not ask for.
   *
   * ⚠ AND IT COSTS NO MEASURED TIME, which is what makes it safe against
   * `audit:fq`. The round clock only advances while `playStep === 'running'`
   * (see the timer effect) and the board only takes taps in that state, so
   * this changes the pacing BETWEEN boards and nothing about any board the
   * gate certifies.
   */
  const isCueGate = (r) => !!r && (
    r.mode === 'free' || (r.mode === 'level' && (r.waveIdx ?? 0) > 0)
  );

  /** Brief target-cue card before a round (used when there's no 3-2-1 countdown). */
  const flashCue = useCallback(async () => {
    setCueShow(true);
    playSfx('click');
    await sleep(720);
    setCueShow(false);
  }, [playSfx]);

  const beginFreeRoundAtStage = useCallback(
    async (stageIndex, { skipCueSound = false } = {}) => {
      try {
        setPhase('play');
        setCdShow(false);
        let r;
        try {
          r = prepareFreeRound(stageIndex);
        } catch (err) {
          console.error('[Focus Quest] prepareFreeRound failed', stageIndex, err);
          clearPlayRoundState();
          setPhase('hub');
          return;
        }
        roundRef.current = r;
        setRound(r);
        setCells(r.cells);
        setFound(0);
        setErrors(0);
        talliesRef.current = { found: 0, errors: 0 };
        warned10Ref.current = false;
        // Every free round has its own timer (from the level curve); the run is
        // bounded by lives, not by one global session clock.
        tlRef.current = r.tlim;
        tlimRef.current = r.tlim;
        tapsRef.current = [];
        pendingPenaltyRef.current = 0;
        juice.reset();
        // Survival is player-paced at the boundary between rounds. Show the
        // exact illustrated target and keep the clock stopped until Ready is
        // tapped; countdown preferences continue to apply to Levels only.
        setPlayStep('idle');
        setCueShow(true);
        // Skipped right after a win: 'win' just played at the top of the clear
        // celebration (see onCellTap), and stacking a 'click' 420ms later on
        // top of it read as two acknowledgements for one event.
        if (!skipCueSound) playSfx('click');
      } finally {
        roundEndedRef.current = false;
      }
    },
    [playSfx, clearPlayRoundState, juice],
  );

  /* Named for what it does rather than for the one mode that used to do it —
     it now arms a Survival round OR a continued level wave (see isCueGate). */
  const confirmTargetReady = useCallback(() => {
    if (!cueShow || !isCueGate(roundRef.current)) return;
    playSfx('correct'); // "ready", not "hit" — collect is reserved for tapping a target
    setCueShow(false);
    setPlayStep('running');
  }, [cueShow, playSfx]);

  /*
   * DEV-ONLY: ?survivalStage=N starts Survival at that stage.
   *
   * Survival runs on one life, so the tiers past the first are ~9 clean rounds
   * away — which makes the hard board impossible to eyeball while tuning it.
   * Gated on import.meta.env.DEV so it is dead code in any build; production
   * always starts at 0.
   */
  const devStartStage = useCallback(() => {
    if (!import.meta.env?.DEV) return 0;
    try {
      const n = Number(new URLSearchParams(window.location.search).get('survivalStage'));
      return Number.isFinite(n) && n > 0 ? Math.min(14, Math.floor(n)) : 0;
    } catch {
      return 0;
    }
  }, []);

  const startFreeMode = useCallback(() => {
    freeStageRef.current = 0;
    freeSearchRef.current = [];
    freeRoundsWonRef.current = 0;
    freeLivesRef.current = FREE_LIVES;
    freeScoreRef.current = 0;
    freeStreakRef.current = 0;
    setFreeLives(FREE_LIVES);
    setFreeScore(0);
    setPhase('freeIntro');
  }, []);
  startFreeModeRef.current = startFreeMode;

  const onFreeIntroReady = useCallback(() => {
    playSfx('click');
    trialLogRef.current?.discard();
    trialLogRef.current = createTrialLog({ game: 'cancel-task', mode: 'free' });
    const start = devStartStage();
    freeStageRef.current = start;
    void beginFreeRoundAtStage(start);
  }, [playSfx, beginFreeRoundAtStage, devStartStage]);

  const beginAssessmentTrial = useCallback(
    async (idx) => {
      try {
        setPhase('play');
        setCdShow(false);
        let r;
        try {
          // idx -1 = unscored instructional practice using the protocol's
          // smaller practice board and explicit readiness criterion.
          r = prepareAssessmentTrial(Math.max(0, idx), { practice: idx < 0 });
        } catch (err) {
          console.error('[Assessment] prepareAssessmentTrial failed', idx, err);
          clearPlayRoundState();
          setPhase('hub');
          return;
        }
        roundRef.current = r;
        setRound(r);
        setCells(r.cells);
        setFound(0);
        setErrors(0);
        talliesRef.current = { found: 0, errors: 0 };
        warned10Ref.current = false;
        tlRef.current = r.tlim;
        tlimRef.current = r.tlim;
        tapsRef.current = [];
        pendingPenaltyRef.current = 0;
        // Assessment uses a central fixation cue (not the 3-2-1 count): a "+"
        // over a covered grid so the eye starts at centre, giving CoC / scan
        // laterality / RT a clean origin. idle is committed before the await, so
        // the later idle→running transition re-runs the timer effect.
        setPlayStep('idle');
        setCdShow(false);
        setFixShow(true);
        playSfx('click');
        await sleep(680);
        setFixShow(false);
        setPlayStep('running');
      } finally {
        roundEndedRef.current = false;
      }
    },
    [playSfx, clearPlayRoundState],
  );

  const beginAdaptiveTrial = useCallback(
    async () => {
      try {
        setPhase('play');
        setCdShow(false);
        const sc = staircaseRef.current;
        if (!sc) {
          setPhase('hub');
          return;
        }
        let r;
        try {
          const { diff, lv } = freeStageToDiffLv(sc.level);
          r = { ...prepareLevelRound(diff, lv), mode: 'adaptive', adaptLevel: sc.level };
        } catch (err) {
          console.error('[Adaptive] prepare failed', err);
          clearPlayRoundState();
          setPhase('hub');
          return;
        }
        roundRef.current = r;
        setRound(r);
        setCells(r.cells);
        setFound(0);
        setErrors(0);
        talliesRef.current = { found: 0, errors: 0 };
        warned10Ref.current = false;
        tlRef.current = r.tlim;
        tlimRef.current = r.tlim;
        tapsRef.current = [];
        pendingPenaltyRef.current = 0;
        // Same fixation cue + feedback-free play as the assessment.
        setPlayStep('idle');
        setFixShow(true);
        playSfx('click');
        await sleep(680);
        setFixShow(false);
        setPlayStep('running');
      } finally {
        roundEndedRef.current = false;
      }
    },
    [playSfx, clearPlayRoundState],
  );

  const startThreshold = useCallback(() => {
    setPhase('adaptIntro');
  }, []);

  const onAdaptIntroReady = useCallback(() => {
    playSfx('click');
    trialLogRef.current?.discard();
    trialLogRef.current = createTrialLog({ game: 'cancel-task', mode: 'adaptive' });
    staircaseRef.current = createStaircase();
    void beginAdaptiveTrial();
  }, [playSfx, beginAdaptiveTrial]);

  const startAssessment = useCallback(() => {
    assessTrialsRef.current = [];
    assessTapsRef.current = [];
    assessIdxRef.current = 0;
    assessPracticeAttemptsRef.current = 0;
    setAssessResult(null);
    setPhase('assessIntro');
  }, []);

  const beginBatteryAssessment = useCallback(() => {
    playSfx('click');
    assessTrialsRef.current = [];
    assessTapsRef.current = [];
    assessIdxRef.current = 0;
    assessPracticeAttemptsRef.current = 0;
    setAssessResult(null);
    trialLogRef.current?.discard();
    trialLogRef.current = createTrialLog({ game: 'cancel-task', mode: 'assess' });
    void beginAssessmentTrial(-1);
  }, [playSfx, beginAssessmentTrial]);

  const onAssessIntroReady = useCallback(() => {
    playSfx('click');
    assessPracticeAttemptsRef.current = 0;
    trialLogRef.current?.discard();
    trialLogRef.current = createTrialLog({ game: 'cancel-task', mode: 'assess' });
    void beginAssessmentTrial(-1); // practice grid first, unscored
  }, [playSfx, beginAssessmentTrial]);

  const endRound = useCallback(
    (won) => {
      if (roundEndedRef.current) return;
      roundEndedRef.current = true;
      clearingRef.current = false;
      setClearing(false);
      stopTimer();
      const r = roundRef.current;
      if (!r) {
        roundEndedRef.current = false;
        return;
      }
      const { found: f, errors: e } = talliesRef.current;
      const tl = tlRef.current;
      const tlim = tlimRef.current;
      const targetTc = Array.isArray(r.cells)
        ? r.cells.filter((c) => c.isT).length
        : r.tc;
      const stats = computeRoundStats({
        tlim,
        tl,
        found: f,
        errors: e,
        tc: targetTc || r.tc,
        taps: [...tapsRef.current],
        diff: r.diff,
        won,
      });
      // Per-target positions for spatial analysis. `foundSeq` is in tap order
      // (drives scan-laterality); `omitPos` are targets never tapped, so they
      // must be reconstructed here (an omission generates no tap event).
      const foundSeq = roundFoundSeqRef.current.slice();
      const omitPos = [];
      if (Array.isArray(r.cells)) {
        r.cells.forEach((cell, i) => {
          if (cell.isT && !foundIdxRef.current.has(i)) {
            // Boards are cols×rows (Survival deals portrait rectangles), so
            // row/col come off the COLUMN count — `r.grid` is that count on
            // every board, square or not.
            const nCols = r.cols || r.grid;
            omitPos.push({ idx: i, row: Math.floor(i / nCols), col: i % nCols });
          }
        });
      }
      // Round marker — clinical per-round counts + positions, self-contained for
      // Center-of-Cancellation and spatial-omission analysis. No `ok`/`rt`, so
      // shared RT metrics skip it.
      if (!r.assessPractice) {
        /* ⚠ THE CONTEXT FIELDS BELOW ARE NOT DECORATION (added 2026-09-19).
           Without them the stored round is uninterpretable after the fact:
           - `noGoTotal` — the record flagged each no-go TAP but never how many
             no-go items were on the board, so the commission RATE on forbidden
             objects, which is the whole inhibition measure world 4 exists to
             create, was unreconstructable. A numerator with no denominator.
           - `nCells` / `nDistractors` — the SDT noise count. Still an assumption
             (an un-foveated distractor is not a correct rejection), but at least
             a recorded one rather than one re-derived as grid² by a later reader
             on a board that has not been square since the reflow landed.
           - `interference`, `poolSize`, `target` — the same behaviour means
             different things on a 25%-same-hue board and a 94% one. Without
             these, two rows that look identical are not comparable. */
        const nCells = Array.isArray(r.cells) ? r.cells.length : (r.cols || r.grid) * (r.rows || r.grid);
        const noGoTotal = Array.isArray(r.cells) ? r.cells.filter((cell) => cell && cell.isNoGo).length : 0;
        const tcHere = targetTc || r.tc;
        trialLogRef.current?.trial({
          kind: 'round',
          found: f,
          errors: e,
          omissions: Math.max(0, tcHere - f),
          tc: tcHere,
          timeUsed: stats.timeUsed,
          tlim: r.tlim ?? null,
          won,
          grid: r.grid,
          // Board shape travels with the round so a CoC read on stored history
          // can tell a 7×9 from a 9×9 rather than assuming grid².
          cols: r.cols || r.grid,
          rows: r.rows || r.grid,
          nCells,
          nDistractors: Math.max(0, nCells - tcHere),
          noGoTotal,
          interference: typeof r.interference === 'number' ? r.interference : null,
          poolSize: Array.isArray(r.pool) ? r.pool.length : null,
          target: r.target ?? null,
          target2: r.target2 ?? null,
          mode: r.mode || null,
          ladderLv: r.ladderLv ?? null,
          foundPos: foundSeq,
          omitPos,
        });
      }
      if (r.mode === 'challenge') {
        const idx = chalIdxRef.current;
        const names = chalNamesRef.current;
        const base = [...chalScoresRef.current];
        const prevRow = base[idx];
        base[idx] = mergeChallengePlayerStats(prevRow, stats, e, names[idx]);
        chalScoresRef.current = base;
        // 'win' already played at the START of the clear-celebration hold
        // (onCellTap) — don't play it again 420ms later.
        if (won) { if (winPlayedRef.current) winPlayedRef.current = false; else playSfx('win'); }
        else playSfx('error');
        const nextIdx = idx + 1;
        if (nextIdx < names.length) {
          setChalIdx(nextIdx);
          setChalTurnOpen(true);
          setPhase('play');
          setPlayStep('idle');
          setRound(null);
          setCells([]);
          roundEndedRef.current = false;
        } else {
          const cycle = chalCycleRef.current;
          const totalR = chalRoundsTotalRef.current;
          if (cycle + 1 < totalR) {
            chalCycleRef.current = cycle + 1;
            setChalRoundIdx(chalCycleRef.current);
            const newSeed = prepareChallengeSeed(chalDiffRef.current);
            setChalSeed(newSeed);
            setChalIdx(0);
            chalIdxRef.current = 0;
            setChalTurnOpen(true);
            setPhase('play');
            setPlayStep('idle');
            setRound(null);
            setCells([]);
            roundEndedRef.current = false;
          } else {
            setLastResult({ type: 'challenge', rows: base });
            setPhase('chalRes');
          }
        }
        return;
      }
      if (r.mode === 'free') {
        // Every completed round contributes its path — the failed one too. How
        // you searched a board you ran out of time on is exactly as real as how
        // you searched one you cleared, and dropping it would bias the measure
        // toward the boards that went well.
        freeSearchRef.current.push({ foundSeq, omitPos });
        // …and its outcome against that stage's difficulty. Survival is where
        // theta converges fastest: many short boards, each with a known `b`.
        bankAbility(fqSurvivalDifficultyLogit(r.freeStage ?? freeStageRef.current), won);
        if (won) {
          // Cleared the round — bank the clear bonus and ramp to a harder stage.
          // 'win' already played at the START of the clear-celebration hold.
          if (winPlayedRef.current) winPlayedRef.current = false; else playSfx('win');
          freeStreakRef.current += 1;
          const clearPts = freeRoundClearPoints(r.tlim, freeStreakRef.current);
          freeScoreRef.current += clearPts;
          setFreeScore(freeScoreRef.current);
          freeRoundsWonRef.current += 1;
          /* ⚠ THE NEXT BOARD COMES FROM THETA, NOT FROM A COUNTER (2026-09-19).
             It used to be `freeStageRef.current += 1` — an open-loop ramp keyed
             to how many rounds you had survived, which meant two players with
             very different ability met exactly the same sequence of boards, and
             the ramp saturated at stage 14 regardless of who was playing.
             Now the stage is chosen so the board sits at the 0.84 success
             target for THIS player's current estimate.
             ⚠ `Math.max(prev + 1, …)` keeps survival a climb: a cleared round
             never deals an easier board next. Elo is the target, not a licence
             to walk backwards mid-run — that is what the one life is for. */
          const targetStage = fqSurvivalStageForDifficulty(difficultyForP(abilityRef.current.theta));
          freeStageRef.current = Math.max(freeStageRef.current + 1, targetStage);
          setPauseOpen(false);
          void beginFreeRoundAtStage(freeStageRef.current, { skipCueSound: true });
          return;
        }
        // Round failed (timed out or too many wrong taps): lose a life.
        freeStreakRef.current = 0;
        freeLivesRef.current = Math.max(0, freeLivesRef.current - 1);
        setFreeLives(freeLivesRef.current);
        /* ⚠ THIS BRANCH WAS DEAD CODE DESCRIBING A STAIRCASE THAT DID NOT EXIST
           (removed 2026-09-19). Its comment read "adaptive staircase: clear →
           +1, fail → −1, so the stage converges on the player's threshold" —
           but `FREE_LIVES` is 1 and the counter is only ever set or decremented,
           never raised, so the first failure took it 1 → 0 and the branch could
           never run. Survival was an open-loop ramp wearing a staircase's
           comment, and that comment is the reason nobody noticed.
           The convergence it described is real now and lives in theta (see
           bankAbility and the stage selection above), which works across
           sessions rather than within a single run.
           ⚠ If FREE_LIVES ever rises above 1, the retry board must come from
           `fqSurvivalStageForDifficulty(difficultyForP(theta))` — NOT from
           stage − 1, which would reintroduce the open loop. */
        if (freeLivesRef.current > 0) {
          playSfx('error');
          setPauseOpen(false);
          freeStageRef.current = fqSurvivalStageForDifficulty(
            difficultyForP(abilityRef.current.theta),
          );
          void beginFreeRoundAtStage(freeStageRef.current);
          return;
        }
        // Out of lives — the run is over.
        playSfx('error');
        const rw = freeRoundsWonRef.current;
        const runScore = freeScoreRef.current;
        // Captured BEFORE the update below — comparing against profile.* on
        // the results screen would always read "not a best" once the state
        // it derives from has already moved.
        const prevBest = profile.freeBest ?? 0;
        const prevBestScore = profile.freeBestScore ?? 0;
        setProfile((prev) => {
          let next = { ...prev };
          let changed = false;
          if (runScore > (prev.freeBestScore ?? 0)) {
            next = { ...next, freeBestScore: runScore };
            changed = true;
          }
          if (rw > (prev.freeBest ?? 0)) {
            next = { ...next, freeBest: rw };
            changed = true;
          }
          if (changed) saveProfile(next);
          return changed ? next : prev;
        });
        trialLogRef.current?.finish({ roundsWon: rw, score: runScore });
        trialLogRef.current = null;
        /* ⚠ THE RATING NOW BANKS A MEASUREMENT, NOT A COUNT (2026-09-19).
           It used to be `awardFreeRun('cancel', rw)` — rw being how many rounds
           you survived on one life. Not accuracy, not RT, not d-prime: a count,
           with a single life's variance on top, which then set a band from
           Developing to Elite and drove the Daily Workout's difficulty. A fast,
           sloppy player outranked an accurate, deliberate one.
           What is banked instead is the ladder level whose authored difficulty
           equals this player's ability — an estimate built from every board
           they have finished, in Levels and Survival, each scored against a
           known `b`.
           ⚠ THE 18-GAME CONTRACT IS UNTOUCHED. `updateRating(key, level)` still
           takes a scalar level, and this is still a level; it is simply derived
           from theta rather than from luck. No other game changes.
           ⚠ Gated on `isSettled` (n >= 20). Before that, theta is still steering
           the boards — where being slightly wrong costs a slightly-off board —
           but it is not yet asserted as a measurement, so the old count is
           banked meanwhile. Same cold-start posture as personalization. */
        const ab = abilityRef.current;
        awardFreeRun(
          'cancel',
          isSettled(ab) ? fqLadderLevelForDifficulty(ab.theta) : rw,
        );
        setLastResult({
          type: 'free', roundsWon: rw, score: runScore, lastR: r, prevBest, prevBestScore,
          org: searchOrganization(freeSearchRef.current),
          spatial: spatialBias(freeSearchRef.current),
          /* Read AFTER this run's boards have been banked, so the comparison
             includes the run the player just finished rather than lagging it. */
          progress: abilityProgress(),
        });
        setPhase('freeRes');
        setPlayStep('idle');
        setPauseOpen(false);
        setQuitOpen(false);
        setCdShow(false);
        setRound(null);
        setCells([]);
        return;
      }
      if (r.mode === 'assess') {
        if (r.assessPractice) {
          // Practice is instructional and unscored. Require a clean-enough
          // completion before measurement; repeat twice at most so a player is
          // never trapped by the gate. No practice data enters the battery.
          const attempt = assessPracticeAttemptsRef.current + 1;
          assessPracticeAttemptsRef.current = attempt;
          const practiceReady = !!won && e <= (r.practiceMaxFalseAlarms ?? 1);
          const maxAttempts = r.practiceMaxAttempts ?? 3;
          playSfx(practiceReady ? 'win' : 'error');
          setPauseOpen(false);
          if (practiceReady || attempt >= maxAttempts) {
            void beginAssessmentTrial(0);
          } else {
            void beginAssessmentTrial(-1);
          }
          return;
        }
        // Record this trial (hits, false taps, time, efficiency) + its taps.
        // `distractors` (= non-target cells) is the SDT "noise" count needed for
        // the false-alarm rate in the d′/criterion computation.
        {
          const tcTrial = targetTc || r.tc;
          const totalCells = (r.grid || 0) * (r.grid || 0);
          assessTrialsRef.current.push({
            tc: tcTrial,
            distractors: Math.max(0, totalCells - tcTrial),
            found: f,
            errors: e,
            timeUsed: stats.timeUsed,
            ies: stats.ies,
            // The real Inverse Efficiency Score, ms, lower-is-better, already
            // validity-gated. Carried so the summary can average the published
            // measure instead of the rate that wore its name. null is expected
            // and must be filtered, not counted — see computeAssessmentSummary.
            iesMs: stats.iesMs ?? null,
            grid: r.grid,
            foundSeq, // tap-ordered found positions → CoC + scan laterality
            omitPos, // missed targets → CoC extent + omission map
          });
        }
        assessTapsRef.current.push(...tapsRef.current);
        const total = r.assessTrialsTotal ?? ASSESSMENT_PROTOCOL.trials;
        const nextIdx = assessIdxRef.current + 1;
        if (nextIdx < total) {
          playSfx(won ? 'win' : 'click');
          assessIdxRef.current = nextIdx;
          setPauseOpen(false);
          void beginAssessmentTrial(nextIdx);
          return;
        }
        // Battery complete — compute the standardized summary and persist it.
        playSfx('win');
        const summary = computeAssessmentSummary(
          assessTrialsRef.current,
          assessTapsRef.current,
          { age: loadAssessProfile().age },
        );
        setAssessHistory(saveAssessSession(summary));
        trialLogRef.current?.finish({
          composite: summary.composite,
          detection: summary.detection,
          meanRT: summary.meanRT,
          rtCV: summary.rtCV,
          speed: summary.speed,
        });
        trialLogRef.current = null;
        setPlayStep('idle');
        setPauseOpen(false);
        setQuitOpen(false);
        setCdShow(false);
        setRound(null);
        setCells([]);
        if (onAssessmentComplete) {
          const line = `${Math.round(summary.detection * 100)}% · ${summary.meanRT != null ? `${summary.meanRT}ms` : '—'}`;
          onAssessmentComplete({ score: summary.composite, line });
          return;
        }
        setAssessResult(summary);
        setPhase('assessRes');
        return;
      }
      if (r.mode === 'adaptive') {
        const sc = staircaseRef.current;
        // Pass = cleared the board in time with few false taps. This binary
        // outcome drives the 2-down/1-up staircase toward the player's threshold.
        const pass = !!won && e <= 2;
        sc?.record(pass);
        playSfx('click'); // neutral between-trial sound (no pass/fail tell)
        if (sc && !sc.done) {
          setPauseOpen(false);
          void beginAdaptiveTrial();
          return;
        }
        const threshold = sc ? sc.threshold() : 0;
        trialLogRef.current?.finish({ threshold, reversals: sc?.reversalCount ?? 0 });
        trialLogRef.current = null;
        setPlayStep('idle');
        setPauseOpen(false);
        setQuitOpen(false);
        setCdShow(false);
        setRound(null);
        setCells([]);
        setLastResult({
          type: 'adaptive',
          threshold,
          trials: sc?.trialCount ?? 0,
          reversals: sc?.reversalCount ?? 0,
        });
        setPhase('adaptRes');
        return;
      }
      // Level mode. 'win' already played at the START of the clear-celebration
      // hold (onCellTap) — don't play it again 420ms later.
      if (won) { if (winPlayedRef.current) winPlayedRef.current = false; else playSfx('win'); }
      else playSfx('error');
      // Defensive, matching every other mode's branch above: pauseOpen/
      // quitOpen cannot actually be true here today (onHudPause/onHudQuit
      // both bail on clearingRef, and a paused board can't register the
      // winning tap in the first place), but this branch was the one that
      // didn't reset them, and it's one line to not depend on that staying true.
      setPauseOpen(false);
      setQuitOpen(false);

      // Losing ANY wave ends the level right here, on THIS wave's own stats
      // — no partial credit, same binary pass/fail a single-round level
      // always had. `r.waveIdx` (0-based, set in startLevelGame) is carried
      // through so the results screen can say which wave it fell on.
      if (!won) {
        trialLogRef.current?.finish({ won, waveIdx: r.waveIdx, wavesTotal: r.wavesTotal });
        trialLogRef.current = null;
        /* One board, one trial, scored against THAT WAVE's difficulty — not the
           level's, which belongs to the last wave and may never have been seen. */
        bankAbility(fqWaveDifficultyLogit(r.ladderLv ?? r.lv, r.waveIdx ?? 0), false);
        persistLevel(r, stats, f, e);
        setLastResult({ type: 'level', stats, r, won, found: f, errors: e });
        setPhase('res');
        return;
      }
      bankAbility(fqWaveDifficultyLogit(r.ladderLv ?? r.lv, r.waveIdx ?? 0), true);

      // Cleared this wave. Bank its RAW inputs (not the already-rounded
      // per-wave stats) so a multi-wave level's final numbers are computed
      // once, on the true totals, not averaged from three roundings.
      levelWaveStatsRef.current.push({
        found: f, errors: e, tc: targetTc || r.tc, tlim, tl, taps: [...tapsRef.current],
        /* Tap-ordered positions + the targets never reached. These are what the
           search-organisation measures are computed FROM (see searchMetrics.js),
           and until 2026-09-19 they were written to the trial log on every round
           and read by nothing outside the parked assessment. Each wave is its
           own search, so they stay per-wave and are averaged, never concatenated
           — joining two boards' paths would invent a giant jump between them and
           report a tidy player as chaotic. */
        foundSeq, omitPos,
      });
      const waveIdx = r.waveIdx ?? 0;
      if (waveIdx + 1 < (r.wavesTotal ?? LEVEL_WAVES)) {
        levelWaveIdxRef.current = waveIdx + 1;
        void startLevelGameRef.current?.(r.ladderLv ?? r.lv, { continueWaves: true });
        return;
      }

      // Final wave cleared — the whole level is won. Aggregate every wave's
      // raw inputs into one pseudo-round and score THAT, so `stats` reflects
      // the level as a whole (total targets, total time, total taps) rather
      // than just the last wave played.
      const waves = levelWaveStatsRef.current;
      const aggFound = waves.reduce((s, w) => s + w.found, 0);
      const aggErrors = waves.reduce((s, w) => s + w.errors, 0);
      const aggTc = waves.reduce((s, w) => s + w.tc, 0);
      const aggTlim = waves.reduce((s, w) => s + w.tlim, 0);
      const aggTl = waves.reduce((s, w) => s + w.tl, 0);
      const aggTaps = waves.flatMap((w) => w.taps);
      const levelStats = computeRoundStats({
        tlim: aggTlim, tl: aggTl, found: aggFound, errors: aggErrors,
        tc: aggTc, taps: aggTaps, diff: r.diff, won: true,
      });
      /* THE SECOND FACTOR. Computed per wave and averaged across the level.
         Independent of everything above it: how completely you cleared the board
         and how systematically you searched it correlate at r_s = -0.14 (n.s.)
         in the literature, so this is not a restatement of the score. */
      levelStats.org = searchOrganization(waves);
      levelStats.spatial = spatialBias(waves);
      trialLogRef.current?.finish({ won: true, waves: waves.length });
      trialLogRef.current = null;
      awardLadderWin('cancel', r.ladderLv ?? r.lv, FQ_LADDER_LEVELS);
      /*
       * Stars, from what the level already measured and nothing new: you
       * cleared it (1), you cleared it without a wrong tap (2), and you
       * cleared it with a quarter of the clock still unspent (3). Computed on
       * the AGGREGATE of every set, so a level is judged as the whole run it
       * is — banking a clean first set and then flailing the third earns two,
       * not three.
       */
      const spare = aggTlim > 0 ? aggTl / aggTlim : 0;
      const earnedStars = 1 + (aggErrors === 0 ? 1 : 0) + (spare >= 0.25 ? 1 : 0);
      r.stars = earnedStars;
      persistLevel(r, levelStats, aggFound, aggErrors, earnedStars);
      // `r.cells` still belongs to the LAST wave only — the results screen's
      // own target-count display would otherwise read one wave's worth of
      // targets under an aggregate found/errors line. `aggTc` is the one it
      // checks first when a level ran more than one wave.
      r.aggTc = aggTc;
      r.aggWaves = waves.length;
      /*
       * The tenth level of a world earns a review. It is assembled HERE, while
       * the level that finished it is still in hand, but shown after the
       * ordinary results screen — the player should see how the level went
       * before being told how the world went.
       *
       * ⚠ Every number in it is read back from what was persisted, not from
       * this run: a world is ten levels, and nine of them happened in earlier
       * sessions. Accuracy comes from the telemetry rows for those levels.
       */
      const lad = r.ladderLv ?? r.lv;
      if (fqIndexInSection(lad) === 9) {
        const sec = fqSectionOf(lad);
        const firstLv = lad - 9;
        const starMap = { ...(profile.stars || {}) };
        starMap[lad] = Math.max(starMap[lad] || 0, earnedStars);
        let starSum = 0;
        for (let i = firstLv; i <= lad; i += 1) starSum += starMap[i] || 0;
        /* ⚠ FILTERED TO THIS WORLD'S TEN RUNGS (2026-09-19). It used to be
           `rows.slice(-30)` — the last thirty won rows ANYWHERE, unfiltered by
           world or mode, so finishing level 30 after grinding level 3 for stars
           showed the grind. The comment above already said "the telemetry rows
           for those levels"; the code did not do that.
           ⚠ And only `sv >= 2` rows count: earlier rows stored a PRECISION under
           `acc`, so averaging them together would mix two different measures
           into one percentage. Early in the migration this means fewer rows —
           the level just finished is the fallback, which is honest. */
        const rows = (profile.tel || []).filter(
          (x) =>
            x &&
            x.won &&
            typeof x.acc === 'number' &&
            (x.sv || 0) >= 2 &&
            x.mode === 'level' &&
            typeof x.ladderLv === 'number' &&
            x.ladderLv >= firstLv &&
            x.ladderLv <= lad,
        );
        /* One row per rung, most recent attempt, so a replayed level does not
           weigh ten times more than one played once. */
        const byRung = new Map();
        for (const x of rows) byRung.set(x.ladderLv, x);
        const picked = [...byRung.values()];
        const acc = picked.length
          ? Math.round(picked.reduce((s, x) => s + x.acc, 0) / picked.length)
          : Math.round(levelStats.acc || 0);
        setSectionReview({
          section: sec,
          stars: starSum,
          starsMax: 30,
          acc,
          next: FQ_SECTIONS[FQ_SECTIONS.indexOf(sec) + 1] || null,
        });
      }
      setLastResult({
        type: 'level', stats: levelStats, r, won: true, found: aggFound, errors: aggErrors,
      });
      setPhase('res');
    },
    [stopTimer, persistLevel, playSfx, beginFreeRoundAtStage, beginAssessmentTrial, beginAdaptiveTrial, onAssessmentComplete, awardFreeRun, awardLadderWin, profile, bankAbility, abilityProgress],
  );

  useEffect(() => {
    endRoundRef.current = endRound;
  }, [endRound]);

  // The rendered board is the final authority on completion. The event handler
  // normally ends the round immediately, but this catches any future count/ref
  // drift: if every target the player can see has been marked, play must move on.
  //
  // ⚠ MUST carry the same two guards the tap handler's own win path carries:
  // `coachOpen` (clearing the 3-target tutorial board must NOT end the round —
  // the player hasn't met the decoy step yet, and any round end force-closes
  // the coach) and `clearingRef` (the tap handler already started the
  // celebration hold; this effect re-fires on the resulting re-render and must
  // not race it into calling endRound a second time).
  useEffect(() => {
    if (phase !== 'play' || playStep !== 'running' || !round || roundEndedRef.current) return;
    if (coachOpen || clearingRef.current) return;
    const targets = cells.filter((cell) => cell.isT);
    if (targets.length > 0 && targets.every((cell) => cell.tapped)) {
      endRoundRef.current(true);
    }
  }, [phase, playStep, round, cells, coachOpen]);

  useEffect(() => () => {
    trialLogRef.current?.discard();
    clearTimeout(clearHoldTimeoutRef.current);
    clearTimeout(penaltyFlashTimeoutRef.current);
  }, []);

  useEffect(() => {
    // The card is a `role="dialog"` whenever it is a gate, so focus has to
    // follow the same predicate the markup does — a keyboard player otherwise
    // reaches a modal on a continued wave with focus still on the board.
    if (cueShow && isCueGate(round)) readyBtnRef.current?.focus();
  }, [round, cueShow]);


  useEffect(() => {
    // The coach holds the clock exactly like the pause menu does — a first-time
    // player must never lose Survival time to reading Dr Kawkab.
    //
    // ⚠ BUG (owner: "if i press back then keep playing the time freezes") —
    // `quitOpen` was missing from this guard AND from the dependency array
    // below. `onHudQuit` calls stopTimer() (runRef.current = false), which
    // makes the rAF loop's own frame check fail and it stops calling
    // itself — correctly pausing. But "Keep Playing" only flips
    // runRef.current back to true; with `quitOpen` absent from this
    // effect's deps, React never sees a reason to re-run it, so no new rAF
    // loop is ever started to READ that flag. `pauseOpen` already gets
    // this right — resuming from the pause modal re-runs this effect
    // because it's a listed dependency, which is what actually restarts
    // the loop. `quitOpen` needed the identical treatment and never got it.
    if (playStep !== 'running' || pauseOpen || quitOpen || coachOpen) return;
    let id;
    let last = performance.now();
    const runId = timerRunIdRef.current + 1;
    timerRunIdRef.current = runId;
    // ⚠ NOT reset here. This effect re-runs on every pause/resume and every
    // coach open/close (see its own deps below), so resetting the flag on
    // entry made the warning re-fire once per resume instead of once per
    // round. It is reset only where a round actually BEGINS (the 5 call
    // sites that also call juice.reset()).
    runRef.current = true;
    // A fixed 10s warning fires on frame one of the shortest boards (the
    // ladder's 8s levels, the earliest Survival stages) — audible before the
    // player has looked at a single tile. Scale it to the round's own limit
    // instead: 30% of the way in, never sooner than 3s (a genuinely short
    // board still deserves SOME warning) or later than 10s.
    const warnAt = Math.min(10, Math.max(3, Math.round(tlimRef.current * 0.3)));
    const loop = (ts) => {
      if (!runRef.current || pauseOpen || quitOpen || coachOpen || timerRunIdRef.current !== runId) return;
      const dt = (ts - last) / 1000;
      last = ts;
      tlRef.current = Math.max(
        0,
        tlRef.current - dt - pendingPenaltyRef.current,
      );
      pendingPenaltyRef.current = 0;
      // Scored assessment/adaptive trials are feedback-free by clinical
      // design (same neutral tap sound for hits and false alarms, no time
      // penalty) — a distinct urgency alarm has no business firing inside
      // one. Unscored practice is fine; it already gets full feedback.
      const rNow = roundRef.current;
      const isAssessNow = (rNow?.mode === 'assess' || rNow?.mode === 'adaptive') && !rNow?.assessPractice;
      if (!isAssessNow && !warned10Ref.current && tlRef.current <= warnAt) {
        warned10Ref.current = true;
        playSfx('warn');
      }
      if (tlRef.current <= 0) {
        endRoundRef.current(false);
        return;
      }
      id = requestAnimationFrame(loop);
    };
    // Stamp the grid-onset time once per round (the first 'running' frame).
    // Guarded so resuming from pause doesn't reset it — tOn stays round-relative.
    if (!gridOnsetRef.current) gridOnsetRef.current = performance.now();
    lastTapRef.current = performance.now();
    lastTapIdxRef.current = -1;
    id = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(id);
      if (timerRunIdRef.current === runId) runRef.current = false;
    };
  }, [playStep, pauseOpen, quitOpen, coachOpen, playSfx]);

  // Open the coach once a Survival round is actually on screen, so Dr Kawkab
  // can point at real shapes. Survival only — Levels and Pass n Play are
  // untouched for now.
  useEffect(() => {
    if (!coachArmed || coachOpen) return;
    if (round?.mode !== 'free' || playStep !== 'running' || cdShow || pauseOpen) return;
    coach.begin();
  }, [coachArmed, coachOpen, round, playStep, cdShow, pauseOpen, coach]);

  /*
   * ── THE AUTOMATIC WORLD LESSON ───────────────────────────────────────────
   * Fires on the FIRST level of a band that introduces a rule, once the board
   * is actually live — Dr Kawkab teaches the new rule on the real field the
   * player is about to be scored on, and one step waits for them to do it.
   *
   * ⚠ IT WAITS FOR `playStep === 'running'` AND `!cdShow`, like the Survival
   * coach above. Opening during the countdown would put the hand on a board
   * that is still being dealt, and the cell it picked could be gone by the time
   * the player looked.
   */
  useEffect(() => {
    if (worldLesson || coach.open) return;
    if (round?.mode !== 'level' || playStep !== 'running' || cdShow || pauseOpen) return;
    if ((round.waveIdx ?? 0) !== 0) return; // the first set of the level only
    const sec = round.section;
    const mech = sec?.mech;
    if (!sec || !mech || !hasWorldLesson(mech)) return;
    if (fqIndexInSection(round.ladderLv ?? round.lv ?? 1) !== 0) return;
    if (lessonSeen(sec.id)) return;
    setWorldLesson({ sectionId: sec.id, script: CANCEL_WORLD_LESSONS[mech] });
  }, [round, playStep, cdShow, pauseOpen, worldLesson, coach.open]);

  const endWorldLesson = useCallback(() => {
    const open = worldLessonRef.current;
    if (!open) return;
    markLessonSeen(open.sectionId);
    setWorldLesson(null);
    /*
     * Hand the round back, exactly as `endCoach` does: the auto-win is
     * suppressed while a lesson is open, so a player who cleared the board
     * during it would otherwise sit on an empty field with a running clock.
     */
    const live = cellsRef.current || [];
    if (live.length && live.every((c) => !c.isT || c.tapped)) {
      endRoundRef.current?.(true);
    }
  }, []);

  // Never strand the coach on a screen that has no board (round ended, quit,
  // paused out) — it would hold the clock forever. Closing this way also ends
  // onboarding: a player who cleared the whole board mid-lesson has plainly got
  // it, and re-opening the coach every round would nag them.
  useEffect(() => {
    if (!coachOpen) return;
    if (phase !== 'play' || playStep !== 'running') {
      if (worldLessonRef.current) endWorldLesson();
      if (coach.open) endCoach();
    }
  }, [coachOpen, phase, playStep, endCoach, endWorldLesson, coach.open]);

  /*
   * The board's top reserve is the HUD's MEASURED height, published as a CSS
   * variable the stylesheet reads.
   *
   * ── Why this exists, and what it replaces ──
   * .cb2d-wrap used to reserve clamp(56px, 12vh, 104px) for a HUD that actually
   * stacks to ~83px (bar 60 + 4 + clock 11 + progress 8). 12vh only reaches 83px
   * on a viewport taller than ~692px, so on anything shorter — a phone in
   * landscape, a small window, any aspect ratio that missed the tall-phone media
   * query — the bar's near-opaque card sat ON TOP of the first row of tiles. And
   * because .ct-fq-scene2d-overlay is pointer-events:none, those tiles stayed
   * live underneath it: invisible, tappable, and never tapped. A target hiding
   * there cannot be found, so the round cannot be cleared — the reported
   * "I cancel all the shapes and still I do not win".
   *
   * This is the same measurement the old layout pass did — visualViewport,
   * [data-fq-chrome], the lot — but that pass wrote to a `gridMetrics` state
   * that NOTHING read. It was orphaned when the board went 2D and CancelBoard2D
   * brought its own clientWidth/clientHeight fit, which knows nothing about the
   * HUD: ninety lines of correct measurement, disconnected from the layout.
   *
   * Only IN-FLOW chrome counts. In the wide-screen layout the bar is absolutely
   * positioned into a side rail and the clock is pinned beside the board;
   * neither sits above the grid, and both would otherwise report a huge bottom
   * edge and shove the board off screen.
   */
  useLayoutEffect(() => {
    if (phase !== 'play' || !round) return undefined;
    const wrap = gridWrapRef.current;
    if (!wrap) return undefined;
    let raf = 0;
    const measure = () => {
      const top = wrap.getBoundingClientRect().top;
      let bottom = 0;
      wrap.querySelectorAll('[data-fq-chrome]').forEach((el) => {
        if (window.getComputedStyle(el).position === 'absolute') return;
        const r = el.getBoundingClientRect();
        if (r.height > 0) bottom = Math.max(bottom, r.bottom - top);
      });
      // +8px so the top row clears the bar rather than touching it. The
      // fallback covers the frame before the HUD has painted.
      const reserve = bottom > 0 ? Math.ceil(bottom) + 8 : 96;
      wrap.style.setProperty('--fq-hud-reserve', reserve + 'px');
    };
    measure();
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    const ro = new ResizeObserver(schedule);
    ro.observe(wrap);
    wrap.querySelectorAll('[data-fq-chrome]').forEach((el) => ro.observe(el));
    window.visualViewport?.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.visualViewport?.removeEventListener('resize', schedule);
      ro.disconnect();
    };
  }, [phase, round]);

  const runCountdownThen = async (onDone) => {
    if (!settings.countdown) {
      await flashCue();
      onDone();
      return;
    }
    setCdShow(true);
    try {
      for (let n = 3; n > 0; n--) {
        setCdVal(n);
        // A rising 3-note phrase as the round arms, not 3 identical button
        // clicks — count1/2/3 climb C4→E4→G4 and resolve into GO's `correct`.
        playSfx(`count${4 - n}`);
        await sleep(380);
      }
      setCdVal('GO');
      // `collect` is the target-HIT sound; playing it here taught "this noise
      // = you found one" and then played it when nothing had been found yet.
      // `correct` is what every other "the round starts now" moment uses
      // (confirmTargetReady).
      playSfx('correct');
      await sleep(320);
    } finally {
      // The veil LIFTS off a board that already exists, rather than being
      // unmounted over it — the overlay departs (fade + slight scale-up),
      // and the board it reveals never itself fades/slides/scales. This is
      // deliberately sequenced BEFORE onDone() (which flips playStep to
      // 'running'), so the lift costs no measured time and the clock has
      // not started while anything is still moving.
      setCdShow(false);
      setCdLeaving(true);
      await sleep(220);
      setCdLeaving(false);
    }
    onDone();
  };

  const startLevelGame = async (lv, opts = {}) => {
    const { diff, li } = ladderToTier(lv);
    // A fresh level entry resets the wave count and the accumulator; a
    // continuation (called from endRound once a wave is cleared) advances
    // levelWaveIdxRef itself, before calling this, and must NOT wipe the
    // waves already banked.
    if (!opts.continueWaves) {
      levelWaveIdxRef.current = 0;
      levelWaveStatsRef.current = [];
    }
    setPhase('play');
    setPlayStep('idle');
    setCdShow(false);
    if (!opts.continueWaves) {
      trialLogRef.current?.discard();
      trialLogRef.current = createTrialLog({ game: 'cancel-task', mode: 'level', meta: { lv, diff, li } });
    }
    /*
     * The rules of the world this level sits in. Every one of them is decided
     * HERE and handed to the builder, so the board itself carries what is in
     * force (`r.noGo`, `r.drift`) and nothing downstream has to re-derive a
     * section from a level number.
     */
    const ladderLv = Math.min(FQ_LADDER_LEVELS, Math.max(1, Math.round(Number(lv) || 1)));
    const mech = fqMechanicsAt(ladderLv);
    /*
     * ⚠ THE WAVE INDEX IS AN ARGUMENT TO THE DIFFICULTY, NOT JUST A COUNTER.
     * Every option below comes from `fqLadderRoundOpts(ladderLv, waveIdx)` —
     * one function, shared with `audit:fq`, so the board the gate certifies is
     * the board this line deals. Passing only `ladderLv` (which is what this
     * did) left the within-level ramp computed and unused: waves 1 and 8 of a
     * level drew the same clock and the same target count, and a level was up
     * to eight repeats of one board.
     */
    const waveIdx = levelWaveIdxRef.current;
    let r;
    try {
      r = prepareLevelRound(diff, li, {
        ...fqLadderRoundOpts(ladderLv, waveIdx),
        // Only on a continued set: the first board of a level has no previous
        // target to differ from, and forcing one would quietly shrink the pool.
        avoidTarget: mech.has('switch') && opts.continueWaves ? lastWaveTargetRef.current : null,
      });
    } catch (err) {
      console.error('[Focus Quest] prepareLevelRound failed', diff, li, err);
      clearPlayRoundState();
      setPhase('levels');
      return;
    }
    // Tag the round with WHERE ON THE LADDER it came from. The round itself
    // still carries the authored (diff, lv) it was built from — everything
    // downstream (scoring, telemetry, the results screen) reads those — but
    // progress, unlocking and points are all ladder-positioned.
    r.ladderLv = ladderLv;
    r.waveIdx = waveIdx;
    r.wavesTotal = fqSetsForLevel(ladderLv);
    r.section = fqSectionOf(ladderLv);
    r.mechanics = [...mech];
    lastWaveTargetRef.current = r.target;
    roundRef.current = r;
    setRound(r);
    setCells(r.cells);
    setFound(0);
    setErrors(0);
    talliesRef.current = { found: 0, errors: 0 };
    warned10Ref.current = false;
    tlRef.current = r.tlim;
    tlimRef.current = r.tlim;
    tapsRef.current = [];
    pendingPenaltyRef.current = 0;
    roundEndedRef.current = false;
    juice.reset();
    /*
     * A CONTINUED WAVE WAITS FOR THE PLAYER (see isCueGate above). The board
     * is already dealt behind the card, exactly as Survival deals it behind
     * its own Ready gate; `playStep` stays 'idle' so neither the clock nor the
     * tiles are live until the card is tapped.
     *
     * ⚠ NO 'click' HERE. The wave-clear 'win' cue has just played at the top
     * of the clear celebration, and a second acknowledgement a moment later
     * reads as two events for one — the same reason `beginFreeRoundAtStage`
     * takes `skipCueSound` after a win.
     */
    if (opts.continueWaves) {
      setPlayStep('idle');
      setCueShow(true);
      return;
    }
    await runCountdownThen(() => {
      setPlayStep('running');
    });
  };

  useEffect(() => {
    startLevelGameRef.current = startLevelGame;
  });

  /*
   * ── ENTERING A LEVEL ────────────────────────────────────────────────────
   * Every route into a level goes through here so the rule card cannot be
   * skipped by one of them. It fires only on the FIRST level of a world, only
   * when that world introduces something, and only once per world per player.
   *
   * ⚠ THE STORED FLAG IS VERSIONED (`@rules1`), for the reason the coach ids
   * are: a player who has already played this game has flags under the old
   * keys, and an unversioned flag would mean these lessons silently never
   * appear for exactly the people who have most to learn from them.
   */
  const RULES_SEEN_KEY = 'mm_cx_rules_seen_v1';
  const ruleSeen = (id) => {
    try {
      const raw = JSON.parse(localStorage.getItem(RULES_SEEN_KEY) || '{}');
      return !!raw[`${id}@rules1`];
    } catch { return false; }
  };
  const markRuleSeen = (id) => {
    try {
      const raw = JSON.parse(localStorage.getItem(RULES_SEEN_KEY) || '{}');
      raw[`${id}@rules1`] = true;
      localStorage.setItem(RULES_SEEN_KEY, JSON.stringify(raw));
    } catch { /* a lesson that cannot be remembered is still worth showing */ }
  };
  /*
   * ⚠ THE WORLD LESSON IS FLAGGED SEPARATELY FROM THE RULE CARD, AND THE SUFFIX
   * IS THE WHOLE DEFENCE. Same trap as `@coachN` on the onboarding id: reusing
   * `@rules1` would mean anyone who has already seen a world's CARD never gets
   * its new ACTIVE lesson, silently and only for existing players. A card read
   * and a rule practised are not the same event, so they do not share a flag.
   */
  const lessonSeen = (id) => {
    try {
      const raw = JSON.parse(localStorage.getItem(RULES_SEEN_KEY) || '{}');
      return !!raw[`${id}@lesson1`];
    } catch { return false; }
  };
  const markLessonSeen = (id) => {
    try {
      const raw = JSON.parse(localStorage.getItem(RULES_SEEN_KEY) || '{}');
      raw[`${id}@lesson1`] = true;
      localStorage.setItem(RULES_SEEN_KEY, JSON.stringify(raw));
    } catch { /* as above — an unrecordable lesson is still worth showing */ }
  };

  /* Deliberately a plain function, not a useCallback: `startLevelGame` is
     re-created every render (it closes over live round state), so memoising
     this would only produce a dependency that changes every time — the
     warning eslint gives for exactly that. Nothing downstream is memoised on
     its identity; it is called from click handlers. */
  const openLevel = (lv) => {
    const section = fqSectionOf(lv);
    const first = fqIndexInSection(lv) === 0;
    if (first && section?.mech && !ruleSeen(section.id)) {
      setPendingRule({ lv, section, mech: section.mech });
      setPhase('rule');
      return;
    }
    void startLevelGame(lv);
  };

  const onCellTap = useCallback((idx) => {
    // Held during the brief clear-celebration hold (see below) — a tap landing
    // in that window is on a round that has already finished, not a new
    // response.
    if (playStep !== 'running' || pauseOpen || cdShow || clearingRef.current) return;
    const r = roundRef.current;
    if (!r) return;
    // Source of truth is cellsRef (kept in sync), so all side effects run ONCE
    // here in the event handler — not inside the setCells updater, which
    // StrictMode double-invokes in dev (would double-log every response).
    const c = cellsRef.current[idx];
    if (!c || c.tapped) return;

    const now = performance.now();
    /*
     * Debounce sub-70ms repeats OF THE SAME CELL. The window is scoped to one
     * cell on purpose, and that scoping is the whole point.
     *
     * What it still catches: a hardware/synthetic double-fire — touchstart and
     * click both landing, or a palm bounce. Those always hit the SAME index, and
     * the `c.tapped` guard above cannot catch them alone, because cellsRef is
     * refreshed inside the setCells updater and React runs that at render — two
     * events dispatched in one tick therefore both still read tapped === false.
     *
     * ⚠ Why it must NOT be global (the bug this replaces). The old form compared
     * against the last tap ANYWHERE and dropped anything inside 70ms, so a fast,
     * entirely genuine tap on a DIFFERENT tile was swallowed — silently: no
     * sound, no mark, no penalty, the tile left looking exactly like one never
     * visited. The round clears only on `tappedTargets >= r.tc`, so each
     * swallowed target is one the player must somehow notice and re-tap. On a
     * 9x9 board with 17 targets a rapid scanner drops several, and gets the
     * reported "I cancel every shape and still I do not win".
     *
     * The premise was wrong too: the old comment claimed intentional taps are
     * ≥100ms apart, but practised serial tapping runs 6-8/s and bursts faster,
     * so on a dense grid the window was inside the range of real responses.
     */
    if (lastTapIdxRef.current === idx && now - lastTapRef.current < 70) return;
    const itt = lastTapRef.current ? now - lastTapRef.current : null;
    if (lastTapRef.current) tapsRef.current.push(now - lastTapRef.current);
    lastTapRef.current = now;
    lastTapIdxRef.current = idx;

    // Per-response record: grid position (idx/row/col), target flag, response
    // rank, round-onset latency (tOn), and `lead` marking the first response so
    // its latency (search-onset RT) can be separated from later inter-response
    // times. Feeds Center-of-Cancellation, search-organization, and SDT metrics.
    const ord = (roundOrdRef.current += 1);
    const tOn = gridOnsetRef.current ? Math.round(now - gridOnsetRef.current) : null;
    const tapCols = r.cols || r.grid;
    /* ⚠ `rt` USED TO CARRY TWO DIFFERENT QUANTITIES UNDER ONE NAME (fixed
       2026-09-19). `lastTapRef` is re-stamped at grid onset, so the interval on
       the FIRST response is a search-onset latency and on every later one it is
       an inter-response interval — and `trialLog.js` declares `rt` contractual
       ("response time in ms"), so `metrics.js` consumed both as RTs for meanRt,
       sdRt, ies and postErrorSlowing.
       They are now separate fields. A cancellation board has ONE onset and N
       responses, so a per-target RT from stimulus onset does not exist and
       cannot; what exists is one latency plus N−1 intervals, and they must not
       be averaged together. `rt` is kept as an alias ONLY for the first
       response, which is the one that genuinely is a reaction time. */
    const posFields = {
      idx,
      row: Math.floor(idx / tapCols),
      col: idx % tapCols,
      isT: !!c.isT,
      ord,
      ...(ord === 1 ? { lead: true } : {}),
      ...(tOn != null ? { tOn } : {}),
      /* The first response gets `onsetMs` (and `rt`, which it really is); every
         later one gets `iriMs`. Never both, so a consumer cannot silently mix. */
      ...(ord === 1
        ? tOn != null
          ? { onsetMs: tOn, rt: tOn }
          : {}
        : itt != null
          ? { iriMs: Math.round(itt) }
          : {}),
      /* A tap on the forbidden object is a COMMISSION ERROR, not an ordinary
         miss, and the two mean different things: one is a failure of search,
         the other a failure to withhold. Flagged in the record so the
         inhibition measure exists separately — the same distinction Intercept
         keeps, rather than folding both into one error count. */
      ...(c.isNoGo ? { noGo: true } : {}),
    };

    // Scored assessment is feedback-free: same neutral tap sound for hits and
    // false alarms, a neutral mark, and no time penalty. The short unscored
    // practice remains instructional so the player can learn the rule first.
    const isAssess = (r.mode === 'assess' || r.mode === 'adaptive') && !r.assessPractice;
    if (c.isT) {
      if (!r.assessPractice) {
        /* ⚠ Not while the coach is open — see the note on the false-alarm
           write below. A guided tap is not a measurement. */
        if (!coachOpenRef.current) {
          trialLogRef.current?.trial({ ok: true, ...posFields });
        }
      }
      foundIdxRef.current.add(idx);
      roundFoundSeqRef.current.push({ idx, row: posFields.row, col: posFields.col });
      /* A rising streak ladder on consecutive hits (collect → collect2/3/4),
         picked from the combo useJuice already tracks. Off in assessment
         (feedback-free by clinical design) and while the coach is open — a
         guided tap is not a performance, it stays the plain 'collect' cue. */
      if (isAssess || coachOpenRef.current) {
        playSfx(isAssess ? 'click' : 'collect');
      } else {
        const { combo } = juice.hit({});
        const step = Math.min(combo, 4);
        playSfx(step <= 1 ? 'collect' : `collect${step}`);
      }
      talliesRef.current.found += 1;
      const tappedTargets = talliesRef.current.found;
      setFound(tappedTargets);
      // Claim the cell synchronously. Waiting for React's state updater left a
      // small window where a second event could still observe the old board.
      const nextCells = cellsRef.current.map((x, i) => (
        i === idx ? { ...x, tapped: true, feedback: isAssess ? 'mark' : 'ok' } : x
      ));
      cellsRef.current = nextCells;
      setCells(nextCells);
      if (r.mode === 'free') {
        const add = freeTapPoints(r.diff, r.freeStage ?? 0);
        freeScoreRef.current += add;
        setFreeScore(freeScoreRef.current);
      }
      const hasRemainingTarget = nextCells.some((cell) => cell.isT && !cell.tapped);
      /*
       * ⚠ CLEARING THE BOARD MUST NOT END THE LESSON EITHER. The tutorial board
       * has three targets; step 2 has the player clear one. The natural next
       * move — the hand just said "tap it" — is to tap the other two, which won
       * the round, closed the coach and marked onboarding complete at step 2 of
       * 4. The player never met the decoy step, which is the entire reason this
       * lesson exists, and then met decoys by being punished for tapping one.
       *
       * So while the coach is open the round simply stays open. The coach ends
       * it (`onFinish`/`onSkip` → `endCoach`), and the round resolves after.
       */
      if (!hasRemainingTarget && !coachOpenRef.current) {
        if (isAssess) {
          // Feedback-free by clinical design — no pulse, no hold.
          endRoundRef.current(true);
        } else {
          /* The round gets a real ending: freeze the clock on THIS tick (so
             timeUsed/IES/accuracy are measured at the exact instant of the
             last hit, identically to before), then hold briefly on a quiet
             solve pulse before the results screen replaces the board.
             clearingRef blocks a stray tap and the auto-win effect below
             during the hold; it's cleared inside endRound itself once the
             delayed call lands. */
          stopTimer();
          clearingRef.current = true;
          setClearing(true);
          winPlayedRef.current = true;
          playSfx('win'); // the fanfare and the ring now start TOGETHER
          juice.celebrate();
          // 620ms is CUES.win's own length (last voice at 0.21 + dur 0.38 +
          // 0.04 tail = 630ms) — the results screen arrives on the chord's
          // last ring, not half a second after it already ended.
          clearHoldTimeoutRef.current = setTimeout(() => {
            clearHoldTimeoutRef.current = null;
            endRoundRef.current(true);
          }, 620);
        }
      }
      return;
    }

    if (!r.assessPractice) {
      /*
       * ⚠ TUTORIAL TAPS ARE NOT DATA.
       *
       * The trial log is created before the coach opens and `performance.now()`
       * keeps running while it holds the clock, so a tap made during the lesson
       * — with a hand pointing at the answer and unlimited time to read — was
       * being written into `mm_trials_cancel-task_v1` as a genuine hit or false
       * alarm, carrying however many seconds the player spent reading. That
       * contaminates search-onset RT, inter-response times and Center-of-
       * Cancellation for that round, in the player's own history. This app is
       * built by a psychologist; a demonstration must not enter the record.
       */
      if (!coachOpenRef.current) {
        trialLogRef.current?.trial({ ok: false, ...posFields });
      }
    }
    playSfx(isAssess ? 'click' : 'error');
    if (!isAssess) juice.miss(); // resets the streak ladder; the 'bad' visual still fires regardless
    /*
     * ⚠ A MISTAKE MADE DURING THE LESSON COSTS NO TIME.
     *
     * The coach holds the clock while it is open, but the wrong-tap penalty is
     * BANKED (`pendingPenaltyRef`) and spends itself the moment the clock
     * restarts. So a first-time player who tapped a decoy while Dr Kawkab was
     * explaining decoys used to walk into the round already three seconds down,
     * with nothing on screen connecting the loss to the tap. Trying the wrong
     * thing is the point of a tutorial; it must be free.
     */
    if (!isAssess && !coachOpenRef.current) {
      pendingPenaltyRef.current += FQ_WRONG_TAP_PENALTY_SEC;
      setPenaltyFlash({ id: now });
      clearTimeout(penaltyFlashTimeoutRef.current);
      penaltyFlashTimeoutRef.current = setTimeout(() => setPenaltyFlash(null), 650);
    }
    if (!coachOpenRef.current) {
      talliesRef.current.errors += 1;
      setErrors(talliesRef.current.errors);
    }
    const nextCells = cellsRef.current.map((x, i) => (
      i === idx ? { ...x, tapped: true, feedback: isAssess ? 'mark' : 'bad' } : x
    ));
    cellsRef.current = nextCells;
    setCells(nextCells);
    /*
     * ⚠ THE LESSON MUST NOT BE LOSABLE. The three lines above/below are the
     * three consequences of a wrong tap, and guarding only the CLOCK left the
     * other two live — which was worse than not guarding at all:
     *
     * Survival has ONE life (FREE_LIVES) and the tutorial board carries three
     * targets, so `freeRoundErrorCap(3)` is 2. Dr Kawkab points a crossed-out
     * hand at a decoy and says it is not your shape; the player taps it to see
     * what happens — which this coach's own header calls the point of a
     * tutorial — and that is error 1 of 2. One more slip anywhere on a 20-cell
     * board failed the round, spent the only life, and dropped them on a
     * results screen mid-sentence. Worse, ANY round end closes the coach
     * (`endCoach` → `markOnboardingSkipped`), so the lesson was then marked
     * permanently complete having never shown steps 3 and 4.
     *
     * The red 'bad' feedback above still fires, because seeing the mistake IS
     * the lesson. Only the punishment is suspended.
     */
    if (r.mode === 'free' && !coachOpenRef.current) {
      const pen = freeWrongTapPenalty(r.diff);
      freeScoreRef.current = Math.max(0, freeScoreRef.current - pen);
      setFreeScore(freeScoreRef.current);
      // Too many wrong taps this round → fail the round (ends the run; 1 life).
      if (talliesRef.current.errors >= freeRoundErrorCap(r.tc)) {
        endRoundRef.current(false);
        return;
      }
    }
    /* `coachOpenRef` is a ref and never changes identity, but it now arrives
       from `useCoachRun` rather than a local `useRef`, so the lint rule can no
       longer tell. Listed to keep the warning off; it does not re-create this
       callback. */
  }, [playStep, pauseOpen, cdShow, playSfx, juice, coachOpenRef, stopTimer]);

  /* ⚠ BOTH gated on clearingRef — the round has already ended internally
     during the ~420ms clear-celebration hold (see onCellTap), it just
     hasn't SHOWN results yet. Without this, pausing here left `pauseOpen`
     stuck true into the round the celebration hands off to (nothing in that
     branch of endRound resets it, because normally there's nothing open to
     reset) — silently freezing the very next round until the player found
     and tapped Resume. Restarting was worse: it let the OLD round's already-
     armed endRound(true) timeout fire against the FRESH round moments later,
     via the live ref, scoring a level the player never played and awarding
     it for real. Both bugs are closed the same way: chrome simply can't be
     reached during a transition this short. */
  const onHudPause = useCallback(() => {
    if (playStep !== 'running' || clearingRef.current) return;
    stopTimer();
    setPauseOpen(true);
  }, [playStep, stopTimer]);

  const onHudQuit = useCallback(() => {
    if (clearingRef.current) return;
    if (playStep === 'running') stopTimer();
    setQuitOpen(true);
  }, [playStep, stopTimer]);

  /* Escape leaves the ready gate, the same way it leaves the coach — the
     keyboard half of the visible Quit chip on that screen.
     ⚠ IT HAS TO LIVE HERE, BELOW `onHudQuit`. The first version sat beside
     the gate's focus effect ~600 lines up, where `onHudQuit` is still in its
     temporal dead zone: the effect BODY would have been fine (it runs after
     render) but the dependency array is evaluated DURING render, which throws
     before anything paints. */
  useEffect(() => {
    if (!cueShow || !isCueGate(roundRef.current)) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); onHudQuit(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cueShow, round, onHudQuit]);

  const openChallenge = () => {
    const names = chalNames.map((s, i) => s.trim() || `Player ${i + 1}`);
    if (names.length < 2) {
      alert(t.needTwo);
      return;
    }
    clearPlayRoundState();
    setChalNames(names);
    chalRoundsTotalRef.current = chalRoundsTotal;
    chalDiffRef.current = chalDiff;
    chalCycleRef.current = 0;
    setChalRoundIdx(0);
    const seed = prepareChallengeSeed(chalDiffRef.current);
    setChalSeed(seed);
    setChalIdx(0);
    chalIdxRef.current = 0;
    const initial = names.map((nm) => ({ nm, rounds: [] }));
    chalScoresRef.current = initial;
    setChalTurnOpen(true);
    setPhase('play');
  };

  const startChallengeRound = () => {
    if (!chalSeed) return;
    setChalTurnOpen(false);
    roundEndedRef.current = false;
    const r = prepareChallengePlayState(chalSeed);
    roundRef.current = r;
    setRound(r);
    setCells(r.cells);
    setFound(0);
    setErrors(0);
    talliesRef.current = { found: 0, errors: 0 };
    warned10Ref.current = false;
    tlRef.current = r.tlim;
    tlimRef.current = r.tlim;
    tapsRef.current = [];
    pendingPenaltyRef.current = 0;
    juice.reset();
    setPlayStep('running');
    playSfx('click');
  };

  const confirmQuit = () => {
    setQuitOpen(false);
    const mode = roundRef.current?.mode;
    trialLogRef.current?.discard();
    trialLogRef.current = null;
    clearPlayRoundState();
    if (mode === 'challenge') setPhase('chal');
    else if (mode === 'level') setPhase('levels');
    else if (mode === 'assess') {
      if (assessmentMode && onAssessmentExit) onAssessmentExit();
      else setPhase('hub');
    } else setPhase('hub');
  };

  const bandLbl = (b) => (b === 'high' ? t.bandHigh : b === 'mid' ? t.bandMid : t.bandLow);

  /** Leave the assessment: back to the global assessment flow when launched from
   *  the training-page fox, otherwise back to the game hub. */
  const exitAssess = useCallback(() => {
    trialLogRef.current?.discard();
    trialLogRef.current = null;
    clearPlayRoundState();
    if (assessmentMode && onAssessmentExit) onAssessmentExit();
    else setPhase('hub');
  }, [assessmentMode, onAssessmentExit, clearPlayRoundState]);

  const pauseLabels = {
    paused: t.paused,
    resume: t.resume,
    restart: t.restart,
    quitMenu: t.quitMenu,
  };
  const quitLabels = {
    quitQ: t.quitQ,
    quitLose: t.quitLose,
    yesQuit: t.yesQuit,
    keep: t.keep,
  };

  return (
    <div
      className="cancellation-task-game ct-fq-root cx-atlas"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {phase === 'hub' && (
        <>
          {/* No `cx-page` here, deliberately: the mode-pick screen keeps the
              shared cosmos void every other game's hub sits on. The rest of
              this game's screens stay on the atlas' warm paper. */}
          <div className="ct-fq-training-shell ct-fq-training-shell--mode-cosmos">
            <div className="ct-fq-screen ct-fq-training-screen ct-fq-training-screen--hub">
              <TrainingMenuBar
                onBack={onBack}
                playSfx={playSfx}
                hubSpaced
                variant="paper"
                onReplayTutorial={openTutorial}
                replayHint={tutReplayHint}
                center={
                  <div className="ct-fq-hub-attn-head">
                    <div className="ct-fq-hub-attn-big">{t.hubAttentionWord}</div>
                    <div className="ct-fq-hub-attn-sub">{t.hubTrainingTag}</div>
                  </div>
                }
              />
              <FqAttentionLightModes
                t={t}
                isAr={isAr}
                playSfx={playSfx}
                onFree={startFreeMode}
                onLevels={() => setPhase('levels')}
                onChallenge={() => setPhase('chal')}
              />
              <HubScienceLink gameId="cancel-task" isAr={isAr} playSfx={playSfx} />
            </div>
          </div>
        </>
      )}

      {phase === 'freeIntro' && (
        <SurvivalIntro
          isAr={isAr}
          playSfx={playSfx}
          title={t.freeIntroTitle}
          body={t.freeIntroBody}
          onReady={onFreeIntroReady}
          onBack={() => {
            clearPlayRoundState();
            setPhase('hub');
          }}
        />
      )}

      {phase === 'adaptIntro' && (
        <SurvivalIntro
          isAr={isAr}
          playSfx={playSfx}
          title={t.adaptIntroTitle}
          body={t.adaptIntroBody}
          onReady={onAdaptIntroReady}
          onBack={() => {
            clearPlayRoundState();
            setPhase('assessIntro');
          }}
        />
      )}

      {/* ⚠ The `diff` phase is gone (2026-08-28, the ladder). Level mode goes
          straight from the hub to ONE grid — no Easy/Medium/Hard screen.
          ⚠ PROTOTYPE (2026-09-11): this ONE call site swapped the flat
          `TrainingLevelGrid` for `CancelPlanetPath` — same prop contract,
          Cancellation only. See the header comment in CancelPlanetPath.jsx
          for why. Revert by importing `TrainingLevelGrid` again and
          swapping the tag name below; nothing else here changes. */}
      {phase === 'levels' && (
        <CancelPlanetPath
          isAr={isAr}
          playSfx={playSfx}
          onBack={() => setPhase('hub')}
          title={t.title}
          blurb={t.ladderBlurb(FQ_LADDER_LEVELS.toLocaleString(isAr ? 'ar-EG' : 'en-US'))}
          count={FQ_LADDER_LEVELS}
          isUnlocked={(lv) => (lv === 1 || lv <= ladderReached + 1
            || !!doneMap[`lad-${lv - 1}`] || !!doneMap[`lad-${lv}`])}
          isDone={(lv) => !!doneMap[`lad-${lv}`]}
          /*
           * ⚠ THE SHAPE OF THE ROUND THE PLAYER IS DEALT, not the curriculum's
           * numbers. `ladderLvCfg().tc` is the AUTHORED target count on the
           * square 5x5/7x7/9x9 board; every mode a human plays reflows onto
           * the thumb-safe PLAY_BOARD and rescales the count with it. So the
           * map used to promise "4 targets" for a level that deals 3.
           *
           * ⚠ AND IT IS THE FIRST WAVE'S BOARD, NAMED AS SUCH BY THE WAVE
           * COUNT BESIDE IT. The waves of a level no longer deal the same
           * board — targets climb and the clock tightens across them — so a
           * single pair of numbers can only honestly describe one of them.
           * The first is the one the player meets on tapping the planet, and
           * the count says how many more follow, which is the thing a level
           * three to eight boards long most needs to state up front.
           */
          sublabel={(lv) => {
            const first = fqWaveShape(lv, 0);
            return t.cxNodeSub(first.tc, first.time, fqSetsForLevel(lv));
          }}
          onPick={(lv) => openLevel(lv)}
          /*
           * ⚠ THE CHAPTER CARDS COME FROM THE WORLDS. Two lists of the same six
           * things is how a map ends up saying "First Light" while the rule card
           * two taps later says "Ember Reach" — the same one-name-one-place rule
           * the Detective line-up had to learn. The duplicate (`t.cxBands`) was
           * deleted on 2026-09-19 once the results callout moved here too; it
           * had drifted, describing the dual-target world as "a denser board".
           */
          bands={FQ_SECTIONS.map((s) => ({
            title: isAr ? s.ar : s.en,
            sub: FQ_MECHANIC_LABELS[s.mech]?.[isAr ? 'ar' : 'en'] || (isAr ? s.arSub : s.enSub),
            aria: isAr ? s.ar : s.en,
          }))}
          stars={(lv) => (profile.stars || {})[lv] || 0}
          sections={FQ_SECTIONS}
          help={{
            open: t.mapHelpOpen,
            title: t.mapHelpTitle,
            close: t.mapHelpClose,
            rows: t.mapHelpRows,
          }}
        />
      )}

      {/* ── A NEW RULE, TAUGHT BEFORE IT CAN BE FAILED ────────────────────────
          Shown once, on the first level of a world that introduces something,
          and never again for that world. It states the rule, then why the rule
          is worth meeting — one screen, one idea, both languages on the same
          object so they cannot drift apart. */}
      {phase === 'rule' && pendingRule && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light cx-page">
          <div className="ct-fq-screen ct-fq-training-screen">
            <TrainingMenuBar
              variant="paper"
              playSfx={playSfx}
              onBack={() => { setPendingRule(null); setPhase('levels'); }}
            />
            <div className="cx-rule" data-section={pendingRule.section.id}>
              <div className="cx-rule-world">
                <img className="cx-rule-sigil" src={atlasUrl(pendingRule.section.sigil)} alt="" aria-hidden="true" />
                <div className="cx-rule-world-name">{isAr ? pendingRule.section.ar : pendingRule.section.en}</div>
              </div>
              <div className="cx-rule-kicker">{t.ruleNew}</div>
              <h2 className="cx-rule-name">
                {FQ_MECHANIC_LABELS[pendingRule.mech]?.[isAr ? 'ar' : 'en'] || ''}
              </h2>
              <p className="cx-rule-what">
                {FQ_MECHANIC_TEACH[pendingRule.mech]?.[isAr ? 'ar' : 'en']?.what || ''}
              </p>
              <p className="cx-rule-why">
                {FQ_MECHANIC_TEACH[pendingRule.mech]?.[isAr ? 'ar' : 'en']?.why || ''}
              </p>
              <button
                type="button"
                className="ct-fq-btn"
                onClick={() => {
                  const lv = pendingRule.lv;
                  markRuleSeen(pendingRule.section.id);
                  setPendingRule(null);
                  void startLevelGame(lv);
                }}
              >
                {t.ruleBegin}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── THE WORLD REVIEW ─────────────────────────────────────────────────
          Ten levels done. It reports what was measured — stars, accuracy, the
          rule that was learned — and names what the next world brings. No
          claim about the player beyond the run they just finished. */}
      {phase === 'review' && sectionReview && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light cx-page">
          <div className="ct-fq-screen ct-fq-training-screen">
            <div className="cx-review" data-section={sectionReview.section.id}>
              <div className="cx-review-kicker">{t.reviewTitle}</div>
              <h2 className="cx-review-name">
                {isAr ? sectionReview.section.ar : sectionReview.section.en}
              </h2>
              <img className="cx-review-sigil" src={atlasUrl(sectionReview.section.sigil)} alt="" aria-hidden="true" />
              <div className="cx-review-stats">
                <div className="cx-review-stat">
                  <b className="readout">{sectionReview.stars}<span className="cx-review-of">/{sectionReview.starsMax}</span></b>
                  <em>{t.reviewStars}</em>
                </div>
                <div className="cx-review-stat">
                  <b className="readout">{sectionReview.acc}%</b>
                  <em>{t.reviewAcc}</em>
                </div>
              </div>
              <div className="cx-review-taught">
                <span className="cx-review-label">{t.reviewTaught}</span>
                <span className="cx-review-line">
                  {FQ_MECHANIC_TEACH[sectionReview.section.mech]?.[isAr ? 'ar' : 'en']?.why || ''}
                </span>
              </div>
              {sectionReview.next ? (
                <div className="cx-review-next">
                  <span className="cx-review-label">{t.reviewNext}</span>
                  <span className="cx-review-line">
                    {(isAr ? sectionReview.next.ar : sectionReview.next.en)}
                    {' · '}
                    {FQ_MECHANIC_LABELS[sectionReview.next.mech]?.[isAr ? 'ar' : 'en'] || ''}
                  </span>
                </div>
              ) : null}
              <button
                type="button"
                className="ct-fq-btn"
                onClick={() => { setSectionReview(null); setPhase('levels'); }}
              >
                {t.reviewOn}
              </button>
            </div>
          </div>
        </div>
      )}

      {phase === 'chal' && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light cx-page">
          <div className="ct-fq-screen ct-fq-training-screen">
            <TrainingMenuBar
              onBack={() => {
                clearPlayRoundState();
                setPhase('hub');
              }}
              playSfx={playSfx}
              variant="paper"
            />
            <PassPlaySetup
              isAr={isAr}
              playSfx={playSfx}
              subtitle={t.challengeSub}
              diffKeys={FQ_DIFF_KEYS}
              diffLabels={DM}
              diff={chalDiff}
              onDiffChange={setChalDiff}
              players={chalNames}
              onPlayersChange={setChalNames}
              rounds={chalRoundsTotal}
              onRoundsChange={setChalRoundsTotal}
              onStart={() => { playSfx('click'); openChallenge(); }}
              labels={{
                difficulty: t.chalPickDiff,
                players: t.players,
                addPlayer: t.addPl,
                rounds: t.chalRounds,
                roundsHint: t.chalRoundsHint,
                start: t.startCh,
              }}
            />
          </div>
        </div>
      )}

      {phase === 'play' && chalTurnOpen && !round && chalNames[chalIdx] && (
        <TrainingChallengeHandoff
          isAr={isAr}
          kicker={t.chalTurnKicker}
          playerName={chalNames[chalIdx]}
          roundLine={
            chalRoundsTotal > 1 ? t.roundNofM(chalRoundIdx + 1, chalRoundsTotal) : null
          }
          /* `dmLabel`, not `DM[...].label` — the raw field is English-only
             and this line sits in an Arabic handoff screen. */
          metaLine={`${dmLabel(chalDiff, isAr)} · ${PASS_PLAY_CONFIG[chalDiff]?.cols ?? 7}×${PASS_PLAY_CONFIG[chalDiff]?.rows ?? 9} · ${PASS_PLAY_CONFIG[chalDiff]?.tlim ?? 50}s`}
          instruction={t.handTo(chalNames[chalIdx])}
          bullets={[t.chalBulletSame, t.chalBulletPass]}
          startLabel={t.goReady}
          onStart={startChallengeRound}
          playSfx={playSfx}
        />
      )}

      {phase === 'play' && round && (
        <>
          <div className="ct-fq-play" data-gameplay-active="true">
          <div className={`ct-fq-g-wrap ct-fq-g-wrap--scene2d ct-juice-host${clearing ? ' is-clearing' : ''}`} ref={gridWrapRef}>
            <CancelBoard2D
              cells={cells}
              round={round}
              interactive={playStep === 'running' && !pauseOpen && !cdShow && !clearing}
              onTapCell={onCellTap}
              isAr={isAr}
              boardApiRef={boardApiRef}
              /* Premium flat object art for all training play. Assessment and
                 Adaptive keep the controlled abstract stimulus set. */
              useArt={usesPremiumTrainingArt(round, cells)}
            />

            {/* Dr Kawkab teaches on this exact board. Sibling of the board and
                also inset:0, so the hand's screen fractions line up with it. */}
            {/* ⚠ ONE MOUNT, TWO RUNS. `coachOpen` is the union of the base
                Survival onboarding and the automatic world lesson; whichever is
                open supplies its own script and its own ending. Mounting the
                world lesson separately would have been a second `<CoachLayer>`
                able to open at the same time as the first. */}
            {coachOpen && (
              <CancelTaskCoach
                isAr={isAr}
                playSfx={playSfx}
                cells={cells}
                boardApiRef={boardApiRef}
                script={worldLesson?.script}
                onFinish={worldLesson ? endWorldLesson : endCoach}
                onSkip={worldLesson ? endWorldLesson : endCoach}
              />
            )}
            <div className="ct-fq-scene2d-overlay">
            {penaltyFlash && (
              <div key={penaltyFlash.id} className="cb2d-penalty-flash" dir="ltr" aria-hidden="true">
                {`−${(3).toLocaleString(isAr ? 'ar-EG' : 'en-US')}${isAr ? 'ث' : 's'}`}
              </div>
            )}
            <JuiceLayer
              combo={juice.combo}
              toast={juice.toast}
              burst={juice.burst}
              ratingLabels={rLabels}
              showCombo={false}
            />
            <PlayHud
              t={t}
              playStep={playStep}
              pauseOpen={pauseOpen}
              tlRef={tlRef}
              tlimRef={tlimRef}
              roundTlim={round.tlim}
              useSessionTimer={false}
              found={found}
              tc={cells.filter((c) => c.isT).length}
              errors={errors}
              errorsLabel={round.mode === 'free' ? t.freeStrikes : undefined}
              errorsMax={round.mode === 'free' ? freeRoundErrorCap(round.tc) : undefined}
              hideErrors={(round.mode === 'assess' && !round.assessPractice) || round.mode === 'adaptive'}
              lvlLabel={
                round.mode === 'free'
                  ? null
                  : round.mode === 'assess'
                    ? round.assessPractice
                      ? t.assessPracticeLabel
                      : `${(round.assessTrial ?? 0) + 1}/${round.assessTrialsTotal ?? ASSESSMENT_PROTOCOL.trials}`
                    : round.mode === 'adaptive'
                      ? `R${(staircaseRef.current?.trialCount ?? 0) + 1}`
                      : round.lv === 'CH'
                        ? 'CH'
                        /*
                         * ⚠ THE LADDER LEVEL, NOT THE CURRICULUM ONE — and
                         * WHICH WAVE OF IT. `round.lv` is the authored level
                         * `prepareLevelRound` was given, which on the ladder is
                         * a tier index: tapping level 5 on the map opened a
                         * board whose HUD read "L23", and level 21 read "L1"
                         * directly after level 20 read "L100". The map and the
                         * board now agree. The wave counter is the other half —
                         * a level is three to eight boards and, since the ramp
                         * landed, they are not the same board, so "which one am
                         * I on" is a question the screen has to answer.
                         * Numerals only: nothing to translate, so the EN and AR
                         * halves of the dict cannot drift apart.
                         *
                         * ⚠ TWO LINES, NOT ONE, AND THE CHIP IS WHY. Measured
                         * on the live HUD it is 51px wide in 16.8px DM Mono, so
                         * "L1 · 1/3" needs 81px — it wrapped, and it wrapped at
                         * the separator, leaving a lone "·" on a line of its
                         * own. A second element is deliberate rather than a
                         * hoped-for wrap.
                         */
                        : round.ladderLv
                          ? ((round.wavesTotal ?? 1) > 1
                            ? (
                              <>
                                {`L${round.ladderLv}`}
                                <span className="cx-hud-wave">
                                  {`${(round.waveIdx ?? 0) + 1}/${round.wavesTotal}`}
                                </span>
                              </>
                            )
                            : `L${round.ladderLv}`)
                          : `L${round.lv}`
              }
              freeScore={round.mode === 'free' ? freeScore : undefined}
              freeLives={round.mode === 'free' ? freeLives : undefined}
              freeLivesMax={FREE_LIVES}
              targetShape={
                round.target in SH
                  ? round.target
                  : cells.find((c) => c.isT)?.shape || 'circle'
              }
              targetColor={
                round.targetCol || cells.find((c) => c.isT)?.fill || 'var(--game-ink)'
              }
              targetAriaLabel={shapeArtLabel(
                round.target in SH ? round.target : cells.find((c) => c.isT)?.shape || 'circle',
                isAr,
                shapeArtSetForRound(round),
              )}
              targetVisual={usesPremiumTrainingArt(round, cells)
                ? <CancellationTarget round={round} cells={cells} size={38} isAr={isAr} />
                : undefined}
              onMenu={onHudQuit}
              onPause={onHudPause}
              menuAriaLabel={t.menu}
              pauseAriaLabel={t.pause}
              playSfx={playSfx}
            />
            </div>
          </div>
          </div>

          <TrainingPauseModal
            open={pauseOpen}
            labels={pauseLabels}
            showRestart={round.mode !== 'assess'}
            onResume={() => {
              setPauseOpen(false);
              if (playStep === 'running') runRef.current = true;
            }}
            onRestart={() => {
              setPauseOpen(false);
              if (round.mode === 'level') startLevelGame(round.ladderLv ?? 1);
              else if (round.mode === 'free') void beginFreeRoundAtStage(round.freeStage ?? 0);
              else if (round.mode === 'challenge') startChallengeRound();
            }}
            onQuitMenu={() => {
              setPauseOpen(false);
              setQuitOpen(true);
            }}
          />
          <TrainingQuitModal
            open={quitOpen}
            labels={quitLabels}
            onConfirmQuit={confirmQuit}
            onKeepPlaying={() => {
              setQuitOpen(false);
              if (playStep === 'running') runRef.current = true;
            }}
          />

        </>
      )}

      {phase === 'res' && lastResult?.type === 'level' && (() => {
        // A multi-wave level's LAST round's cells are not the level's whole
        // target count — `aggTc` (set once all waves clear) is the total
        // across every wave and takes priority when present.
        const targetCount = lastResult.r.aggTc ?? (Array.isArray(lastResult.r.cells)
          ? lastResult.r.cells.filter((cell) => cell.isT).length
          : lastResult.r.tc);
        // A band just closed: this level ends a decade (10/20/.../50 — 60 is
        // the top of the ladder, nothing comes after it) and the player won.
        const clearedLadderLv = lastResult.r.ladderLv ?? 0;
        const justClosedBand = lastResult.stats.won
          && clearedLadderLv % 10 === 0
          && clearedLadderLv > 0
          && clearedLadderLv < FQ_LADDER_LEVELS;
        const bandIdx = justClosedBand ? clearedLadderLv / 10 - 1 : -1;
        const nextBandIdx = bandIdx + 1;
        /* ⚠ READS THE WORLDS, NOT `t.cxBands` (2026-09-19) — the move the
           comment on the level map said was pending. It mattered more than
           tidiness: `cxBands[2]` described band 3 as "A denser board" when band
           3 is the two-shape DUAL hunt, so clearing level 20 promised density
           and the map two taps later said the target changes. Three names, two
           descriptions, one world. Same one-name-one-place rule the Detective
           line-up had to learn. `cxBands` is now deleted from both dicts. */
        const bandCard = (i) => {
          const s = FQ_SECTIONS[i];
          if (!s) return null;
          return {
            title: isAr ? s.ar : s.en,
            sub: FQ_MECHANIC_LABELS[s.mech]?.[isAr ? 'ar' : 'en'] || (isAr ? s.arSub : s.enSub),
          };
        };
        /*
         * ⚠ A PENDING WORLD REVIEW INTERCEPTS EVERY EXIT FROM THE RESULTS,
         * not just the one button someone remembered to wire. Finishing the
         * tenth level of a world and leaving by "Menu" would otherwise skip
         * the review entirely — and since it is only offered once, skipping it
         * means never seeing it. The review then hands the player on to the
         * level map itself.
         */
        const leaveResults = () => {
          setLastResult(null);
          clearPlayRoundState();
          if (sectionReview) { setPhase('review'); return; }
          setPhase('hub');
        };
        return (
          <div className="ct-fq-training-shell ct-fq-training-shell--hub-light cx-page">
            <PlayResults
              isAr={isAr}
              title={lastResult.stats.won ? t.resultsLevelPass : t.timeRanOut}
              tone={lastResult.stats.won ? 'success' : 'retry'}
              headline={{ value: `${lastResult.found}/${targetCount}`, label: t.targetsFound }}
              /* ⚠ THE HEADLINE ALREADY CARRIES DETECTION, so an "Accuracy %"
                 tile beside it was either redundant (if honest) or a lie (as it
                 was). The tiles now show the two things the headline does NOT:
                 Focus score (d2 CP — the reliable composite) and Precision.
                 A null renders as '—', never as a fabricated perfect score. */
              stats={[
                { value: lastResult.stats.cp, label: t.focusScore },
                { value: `${lastResult.stats.timeUsed}s`, label: t.time },
                {
                  value:
                    lastResult.stats.precision != null
                      ? `${Math.round(lastResult.stats.precision * 100)}%`
                      : '—',
                  label: t.precision,
                },
                { value: lastResult.errors, label: t.err },
                {
                  value: lastResult.stats.avgRt != null ? `${lastResult.stats.avgRt}ms` : '—',
                  label: t.rt,
                },
              ]}
              notes={[t.focusScoreHint]}
              actions={[
                /* ⚠ GATED ON THE LADDER POSITION, NOT THE AUTHORED LEVEL
                   (2026-09-18). This read `lastResult.r.lv <
                   FQ_LEVELS_PER_TIER` — and `r.lv` is the AUTHORED level the
                   round was built from (1–100 within a tier), not the rung the
                   player is on. `ladderToTier` maps the 10th level of an
                   upper-half band to authored 100, so at ladder levels 20 and
                   40 the condition went false and passing the level offered no
                   "Next level" button at all: Replay and Menu only, at exactly
                   the band boundary where momentum matters most. 10, 30 and 50
                   were fine, which is what made it look like a design choice.
                   Ladder 60 hid the button correctly, but by coincidence.
                   Same family as the HUD that read L23 for level 5 — every
                   comparison about WHERE THE PLAYER IS belongs on `ladderLv`. */
                lastResult.stats.won && (lastResult.r.ladderLv ?? 1) < FQ_LADDER_LEVELS ? {
                  key: 'next',
                  label: t.nextLv,
                  onClick: () => {
                    setLastResult(null);
                    // Through `openLevel`, never straight into the round: the
                    // next level is often the first of a new world, and that
                    // is precisely the moment its rule has to be taught. A
                    // pending review comes first — it belongs to the world
                    // just finished.
                    if (sectionReview) { setPhase('review'); return; }
                    openLevel((lastResult.r.ladderLv ?? 1) + 1);
                  },
                } : null,
                {
                  key: 'retry',
                  label: lastResult.stats.won ? t.replay : t.retry,
                  variant: lastResult.stats.won ? 'ghost' : 'primary',
                  onClick: () => {
                    setLastResult(null);
                    startLevelGame(lastResult.r.ladderLv ?? 1);
                  },
                },
                { key: 'menu', label: t.menu, variant: 'ghost', onClick: leaveResults },
              ]}
              onMenu={leaveResults}
              playSfx={playSfx}
              /* The search block sits ABOVE the band callout: it describes the
                 level just played, the callout announces the next world. */
              extra={(
                <>
                  <CxSearchBlock t={t} org={lastResult.stats.org} />
                  {justClosedBand && bandCard(bandIdx) && bandCard(nextBandIdx) ? (
                    <CxResultsExtra
                      kind="band"
                      t={t}
                      bandTitle={bandCard(bandIdx).title}
                      nextBand={{
                        ...bandCard(nextBandIdx),
                        sigil: BAND_SIGIL[nextBandIdx % BAND_SIGIL.length],
                      }}
                    />
                  ) : null}
                </>
              )}
            />
          </div>
        );
      })()}

      {phase === 'freeRes' && lastResult?.type === 'free' && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light cx-page">
          <PlayResults
            isAr={isAr}
            title={t.freeGameOver}
            headline={{ value: lastResult.score ?? 0, label: t.score }}
            stats={[{ value: lastResult.roundsWon, label: t.roundsClearedLabel }]}
            notes={[`${t.freeBest(profile.freeBest ?? 0)} · ${t.freeBestScoreLine(profile.freeBestScore ?? 0)}`]}
            onAgain={() => {
              setLastResult(null);
              startFreeMode();
            }}
            onMenu={() => {
              setLastResult(null);
              clearPlayRoundState();
              setPhase('hub');
            }}
            playSfx={playSfx}
            extra={(() => {
              const rwBeat = (lastResult.roundsWon ?? 0) > (lastResult.prevBest ?? 0);
              const scoreBeat = (lastResult.score ?? 0) > (lastResult.prevBestScore ?? 0);
              const prevBest = rwBeat ? (lastResult.prevBest ?? 0) : (lastResult.prevBestScore ?? 0);
              return (
                <>
                  {/* Survival pools every round of the run, the failed one too. */}
                  <CxSearchBlock t={t} org={lastResult.org} />
                  {/* Change since baseline — appears only once the estimate is
                      settled (n >= 20) and a baseline exists, and it speaks
                      whether the news is good, bad or nothing. */}
                  <CxProgressBlock t={t} prog={lastResult.progress} />
                  {rwBeat || scoreBeat ? (
                    <CxResultsExtra kind="best" t={t} prevBest={prevBest} />
                  ) : null}
                </>
              );
            })()}
          />
        </div>
      )}

      {phase === 'adaptRes' && lastResult?.type === 'adaptive' && (() => {
        const thr = lastResult.threshold ?? 0;
        const { diff, lv } = freeStageToDiffLv(thr);
        const tierLabel = dmLabel(diff, isAr);
        const norm = Math.round((thr / 299) * 100);
        return (
          <div className="ct-fq-training-shell ct-fq-training-shell--hub-light cx-page">
            <div className="ct-fq-screen ct-fq-training-screen">
              <TrainingMenuBar
                onBack={() => {
                  setLastResult(null);
                  clearPlayRoundState();
                  setPhase('assessIntro');
                }}
                playSfx={playSfx}
                variant="paper"
                center={
                  <div style={{ textAlign: 'center' }}>
                    <div className="ct-fq-training-title ct-fq-training-title-sm">{t.adaptResTitle}</div>
                  </div>
                }
              />
              <div className="ct-fq-sbig">{norm}</div>
              <div className="ct-fq-ies-lbl">{t.adaptResLabel} · {t.adaptResSub}</div>
              <div
                className="ct-fq-sub ct-fq-training-blurb"
                style={{ marginTop: 10, fontWeight: 700, fontSize: '0.92rem' }}
              >
                {t.adaptResLevel(tierLabel, lv)}
              </div>
              <p className="ct-fq-sub ct-fq-training-blurb" style={{ marginTop: 6 }}>
                {t.adaptResMeta(lastResult.trials, lastResult.reversals)}
              </p>
              <button
                type="button"
                className="ct-fq-btn ct-fq-btn-pri"
                onClick={() => {
                  playSfx('click');
                  setLastResult(null);
                  startThreshold();
                }}
              >
                {t.adaptAgain}
              </button>
              <button
                type="button"
                className="ct-fq-btn ct-fq-btn-ghost"
                onClick={() => {
                  setLastResult(null);
                  clearPlayRoundState();
                  setPhase('assessIntro');
                }}
              >
                {t.menu}
              </button>
            </div>
          </div>
        );
      })()}

      {phase === 'chalRes' && lastResult?.type === 'challenge' && lastResult.rows && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light cx-page">
          <div className="ct-fq-screen ct-fq-training-screen">
            <TrainingMenuBar
              onBack={() => {
                setLastResult(null);
                clearPlayRoundState();
                setPhase('hub');
              }}
              playSfx={playSfx}
              variant="paper"
              center={
                <div style={{ textAlign: 'center' }}>
                  <div className="ct-fq-training-title ct-fq-training-title-sm">{t.resultsChalTitle}</div>
                </div>
              }
            />
            {[...lastResult.rows].sort((a, b) => b.ies - a.ies).map((row, i) => (
              <div key={row.nm} className={`ct-fq-lbr ct-fq-lbr-training ${i === 0 ? 'win' : ''}`}>
                <div className="ct-fq-lbrk">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</div>
                <div>
                  <div className="ct-fq-lbnm">{row.nm}</div>
                  <div className="ct-fq-lbdt">
                    {t.chalResDetail(
                      row.rounds?.length || 1,
                      row.timeUsed,
                      row.errors,
                      row.acc != null ? `${row.acc}%` : '—',
                      row.tps,
                    )}
                  </div>
                </div>
                <div className="ct-fq-lbsc">{Math.round(row.ies)}</div>
              </div>
            ))}
            <button
              type="button"
              className="ct-fq-btn ct-fq-btn-pri"
              onClick={() => {
                setLastResult(null);
                clearPlayRoundState();
                setPhase('chal');
                setChalSeed(null);
              }}
            >
              {t.newCh}
            </button>
            <button
              type="button"
              className="ct-fq-btn ct-fq-btn-ghost"
              onClick={() => {
                setLastResult(null);
                clearPlayRoundState();
                setPhase('hub');
              }}
            >
              {t.menu}
            </button>
          </div>
        </div>
      )}

      {phase === 'assessStart' && (
        <AssessmentReady
          isAr={isAr}
          label={assessmentLabel}
          step={assessmentStep}
          domainId={assessmentDomainId}
          onStart={beginBatteryAssessment}
          onBack={onAssessmentExit || onBack}
          playSfx={playSfx}
        />
      )}

      {phase === 'assessIntro' && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light cx-page">
          <div className="ct-fq-screen ct-fq-training-screen">
            <TrainingMenuBar
              onBack={exitAssess}
              playSfx={playSfx}
              variant="paper"
              center={
                <div style={{ textAlign: 'center' }}>
                  <div className="ct-fq-training-title ct-fq-training-title-sm">{t.assessIntroTitle}</div>
                </div>
              }
            />
            <div className="ct-fq-diff-body">
              <div className="ct-fq-assess-intro">
                <p className="ct-fq-sub ct-fq-training-blurb">{t.assessIntroBody}</p>
                <p className="ct-fq-sub ct-fq-training-blurb">{t.assessIntroMeasures}</p>
                <p className="ct-fq-assess-note">{t.assessIntroNote}</p>
              </div>
              <button
                type="button"
                className="ct-fq-btn ct-fq-btn-pri"
                style={{ width: '100%', maxWidth: 320 }}
                onClick={onAssessIntroReady}
              >
                {t.assessStart}
              </button>
              <button
                type="button"
                className="ct-fq-btn ct-fq-btn-ghost"
                style={{ width: '100%', maxWidth: 320 }}
                onClick={() => {
                  playSfx('click');
                  startThreshold();
                }}
              >
                {t.assessThreshold}
              </button>
              {assessHistory.length > 0 && (
                <button
                  type="button"
                  className="ct-fq-btn ct-fq-btn-ghost"
                  style={{ width: '100%', maxWidth: 320 }}
                  onClick={() => {
                    playSfx('click');
                    setPhase('assessHistory');
                  }}
                >
                  {t.assessViewHistory}
                </button>
              )}
              <HubScienceLink gameId="cancel-task" isAr={isAr} playSfx={playSfx} />
            </div>
          </div>
        </div>
      )}

      {phase === 'assessRes' && assessResult && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light cx-page">
          <div className="ct-fq-screen ct-fq-training-screen">
            <TrainingMenuBar
              onBack={exitAssess}
              playSfx={playSfx}
              variant="paper"
              center={
                <div style={{ textAlign: 'center' }}>
                  <div className="ct-fq-training-title ct-fq-training-title-sm">{t.assessResTitle}</div>
                </div>
              }
            />
            <div className={`ct-fq-sbig ct-fq-band-text-${assessResult.bands.composite}`}>
              {assessResult.composite}
            </div>
            <div className="ct-fq-ies-lbl">{t.assessIndex} · {t.assessIndexSub}</div>
            <div className="ct-fq-rm ct-fq-rm-training ct-fq-assess-grid">
              <AssessMetricTile
                value={`${Math.round(assessResult.detection * 100)}%`}
                label={t.mDetection}
                sub={t.mDetectionSub}
                band={assessResult.bands.detection}
                bandLabel={bandLbl(assessResult.bands.detection)}
              />
              <AssessMetricTile
                value={`${Math.round(assessResult.precision * 100)}%`}
                label={t.mPrecision}
                sub={t.mPrecisionSub}
                band={assessResult.bands.precision}
                bandLabel={bandLbl(assessResult.bands.precision)}
              />
              <AssessMetricTile
                value={assessResult.speed.toFixed(2)}
                label={t.mSpeed}
                sub={t.mSpeedSub}
                band={assessResult.bands.speed}
                bandLabel={bandLbl(assessResult.bands.speed)}
              />
              <AssessMetricTile
                value={assessResult.meanRT != null ? `${assessResult.meanRT}` : '—'}
                label={t.mRt}
                sub={t.mRtSub}
              />
              <AssessMetricTile
                value={assessResult.rtCV != null ? assessResult.rtCV.toFixed(2) : '—'}
                label={t.mStability}
                sub={t.mStabilitySub}
                band={assessResult.bands.rtcv}
                bandLabel={bandLbl(assessResult.bands.rtcv)}
              />
              <AssessMetricTile
                value={`${assessResult.totalOmissions}·${assessResult.totalCommissions}`}
                label={t.mErrors}
                sub={t.mErrorsSub}
              />
              <AssessMetricTile
                value={assessResult.dPrime != null ? assessResult.dPrime.toFixed(2) : '—'}
                label={t.mDPrime}
                sub={t.mDPrimeSub}
                band={assessResult.bands.dprime}
                bandLabel={bandLbl(assessResult.bands.dprime)}
              />
              <AssessMetricTile
                value={
                  assessResult.criterion != null
                    ? `${assessResult.criterion > 0 ? '+' : ''}${assessResult.criterion.toFixed(2)}`
                    : '—'
                }
                label={t.mBias}
                sub={t.mBiasSub(
                  assessResult.bands.criterion === 'cautious'
                    ? t.biasCautious
                    : assessResult.bands.criterion === 'impulsive'
                      ? t.biasImpulsive
                      : t.biasBalanced,
                )}
              />
              <AssessMetricTile
                value={
                  assessResult.cocH != null
                    ? `${assessResult.cocH > 0 ? '+' : ''}${assessResult.cocH.toFixed(2)}`
                    : '—'
                }
                label={t.mBalance}
                sub={t.mBalanceSub(
                  assessResult.cocH == null || Math.abs(assessResult.cocH) <= 0.1
                    ? t.balanceEven
                    : assessResult.cocH < 0
                      ? t.balanceLeft
                      : t.balanceRight,
                  assessResult.scanLat == null || Math.abs(assessResult.scanLat) <= 0.15
                    ? t.scanMid
                    : assessResult.scanLat < 0
                      ? t.scanL
                      : t.scanR,
                )}
                band={assessResult.bands.spatial}
                bandLabel={bandLbl(assessResult.bands.spatial)}
              />
              <AssessMetricTile
                value={assessResult.orgScore != null ? `${Math.round(assessResult.orgScore * 100)}` : '—'}
                label={t.mOrg}
                sub={t.mOrgSub(assessResult.bestR != null ? assessResult.bestR.toFixed(2) : '—')}
                band={assessResult.bands.organization}
                bandLabel={bandLbl(assessResult.bands.organization)}
              />
            </div>
            <div className="ct-fq-row">
              <button
                type="button"
                className="ct-fq-btn ct-fq-btn-pri"
                onClick={() => {
                  playSfx('click');
                  startAssessment();
                }}
              >
                {t.assessAgain}
              </button>
              <button
                type="button"
                className="ct-fq-btn ct-fq-btn-ghost"
                onClick={() => {
                  playSfx('click');
                  setPhase('assessHistory');
                }}
              >
                {t.assessViewHistory}
              </button>
              <button
                type="button"
                className="ct-fq-btn ct-fq-btn-ghost"
                onClick={exitAssess}
              >
                {t.menu}
              </button>
            </div>
          </div>
        </div>
      )}

      {phase === 'assessHistory' && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light cx-page">
          <div className="ct-fq-screen ct-fq-training-screen">
            <TrainingMenuBar
              onBack={() => {
                if (assessResult) setPhase('assessRes');
                else exitAssess();
              }}
              playSfx={playSfx}
              variant="paper"
              center={
                <div style={{ textAlign: 'center' }}>
                  <div className="ct-fq-training-title ct-fq-training-title-sm">{t.assessHistTitle}</div>
                </div>
              }
            />
            {assessHistory.length === 0 ? (
              <p className="ct-fq-sub ct-fq-training-blurb">{t.assessNoHistory}</p>
            ) : (
              <>
                {(() => {
                  const best = Math.max(...assessHistory.map((s) => s.composite));
                  const comps = assessHistory.map((s) => s.composite);
                  const lo = Math.min(...comps);
                  const hi = Math.max(...comps);
                  const span = hi - lo || 1;
                  const W = 280;
                  const H = 56;
                  const n = comps.length;
                  const pts = comps
                    .map((c, i) => {
                      const x = n === 1 ? W / 2 : (i / (n - 1)) * W;
                      const y = H - ((c - lo) / span) * H;
                      return `${x.toFixed(1)},${y.toFixed(1)}`;
                    })
                    .join(' ');
                  return (
                    <>
                      <p className="ct-fq-sub ct-fq-training-blurb" style={{ marginBottom: 6 }}>
                        {t.assessHistBest(best)}
                      </p>
                      {n > 1 && (
                        <svg
                          className="ct-fq-spark"
                          viewBox={`0 0 ${W} ${H}`}
                          preserveAspectRatio="none"
                          aria-hidden="true"
                        >
                          <polyline points={pts} fill="none" stroke="#b87220" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                        </svg>
                      )}
                    </>
                  );
                })()}
                <p className="ct-fq-sub ct-fq-training-blurb" style={{ marginTop: 4, marginBottom: 8, fontWeight: 700 }}>
                  {t.assessHistRecent}
                </p>
                {[...assessHistory]
                  .map((s, i) => ({ s, i }))
                  .reverse()
                  .map(({ s, i }) => {
                    const prev = i > 0 ? assessHistory[i - 1].composite : null;
                    const delta = prev != null ? s.composite - prev : 0;
                    const d = new Date(s.ts);
                    const when = `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                    return (
                      <div key={s.ts} className="ct-fq-lbr ct-fq-lbr-training">
                        <div className={`ct-fq-lbrk ct-fq-band-text-${compositeBand(s.composite)}`}>
                          {s.composite}
                        </div>
                        <div>
                          <div className="ct-fq-lbnm">{when}</div>
                          <div className="ct-fq-lbdt">
                            {Math.round(s.detection * 100)}% · {s.speed.toFixed(2)}/s · {s.meanRT ?? '—'}ms · CV {s.rtCV ?? '—'}
                          </div>
                        </div>
                        <div className="ct-fq-lbsc" style={{ fontSize: '0.9rem' }}>
                          {prev != null ? t.assessVsPrev(delta) : ''}
                        </div>
                      </div>
                    );
                  })}
              </>
            )}
            <button
              type="button"
              className="ct-fq-btn ct-fq-btn-pri"
              onClick={() => {
                playSfx('click');
                startAssessment();
              }}
            >
              {t.assessAgain}
            </button>
            <button
              type="button"
              className="ct-fq-btn ct-fq-btn-ghost"
              onClick={exitAssess}
            >
              {t.menu}
            </button>
          </div>
        </div>
      )}

      {/* Countdown / quick-flash carry the target cue card (level · free ·
          challenge). Assessment & adaptive use the bare centred "+" fixation so
          the gaze origin stays clean for Center-of-Cancellation; their target
          chip lives in the top bar and the rule is given in the intro. */}
      {phase === 'play' && (cdShow || cueShow || cdLeaving) && round && (() => {
        /* ⚠ ONE FLAG, READ EVERYWHERE. Every attribute below used to re-derive
           "is this cue waiting for me?" as `round.mode === 'free' && cueShow`,
           once per attribute — so widening it to continued waves meant making
           the identical edit a dozen times, and missing one would have left a
           card that is a dialog but takes no click, or takes a click with no
           label. */
        const cueGate = cueShow && isCueGate(round);
        const waveGate = cueGate && round.mode === 'level';
        return (
        <div
          className={`ct-fq-cd${cueGate ? ' ct-fq-cd--ready' : ''}${cdLeaving ? ' is-leaving' : ''}`}
          role={cueGate ? 'dialog' : undefined}
          aria-modal={cueGate ? 'true' : undefined}
          aria-label={cueGate ? t.survivalCueTitle : undefined}
        >
          {cdShow && <div className="ct-fq-cd-num">{cdVal}</div>}
          {cueGate && (
            /* On a wave the kicker names WHICH wave, because that is the thing
               the player cannot otherwise tell at this moment — the HUD chip
               behind the card says it, and the card covers the HUD. `setOf`
               already existed in both dicts, unused. */
            <div className="ct-fq-cue-kicker">
              {waveGate
                ? t.setOf((round.waveIdx ?? 0) + 1, round.wavesTotal ?? LEVEL_WAVES)
                : t.survivalCueTitle}
            </div>
          )}
          <button
            type="button"
            ref={cueGate ? readyBtnRef : undefined}
            className={`ct-fq-cue-card${cueGate ? ' ct-fq-cue-card--ready' : ''}`}
            onClick={cueGate ? confirmTargetReady : undefined}
            disabled={!cueGate}
            aria-label={cueGate ? t.survivalCueReady : undefined}
          >
            <div className="ct-fq-cue-chip">
              <CancellationTarget
                round={round}
                cells={cells}
                /* The big chip is the GATE's chip, not Survival's — on a wave
                   boundary the object is the whole reason the card is there,
                   and it can change from the wave before. */
                size={cueGate ? 78 : 52}
                isAr={isAr}
              />
            </div>
            {/* No "looks exactly like this" branch any more: `identity` boards
                are gone, so the instruction is always about the OBJECT. Saying
                "exactly" when colour no longer counts would teach the wrong
                rule and produce the false alarms it used to describe. */}
            <div className="ct-fq-cue-text">
              {round.mode === 'free'
                ? t.survivalCueTask
                : (round.target2 ? t.cueShapeDual : t.cueShape)}
            </div>
            {/* ── The rules in force, stated where the player is already
                looking. A rule the board keeps but never says is not a rule;
                it is a trap the player has to be caught by first. ── */}
            {round.mode === 'level' && (round.waveIdx ?? 0) > 0 && (round.mechanics || []).includes('switch') ? (
              <div className="cx-cue-flag cx-cue-flag--switch">{t.cueNewTarget}</div>
            ) : null}
            {round.mode === 'level' && round.noGo ? (
              <div className="cx-cue-nogo">
                <span className="cx-cue-nogo-chip" aria-hidden="true">
                  <ShapeSvg shape={round.noGo} color="var(--game-bad)" size={30} />
                </span>
                <span className="cx-cue-nogo-text">{t.cueNoGo}</span>
              </div>
            ) : null}
            {cueGate && (
              <span className="ct-fq-cue-ready-label">{t.survivalCueReady}</span>
            )}
          </button>
          {cueGate && (
            <div className="ct-fq-cue-ready-hint">{t.survivalCueHint}</div>
          )}
          {/* The gate's own dismiss — see the .ct-fq-cue-leave note in
              training.css. The overlay is opaque and covers the play header,
              so without this the screen has exactly one button on it. */}
          {cueGate && (
            <button type="button" className="ct-fq-cue-leave" onClick={onHudQuit}>
              {t.quit}
            </button>
          )}
          {cdShow && <div className="ct-fq-cd-lbl">{t.countdownHint}</div>}
        </div>
        );
      })()}

      {phase === 'play' && fixShow && (
        <div className="ct-fq-cd" aria-hidden="true">
          <div className="ct-fq-fix-cross">+</div>
          <div className="ct-fq-cd-lbl">{t.fixHint}</div>
        </div>
      )}

    </div>
  );
}
