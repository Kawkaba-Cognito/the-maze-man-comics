import React, { Suspense } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';
import { lazyWithRetry } from '../../../../../../lib/lazyWithRetry';

// The full investigation engine stays lazy so it only loads when Detective opens.
const NoirEngine = lazyWithRetry(() => import('./noir/NoirEngine'), 'detective-noir');

/*
 * Detective Kawkab.
 *
 * Every mode now shares one premium loop: search the scene, break each lie
 * with evidence, then reconstruct who, how, why and the decisive proof.
 * Levels are authored assignments, Survival adapts upward, and Pass n Play
 * gives every player the same seeded case sequence.
 */

export default function DetectiveGame({ onBack, workoutMode = false }) {
  const { currentLang, playSfx, awardPoints, awardFreeRun } = useApp();
  const isAr = currentLang === 'ar';
  return (
    <ModeShell
      storageKey="mm_reason_detective"
      scienceId="detective"
      levelCount={6}
      title={{ en: 'Detective', ar: 'المحقّق' }}
      hints={{
        free: {
          en: 'Search the scene · break every lie with the right evidence · pin down who, how, why and the proof',
          ar: 'فتّش المسرح · اكشف كلّ كذبة بالدليل الصحيح · ثبّت من وكيف ولماذا والإثبات',
        },
        levels: {
          en: '18 authored assignments · tighter error budgets · master every warrant',
          ar: '١٨ مهمّة مصمّمة · هامش أخطاء أضيق · أتقن كلّ مذكّرة',
        },
        pass: {
          en: 'Same case sequence for all · accuracy and speed earn case points',
          ar: 'نفس تسلسل القضايا للجميع · الدقّة والسرعة تكسبان نقاط القضايا',
        },
      }}
      diffLabels={{ easy: { en: 'Easy', ar: 'سهل' }, med: { en: 'Medium', ar: 'متوسط' }, hard: { en: 'Hard', ar: 'صعب' } }}
      pass={{ trials: 2, scoreLabel: { en: 'case points', ar: 'نقاط القضايا' }, lowerBetter: false, diff: 'med' }}
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      workoutMode={workoutMode}
      renderEngine={(p) => (
        <Suspense fallback={<div style={FALLBACK} />}>
          <NoirEngine
            key={`noir-${p.mode}-${p.diff}-${p.level}-${p.seed}`}
            {...p}
            isAr={isAr}
            playSfx={playSfx}
            awardPoints={awardPoints}
            awardFreeRun={awardFreeRun}
          />
        </Suspense>
      )}
    />
  );
}

const FALLBACK = {
  position: 'fixed',
  inset: 0,
  zIndex: 50,
  backgroundColor: 'var(--play-surface-deep-flat)',
  backgroundImage: 'var(--play-surface-deep)',
};
