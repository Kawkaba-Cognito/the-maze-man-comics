import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { List, ListItem, Button } from 'konsta/react';
import {
  Play,
  PuzzlePiece,
  Hash,
  UsersThree,
  Cube,
  GridFour,
  Calculator,
  ListNumbers,
  Crown,
  Lightbulb,
  Shuffle,
  MaskHappy,
  MicrophoneStage,
  ChartLineUp,
  Fire,
  Trophy,
  Link as LinkIcon,
  ArrowRight,
  ArrowLeft,
} from '@phosphor-icons/react';
import { useApp } from '../../context/AppContext';
import {
  PUZZLE_CATEGORIES,
  getPuzzle,
  puzzlesInCategory,
} from '../../features/puzzles/registry';
import { getLazyPuzzle } from '../../features/puzzles/lazyGames';
import NayzakHeader from '../shared/NayzakHeader';
import { lazyWithRetry } from '../../lib/lazyWithRetry';
import { assetUrl } from '../../lib/assetUrl';

const VoidRunnerLazy = lazyWithRetry(
  () => import('../../features/puzzles/games/void-runner'),
  'void-runner',
);

const CATEGORY_META = {
  numbers: {
    color: '#2E5EA8',
    softBg: '#EBF1FA',
    art: 'Assets/brand/clay-2026/puzzle-numbers.webp',
    Icon: Hash,
  },
  logic: {
    color: '#4D8F68',
    softBg: '#EAF4EE',
    art: 'Assets/brand/clay-2026/puzzle-logic.webp',
    Icon: PuzzlePiece,
  },
  spatial: {
    color: '#D9911E',
    softBg: '#FDF3DF',
    art: 'Assets/brand/clay-2026/puzzle-spatial.webp',
    Icon: Cube,
  },
  group: {
    color: '#D95A3D',
    softBg: '#FCEBE7',
    art: 'Assets/brand/clay-2026/puzzle-group.webp',
    Icon: UsersThree,
  },
};

const PUZZLE_ICONS = {
  sudoku: GridFour,
  kenken: Calculator,
  kakuro: ListNumbers,
  nonogram: GridFour,
  takuzu: ListNumbers,
  hitori: Hash,
  crowns: Crown,
  bridges: LinkIcon,
  sliding: Shuffle,
  blockburst: Cube,
  flow: LinkIcon,
  tangram: PuzzlePiece,
  imposter: MaskHappy,
  charades: MaskHappy,
  describeit: MicrophoneStage,
  wavelength: ChartLineUp,
  gettoknow: Lightbulb,
  groupwar: Fire,
  thewheel: Trophy,
};

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
      <PuzzlePiece size={34} weight="duotone" color="#2F4A6D" aria-hidden="true" />
      <span>{isAr ? 'جارِ التحميل…' : 'Loading…'}</span>
    </div>
  );
}

