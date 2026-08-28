import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';
import { makeRng } from '../../../../shared/rng';
import { useGamePause } from '../../../../shared/useGamePause';
import { TrainingPlayHeader } from '../../../../shared/TrainingChrome';
import { createTrialLog } from '../../../../shared/trialLog';
import PlanetFolk, { folkName } from './PlanetFolk';
import {
  buildGate, cardKey, informationOf, LADDER_LEVELS, lawHolds, levelCfg, levelPassed,
  passCfg, ruleSpace, survivors, survivalCfg,
} from './data.js';
import { FAMILY, T, attrWords, familyIndex, lawText } from './strings.js';
import './gatekeeper.css';

/*
 * THE GATE — Haris the Gatekeeper.
 *
 * Replaces Matrix Reasoning (2026-08-20). Raven's matrices ask you to SPOT a
 * pattern in something already laid out; this asks you to FIND one by testing.
 * You may spend a few probes on a tray of travellers, watch Haris stamp each
 * IN or OUT, and then send the single traveller from a trio that his secret law
 * will admit. Rule induction by active hypothesis testing — the Wason 2-4-6 and
 * Zendo family — which the reasoning domain previously measured nowhere.
 *
 * ── THE SECOND MEASURE, AND WHY IT IS KEPT SEPARATE ──────────────────────
 * Accuracy alone would waste what this game uniquely sees. Because the engine
 * holds the whole hypothesis space (data.js), it knows how much each probe the
 * player CHOSE actually narrowed it. A player who only tests travellers they
 * expect to be admitted is confirming rather than testing, and learns far less
 * per probe — that is confirmation bias, measurable directly, and two players
 * with identical accuracy can differ sharply on it.
 *
 * It is reported BESIDE accuracy and never folded into it, for the reason
 * CLAUDE.md gives for keeping Intercept's three measures apart: a single blended
 * score hides which thing the player is actually good at.
 *
 * ⚠ There is no clock anywhere in this game, deliberately. Thinking longer is
 * the correct play, and audit:pacing exists in this repo because three games had
 * already traded their construct for a stopwatch.
 */

const SEALS = 3;

