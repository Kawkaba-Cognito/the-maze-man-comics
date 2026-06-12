import React, { useState, useRef, Suspense } from 'react';
import { useApp } from '../../../context/AppContext';
import { TrainingMenuBar } from '../shared/TrainingChrome';
import { getLazyGame } from '../lazyGames';
import {
  loadAssessProfile,
  saveAssessProfile,
  hasAssessProfile,
  saveAssessSession,
  loadAssessSessions,
  GENDER_OPTIONS,
  ageBand,
  domainSeries,
  deltaVsBaseline,
} from './assessmentProfile';
import {
  domainStats,
  cognitiveIndex,
  ordinal,
  ssConfInterval,
  reliableChange,
  reliabilityFor,
  NORM_DISCLAIMER,
} from './assessmentNorms';
import {
  DOMAIN_SCIENCE,
  REFERENCES,
  METHODOLOGY,
  NORM_DISCLAIMER_AR,
  VALIDITY_NOTE,
  RELIABILITY_NOTE,
} from './assessmentRefs';
import { assessAnchorLine } from './paradigmAnchors';

/** 5-level normative band → existing 3-tone colour class. */
function bandColor(b) {
  if (b === 'high' || b === 'above') return 'high';
  if (b === 'low' || b === 'below') return 'low';
  return 'mid';
}

