import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';
import { makeRng } from '../../../../shared/rng';
import { STR_COMMON } from '../../../../shared/trainingStrings';
import { createTrialLog } from '../../../../shared/trialLog';
import { useGamePause } from '../../../../shared/useGamePause';
import { TrainingPlayHeader } from '../../../../shared/TrainingChrome';
import { startCanvasLoop } from '../../../../shared/canvasLoop';
import { assetUrl } from '../../../../../../lib/assetUrl';
import {
  HEARTS, KINDS, STRIKE_AT,
  buildWave, dueAt, isHidden, levelCfg, levelPassed, passCfg,
  progressAt, scoreStrike, summarise, survivalCfg,
} from './data.js';
import './intercept.css';

/*
 * INTERCEPT — Rift Defense.  [speed]
 *
 * Ships come down the lanes. Partway they cross a cover band and vanish. Tap
 * the lane at the exact instant one reaches the strike line — which you never
 * see it do. The measure is a signed error in milliseconds, early or late.
 *
 * ── REBUILT AS A WAVE GAME (2026-08-17) ───────────────────────────────────
 * The previous version was one countdown, one mover, ONE TAP, then dead air —
 * and between sectors it opened a SHOP that sold +80ms of visibility and +12ms
 * of hit window while the stage reached fed the speed rating. So the player
 * could buy a better score, which in a measurement app is backwards. The shop
 * is gone and nothing replaces it: difficulty comes only from the wave, and the
 * wave is checked by validate:intercept.
 *
 * Now several ships are in flight at once, in different lanes, coming due at
 * different moments. That is the same construct under load — predicting one
 * hidden arrival is the skill; holding three forward models and acting on each
 * as it comes due is that skill stretched. It is also, finally, something to
 * DO continuously rather than a trial and a wait.
 *
 * ⚠ The hot loop reads refs, never React state. A canvas game that re-renders
 * to animate will drop frames on the phones this has to run on, and a dropped
 * frame in a timing game is a measurement error.
 */

const ART_URLS = {
  steady: assetUrl('Assets/training/cancel-cosmic-atlas-2026/comet.webp'),
  accel: assetUrl('Assets/training/cancel-cosmic-atlas-2026/space-fighter.webp'),
  decel: assetUrl('Assets/training/cancel-cosmic-atlas-2026/quantum-shard.webp'),
  gate: assetUrl('Assets/training/cancel-cosmic-atlas-2026/warp-gate.webp'),
  burst: assetUrl('Assets/training/cancel-cosmic-atlas-2026/supernova.webp'),
};
const ART = {};
function preloadArt() {
  for (const [k, src] of Object.entries(ART_URLS)) {
    if (ART[k]) continue;
    const img = new Image();
    img.src = src;
    ART[k] = img;
  }
}

const UI = {
  en: {
    ...STR_COMMON.en,
    title: 'Intercept',
    hintFree: 'Rift Defense — endless waves, the front widens',
    hintLevels: '3 difficulties · 100 levels each',
    hintPass: 'Same waves for everyone · pass the device',
    brief: 'Ships cross the cover and vanish. Tap the lane the moment one reaches the line.',
    wave: (n, m) => `Wave ${n} of ${m}`,
    waveEndless: (n) => `Wave ${n}`,
    incoming: 'Incoming',
    waveCleared: 'Wave cleared',
    gateLost: 'The gate fell',
    begin: 'Defend the gate',
    nextWave: 'Next wave ›',
    early: 'EARLY',
    late: 'LATE',
    perfect: 'PERFECT',
    hit: 'HIT',
    through: 'THROUGH',
    tapHint: 'Tap the lane, not the ship',
    // results
    resHits: 'struck',
    resPerfect: 'perfect',
    resBias: 'your timing',
    resSpread: 'consistency',
    biasEarly: (n) => `${n}ms early`,
    biasLate: (n) => `${n}ms late`,
    biasEven: 'dead on',
    spreadNote: 'Lower is steadier. Consistency matters more than speed here.',
    cleared: 'Gate held.',
    failed: 'The gate fell.',
    kindsSeen: 'Ships in this wave',
  },
  ar: {
    ...STR_COMMON.ar,
    title: 'الاعتراض',
    hintFree: 'دفاع الشق — موجات بلا نهاية، وتتّسع الجبهة',
    hintLevels: '٣ صعوبات · ١٠٠ مستوى لكل',
    hintPass: 'نفس الموجات للجميع · مرّر الجهاز',
    brief: 'تعبر السفن الغطاء فتختفي. المس المسار في اللحظة التي تبلغ فيها الخط.',
    wave: (n, m) => `الموجة ${n} من ${m}`,
    waveEndless: (n) => `الموجة ${n}`,
    incoming: 'قادمة',
    waveCleared: 'صُدّت الموجة',
    gateLost: 'سقطت البوابة',
    begin: 'دافع عن البوابة',
    nextWave: 'الموجة التالية ›',
    early: 'مبكر',
    late: 'متأخر',
    perfect: 'مثالي',
    hit: 'إصابة',
    through: 'عبرت',
    tapHint: 'المس المسار لا السفينة',
    resHits: 'أُصيبت',
    resPerfect: 'مثالية',
    resBias: 'ميل توقيتك',
    resSpread: 'الثبات',
    biasEarly: (n) => `${n}م.ث مبكراً`,
    biasLate: (n) => `${n}م.ث متأخراً`,
    biasEven: 'في الصميم',
    spreadNote: 'الأقل أثبت. الثبات هنا أهم من السرعة.',
    cleared: 'صمدت البوابة.',
    failed: 'سقطت البوابة.',
    kindsSeen: 'سفن هذه الموجة',
  },
};

