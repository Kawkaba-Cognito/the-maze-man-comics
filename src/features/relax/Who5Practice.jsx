import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import PracticeShell, { PracticeHero, INK, SUB, FAINT, LINE, CARD, SERIF } from './PracticeShell';
import { QUIZ_CSS, KawkabSay } from './quizShared';
import SafetyNote, { SAFETY_CSS } from './SafetyNote';
import { markWellbeingPracticeDone } from './habitState';
import { loadJson, saveJson } from '../../lib/storage';

/*
 * The WHO-5 Well-Being Index — the one validated OUTCOME measure in Wellbeing.
 *
 * ── WHY IT EXISTS (2026-09-07) ─────────────────────────────────────────────
 *
 * Before this, nothing in the feature measured whether any of it was working.
 * Practices tracked their own before/after (practiceLog), habits tracked
 * completion, and the Wheel of Life produced a single averaged number that means
 * nothing. There was no way for a user — or the app — to answer "am I actually
 * doing better than a month ago?"
 *
 * WHO-5 is the right instrument for that job and an unusually good fit here: five
 * items, thirty seconds, free to use, translated into dozens of languages
 * including Arabic, and validated as both a wellbeing measure and a screening
 * tool across a very wide range of populations and settings.
 *
 * ⚠ IT IS SCORED AND PRESENTED AS A WELLBEING SCORE, NOT AS A DEPRESSION SCREEN,
 * AND THAT LINE IS DELIBERATE. The published cut-off (<50) is real and is used
 * here — but it triggers an INVITATION to talk to someone, never a label, never
 * a probability, never the word "depression" applied to the user. This app has
 * already parked its cognitive Assessment behind "coming soon" precisely because
 * handing a real person a clinical-looking verdict from a screen is a scientific-
 * claims problem, not a polish one. The same discipline applies here, and it is
 * why this ships while the Assessment does not: WHO-5 is finished, validated and
 * published, and it is used for exactly the one thing it is validated to do.
 *
 * ⚠ THE 14-DAY WINDOW IS ENFORCED, NOT DECORATIVE. Every item asks about "the
 * last two weeks", so two check-ins three days apart measure overlapping windows
 * and the difference between them is noise. Re-taking is gated to 7 days (half a
 * window) with the reason stated. That gate is also the single thing standing
 * between this and score-chasing: a wellbeing number you can re-roll on demand
 * stops being a measurement and becomes a slot machine — the same failure the
 * practice check-in avoids by never rewarding a low number.
 */

const ACCENT = 'var(--rx-calm-core)';
const ACCENT_LIT = 'var(--rx-calm-lit)';
const KEY = 'rx_who5_v1';
const RETAKE_DAYS = 7;
const MAX_HISTORY = 60;

/* The five WHO-5 items, in their published order. */
const ITEMS = [
  { id: 1, en: 'I have felt cheerful and in good spirits', ar: 'شعرتُ بالبهجة وبمزاج جيد' },
  { id: 2, en: 'I have felt calm and relaxed', ar: 'شعرتُ بالهدوء والاسترخاء' },
  { id: 3, en: 'I have felt active and vigorous', ar: 'شعرتُ بالنشاط والحيوية' },
  { id: 4, en: 'I woke up feeling fresh and rested', ar: 'استيقظتُ وأنا أشعر بالانتعاش والراحة' },
  { id: 5, en: 'My daily life has been filled with things that interest me', ar: 'كانت حياتي اليومية مليئة بأمور تهمّني' },
];

/* The published 0–5 frequency scale. Presented highest-first so the most
   positive answer is the first thing read, which is how the paper form runs. */
const OPTIONS = [
  { v: 5, en: 'All of the time', ar: 'طوال الوقت' },
  { v: 4, en: 'Most of the time', ar: 'معظم الوقت' },
  { v: 3, en: 'More than half of the time', ar: 'أكثر من نصف الوقت' },
  { v: 2, en: 'Less than half of the time', ar: 'أقل من نصف الوقت' },
  { v: 1, en: 'Some of the time', ar: 'بعض الوقت' },
  { v: 0, en: 'At no time', ar: 'في أي وقت' },
];

const load = () => {
  const v = loadJson(KEY, null);
  return v && Array.isArray(v.entries) ? v : { entries: [] };
};
const save = (entries) => saveJson(KEY, { entries: entries.slice(-MAX_HISTORY) });

const daysSince = (ts) => Math.floor((Date.now() - ts) / 86400000);

/** Raw 0–25 → the published 0–100 percentage-of-maximum score. */
const toScore = (answers) => Object.values(answers).reduce((a, b) => a + b, 0) * 4;

