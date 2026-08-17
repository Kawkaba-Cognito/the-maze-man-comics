import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Sparkle, ShieldCheck, BookOpen, CaretDown } from '@phosphor-icons/react';
import {
  PERSONALIZATION_EVENT,
  getWellbeingContext,
  inspectTrainingNetwork,
  personalizationEnabled,
  personalizationStatus,
  resetPersonalization,
  saveWellbeingContext,
  setPersonalizationEnabled,
} from './neuralPersonalization.js';
import { getTrainingRecommendation, trainingFeatureVector } from './trainingRecommendations.js';
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
 *
 * ── REDESIGNED 2026-08-18 ─────────────────────────────────────────────────
 *
 * It used to be a permanently-open slab: ~320px of card sitting ON TOP of the
 * Home universe, pushing the sky text down and hiding the particle planet that
 * is the point of the screen. Three problems, all visible in one screenshot:
 *
 *   · ALWAYS OPEN. A panel that is never dismissed has to justify its height on
 *     every visit, and this one mostly said "still learning".
 *   · TWO RAW <select> ELEMENTS. Native OS dropdowns, in an app where nothing
 *     else is one. They read as a settings form dropped into a landscape.
 *   · NOTHING TO UNDERSTAND. "Your on-device model / Learning" is a claim. The
 *     panel asserted a neural network existed and then showed a text list.
 *
 * Now: a single collapsed rail that opens on touch, and inside it a diagram of
 * THE ACTUAL NETWORK — real input vector, real hidden activations, real output
 * probabilities, via `inspectTrainingNetwork`. It would have been easier to
 * animate a generic neural-net graphic. It would also have been a lie, in the
 * one place in the app that tells people what it has learned about them.
 *
 * The context controls are chips now. Same two values, same storage, but a chip
 * shows its options without being opened and is a 32px tap target, which a
 * <select> on a phone is not.
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
    expand: 'Open your model',
    collapse: 'Close your model',
    leadWarming: 'Learning your pattern',
    leadOff: 'Off — nothing is being learned',
    netTitle: 'What it is doing right now',
    netCaption: (i, h, o) => `${i} signals → ${h} hidden units → ${o} choices`,
    netLearned: (n) => (n === 1 ? 'shaped by 1 thing you did' : `shaped by ${n} things you did`),
    netCold: 'Not enough yet to lean on — it is still guessing evenly',
    /* Short on purpose. The full phrases ("what it makes of it") filled a
       330px phone panel edge to edge and the three labels touched. */
    netIn: 'Sees',
    netHid: 'Connects',
    netOut: 'Suggests',
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
    expand: 'افتح نموذجك',
    collapse: 'أغلق نموذجك',
    leadWarming: 'يتعلّم نمطك',
    leadOff: 'متوقف — لا يتعلّم شيئاً',
    netTitle: 'ما الذي يفعله الآن',
    netCaption: (i, h, o) => `${i} إشارة ← ${h} وحدة خفية ← ${o} خيارات`,
    netLearned: (n) => `تشكّل من ${n} من أفعالك`,
    netCold: 'لا يكفي بعد للاعتماد عليه — ما زال يخمّن بالتساوي',
    netIn: 'يرى',
    netHid: 'يربط',
    netOut: 'يقترح',
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

/* ── The network diagram ──────────────────────────────────────────────────
 *
 * Three columns of nodes at their REAL activation levels, with the edges
 * between them. Node opacity is the activation; the winning output is filled.
 *
 * ⚠ THE INPUT COLUMN IS SAMPLED, and the caption says so by naming the true
 * size. 18 input dots in a 96px-tall strip is a grey smear, so 6 evenly-spaced
 * ones stand in — but the number quoted underneath is 18, because rounding a
 * model down to what fits on screen and then labelling the picture as the model
 * is exactly the kind of small dishonesty this panel exists not to commit.
 */
const SAMPLE_INPUTS = 6;

