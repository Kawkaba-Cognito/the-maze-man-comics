import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  PUZZLE_CATEGORIES, getPuzzle, puzzlesInCategory,
} from '../../features/puzzles/registry';
import { getLazyPuzzle } from '../../features/puzzles/lazyGames';
import { PUZZLE_UI } from '../../features/puzzles/shared/puzzleStrings';
import { IconBack } from '../../features/training/shared/TrainingIcons';
import AtmosphericBackground from '../shared/AtmosphericBackground';
import { useThemedChrome } from '../../hooks/useThemedChrome';
import { hasEnteredLabyrinth } from '../../features/campaign/campaignProgress';
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

function StudioAtmosphere() {
  return (
    <>
      <AtmosphericBackground strength="hub" photo={false} />
      <div className="pz-studio-nebula pz-studio-nebula--one" aria-hidden="true" />
      <div className="pz-studio-nebula pz-studio-nebula--two" aria-hidden="true" />
      <div className="pz-studio-stars" aria-hidden="true" />
    </>
  );
}

function StudioHeader({
  title, backLabel, onBack, isAr, toggleLang, playSfx, iconColor,
}) {
  return (
    <header className="pz-studio-header">
      <div className="pz-studio-header-slot">
        <button
          type="button"
          className="pz-studio-chrome-btn"
          onClick={() => { playSfx('click'); onBack(); }}
          aria-label={backLabel}
        >
          <IconBack size={19} c={iconColor} />
        </button>
      </div>
      <div className="pz-studio-header-title">{title}</div>
      <div className="pz-studio-header-slot pz-studio-header-slot--end">
        <button
          type="button"
          className="pz-studio-lang"
          onClick={() => { playSfx('click'); toggleLang(); }}
        >
          {isAr ? 'EN' : 'عر'}
        </button>
      </div>
    </header>
  );
}

function GameLoading({ isAr }) {
  return (
    <div className="pz-studio-loading">
      <span className="pz-studio-loading-mark" aria-hidden="true">✦</span>
      {isAr ? 'جارِ التحميل…' : 'Loading…'}
    </div>
  );
}

export default function PuzzlesScreen() {
  const {
    switchTab, currentLang, toggleLang, playSfx, requestContinueMaze, setImmersive,
  } = useApp();
  const isAr = currentLang === 'ar';
  const chrome = useThemedChrome(isAr);
  const t = PUZZLE_UI[isAr ? 'ar' : 'en'];
  const canContinue = hasEnteredLabyrinth();

  const [activeGame, setActiveGame] = useState(null);
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
        style={{ '--pz-puzzle-accent': activePuzzle?.accent || '#5ec6b6' }}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <Suspense fallback={<GameLoading isAr={isAr} />}>
          <GameView onBack={() => setActiveGame(null)} />
        </Suspense>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="pz-studio pz-studio--hub" dir={isAr ? 'rtl' : 'ltr'}>
        <StudioAtmosphere />
        <StudioHeader
          title={t.hubTitle}
          backLabel={isAr ? 'رجوع' : 'Back'}
          onBack={() => switchTab('comics')}
          isAr={isAr}
          toggleLang={toggleLang}
          playSfx={playSfx}
          iconColor={chrome.text}
        />

        <main className="pz-studio-main">
          <section className="pz-studio-intro">
            <span className="pz-studio-kicker">{isAr ? 'اختر طريقتك في التفكير' : 'Choose how you want to think'}</span>
            <h1>{t.hubTitle}</h1>
            <p>{t.hubSub}</p>
          </section>

          <button
            type="button"
            className="pz-studio-feature"
            onClick={() => { playSfx('click'); setVoidRunnerOpen(true); }}
          >
            <span className="pz-studio-feature-rocket" aria-hidden="true">🚀</span>
            <span className="pz-studio-feature-copy">
              <b>{isAr ? 'عدّاء الفراغ' : 'Void Runner'}</b>
              <small>{isAr ? 'ردّ فعل مكاني في رحلة سريعة' : 'Fast spatial reactions in an endless flight'}</small>
            </span>
            <span className="pz-studio-feature-arrow" aria-hidden="true">›</span>
          </button>

          <section className="pz-category-grid" aria-label={isAr ? 'فئات الألغاز' : 'Puzzle categories'}>
            {PUZZLE_CATEGORIES.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`pz-category-card pz-theme-${item.id}`}
                style={{ '--pz-card-accent': item.accent }}
                onClick={() => { playSfx('click'); setCategory(item.id); }}
              >
                <span className="pz-category-art-shell" aria-hidden="true">
                  <img
                    className="pz-category-art"
                    src={assetUrl(CATEGORY_ART[item.id])}
                    alt=""
                    draggable="false"
                  />
                </span>
                <span className="pz-category-copy">
                  <b>{isAr ? item.nameAr : item.name}</b>
                  <small>{isAr ? item.descAr : item.desc}</small>
                </span>
                <span className="pz-category-arrow" aria-hidden="true">›</span>
              </button>
            ))}
          </section>

          {canContinue && (
            <button
              type="button"
              className="pz-studio-continue"
              onClick={() => { playSfx('click'); requestContinueMaze(); }}
            >
              {isAr ? 'تابع المتاهة' : 'Continue maze'}
            </button>
          )}
        </main>
      </div>
    );
  }

  return (
    <div
      className={`pz-studio pz-studio--category pz-theme-${category}`}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <StudioAtmosphere />
      <StudioHeader
        title={isAr ? activeCategory?.nameAr : activeCategory?.name}
        backLabel={isAr ? 'الفئات' : 'Categories'}
        onBack={() => setCategory(null)}
        isAr={isAr}
        toggleLang={toggleLang}
        playSfx={playSfx}
        iconColor={chrome.text}
      />

      <main className="pz-studio-main pz-studio-main--category">
        <section className="pz-category-hero">
          <img src={assetUrl(CATEGORY_ART[category])} alt="" draggable="false" />
          <div>
            <span className="pz-studio-kicker">{isAr ? 'فئة الألغاز' : 'Puzzle category'}</span>
            <h1>{isAr ? activeCategory?.nameAr : activeCategory?.name}</h1>
            <p>{isAr ? activeCategory?.descAr : activeCategory?.desc}</p>
          </div>
        </section>

        <section className="pz-game-grid" aria-label={isAr ? 'الألعاب' : 'Games'}>
          {categoryPuzzles.map((puzzle) => (
            <button
              type="button"
              key={puzzle.id}
              className="pz-game-card"
              style={{ '--pz-puzzle-accent': puzzle.accent }}
              onClick={() => { playSfx('click'); setActiveGame(puzzle.gameKey); }}
            >
              <span className="pz-game-icon" aria-hidden="true">{puzzle.icon}</span>
              <span className="pz-game-copy">
                <b>{isAr ? puzzle.nameAr : puzzle.name}</b>
                <small>{isAr ? puzzle.descAr : puzzle.desc}</small>
              </span>
              <span className="pz-game-arrow" aria-hidden="true">›</span>
            </button>
          ))}
        </section>
      </main>
    </div>
  );
}
