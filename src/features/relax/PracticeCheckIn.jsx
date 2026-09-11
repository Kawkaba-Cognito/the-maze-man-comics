import React, { useMemo, useState } from 'react';
import { INK, SUB, FAINT, LINE, CARD, SERIF } from './PracticeShell';
import { getPracticeStats, getSignatureMove, tierFor, nextTierFor } from './practiceLog';

/*
 * The before/after check-in shared by Breathe, Grounding and Muscle Relaxation.
 *
 * ⚠ THE COPY NEVER ASSERTS AN OUTCOME. Every line on the result screen is
 * derived from the two numbers the user gave. This replaced Grounding's
 * "Notice how everything slowed down a little" and PMR's "Your body is calmer
 * now" — both of which told a person how they felt, and were wrong for exactly
 * the users who most needed the tool to be trustworthy.
 *
 * ⚠ AND THE "IT GOT WORSE" BRANCH IS NOT AN ERROR PATH. Distress rising during
 * a relaxation practice is a documented, common event (relaxation-induced
 * anxiety), and it is most likely in the anxious users this feature is for. If
 * the only branch that reads as normal is the one where the number falls, then
 * the app has quietly told a struggling person they did it wrong. So that
 * branch is written first and reads warmest.
 */

/** A 0–10 tap scale. Ten pips, not a slider: a slider needs a drag, and this
 *  screen is shown to people mid-panic who are being asked for one tap. */
