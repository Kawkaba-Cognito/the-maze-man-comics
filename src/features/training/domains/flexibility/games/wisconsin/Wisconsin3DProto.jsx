import React, { useEffect, useRef, useState } from 'react';
import { GAME_INTS } from '../../../../shared/gamePalette';
import { bootC3dScene, matStd, disposeObject, THREE } from '../../../../shared/c3dBoot';
import C3dProtoChrome from '../../../../shared/C3dProtoChrome';
import { makeRng } from '../../../../shared/rng';
import { survivalRamp, SURVIVAL_MS, freshSurvivalSeed } from '../../../../shared/survival';
// nowMs() is performance.now() minus time spent paused — see pauseStore.js.
// Using it here is what makes the pause menu actually stop the clock.
import { nowMs } from '../../../../shared/pauseStore';
// SAME game as 2D Survival: identical cards, hidden rule + silent switch logic.
import {
  REFERENCE,
  dealCard,
  pickRule,
  switchAfter,
  WCST_PER_LEVEL,
  WCST_WIN_ACC,
  WCST_PP_TRIALS,
} from './index';
import '../../../../shared/c3dProto.css';

/*
 * Card Sort (Wisconsin) · 3D prototype
 * The real WCST: sort each dealt card onto one of four reference cards by a HIDDEN
 * rule (colour / shape / count). You get only right/wrong, infer the rule, then it
 * SILENTLY switches. Uses the exact 2D dealCard / pickRule / switchAfter helpers —
 * the rule is never announced (no "Sort by COLOUR").
 */

const UI = {
  en: {
    title: 'Card Sort',
    tag: 'Hidden rule',
    prompt: 'Where does this card go?',
    hidden: 'One hidden rule — colour, shape, or count',
    yes: 'Got it!',
    no: 'Not that one',
    shift: 'Rule shifted — find the new one',
    over: 'Survival over',
    retry: 'Play again',
    hub: 'Back to modes',
    go: 'ENGAGE',
    rules: 'rules',
  },
  ar: {
    title: 'فرز البطاقات',
    tag: 'قاعدة خفية',
    prompt: 'أين تضع هذه البطاقة؟',
    hidden: 'قاعدة خفية واحدة — لون أو شكل أو عدد',
    yes: 'وجدتها!',
    no: 'ليست هذه',
    shift: 'تبدّلت القاعدة — ابحث عن الجديدة',
    over: 'انتهى البقاء',
    retry: 'العب مجددًا',
    hub: 'العودة للأوضاع',
    go: 'انطلق',
    rules: 'قواعد',
  },
};

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawGlyph(ctx, shape, color, cx, cy, r) {
  ctx.fillStyle = color;
  if (shape === 'circle') {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  } else if (shape === 'triangle') {
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r, cy + r);
    ctx.lineTo(cx - r, cy + r);
    ctx.closePath();
    ctx.fill();
  } else if (shape === 'cross') {
    const t = r * 0.5;
    ctx.fillRect(cx - t / 2, cy - r, t, r * 2);
    ctx.fillRect(cx - r, cy - t / 2, r * 2, t);
  } else {
    // star (5-point)
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const rad = i % 2 === 0 ? r : r * 0.44;
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(a) * rad;
      const y = cy + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }
}

/** Draw a card face (color + shape × number) on a light card → CanvasTexture. */
function cardTexture({ shape, color, number }) {
  const W = 630;
  const H = 840;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fffdf8';
  roundRectPath(ctx, 18, 18, W - 36, H - 36, 54);
  ctx.fill();
  ctx.lineWidth = 14;
  ctx.strokeStyle = '#17324d';
  ctx.stroke();
  const r = 92;
  const gapY = 194;
  const startY = H / 2 - ((number - 1) * gapY) / 2;
  for (let i = 0; i < number; i++) {
    drawGlyph(ctx, shape, color, W / 2, startY + i * gapY, r);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  return tex;
}

function cardMesh(feature) {
  const faceTex = cardTexture(feature);
  const side = matStd(0xdde8ef, { emissive: 0x17324d, emissiveIntensity: 0.04, metalness: 0, roughness: 0.9 });
  const face = new THREE.MeshBasicMaterial({
    map: faceTex,
    toneMapped: false,
  });
  const mats = [side, side, side, side, face, side];
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.45, 1.94, 0.18), mats);
  mesh.userData.faceTex = faceTex;
  return mesh;
}

