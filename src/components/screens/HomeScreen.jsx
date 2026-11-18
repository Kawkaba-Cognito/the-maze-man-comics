import React, { useState, useCallback, Suspense } from 'react';
import {
  Check,
  CheckCircle,
  Play,
  Flame,
  SlidersHorizontal,
  CaretDown,
  Crosshair,
  Target,
  RocketLaunch,
  Lightning,
  Calculator,
  Timer,
  BookOpenText,
  Eye,
  SquaresFour,
  TextAa,
  Link as LinkIcon,
  Brain,
  Car,
  Key,
  Detective,
  Swap,
  ArrowsLeftRight,
  Funnel,
  ChatCircleText,
  PuzzlePiece,
  ArrowsClockwise,
  Compass,
  Sparkle,
} from '@phosphor-icons/react';
import { useApp } from '../../context/AppContext';
import NayzakHeader from '../shared/NayzakHeader';
import ClayHero3D from '../shared/ClayHero3D';
import DomainGameStage from '../../features/training/shared/DomainGameStage';
import { getLazyGame } from '../../features/training/lazyGames';
import { EXPERIMENTS } from '../training/trainingExperimentsData';
import { domainRating, ratingBand } from '../../features/training/rating';
import { GOALS, GOALS_BY_ID } from '../../features/workout/workoutData';
import {
  loadWorkout,
  ensureToday,
  savePrefs,
  markDone,
  consumeJustCompleted,
} from '../../features/workout/workoutState';
import { todayKey } from '../../features/workout/workoutPlan';

const WORKOUT_COMPLETE_BONUS = 50;

const GAME_ICON_MAP = {
  'cancel-task': Crosshair,
  mot: Target,
  'train-switch': RocketLaunch,
  'speed-match': Lightning,
  'math-gates': Calculator,
  intercept: Timer,
  'story-grid': BookOpenText,
  'keep-track': Eye,
  'paired-associates': SquaresFour,
  wordle: TextAa,
  synonyms: LinkIcon,
  trivia: Brain,
  'rush-hour': Car,
  gatekeeper: Key,
  detective: Detective,
  'mirror-world': Swap,
  'task-switch': ArrowsLeftRight,
  'sort-shift': Funnel,
};

const DOMAINS_META = {
  attention: {
    id: 'attention',
    en: 'Attention',
    ar: 'الانتباه',
    Icon: Crosshair,
    color: '#D95A3D',
    softBg: '#FCEBE7',
    descEn: 'Selective focus & visual scanning',
    descAr: 'البحث البصري والتركيز الانتقائي',
  },
  speed: {
    id: 'speed',
    en: 'Speed',
    ar: 'السرعة',
    Icon: Lightning,
    color: '#D9911E',
    softBg: '#FDF3DF',
    descEn: 'Rapid processing & reaction timing',
    descAr: 'سرعة المعالجة وزمن الاستجابة',
  },
  memory: {
    id: 'memory',
    en: 'Memory',
    ar: 'الذاكرة',
    Icon: Brain,
    color: '#2E5EA8',
    softBg: '#EBF1FA',
    descEn: 'Working memory & spatial recall',
    descAr: 'الذاكرة العاملة والاسترجاع المكاني',
  },
  language: {
    id: 'language',
    en: 'Language',
    ar: 'اللغة',
    Icon: ChatCircleText,
    color: '#4D8F68',
    softBg: '#EAF4EE',
    descEn: 'Word fluency & semantic links',
    descAr: 'الطلاقة اللغوية والروابط الدلالية',
  },
  reasoning: {
    id: 'reasoning',
    en: 'Reasoning',
    ar: 'الاستدلال',
    Icon: PuzzlePiece,
    color: '#5B629E',
    softBg: '#EEEFF8',
    descEn: 'Rule induction & deductive logic',
    descAr: 'استنتاج القواعد والتحليل المنطقي',
  },
  flexibility: {
    id: 'flexibility',
    en: 'Flexibility',
    ar: 'المرونة',
    Icon: ArrowsClockwise,
    color: '#8C5A7E',
    softBg: '#F4ECF2',
    descEn: 'Task switching & mental agility',
    descAr: 'تبديل المهام والمرونة الذهنية',
  },
};

