import React from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';
import QuizEngine from '../_shared/QuizEngine';
import { ENTRIES } from './data';

/*
 * Synonyms & Antonyms — vocabulary / lexical-semantic access (bilingual).
 * A target word is shown; tap its synonym (or, in antonym rounds, its opposite)
 * among options. Difficulty scales by word rarity (tier) + distractor count.
 */

const pickOne = (a, rng) => a[Math.floor(rng() * a.length)];
const shuffle = (a, rng) => [...a].sort(() => rng() - 0.5);

export default function SynonymsGame({ onBack, workoutMode = false }) {
  const { currentLang, playSfx, awardPoints } = useApp();
  const isAr = currentLang === 'ar';
  const lang = isAr ? 'ar' : 'en';

  const makeTrial = ({ mode, diff, trialNum, rng = Math.random }) => {
    const tier = mode === 'levels'
      ? (diff === 'easy' ? 'easy' : diff === 'hard' ? 'hard' : 'med')
      : mode === 'passplay' ? 'med'
        : (trialNum < 6 ? 'easy' : trialNum < 14 ? 'med' : 'hard');
    const pool = ENTRIES.filter((e) => e.tier === tier);
    const entry = pickOne(pool.length ? pool : ENTRIES, rng);
    const useAnt = rng() < 0.5;
    const w = entry[lang];
    const answer = useAnt ? w.a : w.s;
    const optCount = tier === 'easy' ? 3 : 4;

    const distractors = [];
    const others = shuffle(ENTRIES.filter((e) => e !== entry), rng);
    for (const e of others) {
      if (distractors.length >= optCount - 1) break;
      const cand = e[lang].w;
      if (cand !== answer && !distractors.includes(cand)) distractors.push(cand);
    }
    const opts = shuffle([{ label: answer, correct: true }, ...distractors.map((d) => ({ label: d, correct: false }))], rng);
    return {
      prompt: { sub: useAnt ? (isAr ? 'الضدّ' : 'Opposite of') : (isAr ? 'المرادف' : 'Synonym of'), text: w.w },
      options: opts.map((o, i) => ({ key: i, label: o.label, correct: o.correct })),
    };
  };

  return (
    <ModeShell
      storageKey="mm_lang_syn"
      scienceId="synonyms"
      title={{ en: 'Synonyms & Antonyms', ar: 'المرادفات والأضداد' }}
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
        <QuizEngine key={`${p.mode}-${p.diff}-${p.level}`} {...p} isAr={isAr} playSfx={playSfx} awardPoints={awardPoints} makeTrial={makeTrial} titleEn="Synonyms & Antonyms" titleAr="المرادفات والأضداد" />
      )}
    />
  );
}