export function GatekeeperEngine({
  mode, level, seed, onResult, onExit, isAr, playSfx, awardPoints, cosmos = false,
}) {
  const t = isAr ? T.ar : T.en;
  const lang = isAr ? 'ar' : 'en';
  const rng = useMemo(() => (seed != null ? makeRng(seed) : Math.random), [seed]);

  const stageRef = useRef(0);
  const roundsRef = useRef(0);
  const bestRef = useRef(0);
  const ppClearedRef = useRef(0);
  const trialLogRef = useRef(null);
  const askedAtRef = useRef(0);
  // running totals for the strategy measure
  const infoRef = useRef({ sum: 0, n: 0 });

  const [gate, setGate] = useState(null);
  const [gateNo, setGateNo] = useState(1);
  const [totalGates, setTotalGates] = useState(3);
  const [phase, setPhase] = useState('probe');   // probe | tribute | judged
  const [stamped, setStamped] = useState([]);    // [{ card, ok }] in probe order
  const [pick, setPick] = useState(null);        // tribute index
  const [judged, setJudged] = useState(null);    // { ok }
  const [seals, setSeals] = useState(SEALS);
  const [cleared, setCleared] = useState(0);
  const [lensLeft, setLensLeft] = useState(1);
  const [lensSaid, setLensSaid] = useState(null);
  const [done, setDone] = useState(false);

  const handleExit = useCallback(() => {
    if (mode === 'free') {
      trialLogRef.current?.finish({ rounds: roundsRef.current, best: bestRef.current });
      trialLogRef.current = null;
    }
    onExit();
  }, [mode, onExit]);
  const pause = useGamePause({ isAr, playSfx, onQuit: handleExit });

  const cfgFor = useCallback(() => {
    if (mode === 'levels') return levelCfg(level);
    if (mode === 'passplay') return level ? levelCfg(level) : passCfg();
    return survivalCfg(stageRef.current);
  }, [mode, level]);

  /*
   * The hypothesis space is rebuilt per gate and handed to buildGate, because
   * enumerating it is the expensive part and every gate in a level shares the
   * same config. It is also what the live "possibilities left" counter reads.
   */
  const dealGate = useCallback(() => {
    const cfg = cfgFor();
    let space = ruleSpace(cfg);
    let g = buildGate(rng, { ...cfg, _space: space });
    if (!g) {
      // A config that cannot deal is a dead level. validate:gatekeeper asserts
      // this path is never needed in practice; it exists so it can never be
      // fatal. ⚠ The fallback's space must travel WITH it — `alive` is computed
      // against gate.space, and pairing a simple law with the full space would
      // report possibilities the gate can no longer pose.
      const plain = { ...cfg, pool: ['pos1', 'neg1'], fill: false, probes: Math.max(4, cfg.probes) };
      space = ruleSpace(plain);
      g = buildGate(rng, { ...plain, _space: space });
    }
    setGate(g ? { ...g, space } : null);
    setStamped([]);
    setPick(null);
    setJudged(null);
    setPhase('probe');
    setLensSaid(null);
    askedAtRef.current = typeof performance !== 'undefined' ? performance.now() : Date.now();
    return g;
  }, [cfgFor, rng]);

  useEffect(() => {
    const cfg = cfgFor();
    setTotalGates(cfg.gates || 3);
    setLensLeft(cfg.lenses ?? 1);
    setSeals(cfg.seals ?? SEALS);
    dealGate();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  useEffect(() => {
    trialLogRef.current?.discard();
    trialLogRef.current = createTrialLog({ game: 'gatekeeper', mode, meta: { level } });
    return () => { trialLogRef.current?.discard(); trialLogRef.current = null; };
  }, [mode, level]);

  /*
   * How many laws are still consistent with everything stamped so far. This is
   * the honest state of the player's knowledge, and showing it is the single
   * thing that makes the probe choice legible rather than mystical — you can
   * watch a good probe halve the field and a lazy one barely move it.
   */
  const alive = useMemo(() => {
    if (!gate?.space) return [];
    return survivors(gate.space, stamped.map((s) => s.card), stamped.map((s) => s.ok));
  }, [gate, stamped]);

  const probesUsed = stamped.length;
  const probesLeft = gate ? Math.max(0, gate.probes - probesUsed) : 0;

  const doProbe = (card) => {
    if (!gate || phase !== 'probe' || probesLeft <= 0) return;
    if (stamped.some((s) => cardKey(s.card) === cardKey(card))) return;
    const ok = lawHolds(gate.law, card);
    const before = alive.length;
    const after = survivors(gate.space, [...stamped.map((s) => s.card), card], [...stamped.map((s) => s.ok), ok]).length;
    infoRef.current.sum += informationOf(before, after);
    infoRef.current.n += 1;
    setStamped((s) => [...s, { card, ok }]);
    playSfx?.(ok ? 'win' : 'click');
  };

  const useLens = () => {
    if (!gate || lensLeft <= 0) return;
    playSfx?.('click');
    setLensLeft((n) => n - 1);
    setLensSaid(attrWords(gate.attrs, lang).join(isAr ? ' و' : ' and '));
  };

  const sendTribute = () => {
    if (!gate || phase !== 'tribute' || pick == null) return;
    const ok = pick === gate.answerIdx;
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    trialLogRef.current?.trial({
      ok,
      law: gate.law.kind,
      probesUsed,
      probesGranted: gate.probes,
      // the strategy measure, kept as its own field — never folded into `ok`
      sharpness: infoRef.current.n ? infoRef.current.sum / infoRef.current.n : 0,
      spaceSize: gate.spaceSize,
      aliveAtChoice: alive.length,
      lensUsed: (gate.lenses ?? 1) - lensLeft,
      rt: Math.max(0, Math.round(now - askedAtRef.current)),
    });
    setJudged({ ok });
    setPhase('judged');
    if (ok) { setCleared((c) => c + 1); playSfx?.('win'); }
    else { setSeals((s) => s - 1); playSfx?.('error'); }
  };

  const advance = () => {
    playSfx?.('click');
    const lost = seals <= 0;
    if (lost || gateNo >= totalGates) { setDone(true); return; }
    setGateNo((n) => n + 1);
    dealGate();
  };

  const finishRun = useCallback(() => {
    playSfx?.('click');
    const won = seals > 0 && levelPassed(cleared, totalGates);
    const sharp = infoRef.current.n ? infoRef.current.sum / infoRef.current.n : 0;
    if (mode === 'levels') {
      trialLogRef.current?.finish({ won, score: cleared, level, sharpness: sharp });
      trialLogRef.current = null;
      onResult({ won, score: cleared, summary: t.gatesCleared(cleared, totalGates) });
      return;
    }
    if (mode === 'passplay') {
      ppClearedRef.current += cleared;
      trialLogRef.current?.finish({ score: ppClearedRef.current, rounds: gateNo });
      trialLogRef.current = null;
      onResult({ score: ppClearedRef.current });
      return;
    }
    // Survival: one gate a round, so the ladder moves every gate.
    roundsRef.current += 1;
    if (cleared > 0) { stageRef.current += 1; awardPoints?.(3); }
    else stageRef.current = Math.max(0, stageRef.current - 1);
    bestRef.current = Math.max(bestRef.current, stageRef.current);
    // ⚠ EVERY per-gate budget has to be restocked here. The mount effect above
    // runs exactly once — survival is one continuous mount, because ModeShell
    // holds freeSeedRef steady for the whole run so the engine's key never
    // changes. lensLeft was missing from this list, so the Lens went dead from
    // round 2 to the end of an endless run, and lensUsed then banked a lens
    // spent on every gate where the button was disabled.
    // Read stageRef AFTER the ladder moves, so this is the incoming gate's cfg.
    const nextCfg = cfgFor();
    setCleared(0);
    setGateNo(1);
    setSeals(nextCfg.seals ?? SEALS);
    setLensLeft(nextCfg.lenses ?? 1);
    setDone(false);
    dealGate();
  }, [mode, seals, cleared, totalGates, onResult, t, playSfx, awardPoints, level, dealGate, cfgFor, gateNo]);

  const cfg = cfgFor();
  const fam = FAMILY[lang][familyIndex(cfg.lv ?? level ?? 1)];
  const hudSub = mode === 'levels'
    ? (isAr ? `مستوى ${level}` : `Level ${level}`)
    : mode === 'passplay'
      ? `✓${ppClearedRef.current}`
      : (isAr
        ? `بوابة ${roundsRef.current + 1} · أفضل ${bestRef.current}`
        : `Gate ${roundsRef.current + 1} · best ${bestRef.current}`);

  if (!gate) {
    return <div className={`gk-root${cosmos ? ' gk-root--cosmos' : ''}`} dir={isAr ? 'rtl' : 'ltr'} />;
  }

  /* ── the run is over ── */
  if (done) {
    const sharp = infoRef.current.n ? infoRef.current.sum / infoRef.current.n : 0;
    return (
      <div className={`gk-root${cosmos ? ' gk-root--cosmos' : ''}`} dir={isAr ? 'rtl' : 'ltr'}>
        <Header t={t} sub={hudSub} pause={pause} cosmos={cosmos} isAr={isAr} playSfx={playSfx} />
        {pause.modal}
        <div className="gk-body">
          <div className="gk-card">
            <div className="gk-verdict-big">
              {seals <= 0 ? t.gateLost : cleared === totalGates ? t.allGates : t.gatesCleared(cleared, totalGates)}
            </div>
            {seals <= 0 && <p className="gk-hint">{t.gateLostBody}</p>}
            <dl className="gk-metrics">
              <div>
                <dt>{t.resAccuracy}</dt>
                <dd>{cleared}/{totalGates}</dd>
              </div>
              <div>
                <dt>{t.resSharp}</dt>
                <dd>{Math.round(sharp * 100)}%</dd>
              </div>
            </dl>
            <p className="gk-means">{t.resSharpMeans}</p>
          </div>
          <button type="button" className="gk-primary" onClick={finishRun}>{t.cont}</button>
        </div>
      </div>
    );
  }

  const stampedKeys = new Set(stamped.map((s) => cardKey(s.card)));

  return (
    <div className={`gk-root${cosmos ? ' gk-root--cosmos' : ''}`} dir={isAr ? 'rtl' : 'ltr'}>
      <Header t={t} sub={hudSub} pause={pause} cosmos={cosmos} isAr={isAr} playSfx={playSfx} />
      {pause.modal}

      <div className="gk-body">
        <div className="gk-card">
          {/* gate counter · seals */}
          <div className="gk-hud">
            <span>{t.gateOf(gateNo, totalGates)}</span>
            <span className="gk-seals" aria-label={`${t.seals}: ${seals}`}>
              {Array.from({ length: SEALS }).map((_, i) => (
                <i key={i} className={i < seals ? 'gk-seal' : 'gk-seal gk-seal--off'} />
              ))}
            </span>
          </div>

          <p className="gk-family">
            <b>{fam.name}</b>
            <small>{fam.sub}</small>
          </p>

          {/* Haris and his verdict */}
          <Haris
            mood={
              phase === 'judged' ? (judged?.ok ? 'happy' : 'grim')
                : stamped.length ? (stamped[stamped.length - 1].ok ? 'happy' : 'grim')
                  : 'idle'
            }
          />
          <div
            className={`gk-led${
              phase === 'judged' ? (judged?.ok ? ' gk-led--yes' : ' gk-led--no')
                : stamped.length ? (stamped[stamped.length - 1].ok ? ' gk-led--yes' : ' gk-led--no') : ''
            }`}
          >
            {phase === 'judged'
              ? (judged?.ok ? t.passed : t.barred)
              : stamped.length
                ? (stamped[stamped.length - 1].ok ? t.admitted : t.refused)
                : t.waiting}
          </div>

          {phase === 'probe' && (
            <>
              <div className="gk-toolrow">
                <span className="gk-chip">{t.probesLeft(probesLeft)}</span>
                <button
                  type="button"
                  className="gk-lens"
                  onClick={useLens}
                  disabled={lensLeft <= 0}
                >
                  ◉ {lensLeft > 0 ? t.lens : t.lensSpent}
                </button>
              </div>
              {lensSaid && <p className="gk-lenssay">{t.lensSays(lensSaid)}</p>}

              <h2 className="gk-h2">{t.probeTitle}</h2>
              <p className="gk-hint">{t.probeHint}</p>

              <div className="gk-tray">
                {gate.tray.map((c) => {
                  const k = cardKey(c);
                  const rec = stamped.find((s) => cardKey(s.card) === k);
                  return (
                    <button
                      key={k}
                      type="button"
                      className={`gk-trav${rec ? (rec.ok ? ' gk-trav--in' : ' gk-trav--out') : ''}`}
                      disabled={!!rec || probesLeft <= 0}
                      onClick={() => doProbe(c)}
                      aria-label={describe(c, t, isAr)}
                    >
                      <PlanetFolk card={c} size={54} name isAr={isAr} dim={!!rec} />
                      {rec && (
                        <span className={`gk-stamp ${rec.ok ? 'gk-stamp--in' : 'gk-stamp--out'}`}>
                          {rec.ok ? t.stampIn : t.stampOut}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* the honest state of what is known */}
              <p className="gk-alive">
                {isAr
                  ? `${alive.length} قانوناً ما زال ممكناً`
                  : `${alive.length} law${alive.length === 1 ? '' : 's'} still possible`}
              </p>

              <button type="button" className="gk-primary" onClick={() => { playSfx?.('click'); setPhase('tribute'); }}>
                {t.ready}
              </button>
            </>
          )}

          {phase !== 'probe' && (
            <>
              <h2 className="gk-h2">{t.tribute}</h2>
              {phase === 'tribute' && <p className="gk-hint">{t.tributeHint}</p>}

              <div className="gk-trio">
                {gate.trio.map((c, i) => (
                  <button
                    key={cardKey(c)}
                    type="button"
                    className={`gk-trav gk-trav--big${
                      pick === i && phase === 'tribute' ? ' gk-trav--picked' : ''
                    }${phase === 'judged' && i === gate.answerIdx ? ' gk-trav--right' : ''}${
                      phase === 'judged' && pick === i && i !== gate.answerIdx ? ' gk-trav--wrong' : ''
                    }`}
                    disabled={phase !== 'tribute'}
                    onClick={() => { playSfx?.('click'); setPick(i); }}
                    aria-label={describe(c, t, isAr)}
                    aria-pressed={pick === i}
                  >
                    <PlanetFolk card={c} size={68} name isAr={isAr} />
                    {phase === 'judged' && i === gate.answerIdx && (
                      <span className="gk-stamp gk-stamp--in">{t.stampIn}</span>
                    )}
                  </button>
                ))}
              </div>

              {phase === 'judged' && (
                <div className="gk-reveal">
                  <span className="gk-reveal-label">{t.theLaw}</span>
                  <p className="gk-law">{`“${lawText(gate.law, lang)}”`}</p>
                  {!judged?.ok && <p className="gk-hint">{t.sealCracks}</p>}
                </div>
              )}
            </>
          )}
        </div>

        {phase === 'tribute' && (
          <button
            type="button"
            className={`gk-primary${pick == null ? ' gk-primary--off' : ''}`}
            disabled={pick == null}
            onClick={sendTribute}
          >
            {t.tribute}
          </button>
        )}
        {phase === 'judged' && (
          <button type="button" className="gk-primary" onClick={advance}>
            {seals <= 0 || gateNo >= totalGates ? t.cont : t.nextGate}
          </button>
        )}
      </div>
    </div>
  );
}

/*
 * A screen-reader sentence for one traveller — ALL FOUR attributes in words.
 *
 * The button's own aria-label wins over the SVG's, so the folk name has to be
 * repeated here or a screen-reader user loses the one attribute that is
 * otherwise carried by hue.
 */
function describe(c, t, isAr) {
  const parts = [
    folkName(c.folk, isAr),
    t.shapeLabel[c.shape],
    t.moonsLabel(c.moons),
    t.fillLabel[c.fill],
  ];
  return isAr ? parts.join('، ') : parts.join(', ');
}

/*
 * Haris himself — a big stone-blue planet in an archway. Drawn here rather than
 * imported for the same reason the travellers are: art referenced from src but
 * never git-added builds green and 404s in production.
 */
function Haris({ mood }) {
  const eyes = mood === 'happy'
    ? <path d="M52 44q4-5 8 0M72 44q4-5 8 0" stroke="var(--gk-ink)" strokeWidth="2.6" fill="none" strokeLinecap="round" />
    : mood === 'grim'
      ? (
        <>
          <circle cx="56" cy="45" r="3" fill="var(--gk-ink)" />
          <circle cx="76" cy="45" r="3" fill="var(--gk-ink)" />
          <path d="M50 39l9 3M82 39l-9 3" stroke="var(--gk-ink)" strokeWidth="2.4" strokeLinecap="round" />
        </>
      )
      : (
        <>
          <circle cx="56" cy="45" r="3.2" fill="var(--gk-ink)" />
          <circle cx="76" cy="45" r="3.2" fill="var(--gk-ink)" />
        </>
      );
  const mouth = mood === 'happy'
    ? <path d="M56 55q10 8 20 0" stroke="var(--gk-ink)" strokeWidth="2.6" fill="none" strokeLinecap="round" />
    : mood === 'grim'
      ? <path d="M57 59q9-6 18 0" stroke="var(--gk-ink)" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      : <path d="M58 57h16" stroke="var(--gk-ink)" strokeWidth="2.6" strokeLinecap="round" />;

  return (
    <svg viewBox="0 0 132 84" className="gk-haris" role="img" aria-hidden="true">
      {/* the archway */}
      <path d="M14 80V40q52-38 104 0v40" fill="none" stroke="var(--gk-arch)" strokeWidth="6" />
      <path d="M28 80V46q38-27 76 0v34" fill="var(--gk-arch-fill)" />
      {/* the keeper */}
      <circle cx="66" cy="48" r="21" fill="var(--gk-keeper)" stroke="var(--gk-ink)" strokeWidth="2.6" />
      <path d="M50 32l-6-9M82 32l6-9" stroke="var(--gk-keeper)" strokeWidth="4" strokeLinecap="round" />
      {eyes}
      {mouth}
    </svg>
  );
}

function Header({ t, sub, pause, cosmos, isAr, playSfx }) {
  return (
    <TrainingPlayHeader
      isAr={isAr}
      playSfx={playSfx}
      title={t.title}
      subtitle={sub}
      onMenu={cosmos ? undefined : pause.requestQuit}
      menuAriaLabel={t.menu}
      onPause={pause.open ? undefined : pause.start}
      pauseAriaLabel={pause.labels.paused}
      style={cosmos ? { background: 'transparent', paddingTop: 52 } : undefined}
    />
  );
}

export default function GatekeeperGame({ onBack, workoutMode = false }) {
  const { currentLang, playSfx, awardPoints } = useApp();
  const isAr = currentLang === 'ar';
  return (
    <ModeShell
      storageKey="mm_reason_gatekeeper_v1"
      scienceId="gatekeeper"
      title={{ en: 'The Gate', ar: 'البوابة' }}
      hints={{
        free: { en: 'Endless gates · the laws grow slyer', ar: 'بوابات بلا نهاية · تزداد القوانين مكراً' },
        levels: { en: '50 levels · a new kind of law every 10', ar: '٥٠ مستوى · قانون جديد كل ١٠' },
        pass: { en: 'Same gates for all · most cleared wins', ar: 'نفس البوابات للجميع · الأكثر عبوراً يفوز' },
      }}
      /* ONE LADDER — no easy/med/hard. See data.js LADDER. */
      ladder={{ levels: LADDER_LEVELS }}
      pass={{ trials: 1, scoreLabel: { en: 'gates', ar: 'بوابات' }, lowerBetter: false }}
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      workoutMode={workoutMode}
      renderEngine={(p) => (
        <GatekeeperEngine
          key={`${p.mode}-${p.diff}-${p.level}-${p.seed}`}
          {...p}
          isAr={isAr}
          playSfx={playSfx}
          awardPoints={awardPoints}
        />
      )}
    />
  );
}
