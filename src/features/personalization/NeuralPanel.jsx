import React, { useCallback, useEffect, useState } from 'react';
import { Sparkle, ShieldCheck, BookOpen } from '@phosphor-icons/react';
import {
  PERSONALIZATION_EVENT,
  getWellbeingContext,
  personalizationEnabled,
  personalizationStatus,
  resetPersonalization,
  saveWellbeingContext,
  setPersonalizationEnabled,
} from './neuralPersonalization.js';
import { getTrainingRecommendation } from './trainingRecommendations.js';
import { getWellbeingRecommendation } from './wellbeingRecommendations.js';
import { getKawneraRecommendation, kawneraReady } from './kawneraRecommendations.js';
import { DOMAINS_BY_ID } from '../training/registry.js';
import { RELAX_PRACTICES } from '../relax/practices.js';
import './neuralPanel.css';

/*
 * The single on-device personalization surface, mounted on Home above the
 * universe.
 *
 * WHY IT IS ONE COMPONENT
 * ───────────────────────
 * There used to be two: ~75 lines of inline-styled JSX in RadialMazeHub and
 * ~85 in RelaxScreen. They shared ONE global flag (`personalizationEnabled`),
 * so turning personalization on in Training silently turned it on in Wellbeing
 * while each screen re-declared the same bilingual strings, the same reset
 * button and the same privacy note in slightly different words. One feature
 * that read as two half-features. Both blocks are now deleted; this is the only
 * place the model is controlled or displayed.
 *
 * Learning is unaffected and still happens where the activity does —
 * `rating.js` records training outcomes, and the wellbeing recorders fire on
 * practice selection. Moving the DISPLAY does not move the DATA COLLECTION.
 */

const UI = {
  en: {
    title: 'Your on-device model',
    off: 'Learns what to suggest — training, wellbeing and reading — from what you actually do. Nothing leaves this device.',
    turnOn: 'Turn on',
    reset: 'Erase',
    resetHint: 'Turn off personalization and erase its model',
    privacy: 'Runs entirely on this device. Learns only from choices and completed runs — never from raw trial data.',
    training: 'Training',
    wellbeing: 'Wellbeing',
    learn: 'Learn',
    warming: 'Still learning your pattern',
    warmingSub: 'A few more sessions before it suggests anything',
    dormant: 'Waiting for chapters',
    dormantSub: 'Activates on its own once the library has content',
    needLabel: 'What do you need right now?',
    timeLabel: 'How much time do you have?',
    notDiagnosis: 'A suggestion, never a diagnosis',
    challenge: 'challenge',
    states: { disabled: 'Off', starting: 'Starting', learning: 'Learning', personalized: 'Tuned' },
  },
  ar: {
    title: 'نموذجك على هذا الجهاز',
    off: 'يتعلّم ما يقترحه — التدريب والعافية والقراءة — مما تفعله فعلاً. لا شيء يغادر هذا الجهاز.',
    turnOn: 'تشغيل',
    reset: 'مسح',
    resetHint: 'إيقاف التخصيص ومسح النموذج',
    privacy: 'يعمل بالكامل على هذا الجهاز. يتعلّم من الاختيارات والجولات المكتملة فقط — لا من بيانات المحاولات الخام.',
    training: 'التدريب',
    wellbeing: 'العافية',
    learn: 'التعلّم',
    warming: 'ما زال يتعلّم نمطك',
    warmingSub: 'بضع جلسات أخرى قبل أن يقترح شيئاً',
    dormant: 'بانتظار الفصول',
    dormantSub: 'يُفعَّل تلقائياً عندما تتوفّر محتويات المكتبة',
    needLabel: 'ما الذي تحتاجه الآن؟',
    timeLabel: 'كم لديك من الوقت؟',
    notDiagnosis: 'اقتراح فقط — وليس تشخيصاً',
    challenge: 'تحدٍ',
    states: { disabled: 'متوقف', starting: 'يبدأ', learning: 'يتعلّم', personalized: 'مضبوط' },
  },
};

