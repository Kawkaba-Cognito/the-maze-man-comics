import React, { useEffect, useRef, useState } from 'react';
import { bootC3dScene, matStd, disposeObject, THREE } from '../../../../shared/c3dBoot';
import C3dProtoChrome from '../../../../shared/C3dProtoChrome';
import { createStaircase } from '../../../../shared/staircase';
import { SURVIVAL_MS, survivalRampFromRemaining } from '../../../../shared/survival';
import {
  prepareFreeRunBlock,
  startStroopProbe,
  applyStroopAnswer,
  applyStroopTimeout,
  startBlitz,
  activeRule,
  answerFor,
  freePoints,
  rtRating,
  STROOP_FREE_LIVES,
  STROOP_POWERUP_KEYS,
  BLITZ_EVERY_SWITCHES,
} from './spatialStroopData';
import '../../../../shared/c3dProto.css';

/*
 * Spatial Stroop · 3D — the REAL 2D Survival session, rendered in the cosmos.
 * Runs createStroopSession via prepareFreeRunBlock: same streak-of-5 silent
 * rule switches, the same response deadline dynamics (2400ms base, survival
 * ramp −32%, 1-up/2-down staircase −28ms/level, blitz ×0.7, slow-mo ×1.6),
 * flankers rendered as real flanking arrows, Blitz bursts every 5 switches,
 * shield/slow-mo/×2/freeze power-ups earned every 6 correct, freePoints+RT
 * bonus scoring, 3 lives + 60s survival clock. All engine calls are the 2D's.
 */

const UI = {
  en: {
    title: 'Spatial Stroop · 3D',
    tag: 'prototype',
    rulePoint: 'Rule: where it POINTS',
    ruleSide: 'Rule: which SIDE it sits on',
    ruleColor: 'Rule: by COLOUR (red→left, green→right)',
    reverse: '⇄ REVERSE — answer the OPPOSITE',
    shift: 'Rule shifted!',
    blitz: '⚡ BLITZ — pure conflict burst!',
    left: 'Left',
    right: 'Right',
    over: 'Survival over',
    retry: 'Play again',
    hub: 'Back to modes',
    go: 'ENGAGE',
    shieldSaved: '🛡️ Shield saved you',
  },
  ar: {
    title: 'ستروب مكاني · ثلاثي الأبعاد',
    tag: 'نموذج',
    rulePoint: 'القاعدة: إلى أين يشير',
    ruleSide: 'القاعدة: في أي جهة يجلس',
    ruleColor: 'القاعدة: حسب اللون (أحمر←يسار، أخضر←يمين)',
    reverse: '⇄ عكسي — أجب بالعكس',
    shift: 'تبدّلت القاعدة!',
    blitz: '⚡ عاصفة تضارب!',
    left: 'يسار',
    right: 'يمين',
    over: 'انتهى البقاء',
    retry: 'العب مجددًا',
    hub: 'العودة للأوضاع',
    go: 'انطلق',
    shieldSaved: '🛡️ أنقذك الدرع',
  },
};

const POWERUP_ICON = { shield: '🛡️', slowmo: '⏱️', x2: '✨', freeze: '❄️' };
const COLOR_HEX = { red: 0xd9534f, green: 0x7cbc7a };
const CREAM_HEX = 0xead9bd;
const SIDE_X = { left: -1.45, right: 1.45 };
const ROT_Z = { left: Math.PI / 2, right: -Math.PI / 2 };

/** A proper arrow (shaft + head) pointing +Y by default; one shared material. */
function makeArrow(mat, scale = 1) {
  const g = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.1 * scale, 0.1 * scale, 0.72 * scale, 14), mat);
  shaft.position.y = -0.12 * scale;
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.3 * scale, 0.56 * scale, 22), mat);
  head.position.y = 0.42 * scale;
  g.add(shaft, head);
  g.userData.mat = mat;
  return g;
}