function NetDiagram({ net, t, labels, winner }) {
  /* The SVG scales to the panel width, so this aspect ratio IS the rendered
     height: at 530px of desktop panel a 260×96 box came out 196px tall and
     pushed the actual suggestions below the fold. The diagram explains the
     feature; the rows are the feature. Wider and shorter keeps both on screen. */
  const W = 320;
  const H = 92;
  const PAD_X = 24;
  const PAD_Y = 10;

  const cols = useMemo(() => {
    const pick = (arr, n) => {
      if (arr.length <= n) return arr.map((v, i) => ({ v, i }));
      const step = (arr.length - 1) / (n - 1);
      return Array.from({ length: n }, (_, k) => {
        const i = Math.round(k * step);
        return { v: arr[i], i };
      });
    };
    const lay = (items, x) => items.map((it, k) => ({
      ...it,
      x,
      y: PAD_Y + (items.length === 1 ? (H - PAD_Y * 2) / 2 : (k * (H - PAD_Y * 2)) / (items.length - 1)),
    }));
    return {
      /* tanh output is signed; magnitude is what "active" means here. */
      inp: lay(pick(net.input, SAMPLE_INPUTS).map((d) => ({ ...d, a: Math.abs(d.v) })), PAD_X),
      hid: lay(net.hidden.map((v, i) => ({ v, i, a: Math.abs(v) })), W / 2),
      out: lay(net.output.map((v, i) => ({ v, i, a: v })), W - PAD_X),
    };
  }, [net]);

  /* Softmax over 6 classes floors at ~0.167 when the model is undecided, so
     scaling against the MAX is what makes a real preference visible at all. */
  const peak = Math.max(...net.output, 0.001);

  const edges = [];
  for (const a of cols.inp) {
    for (const b of cols.hid) {
      edges.push({ k: `i${a.i}-${b.i}`, x1: a.x, y1: a.y, x2: b.x, y2: b.y, o: 0.05 + a.a * b.a * 0.28 });
    }
  }
  for (const a of cols.hid) {
    for (const b of cols.out) {
      const live = b.i === winner;
      edges.push({
        k: `h${a.i}-${b.i}`,
        x1: a.x, y1: a.y, x2: b.x, y2: b.y,
        o: live ? 0.14 + a.a * 0.5 : 0.04 + a.a * (b.a / peak) * 0.16,
        live,
      });
    }
  }

  return (
    <div className="np-net">
      <svg
        className="np-net-svg"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={t.netCaption(net.inputSize, net.hiddenSize, net.outputSize)}
        /* The diagram is read left→right as a signal flowing forward. That is
           not a reading direction, it is a direction of causation, so it does
           NOT mirror in Arabic — the arrows in a circuit diagram don't either. */
        dir="ltr"
      >
        <g className="np-net-edges">
          {edges.map((e) => (
            <line
              key={e.k}
              x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
              className={e.live ? 'np-edge np-edge--live' : 'np-edge'}
              style={{ opacity: e.o }}
            />
          ))}
        </g>
        {cols.inp.map((n) => (
          <circle key={`i${n.i}`} cx={n.x} cy={n.y} r={2.6} className="np-node" style={{ opacity: 0.3 + n.a * 0.7 }} />
        ))}
        {cols.hid.map((n) => (
          <circle key={`h${n.i}`} cx={n.x} cy={n.y} r={2.4 + n.a * 1.6} className="np-node" style={{ opacity: 0.28 + n.a * 0.72 }} />
        ))}
        {cols.out.map((n) => (
          <circle
            key={`o${n.i}`}
            cx={n.x} cy={n.y}
            r={n.i === winner ? 5.2 : 3 + (n.a / peak) * 1.6}
            className={n.i === winner ? 'np-node np-node--win' : 'np-node np-node--out'}
            style={{ opacity: n.i === winner ? 1 : 0.34 + (n.a / peak) * 0.5 }}
          >
            <title>{`${labels[n.i]} · ${Math.round(n.v * 100)}%`}</title>
          </circle>
        ))}
      </svg>

      {/* ⚠ LTR in both languages, like the diagram above it. These three words
          LABEL COLUMNS, so mirroring them in Arabic would put "Suggests" on the
          left while the output nodes stayed on the right — the caption would
          then contradict the picture instead of explaining it. */}
      <div className="np-net-axis" dir="ltr">
        <span>{t.netIn}</span>
        <span>{t.netHid}</span>
        <span>{t.netOut}</span>
      </div>

      <p className="np-net-caption">
        {t.netCaption(net.inputSize, net.hiddenSize, net.outputSize)}
        {' · '}
        {net.cold ? t.netCold : t.netLearned(net.examples)}
      </p>
    </div>
  );
}

/** One row. A button when it leads somewhere, a plain div when it does not. */
function Stream({ icon, label, main, sub, onOpen, dormant }) {
  const inner = (
    <>
      <span className="np-stream-icon">{icon}</span>
      <span className="np-stream-body">
        <span className="np-stream-label">{label}</span>
        <span className="np-stream-main">{main}</span>
        {sub ? <span className="np-stream-sub">{sub}</span> : null}
      </span>
    </>
  );
  if (!onOpen) {
    return <div className="np-stream" data-dormant={dormant ? 'true' : 'false'}>{inner}</div>;
  }
  return (
    <button type="button" className="np-stream" data-dormant="false" onClick={onOpen}>
      {inner}
      <CaretDown size={13} weight="bold" className="np-stream-go" aria-hidden="true" />
    </button>
  );
}

