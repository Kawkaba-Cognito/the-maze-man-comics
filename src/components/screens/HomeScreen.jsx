import React, { useState, useCallback, Suspense } from 'react';
import { List, ListItem, BlockTitle, Card, Button, Badge } from 'konsta/react';
import {
  Check,
  CheckCircle,
  Play,
  Flame,
  SlidersHorizontal,
  CaretDown,
  Crosshair,
  Lightning,
  Brain,
  ChatCircleText,
  PuzzlePiece,
  ArrowsClockwise,
  Compass,
  Crown,
  ChartPolar,
  RocketLaunch,
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
import { assetUrl } from '../../lib/assetUrl';

const WORKOUT_COMPLETE_BONUS = 50;

const GAME_ART_V2 = {
  'cancel-task': 'attention-cancellation-v2.webp',
  mot: 'attention-target-tracking-v2.webp',
  'train-switch': 'attention-spaceship-v2.webp',
  'speed-match': 'speed-speed-match-v2.webp',
  'math-gates': 'speed-math-gates-v2.webp',
  intercept: 'speed-intercept-v2.webp',
  'story-grid': 'memory-story-time-v2.webp',
  'keep-track': 'memory-keep-track-v2.webp',
  'paired-associates': 'memory-pair-match-v2.webp',
  wordle: 'language-word-maze-v2.webp',
  synonyms: 'language-word-links-v2.webp',
  trivia: 'language-trivia-v2.webp',
  'rush-hour': 'reasoning-block-escape-v2.webp',
  gatekeeper: 'reasoning-gatekeeper-v2.webp',
  detective: 'reasoning-detective-v2.webp',
  'mirror-world': 'flexibility-mirror-world-v2.webp',
  'task-switch': 'flexibility-task-switch-v2.webp',
  'sort-shift': 'flexibility-sort-shift-v2.webp',
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

  return (
    <div className="nayzak-page" dir={isAr ? 'rtl' : 'ltr'}>
      <NayzakHeader showLogo showStats showLang />

      <main className="duo-home-container duo-home-container--wide">
        {/* Clean Unboxed Week Rhythm Bar directly on the Canvas */}
        <div className="ed-week-bar" aria-label={isAr ? 'نشاط آخر 7 أيام' : 'Last 7 days'}>
          <div className="ed-week-meta">
            <span className="ed-week-eyebrow">
              {isAr ? 'الروتين اليومي' : 'DAILY RHYTHM'}
            </span>
            <span className="ed-week-streak">
              <Flame size={13} weight="fill" color="#FF7800" aria-hidden="true" />
              <span>
                {workoutSt?.streak || 0} {isAr ? 'أيام متتالية' : 'day streak'}
              </span>
            </span>
          </div>

          <div className="ed-week-dots">
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

        {/* 1. Editorial Today's Workout Card (Fits cleanly above the fold) */}
        <Card
          component="section"
          contentWrap={false}
          className="ed-today-card !mx-0 !mt-0"
          aria-label={isAr ? 'تمرين اليوم' : "Today's Workout"}
        >
          <div className="ed-today-header">
            <div className="ed-today-header-copy">
              <span className="ed-today-kicker">
                {isAr ? 'تمرين اليوم' : "TODAY'S WORKOUT"}
              </span>
              <h1 className="ed-today-title">
                {wkAllDone
                  ? isAr
                    ? 'اكتملت جلسة اليوم'
                    : 'Session Complete'
                  : isAr
                  ? currentGoal.ar
                  : currentGoal.en}
              </h1>
              <p className="ed-today-sub">
                {isAr
                  ? `${wkDoneCount} من ${wkTotal} تمارين • ~10 دقائق`
                  : `${wkDoneCount} of ${wkTotal} exercises • ~10 min`}
              </p>
            </div>

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

          {/* Konsta iOS Inset Workout Queue using bespoke -v2.webp artwork */}
          <List
            strong
            inset
            outline
            className="!my-0 !mx-0 w-full"
            colors={{
              strongBgIos: 'bg-[#f8f6f1]/70 dark:bg-[#0b1526]/70',
              outlineIos: 'border-black/10 dark:border-white/10',
            }}
          >
            {wkExercises.map((ex, idx) => {
              const dom = DOMAINS_META[ex.domainId] || DOMAINS_META.attention;
              const exp = GAMES_BY_KEY[ex.gameKey];
              const isDone = Boolean(wkDone[idx]);
              const isUpNext = idx === nextIdx;
              const title = exp
                ? isAr && exp.titleAr
                  ? exp.titleAr
                  : exp.titleEn
                : ex.gameName;
              const thumbSrc = GAME_ART_V2[ex.gameKey]
                ? assetUrl(`Assets/game-illustrations/${GAME_ART_V2[ex.gameKey]}`)
                : exp?.imageAsset;
              const launchExercise = () =>
                handleLaunchGame(
                  exp || { gameKey: ex.gameKey, domainId: ex.domainId },
                  ex.domainId,
                  idx
                );

              return (
                <ListItem
                  key={`${ex.gameKey}-${idx}`}
                  link
                  strongTitle
                  titleFontSizeIos="text-[15px]"
                  className={isDone ? 'opacity-65' : ''}
                  linkProps={{
                    role: 'button',
                    tabIndex: 0,
                    onKeyDown: (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        launchExercise();
                      }
                    },
                  }}
                  onClick={launchExercise}
                  media={
                    thumbSrc ? (
                      <img
                        src={thumbSrc}
                        alt=""
                        draggable="false"
                        className="w-11 h-11 rounded-xl object-cover bg-[#f1ede4] dark:bg-[#0b1526]"
                      />
                    ) : (
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center"
                        style={{ background: dom.softBg }}
                        aria-hidden="true"
                      >
                        <dom.Icon size={20} weight="duotone" color={dom.color} />
                      </div>
                    )
                  }
                  header={
                    <span className="font-bold" style={{ color: dom.color }}>
                      {isAr ? dom.ar : dom.en}
                    </span>
                  }
                  title={title}
                  after={
                    isDone ? (
                      <Badge
                        colors={{ bg: 'bg-[#0d9488]', text: 'text-white' }}
                        className="gap-1"
                      >
                        <Check size={10} weight="bold" aria-hidden="true" />
                        <span>{isAr ? 'تم' : 'Done'}</span>
                      </Badge>
                    ) : (
                      <Badge
                        colors={{
                          bg: isUpNext
                            ? 'bg-[#ff7800]'
                            : 'bg-slate-200 dark:bg-white/15',
                          text: isUpNext
                            ? 'text-white'
                            : 'text-slate-700 dark:text-slate-200',
                        }}
                      >
                        {idx + 1}
                      </Badge>
                    )
                  }
                />
              );
            })}
          </List>

          <div className="ed-today-footer">
            {!wkAllDone ? (
              <Button
                large
                rounded
                type="button"
                className="nayzak-konsta-cta gap-2"
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
                <Play size={16} weight="fill" aria-hidden="true" />
                <span>
                  {wkDoneCount > 0
                    ? isAr
                      ? `متابعة التمرين (${wkDoneCount}/${wkTotal})`
                      : `Continue Workout (${wkDoneCount}/${wkTotal})`
                    : isAr
                    ? 'ابدأ تمرين اليوم'
                    : "Start Today's Workout"}
                </span>
              </Button>
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
        </Card>

        {/* 2. Recommended Next */}
        <BlockTitle className="w-full !px-1 !mt-1 !mb-1.5 text-[12px] uppercase tracking-wider font-extrabold">
          {ratedDomains.length > 0
            ? isAr
              ? 'أفضل مجال للتطوير الآن'
              : 'Recommended Focus'
            : isAr
            ? 'نقطة بداية مقترحة'
            : 'Recommended Starter'}
        </BlockTitle>
        <List strong inset className="w-full !mx-0 !mt-0 !mb-3.5">
          <ListItem
            link
            strongTitle
            titleFontSizeIos="text-[15.5px]"
            linkProps={{
              role: 'button',
              tabIndex: 0,
              onKeyDown: (e) => {
                if ((e.key === 'Enter' || e.key === ' ') && starterGame) {
                  e.preventDefault();
                  handleLaunchGame(starterGame, recommendedDomainId, null);
                }
              },
            }}
            onClick={() => {
              if (starterGame) {
                handleLaunchGame(starterGame, recommendedDomainId, null);
              }
            }}
            media={
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: recMeta.softBg }}
                aria-hidden="true"
              >
                <RecIcon size={22} weight="duotone" color={recMeta.color} />
              </div>
            }
            header={
              <span
                className="font-bold uppercase tracking-wider text-[11px]"
                style={{ color: recMeta.color }}
              >
                {ratedDomains.length > 0
                  ? isAr
                    ? 'توصية اليوم'
                    : 'FOCUS AREA'
                  : isAr
                  ? 'بداية مقترحة'
                  : 'STARTER'}
              </span>
            }
            title={`${isAr ? recMeta.ar : recMeta.en}${recBand ? ` · ${recRating}` : ''}`}
            subtitle={isAr ? recMeta.descAr : recMeta.descEn}
            after={
              starterGame ? (
                <Badge
                  colors={{
                    bg: 'bg-[#0b63ce]/12 dark:bg-[#1cb0f6]/20',
                    text: 'text-[#0b63ce] dark:text-[#60a5fa]',
                  }}
                >
                  {isAr ? 'تدرب' : 'Train'}
                </Badge>
              ) : null
            }
          />
        </List>

        {/* 3. Navigation Shortcuts */}
        <BlockTitle className="w-full !px-1 !mt-1 !mb-1.5 text-[12px] uppercase tracking-wider font-extrabold">
          {isAr ? 'استكشف' : 'Explore'}
        </BlockTitle>
        <List strong inset className="w-full !mx-0 !mt-0 !mb-3.5">
          <ListItem
            link
            strongTitle
            titleFontSizeIos="text-[15.5px]"
            linkProps={{
              role: 'button',
              tabIndex: 0,
              onKeyDown: (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  switchTab('domains');
                }
              },
            }}
            onClick={() => switchTab('domains')}
            media={
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#eff6ff] text-[#0b63ce] dark:bg-[#0b63ce]/20 dark:text-[#60a5fa]"
                aria-hidden="true"
              >
                <Compass size={22} weight="duotone" />
              </div>
            }
            header={
              <span className="font-bold uppercase tracking-wider text-[11px] text-[#0b63ce] dark:text-[#60a5fa]">
                {isAr ? 'التدريب' : 'TRAINING'}
              </span>
            }
            title={isAr ? 'المجالات الستة' : '6 Cognitive Domains'}
            subtitle={isAr ? '18 تمريناً مصنفاً' : 'Browse all 18 exercises'}
          />
          <ListItem
            link
            strongTitle
            titleFontSizeIos="text-[15.5px]"
            linkProps={{
              role: 'button',
              tabIndex: 0,
              onKeyDown: (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  switchTab('profile');
                }
              },
            }}
            onClick={() => switchTab('profile')}
            media={
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#fff4e5] text-[#ff7800] dark:bg-[#ff7800]/20 dark:text-[#ffb012]"
                aria-hidden="true"
              >
                <ChartPolar size={22} weight="duotone" />
              </div>
            }
            header={
              <span className="font-bold uppercase tracking-wider text-[11px] text-[#ff7800] dark:text-[#ffb012]">
                {isAr ? 'الملف المعرفي' : 'INSIGHTS'}
              </span>
            }
            title={isAr ? 'رادار الأداء NPI' : 'Cognitive Radar'}
            subtitle={isAr ? 'مؤشر 0–1000' : 'Your 0–1000 profile'}
          />
        </List>

        {/* 4. Tasteful Nayzak PRO Card */}
        {!isPro && (
          <section className="ed-pro-card">
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