/** Tiny sparkline from a numeric series. */
function Spark({ values, w = 280, h = 44 }) {
  if (!values || values.length < 2) return null;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || 1;
  const pts = values
    .map((c, i) => `${((i / (values.length - 1)) * w).toFixed(1)},${(h - ((c - lo) / span) * h).toFixed(1)}`)
    .join(' ');
  return (
    <svg className="ct-fq-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <polyline points={pts} fill="none" stroke="#b87220" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/* =============================================================================
 * GLOBAL ASSESSMENT FLOW  (all 6 domains)
 *
 *   intake → age + gender (age-fits scores; stored on device)
 *   choose → full assessment (all 6) or one area
 *   run    → each domain game runs ONE standardized block in `assessmentMode`
 *            and reports a 0–100 score via onAssessmentComplete
 *   report → combined Cognitive Index + per-domain bars + history trend
 * ========================================================================== */

const PARTS = [
  { id: 'attention', gameKey: 'cancel-task' },
  { id: 'speed', gameKey: 'speed-match' },
  { id: 'memory', gameKey: 'memo-span' },
  { id: 'language', gameKey: 'wordle' },
  { id: 'reasoning', gameKey: 'rush-hour' },
  { id: 'flexibility', gameKey: 'spatial-stroop' },
];

const STR = {
  en: {
    title: 'Assessment',
    intakeTitle: 'About you',
    intakeSub: 'We use your age to fit the scores to your age group. This is stored on your device only.',
    ageLabel: 'Age',
    agePlaceholder: 'e.g. 24',
    genderLabel: 'Gender',
    gender: { female: 'Female', male: 'Male', other: 'Other', na: 'Prefer not' },
    saveContinue: 'Save & continue',
    ageError: 'Enter an age between 6 and 120.',
    chooseSub: 'Run a full assessment, or test one area.',
    fullTitle: 'Full assessment',
    fullSub: 'All six areas, back to back',
    partsTitle: 'Or test one area',
    profilePrefix: 'You',
    edit: 'Edit',
    years: 'yrs',
    parts: {
      attention: 'Attention', speed: 'Speed', memory: 'Memory',
      language: 'Language', reasoning: 'Reasoning', flexibility: 'Flexibility',
    },
    loading: 'Loading…',
    resultsTitle: 'Your results',
    cognitiveIndex: 'Cognitive Index',
    indexSub: 'Standard score · mean 100',
    bandLabel: { low: 'Low', below: 'Below average', average: 'Average', above: 'Above average', high: 'High' },
    pctOfAge: (p, band) => `${ordinal(p)} percentile for your age · ${band}`,
    ciLabel: (lo, hi) => `90% CI ${lo}–${hi}`,
    ageRange: (lo, hi) => `Compared with ages ${lo}–${hi}`,
    domainCol: 'Area',
    ssLabel: 'SS',
    changeReliable: (d) => `${d > 0 ? '▲ +' + d + ' reliable gain' : '▼ ' + d + ' reliable decline'}`,
    changeNoise: (d) => `±${Math.abs(d)} vs baseline (within normal variation)`,
    progressTitle: 'Progress over time',
    baselineNote: 'Your first session is your baseline. Re-test to track reliable change.',
    relLabel: 'Reliability (test–retest r)',
    methTitle: 'Methodology & science',
    methShow: 'Show methodology & references',
    methHide: 'Hide methodology & references',
    measuresLabel: 'Measures',
    referencesLabel: 'References',
    historyBest: (n) => `Best index: ${n}`,
    again: 'Test again',
    done: 'Done',
    note: NORM_DISCLAIMER,
  },
  ar: {
    title: 'التقييم',
    intakeTitle: 'عنك',
    intakeSub: 'نستخدم عمرك لملاءمة الدرجات لفئتك العمرية. يُحفظ على جهازك فقط.',
    ageLabel: 'العمر',
    agePlaceholder: 'مثال ٢٤',
    genderLabel: 'الجنس',
    gender: { female: 'أنثى', male: 'ذكر', other: 'آخر', na: 'أفضّل عدم القول' },
    saveContinue: 'حفظ ومتابعة',
    ageError: 'أدخل عمراً بين ٦ و١٢٠.',
    chooseSub: 'شغّل تقييماً كاملاً، أو اختبر مجالاً واحداً.',
    fullTitle: 'تقييم كامل',
    fullSub: 'المجالات الستة تباعاً',
    partsTitle: 'أو اختبر مجالاً واحداً',
    profilePrefix: 'أنت',
    edit: 'تعديل',
    years: 'سنة',
    parts: {
      attention: 'الانتباه', speed: 'السرعة', memory: 'الذاكرة',
      language: 'اللغة', reasoning: 'التفكير', flexibility: 'المرونة',
    },
    loading: 'جارِ التحميل…',
    resultsTitle: 'نتائجك',
    cognitiveIndex: 'المؤشر المعرفي',
    indexSub: 'درجة معيارية · المتوسط ١٠٠',
    bandLabel: { low: 'منخفض', below: 'دون المتوسط', average: 'متوسط', above: 'فوق المتوسط', high: 'مرتفع' },
    pctOfAge: (p, band) => `المئوية ${p} لفئتك العمرية · ${band}`,
    ciLabel: (lo, hi) => `فاصل ثقة ٩٠٪ ${lo}–${hi}`,
    ageRange: (lo, hi) => `مقارنة بأعمار ${lo}–${hi}`,
    domainCol: 'المجال',
    ssLabel: 'درجة',
    changeReliable: (d) => `${d > 0 ? '▲ +' + d + ' تحسّن موثوق' : '▼ ' + d + ' تراجع موثوق'}`,
    changeNoise: (d) => `±${Math.abs(d)} عن الأساس (ضمن التغيّر الطبيعي)`,
    progressTitle: 'التقدّم عبر الزمن',
    baselineNote: 'جلستك الأولى هي خط الأساس. أعد الاختبار لتتبّع التغيّر الموثوق.',
    relLabel: 'الموثوقية (إعادة-اختبار r)',
    methTitle: 'المنهجية والعلم',
    methShow: 'عرض المنهجية والمراجع',
    methHide: 'إخفاء المنهجية والمراجع',
    measuresLabel: 'يقيس',
    referencesLabel: 'المراجع',
    historyBest: (n) => `أفضل مؤشر: ${n}`,
    again: 'أعد الاختبار',
    done: 'تم',
    note: NORM_DISCLAIMER_AR,
  },
};

function Loading({ label }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5c534c', fontFamily: "'Outfit', system-ui, sans-serif", fontSize: 14, letterSpacing: 1.5 }}>
      {label}
    </div>
  );
}

export default function AssessmentFlow({ onBack }) {
  const { currentLang, playSfx } = useApp();
  const isAr = currentLang === 'ar';
  const t = isAr ? STR.ar : STR.en;

  const [profile, setProfile] = useState(() => loadAssessProfile());
  const [step, setStep] = useState(() => (hasAssessProfile() ? 'choose' : 'intake'));
  const [ageInput, setAgeInput] = useState(() => (profile.age != null ? String(profile.age) : ''));
  const [gender, setGender] = useState(() => profile.gender);
  const [ageErr, setAgeErr] = useState(false);

  const [runQueue, setRunQueue] = useState([]);
  const [runIdx, setRunIdx] = useState(0);
  const resultsRef = useRef({});
  const [report, setReport] = useState(null); // { scores, lines, full }
  const [sessions, setSessions] = useState(() => loadAssessSessions());
  const [methOpen, setMethOpen] = useState(false);

  const saveAndContinue = () => {
    const n = Number(ageInput);
    if (!Number.isFinite(n) || n < 6 || n > 120) { setAgeErr(true); return; }
    setProfile(saveAssessProfile({ age: n, gender }));
    setAgeErr(false);
    playSfx('click');
    setStep('choose');
  };

  const startQueue = (ids) => {
    if (ids.length === 0) return;
    playSfx('click');
    resultsRef.current = {};
    setRunQueue(ids);
    setRunIdx(0);
    setStep('run');
  };

  const finalize = (ids) => {
    const scores = {};
    const lines = {};
    for (const id of ids) {
      const r = resultsRef.current[id];
      if (r) { scores[id] = r.score; lines[id] = r.line; }
    }
    const full = ids.length === PARTS.length;
    setSessions(saveAssessSession({ scores, full }));
    setReport({ scores, lines, full });
    setStep('report');
  };

  const onPartComplete = (result) => {
    const id = runQueue[runIdx];
    resultsRef.current[id] = result || { score: 0, line: '' };
    if (runIdx + 1 < runQueue.length) {
      setRunIdx(runIdx + 1);
    } else {
      finalize(runQueue);
    }
  };

  const onPartExit = () => {
    // Aborted mid-run: finalize whatever was completed, else back to chooser.
    const done = runQueue.slice(0, runIdx).filter((id) => resultsRef.current[id]);
    if (done.length > 0) finalize(done);
    else { setRunQueue([]); setRunIdx(0); setStep('choose'); }
  };

  /* ----- RUN ----- */
  if (step === 'run' && runQueue[runIdx]) {
    const part = PARTS.find((p) => p.id === runQueue[runIdx]);
    const Game = part?.gameKey ? getLazyGame(part.gameKey) : null;
    if (!Game) { onPartComplete({ score: 0, line: '' }); return null; }
    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <Suspense fallback={<Loading label={t.loading} />}>
          <Game
            key={part.id}
            assessmentMode
            assessmentLabel={t.parts[part.id]}
            assessmentStep={`${runIdx + 1}/${runQueue.length}`}
            onAssessmentComplete={onPartComplete}
            onAssessmentExit={onPartExit}
            onBack={onPartExit}
          />
        </Suspense>
      </div>
    );
  }

  /* ----- INTAKE ----- */
  if (step === 'intake') {
    return (
      <div className="ct-fq-training-shell ct-fq-training-shell--hub-light" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="ct-fq-screen ct-fq-training-screen">
          <TrainingMenuBar onBack={onBack} playSfx={playSfx} variant="paper"
            center={<div style={{ textAlign: 'center' }}><div className="ct-fq-training-title ct-fq-training-title-sm">{t.intakeTitle}</div></div>} />
          <div className="ct-fq-diff-body">
            <p className="ct-fq-sub ct-fq-training-blurb">{t.intakeSub}</p>
            <div className="ct-fq-intake">
              <label className="ct-fq-intake-label" htmlFor="assess-age">{t.ageLabel}</label>
              <input id="assess-age" className="ct-fq-intake-age" type="number" inputMode="numeric" min={6} max={120}
                placeholder={t.agePlaceholder} value={ageInput} onChange={(e) => setAgeInput(e.target.value)} />
              {ageErr && <p className="ct-fq-intake-err">{t.ageError}</p>}
              <div className="ct-fq-intake-label" style={{ marginTop: 14 }}>{t.genderLabel}</div>
              <div className="ct-fq-rr ct-fq-rr-diff" role="group" aria-label={t.genderLabel}>
                {GENDER_OPTIONS.map((g) => (
                  <button key={g} type="button"
                    className={`ct-fq-rrb ct-fq-rrb-diff${gender === g ? ' ct-fq-rrb-on ct-fq-rrb-on-training' : ''} ct-fq-rrb-training`}
                    onClick={() => { playSfx('click'); setGender(g); }}>
                    {t.gender[g]}
                  </button>
                ))}
              </div>
            </div>
            <button type="button" className="ct-fq-btn ct-fq-btn-pri" style={{ width: '100%', maxWidth: 320 }} onClick={saveAndContinue}>
              {t.saveContinue}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ----- REPORT ----- */
  if (step === 'report' && report) {
    const age = profile.age ?? null;
    const ran = PARTS.map((p) => p.id).filter((id) => report.scores[id] != null);
    const ci = cognitiveIndex(report.scores, age);
    const band = ageBand(age);
    const overallSpark = sessions.map((s) => s.overall).filter((v) => typeof v === 'number');
    const sci = isAr ? DOMAIN_SCIENCE.ar : DOMAIN_SCIENCE.en;
    return (
      <div className="ct-fq-training-shell ct-fq-training-shell--hub-light" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="ct-fq-screen ct-fq-training-screen">
          <TrainingMenuBar onBack={onBack} playSfx={playSfx} variant="paper"
            center={<div style={{ textAlign: 'center' }}><div className="ct-fq-training-title ct-fq-training-title-sm">{t.resultsTitle}</div></div>} />

          {/* Overall Cognitive Index */}
          {ci && (
            <>
              <div className={`ct-fq-sbig ct-fq-band-text-${bandColor(ci.band)}`}>{ci.index}</div>
              <div className="ct-fq-ies-lbl">{t.cognitiveIndex} · {t.indexSub}</div>
              <p className="ct-assess-overall-pct">{t.pctOfAge(ci.percentile, t.bandLabel[ci.band])}</p>
              <p className="ct-assess-ci">{t.ciLabel(ci.ciLo, ci.ciHi)}</p>
              {band && <p className="ct-assess-agerange">{t.ageRange(band.min, band.max)}</p>}
            </>
          )}

          {/* Per-domain rows */}
          <div className="ct-assess-domain-list">
            {ran.map((id) => {
              const v = report.scores[id];
              const st = domainStats(id, v, age);
              const color = bandColor(st?.band);
              const delta = deltaVsBaseline(id, sessions);
              const rc = reliableChange(delta, id);
              const ssCI = st ? ssConfInterval(st.standardScore, id) : null;
              const series = domainSeries(id, sessions).map((s) => s.score);
              return (
                <div key={id} className="ct-assess-drow">
                  <div className="ct-assess-drow-top">
                    <span className="ct-assess-domain-name">{t.parts[id]}</span>
                    <span className={`ct-assess-band-chip ct-fq-band-${color}`}>
                      {st ? t.bandLabel[st.band] : '—'}
                    </span>
                  </div>
                  <div className="ct-assess-domain-bar">
                    <span className={`ct-assess-domain-fill ct-fq-band-${color}`} style={{ width: `${st ? st.percentile : v}%` }} />
                  </div>
                  <div className="ct-assess-drow-meta">
                    <span className="ct-assess-pct">{st ? `${ordinal(st.percentile)} pct` : `${v}`}</span>
                    {st && (
                      <span className="ct-assess-ss">
                        {t.ssLabel} {st.standardScore}
                        {ssCI ? ` (${ssCI[0]}–${ssCI[1]})` : ''}
                      </span>
                    )}
                    {report.lines[id] ? <span className="ct-assess-raw">{report.lines[id]}</span> : null}
                    {rc && (
                      <span
                        className={`ct-assess-delta ct-assess-delta--${rc.reliable ? rc.direction : 'flat'}`}
                      >
                        {rc.reliable ? t.changeReliable(delta) : t.changeNoise(delta)}
                      </span>
                    )}
                  </div>
                  {(() => {
                    // Raw clinical metric vs published guideline range (Phase 4).
                    const anchor = assessAnchorLine(id, isAr, age);
                    return anchor ? (
                      <div className="ct-assess-raw" style={{ marginTop: 2 }}>{anchor}</div>
                    ) : null;
                  })()}
                  {series.length > 1 && <Spark values={series} h={28} />}
                </div>
              );
            })}
          </div>

          {/* Progress over time */}
          {overallSpark.length > 1 && (
            <div className="ct-assess-progress">
              <div className="ct-assess-section-title">{t.progressTitle}</div>
              <Spark values={overallSpark} />
            </div>
          )}
          {overallSpark.length <= 1 && <p className="ct-fq-sub ct-fq-training-blurb">{t.baselineNote}</p>}

          {/* Methodology & science (collapsible) */}
          <button
            type="button"
            className="ct-assess-meth-toggle"
            onClick={() => { playSfx('click'); setMethOpen((o) => !o); }}
          >
            {methOpen ? t.methHide : t.methShow}
          </button>
          {methOpen && (
            <div className="ct-assess-meth">
              <p className="ct-assess-meth-blurb">{isAr ? METHODOLOGY.ar : METHODOLOGY.en}</p>
              <p className="ct-assess-meth-blurb">{isAr ? RELIABILITY_NOTE.ar : RELIABILITY_NOTE.en}</p>
              <p className="ct-assess-meth-blurb">{isAr ? VALIDITY_NOTE.ar : VALIDITY_NOTE.en}</p>

              {/* Per-domain construct + reliability */}
              {ran.map((id) => (
                <div key={id} className="ct-assess-meth-domain">
                  <div className="ct-assess-meth-name">
                    {t.parts[id]}
                    <span className="ct-assess-meth-rel"> · r = {reliabilityFor(id).toFixed(2)}</span>
                  </div>
                  <p className="ct-assess-meth-measures">{sci[id]?.measures}</p>
                  <p className="ct-assess-meth-cites">{(sci[id]?.cites || []).join(' · ')}</p>
                </div>
              ))}
              <div className="ct-assess-meth-name">{t.referencesLabel}</div>
              <ul className="ct-assess-refs">
                {REFERENCES.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              <p className="ct-fq-assess-note">{t.note}</p>
            </div>
          )}

          <div className="ct-fq-row">
            <button type="button" className="ct-fq-btn ct-fq-btn-pri" onClick={() => { playSfx('click'); setReport(null); setStep('choose'); }}>{t.again}</button>
            <button type="button" className="ct-fq-btn ct-fq-btn-ghost" onClick={onBack}>{t.done}</button>
          </div>
        </div>
      </div>
    );
  }

  /* ----- CHOOSE ----- */
  const profileLine = `${t.profilePrefix} · ${profile.age} ${t.years}${profile.gender ? ` · ${t.gender[profile.gender]}` : ''}`;
  return (
    <div className="ct-fq-training-shell ct-fq-training-shell--hub-light" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="ct-fq-screen ct-fq-training-screen">
        <TrainingMenuBar onBack={onBack} playSfx={playSfx} variant="paper"
          center={<div style={{ textAlign: 'center' }}><div className="ct-fq-training-title ct-fq-training-title-sm">{t.title}</div></div>} />
        <div className="ct-fq-assess-profilebar">
          <span>{profileLine}</span>
          <button type="button" className="ct-fq-assess-edit" onClick={() => { playSfx('click'); setStep('intake'); }}>{t.edit}</button>
        </div>
        <p className="ct-fq-sub ct-fq-training-blurb">{t.chooseSub}</p>
        <button type="button" className="ct-fq-db ct-fq-db-easy ct-fq-db-training ct-fq-diffcard"
          onClick={() => startQueue(PARTS.map((p) => p.id))}>
          <span className="ct-fq-diffcard-main">
            <span className="ct-fq-diffcard-label">📋 {t.fullTitle}</span>
            <span className="ct-fq-diffcard-desc">{t.fullSub}</span>
          </span>
          <span className="ct-fq-diffcard-meta"><span className="ct-fq-diffcard-grid">{PARTS.length}</span></span>
        </button>
        <p className="ct-fq-sub ct-fq-training-blurb" style={{ marginTop: 6, fontWeight: 700 }}>{t.partsTitle}</p>
        <div className="ct-fq-assess-parts">
          {PARTS.map((p) => (
            <button key={p.id} type="button" className="ct-fq-assess-part" onClick={() => startQueue([p.id])}>
              <span className="ct-fq-assess-part-name">{t.parts[p.id]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
