import React from 'react';
import { TrainingScreenShell } from '../shared/TrainingScreens';

/*
 * The Assessment placeholder.
 *
 * ⚠ WHY THE REAL FLOW IS SWITCHED OFF (2026-08-18)
 *
 * `AssessmentFlow.jsx` and its norms, references and scoring are a DEMO — the
 * battery and its content are both unfinished. The problem is that it does not
 * LOOK unfinished: it renders percentiles, standard scores, a "Cognitive Index"
 * and academic citations, with nothing on screen marking any of it provisional.
 * Handing a real person a cognitive percentile from an instrument that is not
 * finished is a scientific-claims problem, not a polish problem — so the entry
 * point renders this instead.
 *
 * ⚠ NOTHING WAS DELETED. `AssessmentFlow.jsx` and every data file beside it are
 * untouched on disk, and no saved user data is cleared. Restoring the real
 * battery is ONE line in ComicsScreen.jsx — swap this import back. Do that only
 * once the content is finished and the scoring has been checked against the
 * norms it claims to use.
 *
 * ⚠ Switching this off also removed the Assessment's claim on two games that are
 * absent from the training hub, `nback` and `spatial-stroop`. Do NOT take that
 * as permission to delete them: the Daily Workout still schedules
 * `spatial-stroop` and `memo-span` by weight, and the Assessment will need its
 * paradigms back. `npm run audit:gamekeys` now fails the build if any of them
 * stops resolving.
 */

const UI = {
  en: {
    title: 'Assessment',
    badge: 'Coming soon',
    lead: 'A proper cognitive assessment is being built.',
    body: 'It will measure each of the six domains against age-matched norms and '
      + 'track how your profile changes over time. It is not ready yet, and a '
      + 'half-finished measurement is worse than none — so it stays closed until '
      + 'the numbers it reports can be trusted.',
    meanwhile: 'In the meantime, every game already tracks your own progress.',
    back: 'Back to training',
  },
  ar: {
    title: 'التقييم',
    badge: 'قريباً',
    lead: 'يجري بناء تقييم معرفي حقيقي.',
    body: 'سيقيس كلاً من المجالات الستة مقارنةً بمعايير العمر، ويتتبّع كيف يتغيّر '
      + 'ملفك مع الوقت. لم يجهز بعد، والقياس الناقص أسوأ من غيابه — لذلك يبقى '
      + 'مغلقاً حتى تصبح أرقامه جديرة بالثقة.',
    meanwhile: 'في هذه الأثناء، كل لعبة تتابع تقدّمك بالفعل.',
    back: 'العودة إلى التدريب',
  },
};

export default function AssessmentComingSoon({ onBack, isAr = false, playSfx }) {
  const t = isAr ? UI.ar : UI.en;

  return (
    <TrainingScreenShell
      hub={false}
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      title={t.title}
    >
      <div className="ct-soon">
        <span className="ct-soon-badge">{t.badge}</span>
        <h2 className="ct-soon-lead">{t.lead}</h2>
        <p className="ct-soon-body">{t.body}</p>
        <p className="ct-soon-note">{t.meanwhile}</p>
        <button
          type="button"
          className="ct-training-btn ct-training-btn--pri"
          onClick={() => { playSfx?.('click'); onBack?.(); }}
        >
          {t.back}
        </button>
      </div>
    </TrainingScreenShell>
  );
}
