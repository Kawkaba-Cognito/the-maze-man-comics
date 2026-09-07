import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import PracticeShell, { PracticeHero, INK, SUB, FAINT, LINE, CARD, SERIF } from './PracticeShell';
import SafetyNote, { PracticeCaution, SAFETY_CSS } from './SafetyNote';
import { markWellbeingPracticeDone } from './habitState';
import { loadJson, saveJson } from '../../lib/storage';

/*
 * Sleep Reset — a sleep diary plus stimulus control. The Sleep pillar's first
 * evidence-based arm.
 *
 * ── WHY (2026-09-07) ───────────────────────────────────────────────────────
 *
 * The Sleep category shipped as muscle relaxation, breathing and a rain loop —
 * which is to say, the three WEAKEST arms available. The first-line treatment
 * for chronic insomnia in every major guideline is CBT-I, and none of it was
 * here. Relaxation is a component of CBT-I; on its own it is the part with the
 * least evidence behind it.
 *
 * ── WHAT IS AND IS NOT IMPLEMENTED, AND WHY ────────────────────────────────
 *
 * Implemented: the SLEEP DIARY (the measurement CBT-I is built on), SLEEP
 * EFFICIENCY computed from it, and STIMULUS CONTROL (Bootzin's rules) — the
 * component with the strongest evidence and no meaningful risk profile.
 *
 * ⚠ SLEEP RESTRICTION IS DELIBERATELY NOT IMPLEMENTED, and must not be added
 * without a clinician in the loop. It is the other high-potency component, and
 * it works by deliberately inducing sleep deprivation to build sleep pressure.
 * Self-administered from an app that knows nothing about the user, that is
 * genuinely unsafe for several groups: it can precipitate mania in bipolar
 * disorder, lower the seizure threshold in epilepsy, worsen untreated sleep
 * apnoea, and it reliably degrades daytime alertness for the first week or two —
 * which matters if someone drives for a living. The screen EXPLAINS what
 * restriction is and why a clinician prescribes it, and stops there.
 *
 * ⚠ What it offers instead is the ANCHORED RISE TIME — get up at the same time
 * every day regardless of how the night went. It is the single safest and most
 * powerful lever available without supervision: it stabilises the circadian
 * signal and it builds sleep pressure honestly, without instructing anybody to
 * shorten their sleep.
 *
 * ⚠ AND IT SCREENS, GENTLY, FOR THE THING CBT-I DOES NOT TREAT. Loud snoring,
 * gasping or witnessed pauses in breathing point at sleep apnoea, where a
 * behavioural sleep programme is the wrong tool and delay is the actual harm.
 * That question is asked once, up front, and routes to "see a doctor".
 */

const ACCENT = 'var(--rx-sleep-core)';
const ACCENT_LIT = 'var(--rx-sleep-lit)';
const KEY = 'rx_sleepdiary_v1';
const MAX_NIGHTS = 60;
const TARGET_SE = 85; // the efficiency CBT-I works toward

/* Bootzin's stimulus-control instructions — the point of all six is to rebuild
   the bed→sleep association that insomnia erodes by pairing bed with wakefulness. */