export default function Wisconsin3DProto({
  mode = 'free',
  diff = 'med',
  level = 1,
  seed,
  attempt,
  onResult,
  onExit,
  isAr,
  playSfx,
  awardPoints,
  awardFreeRun,
  onBack,
}) {
  const t = UI[isAr ? 'ar' : 'en'];
  const isSurvival = mode === 'free';
  const ppTrials = mode === 'passplay' ? (attempt?.trials || WCST_PP_TRIALS) : 0;
  const exit = onExit || onBack;
  const wrapRef = useRef(null);
  const apiRef = useRef({});
  const correctAwardRef = useRef(0);
  const playSfxRef = useRef(playSfx);
  playSfxRef.current = playSfx;

  const [phase, setPhase] = useState('boot');
  const [say, setSay] = useState('');
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [rules, setRules] = useState(0);
  const [timeLeft, setTimeLeft] = useState(Math.round(SURVIVAL_MS / 1000));
  const [banner, setBanner] = useState('go');
  const [bootError, setBootError] = useState(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;

    const boot = bootC3dScene(wrap, {
      fov: 52,
      fitHalf: 4.4,
      bloom: false,
      hudReserveFrac: 0.22,
    });
    if (boot.error) {
      setBootError(isAr ? 'تعذّر تشغيل ثلاثي الأبعاد' : 'Could not start 3D');
      return () => boot.dispose();
    }
    const { camera, playRoot, coarse, setTick, setFitBox, renderer, dispose } = boot;

    // Reference cards sit in four bright, neutral sorting bays.
    const refGap = coarse ? 1.58 : 1.72;
    const refScale = coarse ? 0.78 : 0.84;
    const refs = REFERENCE.map((feature, i) => {
      const x = (i - 1.5) * refGap;
      const slot = new THREE.Mesh(
        new THREE.BoxGeometry(1.45 * refScale + 0.22, 1.94 * refScale + 0.22, 0.08),
        matStd(0x102a43, { emissive: 0x55d6e8, emissiveIntensity: 0.18, metalness: 0.02, roughness: 0.88 }),
      );
      slot.position.set(x, 1.35, -0.14);
      playRoot.add(slot);
      const mesh = cardMesh(feature);
      mesh.scale.setScalar(refScale);
      mesh.position.set(x, 1.35, 0);
      mesh.userData.refIdx = i;
      mesh.userData.flash = 0;
      mesh.userData.feedbackMat = slot.material;
      playRoot.add(mesh);
      return mesh;
    });
    setFitBox(Math.max(3.0, 1.5 * refGap + 0.95), 3.45);

    // Dealt card (below)
    let dealt = null;
    let dealtEnter = 0;
    const setDealt = (card) => {
      if (dealt) { disposeObject(dealt); dealt.userData.faceTex?.dispose(); playRoot.remove(dealt); }
      dealt = cardMesh(card);
      dealt.position.set(0, -1.42, 0.2);
      dealt.scale.setScalar(0.01);
      dealtEnter = 0;
      playRoot.add(dealt);
    };

    // ── Game state (mirrors 2D free/survival) ──
    const gameSeed = (seed ?? freshSurvivalSeed()) >>> 0;
    let rule = pickRule(makeRng(gameSeed), null);
    let prevRule = null;
    let justSwitched = false;
    let run = 0;
    let trial = 0;
    let rulesN = 0;
    let correctN = 0;
    let scoreN = 0;
    let comboN = 0;
    let totalN = 0;
    const postSwitch = { n: 0, ok: 0, persev: 0 };
    let card = null;
    let lock = false;
    let finished = false;
    let runStart = nowMs();
    const timers = [];
    const clearTimers = () => { timers.forEach((id) => window.clearTimeout(id)); timers.length = 0; };
    const later = (fn, ms) => { const id = window.setTimeout(fn, ms); timers.push(id); return id; };
    const rampNow = () => (isSurvival ? survivalRamp(nowMs() - runStart) : 0);

    const nextCard = () => {
      trial += 1;
      card = dealCard(makeRng((gameSeed + trial * 7919) >>> 0));
      setDealt(card);
      lock = false;
    };

    const choose = (refIdx) => {
      if (lock || finished || !card) return;
      lock = true;
      const ok = refIdx === card.match[rule];
      const wasPostSwitch = justSwitched;
      totalN += 1;
      setTotal(totalN);
      if (wasPostSwitch) {
        postSwitch.n += 1;
        if (ok) postSwitch.ok += 1;
        if (!ok && prevRule != null && refIdx === card.match[prevRule]) postSwitch.persev += 1;
        justSwitched = false;
      }
      const refMesh = refs[refIdx];
      refMesh.userData.flash = 0.7;
      refMesh.userData.flashHex = ok ? GAME_INTS.ok.fill : GAME_INTS.bad.fill;
      if (ok) {
        scoreN += 10 + Math.min(comboN, 8) * 2;
        correctN += 1;
        correctAwardRef.current = correctN;
        comboN += 1;
        setScore(scoreN); setCorrect(correctN); setCombo(comboN);
        setSay(t.yes);
        playSfxRef.current?.('win');
        awardPoints?.(1);
      } else {
        comboN = 0;
        setCombo(0);
        setSay(t.no);
        playSfxRef.current?.('lose');
      }
      let nrun = ok ? run + 1 : 0;
      let switched = false;
      if (nrun >= switchAfter(mode, diff, level, rampNow())) {
        prevRule = rule;
        rulesN += 1;
        setRules(rulesN);
        const srng = makeRng((gameSeed + trial * 104729 + rulesN * 9176) >>> 0);
        rule = pickRule(srng, prevRule);
        nrun = 0;
        switched = true;
        justSwitched = true;
        setSay(t.shift);
      }
      run = nrun;
      later(() => {
        if (finished) return;
        if (mode === 'levels' && totalN >= WCST_PER_LEVEL) {
          finished = true;
          const acc = correctN / WCST_PER_LEVEL;
          const postAcc = postSwitch.n ? Math.round((postSwitch.ok / postSwitch.n) * 100) : null;
          onResult?.({
            won: acc >= WCST_WIN_ACC,
            score: scoreN,
            summary: `${correctN}/${WCST_PER_LEVEL} (${Math.round(acc * 100)}%) · ${rulesN} ${t.rules}${postAcc != null ? ` · post-switch ${postAcc}%` : ''}`,
          });
          return;
        }
        if (mode === 'passplay' && totalN >= ppTrials) {
          finished = true;
          onResult?.({ score: correctN });
          return;
        }
        nextCard();
      }, ok ? 560 : 820);
      void switched;
    };

    // Pointer picking
    const raycaster = new THREE.Raycaster();
    const ptr = new THREE.Vector2();
    const tmp = new THREE.Vector3();
    const el = renderer.domElement;
    const resolve = (cx, cy) => {
      const rect = el.getBoundingClientRect();
      ptr.x = ((cx - rect.left) / rect.width) * 2 - 1;
      ptr.y = -((cy - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ptr, camera);
      const hits = raycaster.intersectObjects(refs, false);
      if (hits.length) return hits[0].object.userData.refIdx;
      let best = -1;
      let bestD = coarse ? 0.16 : 0.1;
      for (const m of refs) {
        tmp.copy(m.position).add(playRoot.position).project(camera);
        const d = Math.hypot(tmp.x - ptr.x, tmp.y - ptr.y);
        if (d < bestD) { bestD = d; best = m.userData.refIdx; }
      }
      return best;
    };
    const onUp = (e) => {
      if (finished || lock) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      const idx = resolve(e.clientX, e.clientY);
      if (idx >= 0) choose(idx);
    };
    el.addEventListener('pointerup', onUp);

    setTick((dt, now) => {
      if (dealt && dealtEnter < 1) {
        dealtEnter = Math.min(1, dealtEnter + dt * 3);
        const e = 1 - (1 - dealtEnter) ** 3;
        dealt.scale.setScalar(Math.max(0.01, (coarse ? 0.9 : 1.02) * e));
      }
      if (dealt) dealt.rotation.y = Math.sin(now * 0.0015) * 0.12;
      for (const m of refs) {
        const ud = m.userData;
        if (ud.flash > 0) {
          ud.flash = Math.max(0, ud.flash - dt);
          ud.feedbackMat.color.setHex(ud.flashHex);
          ud.feedbackMat.emissive.setHex(ud.flashHex);
          ud.feedbackMat.emissiveIntensity = 0.35 + ud.flash;
        } else {
          ud.feedbackMat.color.setHex(0x102a43);
          ud.feedbackMat.emissive.setHex(0x55d6e8);
          ud.feedbackMat.emissiveIntensity = 0.18;
        }
      }
    });

    apiRef.current = {
      start: () => {
        finished = false;
        run = 0; trial = 0; rulesN = 0; correctN = 0; scoreN = 0; comboN = 0; totalN = 0;
        rule = pickRule(makeRng(gameSeed), null);
        prevRule = null; justSwitched = false;
        postSwitch.n = 0; postSwitch.ok = 0; postSwitch.persev = 0;
        correctAwardRef.current = 0;
        setCorrect(0); setTotal(0); setScore(0); setCombo(0); setRules(0);
        setSay(t.prompt);
        runStart = nowMs();
        setRunning(true);
        nextCard();
      },
      stop: () => { finished = true; clearTimers(); },
    };

    return () => {
      finished = true;
      clearTimers();
      el.removeEventListener('pointerup', onUp);
      refs.forEach((m) => { disposeObject(m); m.userData.faceTex?.dispose(); playRoot.remove(m); });
      if (dealt) { disposeObject(dealt); dealt.userData.faceTex?.dispose(); playRoot.remove(dealt); }
      dispose();
      apiRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAr, mode, diff, level, seed, ppTrials, onResult, awardPoints, isSurvival, t.no, t.prompt, t.rules, t.shift, t.yes]);

  useEffect(() => {
    if (!running || !isSurvival) return undefined;
    const start = nowMs();
    const id = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((SURVIVAL_MS - (nowMs() - start)) / 1000));
      setTimeLeft(left);
      if (left <= 0) {
        window.clearInterval(id);
        apiRef.current.stop?.();
        setRunning(false);
        setPhase('over');
        setBanner('over');
        awardFreeRun?.('wisconsin', correctAwardRef.current);
        playSfxRef.current?.('error');
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [running, isSurvival, awardFreeRun]);

  const startRun = () => {
    playSfx?.('click');
    setTimeLeft(Math.round(SURVIVAL_MS / 1000));
    setBanner(null);
    setPhase('play');
    apiRef.current.start?.();
  };

  useEffect(() => {
    const id = requestAnimationFrame(() => startRun());
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = phase === 'boot' ? [] : mode === 'levels' ? [
    `${total}/${WCST_PER_LEVEL}`,
    `✓ ${correct}`,
    `${score} ${isAr ? 'نقطة' : 'pts'}`,
    `${rules} ${isAr ? 'قواعد' : 'rules'}`,
  ] : mode === 'passplay' ? [
    `${total}/${ppTrials}`,
    `✓ ${correct}`,
    `${score} ${isAr ? 'نقطة' : 'pts'}`,
  ] : [
    `✓ ${correct}`,
    `${score} ${isAr ? 'نقطة' : 'pts'}`,
    `${rules} ${isAr ? 'قواعد' : 'rules'}${combo > 1 ? ` · 🔥${combo}` : ''}`,
    `${timeLeft}s`,
  ];

  const bannerText = banner === 'go' ? t.go : banner === 'over' ? t.over : null;

  return (
    <C3dProtoChrome
      isAr={isAr}
      title={t.title}
      tag={t.tag}
      question={running && say && say !== t.prompt ? `${t.prompt} · ${say}` : t.prompt}
      chip={t.hidden}
      chipStyle={{ fontSize: '0.6rem', fontWeight: 800, color: '#55d6e8', maxWidth: 150, whiteSpace: 'normal', lineHeight: 1.1 }}
      stats={stats}
      banner={bannerText}
      bannerOver={isSurvival && banner === 'over'}
      bannerMeta={banner === 'over' ? `✓ ${correct} · ${score} ${isAr ? 'نقطة' : 'pts'} · ${rules} ${isAr ? 'قواعد' : 'rules'}` : null}
      bootError={bootError}
      onBack={exit}
      playSfx={playSfx}
      canvasRef={wrapRef}
      bannerActions={
        isSurvival && banner === 'over' ? (
          <div className="c3d-banner-actions">
            <button type="button" className="c3d-cta" onClick={startRun}>{t.retry}</button>
            <button type="button" className="c3d-cta c3d-cta--ghost" onClick={() => { playSfx?.('click'); exit?.(); }}>{t.hub}</button>
          </div>
        ) : null
      }
    />
  );
}
