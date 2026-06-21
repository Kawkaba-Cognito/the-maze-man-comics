import React from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';
import QuizEngine from '../_shared/QuizEngine';
import { CATEGORIES } from './data';

/*
 * Odd One Out — semantic categorization (bilingual). Tap the word that doesn't
 * belong to the category shared by the others. "Near" trials draw the odd word
 * from the same semantic group (harder). Semantic memory / category knowledge.
 */

const pickOne = (a, rng) => a[Math.floor(rng() * a.length)];
const shuffle = (a, rng) => [...a].sort(() => rng() - 0.5);

export default function OddOneOutGame({ onBack, workoutMode = false }) {
  const { currentLang, playSfx, awardPoints } = useApp();
  const isAr = currentLang === 'ar';

  const makeTrial = ({ mode, diff, level, rng = Math.random }) => {
    let k = 4;
    let nearProb = 0.3;
    if (mode === 'levels') {
      k = diff === 'hard' ? 5 : 4;
      const base = diff === 'easy' ? 0.05 : diff === 'med' ? 0.45 : 0.8;
      nearProb = Math.min(1, base + ((level || 1) / 100) * 0.18); // ramps over the 100 levels
    } else if (mode === 'passplay') { k = 4; nearProb = 0.5; }
    const near = rng() < nearProb;

    const cat = pickOne(CATEGORIES, rng);
    const members = shuffle(cat.members, rng).slice(0, k - 1);
    let oddPool = near
      ? CATEGORIES.filter((c) => c.group === cat.group && c.id !== cat.id)
      : CATEGORIES.filter((c) => c.group !== cat.group);
    if (!oddPool.length) oddPool = CATEGORIES.filter((c) => c.id !== cat.id);
    const oddCat = pickOne(oddPool, rng);
    const odd = pickOne(oddCat.members, rng);

    const opts = shuffle([
      ...members.map((m) => ({ m, correct: false })),
      { m: odd, correct: true },
    ], rng);
    return {
      prompt: { sub: isAr ? 'أيّها لا ينتمي؟' : "Which one doesn't belong?", text: '👁️' },
      options: opts.map((o, i) => ({ key: i, label: isAr ? o.m.ar : o.m.en, correct: o.correct })),
    };
  };

  return (
    <ModeShell
      storageKey="mm_lang_oddone"
      scienceId="odd-one-out"
      title={{ en: 'Odd One Out', ar: 'الشاذّ' }}
      hints={{
        free: { en: 'Endless practice — no fail', ar: 'تدريب مفتوح — بلا خسارة' },
        levels: { en: '3 difficulties · 100 levels each', ar: '٣ صعوبات · ١٠٠ مستوى لكل' },
        pass: { en: 'Same words for all · pass the device', ar: 'نفس الكلمات للجميع · مرّر الجهاز' },
      }}
      diffLabels={{ easy: { en: 'Easy', ar: 'سهل' }, med: { en: 'Medium', ar: 'متوسط' }, hard: { en: 'Hard', ar: 'صعب' } }}
      pass={{ trials: 10, scoreLabel: { en: 'correct', ar: 'صحيحة' }, lowerBetter: false, diff: 'med' }}
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      workoutMode={workoutMode}
      renderEngine={(p) => (
        <QuizEngine key={`${p.mode}-${p.diff}-${p.level}`} {...p} isAr={isAr} playSfx={playSfx} awardPoints={awardPoints} makeTrial={makeTrial} titleEn="Odd One Out" titleAr="الشاذّ" />
      )}
    />
  );
}