const DOMAIN_IDS = ['attention', 'speed', 'memory', 'language', 'reasoning', 'flexibility'];

const GOAL_ICONS = {
  weak: Crosshair,
  overall: Brain,
  focus: Crosshair,
  memory: Brain,
  speed: Lightning,
  solver: PuzzlePiece,
};

const TRAINING_GAMES = EXPERIMENTS.filter(
  (exp) => exp.domainId !== 'puzzles' && exp.gameKey && exp.gameKey !== 'puzzles'
);

const GAMES_BY_KEY = Object.fromEntries(
  TRAINING_GAMES.map((exp) => [exp.gameKey, exp])
);

const WEEKDAY_EN = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const WEEKDAY_AR = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];

function formatTodayLabel(isAr) {
  try {
    return new Intl.DateTimeFormat(isAr ? 'ar-EG' : 'en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    }).format(new Date());
  } catch {
    return isAr ? 'جلسة اليوم' : 'Today';
  }
}

function initWorkoutState() {
  let st = ensureToday(loadWorkout());
  if (!st?.prefs || !st?.today?.exercises?.length) {
    st = savePrefs('overall', 'standard');
  }
  return st;
}

function getLast7Days(history = {}) {
  const days = [];
  const now = new Date();
  for (let offset = 6; offset >= 0; offset -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - offset);
    const key = todayKey(d);
    const rec = history?.[key];
    const complete = Boolean(rec && rec.total > 0 && rec.done >= rec.total);
    const partial = Boolean(rec && rec.done > 0 && !complete);
    days.push({
      key,
      dow: d.getDay(),
      isToday: offset === 0,
      complete,
      partial,
    });
  }
  return days;
}

function GameLoading({ isAr }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F2EEE6',
        color: '#1B1F24',
        fontFamily: "'Inter', 'Cairo', system-ui, sans-serif",
        fontSize: 17,
        fontWeight: 700,
        gap: 10,
      }}
    >
      <RocketLaunch size={34} weight="duotone" color="#2F4A6D" aria-hidden="true" />
      <span>{isAr ? 'جارِ التحميل…' : 'Loading…'}</span>
    </div>
  );
}