export function InterceptEngine({
  mode, diff, level, seed, attempt, onResult, onExit, isAr, playSfx, awardFreeRun,
}) {
  const t = isAr ? UI.ar : UI.en;
  const lang = isAr ? 'ar' : 'en';

  const [step, setStep] = useState('brief');     // brief | run | between | over
  const [waveNo, setWaveNo] = useState(1);
  const [hearts, setHearts] = useState(HEARTS);
  const [stage, setStage] = useState(0);         // survival only
  const [waveStat, setWaveStat] = useState(null);
  const [over, setOver] = useState(null);

  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const shipsRef = useRef([]);
  const t0Ref = useRef(0);
  const heartsRef = useRef(HEARTS);
  const strikesRef = useRef([]);          // every scored strike this run
  const waveStrikesRef = useRef([]);      // …and this wave
  const flashRef = useRef([]);            // transient lane feedback
  const trialLogRef = useRef(null);
  const pausedRef = useRef(false);
  const sizeRef = useRef({ w: 0, h: 0 });

  const cfg = useMemo(
    () => (mode === 'free' ? survivalCfg(stage) : mode === 'passplay' ? passCfg() : levelCfg(diff, level)),
    [mode, stage, diff, level],
  );

  const rng = useMemo(
    () => makeRng(`${seed}-${mode}-${diff}-${level}-${stage}-${waveNo}-${attempt}`),
    [seed, mode, diff, level, stage, waveNo, attempt],
  );

  const handleExit = useCallback(() => {
    trialLogRef.current?.discard();
    trialLogRef.current = null;
    onExit?.();
  }, [onExit]);
  const pause = useGamePause({
    isAr,
    playSfx,
    onQuit: handleExit,
    onPause: () => { pausedRef.current = true; },
    onResume: () => { pausedRef.current = false; },
  });

  useEffect(() => { preloadArt(); }, []);
  useEffect(() => {
    trialLogRef.current = createTrialLog({ game: 'intercept', mode, meta: { diff, level } });
    return () => { trialLogRef.current?.discard(); trialLogRef.current = null; };
  }, [mode, diff, level]);

  /* ── start a wave ─────────────────────────────────────────────────────── */
  const startWave = useCallback(() => {
    shipsRef.current = buildWave(rng, cfg, waveNo);
    waveStrikesRef.current = [];
    flashRef.current = [];
    t0Ref.current = performance.now();
    setStep('run');
  }, [rng, cfg, waveNo]);

  /* ── the strike ───────────────────────────────────────────────────────── */
  const strikeLane = useCallback((lane) => {
    if (step !== 'run' || pausedRef.current) return;
    const now = performance.now() - t0Ref.current;
    // the ship in this lane closest to being due, that is still live
    const live = shipsRef.current.filter((s) => s.lane === lane && !s.struck && !s.missed);
    if (!live.length) return;
    let best = live[0];
    for (const s of live) if (Math.abs(dueAt(s) - now) < Math.abs(dueAt(best) - now)) best = s;
    // a tap nowhere near anything is not a miss on a ship, it is just a tap
    if (Math.abs(dueAt(best) - now) > best.tol + 700) return;

    const res = scoreStrike(best, now);
    best.struck = true;
    best.result = res;
    strikesRef.current.push(res);
    waveStrikesRef.current.push(res);
    trialLogRef.current?.trial({
      ok: res.hit,
      err: Math.round(res.err),
      kind: best.kind,
      warp: best.warp !== 1,
      tol: best.tol,
      rt: Math.round(now),
    });
    flashRef.current.push({
      lane,
      at: now,
      label: res.perfect ? t.perfect : res.hit ? t.hit : res.early ? t.early : t.late,
      good: res.hit,
    });
    playSfx?.(res.hit ? 'win' : 'error');
    if (!res.hit) loseHeart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, t, playSfx]);

  const loseHeart = useCallback(() => {
    heartsRef.current -= 1;
    setHearts(heartsRef.current);
    if (heartsRef.current <= 0) endRun(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
   * ⚠ ONE-WAY LATCH. The frame that marks the last ship "through" can also be
   * the frame that finds the wave empty — so endRun(false) used to set
   * step='over' and then the wave-over branch below set step='between' in the
   * SAME call. React batches, the later write won, and the gate falling on the
   * final ship rendered as "Wave cleared" with three spent hearts. Seen live.
   */
  const overRef = useRef(false);
  const endRun = useCallback((held) => {
    if (overRef.current) return;
    overRef.current = true;
    cancelAnimationFrame(rafRef.current);
    const s = summarise(strikesRef.current);
    setOver({ held, ...s });
    setStep('over');
    if (mode === 'free') awardFreeRun?.('intercept', stage);
     
  }, [mode, stage, awardFreeRun]);

  /* ── the loop ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (step !== 'run') return undefined;
    const wrap = wrapRef.current;
    const cv = canvasRef.current;
    if (!wrap || !cv) return undefined;
    const ctx = cv.getContext('2d');

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeRef.current = { w, h };
    };

    const frame = () => {
      if (step !== 'run') return false;
      const { w, h } = sizeRef.current;
      if (!w || !h) return true;
      const now = pausedRef.current ? -1 : performance.now() - t0Ref.current;
      const cs = getComputedStyle(cv);
      const tok = (n, f) => (cs.getPropertyValue(n) || '').trim() || f;

      ctx.clearRect(0, 0, w, h);

      const laneW = w / cfg.lanes;
      const strikeY = h * STRIKE_AT;
      const coverTop = h * 0.30;
      const coverBot = h * 0.66;

      // lanes
      ctx.strokeStyle = tok('--line', '#b0a48d');
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = 1;
      for (let i = 1; i < cfg.lanes; i++) {
        ctx.beginPath(); ctx.moveTo(i * laneW, 0); ctx.lineTo(i * laneW, h); ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // the cover band — the reason the game is a prediction and not a reaction
      const grd = ctx.createLinearGradient(0, coverTop, 0, coverBot);
      /* ⚠ --game-ink, and NOT the palette's "deep surface" token. That one reads
         better semantically for a band and is wrong: audit:design reserves the
         deep-surface family for an allow-list of ADDITIVE-BLENDED games, and
         Intercept is a plain 2D canvas. The ratchet caught the swap in CI.
         --game-ink is the near-black of the same tide palette, so the band looks
         identical and stays inside the system.

         (Naming that token here in prose re-fails the gate — the detector greps
         the file and cannot tell a warning about a token from a use of it. Same
         shape as the review board firing on a comment that criticised a claim.) */
      const cov = tok('--game-ink', '#131e28');
      grd.addColorStop(0, 'transparent');
      grd.addColorStop(0.25, cov);
      grd.addColorStop(0.75, cov);
      grd.addColorStop(1, 'transparent');
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = grd;
      ctx.fillRect(0, coverTop, w, coverBot - coverTop);
      ctx.globalAlpha = 1;

      // strike line
      ctx.strokeStyle = tok('--game-accent', '#d4952f');
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 8]);
      ctx.beginPath(); ctx.moveTo(0, strikeY); ctx.lineTo(w, strikeY); ctx.stroke();
      ctx.setLineDash([]);

      // ships
      if (now >= 0) {
        for (const s of shipsRef.current) {
          if (s.struck) continue;
          const u = progressAt(s, now);
          if (u <= 0) continue;
          // a ship that sailed past the line without a strike is through
          if (!s.missed && now > dueAt(s) + s.tol) {
            s.missed = true;
            // BOTH logs: the run's, and this wave's. Missing the second made the
            // between-wave panel read "0/0 struck" for a wave that sent four.
            const gone = { err: s.tol + 1, hit: false, perfect: false, early: false };
            strikesRef.current.push(gone);
            waveStrikesRef.current.push(gone);
            flashRef.current.push({ lane: s.lane, at: now, label: t.through, good: false });
            playSfx?.('error');
            loseHeart();
          }
          if (u >= 1) continue;
          if (isHidden(s, now)) continue;
          const x = s.lane * laneW + laneW / 2;
          const y = u * h;
          const img = ART[s.art];
          const size = Math.min(laneW * 0.62, 54);
          if (img && img.complete && img.naturalWidth) {
            ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
          } else {
            ctx.fillStyle = tok('--game-item', '#4a8cba');
            ctx.beginPath(); ctx.arc(x, y, size * 0.32, 0, 6.2832); ctx.fill();
          }
        }
      }

      // lane flashes
      flashRef.current = flashRef.current.filter((f) => now - f.at < 620);
      for (const f of flashRef.current) {
        const age = (now - f.at) / 620;
        ctx.globalAlpha = (1 - age) * 0.85;
        ctx.fillStyle = f.good ? tok('--game-ok', '#3f7d63') : tok('--game-bad', '#a8564d');
        ctx.fillRect(f.lane * laneW, strikeY - 5, laneW, 10);
        ctx.globalAlpha = 1 - age;
        ctx.font = '700 15px Outfit, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(f.label, f.lane * laneW + laneW / 2, strikeY - 18);
      }
      ctx.globalAlpha = 1;

      // wave over?  (never past the latch — see endRun)
      if (now >= 0 && !overRef.current) {
        const live = shipsRef.current.some((s) => !s.struck && !s.missed);
        const lastDue = shipsRef.current.reduce((mx, s) => Math.max(mx, dueAt(s)), 0);
        if (!live && now > lastDue + 400) {
          const st = summarise(waveStrikesRef.current);
          setWaveStat(st);
          if (mode === 'free') {
            setStage((v) => v + 1);
            setWaveNo((v) => v + 1);
            setStep('between');
          } else if (waveNo >= cfg.waves) {
            endRun(true);
          } else {
            setWaveNo((v) => v + 1);
            setStep('between');
          }
          return false;
        }
      }
      return true;
    };

    const stop = startCanvasLoop({ wrap, rafRef, resize, frame });
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, cfg.lanes, waveNo]);

  /* ── finish ───────────────────────────────────────────────────────────── */
  const finish = useCallback(() => {
    playSfx?.('click');
    const s = summarise(strikesRef.current);
    if (mode === 'levels') {
      trialLogRef.current?.finish({ won: levelPassed(heartsRef.current), score: s.hits, level, diff });
      trialLogRef.current = null;
      onResult?.({ won: levelPassed(heartsRef.current), score: s.hits, summary: `${s.hits}/${s.total}` });
      return;
    }
    if (mode === 'passplay') {
      trialLogRef.current?.finish({ score: s.hits });
      trialLogRef.current = null;
      onResult?.({ score: s.hits });
      return;
    }
    trialLogRef.current?.finish({ best: stage, hits: s.hits });
    trialLogRef.current = null;
    onExit?.();
  }, [mode, level, diff, onResult, onExit, playSfx, stage]);

  const hudSub = mode === 'levels'
    ? (isAr ? `مستوى ${level}` : `Level ${level}`)
    : mode === 'free'
      ? t.waveEndless(waveNo)
      : t.wave(Math.min(waveNo, cfg.waves), cfg.waves);

  const biasText = (b) => (Math.abs(b) <= 12 ? t.biasEven : b < 0 ? t.biasEarly(Math.abs(b)) : t.biasLate(b));

  return (
    <div className="ic-root" dir={isAr ? 'rtl' : 'ltr'}>
      <TrainingPlayHeader
        isAr={isAr}
        playSfx={playSfx}
        title={t.title}
        subtitle={hudSub}
        onMenu={pause.requestQuit}
        menuAriaLabel={t.menu}
        onPause={step === 'run' && !pause.open ? pause.start : undefined}
        pauseAriaLabel={t.paused}
      />
      {pause.modal}

      {/* hearts */}
      {(step === 'run' || step === 'between') && (
        <div className="ic-hearts" aria-label={`${hearts}`}>
          {Array.from({ length: HEARTS }).map((_, i) => (
            <span key={i} className={`ic-heart${i < hearts ? '' : ' ic-heart--spent'}`}>♥</span>
          ))}
        </div>
      )}

      {step === 'brief' && (
        <div className="ic-panel">
          <h3>{t.title}</h3>
          <p className="ic-brief">{t.brief}</p>
          <p className="ic-kinds-label">{t.kindsSeen}</p>
          <div className="ic-kinds">
            {cfg.kinds.map((k) => (
              <span key={k} className="ic-kind">
                <img src={ART_URLS[KINDS[k].art]} alt="" aria-hidden="true" />
                {KINDS[k][lang]}
              </span>
            ))}
          </div>
          <button type="button" className="ct-training-btn ct-training-btn--pri" onClick={() => { playSfx?.('click'); startWave(); }}>
            {t.begin}
          </button>
        </div>
      )}

      {step === 'run' && (
        <div className="ic-field" ref={wrapRef}>
          <canvas ref={canvasRef} className="ic-canvas" />
          {/* Lane tap targets. Full-height columns so the tap is about WHEN,
              never about hitting a moving thing — this is a timing measure, not
              a pointing one. */}
          <div className="ic-lanes">
            {Array.from({ length: cfg.lanes }).map((_, i) => (
              <button
                key={i}
                type="button"
                className="ic-lane-btn"
                aria-label={`${i + 1}`}
                onPointerDown={(e) => { e.preventDefault(); strikeLane(i); }}
              />
            ))}
          </div>
          <div className="ic-taphint">{t.tapHint}</div>
        </div>
      )}

      {step === 'between' && (
        <div className="ic-panel">
          <h3>{t.waveCleared}</h3>
          {waveStat && (
            <div className="ic-stats">
              <div><b>{waveStat.hits}/{waveStat.total}</b><small>{t.resHits}</small></div>
              <div><b>{waveStat.perfect}</b><small>{t.resPerfect}</small></div>
              <div><b>{biasText(waveStat.bias)}</b><small>{t.resBias}</small></div>
            </div>
          )}
          <button type="button" className="ct-training-btn ct-training-btn--pri" onClick={() => { playSfx?.('click'); startWave(); }}>
            {t.nextWave}
          </button>
        </div>
      )}

      {step === 'over' && over && (
        <div className="ic-panel">
          <h3>{over.held ? t.cleared : t.failed}</h3>
          <div className="ic-stats">
            <div><b>{over.hits}/{over.total}</b><small>{t.resHits}</small></div>
            <div><b>{over.perfect}</b><small>{t.resPerfect}</small></div>
            <div><b>{biasText(over.bias)}</b><small>{t.resBias}</small></div>
            <div><b>±{over.spread}ms</b><small>{t.resSpread}</small></div>
          </div>
          <p className="ic-note">{t.spreadNote}</p>
          <button type="button" className="ct-training-btn ct-training-btn--pri" onClick={finish}>
            {t.cont}
          </button>
        </div>
      )}
    </div>
  );
}

