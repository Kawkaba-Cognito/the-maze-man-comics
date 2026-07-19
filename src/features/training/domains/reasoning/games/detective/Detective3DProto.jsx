import React, { useEffect, useRef, useState } from 'react';
import { bootC3dScene, matStd, disposeObject, THREE } from '../../../../shared/c3dBoot';
import C3dProtoChrome from '../../../../shared/C3dProtoChrome';
import { makeRng } from '../../../../shared/rng';
// SAME cases + selection as the 2D game — never the old 8 toy cases.
import { createCaseSession, pickCase, LIVES } from './caseSelection';
import { tierLabel, L } from './caseUtils';
import '../../../../shared/c3dProto.css';

/*
 * Detective Kawkab · 3D prototype
 * Uses the real case bank via pickCase / createCaseSession (survival/free mode):
 * read the briefing, step through the case's own proving clues, then accuse a
 * suspect mesh. The correct answer is the case's real solution.culprit; lives &
 * adaptive tier ramp exactly mirror the 2D free-mode session.
 */

const UI = {
  en: {
    title: 'Detective · 3D',
    tag: 'prototype',
    tapClue: 'Tap the evidence to read on…',
    accuse: 'Who did it? Tap the culprit.',
    caught: 'Case cracked ✓',
    wrong: 'Wrong suspect!',
    go: 'OPEN THE CASE',
    solved: 'solved',
    over: 'Out of leads',
    overSub: (n) => `${n} case${n === 1 ? '' : 's'} cracked`,
    again: 'New case',
  },
  ar: {
    title: 'المحقّق · ثلاثي الأبعاد',
    tag: 'نموذج',
    tapClue: 'المس الدليل لتكمل القراءة…',
    accuse: 'من الفاعل؟ المس المشتبه به.',
    caught: 'حُلّت القضية ✓',
    wrong: 'مشتبه به خاطئ!',
    go: 'افتح القضية',
    solved: 'محلولة',
    over: 'لا خيوط',
    overSub: (n) => `${n} قضية محلولة`,
    again: 'قضية جديدة',
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

/** Suspect card: big emoji + wrapped name → CanvasTexture. */
function suspectTexture(emoji, name) {
  const W = 240;
  const H = 300;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f4ecdd';
  roundRectPath(ctx, 8, 8, W - 16, H - 16, 22);
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = 'rgba(70,50,25,0.28)';
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '120px serif';
  ctx.fillText(emoji || '👤', W / 2, 120);
  // name (wrap to <=2 lines, shrink to fit)
  ctx.fillStyle = '#3a2c17';
  let size = 30;
  const maxW = W - 34;
  const words = String(name || '').split(' ');
  let lines = [];
  const layout = (fs) => {
    ctx.font = `700 ${fs}px system-ui, sans-serif`;
    lines = [];
    let cur = '';
    for (const w of words) {
      const test = cur ? `${cur} ${w}` : w;
      if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; }
      else cur = test;
    }
    if (cur) lines.push(cur);
    return lines.length;
  };
  while (layout(size) > 2 && size > 18) size -= 2;
  const lh = size * 1.15;
  const startY = 232 - ((lines.length - 1) * lh) / 2;
  lines.forEach((ln, i) => ctx.fillText(ln, W / 2, startY + i * lh));
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export default function Detective3DProto({ isAr, playSfx, onBack }) {
  const t = UI[isAr ? 'ar' : 'en'];
  const wrapRef = useRef(null);
  const apiRef = useRef({});
  const playSfxRef = useRef(playSfx);
  playSfxRef.current = playSfx;

  const [phase, setPhase] = useState('boot'); // boot | clue | accuse | reveal | over
  const [instr, setInstr] = useState('');
  const [chip, setChip] = useState('');
  const [solved, setSolved] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [banner, setBanner] = useState('go');
  const [bootError, setBootError] = useState(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;

    const boot = bootC3dScene(wrap, { fov: 52, fitHalf: 5.2 });
    if (boot.error) {
      setBootError(isAr ? 'تعذّر تشغيل ثلاثي الأبعاد' : 'Could not start 3D');
      return () => boot.dispose();
    }
    const { camera, playRoot, coarse, setTick, setFitHalf, renderer, dispose } = boot;

    // ── clue gem (evidence you tap to read on) ──
    const gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.62, 0),
      matStd(0xe8ac4e, { metalness: 0.4, roughness: 0.25, emissive: 0xe8ac4e, emissiveIntensity: 0.5 }),
    );
    gem.position.set(0, 0.2, 0);
    gem.visible = false;
    playRoot.add(gem);

    let suspects = [];
    const disposeSuspects = () => {
      for (const s of suspects) { disposeObject(s.mesh); s.tex?.dispose(); playRoot.remove(s.mesh); }
      suspects = [];
    };

    const layoutSuspects = (list) => {
      disposeSuspects();
      const n = list.length;
      const gap = coarse ? 2.75 : 2.95;
      list.forEach((sp, i) => {
        const tex = suspectTexture(sp.e, L(sp.name, isAr));
        const side = matStd(0x241d12, { metalness: 0.15, roughness: 0.75 });
        const face = new THREE.MeshStandardMaterial({ map: tex, emissive: new THREE.Color(0x62b277), emissiveIntensity: 0, metalness: 0.1, roughness: 0.6 });
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.5, 0.18), [side, side, side, side, face, side]);
        mesh.position.set((i - (n - 1) / 2) * gap, 0, 0);
        mesh.userData.suspectId = sp.id;
        mesh.userData.faceMat = face;
        mesh.userData.flash = 0;
        mesh.scale.setScalar(0.01);
        mesh.userData.enterT = 0;
        mesh.visible = false;
        playRoot.add(mesh);
        suspects.push({ mesh, tex, id: sp.id });
      });
      setFitHalf(Math.max(4.6, (n - 1) / 2 * gap + 1.8));
    };

    // ── session state (mirrors 2D free mode) ──
    const rng = makeRng((Date.now() * 2654435761) >>> 0);
    const session = createCaseSession(rng);
    let caseData = null;
    let steps = [];
    let stepIdx = 0;
    let gamePhase = 'clue';
    let finished = false;
    const timers = [];
    const later = (fn, ms) => { const id = window.setTimeout(fn, ms); timers.push(id); return id; };
    const clearTimers = () => { timers.forEach((id) => window.clearTimeout(id)); timers.length = 0; };

    const buildSteps = (c) => {
      const clueById = {};
      (c.clues || []).forEach((cl) => { clueById[cl.id] = cl; });
      const evidence = (c.solution?.evidence || [])
        .map((id) => clueById[id])
        .filter(Boolean);
      // Pad with any other clues if the case lists <2 proving clues.
      const extras = (c.clues || []).filter((cl) => !evidence.includes(cl));
      const proving = [...evidence, ...extras].slice(0, Math.max(2, evidence.length));
      return [
        { icon: c.e || '🔍', title: c.title, text: c.briefing },
        ...proving.map((cl) => ({ icon: cl.e || '📌', title: cl.name, text: cl.text })),
      ];
    };

    const showStep = () => {
      const s = steps[stepIdx];
      setInstr(L(s.text, isAr));
      const tierTxt = tierLabel(caseData.tier || 1, isAr);
      setChip(`${s.icon} ${L(s.title, isAr)} · ${tierTxt}`);
    };

    const goAccuse = () => {
      gamePhase = 'accuse';
      setPhase('accuse');
      gem.visible = false;
      setInstr(t.accuse);
      setChip(`🕵️ ${L(caseData.title, isAr)}`);
      suspects.forEach((s) => { s.mesh.visible = true; s.mesh.userData.enterT = 0; });
    };

    const loadCase = () => {
      clearTimers();
      session.caseNo += 1;
      caseData = pickCase('free', { diff: 'med', level: 1, session, rng, ppDone: 0 });
      steps = buildSteps(caseData);
      stepIdx = 0;
      layoutSuspects(caseData.suspects || []);
      gamePhase = 'clue';
      setPhase('clue');
      gem.visible = true;
      gem.userData.enterT = 0;
      showStep();
    };

    const advanceClue = () => {
      if (stepIdx < steps.length - 1) {
        stepIdx += 1;
        playSfxRef.current?.('click');
        showStep();
        gem.userData.pulse = 1;
      } else {
        playSfxRef.current?.('click');
        goAccuse();
      }
    };

    const accuse = (suspectId) => {
      if (gamePhase !== 'accuse' || finished) return;
      gamePhase = 'reveal';
      setPhase('reveal');
      const culprit = caseData.solution?.culprit;
      const win = suspectId === culprit;
      const chosen = suspects.find((s) => s.id === suspectId);
      const right = suspects.find((s) => s.id === culprit);
      if (win) {
        if (chosen) { chosen.mesh.userData.flash = 1; chosen.mesh.userData.flashHex = 0x62b277; }
        playSfxRef.current?.('win');
        setInstr(t.caught);
        session.solved += 1;
        setSolved(session.solved);
        later(() => { if (!finished) loadCase(); }, 1500);
      } else {
        if (chosen) { chosen.mesh.userData.flash = 1; chosen.mesh.userData.flashHex = 0xd23b3b; }
        if (right) { right.mesh.userData.flash = 1; right.mesh.userData.flashHex = 0x62b277; }
        playSfxRef.current?.('lose');
        const culpritName = L((caseData.suspects.find((x) => x.id === culprit) || {}).name, isAr);
        setInstr(`${t.wrong}${culpritName ? ` → ${culpritName}` : ''}`);
        session.lives -= 1;
        setLives(session.lives);
        if (session.lives <= 0) {
          later(() => { if (!finished) { setPhase('over'); setBanner('over'); } }, 1400);
        } else {
          later(() => { if (!finished) loadCase(); }, 1700);
        }
      }
    };

    // ── pointer ──
    const raycaster = new THREE.Raycaster();
    const ptr = new THREE.Vector2();
    const el = renderer.domElement;
    const onUp = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      const rect = el.getBoundingClientRect();
      ptr.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ptr.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ptr, camera);
      if (gamePhase === 'clue') {
        const hits = raycaster.intersectObject(gem, false);
        // Whole-screen tap advances the clue (gem is just the affordance).
        if (hits.length || gem.visible) advanceClue();
      } else if (gamePhase === 'accuse') {
        const hits = raycaster.intersectObjects(suspects.map((s) => s.mesh), false);
        if (hits.length) accuse(hits[0].object.userData.suspectId);
      }
    };
    el.addEventListener('pointerup', onUp);

    setTick((dt, now) => {
      if (gem.visible) {
        gem.rotation.y += dt * 1.1;
        gem.rotation.x = Math.sin(now * 0.001) * 0.2;
        if (gem.userData.enterT < 1) { gem.userData.enterT = Math.min(1, gem.userData.enterT + dt * 2.5); gem.scale.setScalar(gem.userData.enterT); }
        const pulseBase = 0.45 + Math.sin(now * 0.004) * 0.25;
        gem.material.emissiveIntensity = pulseBase + (gem.userData.pulse || 0);
        if (gem.userData.pulse > 0) gem.userData.pulse = Math.max(0, gem.userData.pulse - dt * 2);
      }
      for (const s of suspects) {
        const ud = s.mesh.userData;
        if (s.mesh.visible && ud.enterT < 1) {
          ud.enterT = Math.min(1, ud.enterT + dt * 2.6);
          const e = 1 - (1 - ud.enterT) ** 3;
          s.mesh.scale.setScalar(Math.max(0.01, e));
        }
        if (ud.flash > 0) { ud.flash = Math.max(0, ud.flash - dt * 0.7); ud.faceMat.emissive.setHex(ud.flashHex || 0x62b277); ud.faceMat.emissiveIntensity = ud.flash; }
        else ud.faceMat.emissiveIntensity = 0;
      }
    });

    apiRef.current = {
      start: () => {
        finished = false;
        session.lives = LIVES; session.solved = 0; session.caseNo = 0; session.pools = null; session.seq = null;
        setLives(LIVES); setSolved(0);
        setBanner(null);
        loadCase();
      },
      stop: () => { finished = true; clearTimers(); },
    };

    return () => {
      finished = true;
      clearTimers();
      el.removeEventListener('pointerup', onUp);
      disposeSuspects();
      disposeObject(gem);
      dispose();
      apiRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAr]);

  useEffect(() => {
    const id = requestAnimationFrame(() => { playSfx?.('click'); apiRef.current.start?.(); });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hint = phase === 'clue' ? (instr || t.tapClue)
    : phase === 'accuse' ? t.accuse
      : instr;

  const stats = phase === 'boot' ? [] : [
    `${solved} ${t.solved}`,
    `${'♥'.repeat(Math.max(0, lives))}`,
    phase === 'clue' ? t.tapClue : '',
  ].filter(Boolean);

  return (
    <C3dProtoChrome
      isAr={isAr}
      title={t.title}
      tag={t.tag}
      hint={hint}
      chip={chip || '🔍'}
      chipStyle={{ fontSize: '0.6rem', fontWeight: 800, color: '#e8ac4e', maxWidth: 170, whiteSpace: 'normal', lineHeight: 1.15 }}
      stats={stats}
      banner={banner === 'go' ? t.go : banner === 'over' ? t.over : null}
      bannerOver={banner === 'over'}
      bannerMeta={banner === 'over' ? t.overSub(solved) : null}
      bannerActions={banner === 'over' ? (
        <button type="button" className="c3d-cta" onClick={() => { playSfx?.('click'); apiRef.current.start?.(); }}>
          {t.again}
        </button>
      ) : null}
      bootError={bootError}
      onBack={onBack}
      playSfx={playSfx}
      canvasRef={wrapRef}
    />
  );
}