const RULES = [
  { icon: '🛏️', en: 'Bed is for sleep only', ar: 'السرير للنوم فقط',
    bodyEn: 'No scrolling, working, or watching in bed. (Sex is the one exception.) Every hour spent awake in bed teaches your brain that bed is a place to be awake.',
    bodyAr: 'لا تصفّح ولا عمل ولا مشاهدة في السرير. (العلاقة الزوجية هي الاستثناء الوحيد.) كل ساعة تقضيها مستيقظاً في السرير تعلّم دماغك أن السرير مكان لليقظة.' },
  { icon: '😴', en: 'Go to bed only when sleepy', ar: 'اذهب للسرير حين تشعر بالنعاس فقط',
    bodyEn: 'Sleepy is not the same as tired. Tired is heavy; sleepy is when you could not keep your eyes open. Wait for sleepy.',
    bodyAr: 'النعاس غير التعب. التعب ثِقَل؛ أمّا النعاس فهو ألّا تستطيع إبقاء عينيك مفتوحتين. انتظر النعاس.' },
  { icon: '🚪', en: 'Awake for ~20 minutes? Get up', ar: 'مستيقظ ٢٠ دقيقة؟ انهض',
    bodyEn: 'Leave the bedroom, do something quiet and dim, return only when sleepy again. Do not clock-watch — estimate. Repeat as many times as it takes.',
    bodyAr: 'غادر الغرفة، وافعل شيئاً هادئاً في إضاءة خافتة، ولا تعد إلا حين يعود النعاس. لا تراقب الساعة — قدّر تقريباً. وكرّر ذلك بقدر ما يلزم.' },
  { icon: '⏰', en: 'Same rise time, every day', ar: 'وقت استيقاظ ثابت كل يوم',
    bodyEn: 'Including weekends, and including after a terrible night. This is the anchor the whole programme turns on — it is the one thing you control directly.',
    bodyAr: 'بما في ذلك عطلة نهاية الأسبوع، وبما في ذلك بعد ليلة سيّئة. هذا هو المرتكز الذي يدور عليه البرنامج كله — وهو الشيء الوحيد الذي تتحكّم به مباشرة.' },
  { icon: '🚫', en: 'No napping', ar: 'لا قيلولة',
    bodyEn: 'A nap spends the sleep pressure you have been building all day. If you must, keep it under 20 minutes and before mid-afternoon.',
    bodyAr: 'القيلولة تستهلك ضغط النوم الذي راكمته طوال اليوم. وإن كان لا بدّ، فاجعلها أقل من ٢٠ دقيقة وقبل منتصف بعد الظهر.' },
  { icon: '🕰️', en: 'Turn the clock away', ar: 'أدر الساعة بعيداً',
    bodyEn: 'Knowing it is 3:40am does nothing except start the arithmetic about tomorrow — and that arithmetic is itself one of the things keeping you awake.',
    bodyAr: 'معرفتك أن الساعة ٣:٤٠ فجراً لا تفعل شيئاً سوى بدء الحساب عن الغد — وهذا الحساب نفسه أحد ما يبقيك مستيقظاً.' },
];

const load = () => {
  const v = loadJson(KEY, null);
  return v && Array.isArray(v.nights) ? v : { nights: [] };
};

/** "23:30" → minutes past midnight. */
const toMin = (hhmm) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm || '');
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};
/* ⚠ Every interval here can cross midnight, which is the entire arithmetic
   hazard of a sleep diary: bed at 23:30 and up at 07:00 is +450 minutes, not
   −990. Wrapping forward is correct for all of them because nobody's night is
   longer than 24h. */
const span = (fromMin, toMinutes) => {
  if (fromMin == null || toMinutes == null) return null;
  const d = toMinutes - fromMin;
  return d < 0 ? d + 1440 : d;
};

/**
 * Time in bed, total sleep, and efficiency, from one night's entries.
 *
 * TST = (final wake − lights out) − time to fall asleep − time awake in the night
 * TIB = (out of bed − lights out)
 * SE  = TST / TIB
 */
export function computeNight(n) {
  const bed = toMin(n.bed);
  const wake = toMin(n.wake);
  const up = toMin(n.up);
  const tib = span(bed, up);
  const inBedAsleepWindow = span(bed, wake);
  if (tib == null || inBedAsleepWindow == null) return null;
  const tst = inBedAsleepWindow - (Number(n.latency) || 0) - (Number(n.awake) || 0);
  if (!(tib > 0) || tst < 0) return null;
  /*
   * ⚠ THE FINAL WAKE MUST FALL INSIDE THE TIME IN BED, and without this the
   * form accepted impossible nights in silence. Entering an out-of-bed time
   * EARLIER than the final wake (a plain typo — 23:15 where 07:15 was meant)
   * produced a arithmetically valid 15-minute night at 0% efficiency, saved it,
   * and dragged the running average down. Efficiency is the one number this
   * whole programme turns on, so a nonsense night is worse here than a missing
   * one: the user would read a collapsing average and conclude their sleep was
   * falling apart.
   */
  if (inBedAsleepWindow > tib) return null;
  return { tib, tst, se: Math.round((tst / tib) * 100) };
}