/** A chip row. Replaces a native <select> — same value, visible options. */
function Chips({ legend, options, value, onPick, isAr }) {
  return (
    <div className="np-chips" role="group" aria-label={legend}>
      <div className="np-chips-legend">{legend}</div>
      <div className="np-chips-row">
        {options.map(([id, en, ar]) => (
          <button
            key={id}
            type="button"
            className="np-chip-opt"
            aria-pressed={value === id}
            onClick={() => onPick(id)}
          >
            {isAr ? ar : en}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function NeuralPanel({ isAr, playSfx, onOpenDomain, onOpenPractice, onOpenLearn }) {
  const t = isAr ? UI.ar : UI.en;
  const [on, setOn] = useState(personalizationEnabled);
  const [status, setStatus] = useState(personalizationStatus);
  const [context, setContext] = useState(getWellbeingContext);
  const [tick, setTick] = useState(0);
  const [open, setOpen] = useState(false);
  const bodyRef = useRef(null);

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
    setOpen(true);
    setStatus(personalizationStatus());
  }, [playSfx]);

  const erase = useCallback(() => {
    playSfx?.('click');
    resetPersonalization({ enabled: false });
    setOn(false);
    setOpen(false);
    setStatus('disabled');
  }, [playSfx]);

  const updateContext = useCallback((key, value) => {
    playSfx?.('click');
    const next = { ...context, [key]: value };
    setContext(next);
    saveWellbeingContext(next);
    setTick((n) => n + 1);
  }, [context, playSfx]);

  const toggle = useCallback(() => {
    playSfx?.('click');
    setOpen((v) => !v);
  }, [playSfx]);

  if (!on) {
    return (
      <section className="np" data-open="false">
        <div className="np-off">
          <ShieldCheck size={22} weight="duotone" color="var(--universe-accent)" aria-hidden="true" />
          <div className="np-off-body">
            <div className="np-title">{t.title}</div>
            <p className="np-note">{t.off}</p>
          </div>
          <button type="button" className="np-on" onClick={enable}>{t.turnOn}</button>
        </div>
      </section>
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

  /* Only computed when the panel is open — a forward pass is cheap, but a
     collapsed rail has no reason to run one on every Home render. */
  const net = open ? inspectTrainingNetwork(trainingFeatureVector()) : null;
  const domainIds = net ? Object.keys(DOMAINS_BY_ID) : [];
  const winner = net && trainingRec ? domainIds.indexOf(trainingRec.domainId) : -1;

  /* The collapsed rail still has to be worth its height, so it carries the
     headline suggestion rather than only the panel's name. */
  const lead = trainingRec
    ? `${domainLabel(trainingRec.domainId, isAr)} · ${t.challenge} ${trainingRec.suggestedLevel}/5`
    : t.leadWarming;

  return (
    <section className="np" data-open={open ? 'true' : 'false'}>
      <button
        type="button"
        className="np-bar"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="np-body"
        aria-label={open ? t.collapse : t.expand}
      >
        <Sparkle size={17} weight="fill" color="var(--universe-accent)" aria-hidden="true" />
        <span className="np-bar-body">
          <span className="np-bar-title">{t.title}</span>
          <span className="np-bar-lead">{lead}</span>
        </span>
        <span className="np-chip" data-state={status}>{t.states[status]}</span>
        <CaretDown size={14} weight="bold" className="np-caret" aria-hidden="true" />
      </button>

      <div className="np-body" id="np-body" ref={bodyRef} hidden={!open}>
        {net && !warming && winner >= 0 && (
          <div className="np-section">
            <div className="np-section-title">{t.netTitle}</div>
            <NetDiagram
              net={net}
              t={t}
              winner={winner}
              labels={domainIds.map((id) => domainLabel(id, isAr))}
            />
          </div>
        )}

        {/* Before it has learned anything, all three streams say the same
            sentence — 320px of panel to tell you "not yet" three times. One
            line until there is something worth showing. */}
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

            {/* Dormant until Kawnera has authored chapters. Shown rather than
                hidden so the capability and its condition are both visible —
                the same reason the review board renders `not-yet`. */}
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

        {/* The context chips only steer the WELLBEING suggestion, so they are
            noise until there is one. */}
        {!warming && (
          <div className="np-section np-context">
            <Chips
              legend={t.needLabel}
              options={NEEDS}
              value={context.need}
              onPick={(v) => updateContext('need', v)}
              isAr={isAr}
            />
            <Chips
              legend={t.timeLabel}
              options={TIMES}
              value={context.time}
              onPick={(v) => updateContext('time', v)}
              isAr={isAr}
            />
          </div>
        )}

        <div className="np-foot">
          <p className="np-privacy">{t.privacy}</p>
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
    </section>
  );
}
