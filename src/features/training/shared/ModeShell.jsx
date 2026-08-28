import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Sword } from '@phosphor-icons/react';
import { TrainingScreenShell, TrainingDifficultySelect, TrainingLevelGrid, TrainingModeList } from './TrainingScreens';
import { TrainingChallengeHandoff } from './TrainingChrome';
import PassPlaySetup from './PassPlaySetup';
import HubScienceLink from './HubScienceLink';
import SurvivalIntro from './SurvivalIntro';
import { freshSurvivalSeed } from './survival';
import { STR_COMMON } from './trainingStrings';
import { loadJson, saveJson } from '../../../lib/storage';
import { useTrainingTutorial } from './tutorials/useTrainingTutorial';
import { getTrainingMeta } from './tutorials/trainingMeta';
import TrainingOnboardingLayer from './tutorials/TrainingOnboardingLayer';
import { TUTORIAL_UI } from './tutorials/tutorialContent';
import PlayResults from './PlayResults';

/*
 * ModeShell — the standard 3-mode flow shared by the newer training games,
 * matched to the reference games (Rush Hour etc.):
 *
 *   menu  → Survival · Levels · Pass n Play
 *   Free       → endless practice, no fail (also what Daily Workout runs)
 *   Levels     → Easy/Medium/Hard → a grid of 100 levels (unlock in order, ✓)
 *   Pass n Play → 2–10 players, N rounds, the SAME board each round (shared
 *                 seed), pass the device between players, ranked results table
 *
 * The game supplies `renderEngine({ mode, diff, level, seed, attempt, onResult, onExit })`:
 *   • Levels:     onResult({ won, score })
 *   • Pass n Play (mode 'passplay'): run a fixed `attempt.trials` then onResult({ score })
 *   • Free:       never resolves (player exits via the in-game back button → onExit)
 * and a `pass` config: { trials, scoreLabel:{en,ar}, lowerBetter, diff }.
 *
 * Cleared levels per difficulty are persisted in localStorage under `storageKey`.
 */

const DIFF_KEYS = ['easy', 'med', 'hard'];

function loadProg(key) { return loadJson(key, {}) || {}; }
function saveProg(key, st) { saveJson(key, st); }
function seedFor(diff, level) { return ((diff.charCodeAt(0) * 7919) ^ (level * 104729)) >>> 0; }

/*
 * ── LADDER MIGRATION (2026-08-28) ────────────────────────────────────────
 *
 * A game that passes `ladder` has left easy/med/hard behind and runs ONE climb
 * in Levels mode. Games that don't pass it are untouched — the two models
 * coexist on purpose while the platform migrates game by game, because a
 * big-bang switch would strand every game whose curve had not been rewritten
 * yet.
 *
 * Old records are converted ONCE, on first load under the ladder, by mapping
 * the deepest level cleared in each old tier onto the matching third of the new
 * ladder and taking the best. Hard L40 of 100 lands at 2/3 + 40% of a third.
 *
 * ⚠ THE OLD `done` RECORD IS NOT DELETED. It is carried through untouched, so
 * this is reversible: a game can be put back on tiers and the player's history
 * is still there. Migrations that overwrite are how "it erased my progress"
 * happens, and localStorage has no undo.
 *
 * ⚠ Migrated levels are UNLOCKED, not ticked. They go to `reached`, never into
 * `lad` (the cleared list), because marking a level ✓ that the player never
 * played is a lie the grid would tell on every visit.
 */
function migrateToLadder(p, levels) {
  const done = p.done || {};
  const per = levels / DIFF_KEYS.length;
  let reached = 0;
  DIFF_KEYS.forEach((k, i) => {
    const list = Array.isArray(done[k]) ? done[k].filter((n) => Number.isFinite(n)) : [];
    if (!list.length) return;
    // Old tiers were always 100 levels; that is what these records are in.
    reached = Math.max(reached, Math.round(i * per + (Math.max(...list) / 100) * per));
  });
  return Math.max(0, Math.min(levels, reached));
}