export function CheckInScale({ value, onChange, lowLabel, highLabel }) {
  return (
    <div className="ci-scale-wrap" dir="ltr">
      <div className="ci-scale">
        {Array.from({ length: 11 }).map((_, n) => (
          <button
            key={n}
            type="button"
            className={`ci-pip${value === n ? ' on' : ''}`}
            onClick={() => onChange(n)}
            aria-label={String(n)}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="ci-scale-labels">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}

const TEXT = {
  en: {
    beforeTitle: 'Before we start',
    beforeQ: 'How much tension or distress right now?',
    afterTitle: 'And now?',
    afterQ: 'Same question — how much tension or distress?',
    low: '0 · none', high: '10 · the most',
    skip: 'Skip this',
    cont: 'Continue',
    done: 'Done',
    was: 'Was', now: 'Now',
    // result headlines, by what the numbers did
    fell: (n) => `Down ${n} ${n === 1 ? 'point' : 'points'}.`,
    same: 'No change this time.',
    rose: (n) => `Up ${n} ${n === 1 ? 'point' : 'points'}.`,
    fellBody: 'That is the practice working — and you now have one more piece of evidence about what settles you.',
    fellBig: 'A big shift. Worth remembering which practice did it.',
    sameBody: 'That is real information, not a failed attempt. Noticing that a thing did not move is the same skill as noticing that it did.',
    roseBody: 'That happens — especially when you are already stretched, and especially with relaxation practices. Nothing went wrong. If it keeps happening with this one, try a different practice.',
    best: 'Your biggest drop yet with this practice.',
    skippedBody: 'No rating this time — the session still counts.',
    tierLabel: 'Skill',
    tierNext: (n, label) => `${n} more to reach ${label}`,
    sessionsOne: 'session', sessionsMany: 'sessions',
    signature: (name, avg) => `Across your sessions, ${name} settles you most — about ${avg} points on average.`,
    signatureLabel: 'What works for you',
  },
  ar: {
    beforeTitle: 'قبل أن نبدأ',
    beforeQ: 'ما مقدار التوتّر أو الضيق الآن؟',
    afterTitle: 'والآن؟',
    afterQ: 'السؤال نفسه — ما مقدار التوتّر أو الضيق؟',
    low: '٠ · لا شيء', high: '١٠ · الأقصى',
    skip: 'تخطّي',
    cont: 'متابعة',
    done: 'تم',
    was: 'كان', now: 'الآن',
    fell: (n) => `انخفض ${n} ${n === 1 ? 'نقطة' : 'نقاط'}.`,
    same: 'لا تغيير هذه المرة.',
    rose: (n) => `ارتفع ${n} ${n === 1 ? 'نقطة' : 'نقاط'}.`,
    fellBody: 'هذه هي الممارسة وهي تعمل — ولديك الآن دليل إضافي على ما يهدّئك فعلاً.',
    fellBig: 'تحوّل كبير. يستحق أن تتذكّر أي ممارسة فعلت ذلك.',
    sameBody: 'هذه معلومة حقيقية، لا محاولة فاشلة. ملاحظة أن شيئاً لم يتغيّر هي المهارة ذاتها التي تلاحظ بها أنه تغيّر.',
    roseBody: 'هذا يحدث — خاصة حين تكون مُنهكاً أصلاً، وخاصة مع ممارسات الاسترخاء. لم يحدث خطأ. وإن تكرّر مع هذه الممارسة، جرّب ممارسة أخرى.',
    best: 'أكبر انخفاض حقّقته حتى الآن مع هذه الممارسة.',
    skippedBody: 'بلا تقييم هذه المرة — الجلسة محتسبة على أي حال.',
    tierLabel: 'المهارة',
    tierNext: (n, label) => `${n} أخرى للوصول إلى "${label}"`,
    sessionsOne: 'جلسة', sessionsMany: 'جلسات',
    signature: (name, avg) => `عبر جلساتك، ${name} هي الأكثر تهدئة لك — بمعدل ${avg} نقاط تقريباً.`,
    signatureLabel: 'ما الذي ينفع معك',
  },
};

export const checkInText = (isAr) => (isAr ? TEXT.ar : TEXT.en);

/**
 * The "before" gate. Renders its own Begin button, so a practice wires it as a
 * phase rather than as a widget.
 *
 * ⚠ SKIP IS ALWAYS AVAILABLE AND COSTS NOTHING. This screen stands between a
 * distressed person and the tool they came for; making the rating mandatory
 * would put a form in front of a panic attack. A skipped rating is stored as
 * null and simply never enters an average (see practiceLog).
 */
export function CheckInBefore({ isAr, onDone }) {
  const t = checkInText(isAr);
  const [v, setV] = useState(null);
  return (
    <div className="ci-panel">
      <div className="ci-title serif">{t.beforeTitle}</div>
      <p className="ci-q">{t.beforeQ}</p>
      <CheckInScale value={v} onChange={setV} lowLabel={t.low} highLabel={t.high} />
      <button className="rxp-primary" disabled={v == null} onClick={() => onDone(v)}>{t.cont}</button>
      <button type="button" className="ci-skip" onClick={() => onDone(null)}>{t.skip}</button>
    </div>
  );
}

export function CheckInAfter({ isAr, onDone }) {
  const t = checkInText(isAr);
  const [v, setV] = useState(null);
  return (
    <div className="ci-panel">
      <div className="ci-title serif">{t.afterTitle}</div>
      <p className="ci-q">{t.afterQ}</p>
      <CheckInScale value={v} onChange={setV} lowLabel={t.low} highLabel={t.high} />
      <button className="rxp-primary" disabled={v == null} onClick={() => onDone(v)}>{t.done}</button>
      <button type="button" className="ci-skip" onClick={() => onDone(null)}>{t.skip}</button>
    </div>
  );
}

/**
 * The result. Shows the two numbers, an honest headline, the skill tier, and —
 * once there is enough data to mean anything — which practice works best for
 * this person.
 *
 * `practiceName` is passed in rather than looked up so this file never has to
 * know the practice registry (which lives in practices.js and would drag the
 * whole landing into a practice's chunk).
 */
export function CheckInResult({ isAr, practice, before, after, practiceNames }) {
  const t = checkInText(isAr);
  const stats = useMemo(() => getPracticeStats(practice), [practice]);
  const signature = useMemo(() => getSignatureMove(), []);
  const hasBoth = Number.isFinite(before) && Number.isFinite(after);
  const drop = hasBoth ? before - after : null;

  let headline = null;
  let body;
  if (!hasBoth) {
    body = t.skippedBody;
  } else if (drop > 0) {
    headline = t.fell(drop);
    body = drop >= 3 ? t.fellBig : t.fellBody;
  } else if (drop === 0) {
    headline = t.same;
    body = t.sameBody;
  } else {
    headline = t.rose(-drop);
    body = t.roseBody;
  }

  const isBest = hasBoth && drop > 0 && stats.bestDrop != null && drop >= stats.bestDrop && stats.ratedRuns > 1;
  const tier = tierFor(stats.runs);
  const next = nextTierFor(stats.runs);
  const sigName = signature ? (practiceNames?.[signature.practice] || signature.practice) : null;

  return (
    <div className="ci-result">
      {hasBoth && (
        <div className="ci-delta" dir="ltr">
          <span className="ci-delta-cell"><b>{before}</b><small>{t.was}</small></span>
          <span className="ci-delta-arrow" aria-hidden="true">→</span>
          <span className={`ci-delta-cell ci-delta-cell--now${drop > 0 ? ' good' : ''}`}><b>{after}</b><small>{t.now}</small></span>
        </div>
      )}
      {headline && <div className="ci-headline serif">{headline}</div>}
      <p className="ci-body">{body}</p>
      {isBest && <div className="ci-best">★ {t.best}</div>}

      <div className="ci-tier">
        <div className="ci-tier-row">
          <span className="ci-tier-label">{t.tierLabel}</span>
          <span className="ci-tier-name">{isAr ? tier.ar : tier.en}</span>
        </div>
        <div className="ci-tier-count">
          {stats.runs} {stats.runs === 1 ? t.sessionsOne : t.sessionsMany}
          {next ? ` · ${t.tierNext(next.remaining, isAr ? next.ar : next.en)}` : ''}
        </div>
      </div>

      {signature && sigName && (
        <div className="ci-signature">
          <div className="ci-signature-label">{t.signatureLabel}</div>
          <p>{t.signature(sigName, Math.round(signature.avgDrop * 10) / 10)}</p>
        </div>
      )}
    </div>
  );
}

export const CHECKIN_CSS = `
.ci-panel { display:flex; flex-direction:column; align-items:center; gap:14px; width:100%; }
.ci-title { font-family:${SERIF}; font-size:26px; font-weight:600; color:${INK}; }
.ci-q { margin:0; font-size:14.5px; color:${SUB}; line-height:1.6; text-align:center; max-width:320px; }
.ci-scale-wrap { width:100%; max-width:400px; }
.ci-scale { display:flex; gap:4px; }
.ci-pip { flex:1; aspect-ratio:1; min-width:0; border-radius:9px; border:1px solid ${LINE}; background:${CARD};
  color:${SUB}; font-weight:800; font-size:12px; cursor:pointer; font-family:inherit; padding:0;
  transition:border-color .15s, background .15s, color .15s; box-shadow:var(--elev-rest); }
.ci-pip.on { border-color:var(--rx-hue); background:var(--rx-hue); color:#fff; }
.ci-scale-labels { display:flex; justify-content:space-between; font-size:11px; color:${FAINT}; margin-top:6px; }
.ci-skip { background:none; border:none; color:${FAINT}; font-size:12.5px; font-weight:700; cursor:pointer; font-family:inherit; padding:2px; text-decoration:underline; }
.rxp-root .rxp-primary:disabled { opacity:0.45; cursor:not-allowed; box-shadow:none; }

.ci-result { display:flex; flex-direction:column; align-items:center; gap:12px; width:100%; }
.ci-delta { display:flex; align-items:center; justify-content:center; gap:16px; }
.ci-delta-cell { display:flex; flex-direction:column; align-items:center; }
.ci-delta-cell b { font-family:${SERIF}; font-size:44px; font-weight:700; line-height:1; color:${SUB}; }
.ci-delta-cell small { font-size:10px; font-weight:800; letter-spacing:1.5px; text-transform:uppercase; color:${FAINT}; margin-top:4px; }
.ci-delta-cell--now b { color:${INK}; }
.ci-delta-cell--now.good b { color:var(--rx-hue-ink); }
.ci-delta-arrow { font-size:22px; color:${FAINT}; }
.ci-headline { font-family:${SERIF}; font-size:26px; font-weight:600; color:${INK}; text-align:center; }
.ci-body { margin:0; font-size:13.5px; color:${SUB}; line-height:1.65; text-align:center; max-width:340px; }
.ci-best { font-size:12.5px; font-weight:800; color:var(--rx-meaning-lit); }
.ci-tier { width:100%; max-width:340px; padding:11px 14px; border-radius:13px; border:1px solid ${LINE}; background:${CARD}; box-shadow:var(--elev-rest); }
.ci-tier-row { display:flex; justify-content:space-between; align-items:baseline; }
.ci-tier-label { font-size:10px; font-weight:800; letter-spacing:1.5px; text-transform:uppercase; color:${FAINT}; }
.ci-tier-name { font-size:14px; font-weight:800; color:var(--rx-hue-ink); }
.ci-tier-count { font-size:11.5px; color:${SUB}; margin-top:3px; }
.ci-signature { width:100%; max-width:340px; padding:12px 14px; border-radius:13px;
  background:color-mix(in srgb, var(--rx-hue) 12%, transparent);
  border:1px solid color-mix(in srgb, var(--rx-hue) 34%, transparent); }
.ci-signature-label { font-size:10px; font-weight:800; letter-spacing:1.5px; text-transform:uppercase; color:var(--rx-hue-ink); margin-bottom:4px; }
.ci-signature p { margin:0; font-size:12.5px; color:${SUB}; line-height:1.6; }
`;
