import React, { Suspense, useState } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';
import CaseFileEngine from './CaseFileEngine';
import { lazyWithRetry } from '../../../../../../lib/lazyWithRetry';
import { planetIconUrl } from '../../../../../../lib/planetIcons';

const Detective3DProto = lazyWithRetry(() => import('./Detective3DProto'), 'detective-3d');
// Survival's noir rebuild — lazy, so three.js and the cast models only load
// for players who actually start a Survival run.
const NoirSurvival = lazyWithRetry(() => import('./noir/NoirSurvival'), 'detective-noir');

/*
 * Detective Kawkab.
 *
 * Survival runs the noir engine: search the scene, break each suspect's stated
 * lie with the one piece of evidence that contradicts it, then pin down who,
 * how, why and the proof. Suspects are the 3D cast, standing in a line-up.
 *
 * Levels and Pass n Play still run the older Case File engine over the
 * original investigation bank, pending the same treatment.
 */

export default function DetectiveGame({ onBack, workoutMode = false }) {
  const { currentLang, playSfx, awardPoints, awardFreeRun } = useApp();
  const isAr = currentLang === 'ar';
  const [view, setView] = useState('shell');
  if (view === 'play3d') {
    return (
      <Suspense fallback={<div className="c3d-root" style={{ display: 'grid', placeItems: 'center', color: '#f0e2c0', background: '#000', minHeight: '100dvh' }}>…</div>}>
        <Detective3DProto isAr={isAr} playSfx={playSfx} onBack={() => setView('shell')} />
      </Suspense>
    );
  }

  return (
    <ModeShell
      storageKey="mm_reason_detective"
      scienceId="detective"
      title={{ en: 'Detective', ar: 'المحقّق' }}
      hints={{
        free: {
          en: 'Search the scene · break every lie with the right evidence · pin down who, how, why and the proof',
          ar: 'فتّش المسرح · اكشف كلّ كذبة بالدليل الصحيح · ثبّت من وكيف ولماذا والإثبات',
        },
        levels: {
          en: 'Collect evidence · confront suspects · accuse with the right proof',
          ar: 'اجمع الأدلة · واجه المشتبهين · اتّهم بالإثبات الصحيح',
        },
        pass: {
          en: 'Same cases for all · most correct accusations wins',
          ar: 'نفس القضايا للجميع · من يصيب أكثر يفوز',
        },
      }}
      diffLabels={{ easy: { en: 'Easy', ar: 'سهل' }, med: { en: 'Medium', ar: 'متوسط' }, hard: { en: 'Hard', ar: 'صعب' } }}
      pass={{ trials: 2, scoreLabel: { en: 'correct accusations', ar: 'اتهامات صحيحة' }, lowerBetter: false, diff: 'med' }}
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      workoutMode={workoutMode}
      extraItems={[{
        k: 'proto3d',
        lb: isAr ? 'ثلاثي الأبعاد' : '3D',
        hint: isAr ? 'نموذج ثلاثي الأبعاد قابل للّعب' : 'Playable 3D prototype',
        on: () => setView('play3d'),
        icoImg: planetIconUrl('reasoning'),
      }]}
      renderEngine={(p) => (p.mode === 'free' ? (
        <Suspense fallback={<div style={FALLBACK} />}>
          <NoirSurvival
            key={`noir-${p.seed}`}
            seed={p.seed}
            isAr={isAr}
            playSfx={playSfx}
            awardPoints={awardPoints}
            awardFreeRun={awardFreeRun}
            onExit={p.onExit}
          />
        </Suspense>
      ) : (
        <CaseFileEngine
          key={`cf-${p.mode}-${p.diff}-${p.level}-${p.seed}`}
          {...p}
          isAr={isAr}
          playSfx={playSfx}
          awardPoints={awardPoints}
          awardFreeRun={awardFreeRun}
        />
      ))}
    />
  );
}

const FALLBACK = { position: 'fixed', inset: 0, zIndex: 50, background: '#0a0a0f' };
