import React, { useState } from 'react';
import {
  AUTOMATICITY_ITEMS, AUTOMATIC_THRESHOLD,
  saveAutomaticityRating, habitTitle,
} from './habitState';

/*
 * The SRBAI check — four items that MEASURE how automatic a habit has become,
 * replacing a progress bar that inferred it from a day count.
 *
 * Gardner, Abraham, Lally & de Bruijn (2012), the four-item Self-Report
 * Behavioural Automaticity Index. It is the short form of the SRHI, it is the
 * standard instrument for this specific question, and four items is the whole
 * reason it can live inside a habit row instead of behind a screen of its own.
 *
 * ⚠ WHY THIS EXISTS AT ALL: "Stable" used to mean "logged on 56 days". That is
 * a statement about attendance, not about habit — and the word a user reads is
 * a claim about their behaviour having changed. Now the app either measures it
 * or says it is estimating.
 */

const T = {
  en: {
    prompt: 'How automatic is this now?',
    lead: (name) => `${name} is something…`,
    disagree: 'Disagree', agree: 'Agree',
    save: 'Save',
    measured: (s) => `Automaticity ${s.toFixed(1)} / 7`,
    isAuto: 'Measured as automatic — it mostly runs itself now.',
    notAuto: 'Not automatic yet. That is ordinary: how long this takes varies enormously between people and between habits.',
    recheck: 'Worth re-checking — this was rated a while ago.',
    rerate: 'Re-rate',
    estimate: 'Estimated from your log so far, not measured.',
    lallyNote: 'The often-quoted "66 days" was a median in one study, with a range from 18 to 254. There is no schedule you are behind on.',
  },
  ar: {
    prompt: 'ما مدى تلقائية هذه العادة الآن؟',
    lead: (name) => `${name} هي شيء…`,
    disagree: 'أرفض', agree: 'أوافق',
    save: 'حفظ',
    measured: (s) => `التلقائية ${s.toFixed(1)} / ٧`,
    isAuto: 'مقيسة كتلقائية — صارت تجري من تلقاء نفسها غالباً.',
    notAuto: 'ليست تلقائية بعد. وهذا اعتيادي: المدة التي يستغرقها ذلك تتفاوت تفاوتاً هائلاً بين الناس وبين العادات.',
    recheck: 'يستحق إعادة القياس — فقد قُيّمت منذ فترة.',
    rerate: 'إعادة التقييم',
    estimate: 'تقدير من سجلّك حتى الآن، لا قياس.',
    lallyNote: 'رقم "٦٦ يوماً" الشائع كان وسيطاً في دراسة واحدة، بمدى يمتد من ١٨ إلى ٢٥٤ يوماً. لا يوجد جدول أنت متأخر عنه.',
  },
};