/*
 * ⚠ THE BANDS DELIBERATELY DO NOT NAME A DISORDER. <50 is the published point at
 * which a clinician would ask more questions; <29 is the point the literature
 * treats as more strongly indicative. Both are rendered as prompts to talk to
 * someone, and the low band additionally surfaces the crisis route.
 */
function bandFor(score) {
  if (score >= 70) return 'good';
  if (score >= 50) return 'ok';
  if (score >= 29) return 'low';
  return 'verylow';
}

const T = {
  en: {
    title: 'Wellbeing Check-in',
    meta: '5 questions · about 30 seconds',
    cite: 'The WHO-5 Well-Being Index (World Health Organization, 1998). A systematic review covering more than 200 studies found it valid both as a wellbeing measure and as a screening tool, across a very wide range of populations and languages (Topp et al., 2015). Free to use.',
    kawkab: "Hi, I'm Kawkab! Five questions about the last two weeks. This is the one thing here that tells you whether anything is actually changing over time — so answer for how it has really been, not how today feels.",
    prompt: 'Over the last two weeks…',
    start: 'Start the check-in',
    retake: 'Check in again',
    resultTitle: 'Your wellbeing score',
    outOf: 'out of 100',
    trend: 'Your last few check-ins',
    changeUp: (n) => `Up ${n} points since last time.`,
    changeDown: (n) => `Down ${n} points since last time.`,
    changeSame: 'The same as last time.',
    meaningful: 'A change of about 10 points is the point at which researchers treat a shift as meaningful rather than noise.',
    bandGood: 'This is in the range usually described as good wellbeing. Worth noticing what is currently working — that is the thing to protect when life gets busier.',
    bandOk: 'This is in the ordinary range. Not a problem to fix, but there is room, and the practices here are aimed at exactly this space.',
    bandLow: 'This sits below the level usually described as good wellbeing. That is not a diagnosis and it is not a verdict on you — it is a prompt. If it is still here in two weeks, it is worth saying so to a doctor or a therapist.',
    bandVeryLow: 'This is low. Please read that as information rather than as a judgement — a score like this is common and it is treatable, and it is the clearest possible sign that this is worth talking to a professional about rather than handling alone.',
    lockedTitle: 'Come back in a few days',
    lockedBody: (d) => `Every question asks about "the last two weeks", so two check-ins close together are measuring almost the same fortnight — the difference between them would be noise, not change. You can check in again in ${d} ${d === 1 ? 'day' : 'days'}.`,
    lastTaken: (d) => (d === 0 ? 'Taken today' : d === 1 ? 'Taken yesterday' : `Taken ${d} days ago`),
    viewLast: 'See my last result',
    back: 'Back',
    disclaimer: 'A wellbeing measure, not a diagnosis. It cannot tell you whether you have any condition — only a professional can do that.',
  },
  ar: {
    title: 'قياس العافية',
    meta: '٥ أسئلة · حوالي ٣٠ ثانية',
    cite: 'مؤشّر منظمة الصحة العالمية للعافية WHO-5 (منظمة الصحة العالمية، ١٩٩٨). وجدت مراجعة منهجية شملت أكثر من ٢٠٠ دراسة أنه صالح كمقياس للعافية وكأداة فحص أوّلي، عبر طيف واسع جداً من الفئات واللغات (Topp et al., 2015). ومتاح للاستخدام مجاناً.',
    kawkab: 'مرحباً، أنا كوكب! خمسة أسئلة عن الأسبوعين الماضيين. هذا هو الشيء الوحيد هنا الذي يخبرك إن كان شيء يتغيّر فعلاً مع الوقت — فأجب بحسب ما كانت عليه الأمور حقاً، لا بحسب شعور اليوم.',
    prompt: 'خلال الأسبوعين الماضيين…',
    start: 'ابدأ القياس',
    retake: 'قياس جديد',
    resultTitle: 'درجة عافيتك',
    outOf: 'من ١٠٠',
    trend: 'قياساتك الأخيرة',
    changeUp: (n) => `ارتفعت ${n} نقطة عن المرة الماضية.`,
    changeDown: (n) => `انخفضت ${n} نقطة عن المرة الماضية.`,
    changeSame: 'كما كانت في المرة الماضية.',
    meaningful: 'تغيّر بنحو ١٠ نقاط هو الحدّ الذي يعتبره الباحثون تغيّراً ذا معنى لا مجرّد تذبذب.',
    bandGood: 'هذه ضمن النطاق الذي يُوصف عادةً بالعافية الجيدة. يستحق أن تلاحظ ما الذي ينفع معك الآن — فهذا ما ينبغي حمايته حين تزدحم الحياة.',
    bandOk: 'هذه ضمن النطاق المعتاد. ليست مشكلة تحتاج إصلاحاً، لكن هناك متّسع، والممارسات هنا موجّهة لهذه المساحة تحديداً.',
    bandLow: 'هذه أقل من المستوى الذي يُوصف عادةً بالعافية الجيدة. ليست تشخيصاً ولا حكماً عليك — بل تنبيه. وإن بقيت كذلك بعد أسبوعين، فمن المفيد أن تذكر ذلك لطبيب أو معالج نفسي.',
    bandVeryLow: 'هذه درجة منخفضة. اقرأها كمعلومة لا كحكم — فدرجة كهذه شائعة وقابلة للعلاج، وهي أوضح إشارة ممكنة إلى أن الأمر يستحق الحديث مع مختصّ بدلاً من مواجهته وحدك.',
    lockedTitle: 'عُد بعد أيام قليلة',
    lockedBody: (d) => `كل سؤال يسأل عن "الأسبوعين الماضيين"، لذا فالقياسان المتقاربان يقيسان الفترة نفسها تقريباً — والفرق بينهما تذبذب لا تغيّر. يمكنك القياس مجدداً بعد ${d} ${d === 1 ? 'يوم' : 'أيام'}.`,
    lastTaken: (d) => (d === 0 ? 'تم اليوم' : d === 1 ? 'تم أمس' : `تم قبل ${d} أيام`),
    viewLast: 'عرض نتيجتي الأخيرة',
    back: 'رجوع',
    disclaimer: 'مقياس للعافية، وليس تشخيصاً. لا يمكنه إخبارك إن كنت مصاباً بأي حالة — المختصّ وحده يستطيع ذلك.',
  },
};