export default function PuzzlesScreen() {
  const { currentLang, playSfx, setImmersive } = useApp();
  const isAr = currentLang === 'ar';

  const [activeGame, setActiveGame] = useState(() => {
    try {
      return typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('puzzle') : null;
    } catch {
      return null;
    }
  });
  const [category, setCategory] = useState(null);
  const [voidRunnerOpen, setVoidRunnerOpen] = useState(false);

  useEffect(() => {
    setImmersive('puzzles', !!activeGame || !!category || voidRunnerOpen);
    return () => setImmersive('puzzles', false);
  }, [activeGame, category, voidRunnerOpen, setImmersive]);

  const activeCategory = useMemo(
    () => PUZZLE_CATEGORIES.find((item) => item.id === category) || null,
    [category],
  );
  const categoryPuzzles = useMemo(
    () => (category ? puzzlesInCategory(category) : []),
    [category],
  );
  const activePuzzle = activeGame ? getPuzzle(activeGame) : null;
  const GameView = activeGame ? getLazyPuzzle(activeGame) : null;
  const NavArrow = isAr ? ArrowLeft : ArrowRight;

  if (voidRunnerOpen) {
    return (
      <div className="pz-studio-game pz-theme-spatial pz-studio-game--void">
        <Suspense fallback={<GameLoading isAr={isAr} />}>
          <VoidRunnerLazy onBack={() => setVoidRunnerOpen(false)} />
        </Suspense>
      </div>
    );
  }

  if (activeGame && GameView) {
    return (
      <div
        className={`pz-studio-game pz-theme-${activePuzzle?.category || 'logic'}`}
        style={{ '--pz-puzzle-accent': activePuzzle?.accent || '#2F4A6D' }}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <Suspense fallback={<GameLoading isAr={isAr} />}>
          <GameView onBack={() => setActiveGame(null)} />
        </Suspense>
      </div>
    );
  }

  // Category Puzzle List View (Clean Vector Squircles + Konsta Inset List)
  if (category) {
    const catMeta = CATEGORY_META[category] || CATEGORY_META.numbers;
    const catName = isAr ? activeCategory?.nameAr : activeCategory?.name;

    return (
      <div className="nayzak-page" dir={isAr ? 'rtl' : 'ltr'}>
        <NayzakHeader
          title={catName}
          subtitle={isAr ? `${categoryPuzzles.length} ألغاز` : `${categoryPuzzles.length} puzzles`}
          onBack={() => setCategory(null)}
          backLabel={isAr ? 'الفئات' : 'Categories'}
        />

        <main className="duo-puzzle-container">
          <div className="lum-section-row">
            <h2 className="lum-section-title">
              {isAr
                ? `${catName} · ${categoryPuzzles.length} ألغاز`
                : `${catName} Puzzles`}
            </h2>
            <span className="lum-count-pill">
              {isAr ? `${categoryPuzzles.length} ألغاز` : `${categoryPuzzles.length} puzzles`}
            </span>
          </div>

          <List strong inset className="w-full !mx-0 !mt-1 !mb-6">
            {categoryPuzzles.map((puzzle) => {
              const PuzzleIcon = PUZZLE_ICONS[puzzle.id] || catMeta.Icon;
              return (
                <ListItem
                  key={puzzle.id}
                  link
                  chevron={false}
                  strongTitle
                  titleFontSizeIos="text-[16px]"
                  linkProps={{
                    role: 'button',
                    tabIndex: 0,
                    onKeyDown: (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        playSfx?.('pop');
                        setActiveGame(puzzle.gameKey);
                      }
                    },
                  }}
                  onClick={() => {
                    playSfx?.('pop');
                    setActiveGame(puzzle.gameKey);
                  }}
                  media={
                    <span
                      className="lum-tile-icon shrink-0"
                      style={{ backgroundColor: catMeta.color }}
                      aria-hidden="true"
                    >
                      <PuzzleIcon size={21} weight="fill" color="#FFFFFF" />
                    </span>
                  }
                  title={isAr ? puzzle.nameAr : puzzle.name}
                  subtitle={isAr ? puzzle.descAr : puzzle.desc}
                  after={
                    <Button
                      small
                      rounded
                      inline
                      type="button"
                      className="nayzak-konsta-cta !px-3.5 gap-1.5 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        playSfx?.('pop');
                        setActiveGame(puzzle.gameKey);
                      }}
                    >
                      <Play size={12} weight="fill" aria-hidden="true" />
                      <span>{isAr ? 'العب' : 'Play'}</span>
                    </Button>
                  }
                />
              );
            })}
          </List>
        </main>
      </div>
    );
  }

  // Clean Puzzles Hub (Unboxed Editorial Header + Void Runner Card + 2-Col Vector Categories)
  return (
    <div className="nayzak-page" dir={isAr ? 'rtl' : 'ltr'}>
      <NayzakHeader showLogo showStats showLang />

      <main className="duo-puzzle-container">
        <section className="lum-catalog-header">
          <div className="lum-top-copy">
            <span className="lum-date-label">
              {isAr ? 'استوديو الألغاز · ١٩ لغزاً' : 'MIND STUDIO · 19 PUZZLES'}
            </span>
            <h1 className="lum-screen-title">
              {isAr ? 'الألغاز والتحديات' : 'Puzzles'}
            </h1>
            <p className="nayzak-tab-helper">
              {isAr
                ? 'ألغاز أرقام ومنطق هادئة — العب على راحتك بدون مؤقت'
                : 'Relaxed logic & number teasers — play at your own pace, no countdown.'}
            </p>
          </div>
        </section>

        {/* Featured Spotlight Card — Hosted by Grandpa Dalfin */}
        <div className="nayzak-riddle-spotlight">
          <button
            type="button"
            className="nayzak-spotlight-btn"
            onClick={() => {
              playSfx?.('pop');
              setVoidRunnerOpen(true);
            }}
          >
            <div className="nayzak-spotlight-char" aria-hidden="true">
              <img
                src={assetUrl('Assets/brand/clay-2026/puzzle-spatial.webp')}
                alt=""
                draggable="false"
              />
            </div>

            <div className="nayzak-spotlight-body">
              <span className="nayzak-comic-ribbon nayzak-comic-ribbon--sm">
                {isAr ? 'طيران ثلاثي الأبعاد' : '3D CLAY FLIGHT'}
              </span>
              <h2 className="nayzak-spotlight-title">
                {isAr ? 'طائرة الصلصال · Clay Plane' : 'Clay Plane'}
              </h2>
              <p className="nayzak-spotlight-sub">
                {isAr
                  ? 'حلّق عبر الأخاديد واجمع العملات الذهبية'
                  : 'Glide your 3D clay biplane through sunlit canyons & coins.'}
              </p>
            </div>

            <span className="nayzak-spotlight-play">
              <Play size={14} weight="fill" aria-hidden="true" />
              <span>{isAr ? 'العب' : 'Play'}</span>
            </span>
          </button>
        </div>

        <div className="lum-section-row">
          <h2 className="lum-section-title">
            {isAr ? 'فئات الألغاز' : 'Categories'}
          </h2>
          <span className="lum-count-pill">
            {isAr ? `${PUZZLE_CATEGORIES.length} فئات` : `${PUZZLE_CATEGORIES.length} categories`}
          </span>
        </div>

        <section className="lum-domains-grid lum-puzzles-grid" aria-label={isAr ? 'فئات الألغاز' : 'Puzzle categories'}>
          {PUZZLE_CATEGORIES.map((item) => {
            const meta = CATEGORY_META[item.id] || CATEGORY_META.logic;
            const count = puzzlesInCategory(item.id).length;

            return (
              <button
                key={item.id}
                type="button"
                className="lum-domain-card lum-domain-card--illustrated"
                style={{ '--dom-color': meta.color, '--dom-soft': meta.softBg }}
                onClick={() => {
                  playSfx?.('pop');
                  setCategory(item.id);
                }}
              >
                <div
                  className="lum-card-stage"
                  style={{ backgroundColor: meta.softBg }}
                >
                  <img
                    src={assetUrl(meta.art)}
                    alt=""
                    draggable="false"
                    className="lum-card-stage-img"
                  />
                  <span className="lum-count-pill lum-stage-pill">
                    {isAr ? `${count} ألغاز` : `${count} puzzles`}
                  </span>
                </div>

                <div className="lum-card-content">
                  <div className="lum-domain-card-body">
                    <h3 className="lum-domain-card-title">
                      {isAr ? item.nameAr : item.name}
                    </h3>
                    <p className="lum-domain-card-desc">
                      {isAr ? item.descAr : item.desc}
                    </p>
                  </div>

                  <div className="lum-domain-card-foot">
                    <span className="lum-domain-prog-lbl">
                      {isAr ? 'بدون مؤقت · أوضاع متعددة' : 'Untimed · Multiple grids'}
                    </span>
                    <span
                      className="clay-card-pill-btn"
                      style={{ backgroundColor: meta.color }}
                    >
                      <span>{isAr ? 'العب الآن' : 'Play'}</span>
                      <NavArrow size={13} weight="bold" aria-hidden="true" />
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </section>
      </main>
    </div>
  );
}
