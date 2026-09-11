import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import PracticeShell, { PracticeHero, INK, SUB, FAINT, LINE, CARD, SERIF } from './PracticeShell';
import SafetyNote, { PracticeCaution, SAFETY_CSS } from './SafetyNote';
import { markWellbeingPracticeDone } from './habitState';
import { loadJson, saveJson } from '../../lib/storage';

/*
 * The worksheet runtime.
 *
 * ── WHY THIS EXISTS ────────────────────────────────────────────────────────
 *
 * Wellbeing's content was eight hand-built screens. Every new practice meant a
 * new component, its own state, its own persistence, its own bilingual dict and
 * its own CSS — so the cost of adding content was roughly constant and high,
 * and the content stayed thin because of it. The owner asked for worksheets and
 * activities people actually DO, and for something that scales.
 *
 * So a worksheet is DATA. This file is the only renderer; `worksheets.js` is the
 * only place content lives. Adding one is authoring an object, not writing a
 * screen, which is what makes ten of them as cheap as one.
 *
 * ⚠ EVERY WORKSHEET DECLARES ITS EVIDENCE TIER, and the runtime prints it. The
 * clinical audit found this feature's biggest failure was claiming more than it
 * could support ("validated ECR-S" over adapted items, "8-Week MBSR" over a
 * solo timer). A schema that makes the claim a required field is how that stops
 * being a matter of whoever writes the next one remembering.
 *
 * ⚠ ANSWERS ARE PERSONAL AND STAY LOCAL. They live in `rx_worksheets_v1`,
 * plain localStorage, unencrypted — the same known limitation CLAUDE.md records
 * for the other `rx_*` stores. Anything added here inherits that, so do not put
 * a worksheet in this engine that asks something a user would be harmed by
 * someone else reading off an unlocked device.
 */

const KEY = 'rx_worksheets_v1';

/** Evidence tiers, printed verbatim so a reader can weigh the claim. */
export const TIERS = {
  meta: {
    en: 'Supported by meta-analysis',
    ar: 'مدعوم بتحليل بَعدي',
  },
  protocol: {
    en: 'Component of an established protocol',
    ar: 'مكوّن من بروتوكول علاجي معتمد',
  },
  replicated: {
    en: 'Replicated research, not a meta-analysis',
    ar: 'بحث متكرّر النتائج، لا تحليل بَعدي',
  },
  framework: {
    en: 'A useful framework, not an experimental finding',
    ar: 'إطار مفيد، لا نتيجة تجريبية',
  },
};

const loadAll = () => loadJson(KEY, {}) || {};
export const loadWorksheet = (id) => loadAll()[id] || null;
function saveWorksheet(id, patch) {
  const all = loadAll();
  all[id] = { ...(all[id] || {}), ...patch, updatedAt: Date.now() };
  saveJson(KEY, all);
  return all[id];
}
export function clearWorksheet(id) {
  const all = loadAll();
  delete all[id];
  saveJson(KEY, all);
}

const T = {
  en: {
    start: 'Start', resume: 'Continue where you left off', restart: 'Start again',
    next: 'Next', back: '‹ Back', finish: 'Finish', done: 'Saved',
    step: (n, total) => `Step ${n} of ${total}`,
    yourAnswers: 'What you wrote', empty: '—',
    lastDone: (d) => (d === 0 ? 'Completed today' : d === 1 ? 'Completed yesterday' : `Completed ${d} days ago`),
    skip: 'Skip this one',
    low: 'not at all', high: 'completely',
    ifLabel: 'When…', thenLabel: 'I will…',
    ifPh: 'the situation, time or place', thenPh: 'the one small thing you will do',
    whyPlan: 'Naming the moment and the action together is what makes a plan work — vague intentions do not survive a busy day.',
    close: 'Done',
  },
  ar: {
    start: 'ابدأ', resume: 'تابع من حيث توقّفت', restart: 'ابدأ من جديد',
    next: 'التالي', back: '‹ رجوع', finish: 'إنهاء', done: 'حُفظ',
    step: (n, total) => `الخطوة ${n} من ${total}`,
    yourAnswers: 'ما كتبته', empty: '—',
    lastDone: (d) => (d === 0 ? 'أُنجزت اليوم' : d === 1 ? 'أُنجزت أمس' : `أُنجزت قبل ${d} أيام`),
    skip: 'تخطَّ هذه',
    low: 'إطلاقاً', high: 'تماماً',
    ifLabel: 'عندما…', thenLabel: 'سوف…',
    ifPh: 'الموقف أو الوقت أو المكان', thenPh: 'الشيء الصغير الذي ستفعله',
    whyPlan: 'تسمية اللحظة والفعل معاً هو ما يجعل الخطة تنجح — فالنوايا الغامضة لا تصمد في يوم مزدحم.',
    close: 'تم',
  },
};