const fmtH = (mins, isAr) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return isAr ? `${h}س ${m}د` : `${h}h ${m}m`;
};

const T = {
  en: {
    title: 'Sleep Reset',
    meta: 'A morning log · 30 seconds a day',
    kawkab: 'The programmes that actually shift long-term sleep problems start with two unglamorous things: writing down what your nights are really doing, and changing what the bed means. Not a relaxation track. This is that.',
    intro: 'Log each morning for a week or two. The number that matters is sleep efficiency — how much of your time in bed you are actually asleep — because that, not total hours, is what these methods move.',
    evidence: 'This follows CBT-I, which meta-analyses of randomised trials find produces clinically meaningful improvements in how long it takes to fall asleep, time spent awake in the night, and sleep efficiency — with gains that hold at follow-up rather than fading (Trauer et al., 2015, Annals of Internal Medicine). It is recommended as the first-line treatment for chronic insomnia — ahead of sleeping medication — by the American College of Physicians and the American Academy of Sleep Medicine.',
    apneaQ: 'First, one question',
    apneaBody: 'Has anyone told you that you snore loudly, gasp, choke, or stop breathing while asleep — or do you fall asleep during the day without meaning to?',
    apneaYes: 'Yes, or not sure',
    apneaNo: 'No',
    apneaWarn: 'Please talk to a doctor before working on this with an app. Those are signs of a sleep disorder that a behavioural programme does not treat, and where waiting is the real cost. You are welcome to use the log here, but get it looked at.',
    apneaOk: 'Good — then a behavioural programme is a reasonable place to start.',
    cont: 'Continue',
    tabLog: 'Log', tabRules: 'The rules', tabData: 'Your nights',
    logTitle: 'Last night',
    bed: 'Lights out', wake: 'Final wake', up: 'Out of bed',
    latency: 'Minutes to fall asleep', awake: 'Minutes awake in the night',
    quality: 'How did it feel?',
    save: 'Save the night',
    saved: 'Saved',
    invalid: 'Check the times — that comes out as a night with no sleep in it.',
    already: "You have already logged today. Saving again will replace it.",
    seTitle: 'Sleep efficiency',
    seNights: (n) => `over ${n} ${n === 1 ? 'night' : 'nights'}`,
    avgSleep: 'Average sleep',
    avgBed: 'Average time in bed',
    needMore: 'Log three nights and this starts to mean something. One night tells you about one night.',
    seGood: `At or above ${TARGET_SE}% your time in bed is being used well. If you are still short on sleep at this efficiency, the question is the length of your window, not its quality — and that is worth raising with a doctor rather than shortening further.`,
    seMid: `Just under the ${TARGET_SE}% mark. The stimulus-control rules are aimed at exactly this gap — particularly getting up when you have been awake a while, which feels wrong and is the one that works.`,
    seLow: `Well under ${TARGET_SE}%. A lot of your time in bed is being spent awake, which is the pattern that teaches the body that bed means wakefulness. The rules tab is the intervention for this — and this is the point at which a doctor or a sleep clinic is genuinely worth it.`,
    restrictTitle: 'What a clinician would add here',
    restrictBody: 'The other half of CBT-I is sleep restriction: deliberately shrinking your time in bed to match how much you actually sleep, then widening it as efficiency climbs. It works, and this app will not prescribe it — it builds sleep pressure by creating short-term sleep deprivation, which needs supervision if you have bipolar disorder or epilepsy, is the wrong move with untreated sleep apnoea, and makes you measurably less alert for the first week or two. Ask a doctor to run it with you.',
    anchorTitle: 'What you can safely do now',
    anchorBody: 'Anchor your rise time. Get up at the same hour every day, weekends included, however badly the night went. It is the safest strong lever there is: it steadies the body clock and builds sleep pressure without anyone telling you to sleep less.',
    noData: 'No nights logged yet.',
    night: 'Night', eff: 'Eff.',
    back: 'Back',
    caution: 'A self-guided sleep log, not treatment. Persistent insomnia — three nights a week for three months or more — deserves a doctor, and is very treatable.',
  },
  ar: {
    title: 'إعادة ضبط النوم',
    meta: 'سجلّ صباحي · ٣٠ ثانية يومياً',
    kawkab: 'البرامج التي تُحدث فرقاً حقيقياً في مشكلات النوم المزمنة تبدأ بأمرين غير براقين: أن تدوّن ما تفعله لياليك فعلاً، وأن تغيّر ما يعنيه السرير. ليست مقطوعة استرخاء. هذا هو ذاك.',
    intro: 'سجّل كل صباح لأسبوع أو اثنين. الرقم المهم هو كفاءة النوم — كم من وقتك في السرير تكون نائماً فعلاً — لأن هذا، لا عدد الساعات، هو ما تحرّكه هذه الأساليب.',
    evidence: 'يتبع هذا نهج العلاج المعرفي السلوكي للأرق (CBT-I)، الذي تجد التحليلات البَعدية للتجارب العشوائية أنه يُحدث تحسّناً ذا دلالة سريرية في مدة الخلود إلى النوم، ووقت اليقظة أثناء الليل، وكفاءة النوم — بمكاسب تصمد عند المتابعة بدل أن تتلاشى (Trauer et al., 2015, Annals of Internal Medicine). وهو موصى به كعلاج الخط الأول للأرق المزمن — قبل الأدوية المنوّمة — من الكلية الأمريكية للأطباء والأكاديمية الأمريكية لطب النوم.',
    apneaQ: 'أولاً، سؤال واحد',
    apneaBody: 'هل أخبرك أحد أنك تشخر بصوت عالٍ، أو تلهث، أو تختنق، أو يتوقف تنفّسك أثناء النوم — أو هل تغفو أثناء النهار دون قصد؟',
    apneaYes: 'نعم، أو لست متأكداً',
    apneaNo: 'لا',
    apneaWarn: 'من فضلك تحدّث إلى طبيب قبل معالجة هذا عبر تطبيق. فهذه علامات اضطراب نوم لا يعالجه برنامج سلوكي، والانتظار فيه هو الضرر الحقيقي. يمكنك استخدام السجلّ هنا، لكن اعرض الأمر على مختصّ.',
    apneaOk: 'جيد — إذن البرنامج السلوكي نقطة بداية معقولة.',
    cont: 'متابعة',
    tabLog: 'تسجيل', tabRules: 'القواعد', tabData: 'لياليك',
    logTitle: 'ليلة أمس',
    bed: 'إطفاء الضوء', wake: 'الاستيقاظ الأخير', up: 'مغادرة السرير',
    latency: 'دقائق حتى النوم', awake: 'دقائق اليقظة أثناء الليل',
    quality: 'كيف كان شعورك؟',
    save: 'احفظ الليلة',
    saved: 'حُفظت',
    invalid: 'راجع الأوقات — فهي تعطي ليلة بلا نوم إطلاقاً.',
    already: 'سجّلت اليوم بالفعل. الحفظ مجدداً سيستبدل التسجيل.',
    seTitle: 'كفاءة النوم',
    seNights: (n) => `عبر ${n} ${n === 1 ? 'ليلة' : 'ليالٍ'}`,
    avgSleep: 'متوسط النوم',
    avgBed: 'متوسط الوقت في السرير',
    needMore: 'سجّل ثلاث ليالٍ ويبدأ هذا في اكتساب معنى. الليلة الواحدة تخبرك عن ليلة واحدة.',
    seGood: `عند ${TARGET_SE}٪ أو أعلى يكون وقتك في السرير مُستخدَماً جيداً. وإن كنت مع ذلك تنقصك ساعات النوم عند هذه الكفاءة، فالسؤال عن طول نافذتك لا عن جودتها — وهذا يستحق عرضه على طبيب لا تقصيرها أكثر.`,
    seMid: `أقل قليلاً من ${TARGET_SE}٪. قواعد ضبط المثير موجّهة لهذه الفجوة تحديداً — وخاصة النهوض بعد فترة يقظة، وهي القاعدة التي تبدو خاطئة وهي التي تنجح.`,
    seLow: `أقل بكثير من ${TARGET_SE}٪. جزء كبير من وقتك في السرير يمضي في اليقظة، وهو النمط الذي يعلّم الجسد أن السرير يعني اليقظة. تبويب القواعد هو العلاج لهذا — وهذه هي النقطة التي يستحق عندها الطبيب أو عيادة النوم فعلاً.`,
    restrictTitle: 'ما الذي سيضيفه المختصّ هنا',
    restrictBody: 'النصف الآخر من العلاج المعرفي السلوكي للأرق هو تقييد النوم: تقليص وقتك في السرير عمداً ليطابق ما تنامه فعلاً، ثم توسيعه مع ارتفاع الكفاءة. وهو فعّال، ولن يصفه هذا التطبيق — فهو يبني ضغط النوم عبر حرمان قصير المدى، ويحتاج إشرافاً إن كنت مصاباً باضطراب ثنائي القطب أو الصرع، وهو خيار خاطئ مع انقطاع النفس النومي غير المعالَج، ويقلّل يقظتك النهارية بوضوح في الأسبوع أو الأسبوعين الأولين. اطلب من طبيب أن يجريه معك.',
    anchorTitle: 'ما يمكنك فعله بأمان الآن',
    anchorBody: 'ثبّت وقت استيقاظك. انهض في الساعة نفسها كل يوم، بما في ذلك العطلات، مهما كانت الليلة سيّئة. إنه أأمن رافعة قوية موجودة: يثبّت ساعتك البيولوجية ويبني ضغط النوم دون أن يطلب منك أحد أن تنام أقل.',
    noData: 'لا ليالٍ مسجّلة بعد.',
    night: 'ليلة', eff: 'كفاءة',
    back: 'رجوع',
    caution: 'سجلّ نوم ذاتي التوجيه، وليس علاجاً. الأرق المستمر — ثلاث ليالٍ أسبوعياً لثلاثة أشهر أو أكثر — يستحق طبيباً، وهو قابل للعلاج إلى حد كبير.',
  },
};