/* Labels come from the registries that own them, never from a local copy.
 * The two screens this panel replaced each had their own — RadialMazeHub's
 * DOMAIN_DOOR_LABEL_EN/AR and RelaxScreen's RELAX_PRACTICES — and a third copy
 * here would be the one that goes stale first. */
const domainLabel = (id, isAr) => {
  const d = DOMAINS_BY_ID[id];
  return (isAr ? d?.nameAr : d?.name) || id;
};

const practiceById = (id) => RELAX_PRACTICES.find((p) => p.id === id) || null;

const NEEDS = [
  ['calm', 'Calm now', 'الهدوء الآن'],
  ['sleep', 'Sleep', 'النوم'],
  ['meaning', 'Meaning', 'المعنى'],
  ['connection', 'Connection', 'التواصل'],
  ['self', 'Understand myself', 'فهم الذات'],
];

const TIMES = [
  ['quick', '2–5 minutes', 'دقيقتان–٥'],
  ['medium', '10–15 minutes', '١٠–١٥ دقيقة'],
  ['deep', '20+ minutes', '٢٠ دقيقة أو أكثر'],
];

/** One row. A button when it leads somewhere, a plain div when it does not. */
function Stream({ icon, label, main, sub, onOpen, dormant }) {
  const inner = (
    <>
      {icon}
      <div className="np-stream-body">
        <div className="np-stream-label">{label}</div>
        <div className="np-stream-main">{main}</div>
        {sub ? <div className="np-stream-sub">{sub}</div> : null}
      </div>
    </>
  );
  if (!onOpen) {
    return <div className="np-stream" data-dormant={dormant ? 'true' : 'false'}>{inner}</div>;
  }
  return (
    <button type="button" className="np-stream" data-dormant="false" onClick={onOpen}>
      {inner}
    </button>
  );
}

