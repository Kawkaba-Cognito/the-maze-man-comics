import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';
import { STR_COMMON } from '../../../../shared/trainingStrings';
import { createTrialLog } from '../../../../shared/trialLog';
import { TrainingPauseModal, TrainingPlayHeader } from '../../../../shared/TrainingChrome';
import {
  ROLE, HIT_DEG, LADDER_LEVELS,
  levelSchedule, survivalSchedule, passSchedule,
  perturb, angularError, targetAngles, aimAngles, summarise, levelPassed,
} from './data';
import './mirrorWorld.css';

/*
 * Mirror World — visuomotor adaptation.  [flexibility]
 *
 * Flick from the home dot to the target. During the middle block the mapping
 * between hand and cursor is rotated, and you recalibrate without deciding to.
 * Then the rotation is removed and the first reaches go wrong THE OTHER WAY.
 *
 * That aftereffect is the game. It is the one measure in the platform where
 * flexibility is not a choice the player makes but a recalibration they undergo,
 * and it cannot be faked — you cannot decide to not have adapted.
 *
 * ⚠ The engine holds NO difficulty knowledge. It reads a block schedule from
 * data.js and applies whatever fields a block carries; unknown fields are
 * ignored by construction. That is what makes new levers (mirror reversal,
 * endpoint-only feedback, more targets) a data change rather than a rewrite.
 */

const LW = 340;                 // logical canvas size; CSS scales it
const CX = LW / 2, CY = LW / 2;
const R = 125;                  // reach radius
const HOME_R = 26;              // how close counts as "at home"

const UI = {
  en: {
    ...STR_COMMON.en,
    title: 'Mirror World',
    hintFree: 'Endless — the twist grows each round',
    hintLevels: '50 levels · a new twist every 10',
    hintPass: 'Same run for everyone · pass the device',
    howTo: 'Press the white dot, then flick out to the gold one in one motion.',
    directionHint: 'No-drag controls: choose an aiming direction',
    targetDirection: (deg) => `Target direction: ${deg} degrees`,
    aimDirection: (deg) => `Aim ${deg} degrees`,
    goHome: 'Back to the white dot',
    blockBase: 'Warm-up',
    blockAdapt: 'Something is off',
    blockWash: 'Back to normal',
    beginBlock: 'Begin',
    reachOf: (i, n) => `${i} / ${n}`,
    resAfter: 'Aftereffect',
    resEarly: 'First hits',
    resLate: 'After practice',
    resBase: 'Warm-up',
    passed: 'You adapted',
    failed: 'Not adapted yet',
    failWhy: 'Keep reaching until the gold dot stops fighting you.',
    runOver: 'Run ended',
    bestRound: (n) => `Best: round ${n}`,
    afterNote: 'Your first reaches after the twist was removed went wrong the other way. Nothing you decided — your aim had quietly rebuilt itself.',
  },
  ar: {
    ...STR_COMMON.ar,
    title: 'عالم المرآة',
    hintFree: 'بلا نهاية — يزداد الالتواء كل جولة',
    hintLevels: '٥٠ مستوى · جديد كل ١٠',
    hintPass: 'نفس الجولة للجميع · مرّر الجهاز',
    howTo: 'اضغط النقطة البيضاء ثم اندفع إلى الذهبية بحركة واحدة.',
    directionHint: 'تحكّم بلا سحب: اختر اتجاه التصويب',
    targetDirection: (deg) => `اتجاه الهدف: ${deg} درجة`,
    aimDirection: (deg) => `صوّب بزاوية ${deg} درجة`,
    goHome: 'عد إلى النقطة البيضاء',
    blockBase: 'إحماء',
    blockAdapt: 'شيء ما تغيّر',
    blockWash: 'عودة إلى الوضع الطبيعي',
    beginBlock: 'ابدأ',
    reachOf: (i, n) => `${i} / ${n}`,
    resAfter: 'الأثر اللاحق',
    resEarly: 'المحاولات الأولى',
    resLate: 'بعد التمرّن',
    resBase: 'الإحماء',
    passed: 'لقد تكيّفت',
    failed: 'لم تتكيّف بعد',
    failWhy: 'واصل حتى تتوقّف النقطة الذهبية عن مقاومتك.',
    runOver: 'انتهت المحاولة',
    bestRound: (n) => `الأفضل: الجولة ${n}`,
    afterNote: 'أول محاولاتك بعد إزالة الالتواء انحرفت في الاتجاه المعاكس. لم تقرّر ذلك — تصويبك كان قد أعاد بناء نفسه بهدوء.',
  },
};

