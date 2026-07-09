import React from 'react';
import { TrainingMenuBar } from '../shared/TrainingChrome';
import { DOMAIN_PROTOCOL } from './assessmentConfig';

const STR = {
  en: {
    title: (label) => `${label} test`,
    body: 'A standardized block — same protocol every time, fresh layout each session. Do your best; results feed your Cognitive Index and daily workout difficulty.',
    start: 'Start',
    min: (n) => `~${n} min`,
  },
  ar: {
    title: (label) => `اختبار ${label}`,
    body: 'كتلة قياسية — نفس البروتوكول في كل مرة، تخطيط جديد كل جلسة. ابذل جهدك؛ النتائج تغذّي مؤشرك المعرفي وصعوبة تمرينك اليومي.',
    start: 'ابدأ',
    min: (n) => `~${n} د`,
  },
};

/** Shared "get ready" screen before each domain's standardized assessment block. */
export default function AssessmentReady({ isAr, label, step, domainId, onStart, onBack, playSfx }) {
  const t = isAr ? STR.ar : STR.en;
  const proto = domainId ? DOMAIN_PROTOCOL[domainId] : null;
  const paradigm = proto ? (isAr ? proto.paradigmAr : proto.paradigmEn) : null;
  const detail = proto ? (isAr ? proto.detailAr : proto.detailEn) : null;
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
          {paradigm ? (
            <p className="ct-fq-sub ct-fq-training-blurb" style={{ fontWeight: 700 }}>
              {paradigm}
              {proto?.durationMin ? ` · ${t.min(proto.durationMin)}` : ''}
            </p>
          ) : null}
          {detail ? <p className="ct-fq-sub ct-fq-training-blurb" style={{ opacity: 0.88 }}>{detail}</p> : null}
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
