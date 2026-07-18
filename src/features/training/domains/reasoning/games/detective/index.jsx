import React, { Suspense, useState } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';
import CaseFileEngine from './CaseFileEngine';
import { lazyWithRetry } from '../../../../../../lib/lazyWithRetry';
import { planetIconUrl } from '../../../../../../lib/planetIcons';

const Detective3DProto = lazyWithRetry(() => import('./Detective3DProto'), 'detective-3d');

/*
 * Detective Kawkab — Investigator File (production).
 *
 *   1. Read the case file briefing
 *   2. Examine scene locations (polaroid cards)
 *   3. Read statements · confront suspects with evidence
 *   4. Accuse with proof clues (evidence + testimony)
 *   5. Verdict closing report
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
          en: 'Examine the scene · read statements · confront with evidence · accuse with proof · 3 misses out',
          ar: 'افحص المسرح · اقرأ الإفادات · واجه بالأدلة · اتّهم بالإثبات · ٣ أخطاء وتخرج',
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
        hint: isAr ? 'نفس اللعبة · بيئة كونية ثلاثية الأبعاد' : 'Same game · cosmos 3D stage',
        on: () => setView('play3d'),
        icoImg: planetIconUrl('reasoning'),
      }]}
      renderEngine={(p) => (
        <CaseFileEngine
          key={`cf-${p.mode}-${p.diff}-${p.level}-${p.seed}`}
          {...p}
          isAr={isAr}
          playSfx={playSfx}
          awardPoints={awardPoints}
          awardFreeRun={awardFreeRun}
        />
      )}
    />
  );
}