export default function HomeScreen() {
  const {
    currentLang,
    playSfx,
    awardPoints,
    setActiveModalGame,
    switchTab,
  } = useApp();
  const isAr = currentLang === 'ar';

  const [activeGameKey, setActiveGameKey] = useState(null);
  const [activeGameDomainId, setActiveGameDomainId] = useState('attention');
  const [activeWorkoutIdx, setActiveWorkoutIdx] = useState(null);
  const [workoutSt, setWorkoutSt] = useState(() => initWorkoutState());
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  const dismissWelcome = useCallback(() => {
    playSfx?.('tap');
    setShowWelcome(false);
  }, [playSfx]);

  const GameView = activeGameKey ? getLazyGame(activeGameKey) : null;

  const handleLaunchGame = useCallback(
    (exp, domainId, workoutSlotIdx = null) => {
      playSfx?.('pop');
      setActiveWorkoutIdx(workoutSlotIdx);
      setActiveGameDomainId(domainId || exp.domainId || 'attention');
      setActiveGameKey(exp.gameKey);
      setActiveModalGame?.(exp.gameKey);
    },
    [playSfx, setActiveModalGame]
  );

  const handleExitGame = useCallback(() => {
    if (activeWorkoutIdx != null) {
      const updated = markDone(activeWorkoutIdx);
      setWorkoutSt(updated);
      if (consumeJustCompleted()) {
        awardPoints?.(WORKOUT_COMPLETE_BONUS);
        playSfx?.('win');
      } else {
        playSfx?.('collect');
      }
    } else {
      playSfx?.('pop');
    }
    setActiveWorkoutIdx(null);
    setActiveGameKey(null);
    setActiveModalGame?.(null);
  }, [activeWorkoutIdx, awardPoints, playSfx, setActiveModalGame]);

  const handleChangeGoal = useCallback(
    (goalId) => {
      playSfx?.('click');
      const next = savePrefs(goalId, 'standard');
      setWorkoutSt(next);
      setShowGoalPicker(false);
    },
    [playSfx]
  );

  if (activeGameKey && GameView) {
    return (
      <div className="duo-game-modal-host">
        <DomainGameStage domainId={activeGameDomainId}>
          <Suspense fallback={<GameLoading isAr={isAr} />}>
            <GameView onBack={handleExitGame} />
          </Suspense>
        </DomainGameStage>
      </div>
    );
  }

  const today = workoutSt?.today || { exercises: [], done: [], goal: 'overall' };
  const wkExercises = today.exercises || [];
  const wkDone = today.done || [];
  const wkDoneCount = wkDone.filter(Boolean).length;
  const wkTotal = wkExercises.length || 3;
  const wkAllDone = wkExercises.length > 0 && wkDoneCount === wkExercises.length;
  const nextIdx = wkDone.findIndex((d) => !d);
  const currentGoal = GOALS_BY_ID[today.goal] || GOALS_BY_ID.overall;
  const last7 = getLast7Days(workoutSt?.history);
  const todayDateLabel = formatTodayLabel(isAr);

  const ratedDomains = DOMAIN_IDS.map((id) => ({
    id,
    rating: domainRating(id),
  })).filter((x) => typeof x.rating === 'number');

  const recommendedDomainId =
    ratedDomains.length > 0
      ? [...ratedDomains].sort((a, b) => a.rating - b.rating)[0].id
      : 'attention';
  const recMeta = DOMAINS_META[recommendedDomainId];
  const recRating = domainRating(recommendedDomainId);
  const recBand = recRating != null ? ratingBand(recRating) : null;
  const recGames = TRAINING_GAMES.filter((g) => g.domainId === recommendedDomainId);
  const starterGame = recGames[0] || TRAINING_GAMES[0];
  const RecIcon = recMeta.Icon;

  const nextExercise = wkExercises[nextIdx >= 0 ? nextIdx : 0];
  const nextExp = nextExercise ? GAMES_BY_KEY[nextExercise.gameKey] : null;
  const nextTitle = nextExp
    ? isAr && nextExp.titleAr
      ? nextExp.titleAr
      : nextExp.titleEn
    : nextExercise?.gameName || '';
  const heroTitle = wkAllDone
    ? isAr
      ? 'اكتملت الجلسة'
      : 'Session Complete'
    : currentGoal.id === 'overall'
    ? isAr
      ? 'ثلاث جولات اليوم'
      : "Today's 3-Game Mix"
    : isAr
    ? currentGoal.ar
    : currentGoal.en;

  return (
    <div className="nayzak-page" dir={isAr ? 'rtl' : 'ltr'}>
      <NayzakHeader showLogo showStats showLang />

      <main className="duo-home-container duo-home-container--wide">
        {/* Top Greeting & Weekly Rhythm Strip */}
        <section className="lum-top-bar" aria-label={isAr ? 'نشاط الأسبوع' : 'Weekly activity'}>
          <div className="lum-top-copy">
            <span className="lum-date-label">{todayDateLabel}</span>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="lum-screen-title">
                {isAr ? 'تدريب اليوم' : 'Today'}
              </h1>
              {!showWelcome && (
                <button
                  type="button"
                  className="nayzak-help-chip"
                  onClick={() => {
                    playSfx?.('tap');
                    setShowWelcome(true);
                  }}
                >
                  <Sparkle size={12} weight="fill" color="#2F4A6D" aria-hidden="true" />
                  <span>{isAr ? 'كيف يعمل؟' : 'How it works'}</span>
                </button>
              )}
            </div>
          </div>

          <div className="lum-rhythm-group">
            <span className="lum-streak-chip">
              <Flame size={14} weight="fill" color="#B5482F" aria-hidden="true" />
              <span>
                {workoutSt?.streak || 0} {isAr ? 'يوم متتالي' : 'day streak'}
              </span>
            </span>

            <div className="ed-week-dots" aria-label={isAr ? 'آخر 7 أيام' : 'Last 7 days'}>
              {last7.map((d) => (
                <div
                  key={d.key}
                  className={`ed-week-day${d.isToday ? ' is-today' : ''}${
                    d.complete ? ' is-complete' : d.partial ? ' is-partial' : ''
                  }`}
                >
                  <span className="ed-week-lbl">
                    {(isAr ? WEEKDAY_AR : WEEKDAY_EN)[d.dow]}
                  </span>
                  <span className="ed-week-dot">
                    {d.complete && <Check size={10} weight="bold" aria-hidden="true" />}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Plain-Language Quick Start Guide for First-Time Players */}
        {showWelcome && (
          <section className="nayzak-welcome-card" aria-label={isAr ? 'دليل البداية السريع' : 'Quick start guide'}>
            <div className="nayzak-welcome-top">
              <h2 className="nayzak-welcome-title">
                <Sparkle size={15} weight="fill" color="#2F4A6D" aria-hidden="true" />
                <span>
                  {isAr ? 'أهلاً بك! هكذا يعمل التطبيق في ٣ خطوات:' : 'New here? How Nayzak Games works:'}
                </span>
              </h2>
              <button
                type="button"
                className="nayzak-welcome-dismiss"
                onClick={dismissWelcome}
              >
                {isAr ? 'فهمت ✓' : 'Got it ✓'}
              </button>
            </div>
            <ul className="nayzak-welcome-steps">
              <li className="nayzak-welcome-step">
                {isAr
                  ? '١. اضغط «ابدأ اللعبة» لتجربة ٣ ألعاب قصيرة (دقيقتان لكل لعبة).'
                  : '1. Tap Start below to play 3 short mini-games (~2 min each).'}
              </li>
              <li className="nayzak-welcome-step">
                {isAr
                  ? '٢. افتح «المجالات» أسفلاً لتختار أي مهارة وتلعب ألعابها الـ ١٨.'
                  : '2. Open Domains to pick any skill directly (18 games total).'}
              </li>
              <li className="nayzak-welcome-step">
                {isAr
                  ? '٣. تفضل اللعب بلا توقيت؟ «الألغاز» فيها ١٩ لغزاً هادئاً.'
                  : '3. Want no countdown? Puzzles has 19 untimed brain teasers.'}
              </li>
            </ul>
          </section>
        )}

        {/* 1. Light Clay Studio Daily Session Stage (Interactive 3D Diorama + Gamified Rounds) */}
        <section
          className="lum-hero-card lum-hero-card--nayzak clay-hero-studio"
          aria-label={isAr ? 'تمرين اليوم' : 'Daily Workout'}
        >
          <div className="nayzak-hero-stage clay-hero-stage">
            <div className="nayzak-hero-host-box clay-hero-diorama">
              <ClayHero3D doneCount={wkDoneCount} playSfx={playSfx} />
            </div>

            <div className="nayzak-hero-stage-copy">
              <div className="nayzak-hero-top-pills">
                <span className="nayzak-comic-ribbon">
                  {wkAllDone
                    ? isAr
                      ? 'اكتملت الجلسة ★'
                      : 'SESSION COMPLETE ★'
                    : isAr
                    ? `جولات اليوم · ${wkDoneCount}/${wkTotal}`
                    : `DAILY QUEST · ${wkDoneCount}/${wkTotal}`}
                </span>

                <button
                  type="button"
                  className="ed-focus-btn"
                  onClick={() => {
                    playSfx?.('tap');
                    setShowGoalPicker((v) => !v);
                  }}
                  aria-expanded={showGoalPicker}
                >
                  <SlidersHorizontal size={14} weight="bold" aria-hidden="true" />
                  <span>{isAr ? 'التركيز' : 'Focus'}</span>
                  <CaretDown size={12} weight="bold" aria-hidden="true" />
                </button>
              </div>

              <h2 className="lum-hero-title">{heroTitle}</h2>

              <div className="clay-quest-pips" aria-hidden="true">
                {wkExercises.map((ex, idx) => {
                  const done = Boolean(wkDone[idx]);
                  const next = idx === nextIdx;
                  const dom = DOMAINS_META[ex.domainId] || DOMAINS_META.attention;
                  return (
                    <span
                      key={idx}
                      className={`clay-quest-pip${done ? ' is-done' : ''}${next ? ' is-next' : ''}`}
                      style={{ '--pip-color': dom.color }}
                    >
                      {done ? <Check size={12} weight="bold" /> : idx + 1}
                    </span>
                  );
                })}
                <span className="clay-quest-bonus-chip">+50 XP</span>
              </div>
            </div>
          </div>

          {showGoalPicker && (
            <div className="ed-goal-picker" role="listbox">
              {GOALS.map((g) => {
                const active = g.id === currentGoal.id;
                const GoalIcon = GOAL_ICONS[g.id] || Sparkle;
                return (
                  <button
                    key={g.id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={`ed-goal-chip${active ? ' is-active' : ''}`}
                    onClick={() => handleChangeGoal(g.id)}
                  >
                    <GoalIcon size={13} weight="bold" aria-hidden="true" />
                    <span>{isAr ? g.ar : g.en}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Direct Clean Playlist Rows (Solid Color Tile + Plain 1-Line Action Hint) */}
          <ul className="lum-playlist" role="list">
            {wkExercises.map((ex, idx) => {
              const dom = DOMAINS_META[ex.domainId] || DOMAINS_META.attention;
              const exp = GAMES_BY_KEY[ex.gameKey];
              const GameIcon = GAME_ICON_MAP[ex.gameKey] || dom.Icon;
              const isDone = Boolean(wkDone[idx]);
              const isUpNext = idx === nextIdx;
              const title = exp
                ? isAr && exp.titleAr
                  ? exp.titleAr
                  : exp.titleEn
                : ex.gameName;
              const launchExercise = () =>
                handleLaunchGame(
                  exp || { gameKey: ex.gameKey, domainId: ex.domainId },
                  ex.domainId,
                  idx
                );

              return (
                <li key={`${ex.gameKey}-${idx}`} className="lum-playlist-item">
                  <button
                    type="button"
                    onClick={launchExercise}
                    className={`lum-playlist-row${isDone ? ' is-done' : ''}${
                      isUpNext ? ' is-next' : ''
                    }`}
                  >
                    <span
                      className="lum-tile-icon"
                      style={{ backgroundColor: dom.color }}
                      aria-hidden="true"
                    >
                      <GameIcon size={21} weight="fill" color="#FFFFFF" />
                    </span>

                    <span className="lum-row-copy">
                      <span className="clay-row-meta">
                        <span
                          className="clay-dom-badge"
                          style={{ backgroundColor: dom.softBg, color: dom.color }}
                        >
                          {isAr ? dom.ar : dom.en}
                        </span>
                        <span className="clay-dur-chip">{isAr ? '٢ د' : '2 min'}</span>
                      </span>
                      <span className="lum-row-title">{title}</span>
                    </span>

                    <span className="lum-row-trailing">
                      {isDone ? (
                        <span className="lum-step-done">
                          <Check size={12} weight="bold" aria-hidden="true" />
                          <span>{isAr ? 'مكتمل' : 'Done'}</span>
                        </span>
                      ) : (
                        <span
                          className={`clay-drill-cta${isUpNext ? ' is-next' : ''}`}
                          style={isUpNext ? { backgroundColor: dom.color } : undefined}
                        >
                          <Play size={11} weight="fill" aria-hidden="true" />
                          <span>{isAr ? 'العب' : 'Play'}</span>
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Clean Full-Width Pill CTA Naming the Exact Next Game */}
          <div className="lum-hero-footer">
            {!wkAllDone ? (
              <button
                type="button"
                className="lum-primary-cta"
                onClick={() => {
                  const targetIdx = nextIdx >= 0 ? nextIdx : 0;
                  const ex = wkExercises[targetIdx];
                  if (!ex) return;
                  const exp = GAMES_BY_KEY[ex.gameKey];
                  handleLaunchGame(
                    exp || { gameKey: ex.gameKey, domainId: ex.domainId },
                    ex.domainId,
                    targetIdx
                  );
                }}
              >
                <Play size={17} weight="fill" aria-hidden="true" />
                <span>
                  {nextTitle
                    ? isAr
                      ? `ابدأ اللعبة ${(nextIdx >= 0 ? nextIdx : 0) + 1}: ${nextTitle}`
                      : `Play Game ${(nextIdx >= 0 ? nextIdx : 0) + 1}: ${nextTitle}`
                    : isAr
                    ? 'ابدأ تمرين اليوم'
                    : "Start Today's Workout"}
                </span>
              </button>
            ) : (
              <div className="ed-done-banner">
                <CheckCircle size={17} weight="fill" aria-hidden="true" />
                <span>
                  {isAr
                    ? 'أكملت جلسة اليوم بنجاح'
                    : 'Daily training complete — great consistency'}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* 2. Secondary Modular Grid (Quick Extra Game + Clear Tab Shortcuts) */}
        <section className="lum-secondary-grid" aria-label={isAr ? 'المزيد من التدريبات' : 'More workouts'}>
          {/* Card A: Extra Quick Game */}
          <button
            type="button"
            className="lum-module-card lum-module-card--focus"
            onClick={() => {
              if (starterGame) {
                handleLaunchGame(starterGame, recommendedDomainId, null);
              }
            }}
          >
            <div className="lum-module-top">
              <div className="flex items-center gap-2.5">
                <span
                  className="lum-tile-icon"
                  style={{ backgroundColor: recMeta.color }}
                  aria-hidden="true"
                >
                  <RecIcon size={21} weight="fill" color="#FFFFFF" />
                </span>
              </div>
              <span className="lum-module-badge">
                {isAr ? 'تدريب سريع (دقيقتان)' : 'QUICK PRACTICE · 2 MIN'}
              </span>
            </div>

            <div className="lum-module-body">
              <div className="clay-skill-meter-row">
                <span className="clay-npi-chip">
                  {recRating != null ? `NPI ${recRating}` : isAr ? 'التدريب الموصى به' : 'RECOMMENDED SKILL'}
                </span>
                {recBand && (
                  <span className="clay-band-chip">{isAr ? recBand.ar : recBand.en}</span>
                )}
              </div>
              <h3 className="lum-module-title">
                {isAr ? `تقوية ${recMeta.ar}` : `${recMeta.en} Drill`}
              </h3>
              <p className="lum-module-desc">{isAr ? recMeta.descAr : recMeta.descEn}</p>
            </div>

            {starterGame && (
              <div className="clay-card-pill-btn clay-card-pill-btn--wide">
                <Play size={13} weight="fill" aria-hidden="true" />
                <span>
                  {isAr
                    ? `ابدأ: ${starterGame.titleAr || starterGame.titleEn}`
                    : `Train ${starterGame.titleEn}`}
                </span>
              </div>
            )}
          </button>

          {/* Card B: Clear Shortcuts Explaining the Other Tabs */}
          <div className="lum-module-card lum-module-card--list">
            <button
              type="button"
              className="lum-mini-row"
              onClick={() => switchTab('domains')}
            >
              <span
                className="lum-tile-icon lum-tile-icon--sm"
                style={{ backgroundColor: '#2F4A6D' }}
                aria-hidden="true"
              >
                <Compass size={19} weight="fill" color="#FFFFFF" />
              </span>
              <span className="lum-row-copy">
                <span className="lum-row-title">{isAr ? 'مختبر المهارات المعرفية' : 'Cognitive Skill Labs'}</span>
                <span className="lum-mini-sub">{isAr ? 'انتباه، سرعة، ذاكرة، لغة، منطق ومرونة' : 'Attention, Speed, Memory, Language & Logic'}</span>
              </span>
              <span className="clay-count-chip">{isAr ? '١٨' : '18'}</span>
            </button>

            <button
              type="button"
              className="lum-mini-row"
              onClick={() => switchTab('puzzles')}
            >
              <span
                className="lum-tile-icon lum-tile-icon--sm"
                style={{ backgroundColor: '#8A9A8C' }}
                aria-hidden="true"
              >
                <PuzzlePiece size={19} weight="fill" color="#FFFFFF" />
              </span>
              <span className="lum-row-copy">
                <span className="lum-row-title">{isAr ? 'استوديو الألغاز الصامتة' : 'Untimed Logic Studio'}</span>
                <span className="lum-mini-sub">{isAr ? 'سودوكو، تانغرام، جسور ومنطق بلا مؤقت' : 'Sudoku, Tangram, Bridges & quiet logic'}</span>
              </span>
              <span className="clay-count-chip">{isAr ? '١٩' : '19'}</span>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