export default function NeuralPanel({ isAr, playSfx, onOpenDomain, onOpenPractice, onOpenLearn }) {
  const t = isAr ? UI.ar : UI.en;
  const [on, setOn] = useState(personalizationEnabled);
  const [status, setStatus] = useState(personalizationStatus);
  const [context, setContext] = useState(getWellbeingContext);
  const [tick, setTick] = useState(0);

  /* The model can change from anywhere that records an outcome (rating.js on a
   * finished run, the wellbeing recorders), so the panel listens rather than
   * reading once on mount — otherwise it shows a stale suggestion until Home is
   * remounted, which on a tab router that hides with display:none may be never. */
  useEffect(() => {
    const sync = (event) => {
      setOn(Boolean(event.detail?.enabled));
      setStatus(personalizationStatus());
      setTick((n) => n + 1);
    };
    window.addEventListener(PERSONALIZATION_EVENT, sync);
    return () => window.removeEventListener(PERSONALIZATION_EVENT, sync);
  }, []);

  const enable = useCallback(() => {
    playSfx?.('click');
    setPersonalizationEnabled(true);
    setOn(true);
    setStatus(personalizationStatus());
  }, [playSfx]);

  const erase = useCallback(() => {
    playSfx?.('click');
    resetPersonalization({ enabled: false });
    setOn(false);
    setStatus('disabled');
  }, [playSfx]);

  const updateContext = useCallback((key, value) => {
    const next = { ...context, [key]: value };
    setContext(next);
    saveWellbeingContext(next);
    setTick((n) => n + 1);
  }, [context]);

  if (!on) {
    return (
      <div className="np">
        <div className="np-head">
          <ShieldCheck size={22} weight="duotone" color="var(--universe-accent)" aria-hidden="true" />
          <div className="np-title">
            {t.title}
            <div className="np-note">{t.off}</div>
          </div>
          <button type="button" className="np-on" onClick={enable}>{t.turnOn}</button>
        </div>
      </div>
    );
  }

  /* Recomputed per render; `tick` is the dependency that makes that deliberate
   * rather than accidental. These are cheap — one forward pass through a
   * ~12-unit hidden layer. */
  void tick;

  /* Both recommenders ALWAYS return a pick — the cold-start gate lives inside
   * the neural call (predictTrainingPreferences returns null under 3 examples)
   * while the wrapper still falls back to a heuristic. So "is it warmed up?" is
   * a question about STATUS, not about a null return. Reading it the other way
   * would show a confident suggestion from a model that has learned nothing. */
  const warming = status === 'starting';
  const trainingRec = warming ? null : getTrainingRecommendation();
  const wellbeingRec = warming ? null : getWellbeingRecommendation(context);
  const practice = wellbeingRec ? practiceById(wellbeingRec.id) : null;
  const learnReady = kawneraReady();
  const learn = learnReady && !warming
    ? getKawneraRecommendation({ sessionTime: context.time })
    : null;

  return (
    <div className="np">
      <div className="np-head">
        <Sparkle size={20} weight="fill" color="var(--universe-accent)" aria-hidden="true" />
        <div className="np-title">{t.title}</div>
        <span className="np-chip" data-state={status}>{t.states[status]}</span>
      </div>

      {/* Before it has learned anything, all three streams say the same
          sentence — 320px of panel to tell you "not yet" three times, which
          also pushed the universe title down into the sky text. One line until
          there is something worth showing. */}
      {warming ? (
        <div className="np-streams">
          <Stream
            icon={<Sparkle size={17} weight="fill" color="var(--universe-accent)" aria-hidden="true" />}
            label={`${t.training} · ${t.wellbeing}${learnReady ? ` · ${t.learn}` : ''}`}
            main={t.warming}
            sub={t.warmingSub}
          />
        </div>
      ) : (
      <div className="np-streams">
        <Stream
          icon={<Sparkle size={17} weight="fill" color="var(--universe-accent)" aria-hidden="true" />}
          label={t.training}
          main={trainingRec ? domainLabel(trainingRec.domainId, isAr) : t.warming}
          sub={trainingRec
            ? `${trainingRec.reason} · ${t.challenge} ${trainingRec.suggestedLevel}/5`
            : t.warmingSub}
          onOpen={trainingRec && onOpenDomain
            ? () => { playSfx?.('click'); onOpenDomain(trainingRec.domainId); }
            : null}
        />

        <Stream
          icon={<ShieldCheck size={17} weight="duotone" color="var(--universe-accent)" aria-hidden="true" />}
          label={t.wellbeing}
          main={practice ? (isAr ? practice.titleAr : practice.title) : t.warming}
          sub={practice ? t.notDiagnosis : t.warmingSub}
          onOpen={practice && onOpenPractice
            ? () => { playSfx?.('click'); onOpenPractice(practice.id); }
            : null}
        />

        {/* Dormant until Kawnera has authored chapters. Shown rather than hidden
            so the capability and its condition are both visible — the same
            reason the review board renders `not-yet` instead of omitting it. */}
        <Stream
          icon={<BookOpen size={17} weight="duotone" color="var(--universe-muted)" aria-hidden="true" />}
          label={t.learn}
          main={learn ? learn.title : (learnReady ? t.warming : t.dormant)}
          sub={learn ? null : (learnReady ? t.warmingSub : t.dormantSub)}
          dormant={!learnReady}
          onOpen={learn && onOpenLearn
            ? () => { playSfx?.('click'); onOpenLearn(learn.bookId); }
            : null}
        />
      </div>
      )}

      {/* The context selects only steer the WELLBEING suggestion, so they are
          noise until there is one. */}
      {!warming && (
      <div className="np-context">
        <select
          aria-label={t.needLabel}
          value={context.need}
          onChange={(e) => updateContext('need', e.target.value)}
        >
          {NEEDS.map(([id, en, ar]) => <option key={id} value={id}>{isAr ? ar : en}</option>)}
        </select>
        <select
          aria-label={t.timeLabel}
          value={context.time}
          onChange={(e) => updateContext('time', e.target.value)}
        >
          {TIMES.map(([id, en, ar]) => <option key={id} value={id}>{isAr ? ar : en}</option>)}
        </select>
      </div>
      )}

      <div className="np-foot">
        <div className="np-privacy">{t.privacy}</div>
        <button
          type="button"
          className="np-reset"
          onClick={erase}
          title={t.resetHint}
          aria-label={t.resetHint}
        >
          {t.reset}
        </button>
      </div>
    </div>
  );
}
