import React, { useState } from 'react';
import { INK, SUB, FAINT, LINE, CARD } from './PracticeShell';

/*
 * The safety layer for Wellbeing.
 *
 * ── WHY (2026-09-07) ───────────────────────────────────────────────────────
 *
 * This feature asks people about fear of abandonment, whether the people close
 * to them will leave, and whether their life has purpose — and it sells one
 * practice explicitly for "acute anxiety". Before this file, the entire crisis
 * provision in `src/features/relax` was ONE sentence buried in the MBSR tracker
 * Guide tab. The landing had none. Neither quiz had one. Grounding had none.
 *
 * So a person could answer twelve items about being left, be shown a quadrant
 * labelled Fearful-Avoidant, read that it traces to a caregiver who was also a
 * source of fear, and arrive at a "Retake the quiz" button with nothing else on
 * offer. That is precisely the moment a route to help belongs on screen.
 *
 * ⚠ NO PHONE NUMBER IS HARD-CODED, AND THAT IS DELIBERATE. This app ships EN/AR
 * to several countries; a US three-digit line is wrong — and worse than absent,
 * because it looks like provision while sending someone nowhere. The directory
 * linked below resolves by country. The one instruction that IS universal is
 * "your local emergency number", so that is the one given as an instruction.
 *
 * ⚠ AND THE TRIGGER IS QUIET ON PURPOSE. A red alarm on a breathing exercise
 * pathologises an ordinary user and gets tuned out by the person who needs it.
 * It reads as a calm, permanent piece of the furniture, always in the same
 * place, so it is findable when it matters rather than startling when it does
 * not.
 */

const HELPLINE_URL = 'https://findahelpline.com';

const T = {
  en: {
    trigger: 'Need support right now?',
    title: 'If things feel like too much',
    urgent: 'If you are in danger, or you might act on thoughts of hurting yourself, contact your local emergency number now.',
    talk: 'To talk to someone: Find a Helpline lists free, confidential helplines in most countries.',
    link: 'findahelpline.com',
    limit: 'This app cannot provide crisis support, and nothing in it replaces a doctor or therapist. The practices here are for everyday stress.',
    close: 'Close',
  },
  ar: {
    trigger: 'تحتاج دعماً الآن؟',
    title: 'إذا شعرت أن الأمر أكبر من احتمالك',
    urgent: 'إذا كنت في خطر، أو قد تُقدم على إيذاء نفسك، اتصل برقم الطوارئ المحلي فوراً.',
    talk: 'للتحدّث مع شخص: موقع Find a Helpline يضمّ خطوط دعم مجانية وسرّية في معظم الدول.',
    link: 'findahelpline.com',
    limit: 'هذا التطبيق لا يقدّم دعماً في الأزمات، ولا شيء فيه يغني عن طبيب أو معالج نفسي. الممارسات هنا مخصّصة لضغوط الحياة اليومية.',
    close: 'إغلاق',
  },
};

/**
 * The standing crisis route. Place it at the foot of the Wellbeing landing and
 * at the end of anything that asks a person about their inner life — both
 * quizzes, and the MBSR guide.
 */
export default function SafetyNote({ isAr }) {
  const [open, setOpen] = useState(false);
  const t = isAr ? T.ar : T.en;
  return (
    <div className="rx-safety">
      <button type="button" className="rx-safety-trigger" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        ♡ {t.trigger}
      </button>
      {open && (
        <div className="rx-safety-panel" role="note">
          <div className="rx-safety-title">{t.title}</div>
          <p className="rx-safety-urgent">{t.urgent}</p>
          <p>
            {t.talk}{' '}
            {/* rel is not optional: target=_blank without noopener hands the
                opened page a live `window.opener` reference back into the app. */}
            <a href={HELPLINE_URL} target="_blank" rel="noopener noreferrer">{t.link}</a>
          </p>
          <p className="rx-safety-limit">{t.limit}</p>
          <button type="button" className="rx-safety-close" onClick={() => setOpen(false)}>{t.close}</button>
        </div>
      )}
    </div>
  );
}

/**
 * An inline caution for a practice that has real contraindications.
 *
 * ⚠ Breathing and progressive muscle relaxation are not inert. Paced breathing
 * with breath-holds can reproduce the exact interoceptive symptoms a panicking
 * person is already frightened of, and tensing muscle groups is a bad idea over
 * an injury. Both practices previously shipped with nothing but "not medical
 * treatment", which says who is not responsible rather than what to watch for.
 */
export function PracticeCaution({ children }) {
  if (!children) return null;
  return <p className="rx-caution">⚠ {children}</p>;
}

export const SAFETY_CSS = `
.rx-safety { width:100%; display:flex; flex-direction:column; align-items:center; gap:8px; margin-top:4px; }
.rx-safety-trigger { background:none; border:none; color:${SUB}; font-size:12.5px; font-weight:700; cursor:pointer;
  font-family:inherit; padding:6px 10px; border-radius:9px; text-decoration:underline; text-underline-offset:3px; }
.rx-safety-trigger:hover { color:${INK}; }
.rx-safety-panel { width:100%; max-width:380px; padding:14px 16px; border-radius:14px; border:1px solid ${LINE};
  background:${CARD}; box-shadow:var(--elev-rest); text-align:start; }
.rx-safety-title { font-size:13.5px; font-weight:800; color:${INK}; margin-bottom:7px; }
.rx-safety-panel p { margin:0 0 8px; font-size:12.5px; color:${SUB}; line-height:1.6; }
.rx-safety-urgent { font-weight:700; color:${INK} !important; }
.rx-safety-panel a { color:var(--rx-accent); font-weight:800; }
.rx-safety-limit { color:${FAINT} !important; }
.rx-safety-close { background:none; border:1px solid ${LINE}; border-radius:9px; padding:6px 14px;
  color:${SUB}; font-size:12px; font-weight:700; cursor:pointer; font-family:inherit; }
.rx-caution { font-size:12px; color:${FAINT}; line-height:1.6; text-align:center; max-width:360px; margin:0 auto; }
`;
