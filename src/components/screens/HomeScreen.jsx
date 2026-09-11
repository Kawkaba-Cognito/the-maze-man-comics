import React, { useCallback } from 'react';
import { useLearnedBodies } from '../../features/universe/LearningUniverse';
import { KAWNERA_BOOKS } from '../../features/kawnera/books';
import { setPendingChapter } from '../../features/kawnera/pendingChapter';
import { useApp } from '../../context/AppContext';
import NeuralPanel from '../../features/personalization/NeuralPanel';
import ProgressCard from '../../features/home/ProgressCard';
import WorkoutCard from '../../features/home/WorkoutCard';
import DomainSnapshot from '../../features/home/DomainSnapshot';
import ReadingCard from '../../features/home/ReadingCard';
import '../../features/home/homeDashboard.css';

/*
 * Home, rebuilt as a plain dashboard (2026-09-10, owner: "remove the 3d
 * planet, and add stuff that are useful for the app").
 *
 * What used to be here: a Three.js particle scene (ZenUniverse) with a
 * literal 3D planet at the centre, a scroll-triggered "dive" transition, and
 * PlanetSurface — an isometric canvas world you landed on underneath it. All
 * three are gone, along with the WebGL context they held open on every visit
 * to Home. That context was not free: this machine has already BSOD'd once
 * (`INTERNAL_POWER_ERROR`, see CLAUDE.md) under load from multiple WebGL
 * contexts at once, and this one ran continuously behind the single most
 * visited screen in the app. `ZenUniverse.jsx`, `PlanetSurface.jsx` and
 * `UniverseDiveTransition.jsx` are left in the tree, unreferenced, same
 * convention as `MartianMaze.jsx` before them.
 *
 * What replaced it is four stacked cards, each surfacing a number or an
 * action the app already had but never put in front of the user on the one
 * screen everybody opens first:
 *   - NeuralPanel / ProgressCard — unchanged, already real content.
 *   - WorkoutCard — Daily Workout previously had exactly one entry point
 *     (ReminderBanner, which only appears once a scheduled time has passed).
 *     Opening the app before then left no way to start it from Home at all.
 *   - DomainSnapshot — the six cognitive-domain ratings Training already
 *     computes (rating.js) had no home screen of their own.
 *   - ReadingCard — replaces LearningUniverse's full-bleed "sky" of learned
 *     chapters with the one fact worth surfacing from the same underlying
 *     spaced-repetition data: the chapter you're closest to forgetting.
 *
 * LearningUniverse.jsx itself (the sky renderer) is untouched and still used
 * elsewhere unrelated to this — only its `useLearnedBodies` hook is reused
 * here, for the warmth data ReadingCard reads.
 */
export default function HomeScreen() {
  const { currentLang, switchTab, playSfx } = useApp();
  const isAr = currentLang === 'ar';
  const bodies = useLearnedBodies(KAWNERA_BOOKS);

  const openChapter = useCallback(
    (bookId, chapterIndex) => {
      setPendingChapter({ bookId, chapterIndex });
      switchTab('learn');
    },
    [switchTab],
  );

  /* Tapping a suggestion goes to that TAB, not the specific domain or
   * practice. Kawnera is the only feature with a pending-target seam
   * (pendingChapter.js); training and wellbeing have none, and inventing two
   * more here would be a bigger change than this one. Landing on the right
   * screen with the suggestion still on Home is the honest middle. */
  const openTrainingDomain = useCallback(() => switchTab('comics'), [switchTab]);
  const openWellbeingPractice = useCallback(() => switchTab('relax'), [switchTab]);
  const openWorkout = useCallback(() => switchTab('workout'), [switchTab]);

  /* Daily Habits specifically (not the Wellbeing landing) — the same one-shot
   * sessionStorage handoff HabitReminderBanner already uses successfully, set
   * immediately before the switch so it can never linger and hijack a later,
   * unrelated navigation into 'relax' (see the AppContext.switchTab note this
   * replaces). */
  const openDailyHabits = useCallback(() => {
    try { sessionStorage.setItem('rx_open_daily', '1'); } catch { /* ignore */ }
    switchTab('relax');
  }, [switchTab]);

  return (
    <div className="home-dashboard" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Purely decorative — see the CSS comment in homeDashboard.css for why
          this exists and why it is CSS-only rather than a 3rd WebGL scene. */}
      <div className="hd-meteors" aria-hidden="true">
        <span className="hd-meteor hd-meteor--1" />
        <span className="hd-meteor hd-meteor--2" />
        <span className="hd-meteor hd-meteor--3" />
        <span className="hd-meteor hd-meteor--4" />
        <span className="hd-meteor hd-meteor--5" />
      </div>
      <div className="home-dashboard-col">
        <NeuralPanel
          isAr={isAr}
          playSfx={playSfx}
          onOpenDomain={openTrainingDomain}
          onOpenPractice={openWellbeingPractice}
        />

        <ProgressCard
          isAr={isAr}
          playSfx={playSfx}
          onOpenDomain={openTrainingDomain}
          onOpenPractice={openWellbeingPractice}
          onOpenHabits={openDailyHabits}
        />

        <WorkoutCard isAr={isAr} playSfx={playSfx} onOpenWorkout={openWorkout} />

        <DomainSnapshot isAr={isAr} playSfx={playSfx} onOpenDomain={openTrainingDomain} />

        <ReadingCard bodies={bodies} isAr={isAr} playSfx={playSfx} onOpen={openChapter} />
      </div>
    </div>
  );
}
