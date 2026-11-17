import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { List, ListItem, BlockTitle, Button } from 'konsta/react';
import { Play, PuzzlePiece, RocketLaunch } from '@phosphor-icons/react';
import { useApp } from '../../context/AppContext';
import {
  PUZZLE_CATEGORIES, getPuzzle, puzzlesInCategory,
} from '../../features/puzzles/registry';
import { getLazyPuzzle } from '../../features/puzzles/lazyGames';
import NayzakHeader from '../shared/NayzakHeader';
import { lazyWithRetry } from '../../lib/lazyWithRetry';
import { assetUrl } from '../../lib/assetUrl';

const VoidRunnerLazy = lazyWithRetry(
  () => import('../../features/puzzles/games/void-runner'),
  'void-runner',
);

const CATEGORY_ART = {
  numbers: 'Assets/puzzle-studio/category-art-2026/numbers.webp',
  logic: 'Assets/puzzle-studio/category-art-2026/logic.webp',
  spatial: 'Assets/puzzle-studio/category-art-2026/spatial.webp',
  group: 'Assets/puzzle-studio/category-art-2026/group.webp',
};

const GAME_ART = {
  sudoku: 'Assets/puzzle-studio/game-art-2026/sudoku.webp',
  kenken: 'Assets/puzzle-studio/game-art-2026/kenken.webp',
  kakuro: 'Assets/puzzle-studio/game-art-2026/kakuro.webp',
  nonogram: 'Assets/puzzle-studio/game-art-2026/nonogram.webp',
  takuzu: 'Assets/puzzle-studio/game-art-2026/takuzu.webp',
  hitori: 'Assets/puzzle-studio/game-art-2026/hitori.webp',
  crowns: 'Assets/puzzle-studio/game-art-2026/crowns.webp',
  bridges: 'Assets/puzzle-studio/game-art-2026/bridges.webp',
  sliding: 'Assets/puzzle-studio/game-art-2026/sliding.webp',
  blockburst: 'Assets/puzzle-studio/game-art-2026/blockburst.webp',
  flow: 'Assets/puzzle-studio/game-art-2026/flow.webp',
  tangram: 'Assets/puzzle-studio/game-art-2026/tangram.webp',
  imposter: 'Assets/puzzle-studio/game-art-2026/imposter.webp',
  charades: 'Assets/puzzle-studio/game-art-2026/charades.webp',
  describeit: 'Assets/puzzle-studio/game-art-2026/describeit.webp',
  wavelength: 'Assets/puzzle-studio/game-art-2026/wavelength.webp',
  gettoknow: 'Assets/puzzle-studio/game-art-2026/gettoknow.webp',
  groupwar: 'Assets/puzzle-studio/game-art-2026/groupwar.webp',
  thewheel: 'Assets/puzzle-studio/game-art-2026/thewheel.webp',
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
        background: '#FAF7F2',
        color: '#0F172A',
        fontFamily: "'Cairo', 'Outfit', system-ui, sans-serif",
        fontSize: 17,
        fontWeight: 800,
        gap: 10,
      }}
    >
      <PuzzlePiece size={34} weight="duotone" color="#2586F7" aria-hidden="true" />
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

  // Category Puzzle List View (Duolingo Style Rows)
  if (category) {
    return (
      <div className="nayzak-page" dir={isAr ? 'rtl' : 'ltr'}>
        <NayzakHeader
          title={isAr ? activeCategory?.nameAr : activeCategory?.name}
          subtitle={isAr ? `${categoryPuzzles.length} ألغاز` : `${categoryPuzzles.length} puzzles`}
          onBack={() => setCategory(null)}
          backLabel={isAr ? 'الفئات' : 'Categories'}
        />

        <main className="duo-puzzle-container">
          <BlockTitle className="w-full !px-1 !mt-1 !mb-0 text-[12px] uppercase tracking-wider font-extrabold">
            {isAr
              ? `${activeCategory?.nameAr} · ${categoryPuzzles.length} ألغاز`
              : `${activeCategory?.name} · ${categoryPuzzles.length} Puzzles`}
          </BlockTitle>

          <List strong inset className="w-full !mx-0 !my-0">
            {categoryPuzzles.map((puzzle) => (
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
                  <img
                    src={assetUrl(GAME_ART[puzzle.id])}
                    alt={isAr ? puzzle.nameAr : puzzle.name}
                    draggable="false"
                    className="w-14 h-14 rounded-2xl object-cover bg-slate-100 dark:bg-[#0b1526]"
                  />
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
            ))}
          </List>
        </main>
      </div>
    );
  }

  // Konsta iOS Puzzles Hub
  return (
    <div className="nayzak-page" dir={isAr ? 'rtl' : 'ltr'}>
      <NayzakHeader showLogo showStats showLang />

      <main className="duo-puzzle-container">
        {/* Hero Header Banner */}
        <div className="duo-puzzle-banner">
          <div>
            <span className="duo-unit-badge">{isAr ? 'استوديو العقل' : 'MIND STUDIO'}</span>
            <h1 className="duo-unit-title">{isAr ? 'تحديات وألغاز ذكية' : 'Puzzles & Challenges'}</h1>
            <p className="duo-unit-desc">{isAr ? 'اختر فئة وابدأ تدريب ذكائك اليوم' : 'Pick a category and sharpen your mind'}</p>
          </div>
          <div className="duo-puzzle-banner-icon" aria-hidden="true">
            <PuzzlePiece size={34} weight="duotone" color="#ffffff" />
          </div>
        </div>

        {/* Featured Spotlight Card (Void Runner) */}
        <List strong inset className="w-full !mx-0 !my-0">
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
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #fff4e5 0%, #ffe0b2 100%)',
                  border: '1.5px solid #ffcc80',
                }}
                aria-hidden="true"
              >
                <RocketLaunch size={28} weight="duotone" color="#d96400" />
              </div>
            }
            header={
              <span className="font-extrabold uppercase tracking-wider text-[11px] text-[#d96400] dark:text-[#ffb012]">
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

        {/* Categories Grid */}
        <BlockTitle className="w-full !px-1 !mt-1 !mb-0 text-[12px] uppercase tracking-wider font-extrabold">
          {isAr ? 'فئات الألغاز' : 'Categories'}
        </BlockTitle>
        <section className="duo-cat-grid" aria-label={isAr ? 'فئات الألغاز' : 'Puzzle categories'}>
          {PUZZLE_CATEGORIES.map((item) => (
            <button
              key={item.id}
              type="button"
              className="duo-cat-card"
              onClick={() => {
                playSfx?.('pop');
                setCategory(item.id);
              }}
            >
              <div className="duo-cat-img-wrap">
                <img src={assetUrl(CATEGORY_ART[item.id])} alt="" draggable="false" />
              </div>
              <div className="duo-cat-name">
                {isAr ? item.nameAr : item.name}
              </div>
              <div className="duo-cat-desc">
                {isAr ? item.descAr : item.desc}
              </div>
            </button>
          ))}
        </section>
      </main>
    </div>
  );
}