/** A bare sparkline of past scores — the whole point of taking this repeatedly. */
function Trend({ entries }) {
  if (entries.length < 2) return null;
  const pts = entries.slice(-8);
  const w = 260;
  const h = 60;
  const step = pts.length > 1 ? w / (pts.length - 1) : 0;
  const y = (s) => h - (s / 100) * h;
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${y(p.score).toFixed(1)}`).join(' ');
  return (
    <svg className="w5-trend" viewBox={`0 -6 ${w} ${h + 12}`} role="img" aria-hidden="true">
      <line x1="0" y1={y(50)} x2={w} y2={y(50)} className="w5-trend-cut" />
      <path d={d} className="w5-trend-line" />
      {pts.map((p, i) => (
        <circle key={p.at} cx={i * step} cy={y(p.score)} r={i === pts.length - 1 ? 4.5 : 3} className={`w5-trend-dot${i === pts.length - 1 ? ' last' : ''}`} />
      ))}
    </svg>
  );
}

export default function Who5Practice({ onBack }) {
  const { currentLang, playSfx } = useApp();
  const isAr = currentLang === 'ar';
  const t = isAr ? T.ar : T.en;

  const [store, setStore] = useState(() => load());
  const last = store.entries[store.entries.length - 1] || null;
  const sinceLast = last ? daysSince(last.at) : null;
  const locked = last != null && sinceLast < RETAKE_DAYS;

  const [phase, setPhase] = useState(last ? 'result' : 'intro'); // intro | quiz | result
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [justScored, setJustScored] = useState(null);

  const shown = justScored ?? last;
  const prev = justScored
    ? store.entries[store.entries.length - 2] || null
    : store.entries[store.entries.length - 2] || null;

  const start = () => {
    playSfx?.('click');
    setAnswers({}); setIndex(0); setJustScored(null); setPhase('quiz');
  };

  const answer = (v) => {
    playSfx?.('click');
    const next = { ...answers, [ITEMS[index].id]: v };
    setAnswers(next);
    setTimeout(() => {
      if (index + 1 >= ITEMS.length) {
        const entry = { at: Date.now(), score: toScore(next) };
        const entries = [...store.entries, entry];
        save(entries);
        setStore({ entries });
        setJustScored(entry);
        markWellbeingPracticeDone('who5');
        playSfx?.('collect');
        setPhase('result');
      } else {
        setIndex(index + 1);
      }
    }, 160);
  };

  const band = shown ? bandFor(shown.score) : null;
  const bandCopy = { good: t.bandGood, ok: t.bandOk, low: t.bandLow, verylow: t.bandVeryLow }[band];
  const delta = shown && prev ? shown.score - prev.score : null;

  return (
    <PracticeShell title={t.title} accent={ACCENT} accentLit={ACCENT_LIT} isAr={isAr} onBack={onBack}>
      <style>{QUIZ_CSS}</style>
      <style>{SAFETY_CSS}</style>
      <style>{CSS}</style>

      {phase === 'intro' && (
        <div className="rxp-body rxp-center" style={{ '--rx-hue': ACCENT, '--rx-hue-lit': ACCENT_LIT }}>
          <PracticeHero emoji="📊" />
          <KawkabSay>{t.kawkab}</KawkabSay>
          <div className="qz-intro-meta">{t.meta}</div>
          <p className="qz-cite">{t.cite}</p>
          <button className="rxp-primary" onClick={start}>{t.start}</button>
          <p className="qz-disclaimer">{t.disclaimer}</p>
        </div>
      )}

      {phase === 'quiz' && (
        <div className="rxp-body" style={{ '--rx-hue': ACCENT, '--rx-hue-lit': ACCENT_LIT }}>
          <div className="qz-progress" dir="ltr">{index + 1} / {ITEMS.length}</div>
          <div className="w5-window">{t.prompt}</div>
          <div className="qz-item-text">{isAr ? ITEMS[index].ar : ITEMS[index].en}</div>
          <div className="qz-choice-list">
            {OPTIONS.map((o) => (
              <button key={o.v} type="button" className="qz-choice" onClick={() => answer(o.v)}>
                {isAr ? o.ar : o.en}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'result' && shown && (
        <div className="rxp-body rxp-center" style={{ '--rx-hue': ACCENT, '--rx-hue-lit': ACCENT_LIT }}>
          <div className="rxp-label">{t.resultTitle}</div>
          <div className={`w5-score w5-score--${band}`}>{shown.score}<small>{t.outOf}</small></div>
          {sinceLast != null && !justScored && <div className="w5-taken">{t.lastTaken(sinceLast)}</div>}

          {delta != null && (
            <div className="w5-delta">
              {delta > 0 ? t.changeUp(delta) : delta < 0 ? t.changeDown(-delta) : t.changeSame}
              {' '}<span className="w5-meaningful">{t.meaningful}</span>
            </div>
          )}

          {store.entries.length >= 2 && (
            <div className="w5-trend-wrap">
              <div className="rxp-label">{t.trend}</div>
              <Trend entries={store.entries} />
            </div>
          )}

          <p className="w5-band">{bandCopy}</p>

          {/* ⚠ The crisis route is surfaced on the two low bands only. Showing it
              on every result would train people to scroll past it; showing it
              here is the whole reason the cut-off is used at all. */}
          {(band === 'low' || band === 'verylow') && <SafetyNote isAr={isAr} />}

          {locked ? (
            <div className="w5-locked">
              <div className="w5-locked-title">{t.lockedTitle}</div>
              <p>{t.lockedBody(RETAKE_DAYS - sinceLast)}</p>
            </div>
          ) : (
            <button className="rxp-primary" onClick={start}>{t.retake}</button>
          )}
          <button className="rxp-ghost" onClick={onBack}>{t.back}</button>
          <p className="qz-disclaimer" style={{ color: FAINT }}>{t.disclaimer}</p>
        </div>
      )}
    </PracticeShell>
  );
}

const CSS = `
.w5-window { font-size:11px; font-weight:800; letter-spacing:2px; text-transform:uppercase; color:${SUB}; text-align:center; }
.w5-score { font-family:${SERIF}; font-size:76px; font-weight:700; line-height:1; color:var(--rx-hue-lit); display:flex; flex-direction:column; align-items:center; gap:2px; }
.w5-score small { font-size:11px; font-weight:800; letter-spacing:1.5px; text-transform:uppercase; color:${FAINT}; font-family:inherit; }
.w5-score--low, .w5-score--verylow { color:${INK}; }
.w5-taken { font-size:11.5px; font-weight:700; color:${FAINT}; }
.w5-delta { font-size:13.5px; font-weight:700; color:${INK}; line-height:1.6; max-width:340px; }
.w5-meaningful { display:block; font-size:12px; font-weight:600; color:${SUB}; margin-top:4px; }
.w5-trend-wrap { width:100%; max-width:320px; display:flex; flex-direction:column; align-items:center; gap:8px;
  padding:14px; border-radius:14px; border:1px solid ${LINE}; background:${CARD}; box-shadow:var(--elev-rest); }
.w5-trend { width:100%; height:auto; overflow:visible; }
.w5-trend-line { fill:none; stroke:var(--rx-hue-lit); stroke-width:2.5; stroke-linecap:round; stroke-linejoin:round; }
.w5-trend-dot { fill:var(--rx-hue-lit); }
.w5-trend-dot.last { fill:var(--rx-meaning-lit); }
/* the published <50 line, drawn so a trend is read against it rather than against nothing */
.w5-trend-cut { stroke:${LINE}; stroke-width:1.5; stroke-dasharray:4 4; }
.w5-band { margin:0; font-size:13.5px; color:${SUB}; line-height:1.7; max-width:360px; text-align:center; }
.w5-locked { width:100%; max-width:360px; padding:13px 15px; border-radius:13px; border:1px solid ${LINE}; background:${CARD}; }
.w5-locked-title { font-size:13px; font-weight:800; color:${INK}; margin-bottom:5px; }
.w5-locked p { margin:0; font-size:12.5px; color:${SUB}; line-height:1.6; }
`;