/** Rounded pad face with a big ← / → glyph → CanvasTexture. */
function padTexture(dir) {
  const W = 256;
  const H = 160;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0d0a06';
  ctx.globalAlpha = 0.0;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#f0e2c0';
  ctx.font = '800 108px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(dir === 'left' ? '←' : '→', W / 2, H / 2 + 6);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export default function SpatialStroop3DProto({ isAr, playSfx, onBack }) {
  const t = UI[isAr ? 'ar' : 'en'];
  const wrapRef = useRef(null);
  const apiRef = useRef({});
  const playSfxRef = useRef(playSfx);
  playSfxRef.current = playSfx;

  const [phase, setPhase] = useState('boot'); // boot | run | over
  const [ruleKey, setRuleKey] = useState('point');
  const [reverseOn, setReverseOn] = useState(false);
  const [combo, setCombo] = useState(0);
  const [cats, setCats] = useState(0);
  const [lives, setLives] = useState(STROOP_FREE_LIVES);
  const [score, setScore] = useState(0);
  const [inventory, setInventory] = useState([]);
  const [timeLeft, setTimeLeft] = useState(Math.round(SURVIVAL_MS / 1000));
  const [ringSec, setRingSec] = useState(0);
  const [toast, setToast] = useState(null);
  const [banner, setBanner] = useState('go');
  const [blitzOn, setBlitzOn] = useState(false);
  const [bootError, setBootError] = useState(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;

    const boot = bootC3dScene(wrap, { fov: 52, fitHalf: 3.8, bloom: true });
    if (boot.error) {
      setBootError(isAr ? 'تعذّر تشغيل ثلاثي الأبعاد' : 'Could not start 3D');
      return () => boot.dispose();
    }
    const { camera, playRoot, coarse, setTick, setFitBox, renderer, dispose } = boot;

    // ── Seat platforms (show which SIDE the arrow sits on) ──
    const seats = ['left', 'right'].map((side) => {
      const seat = new THREE.Mesh(
        new THREE.CylinderGeometry(0.62, 0.7, 0.1, 28),
        matStd(0x1a140c, { emissive: 0xe8ac4e, emissiveIntensity: 0.06, metalness: 0.25, roughness: 0.7 }),
      );
      seat.rotation.x = Math.PI / 2;
      seat.position.set(SIDE_X[side], 0.35, -0.15);
      playRoot.add(seat);
      return seat;
    });

    // ── Answer pads (big, labelled ← / →) ──
    const padTexL = padTexture('left');
    const padTexR = padTexture('right');
    const pads = ['left', 'right'].map((side) => {
      const base = matStd(side === 'left' ? 0x6bb3c8 : 0xe8ac4e, { emissiveIntensity: 0.28, metalness: 0.3, roughness: 0.5 });
      const face = new THREE.MeshStandardMaterial({ map: side === 'left' ? padTexL : padTexR, transparent: true, emissive: new THREE.Color(0xf0e2c0), emissiveIntensity: 0.2, metalness: 0.2, roughness: 0.5 });
      const g = new THREE.Group();
      const slab = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.2, 0.24), base);
      g.add(slab);
      const label = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.05), face);
      label.position.z = 0.13;
      g.add(label);
      g.position.set(side === 'left' ? -1.6 : 1.6, -2.15, 0);
      g.userData.side = side;
      g.userData.flash = 0;
      g.userData.mat = base;
      playRoot.add(g);
      return g;
    });
    setFitBox(2.9, 3.4);

    // ── Stimulus: main arrow + flankers (real arrows, shaft + head) ──
    const arrowGroup = new THREE.Group();
    playRoot.add(arrowGroup);
    const mainMat = matStd(CREAM_HEX, { emissiveIntensity: 0.4, metalness: 0.25, roughness: 0.4 });
    const mainArrow = makeArrow(mainMat, 1.4);
    arrowGroup.add(mainArrow);
    const flankers = [-1, 1].map((k) => {
      const fm = matStd(CREAM_HEX, { emissiveIntensity: 0.28, metalness: 0.2, roughness: 0.5 });
      const m = makeArrow(fm, 0.82);
      m.position.x = k * 0.92;
      m.visible = false;
      arrowGroup.add(m);
      return m;
    });
    arrowGroup.visible = false;

    const showProbe = (probe) => {
      const hex = probe.color ? COLOR_HEX[probe.color] : CREAM_HEX;
      mainMat.color.setHex(hex);
      mainMat.emissive.setHex(hex);
      mainArrow.rotation.z = ROT_Z[probe.dir] ?? 0;
      arrowGroup.position.set(SIDE_X[probe.pos] ?? 0, 0.35, 0.1);
      // Highlight the seat the arrow sits on.
      seats.forEach((s, i) => { s.material.emissiveIntensity = (SIDE_X[probe.pos] === SIDE_X[i === 0 ? 'left' : 'right']) ? 0.32 : 0.06; });
      const fd = probe.flankerDir;
      flankers.forEach((m) => {
        m.visible = !!fd;
        if (fd) {
          m.rotation.z = ROT_Z[fd] ?? 0;
          m.userData.mat.color.setHex(hex);
          m.userData.mat.emissive.setHex(hex);
        }
      });
      arrowGroup.visible = true;
    };
    const hideProbe = () => { arrowGroup.visible = false; seats.forEach((s) => { s.material.emissiveIntensity = 0.06; }); };

    // ── Session state (all engine-driven) ──
    let block = null;
    let session = null;
    let staircase = null;
    let freeBaseLimit = 2400;
    let currentLimit = 2400;
    let deadline = 0;
    let stimOn = 0;
    let responded = true;
    let comboN = 0;
    let livesN = STROOP_FREE_LIVES;
    let scoreN = 0;
    let correctSince = 0;
    let inv = [];
    let shield = false;
    let slowMo = 0;
    let x2 = 0;
    let runStart = 0;
    let finished = true;
    let runId = 0;
    const timers = [];
    const later = (fn, ms) => { const id = window.setTimeout(fn, ms); timers.push(id); return id; };
    const clearTimers = () => { timers.forEach((id) => window.clearTimeout(id)); timers.length = 0; };

    const flashToast = (txt) => { setToast(txt); later(() => setToast(null), 1400); };

    const survivalLeft = () => Math.max(0, SURVIVAL_MS - (performance.now() - runStart));

    const syncRuleHud = () => {
      setRuleKey(activeRule(session));
      setReverseOn(!!session.probe?.reverse);
      setBlitzOn(!!session.blitzActive);
      setCats(session.categoriesCompleted);
    };

    const finishRun = () => {
      if (finished) return;
      finished = true;
      runId += 1;
      clearTimers();
      hideProbe();
      setRunning(false);
      setPhase('over');
      setBanner('over');
      playSfxRef.current?.('error');
    };

    const loseLifeOrShield = () => {
      if (shield) {
        shield = false;
        setInventoryMods();
        flashToast(t.shieldSaved);
        return false;
      }
      comboN = 0;
      setCombo(0);
      livesN = Math.max(0, livesN - 1);
      setLives(livesN);
      return livesN <= 0;
    };

    const setInventoryMods = () => setInventory([...inv]);

    const startTrial = () => {
      if (finished || !session || session.finished) { finishRun(); return; }
      responded = false;
      // Effective deadline — identical dynamics to the 2D free mode.
      let limit = session.responseLimitMs;
      limit = Math.max(950, Math.round(limit * (1 - survivalRampFromRemaining(survivalLeft()) * 0.32)));
      if (session.blitzActive) limit = Math.round(limit * 0.7);
      if (slowMo > 0) { limit = Math.round(limit * 1.6); slowMo -= 1; }
      currentLimit = limit;
      deadline = performance.now() + limit;
      stimOn = performance.now();
      showProbe(session.probe);
      syncRuleHud();

      const myRun = runId;
      const fireTimeout = () => {
        if (finished || runId !== myRun || responded) return;
        // Freeze (+8s) may have pushed the deadline — honour it.
        const remaining = deadline - performance.now();
        if (remaining > 30) { later(fireTimeout, remaining); return; }
        // Timeout — same as 2D: staircase relaxes, life (or shield) lost.
        responded = true;
        playSfxRef.current?.('error');
        const L = staircase.failure() ?? 0;
        session.responseLimitMs = Math.max(1150, freeBaseLimit - L * 28);
        const flashPad = pads.find((p) => p.userData.side === answerFor(session.probe, activeRule(session)));
        if (flashPad) { flashPad.userData.flash = 0.7; flashPad.userData.flashHex = 0x62b277; }
        if (loseLifeOrShield()) { finishRun(); return; }
        const outcome = applyStroopTimeout(session);
        advance(outcome);
      };
      later(fireTimeout, limit);
    };

    const advance = (outcome) => {
      hideProbe();
      if (finished) return;
      if (outcome.finished) { finishRun(); return; }
      if (outcome.categoryShift && outcome.categoriesCompleted % BLITZ_EVERY_SWITCHES === 0) {
        setBanner('blitz');
        playSfxRef.current?.('win');
        later(() => {
          if (finished) return;
          setBanner(null);
          startBlitz(session);
          startTrial();
        }, 1500);
        return;
      }
      if (outcome.categoryShift) {
        setBanner('shift');
        playSfxRef.current?.('win');
        later(() => {
          if (finished) return;
          setBanner(null);
          startTrial();
        }, 1600);
        return;
      }
      later(() => { if (!finished) startTrial(); }, session.feedbackMs ?? 480);
    };

    const answer = (side) => {
      if (finished || responded || !session?.probe) return;
      responded = true;
      runId += 1;
      const rtMs = Math.max(0, Math.round(performance.now() - stimOn));
      const wasBlitz = !!session.blitzActive;
      const outcome = applyStroopAnswer(session, side);
      const pad = pads.find((p) => p.userData.side === side);
      if (pad) { pad.userData.flash = 0.7; pad.userData.flashHex = outcome.correct ? 0x62b277 : 0xdd7f7a; }

      if (outcome.correct) {
        playSfxRef.current?.('click');
        comboN += 1;
        setCombo(comboN);
        const rating = rtRating(rtMs, currentLimit);
        let pts = freePoints(comboN) + rating.bonus;
        if (x2 > 0) { pts *= 2; x2 -= 1; }
        if (wasBlitz) pts *= 2;
        scoreN += pts;
        setScore(scoreN);
        const L = staircase.success() ?? 0;
        session.responseLimitMs = Math.max(1150, freeBaseLimit - L * 28);
        if (!wasBlitz) {
          correctSince += 1;
          if (correctSince >= 6 && inv.length < 3) {
            correctSince = 0;
            const pick = STROOP_POWERUP_KEYS[Math.floor(Math.random() * STROOP_POWERUP_KEYS.length)];
            inv = [...inv, pick];
            setInventoryMods();
            flashToast(`${POWERUP_ICON[pick]} +1`);
          }
        }
      } else {
        playSfxRef.current?.('error');
        const L = staircase.failure() ?? 0;
        session.responseLimitMs = Math.max(1150, freeBaseLimit - L * 28);
        const rightPad = pads.find((p) => p.userData.side === outcome.correctAns);
        if (rightPad) { rightPad.userData.flash = 0.7; rightPad.userData.flashHex = 0x62b277; }
        if (loseLifeOrShield()) { finishRun(); return; }
      }
      advance(outcome);
    };

    const activatePowerup = (idx) => {
      if (finished) return;
      const key = inv[idx];
      if (!key) return;
      playSfxRef.current?.('click');
      if (key === 'shield') shield = true;
      else if (key === 'slowmo') slowMo += 3;
      else if (key === 'x2') x2 += 5;
      else if (key === 'freeze') { deadline += 8000; flashToast('❄️ +8s'); }
      inv = inv.filter((_, i) => i !== idx);
      setInventoryMods();
    };

    // ── Pointer ──
    const raycaster = new THREE.Raycaster();
    const ptr = new THREE.Vector2();
    const tmp = new THREE.Vector3();
    const el = renderer.domElement;
    const onUp = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      const rect = el.getBoundingClientRect();
      ptr.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ptr.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ptr, camera);
      const hits = raycaster.intersectObjects(pads, true);
      if (hits.length) {
        let o = hits[0].object;
        while (o && o.userData.side === undefined && o.parent) o = o.parent;
        if (o?.userData.side) { answer(o.userData.side); return; }
      }
      // Soft pick / half-screen fallback (thumb-friendly, like the 2D buttons)
      let best = null;
      let bestD = coarse ? 0.3 : 0.18;
      for (const p of pads) {
        tmp.copy(p.position).add(playRoot.position).project(camera);
        const d = Math.hypot(tmp.x - ptr.x, tmp.y - ptr.y);
        if (d < bestD) { bestD = d; best = p; }
      }
      if (best) answer(best.userData.side);
    };
    el.addEventListener('pointerup', onUp);

    let hudAcc = 0;
    setTick((dt, now) => {
      arrowGroup.position.y = 0.35 + Math.sin(now * 0.003) * 0.06;
      for (const p of pads) {
        const mat = p.userData.mat;
        if (p.userData.flash > 0) {
          p.userData.flash = Math.max(0, p.userData.flash - dt);
          mat.emissive.setHex(p.userData.flashHex || 0x62b277);
          mat.emissiveIntensity = 0.28 + p.userData.flash;
        } else {
          mat.emissive.setHex(p.userData.side === 'left' ? 0x6bb3c8 : 0xe8ac4e);
          mat.emissiveIntensity = 0.28;
        }
      }
      if (!finished) {
        hudAcc += dt;
        if (hudAcc > 0.12) {
          hudAcc = 0;
          setRingSec(Math.max(0, (deadline - performance.now()) / 1000));
          const left = survivalLeft();
          setTimeLeft(Math.ceil(left / 1000));
          if (left <= 0) finishRun();
        }
      }
    });

    apiRef.current = {
      start: () => {
        clearTimers();
        finished = false;
        runId += 1;
        const seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
        block = prepareFreeRunBlock(seed);
        session = block.session;
        staircase = createStaircase({ nDown: 2 });
        freeBaseLimit = session.responseLimitMs ?? 2400;
        comboN = 0; livesN = STROOP_FREE_LIVES; scoreN = 0; correctSince = 0;
        inv = []; shield = false; slowMo = 0; x2 = 0;
        setCombo(0); setLives(STROOP_FREE_LIVES); setScore(0); setInventory([]); setCats(0);
        setTimeLeft(Math.round(SURVIVAL_MS / 1000));
        runStart = performance.now();
        setRunning(true);
        setPhase('run');
        setBanner(null);
        startStroopProbe(session);
        startTrial();
      },
      activatePowerup,
      stop: () => { finished = true; clearTimers(); },
    };

    return () => {
      finished = true;
      clearTimers();
      el.removeEventListener('pointerup', onUp);
      pads.forEach((p) => { disposeObject(p); playRoot.remove(p); });
      seats.forEach((s) => { disposeObject(s); playRoot.remove(s); });
      padTexL.dispose();
      padTexR.dispose();
      disposeObject(arrowGroup);
      playRoot.remove(arrowGroup);
      dispose();
      apiRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAr]);

  const startRun = () => {
    playSfx?.('click');
    apiRef.current.start?.();
  };

  useEffect(() => {
    const id = requestAnimationFrame(() => startRun());
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ruleText = ruleKey === 'side' ? t.ruleSide : ruleKey === 'color' ? t.ruleColor : t.rulePoint;
  const hintText = toast || (reverseOn ? `${ruleText} · ${t.reverse}` : ruleText);

  const stats = phase === 'boot' ? [] : [
    `${'♥'.repeat(Math.max(0, lives))}${'♡'.repeat(Math.max(0, STROOP_FREE_LIVES - lives))}`,
    `${score} ${isAr ? 'نقطة' : 'pts'}`,
    combo > 1 ? `🔥${combo}` : `${isAr ? 'قواعد' : 'Rules'} ${cats}`,
    `⏱${ringSec.toFixed(1)}`,
    `${timeLeft}s`,
  ];

  const bannerText = banner === 'go' ? t.go
    : banner === 'shift' ? t.shift
      : banner === 'blitz' ? t.blitz
        : banner === 'over' ? t.over
          : null;

  return (
    <C3dProtoChrome
      isAr={isAr}
      title={t.title}
      tag={t.tag}
      hint={hintText}
      chip={blitzOn ? '⚡ BLITZ' : (reverseOn ? '⇄' : ruleKey.toUpperCase())}
      chipStyle={{ fontSize: '0.72rem', fontWeight: 800, color: blitzOn ? '#e07a5f' : '#e8ac4e' }}
      stats={stats}
      banner={bannerText}
      bannerOver={banner === 'over'}
      bannerMeta={banner === 'over' ? `${score} ${isAr ? 'نقطة' : 'pts'} · ${cats} ${isAr ? 'قواعد' : 'rules'}` : null}
      bootError={bootError}
      onBack={onBack}
      playSfx={playSfx}
      canvasRef={wrapRef}
      bannerActions={
        banner === 'over' ? (
          <div className="c3d-banner-actions">
            <button type="button" className="c3d-cta" onClick={startRun}>{t.retry}</button>
            <button type="button" className="c3d-cta c3d-cta--ghost" onClick={() => { playSfx?.('click'); onBack(); }}>{t.hub}</button>
          </div>
        ) : null
      }
    >
      {running && inventory.length > 0 && (
        <div className="c3d-overlay-actions">
          {inventory.map((k, i) => (
            <button
              key={`${k}${i}`}
              type="button"
              className="c3d-choice-btn"
              onClick={() => apiRef.current.activatePowerup?.(i)}
            >
              {POWERUP_ICON[k]}
            </button>
          ))}
        </div>
      )}
    </C3dProtoChrome>
  );
}