export default function AutomaticityCheck({ habit, auto, isAr, playSfx, onSaved }) {
  const t = isAr ? T.ar : T.en;
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState({});

  const complete = AUTOMATICITY_ITEMS.every((i) => answers[i.id]);
  const submit = (e) => {
    e.stopPropagation();
    if (!complete) return;
    playSfx?.('collect');
    const mean = AUTOMATICITY_ITEMS.reduce((a, i) => a + answers[i.id], 0) / AUTOMATICITY_ITEMS.length;
    onSaved(saveAutomaticityRating(habit.id, mean));
    setOpen(false);
    setAnswers({});
  };

  if (!open) {
    return (
      <div className="hb-auto-box" onClick={(e) => e.stopPropagation()} role="presentation">
        {auto.measured ? (
          <>
            <div className="hb-auto-score">{t.measured(auto.score)}</div>
            <div className="hb-auto-read">{auto.score >= AUTOMATIC_THRESHOLD ? t.isAuto : t.notAuto}</div>
            {auto.dueRecheck && <div className="hb-auto-due">{t.recheck}</div>}
            <button type="button" className="hb-auto-btn" onClick={(e) => { e.stopPropagation(); playSfx?.('click'); setOpen(true); }}>
              {t.rerate}
            </button>
          </>
        ) : (
          <>
            <div className="hb-auto-read">{t.estimate}</div>
            <div className="hb-auto-note">{t.lallyNote}</div>
            <button type="button" className="hb-auto-btn" onClick={(e) => { e.stopPropagation(); playSfx?.('click'); setOpen(true); }}>
              {t.prompt}
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="hb-auto-box" onClick={(e) => e.stopPropagation()} role="presentation">
      <div className="hb-auto-lead">{t.lead(habitTitle(habit, isAr))}</div>
      {AUTOMATICITY_ITEMS.map((item) => (
        <div key={item.id} className="hb-auto-item">
          <div className="hb-auto-q">{isAr ? item.ar : item.en}</div>
          <div className="hb-auto-scale" dir="ltr">
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <button
                key={n}
                type="button"
                className={`hb-auto-pip${answers[item.id] === n ? ' on' : ''}`}
                onClick={(e) => { e.stopPropagation(); setAnswers((a) => ({ ...a, [item.id]: n })); }}
                aria-label={String(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      ))}
      <div className="hb-auto-ends"><span>{t.disagree}</span><span>{t.agree}</span></div>
      <button type="button" className="hb-auto-btn hb-auto-btn--go" disabled={!complete} onClick={submit}>{t.save}</button>
    </div>
  );
}

/*
 * ⚠ NOT ONE COLOUR LITERAL IN HERE, AND THAT CONSTRAINT SHAPED THE DESIGN.
 *
 * This block is concatenated into DailyHabits' stylesheet, and that screen's root
 * is `.rx-root` WITHOUT `.rx-wb` — which is the class wellbeing.css scopes every
 * `--rx-*` token to. So the tokens do not resolve here, which is exactly why
 * DailyHabits still carries its own hard-coded palette plus a parallel
 * dark-theme block (the remaining debt CLAUDE.md records).
 *
 * The first version of this file worked around that with `var(--rx-x, #hex)`
 * fallbacks — and every one of those fallbacks is a raw literal, so `audit:design`
 * failed on eleven new colours. Adding them would have deepened the exact debt
 * the ratchet exists to cap.
 *
 * Everything below inherits instead: text takes its colour from `.hb-recipe`
 * (which the theme already flips both ways), and every edge and fill is derived
 * from `currentColor` via color-mix. The selected pip is a strong tint rather
 * than a solid fill, because a solid would need a contrasting label colour and
 * that would mean a literal. It themes itself for free in both appearances.
 */
export const AUTOMATICITY_CSS = `
.hb-auto-box { margin-top:10px; padding:11px 12px; border-radius:12px;
  border:1px solid color-mix(in srgb, currentColor 18%, transparent);
  background:color-mix(in srgb, currentColor 4%, transparent);
  display:flex; flex-direction:column; gap:7px; }
.hb-auto-score { font-size:13px; font-weight:800; }
.hb-auto-read { font-size:12px; line-height:1.55; opacity:0.82; }
.hb-auto-note { font-size:11px; line-height:1.5; opacity:0.66; }
.hb-auto-due { font-size:11.5px; font-weight:700; opacity:0.9; }
.hb-auto-lead { font-size:12.5px; font-weight:800; }
.hb-auto-item { display:flex; flex-direction:column; gap:4px; }
.hb-auto-q { font-size:12px; line-height:1.45; opacity:0.82; }
.hb-auto-scale { display:flex; gap:3px; }
.hb-auto-pip { flex:1; padding:6px 0; border-radius:7px;
  border:1px solid color-mix(in srgb, currentColor 20%, transparent);
  background:transparent; color:inherit; opacity:0.7;
  font-size:11px; font-weight:800; cursor:pointer; font-family:inherit; }
.hb-auto-pip.on { border-color:color-mix(in srgb, currentColor 55%, transparent);
  background:color-mix(in srgb, currentColor 20%, transparent); opacity:1; font-weight:900; }
.hb-auto-ends { display:flex; justify-content:space-between; font-size:10px; font-weight:700; opacity:0.66; }
.hb-auto-btn { align-self:flex-start; padding:7px 13px; border-radius:9px;
  border:1px solid color-mix(in srgb, currentColor 22%, transparent);
  background:transparent; color:inherit; font-size:11.5px; font-weight:800; cursor:pointer; font-family:inherit; }
.hb-auto-btn--go { border-color:color-mix(in srgb, currentColor 55%, transparent);
  background:color-mix(in srgb, currentColor 10%, transparent); }
.hb-auto-btn:disabled { opacity:0.45; cursor:not-allowed; }
`;