const todayKey = () => new Date().toISOString().slice(0, 10);

export default function SleepResetPractice({ onBack }) {
  const { currentLang, playSfx } = useApp();
  const isAr = currentLang === 'ar';
  const t = isAr ? T.ar : T.en;

  const [store, setStore] = useState(() => load());
  const [phase, setPhase] = useState(() => (load().nights.length ? 'main' : 'intro')); // intro | screen | main
  const [apnea, setApnea] = useState(null);
  const [tab, setTab] = useState('log');
  const [form, setForm] = useState({ bed: '23:00', wake: '07:00', up: '07:15', latency: '20', awake: '10', quality: 3 });
  const [err, setErr] = useState(null);
  const [flash, setFlash] = useState(false);

  const nights = store.nights;
  const stats = useMemo(() => {
    const computed = nights.map((n) => ({ ...n, ...(computeNight(n) || {}) })).filter((n) => n.se != null);
    if (!computed.length) return null;
    const recent = computed.slice(-14);
    const avg = (k) => Math.round(recent.reduce((a, b) => a + b[k], 0) / recent.length);
    return { recent, se: avg('se'), tst: avg('tst'), tib: avg('tib'), count: recent.length };
  }, [nights]);

  const saveNight = () => {
    const c = computeNight(form);
    if (!c) { setErr(t.invalid); return; }
    setErr(null);
    playSfx?.('collect');
    const date = todayKey();
    const nights2 = [...nights.filter((n) => n.date !== date), { ...form, date }].slice(-MAX_NIGHTS);
    saveJson(KEY, { nights: nights2 });
    setStore({ nights: nights2 });
    markWellbeingPracticeDone('sleep-reset');
    setFlash(true);
    setTimeout(() => setFlash(false), 2200);
    setTab('data');
  };

  const loggedToday = nights.some((n) => n.date === todayKey());
  const seBand = stats ? (stats.se >= TARGET_SE ? t.seGood : stats.se >= 80 ? t.seMid : t.seLow) : null;

  return (
    <PracticeShell title={t.title} accent={ACCENT} accentLit={ACCENT_LIT} isAr={isAr} onBack={onBack}>
      <style>{SAFETY_CSS}</style>
      <style>{CSS}</style>

      {phase === 'intro' && (
        <div className="rxp-body rxp-center">
          <PracticeHero emoji="🌙" />
          <p className="sr-kawkab">{t.kawkab}</p>
          <p className="sr-intro">{t.intro}</p>
          <p className="sr-evidence">{t.evidence}</p>
          <div className="rxp-label">{t.meta}</div>
          <button className="rxp-primary" onClick={() => { playSfx?.('click'); setPhase('screen'); }}>{t.cont}</button>
          <PracticeCaution>{t.caution}</PracticeCaution>
        </div>
      )}

      {/* ⚠ Asked ONCE, before anything else. A behavioural sleep programme is the
          wrong tool for apnoea, and the harm is the delay it causes. */}
      {phase === 'screen' && (
        <div className="rxp-body rxp-center">
          <div className="sr-h serif">{t.apneaQ}</div>
          <p className="sr-intro">{t.apneaBody}</p>
          {apnea == null ? (
            <div className="sr-choices">
              <button type="button" className="sr-choice" onClick={() => { playSfx?.('click'); setApnea(true); }}>{t.apneaYes}</button>
              <button type="button" className="sr-choice" onClick={() => { playSfx?.('click'); setApnea(false); }}>{t.apneaNo}</button>
            </div>
          ) : (
            <>
              <p className={apnea ? 'sr-warn' : 'sr-ok'}>{apnea ? t.apneaWarn : t.apneaOk}</p>
              {apnea && <SafetyNote isAr={isAr} />}
              <button className="rxp-primary" onClick={() => { playSfx?.('click'); setPhase('main'); }}>{t.cont}</button>
            </>
          )}
        </div>
      )}

      {phase === 'main' && (
        <div className="rxp-body">
          <div className="sr-tabs">
            {[['log', t.tabLog], ['rules', t.tabRules], ['data', t.tabData]].map(([id, label]) => (
              <button key={id} type="button" className={`sr-tab${tab === id ? ' on' : ''}`} onClick={() => { playSfx?.('click'); setTab(id); }}>{label}</button>
            ))}
          </div>

          {tab === 'log' && (
            <>
              <div className="sr-h serif">{t.logTitle}</div>
              {loggedToday && <p className="sr-note">{t.already}</p>}
              <div className="sr-grid">
                {[['bed', t.bed], ['wake', t.wake], ['up', t.up]].map(([k, label]) => (
                  <label key={k} className="sr-field">
                    <span>{label}</span>
                    <input type="time" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
                  </label>
                ))}
                {[['latency', t.latency], ['awake', t.awake]].map(([k, label]) => (
                  <label key={k} className="sr-field">
                    <span>{label}</span>
                    <input type="number" min="0" max="600" inputMode="numeric" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
                  </label>
                ))}
              </div>
              <div className="sr-field">
                <span>{t.quality}</span>
                <div className="sr-quality">
                  {[1, 2, 3, 4, 5].map((q) => (
                    <button key={q} type="button" className={`sr-q${form.quality === q ? ' on' : ''}`} onClick={() => setForm({ ...form, quality: q })}>{'☾'.repeat(q)}</button>
                  ))}
                </div>
              </div>
              {err && <p className="sr-warn">{err}</p>}
              <button className="rxp-primary" onClick={saveNight}>{flash ? t.saved : t.save}</button>
            </>
          )}

          {tab === 'rules' && (
            <>
              {RULES.map((r) => (
                <div key={r.en} className="sr-rule">
                  <span className="sr-rule-ic">{r.icon}</span>
                  <div>
                    <div className="sr-rule-name">{isAr ? r.ar : r.en}</div>
                    <div className="sr-rule-body">{isAr ? r.bodyAr : r.bodyEn}</div>
                  </div>
                </div>
              ))}
              <div className="sr-card sr-card--accent">
                <div className="sr-card-title">{t.anchorTitle}</div>
                <p>{t.anchorBody}</p>
              </div>
              <div className="sr-card">
                <div className="sr-card-title">{t.restrictTitle}</div>
                <p>{t.restrictBody}</p>
              </div>
              <PracticeCaution>{t.caution}</PracticeCaution>
              <SafetyNote isAr={isAr} />
            </>
          )}

          {tab === 'data' && (
            stats ? (
              <>
                <div className="sr-se-wrap">
                  <div className="rxp-label">{t.seTitle}</div>
                  <div className={`sr-se${stats.se >= TARGET_SE ? ' good' : ''}`}>{stats.se}<small>%</small></div>
                  <div className="sr-se-sub">{t.seNights(stats.count)}</div>
                </div>
                <div className="sr-stats">
                  <div className="sr-stat"><b>{fmtH(stats.tst, isAr)}</b><span>{t.avgSleep}</span></div>
                  <div className="sr-stat"><b>{fmtH(stats.tib, isAr)}</b><span>{t.avgBed}</span></div>
                </div>
                <div className="sr-bars">
                  {stats.recent.map((n) => (
                    <div key={n.date} className="sr-bar-col" title={`${n.date} · ${n.se}%`}>
                      <div className="sr-bar" style={{ height: `${Math.max(4, Math.min(100, n.se))}%` }} />
                    </div>
                  ))}
                </div>
                {stats.count < 3 ? <p className="sr-note">{t.needMore}</p> : <p className="sr-band">{seBand}</p>}
                <SafetyNote isAr={isAr} />
              </>
            ) : <p className="sr-note">{t.noData}</p>
          )}

          <button className="rxp-ghost" onClick={onBack}>{t.back}</button>
        </div>
      )}
    </PracticeShell>
  );
}

