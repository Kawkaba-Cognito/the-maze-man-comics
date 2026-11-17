import React, { useState, useCallback, Suspense } from 'react';
import {
  Check,
  CheckCircle,
  Play,
  Flame,
  SlidersHorizontal,
  CaretDown,
  CaretRight,
  CaretLeft,
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
  Crown,
  ChartPolar,
  Sparkle,
} from '@phosphor-icons/react';
import { useApp } from '../../context/AppContext';
import NayzakHeader from '../shared/NayzakHeader';
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
import { getDomainGuardian } from '../../data/nayzakCast';
import { assetUrl } from '../../lib/assetUrl';

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
    color: '#FF7800',
    softBg: '#FFF4E5',
    descEn: 'Selective focus & visual scanning',
    descAr: 'البحث البصري والتركيز الانتقائي',
  },
  speed: {
    id: 'speed',
    en: 'Speed',
    ar: 'السرعة',
    Icon: Lightning,
    color: '#0B63CE',
    softBg: '#EFF6FF',
    descEn: 'Rapid processing & reaction timing',
    descAr: 'سرعة المعالجة وزمن الاستجابة',
  },
  memory: {
    id: 'memory',
    en: 'Memory',
    ar: 'الذاكرة',
    Icon: Brain,
    color: '#1CB0F6',
    softBg: '#F0F9FF',
    descEn: 'Working memory & spatial recall',
    descAr: 'الذاكرة العاملة والاسترجاع المكاني',
  },
  language: {
    id: 'language',
    en: 'Language',
    ar: 'اللغة',
    Icon: ChatCircleText,
    color: '#0D9488',
    softBg: '#F0FDFA',
    descEn: 'Word fluency & semantic links',
    descAr: 'الطلاقة اللغوية والروابط الدلالية',
  },
  reasoning: {
    id: 'reasoning',
    en: 'Reasoning',
    ar: 'الاستدلال',
    Icon: PuzzlePiece,
    color: '#4F46E5',
    softBg: '#EEF2FF',
    descEn: 'Rule induction & deductive logic',
    descAr: 'استنتاج القواعد والتحليل المنطقي',
  },
  flexibility: {
    id: 'flexibility',
    en: 'Flexibility',
    ar: 'المرونة',
    Icon: ArrowsClockwise,
    color: '#DF4E32',
    softBg: '#FFF1EE',
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
        background: '#F8F6F1',
        color: '#0F1E33',
        fontFamily: "'Cairo', 'Outfit', system-ui, sans-serif",
        fontSize: 17,
        fontWeight: 700,
        gap: 10,
      }}
    >
      <RocketLaunch size={34} weight="duotone" color="#FF7800" aria-hidden="true" />
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
    isPro,
    openPaywall,
  } = useApp();
  const isAr = currentLang === 'ar';

  const [activeGameKey, setActiveGameKey] = useState(null);
  const [activeGameDomainId, setActiveGameDomainId] = useState('attention');
  const [activeWorkoutIdx, setActiveWorkoutIdx] = useState(null);
  const [workoutSt, setWorkoutSt] = useState(() => initWorkoutState());
  const [showGoalPicker, setShowGoalPicker] = useState(false);

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
  const recGuardian = getDomainGuardian(recommendedDomainId);
  const recRating = domainRating(recommendedDomainId);
  const recBand = recRating != null ? ratingBand(recRating) : null;
  const recGames = TRAINING_GAMES.filter((g) => g.domainId === recommendedDomainId);
  const starterGame = recGames[0] || TRAINING_GAMES[0];
  const RecIcon = recMeta.Icon;
  const RowChevron = isAr ? CaretLeft : CaretRight;
  const hostSpriteUrl = wkAllDone
    ? assetUrl('Assets/brand/cast-2026/nayzak-epiphany.webp')
    : assetUrl('Assets/brand/cast-2026/nayzak-host.webp');

  return (
    <div className="nayzak-page" dir={isAr ? 'rtl' : 'ltr'}>
      <NayzakHeader showLogo showStats showLang />

      <main className="duo-home-container duo-home-container--wide">
        {/* Top Greeting & Weekly Rhythm Strip */}
        <section className="lum-top-bar" aria-label={isAr ? 'نشاط الأسبوع' : 'Weekly activity'}>
          <div className="lum-top-copy">
            <span className="lum-date-label">{todayDateLabel}</span>
            <h1 className="lum-screen-title">
              {isAr ? 'تدريب اليوم' : 'Today'}
            </h1>
          </div>

          <div className="lum-rhythm-group">
            <span className="lum-streak-chip">
              <Flame size={14} weight="fill" color="#FF7800" aria-hidden="true" />
              <span>
                {workoutSt?.streak || 0} {isAr ? 'يوم' : 'day streak'}
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

        {/* 1. Official NAYZAK Show Host Daily Workout Stage */}
        <section
          className="lum-hero-card lum-hero-card--nayzak"
          aria-label={isAr ? 'تمرين اليوم' : 'Daily Workout'}
        >
          <div className="nayzak-hero-stage">
            <div className="nayzak-hero-host-box" aria-hidden="true">
              <img
                src={hostSpriteUrl}
                alt=""
                draggable="false"
                className="nayzak-hero-host-img"
              />
            </div>

            <div className="nayzak-hero-stage-copy">
              <div className="nayzak-hero-top-pills">
                <span className="nayzak-comic-ribbon">
                  {wkAllDone
                    ? isAr
                      ? 'بطل اليوم!'
                      : 'TODAY CLEARED!'
                    : isAr
                    ? 'تحدّي نيزك اليومي'
                    : "NAYZAK'S CHALLENGE"}
                </span>

                <div className="flex items-center gap-2 flex-wrap">
                  {!isPro && (
                    <button
                      type="button"
                      className="lum-pro-inline-chip"
                      onClick={() => {
                        playSfx?.('tap');
                        openPaywall?.();
                      }}
                    >
                      <Crown size={12} weight="fill" color="#FFB012" aria-hidden="true" />
                      <span>{isAr ? 'تدريب مخصص · PRO' : 'Custom Coach · PRO'}</span>
                    </button>
                  )}
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
                    <span>{isAr ? 'الهدف' : 'Focus'}</span>
                    <CaretDown size={12} weight="bold" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <h2 className="lum-hero-title">
                {wkAllDone
                  ? isAr
                    ? 'اكتملت جلسة اليوم'
                    : 'Session Complete'
                  : isAr
                  ? currentGoal.ar
                  : currentGoal.en}
              </h2>

              <p className="nayzak-hero-speech">
                {wkAllDone
                  ? isAr
                    ? 'نيزك: «عمل رائع! حافظت على شعلتك اليوم وأنهيت الجولات الثلاث.»'
                    : 'Nayzak: “Bullseye! All three rounds beaten — see you tomorrow!”'
                  : isAr
                  ? `نيزك: «٣ جولات سريعة تنشّط عقلك — أنجزت ${wkDoneCount} من ${wkTotal}»`
                  : `Nayzak: “Three crisp rounds (~10 min) — ${wkDoneCount} of ${wkTotal} complete.”`}
              </p>
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

          {/* Direct Clean Playlist Rows (Solid Color Tile + Crisp White Vector Glyph) */}
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
                      <span className="lum-row-domain" style={{ color: dom.color }}>
                        {isAr ? dom.ar : dom.en}
                      </span>
                      <span className="lum-row-title">{title}</span>
                    </span>

                    <span className="lum-row-trailing">
                      {isDone ? (
                        <span className="lum-step-done">
                          <Check size={12} weight="bold" aria-hidden="true" />
                          <span>{isAr ? 'تم' : 'Done'}</span>
                        </span>
                      ) : (
                        <span className={`lum-step-num${isUpNext ? ' is-next' : ''}`}>
                          {idx + 1}
                        </span>
                      )}
                      <RowChevron size={16} weight="bold" className="lum-row-caret" aria-hidden="true" />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Clean Full-Width Pill CTA */}
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
                  {wkDoneCount > 0
                    ? isAr
                      ? `متابعة التمرين (${wkDoneCount}/${wkTotal})`
                      : `Continue Workout (${wkDoneCount}/${wkTotal})`
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

        {/* 2. Secondary Lumosity-Style Modular Grid (Focus + Explore) */}
        <section className="lum-secondary-grid" aria-label={isAr ? 'المزيد من التدريبات' : 'More workouts'}>
          {/* Card A: Recommended Focus (Guarded by Canonical Nayzak Family Member) */}
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
                {recGuardian && (
                  <span className="nayzak-mini-guardian">
                    <img
                      src={recGuardian.avatarUrl}
                      alt={isAr ? recGuardian.nameAr : recGuardian.nameEn}
                      draggable="false"
                    />
                  </span>
                )}
              </div>
              <span className="lum-module-badge">
                {ratedDomains.length > 0
                  ? isAr
                    ? 'توصية اليوم'
                    : 'FOCUS AREA'
                  : isAr
                  ? `مع ${recGuardian?.nameAr || ''}`
                  : `WITH ${recGuardian?.nameEn?.toUpperCase() || ''}`}
              </span>
            </div>

            <div className="lum-module-body">
              <h3 className="lum-module-title">
                {isAr ? recMeta.ar : recMeta.en}
                {recBand ? ` · ${recRating}` : ''}
              </h3>
              <p className="lum-module-desc">{isAr ? recMeta.descAr : recMeta.descEn}</p>
            </div>

            {starterGame && (
              <div className="lum-module-link">
                <span>
                  {isAr
                    ? `ابدأ: ${starterGame.titleAr || starterGame.titleEn}`
                    : `Play ${starterGame.titleEn}`}
                </span>
                <RowChevron size={15} weight="bold" aria-hidden="true" />
              </div>
            )}
          </button>

          {/* Card B: Quick Shortcuts */}
          <div className="lum-module-card lum-module-card--list">
            <button
              type="button"
              className="lum-mini-row"
              onClick={() => switchTab('domains')}
            >
              <span
                className="lum-tile-icon lum-tile-icon--sm"
                style={{ backgroundColor: '#0B63CE' }}
                aria-hidden="true"
              >
                <Compass size={19} weight="fill" color="#FFFFFF" />
              </span>
              <span className="lum-row-copy">
                <span className="lum-row-title">{isAr ? 'المجالات الستة' : '6 Cognitive Domains'}</span>
                <span className="lum-mini-sub">{isAr ? '18 لعبة معرفية' : 'Browse all 18 games'}</span>
              </span>
              <RowChevron size={16} weight="bold" className="lum-row-caret" aria-hidden="true" />
            </button>

            <button
              type="button"
              className="lum-mini-row"
              onClick={() => switchTab('profile')}
            >
              <span
                className="lum-tile-icon lum-tile-icon--sm"
                style={{ backgroundColor: '#FF7800' }}
                aria-hidden="true"
              >
                <ChartPolar size={19} weight="fill" color="#FFFFFF" />
              </span>
              <span className="lum-row-copy">
                <span className="lum-row-title">{isAr ? 'رادار الأداء NPI' : 'Cognitive Radar'}</span>
                <span className="lum-mini-sub">{isAr ? 'مؤشر 0–1000' : 'Your 0–1000 profile'}</span>
              </span>
              <RowChevron size={16} weight="bold" className="lum-row-caret" aria-hidden="true" />
            </button>
          </div>
        </section>

        {/* 3. Mobile-Only Slim PRO Strip (Desktop shows PRO inside Left Rail) */}
        {!isPro && (
          <section className="ed-pro-card md:hidden">
            <div className="ed-pro-copy">
              <div className="ed-pro-head">
                <Crown size={16} weight="fill" color="#FFB012" aria-hidden="true" />
                <h3>{isAr ? 'نيزك PRO' : 'Nayzak PRO'}</h3>
              </div>
              <p>
                {isAr
                  ? 'افتح رادار الأداء الكامل والتدريبات المخصصة بلا حدود.'
                  : 'Unlock full 6-domain insights, custom workouts & unlimited access.'}
              </p>
            </div>
            <button
              type="button"
              className="ed-pro-btn"
              onClick={() => openPaywall?.()}
            >
              {isAr ? 'ابدأ التجربة' : 'Try Free'}
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