export default function ModeShell({
  storageKey,
  gameId: gameIdProp,
  title,
  hints,
  diffLabels,
  levelCount = 100,
  isAr,
  playSfx,
  onBack,
  workoutMode = false,
  renderEngine,
  pass = {},
  scienceId,
  extraItems = [],
  survivalIntro,
  /* { levels } — presence switches this game to the single ladder. See
     migrateToLadder above and shared/difficulty.js for the model. */
  ladder = null,
}) {
  const gameId = gameIdProp || scienceId;
  const tutorial = useTrainingTutorial(gameId, isAr);
  const meta = getTrainingMeta(gameId);
  const tutLabels = TUTORIAL_UI[isAr ? 'ar' : 'en'];
  const onboardingLayer = tutorial.onboarding.phase ? (
    <TrainingOnboardingLayer
      onboarding={tutorial.onboarding}
      config={meta}
      steps={tutorial.steps}
      isAr={isAr}
      playSfx={playSfx}
    />
  ) : null;
  const passCfg = { trials: 8, scoreLabel: { en: 'Score', ar: 'النتيجة' }, lowerBetter: false, diff: 'med', ...pass };

  const ladderLevels = Number(ladder?.levels) || 0;
  const isLadder = ladderLevels > 0;
  const effCount = isLadder ? ladderLevels : levelCount;

  const [prog, setProg] = useState(() => {
    const p = loadProg(storageKey);
    if (!isLadder) return { done: { easy: [], med: [], hard: [], ...(p.done || {}) } };
    if (Array.isArray(p.lad)) return { ...p, lad: p.lad, reached: p.reached || 0 };
    const migrated = { ...p, lad: [], reached: migrateToLadder(p, ladderLevels) };
    saveProg(storageKey, migrated);
    return migrated;
  });
  const [phase, setPhase] = useState(workoutMode ? 'play' : 'menu');
  const [mode, setMode] = useState(workoutMode ? 'free' : null);
  const [diff, setDiff] = useState(null);
  const [level, setLevel] = useState(null);
  const [result, setResult] = useState(null);

  // Pass n Play state
  const [players, setPlayers] = useState(['Player 1', 'Player 2']);
  const [rounds, setRounds] = useState(2);
  const [ppDiff, setPpDiff] = useState(() => (Number(ladder?.levels) > 0 ? 'mid' : passCfg.diff));
  const [ppView, setPpView] = useState(null);
  const [ppResults, setPpResults] = useState(null);
  const scoresRef = useRef([]);
  const seedRef = useRef(1);
  const freeSeedRef = useRef(workoutMode ? freshSurvivalSeed() : null);

  /* Ladder games pass no `diffLabels` — they have no difficulties to label. */
  const dm = useMemo(() => Object.fromEntries(DIFF_KEYS.map((k) => [
    k, { label: diffLabels?.[k] ? (isAr ? diffLabels[k].ar : diffLabels[k].en) : '' },
  ])), [diffLabels, isAr]);

  /*
   * Pass n Play still needs a fairness knob: everyone plays the SAME board, so
   * the table has to agree how hard it is. On a ladder that is a level rather
   * than a tier, so the three choices become three depths on the climb. The
   * labels are `L21`-style and therefore language-neutral, which is why no new
   * bilingual strings were needed for them.
   */
  const ppLadder = useMemo(() => {
    if (!isLadder) return null;
    const at = (frac) => Math.max(1, Math.round(frac * ladderLevels));
    return { start: at(0.25), mid: at(0.55), deep: at(0.85) };
  }, [isLadder, ladderLevels]);
  const ppKeys = isLadder ? ['start', 'mid', 'deep'] : DIFF_KEYS;
  const ppDm = useMemo(() => (isLadder
    ? Object.fromEntries(ppKeys.map((k) => [k, { label: `L${ppLadder[k]}` }]))
    : dm), [isLadder, ppLadder, dm]); // eslint-disable-line react-hooks/exhaustive-deps

  const isUnlocked = useCallback((lv) => (isLadder
    ? (lv === 1 || lv <= (prog.reached || 0) + 1 || (prog.lad || []).includes(lv - 1))
    : (lv === 1 || (prog.done?.[diff] || []).includes(lv - 1))), [prog, diff, isLadder]);
  const isDone = useCallback((lv) => (isLadder
    ? (prog.lad || []).includes(lv)
    : (prog.done?.[diff] || []).includes(lv)), [prog, diff, isLadder]);

  const goMenu = useCallback(() => { setPhase('menu'); setMode(null); setResult(null); setPpResults(null); }, []);
  /*
   * ⚠ Every shared label on this shell comes from STR_COMMON.
   *
   * ModeShell used to hard-code 25 bilingual literals inline, which meant the
   * shared SHELL disagreed with the shared STRINGS file — 'Choose Difficulty' vs
   * 'Choose difficulty', 'with you' vs 'with this player', 'أضف لاعبَين' vs
   * 'أضف لاعبين', and both Replay and Retry rendering as 'إعادة' so a win and a
   * loss offered the identically-worded button. Twelve games inherit their
   * chrome from here, so a literal typed in this file is a wording fork across
   * most of the platform. Add the label to trainingStrings.js instead.
   */
  const t = isAr ? STR_COMMON.ar : STR_COMMON.en;
  const T = isAr ? title.ar : title.en;
  const levelCountLabel = levelCount.toLocaleString(isAr ? 'ar-EG' : 'en-US');

  const onLevelResult = useCallback((res) => {
    if (res.won) {
      setProg((p) => {
        let next;
        if (isLadder) {
          const cur = new Set(p.lad || []); cur.add(level);
          next = { ...p, lad: [...cur] };
        } else {
          const cur = new Set(p.done?.[diff] || []); cur.add(level);
          next = { ...p, done: { ...p.done, [diff]: [...cur] } };
        }
        saveProg(storageKey, next); return next;
      });
    }
    setResult({ ...res, diff, level });
    setPhase('result');
  }, [diff, level, storageKey, isLadder]);

  // ── Pass n Play orchestration ──
  const startPass = useCallback(() => {
    const names = players.map((s, i) => (s.trim() || `Player ${i + 1}`));
    if (names.length < 2) { alert(t.needTwo); return; }
    playSfx?.('click');
    scoresRef.current = names.map(() => []);
    seedRef.current = (Math.random() * 1e9) >>> 0;
    setPpView({ roundIdx: 0, playerIdx: 0 });
    setPhase('pp-handoff');
  }, [players, playSfx, t]);

  const onPassResult = useCallback((res) => {
    const { roundIdx, playerIdx } = ppView;
    scoresRef.current[playerIdx].push(res.score ?? 0);
    let nextPlayer = playerIdx + 1, nextRound = roundIdx;
    if (nextPlayer >= players.length) { nextPlayer = 0; nextRound = roundIdx + 1; seedRef.current = (Math.random() * 1e9) >>> 0; }
    if (nextRound >= rounds) {
      const rows = players.map((s, i) => {
        const list = scoresRef.current[i];
        const total = list.reduce((a, b) => a + b, 0);
        return { name: s.trim() || `Player ${i + 1}`, total };
      }).sort((a, b) => (passCfg.lowerBetter ? a.total - b.total : b.total - a.total));
      setPpResults(rows);
      setPhase('pp-results');
      return;
    }
    setPpView({ roundIdx: nextRound, playerIdx: nextPlayer });
    setPhase('pp-handoff');
  }, [ppView, players, rounds, passCfg.lowerBetter]);

  const startMode = (m) => {
    playSfx?.('click');
    setMode(m);
    if (m === 'free') setPhase('free-intro');
    // A ladder game has no difficulty screen — that is the whole point of it.
    else if (m === 'levels') setPhase(isLadder ? 'levels' : 'diff');
    else {
      setPpDiff(isLadder ? 'mid' : passCfg.diff);
      setPhase('pp-setup');
    }
  };

  // ── PLAY (engine) ──
  if (phase === 'play') {
    const playSeed = mode === 'levels' ? seedFor(isLadder ? 'lad' : diff, level) : mode === 'free' ? freeSeedRef.current : null;
    return renderEngine({ mode, diff, level, seed: playSeed, attempt: null, onResult: onLevelResult, onExit: workoutMode ? onBack : goMenu });
  }
  if (phase === 'pp-play') {
    return renderEngine({
      mode: 'passplay',
      diff: isLadder ? null : ppDiff,
      level: isLadder ? ppLadder[ppDiff] : null,
      seed: seedRef.current,
      attempt: { trials: passCfg.trials },
      onResult: onPassResult,
      onExit: goMenu,
    });
  }

  // ── Survival intro ──
  if (phase === 'free-intro') {
    return (
      <SurvivalIntro
        isAr={isAr}
        playSfx={playSfx}
        onBack={goMenu}
        title={survivalIntro?.title ? (isAr ? survivalIntro.title.ar : survivalIntro.title.en) : undefined}
        body={survivalIntro?.body ? (isAr ? survivalIntro.body.ar : survivalIntro.body.en) : undefined}
        onReady={() => {
          freeSeedRef.current = freshSurvivalSeed();
          setPhase('play');
        }}
      />
    );
  }

  // ── Menu ──
  if (phase === 'menu') {
    const hintTxt = (h) => (h ? (isAr ? h.ar : h.en) : null);
    const items = [
      // Icons come from TrainingModeList defaults (Cosmos planet design).
      { k: 'free', lb: t.freeMode, hint: hintTxt(hints?.free), on: () => startMode('free') },
      { k: 'levels', lb: t.levelMode, hint: hintTxt(hints?.levels), on: () => startMode('levels') },
      { k: 'chal', lb: t.challengeMode, hint: hintTxt(hints?.pass), on: () => startMode('pass') },
      // Optional game-supplied entries (e.g. an assessment) appended after the
      // standard three. Each: { k, ic, lb, hint, on }.
      ...extraItems,
    ];
    return (
      <>
        <TrainingScreenShell isAr={isAr} playSfx={playSfx} onBack={onBack} title={T} tag={t.tag} hub
          onReplayTutorial={tutorial.openTutorial} replayHint={tutLabels.replayTutorial}>
          <TrainingModeList items={items} isAr={isAr} playSfx={playSfx} />
          <HubScienceLink gameId={scienceId} isAr={isAr} playSfx={playSfx} />
        </TrainingScreenShell>
        {onboardingLayer}
      </>
    );
  }

  // ── Difficulty (Levels) ──
  if (phase === 'diff') {
    return (
      <TrainingDifficultySelect
        isAr={isAr} playSfx={playSfx} onBack={goMenu}
        title={t.pickDiff}
        blurb={isAr ? `${T} · ٣ صعوبات · ${levelCountLabel} مستويات لكلّ منها · افتح بالترتيب` : `${T} · 3 difficulties · ${levelCountLabel} levels each · unlock in order`}
        diffKeys={DIFF_KEYS} dm={dm}
        onPick={(k) => { setDiff(k); setPhase('levels'); }}
      />
    );
  }

  // ── Level grid (100) ──
  if (phase === 'levels') {
    return (
      <TrainingLevelGrid
        isAr={isAr} playSfx={playSfx}
        onBack={isLadder ? goMenu : () => setPhase('diff')}
        title={isLadder ? T : `${dm[diff]?.label ?? ''}`}
        blurb={isLadder
          ? t.ladderBlurb(effCount.toLocaleString(isAr ? 'ar-EG' : 'en-US'))
          : (isAr ? `${T} · ${levelCountLabel} مستويات · افتح بالترتيب` : `${T} · ${levelCountLabel} levels · unlock in order`)}
        count={effCount} isUnlocked={isUnlocked} isDone={isDone}
        sublabel={(lv) => `L${lv}`}
        onPick={(lv) => { setLevel(lv); setMode('levels'); setPhase('play'); }}
      />
    );
  }

  // ── Levels result ──
  if (phase === 'result' && result) {
    const isLast = result.level >= effCount;
    const score = Number(result.score);
    const actions = [
      result.won && !isLast ? {
        key: 'next',
        label: t.nextLv,
        onClick: () => { setLevel(result.level + 1); setResult(null); setPhase('play'); },
      } : null,
      {
        key: 'replay',
        label: result.won ? t.replay : t.retry,
        variant: result.won && !isLast ? 'ghost' : 'primary',
        onClick: () => { setResult(null); setPhase('play'); },
      },
      {
        key: 'levels',
        label: t.levels,
        variant: 'ghost',
        onClick: () => { setPhase('levels'); setResult(null); },
      },
    ];
    return (
      <div className="ct-fq-training-shell ct-fq-training-shell--hub-light">
        <PlayResults
          isAr={isAr}
          title={result.won ? t.levelCleared : t.notQuite}
          tone={result.won ? 'success' : 'retry'}
          headline={{ value: `L${result.level}`, label: dm[result.diff]?.label || t.levelMode }}
          stats={Number.isFinite(score) ? [{ value: score, label: t.score }] : []}
          notes={result.summary ? [result.summary] : []}
          actions={actions}
          onMenu={() => { setPhase('levels'); setResult(null); }}
          playSfx={playSfx}
        />
      </div>
    );
  }

  // ── Pass n Play: setup ──
  if (phase === 'pp-setup') {
    return (
      <TrainingScreenShell isAr={isAr} playSfx={playSfx} onBack={goMenu}>
        <PassPlaySetup
          isAr={isAr}
          playSfx={playSfx}
          diffKeys={ppKeys}
          diffLabels={ppDm}
          diff={ppDiff}
          onDiffChange={setPpDiff}
          players={players}
          onPlayersChange={setPlayers}
          rounds={rounds}
          onRoundsChange={setRounds}
          roundOptions={[1, 2, 3, 4, 5]}
          onStart={startPass}
          labels={{
            difficulty: isLadder ? t.ladderPickLevel : t.chalPickDiff,
            players: t.players,
            addPlayer: t.addPl,
            rounds: t.chalRounds,
            start: <><Sword size="1em" weight="fill" style={{ verticalAlign: '-0.15em', marginInlineEnd: 6 }} />{t.goReady}</>,
          }}
        />
      </TrainingScreenShell>
    );
  }

  // ── Pass n Play: handoff ──
  if (phase === 'pp-handoff' && ppView) {
    const name = players[ppView.playerIdx].trim() || `Player ${ppView.playerIdx + 1}`;
    return (
      <TrainingChallengeHandoff
        isAr={isAr}
        kicker={t.challengeMode}
        playerName={name}
        roundLine={t.roundNofM(ppView.roundIdx + 1, rounds)}
        instruction={t.passInstruction}
        bullets={[
          t.chalBulletSame,
          t.chalBulletPass,
        ]}
        startLabel={t.readyName(name)}
        onStart={() => setPhase('pp-play')}
        playSfx={playSfx}
      />
    );
  }

  // ── Pass n Play: results ──
  if (phase === 'pp-results' && ppResults) {
    return (
      <TrainingScreenShell isAr={isAr} playSfx={playSfx} onBack={goMenu} title={t.resultsChalTitle}>
        <div className="ct-pp-results">
          {ppResults.map((r, i) => (
            <div key={r.name} className={`ct-pp-res-row${i === 0 ? ' win' : ''}`}>
              <span className="ct-pp-rank">{i === 0 ? '🏆' : i + 1}</span>
              <span className="ct-pp-name">{r.name}</span>
              <span className="ct-pp-score">{r.total} {isAr ? passCfg.scoreLabel.ar : passCfg.scoreLabel.en}</span>
            </div>
          ))}
          <div className="ct-training-modal-actions" style={{ marginTop: 16 }}>
            <button className="ct-training-btn ct-training-btn--pri" onClick={() => { playSfx?.('click'); setPhase('pp-setup'); setPpResults(null); }}>{t.freePlayAgain}</button>
            <button className="ct-training-btn ct-training-btn--ghost" onClick={() => { playSfx?.('click'); goMenu(); }}>{t.menu}</button>
          </div>
        </div>
      </TrainingScreenShell>
    );
  }

  return null;
}