const CSS = `
.sr-kawkab { margin:0; font-size:14.5px; color:${INK}; line-height:1.7; max-width:360px; font-weight:600; text-align:center; }
.sr-intro { margin:0; font-size:13.5px; color:${SUB}; line-height:1.7; max-width:360px; text-align:center; }
.sr-evidence { margin:0; align-self:center; font-size:11.5px; color:${FAINT}; line-height:1.65; max-width:360px; text-align:center; font-style:italic; }
.sr-h { font-family:${SERIF}; font-size:25px; font-weight:600; color:${INK}; text-align:center; }
.sr-choices { display:flex; flex-direction:column; gap:9px; width:100%; max-width:340px; }
.sr-choice { padding:14px 16px; border-radius:13px; border:1px solid ${LINE}; background:${CARD}; color:${INK};
  font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; box-shadow:var(--elev-rest); }
.sr-warn { margin:0; font-size:13px; line-height:1.7; color:${INK}; max-width:360px; text-align:center;
  padding:12px 14px; border-radius:13px; background:color-mix(in srgb, var(--rx-relationships-core) 14%, transparent);
  border:1px solid color-mix(in srgb, var(--rx-relationships-core) 40%, transparent); }
.sr-ok { margin:0; font-size:13px; color:${SUB}; line-height:1.7; text-align:center; max-width:340px; }
.sr-tabs { display:flex; gap:6px; }
.sr-tab { flex:1; padding:10px 6px; border-radius:11px; border:1px solid ${LINE}; background:${CARD}; color:${SUB};
  font-size:12.5px; font-weight:750; cursor:pointer; font-family:inherit; }
.sr-tab.on { border-color:var(--rx-hue); background:color-mix(in srgb, var(--rx-hue) 16%, transparent); color:${INK}; }
.sr-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.sr-field { display:flex; flex-direction:column; gap:5px; }
.sr-field > span { font-size:11px; font-weight:800; letter-spacing:0.4px; text-transform:uppercase; color:${SUB}; }
.sr-field input { width:100%; padding:11px 12px; border-radius:11px; border:1px solid ${LINE}; background:${CARD};
  color:${INK}; font-size:15px; font-family:inherit; }
.sr-field input:focus { outline:none; border-color:var(--rx-hue); }
.sr-quality { display:flex; gap:5px; }
.sr-q { flex:1; padding:9px 2px; border-radius:10px; border:1px solid ${LINE}; background:${CARD}; color:${FAINT};
  font-size:11px; cursor:pointer; font-family:inherit; overflow:hidden; }
.sr-q.on { border-color:var(--rx-hue); background:color-mix(in srgb, var(--rx-hue) 16%, transparent); color:var(--rx-hue-lit); }
.sr-note { margin:0; font-size:12.5px; color:${FAINT}; line-height:1.6; text-align:center; }
.sr-rule { display:flex; gap:11px; padding:13px 14px; border-radius:13px; border:1px solid ${LINE}; background:${CARD}; box-shadow:var(--elev-rest); }
.sr-rule-ic { font-size:22px; flex-shrink:0; }
.sr-rule-name { font-size:14px; font-weight:800; color:${INK}; margin-bottom:3px; }
.sr-rule-body { font-size:12.5px; color:${SUB}; line-height:1.6; }
.sr-card { padding:13px 15px; border-radius:13px; border:1px solid ${LINE}; background:${CARD}; }
.sr-card--accent { border-color:color-mix(in srgb, var(--rx-hue) 50%, transparent); background:color-mix(in srgb, var(--rx-hue) 11%, transparent); }
.sr-card-title { font-size:13px; font-weight:800; color:${INK}; margin-bottom:5px; }
.sr-card p { margin:0; font-size:12.5px; color:${SUB}; line-height:1.7; }
.sr-se-wrap { display:flex; flex-direction:column; align-items:center; gap:3px; }
.sr-se { font-family:${SERIF}; font-size:64px; font-weight:700; line-height:1; color:${INK}; display:flex; align-items:baseline; }
.sr-se.good { color:var(--rx-hue-lit); }
.sr-se small { font-size:22px; font-weight:700; }
.sr-se-sub { font-size:11.5px; color:${FAINT}; font-weight:700; }
.sr-stats { display:grid; grid-template-columns:1fr 1fr; gap:9px; }
.sr-stat { padding:11px; border-radius:12px; border:1px solid ${LINE}; background:${CARD}; text-align:center; }
.sr-stat b { display:block; font-size:19px; color:${INK}; font-variant-numeric:tabular-nums; }
.sr-stat span { font-size:10.5px; font-weight:700; color:${SUB}; }
.sr-bars { display:flex; align-items:flex-end; gap:4px; height:88px; padding:8px; border-radius:12px; border:1px solid ${LINE}; background:${CARD}; }
.sr-bar-col { flex:1; height:100%; display:flex; align-items:flex-end; }
.sr-bar { width:100%; border-radius:4px 4px 2px 2px; background:var(--rx-hue-lit); }
.sr-band { margin:0; font-size:13px; color:${SUB}; line-height:1.7; }
`;
