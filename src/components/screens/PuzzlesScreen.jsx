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

/** Per-world vertical scatter, so four categories read as a sky not a row. */
const PZ_DRIFT = [-0.14, 0.12, -0.05, 0.15];

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
  const chrome = useThemedChrome(isAr, { universe: true });
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

        {/*
          The hub is a constellation, not a card stack.

          It used to be a white editorial page: a 3.6rem navy grotesque, four
          bordered cards with drop shadows and a 🚀 emoji in a rounded square —
          a different product from the dusk universe every other landing sits
          on. The categories are worlds now, drawn with the same orb treatment
          as Kawnera's library and the Training hub's domains, and Void Runner
          is the largest of them because it is the featured one.
        */}
        <main className="pz-studio-main pz-hub">
          <section className="pz-studio-intro">
            <span className="pz-studio-kicker">{isAr ? 'اختر طريقتك في التفكير' : 'Choose how you want to think'}</span>
            <h1>{t.hubTitle}</h1>
            <p>{t.hubSub}</p>
          </section>

          <button
            type="button"
            className="pz-feature-world"
            onClick={() => { playSfx('click'); setVoidRunnerOpen(true); }}
          >
            {/* Void Runner has no cover art, so its world is drawn: a dark
                body with its own horizon glow, which is also what the game
                looks like. No emoji — the app does not use them as artwork. */}
            <span className="pz-orb pz-orb--void" aria-hidden="true">
              <i className="pz-orb-void-glow" />
              <i className="pz-orb-shade" />
              <i className="pz-orb-rim" />
            </span>
            <span className="pz-feature-copy">
              <small>{isAr ? 'العالم المميّز' : 'FEATURED WORLD'}</small>
              <b>{isAr ? 'عدّاء الفراغ' : 'Void Runner'}</b>
              <i>{isAr ? 'ردّ فعل مكاني في رحلة سريعة' : 'Fast spatial reactions in an endless flight'}</i>
            </span>
          </button>

          <section className="pz-constellation" aria-label={isAr ? 'فئات الألغاز' : 'Puzzle categories'}>
            {PUZZLE_CATEGORIES.map((item, i) => (
              <button
                type="button"
                key={item.id}
                className={`pz-world pz-theme-${item.id}`}
                style={{ '--world': item.accent, '--drift': PZ_DRIFT[i % PZ_DRIFT.length] }}
                onClick={() => { playSfx('click'); setCategory(item.id); }}
              >
                <span className="pz-orb" aria-hidden="true">
                  <img
                    src={assetUrl(CATEGORY_ART[item.id])}
                    alt=""
                    decoding="async"
                    draggable="false"
                  />
                  <i className="pz-orb-shade" />
                  <i className="pz-orb-rim" />
                </span>
                <span className="pz-world-name">{isAr ? item.nameAr : item.name}</span>
                <span className="pz-world-desc">{isAr ? item.descAr : item.desc}</span>
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

      {/*
        The category screen is the hub one level down: the category itself is
        the big world, and each puzzle inside it is a small moon of that world.
        `pz-hub` carries the orb and constellation styling so both screens are
        drawn by one set of rules rather than two that drift apart.
      */}
      <main className="pz-studio-main pz-hub pz-cat">
        <section className="pz-cat-hero" style={{ '--world': activeCategory?.accent }}>
          <span className="pz-orb pz-orb--lg" aria-hidden="true">
            <img src={assetUrl(CATEGORY_ART[category])} alt="" decoding="async" draggable="false" />
            <i className="pz-orb-shade" />
            <i className="pz-orb-rim" />
          </span>
          <div className="pz-cat-id">
            <span className="pz-studio-kicker">{isAr ? 'فئة الألغاز' : 'Puzzle category'}</span>
            <h1>{isAr ? activeCategory?.nameAr : activeCategory?.name}</h1>
            <p>{isAr ? activeCategory?.descAr : activeCategory?.desc}</p>
          </div>
        </section>

        <section className="pz-constellation pz-constellation--moons" aria-label={isAr ? 'الألعاب' : 'Games'}>
          {categoryPuzzles.map((puzzle, i) => (
            <button
              type="button"
              key={puzzle.id}
              className="pz-world pz-world--moon"
              style={{ '--world': puzzle.accent, '--drift': PZ_DRIFT[i % PZ_DRIFT.length] }}
              onClick={() => { playSfx('click'); setActiveGame(puzzle.gameKey); }}
            >
              {/* No art exists per puzzle, so the moon is drawn: the game's own
                  glyph on a body tinted by its accent. Same orb shading as the
                  category worlds above, one size down. */}
              <span className="pz-orb pz-orb--moon" aria-hidden="true">
                <i className="pz-orb-glyph">{puzzle.icon}</i>
                <i className="pz-orb-shade" />
                <i className="pz-orb-rim" />
              </span>
              <span className="pz-world-name">{isAr ? puzzle.nameAr : puzzle.name}</span>
              <span className="pz-world-desc">{isAr ? puzzle.descAr : puzzle.desc}</span>
            </button>
          ))}
        </section>
      </main>
    </div>
  );
}