function MirrorEngine({
  mode, level, attempt, onResult, onExit, isAr, playSfx, awardFreeRun,
}) {
  const t = isAr ? UI.ar : UI.en;

  const [stage, setStage] = useState(0);
  const [step, setStep] = useState('block');      // block | reach | over
  const [blockIdx, setBlockIdx] = useState(0);
  const [reachIdx, setReachIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [over, setOver] = useState(null);
  const [targetDeg, setTargetDeg] = useState(null);

  const canvasRef = useRef(null);
  const reachesRef = useRef([]);
  const targetRef = useRef(null);
  const pathRef = useRef([]);
  const draggingRef = useRef(false);
  const liveRef = useRef(false);
  const trialLogRef = useRef(null);
  const ppRoundRef = useRef(0);
  const ppScoreRef = useRef(0);

  const blocks = useMemo(() => {
    if (mode === 'free') return survivalSchedule(stage).blocks;
    if (mode === 'passplay') return passSchedule();
    return levelSchedule(level || 1);
  }, [mode, level, stage]);

  const block = blocks[Math.min(blockIdx, blocks.length - 1)];

  useEffect(() => {
    trialLogRef.current = createTrialLog({
      game: 'mirror-world',
      mode: mode === 'free' ? 'free' : mode === 'passplay' ? 'challenge' : 'level',
      meta: { lv: level },
    });
    return () => { trialLogRef.current?.discard?.(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const blockLabel = block?.role === ROLE.BASE ? t.blockBase
    : block?.role === ROLE.WASH ? t.blockWash : t.blockAdapt;

  /* ── drawing ─────────────────────────────────────────────────────── */
  /*
   * ⚠ Canvas cannot read CSS variables, so a canvas game that hard-codes its
   * colours is frozen in one theme — the same failure as the loading flash that
   * painted a JS constant. Pull the live token values off the element instead,
   * so the reach surface follows dark/light like every other screen (and the
   * design ratchet stays flat).
   */
  const tokens = useCallback((cv) => {
    const cs = getComputedStyle(cv);
    const v = (n, f) => (cs.getPropertyValue(n) || '').trim() || f;
    return {
      ring: v('--line', '#999'),
      home: v('--ink-dim', '#777'),
      target: v('--game-accent', '#d4952f'),
      trail: v('--game-item', '#4a8cba'),
      ok: v('--game-ok', '#3f7d63'),
      bad: v('--game-bad', '#a8564d'),
    };
  }, []);

  const draw = useCallback((cursor) => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const T = tokens(cv);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== LW * dpr) {
      cv.width = LW * dpr; cv.height = LW * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    ctx.clearRect(0, 0, LW, LW);

    ctx.strokeStyle = T.ring;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI * 2); ctx.stroke();

    const tg = targetRef.current;
    if (tg) {
      ctx.fillStyle = T.target;
      ctx.beginPath(); ctx.arc(tg.x, tg.y, 12, 0, Math.PI * 2); ctx.fill();
    }

    // The trail is the FEEDBACK lever: continuous shows the whole path,
    // endpoint shows only where you ended up (and is much harder).
    const path = pathRef.current;
    if (block?.feedback !== 'endpoint' && path.length > 1) {
      ctx.strokeStyle = T.trail;
      ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
      ctx.stroke();
    }

    ctx.fillStyle = T.home;
    ctx.beginPath(); ctx.arc(CX, CY, 7, 0, Math.PI * 2); ctx.fill();

    if (cursor && block?.feedback !== 'endpoint') {
      ctx.fillStyle = T.trail;
      ctx.beginPath(); ctx.arc(cursor.x, cursor.y, 6, 0, Math.PI * 2); ctx.fill();
    }
  }, [block, tokens]);

  const nextTarget = useCallback(() => {
    const angles = targetAngles(block?.targets || 8);
    const a = (angles[Math.floor(Math.random() * angles.length)] * Math.PI) / 180;
    targetRef.current = { a, deg: (a * 180) / Math.PI, x: CX + Math.cos(a) * R, y: CY + Math.sin(a) * R };
    setTargetDeg(Math.round(targetRef.current.deg));
    pathRef.current = [];
    liveRef.current = true;
    draggingRef.current = false;
    draw(null);
  }, [block, draw]);

  useEffect(() => {
    if (step === 'reach') nextTarget();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, reachIdx, blockIdx]);

  /* ── the reach ───────────────────────────────────────────────────── */
  const pos = (ev) => {
    const cv = canvasRef.current;
    const r = cv.getBoundingClientRect();
    return { x: ((ev.clientX - r.left) / r.width) * LW, y: ((ev.clientY - r.top) / r.height) * LW };
  };

  const onDown = (ev) => {
    if (!liveRef.current || paused) return;
    ev.preventDefault();
    const p = pos(ev);
    if (Math.hypot(p.x - CX, p.y - CY) > HOME_R) return;   // must start from home
    ev.currentTarget.setPointerCapture?.(ev.pointerId);
    draggingRef.current = true;
    pathRef.current = [{ x: CX, y: CY }];
  };

  const onMove = (ev) => {
    if (!liveRef.current || !draggingRef.current) return;
    const p = pos(ev);
    const v = perturb(p.x - CX, p.y - CY, block, reachIdx);
    const cursor = { x: CX + v.x, y: CY + v.y };
    pathRef.current.push(cursor);
    draw(cursor);
    if (Math.hypot(v.x, v.y) >= R) land(cursor);
  };

  const land = (cursor) => {
    liveRef.current = false;
    draggingRef.current = false;
    const seen = (Math.atan2(cursor.y - CY, cursor.x - CX) * 180) / Math.PI;
    const err = angularError(seen, targetRef.current.deg);
    reachesRef.current.push({ role: block.role, err });
    trialLogRef.current?.trial({ ok: Math.abs(err) <= HIT_DEG, err: Math.round(err), role: block.role });
    playSfx?.(Math.abs(err) <= HIT_DEG ? 'collect' : 'click');

    // Endpoint feedback: show where it actually landed, only now.
    const cvEl = canvasRef.current;
    const ctx = cvEl?.getContext('2d');
    if (ctx) {
      const T = tokens(cvEl);
      ctx.strokeStyle = Math.abs(err) <= HIT_DEG ? T.ok : T.bad;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(cursor.x, cursor.y, 11, 0, Math.PI * 2); ctx.stroke();
    }

    setTimeout(() => {
      const nextReach = reachIdx + 1;
      if (nextReach >= block.reaches) {
        const nb = blockIdx + 1;
        if (nb >= blocks.length) return finishRun();
        setBlockIdx(nb); setReachIdx(0); setStep('block');
      } else {
        setReachIdx(nextReach);
      }
    }, 420);
  };

  // WCAG 2.5.7 alternative to the drag gesture. Choosing a direction feeds the
  // same perturbation and scoring path as a physical reach, so adaptation and
  // aftereffect logic remain shared rather than becoming a separate easy mode.
  const chooseDirection = (deg) => {
    if (!liveRef.current || paused) return;
    const a = (deg * Math.PI) / 180;
    const hand = { x: Math.cos(a) * R, y: Math.sin(a) * R };
    const shifted = perturb(hand.x, hand.y, block, reachIdx);
    const cursor = { x: CX + shifted.x, y: CY + shifted.y };
    pathRef.current = [{ x: CX, y: CY }, cursor];
    draw(cursor);
    land(cursor);
  };

  /* ── end of run ──────────────────────────────────────────────────── */
  const finishRun = () => {
    const sum = summarise(reachesRef.current, blocks);
    const won = levelPassed(sum);
    trialLogRef.current?.finish?.({ result: sum });

    if (mode === 'levels') {
      onResult?.({ won, score: sum.hits, summary: won ? t.afterNote : t.failWhy });
      return;
    }
    if (mode === 'passplay') {
      ppScoreRef.current += sum.hits;
      ppRoundRef.current += 1;
      if (ppRoundRef.current >= (attempt?.trials || 1)) {
        onResult?.({ score: ppScoreRef.current });
        return;
      }
      reachesRef.current = [];
      setBlockIdx(0); setReachIdx(0); setStep('block');
      return;
    }
    // Survival: adapt to advance, otherwise the run ends.
    if (won) {
      reachesRef.current = [];
      setStage((s) => s + 1);
      setBlockIdx(0); setReachIdx(0); setStep('block');
      return;
    }
    awardFreeRun?.('mirror-world', stage);
    setOver(sum);
    setStep('over');
  };

  const headerLabel = mode === 'free' ? `${t.freeHeader} · ${stage + 1}`
    : mode === 'passplay' ? `${t.challengeHeader}` : `${t.levelMode} · L${level}`;

  return (
    <div className="ct-mw-root" dir={isAr ? 'rtl' : 'ltr'}>
      {/* The shared PLAY header, not TrainingMenuBar — that is the hub/lobby bar
          and using it mid-play sat this game's back button at a different size
          and gutter from the rest. The pause had its own glyph too
          (ct-mw-pause "❚❚") and now uses the header's slot. */}
      <TrainingPlayHeader
        isAr={isAr}
        playSfx={playSfx}
        title={headerLabel}
        onMenu={() => onExit?.()}
        menuAriaLabel={t.menu}
        onPause={step === 'reach' ? () => setPaused(true) : undefined}
        pauseAriaLabel={t.paused}
      />

      <div className="ct-mw-stage">
        {step === 'block' && (
          <div className="ct-mw-panel">
            <h2 className="ct-mw-h">{blockLabel}</h2>
            <p className="ct-mw-sub">{t.howTo}</p>
            <button type="button" className="ct-training-btn ct-training-btn--pri"
              onClick={() => { playSfx?.('click'); setStep('reach'); }}
            >
              {t.beginBlock}
            </button>
          </div>
        )}

        {step === 'reach' && (
          <div className="ct-mw-panel">
            <div className="ct-mw-cue">{blockLabel}</div>
            <canvas
              ref={canvasRef}
              className="ct-mw-pad"
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={() => { draggingRef.current = false; }}
              onPointerCancel={() => { draggingRef.current = false; }}
              aria-hidden="true"
            />
            <p className="ct-visually-hidden" aria-live="polite">
              {targetDeg == null ? '' : t.targetDirection(targetDeg)}
            </p>
            <div className="ct-mw-direction-wrap">
              <span className="ct-mw-direction-hint">{t.directionHint}</span>
              <div className="ct-mw-direction-pad" role="group" aria-label={t.directionHint}>
                {aimAngles().map((deg) => (
                  <button
                    key={deg}
                    type="button"
                    className="ct-mw-direction-btn"
                    aria-label={t.aimDirection(Math.round(deg))}
                    onClick={() => chooseDirection(deg)}
                  >
                    <span aria-hidden="true" style={{ transform: `rotate(${deg}deg)` }}>→</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="ct-mw-count">{t.reachOf(reachIdx + 1, block.reaches)}</div>
          </div>
        )}

        {step === 'over' && over && (
          <div className="ct-mw-panel">
            <h2 className="ct-mw-h">{t.runOver}</h2>
            <p className="ct-mw-sub">{t.bestRound(stage + 1)}</p>
            <div className="ct-mw-actions">
              <button type="button" className="ct-training-btn ct-training-btn--pri"
                onClick={() => {
                  playSfx?.('click');
                  reachesRef.current = [];
                  setStage(0); setBlockIdx(0); setReachIdx(0); setOver(null); setStep('block');
                }}
              >
                {t.freePlayAgain}
              </button>
              <button type="button" className="ct-training-btn ct-training-btn--ghost" onClick={() => onExit?.()}>
                {t.menu}
              </button>
            </div>
          </div>
        )}
      </div>

      <TrainingPauseModal
        open={paused}
        showRestart={false}
        labels={{ paused: t.paused, resume: t.resume, quitMenu: t.quitMenu }}
        onResume={() => { setPaused(false); playSfx?.('click'); }}
        onQuitMenu={() => { playSfx?.('click'); onExit?.(); }}
      />
    </div>
  );
}

export default function MirrorWorldGame({ onBack, workoutMode = false }) {
  const { currentLang, playSfx, awardFreeRun } = useApp();
  const isAr = currentLang === 'ar';
  return (
    <ModeShell
      storageKey="mm_flx_mirrorworld"
      gameId="mirror-world"
      scienceId="mirror-world"
      title={{ en: UI.en.title, ar: UI.ar.title }}
      hints={{
        free: { en: UI.en.hintFree, ar: UI.ar.hintFree },
        levels: { en: UI.en.hintLevels, ar: UI.ar.hintLevels },
        pass: { en: UI.en.hintPass, ar: UI.ar.hintPass },
      }}
      /* ONE LADDER — no easy/med/hard. See data.js LADDER. */
      ladder={{ levels: LADDER_LEVELS }}
      pass={{ trials: 1, scoreLabel: { en: 'on target', ar: 'إصابات' }, lowerBetter: false }}
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      workoutMode={workoutMode}
      renderEngine={(p) => (
        <MirrorEngine {...p} isAr={isAr} playSfx={playSfx} awardFreeRun={awardFreeRun} />
      )}
    />
  );
}