const daysSince = (ts) => Math.floor((Date.now() - ts) / 86400000);
const txt = (o, isAr) => (isAr ? (o?.ar ?? o?.en) : (o?.en ?? o?.ar)) || '';

/* ── step renderers ──────────────────────────────────────────────────────── */

function StepRead({ step, isAr }) {
  return (
    <div className="ws-read">
      {step.heading && <div className="ws-read-h serif">{txt(step.heading, isAr)}</div>}
      {(isAr ? step.body.ar : step.body.en).map((p, i) => <p key={i}>{p}</p>)}
    </div>
  );
}

function StepWrite({ step, value, onChange, isAr }) {
  return (
    <div className="ws-field">
      <label className="ws-label">{txt(step.label, isAr)}</label>
      {step.hint && <p className="ws-hint">{txt(step.hint, isAr)}</p>}
      <textarea
        className="ws-input"
        rows={step.rows || 4}
        maxLength={900}
        value={value || ''}
        placeholder={txt(step.placeholder, isAr)}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function StepScale({ step, value, onChange, isAr, t }) {
  return (
    <div className="ws-field">
      <label className="ws-label">{txt(step.label, isAr)}</label>
      {step.hint && <p className="ws-hint">{txt(step.hint, isAr)}</p>}
      <div className="ws-scale" dir="ltr">
        {Array.from({ length: 11 }).map((_, n) => (
          <button
            key={n}
            type="button"
            className={`ws-pip${value === n ? ' on' : ''}`}
            onClick={() => onChange(n)}
            aria-label={String(n)}
          >{n}</button>
        ))}
      </div>
      <div className="ws-scale-ends">
        <span>{txt(step.low, isAr) || t.low}</span>
        <span>{txt(step.high, isAr) || t.high}</span>
      </div>
    </div>
  );
}

function StepChoice({ step, value, onChange, isAr }) {
  return (
    <div className="ws-field">
      <label className="ws-label">{txt(step.label, isAr)}</label>
      {step.hint && <p className="ws-hint">{txt(step.hint, isAr)}</p>}
      <div className="ws-choices">
        {step.options.map((o) => (
          <button
            key={o.id}
            type="button"
            className={`ws-choice${value === o.id ? ' on' : ''}`}
            onClick={() => onChange(o.id)}
          >
            <span className="ws-choice-label">{txt(o, isAr)}</span>
            {o.note && <span className="ws-choice-note">{txt(o.note, isAr)}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ⚠ `multi` caps selections when `max` is set, and the cap is the point rather
   than a limitation: a values sort that lets you keep everything has sorted
   nothing. Tapping past the cap replaces the oldest pick instead of refusing,
   so the control never just ignores a tap. */
function StepMulti({ step, value, onChange, isAr }) {
  const picked = Array.isArray(value) ? value : [];
  const toggle = (id) => {
    if (picked.includes(id)) { onChange(picked.filter((x) => x !== id)); return; }
    const next = [...picked, id];
    onChange(step.max && next.length > step.max ? next.slice(next.length - step.max) : next);
  };
  return (
    <div className="ws-field">
      <label className="ws-label">{txt(step.label, isAr)}</label>
      {step.hint && <p className="ws-hint">{txt(step.hint, isAr)}</p>}
      {step.max && <div className="ws-count">{picked.length} / {step.max}</div>}
      <div className="ws-chips">
        {step.options.map((o) => (
          <button
            key={o.id}
            type="button"
            className={`ws-chip${picked.includes(o.id) ? ' on' : ''}`}
            onClick={() => toggle(o.id)}
          >{txt(o, isAr)}</button>
        ))}
      </div>
    </div>
  );
}

/* An implementation intention: Gollwitzer & Sheeran (2006), d ≈ .65 across 90+
   studies. The two halves are separate fields on purpose — a single free-text
   box reliably produces a wish rather than a plan. */
function StepPlan({ step, value, onChange, isAr, t }) {
  const v = value || { when: '', then: '' };
  return (
    <div className="ws-field">
      <label className="ws-label">{txt(step.label, isAr)}</label>
      <p className="ws-hint">{t.whyPlan}</p>
      <div className="ws-plan">
        <span className="ws-plan-tag">{t.ifLabel}</span>
        <input className="ws-input ws-input--line" value={v.when} placeholder={t.ifPh}
          onChange={(e) => onChange({ ...v, when: e.target.value })} maxLength={160} />
        <span className="ws-plan-tag">{t.thenLabel}</span>
        <input className="ws-input ws-input--line" value={v.then} placeholder={t.thenPh}
          onChange={(e) => onChange({ ...v, then: e.target.value })} maxLength={160} />
      </div>
    </div>
  );
}

function summarise(step, answers, isAr, t) {
  const v = answers[step.id];
  if (v == null || v === '') return t.empty;
  if (step.kind === 'scale') return String(v);
  if (step.kind === 'plan') return v.when || v.then ? `${t.ifLabel} ${v.when || t.empty} → ${t.thenLabel} ${v.then || t.empty}` : t.empty;
  if (step.kind === 'choice') return txt(step.options.find((o) => o.id === v), isAr) || t.empty;
  if (step.kind === 'multi') return (v || []).map((id) => txt(step.options.find((o) => o.id === id), isAr)).join(' · ') || t.empty;
  return String(v);
}

/* ── the runtime ─────────────────────────────────────────────────────────── */

export default function WorksheetRunner({ sheet, onBack }) {
  const { currentLang, playSfx } = useApp();
  const isAr = currentLang === 'ar';
  const t = isAr ? T.ar : T.en;

  const saved = useMemo(() => loadWorksheet(sheet.id), [sheet.id]);
  const [answers, setAnswers] = useState(() => saved?.answers || {});
  const [phase, setPhase] = useState(saved?.completedAt ? 'done' : 'intro');
  const [index, setIndex] = useState(0);

  const steps = sheet.steps;
  const step = steps[index];
  const inputSteps = steps.filter((s) => s.kind !== 'read');

  const set = (id, v) => setAnswers((a) => {
    const next = { ...a, [id]: v };
    saveWorksheet(sheet.id, { answers: next });
    return next;
  });

  const begin = (fresh) => {
    playSfx?.('click');
    if (fresh) { setAnswers({}); saveWorksheet(sheet.id, { answers: {}, completedAt: null }); }
    setIndex(0);
    setPhase('run');
  };

  const advance = () => {
    playSfx?.('click');
    if (index + 1 >= steps.length) {
      saveWorksheet(sheet.id, { answers, completedAt: Date.now() });
      markWellbeingPracticeDone(sheet.id);
      playSfx?.('collect');
      setPhase('done');
    } else setIndex(index + 1);
  };

  /* ⚠ Nothing is ever REQUIRED. A worksheet that refuses to advance until you
     have written something turns a reflective prompt into a form, and the user
     most likely to be stuck on a prompt is the one it is trying to help. */
  const render = () => {
    const v = answers[step.id];
    const on = (val) => set(step.id, val);
    switch (step.kind) {
      case 'read': return <StepRead step={step} isAr={isAr} />;
      case 'write': return <StepWrite step={step} value={v} onChange={on} isAr={isAr} />;
      case 'scale': return <StepScale step={step} value={v} onChange={on} isAr={isAr} t={t} />;
      case 'choice': return <StepChoice step={step} value={v} onChange={on} isAr={isAr} />;
      case 'multi': return <StepMulti step={step} value={v} onChange={on} isAr={isAr} />;
      case 'plan': return <StepPlan step={step} value={v} onChange={on} isAr={isAr} t={t} />;
      default: return null;
    }
  };

  const tier = TIERS[sheet.tier];
  const doneDays = saved?.completedAt ? daysSince(saved.completedAt) : null;

  return (
    <PracticeShell
      title={txt(sheet.title, isAr)}
      accent={`var(--rx-${sheet.area}-core)`}
      accentLit={`var(--rx-${sheet.area}-lit)`}
      isAr={isAr}
      onBack={onBack}
    >
      <style>{WS_CSS}</style>
      <style>{SAFETY_CSS}</style>

      {phase === 'intro' && (
        <div className="rxp-body rxp-center">
          <PracticeHero emoji={sheet.icon} />
          <p className="ws-intro">{txt(sheet.intro, isAr)}</p>
          <div className="ws-meta">{txt(sheet.meta, isAr)}</div>
          <div className="ws-tier">{txt(tier, isAr)}</div>
          <p className="ws-cite">{txt(sheet.cite, isAr)}</p>
          <button className="rxp-primary" onClick={() => begin(true)}>{t.start}</button>
          {saved?.answers && Object.keys(saved.answers).length > 0 && (
            <button className="rxp-ghost" onClick={() => begin(false)}>{t.resume}</button>
          )}
          {sheet.caution && <PracticeCaution>{txt(sheet.caution, isAr)}</PracticeCaution>}
          <SafetyNote isAr={isAr} />
        </div>
      )}

      {phase === 'run' && step && (
        <div className="rxp-body">
          <div className="ws-progress">
            <div className="ws-progress-bar"><span style={{ width: `${((index + 1) / steps.length) * 100}%` }} /></div>
            <div className="ws-progress-txt">{t.step(index + 1, steps.length)}</div>
          </div>
          {render()}
          <button className="rxp-primary" onClick={advance}>
            {index + 1 >= steps.length ? t.finish : t.next}
          </button>
          {index > 0 && (
            <button type="button" className="ws-backlink" onClick={() => { playSfx?.('click'); setIndex(index - 1); }}>{t.back}</button>
          )}
        </div>
      )}

      {phase === 'done' && (
        <div className="rxp-body">
          <div className="rxp-center">
            <PracticeHero emoji={sheet.icon} />
            <div className="ws-done serif">{t.done}</div>
            {doneDays != null && <div className="ws-doneday">{t.lastDone(doneDays)}</div>}
          </div>
          <div className="rxp-label">{t.yourAnswers}</div>
          {inputSteps.map((s) => (
            <div key={s.id} className="ws-summary">
              <div className="ws-summary-q">{txt(s.label, isAr)}</div>
              <div className="ws-summary-a">{summarise(s, answers, isAr, t)}</div>
            </div>
          ))}
          {sheet.closing && <p className="ws-closing">{txt(sheet.closing, isAr)}</p>}
          <button className="rxp-primary" onClick={() => begin(true)}>{t.restart}</button>
          <button className="rxp-ghost" onClick={onBack}>{t.close}</button>
          <SafetyNote isAr={isAr} />
        </div>
      )}
    </PracticeShell>
  );
}

const WS_CSS = `
.ws-intro { margin:0; font-size:var(--rx-fs-body); color:${SUB}; line-height:1.7; max-width:350px; text-align:center; }
.ws-meta { font-size:var(--rx-fs-label); font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:${FAINT}; }
/* ⚠ WAS var(--rx-hue-lit) — fails contrast as TEXT in light theme (see the
   note on --rx-hue-ink in wellbeing.css). This pill's fill/border keep
   -lit/-hue; only the text repoints. */
.ws-tier { font-size:11.5px; font-weight:700; padding:5px 13px; border-radius:999px;
  color:var(--rx-hue-ink); background:color-mix(in srgb, var(--rx-hue) 14%, transparent);
  border:1px solid color-mix(in srgb, var(--rx-hue) 34%, transparent); }
.ws-cite { margin:0; font-size:11.5px; color:${FAINT}; font-style:italic; line-height:1.6; text-align:center; max-width:360px; }
.ws-progress { display:flex; flex-direction:column; gap:5px; }
.ws-progress-bar { height:4px; border-radius:999px; background:color-mix(in srgb, var(--rx-ink) 12%, transparent); overflow:hidden; }
.ws-progress-bar span { display:block; height:100%; background:var(--rx-hue-lit); transition:width .3s ease; }
.ws-progress-txt { font-size:var(--rx-fs-label); font-weight:700; letter-spacing:1.2px; text-transform:uppercase; color:${FAINT}; }
.ws-read-h { font-family:${SERIF}; font-size:var(--rx-fs-title); font-weight:600; color:${INK}; margin-bottom:8px; }
.ws-read p { margin:0 0 11px; font-size:var(--rx-fs-body); color:${SUB}; line-height:1.75; }
.ws-field { display:flex; flex-direction:column; gap:8px; }
.ws-label { font-size:var(--rx-fs-lead); font-weight:600; color:${INK}; line-height:1.45; }
.ws-hint { margin:0; font-size:var(--rx-fs-small); color:${SUB}; line-height:1.6; }
.ws-input { width:100%; padding:13px 15px; border-radius:13px; border:1px solid ${LINE}; background:${CARD};
  font-family:inherit; font-size:15px; line-height:1.6; color:${INK}; resize:vertical; }
.ws-input:focus { outline:none; border-color:var(--rx-hue); }
.ws-input--line { min-height:0; }
.ws-scale { display:flex; gap:4px; }
.ws-pip { flex:1; aspect-ratio:1; min-width:0; padding:0; border-radius:9px; border:1px solid ${LINE};
  background:${CARD}; color:${SUB}; font-size:12px; font-weight:700; cursor:pointer; font-family:inherit; }
/* A TINT, NOT A SOLID FILL. A solid hue needs a contrasting label colour, and
   the only one that works across both themes is a literal, which is how a raw
   colour gets into a JSX file and fails audit:design. Tinting keeps the ink and
   matches the .ws-chip.on rule below, so the two selection states look like one
   system.
   NO BACKTICKS IN THIS BLOCK: it is inside a template literal, so a backtick
   ends the string and everything after it becomes JavaScript. That exact
   mistake shipped a broken bundle to production. */
.ws-pip.on { border-color:var(--rx-hue); background:color-mix(in srgb, var(--rx-hue) 24%, transparent); color:${INK}; font-weight:700; }
.ws-scale-ends { display:flex; justify-content:space-between; font-size:11px; color:${FAINT}; }
.ws-choices { display:flex; flex-direction:column; gap:9px; }
.ws-choice { text-align:start; padding:13px 15px; border-radius:13px; border:1px solid ${LINE}; background:${CARD};
  cursor:pointer; font-family:inherit; display:flex; flex-direction:column; gap:3px; }
.ws-choice.on { border-color:var(--rx-hue); background:color-mix(in srgb, var(--rx-hue) 13%, transparent); }
.ws-choice-label { font-size:var(--rx-fs-body); font-weight:600; color:${INK}; line-height:1.5; }
.ws-choice-note { font-size:12px; color:${SUB}; line-height:1.5; }
.ws-chips { display:flex; flex-wrap:wrap; gap:8px; }
.ws-chip { padding:9px 14px; border-radius:999px; border:1px solid ${LINE}; background:${CARD};
  color:${SUB}; font-size:13.5px; font-weight:600; cursor:pointer; font-family:inherit; }
.ws-chip.on { border-color:var(--rx-hue); background:color-mix(in srgb, var(--rx-hue) 16%, transparent); color:${INK}; }
.ws-count { font-size:11.5px; font-weight:700; color:var(--rx-hue-ink); }
.ws-plan { display:flex; flex-direction:column; gap:7px; }
.ws-plan-tag { font-size:var(--rx-fs-label); font-weight:700; letter-spacing:1.4px; text-transform:uppercase; color:var(--rx-hue-ink); }
.ws-backlink { align-self:center; background:none; border:none; color:${FAINT}; font-size:12.5px; font-weight:700;
  cursor:pointer; font-family:inherit; padding:2px; }
.ws-done { font-family:${SERIF}; font-size:var(--rx-fs-display); font-weight:600; color:${INK}; }
.ws-doneday { font-size:11.5px; font-weight:700; color:${FAINT}; }
.ws-summary { padding:11px 14px; border-radius:12px; border:1px solid ${LINE}; background:${CARD}; }
.ws-summary-q { font-size:12px; font-weight:800; color:${FAINT}; margin-bottom:4px; line-height:1.45; }
.ws-summary-a { font-size:14px; color:${INK}; line-height:1.6; white-space:pre-wrap; }
.ws-closing { margin:0; font-size:13px; color:${SUB}; line-height:1.7; padding:12px 14px; border-radius:13px;
  background:color-mix(in srgb, var(--rx-hue) 11%, transparent); }
`;
