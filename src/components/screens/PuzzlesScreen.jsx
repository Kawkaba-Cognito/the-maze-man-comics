import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { List, ListItem, Button } from 'konsta/react';
import {
  Play,
  PuzzlePiece,
  RocketLaunch,
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

const VoidRunnerLazy = lazyWithRetry(
  () => import('../../features/puzzles/games/void-runner'),
  'void-runner',
);

const CATEGORY_META = {
  numbers: { color: '#0B63CE', Icon: Hash },
  logic: { color: '#4F46E5', Icon: PuzzlePiece },
  spatial: { color: '#0D9488', Icon: Cube },
  group: { color: '#FF7800', Icon: UsersThree },
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
        background: '#F8F6F1',
        color: '#0F1E33',
        fontFamily: "'Cairo', 'Outfit', system-ui, sans-serif",
        fontSize: 17,
        fontWeight: 800,
        gap: 10,
      }}
    >
      <PuzzlePiece size={34} weight="duotone" color="#0B63CE" aria-hidden="true" />
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
        style={{ '--pz-puzzle-accent': activePuzzle?.accent || '#2586F7' }}
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
              {isAr ? 'استوديو الألغاز' : 'MIND STUDIO · 19 PUZZLES'}
            </span>
            <h1 className="lum-screen-title">
              {isAr ? 'الألغاز والتحديات' : 'Puzzles'}
            </h1>
          </div>
        </section>

        {/* Featured Spotlight Card (Void Runner) */}
        <List strong inset className="w-full !mx-0 !mt-0 !mb-5">
          <ListItem
            link
            chevron={false}
            strongTitle
            titleFontSizeIos="text-[16.5px]"
            linkProps={{
              role: 'button',
              tabIndex: 0,
              onKeyDown: (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  playSfx?.('pop');
                  setVoidRunnerOpen(true);
                }
              },
            }}
            onClick={() => {
              playSfx?.('pop');
              setVoidRunnerOpen(true);
            }}
            media={
              <span
                className="lum-tile-icon shrink-0"
                style={{ backgroundColor: '#FF7800' }}
                aria-hidden="true"
              >
                <RocketLaunch size={22} weight="fill" color="#FFFFFF" />
              </span>
            }
            header={
              <span className="font-extrabold uppercase tracking-wider text-[11px] text-[#FF7800] dark:text-[#FFB012]">
                {isAr ? 'مميز اليوم' : 'Daily Featured'}
              </span>
            }
            title={isAr ? 'عدّاء الفراغ' : 'Void Runner'}
            subtitle={
              isAr
                ? 'رحلة فضائية سريعة لاختبار ردة الفعل والتركيز'
                : 'Fast spatial flight challenge'
            }
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
                  setVoidRunnerOpen(true);
                }}
              >
                <Play size={12} weight="fill" aria-hidden="true" />
                <span>{isAr ? 'العب' : 'Play'}</span>
              </Button>
            }
          />
        </List>

        <div className="lum-section-row">
          <h2 className="lum-section-title">
            {isAr ? 'فئات الألغاز' : 'Categories'}
          </h2>
          <span className="lum-count-pill">
            {isAr ? `${PUZZLE_CATEGORIES.length} فئات` : `${PUZZLE_CATEGORIES.length} categories`}
          </span>
        </div>

        <section className="lum-domains-grid" aria-label={isAr ? 'فئات الألغاز' : 'Puzzle categories'}>
          {PUZZLE_CATEGORIES.map((item) => {
            const meta = CATEGORY_META[item.id] || CATEGORY_META.logic;
            const CatIcon = meta.Icon;
            const count = puzzlesInCategory(item.id).length;

            return (
              <button
                key={item.id}
                type="button"
                className="lum-domain-card"
                onClick={() => {
                  playSfx?.('pop');
                  setCategory(item.id);
                }}
              >
                <div className="lum-domain-card-top">
                  <span
                    className="lum-tile-icon"
                    style={{ backgroundColor: meta.color }}
                    aria-hidden="true"
                  >
                    <CatIcon size={22} weight="fill" color="#FFFFFF" />
                  </span>
                  <span className="lum-count-pill">
                    {isAr ? `${count} ألغاز` : `${count} puzzles`}
                  </span>
                </div>

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
                    {isAr ? 'تحديات ذهنية' : 'Mind Studio'}
                  </span>
                  <span className="lum-domain-cta" style={{ color: meta.color }}>
                    <span>{isAr ? 'استكشف' : 'Explore'}</span>
                    <NavArrow size={14} weight="bold" aria-hidden="true" />
                  </span>
                </div>
              </button>
            );
          })}
        </section>
      </main>
    </div>
  );
}
