import React from 'react';
import { TrainingMenuBar } from '../shared/TrainingChrome';

const STR = {
  en: {
    title: (label) => `${label} test`,
    body: 'A short, standardized round — same for everyone. Do your best; your score feeds your Cognitive Index.',
    start: 'Start',
  },
  ar: {
    title: (label) => `اختبار ${label}`,
    body: 'جولة قياسية قصيرة — نفسها للجميع. ابذل جهدك؛ نتيجتك تغذّي مؤشرك المعرفي.',
    start: 'ابدأ',
  },
};

/** Shared "get ready" screen shown before each domain's standardized assessment block. */
export default function AssessmentReady({ isAr, label, step, onStart, onBack, playSfx }) {
  const t = isAr ? STR.ar : STR.en;
  return (
    <div className="ct-fq-training-shell ct-fq-training-shell--hub-light" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="ct-fq-screen ct-fq-training-screen">
        <TrainingMenuBar
          onBack={onBack}
          playSfx={playSfx}
          variant="paper"
          center={
            <div style={{ textAlign: 'center' }}>
              <div className="ct-fq-training-title ct-fq-training-title-sm">{t.title(label || '')}</div>
            </div>
          }
        />
        <div className="ct-fq-diff-body">
          {step ? (
            <p className="ct-fq-sub ct-fq-training-blurb" style={{ fontWeight: 800, letterSpacing: 1 }}>{step}</p>
          ) : null}
          <p className="ct-fq-sub ct-fq-training-blurb">{t.body}</p>
          <button
            type="button"
            className="ct-fq-btn ct-fq-btn-pri"
            style={{ width: '100%', maxWidth: 320 }}
            onClick={() => { playSfx?.('click'); onStart(); }}
          >
            {t.start}
          </button>
        </div>
      </div>
    </div>
  );
}