export default function InterceptGame({ onBack, workoutMode = false }) {
  const { currentLang, playSfx, awardFreeRun } = useApp();
  const isAr = currentLang === 'ar';
  return (
    <ModeShell
      storageKey="mm_speed_intercept_v2"
      scienceId="intercept"
      title={{ en: 'Intercept', ar: 'الاعتراض' }}
      hints={{
        free: { en: UI.en.hintFree, ar: UI.ar.hintFree },
        levels: { en: UI.en.hintLevels, ar: UI.ar.hintLevels },
        pass: { en: UI.en.hintPass, ar: UI.ar.hintPass },
      }}
      diffLabels={{ easy: { en: 'Easy', ar: 'سهل' }, med: { en: 'Medium', ar: 'متوسط' }, hard: { en: 'Hard', ar: 'صعب' } }}
      pass={{ trials: 1, scoreLabel: { en: 'struck', ar: 'أُصيبت' }, lowerBetter: false, diff: 'med' }}
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      workoutMode={workoutMode}
      renderEngine={(p) => (
        <InterceptEngine
          key={`${p.mode}-${p.diff}-${p.level}-${p.seed}`}
          {...p}
          isAr={isAr}
          playSfx={playSfx}
          awardFreeRun={awardFreeRun}
        />
      )}
    />
  );
}
