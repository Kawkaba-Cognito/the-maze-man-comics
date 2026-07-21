import React, { useEffect, useRef, useState, useCallback } from 'react';
import { bootC3dScene, matStd, disposeObject, THREE, ATT, CREAM } from './c3dBoot';
import C3dProtoChrome from './C3dProtoChrome';
import { SURVIVAL_MS } from './survival';

/*
 * Shared playable cosmos arena for training 3D prototypes.
 * Spec-driven: choice / sameDiff / nback / sequence / gates.
 * Set spec.survival: true for the same 60s + lives loop as 2D Survival.
 */

const COL_OK = 0x62b277;
const COL_BAD = 0xdd7f7a;
const PALETTE = [0xe8ac4e, 0x6bb3c8, 0xc47bb0, 0x7cbc7a, 0xd4a574, 0x8b9dc3, 0xe07a5f];

function mulberry32(a) {
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function meshFor(kind, color, scale = 1) {
  let geo;
  switch (kind) {
    case 'sphere': geo = new THREE.SphereGeometry(0.42 * scale, 24, 18); break;
    case 'cone': geo = new THREE.ConeGeometry(0.38 * scale, 0.72 * scale, 20); break;
    case 'cyl': geo = new THREE.CylinderGeometry(0.32 * scale, 0.32 * scale, 0.7 * scale, 20); break;
    case 'torus': geo = new THREE.TorusGeometry(0.32 * scale, 0.12 * scale, 12, 24); break;
    case 'octa': geo = new THREE.OctahedronGeometry(0.45 * scale); break;
    default: geo = new THREE.BoxGeometry(0.7 * scale, 0.7 * scale, 0.7 * scale);
  }
  const mesh = new THREE.Mesh(geo, matStd(color, {
    emissiveIntensity: 0.28,
    metalness: 0.18,
    roughness: 0.55,
  }));
  mesh.userData.baseEmissive = 0.28;
  // Avoid see-through silhouettes under bloom / grazing camera angles
  mesh.material.side = THREE.FrontSide;
  mesh.material.depthWrite = true;
  return mesh;
}

/** Square tile texture: dark card, coloured disc, bold label (Trail numbers etc.). */
function tileTexture(label, colorHex) {
  const S = 128;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#241d13';
  ctx.fillRect(0, 0, S, S);
  const col = `#${(colorHex ?? 0xe8ac4e).toString(16).padStart(6, '0')}`;
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.arc(S / 2, S / 2, S / 2 - 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.stroke();
  if (label) {
    ctx.fillStyle = '#fff';
    ctx.font = '800 58px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(label), S / 2, S / 2 + 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Transparent number decal for planets. */
function planetLabelTexture(label) {
  const S = 128;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  ctx.font = '800 76px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 10;
  ctx.strokeStyle = 'rgba(10,8,4,0.85)';
  ctx.strokeText(String(label), S / 2, S / 2 + 2);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(String(label), S / 2, S / 2 + 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Numbered planet: coloured sphere with the label floating on its face (opt.planet). */
function planetMesh(label, colorHex, scale = 1) {
  const g = new THREE.Group();
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.42 * scale, 24, 18),
    matStd(colorHex ?? ATT, { emissiveIntensity: 0.3, metalness: 0.25, roughness: 0.5 }),
  );
  g.add(sphere);
  g.userData.faceMat = sphere.material;
  g.userData.baseEmissive = 0.3;
  if (label !== '' && label != null) {
    const tex = planetLabelTexture(label);
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(0.56 * scale, 0.56 * scale),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }),
    );
    plane.position.z = 0.43 * scale;
    g.add(plane);
    g.userData.faceTex = tex;
  }
  return g;
}

function crd(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapLines(ctx, text, maxW, maxLines) {
  const words = String(text || '').split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(test).width > maxW && cur) {
      lines.push(cur);
      cur = w;
      if (lines.length >= maxLines) return lines;
    } else {
      cur = test;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  return lines;
}

/** Word/answer CARD: rounded parchment-dark card, accent edge, wrapped label. */
function textCardTexture(label, accentHex) {
  const W = 340;
  const H = 150;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  const acc = `#${(accentHex ?? 0xe8ac4e).toString(16).padStart(6, '0')}`;
  ctx.fillStyle = '#241d13';
  crd(ctx, 7, 7, W - 14, H - 14, 26);
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = acc;
  crd(ctx, 7, 7, W - 14, H - 14, 26);
  ctx.stroke();
  // accent bar on the leading edge
  ctx.fillStyle = acc;
  crd(ctx, 20, H / 2 - 34, 11, 68, 5);
  ctx.fill();
  // wrapped, auto-shrinking label
  ctx.fillStyle = '#f4ecdd';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let fs = 50;
  let lines = [];
  do {
    ctx.font = `800 ${fs}px system-ui, -apple-system, sans-serif`;
    lines = wrapLines(ctx, label, W - 84, 2);
    fs -= 3;
  } while (lines.length >= 2 && ctx.measureText(lines[0]).width > W - 84 && fs > 22);
  const lh = fs * 1.22;
  lines.forEach((ln, i) => ctx.fillText(ln, W / 2 + 10, H / 2 - ((lines.length - 1) * lh) / 2 + i * lh));
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function textCardMesh(label, accentHex, scale = 1) {
  const tex = textCardTexture(label, accentHex ?? 0xe8ac4e);
  const side = matStd(0x1a140c, { metalness: 0.2, roughness: 0.62 });
  const face = new THREE.MeshStandardMaterial({
    map: tex,
    emissive: new THREE.Color(accentHex ?? 0xe8ac4e),
    emissiveIntensity: 0.12,
    metalness: 0.15,
    roughness: 0.55,
  });
  const w = 2.02 * scale;
  const h = 0.9 * scale;
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.16 * scale), [side, side, side, side, face, side]);
  mesh.userData.faceMat = face;
  mesh.userData.faceTex = tex;
  mesh.userData.baseEmissive = 0.12;
  return mesh;
}

/** Flat tile mesh with a text label drawn on the face (opt.showLabel). */
function labeledMesh(label, colorHex, scale = 1) {
  const tex = tileTexture(label, colorHex);
  const side = matStd(0x1d1811, { metalness: 0.2, roughness: 0.6 });
  const face = new THREE.MeshStandardMaterial({
    map: tex,
    metalness: 0.15,
    roughness: 0.55,
    emissive: new THREE.Color(0xe8ac4e),
    emissiveIntensity: 0,
  });
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.82 * scale, 0.82 * scale, 0.22 * scale),
    [side, side, side, side, face, side],
  );
  mesh.userData.faceMat = face;
  mesh.userData.faceTex = tex;
  mesh.userData.baseEmissive = 0;
  return mesh;
}

function labelOf(v, isAr) {
  if (v == null) return '';
  if (typeof v === 'string' || typeof v === 'number') return String(v);
  if (typeof v === 'object') {
    const s = isAr ? (v.ar ?? v.en) : (v.en ?? v.ar);
    if (s != null && typeof s !== 'object') return String(s);
  }
  return '';
}

/** Normalize trial option labels so React never receives {en,ar} objects as children. */
function normalizeOptions(opts, isAr) {
  return (opts || []).map((o, i) => ({
    id: o.id ?? `opt${i}`,
    label: labelOf(o.label, isAr),
    correct: !!o.correct,
    color: o.color,
    mesh: o.mesh,
    seqIndex: o.seqIndex,
  }));
}

/**
 * @param {{
 *   isAr: boolean,
 *   playSfx?: Function,
 *   onBack: () => void,
 *   spec: {
 *     title: {en:string, ar:string},
 *     hint?: {en:string, ar:string},
 *     mode: 'choice'|'sameDiff'|'nback'|'sequence'|'gates',
 *     lives?: number,
 *     goal?: number,
 *     makeTrial: (rng:()=>number, round:number) => object,
 *   }
 * }} props
 */
export default function Arena3DProto({ isAr, playSfx, onBack, spec }) {
  const wrapRef = useRef(null);
  const apiRef = useRef({});
  const sfxRef = useRef(playSfx);
  sfxRef.current = playSfx;

  const livesMax = spec.lives ?? 3;
  const noLives = livesMax <= 0; // e.g. Word Links Survival: wrongs reset combo, never end the run
  const survival = !!spec.survival;
  const endless = !!spec.endless; // e.g. Trivia Survival: no clock, run ends on lives only
  const bigPrompt = !!spec.bigPrompt; // Word Links / Trivia: headline question up top
  const goal = (survival || endless) ? Number.POSITIVE_INFINITY : (spec.goal ?? 8);
  const runMs = spec.survivalMs ?? SURVIVAL_MS;

  const [phase, setPhase] = useState('boot'); // boot | play | feedback | over
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [points, setPoints] = useState(0);
  const [lives, setLives] = useState(livesMax);
  const [timeLeft, setTimeLeft] = useState(Math.ceil(runMs / 1000));
  const [trialSecs, setTrialSecs] = useState(0);
  const [prompt, setPrompt] = useState('');
  const [chip, setChip] = useState('3D');
  const [options, setOptions] = useState([]);
  const [cardMode, setCardMode] = useState(false);
  const [banner, setBanner] = useState('go');
  const [bannerOver, setBannerOver] = useState(false);
  const [bootError, setBootError] = useState(null);
  const [seqNeed, setSeqNeed] = useState(0);
  const [seqHave, setSeqHave] = useState(0);

  const phaseRef = useRef('boot');
  const livesRef = useRef(livesMax);
  const scoreRef = useRef(0);
  const pointsRef = useRef(0);
  const comboRef = useRef(0);
  const wrongsRef = useRef(0);
  const roundRef = useRef(0);
  const trialRef = useRef(null);
  const seqIdxRef = useRef(0);
  const nbackHistRef = useRef([]);
  const nbackIdxRef = useRef(0);
  const applyResultRef = useRef(() => {});
  const mountedRef = useRef(true);
  const timersRef = useRef([]);
  const runStartRef = useRef(0);
  const runEndsAtRef = useRef(0);
  const tickTimerRef = useRef(null);
  const trialTimerRef = useRef(null);
  const trialEndsAtRef = useRef(0);

  const title = labelOf(spec.title, isAr);
  const hint = labelOf(spec.hint, isAr);

  const later = useCallback((fn, ms) => {
    const id = setTimeout(() => {
      if (!mountedRef.current) return;
      fn();
    }, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  const clearRunTimer = useCallback(() => {
    if (tickTimerRef.current) {
      clearInterval(tickTimerRef.current);
      tickTimerRef.current = null;
    }
  }, []);

  const clearTrialTimer = useCallback(() => {
    if (trialTimerRef.current) {
      clearInterval(trialTimerRef.current);
      trialTimerRef.current = null;
    }
  }, []);

  const finishOver = useCallback((won, reason) => {
    clearRunTimer();
    clearTrialTimer();
    phaseRef.current = 'over';
    setPhase('over');
    setBannerOver(!won);
    if (reason === 'time') {
      setBanner(isAr ? 'انتهى الوقت' : "Time's up");
    } else {
      setBanner(won ? (isAr ? 'أحسنت!' : 'Nice run!') : (isAr ? 'انتهت المحاولة' : 'Run over'));
    }
  }, [isAr, clearRunTimer, clearTrialTimer]);

  const applyResult = useCallback((ok, reason) => {
    if (phaseRef.current !== 'play') return;
    clearTrialTimer();
    const trial = trialRef.current;
    const feedbackText = trial?.feedbackText ? labelOf(trial.feedbackText, isAr) : null;
    sfxRef.current?.(ok ? 'correct' : 'wrong');
    if (ok) {
      // Same order as the 2D loops: points use the streak BEFORE this answer.
      if (spec.points) {
        const trialMsLeft = trial?.timeMs ? Math.max(0, trialEndsAtRef.current - performance.now()) : 0;
        pointsRef.current += spec.points(comboRef.current, trial, { trialMsLeft }) || 0;
        setPoints(pointsRef.current);
      }
      if (!trial?.noScore) {
        comboRef.current += 1;
        scoreRef.current += 1;
        setScore(scoreRef.current);
      }
      if (!survival && !endless && scoreRef.current >= goal) {
        finishOver(true);
        return;
      }
      phaseRef.current = 'feedback';
      setPhase('feedback');
      setBanner(feedbackText || (isAr ? 'صحيح!' : 'Correct!'));
      setBannerOver(false);
      later(() => apiRef.current.nextTrial?.(), trial?.feedbackMs ?? 480);
    } else {
      if (!trial?.noScore) comboRef.current = 0;
      wrongsRef.current += 1;
      phaseRef.current = 'feedback';
      setPhase('feedback');
      setBanner(feedbackText || (reason === 'timeout' ? (isAr ? 'انتهى الوقت' : 'Too slow') : (isAr ? 'خطأ' : 'Miss')));
      setBannerOver(true);
      if (!noLives) {
        livesRef.current -= 1;
        setLives(livesRef.current);
        if (livesRef.current <= 0) {
          // End-of-run partial credit (e.g. Trivia's step×10 at game over).
          if (spec.points && trial?.ptsOver) {
            pointsRef.current += trial.ptsOver;
            setPoints(pointsRef.current);
          }
          later(() => finishOver(false), trial?.feedbackMs ?? 550);
          return;
        }
      }
      later(() => apiRef.current.nextTrial?.(), trial?.feedbackMs ?? 550);
    }
  }, [finishOver, goal, isAr, later, survival, endless, noLives, clearTrialTimer, spec]);
  applyResultRef.current = applyResult;
  const finishOverRef = useRef(finishOver);
  finishOverRef.current = finishOver;

  useEffect(() => {
    mountedRef.current = true;
    const wrap = wrapRef.current;
    if (!wrap) return undefined;

    const boot = bootC3dScene(wrap, {
      fov: 52,
      fitHalf: 4.2,
      bloom: true,
      // Reserve a tall top band for the headline question (Word Links / Trivia).
      hudReserveFrac: bigPrompt ? 0.34 : undefined,
    });
    if (boot.error) {
      setBootError(isAr ? 'تعذّر تشغيل ثلاثي الأبعاد' : 'Could not start 3D');
      return () => boot.dispose();
    }

    const { scene, camera, playRoot, coarse, setTick, setFitHalf, setFitBox, dispose, frame } = boot;
    const pickables = [];
    let pulseT = 0;
    let pick2First = null;

    // Connecting trail for sequence games — draws the path through the nodes
    // you have tapped so far, so "connect the numbers" reads as connecting.
    const seqLineGeo = new THREE.BufferGeometry();
    seqLineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(64 * 3), 3));
    seqLineGeo.setDrawRange(0, 0);
    const seqLine = new THREE.Line(
      seqLineGeo,
      new THREE.LineBasicMaterial({ color: 0xe8ac4e, transparent: true, opacity: 0.9, depthTest: false }),
    );
    seqLine.renderOrder = 5;
    playRoot.add(seqLine);
    let seqLineCount = 0;

    const pushSeqPoint = (mesh) => {
      if (!mesh || seqLineCount >= 64) return;
      const pos = seqLineGeo.attributes.position;
      pos.setXYZ(seqLineCount, mesh.position.x, mesh.position.y, mesh.position.z + 0.5);
      seqLineCount += 1;
      seqLineGeo.setDrawRange(0, seqLineCount);
      pos.needsUpdate = true;
    };

    const clearPlay = () => {
      for (let i = playRoot.children.length - 1; i >= 0; i--) {
        const c = playRoot.children[i];
        if (c === seqLine) continue;
        playRoot.remove(c);
        disposeObject(c);
      }
      pickables.length = 0;
      seqLineCount = 0;
      seqLineGeo.setDrawRange(0, 0);
    };

    const placeOptions = (opts, layout = 'row') => {
      clearPlay();
      const n = opts.length;

      // Word/answer CARD layout (Word Links, Trivia): readable text cards you
      // tap directly — matches the 2D games, only the cosmic styling differs.
      if (layout === 'cards') {
        // Portrait phones stack into ONE column (fills the tall screen + matches
        // the 2D vertical list); landscape/desktop keeps 2 columns for 4 cards.
        const portrait = wrap.clientHeight > wrap.clientWidth * 1.15;
        const cols = n <= 3 ? 1 : (portrait ? 1 : 2);
        const rowsN = Math.ceil(n / cols);
        // Bigger cards — a single column especially was floating narrow in the
        // middle. Scale them up and fit tight so the answers fill the width.
        const cardScale = cols === 1 ? (coarse ? 1.34 : 1.42) : (coarse ? 1.04 : 1.12);
        const cw = 2.02 * cardScale + 0.28;
        const ch = 0.9 * cardScale + 0.34;
        opts.forEach((opt, i) => {
          // Resolve bilingual {en,ar} labels — Trivia's answers are objects and
          // were rendering as "[object Object]" on the 3D cards.
          const mesh = textCardMesh(labelOf(opt.label, isAr), opt.color ?? PALETTE[i % PALETTE.length], cardScale);
          const r = Math.floor(i / cols);
          const c = i % cols;
          const inRow = r === rowsN - 1 ? n - cols * (rowsN - 1) : cols;
          mesh.position.set((c - (inRow - 1) / 2) * cw, ((rowsN - 1) / 2 - r) * ch, 0);
          mesh.userData.optId = opt.id;
          mesh.userData.correct = !!opt.correct;
          playRoot.add(mesh);
          pickables.push(mesh);
        });
        setFitBox((cols * cw) / 2 + 0.15, (rowsN * ch) / 2 + 0.2);
        frame();
        return;
      }

      const span = Math.min(3.6, 0.95 * n);
      const big = n > 12; // large boards (Trail) shrink tiles + tighten cells
      const cell = big ? 0.92 : 1.15;
      const itemScale = (coarse ? 1.15 : 1) * (big ? 0.78 : 1);
      const cols = Math.ceil(Math.sqrt(n));
      opts.forEach((opt, i) => {
        const mesh = opt.planet
          ? planetMesh(opt.label, opt.color, itemScale)
          : opt.showLabel
            ? labeledMesh(opt.label, opt.color, itemScale)
            : meshFor(opt.mesh || 'box', opt.color ?? PALETTE[i % PALETTE.length], itemScale);
        const t = n === 1 ? 0 : (i / (n - 1)) * 2 - 1;
        if (layout === 'arc') {
          const a = t * 0.7;
          mesh.position.set(Math.sin(a) * 2.4, Math.cos(a) * 0.35 - 0.2, -Math.cos(a) * 0.4);
        } else if (layout === 'grid' || layout === 'scatter') {
          const r = Math.floor(i / cols);
          const c = i % cols;
          let x = (c - (cols - 1) / 2) * cell;
          let y = ((Math.ceil(n / cols) - 1) / 2 - r) * cell;
          if (layout === 'scatter') {
            x += (Math.random() - 0.5) * cell * 0.34;
            y += (Math.random() - 0.5) * cell * 0.34;
          }
          mesh.position.set(x, y, 0);
        } else {
          mesh.position.set(t * (span / 2), -0.15, 0);
        }
        mesh.userData.optId = opt.id;
        mesh.userData.correct = !!opt.correct;
        mesh.userData.seqIndex = opt.seqIndex;
        playRoot.add(mesh);
        pickables.push(mesh);
      });
      // Grid/scatter fit: games may tighten it (spec.gridFitPad / gridFitFloor)
      // so small boards fill the screen instead of floating in black margins.
      const gridPad = spec.gridFitPad ?? 1.3;
      const gridFloor = spec.gridFitFloor ?? 3.6;
      setFitHalf(layout === 'row' ? 3.2 : Math.max(gridFloor, (cols * cell) / 2 + gridPad));
      frame();
    };

    const placeStimulus = (kind, color, scale = 1.35) => {
      clearPlay();
      const mesh = meshFor(kind || 'octa', color ?? ATT, scale);
      mesh.position.set(0, 0.2, 0);
      playRoot.add(mesh);
      pickables.push(mesh);
      setFitHalf(2.6);
      frame();
    };

    const placeGates = (opts) => {
      clearPlay();
      const deck = new THREE.Mesh(
        new THREE.PlaneGeometry(6.2, 8),
        matStd(0x12100e, { emissive: 0x2a2218, emissiveIntensity: 0.2, metalness: 0.2, roughness: 0.85 }),
      );
      deck.rotation.x = -Math.PI / 2;
      deck.position.y = -1.1;
      playRoot.add(deck);
      opts.forEach((opt, i) => {
        const g = new THREE.Group();
        const pillar = new THREE.Mesh(
          new THREE.BoxGeometry(1.1, 1.6, 0.35),
          matStd(opt.color ?? PALETTE[i % PALETTE.length], { emissiveIntensity: 0.25 }),
        );
        pillar.position.y = 0.2;
        pillar.userData.optId = opt.id;
        pillar.userData.correct = !!opt.correct;
        g.position.set((i - 1) * 1.55, 0, 1.2);
        g.add(pillar);
        playRoot.add(g);
        pickables.push(pillar);
      });
      setFitHalf(4.0);
      frame();
    };

    const matOf = (mesh) => mesh?.userData?.faceMat
      || (mesh?.material && !Array.isArray(mesh.material) ? mesh.material : null);

    const flashMesh = (mesh, ok) => {
      const m = matOf(mesh);
      if (!m) return;
      m.emissive = new THREE.Color(ok ? COL_OK : COL_BAD);
      m.emissiveIntensity = 0.85;
      setTimeout(() => {
        if (m) {
          m.emissive = new THREE.Color(mesh.userData.baseColor || ATT);
          m.emissiveIntensity = mesh.userData.baseEmissive ?? 0.18;
        }
      }, 280);
    };

    const raycaster = new THREE.Raycaster();
    const ptr = new THREE.Vector2();

    const hitAt = (clientX, clientY) => {
      const rect = wrap.getBoundingClientRect();
      ptr.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      ptr.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ptr, camera);
      // recursive: planet options are groups (sphere + label plane)
      const hits = raycaster.intersectObjects(pickables, true);
      if (hits.length) {
        let obj = hits[0].object;
        while (obj && obj.userData.optId === undefined && obj.parent) obj = obj.parent;
        if (obj && obj.userData.optId !== undefined) return obj;
      }
      if (coarse && pickables.length) {
        // Soft pick: nearest projected center
        let best = null;
        let bestD = Infinity;
        pickables.forEach((m) => {
          const v = m.getWorldPosition(new THREE.Vector3()).project(camera);
          const dx = v.x - ptr.x;
          const dy = v.y - ptr.y;
          const d = dx * dx + dy * dy;
          if (d < bestD) { bestD = d; best = m; }
        });
        if (bestD < 0.22) return best;
      }
      return null;
    };

    const onPointer = (e) => {
      if (phaseRef.current !== 'play') return;
      const trial = trialRef.current;
      if (!trial) return;
      const x = e.clientX ?? e.touches?.[0]?.clientX;
      const y = e.clientY ?? e.touches?.[0]?.clientY;
      if (x == null) return;
      const obj = hitAt(x, y);
      if (!obj) return;
      e.preventDefault?.();
      const mode = trial.mode || spec.mode;

      if (mode === 'sequence') {
        const want = seqIdxRef.current;
        const ok = obj.userData.seqIndex === want;
        flashMesh(obj, ok);
        if (ok) {
          pushSeqPoint(obj);
          seqIdxRef.current += 1;
          setSeqHave(seqIdxRef.current);
          sfxRef.current?.('correct');
          if (seqIdxRef.current >= (trial.sequence?.length || 0)) {
            applyResultRef.current(true);
          }
        } else if (trial.seqSoftErrors) {
          // 2D Trail rule: a wrong tap is an error + clock penalty, not a fail.
          sfxRef.current?.('wrong');
          if (trial.seqErrorPenaltyMs && trialEndsAtRef.current) {
            trialEndsAtRef.current -= trial.seqErrorPenaltyMs;
          }
        } else {
          applyResultRef.current(false);
        }
        return;
      }

      if (mode === 'pick2') {
        const id = obj.userData.optId;
        const om = matOf(obj);
        if (pick2First == null) {
          pick2First = id;
          if (om) om.emissiveIntensity = 0.85;
          sfxRef.current?.('click');
        } else if (pick2First === id) {
          pick2First = null;
          if (om) om.emissiveIntensity = obj.userData.baseEmissive ?? 0.28;
          sfxRef.current?.('click');
        } else {
          const pair = trial.pairIds || [];
          const ok = pair.includes(pick2First) && pair.includes(id);
          const firstMesh = pickables.find((p) => p.userData.optId === pick2First);
          if (firstMesh) flashMesh(firstMesh, ok);
          flashMesh(obj, ok);
          pick2First = null;
          applyResultRef.current(ok);
        }
        return;
      }

      if (mode === 'sameDiff' || mode === 'nback' || mode === 'choice' || mode === 'gates') {
        trial.onAnswer?.(obj.userData.optId, !!obj.userData.correct);
        flashMesh(obj, !!obj.userData.correct);
        applyResultRef.current(!!obj.userData.correct);
      }
    };

    wrap.addEventListener('pointerdown', onPointer, { passive: false });

    setTick((_dt, now) => {
      pulseT = now * 0.001;
      playRoot.children.forEach((c, i) => {
        if (c.isMesh || c.isGroup) {
          c.rotation.y = Math.sin(pulseT * 0.7 + i) * 0.12;
          if (c.isMesh) c.rotation.x = Math.sin(pulseT * 0.5 + i * 0.3) * 0.06;
        }
      });
    });

    const nextTrial = () => {
      if (phaseRef.current === 'over' || (!noLives && livesRef.current <= 0) || scoreRef.current >= goal) return;
      roundRef.current += 1;
      setRound(roundRef.current);
      phaseRef.current = 'play';
      setPhase('play');
      setBanner(null);
      setBannerOver(false);

      const rng = mulberry32((Date.now() ^ (roundRef.current * 9973)) >>> 0);
      const now = performance.now();
      const ctx = {
        ramp: survival ? Math.max(0, Math.min(1, (now - runStartRef.current) / runMs)) : 0,
        elapsedMs: now - runStartRef.current,
        correct: scoreRef.current,
        combo: comboRef.current,
        wrongs: wrongsRef.current,
      };
      const trial = spec.makeTrial(rng, roundRef.current, ctx);
      trialRef.current = trial;
      setPrompt(labelOf(trial.prompt, isAr));
      setChip(labelOf(trial.chip, isAr) || '3D');
      // Card trials are tapped directly on their 3D word cards → no overlay row.
      setCardMode(trial.layout === 'cards');

      // Per-trial clock (the 2D per-item deadlines): timing out = a wrong answer.
      clearTrialTimer();
      if (trial.timeMs > 0) {
        trialEndsAtRef.current = now + trial.timeMs;
        setTrialSecs(Math.ceil(trial.timeMs / 1000));
        const forRound = roundRef.current;
        trialTimerRef.current = setInterval(() => {
          if (phaseRef.current !== 'play' || roundRef.current !== forRound) { clearTrialTimer(); return; }
          const left = trialEndsAtRef.current - performance.now();
          if (left <= 0) {
            setTrialSecs(0);
            if (trialRef.current?.timeoutEndsRun) {
              finishOverRef.current(false, 'time');
            } else {
              applyResultRef.current(false, 'timeout');
            }
          } else {
            setTrialSecs(Math.ceil(left / 1000));
          }
        }, 120);
      } else {
        setTrialSecs(0);
      }

      const mode = trial.mode || spec.mode;
      if (mode === 'nback') {
        // Stream one stimulus at a time; Match / New via overlay or two spheres.
        // Items come straight from the real prepared block (spec.makeTrial), so
        // the match rate is the generator's target rate — no synthetic force-match.
        const hist = nbackHistRef.current;
        const n = trial.n || 2;
        const item = trial.item;
        const isMatch = hist.length >= n && hist[hist.length - n]?.key === item.key;
        hist.push(item);
        if (hist.length > 12) hist.shift();
        nbackIdxRef.current += 1;
        placeStimulus(item.mesh, item.color);
        {
          const opts = normalizeOptions([
            { id: 'match', label: isAr ? 'مطابق' : 'Match', correct: isMatch, color: COL_OK, mesh: 'sphere' },
            { id: 'new', label: isAr ? 'جديد' : 'New', correct: !isMatch, color: COL_BAD, mesh: 'box' },
          ], isAr);
          setOptions(opts);
          clearPlay();
          const stim = meshFor(item.mesh, item.color, 1.2);
          stim.position.set(0, 1.1, 0);
          playRoot.add(stim);
          opts.forEach((opt, i) => {
            const m = meshFor(opt.mesh || (i === 0 ? 'sphere' : 'box'), opt.color || (i === 0 ? 0x62b277 : 0xd4a574), coarse ? 1.2 : 1);
            m.position.set(i === 0 ? -1.3 : 1.3, -0.5, 0);
            m.userData.optId = opt.id;
            m.userData.correct = opt.correct;
            playRoot.add(m);
            pickables.push(m);
          });
          setFitHalf(3.4);
          frame();
        }
        return;
      }

      if (mode === 'sameDiff') {
        const a = trial.a;
        const b = trial.b;
        const same = a.key === b.key;
        clearPlay();
        const ma = meshFor(a.mesh, a.color, 1.15);
        const mb = meshFor(b.mesh, b.color, 1.15);
        ma.position.set(-1.25, 0.35, 0);
        mb.position.set(1.25, 0.35, 0);
        playRoot.add(ma, mb);
        const opts = normalizeOptions([
          { id: 'same', label: isAr ? 'نفسه' : 'Same', correct: same, color: 0x62b277, mesh: 'sphere' },
          { id: 'diff', label: isAr ? 'مختلف' : 'Different', correct: !same, color: 0xd4a574, mesh: 'cone' },
        ], isAr);
        opts.forEach((opt, i) => {
          const m = meshFor(opt.mesh || (i === 0 ? 'sphere' : 'cone'), opt.color || (i === 0 ? 0x62b277 : 0xd4a574), coarse ? 1.15 : 1);
          m.position.set(i === 0 ? -1.2 : 1.2, -1.15, 0);
          m.userData.optId = opt.id;
          m.userData.correct = opt.correct;
          playRoot.add(m);
          pickables.push(m);
        });
        setFitHalf(3.6);
        frame();
        setOptions(opts);
        return;
      }

      if (mode === 'sequence') {
        seqIdxRef.current = 0;
        setSeqHave(0);
        setSeqNeed(trial.sequence.length);
        const opts = trial.sequence.map((node, i) => ({
          ...node,
          id: node.id ?? `n${i}`,
          seqIndex: i,
          correct: false,
        }));
        // Lures (wrong-colour copies, decoys): tappable but never the next step.
        const lures = (trial.lures || []).map((l, i) => ({
          ...l,
          id: l.id ?? `x${i}`,
          seqIndex: -1,
          correct: false,
        }));
        const all = [...opts, ...lures];
        // Shuffle visual positions but keep seqIndex
        const order = all.map((_, i) => i);
        for (let i = order.length - 1; i > 0; i--) {
          const j = Math.floor(rng() * (i + 1));
          [order[i], order[j]] = [order[j], order[i]];
        }
        const laid = order.map((idx) => all[idx]);
        placeOptions(laid, trial.layout || 'grid');
        setOptions(trial.noOverlay ? [] : normalizeOptions(laid.map((o) => ({ ...o, correct: false })), isAr));
        return;
      }

      if (mode === 'gates') {
        placeGates(trial.options);
        setOptions(normalizeOptions(trial.options, isAr));
        return;
      }

      if (mode === 'pick2') {
        pick2First = null;
        placeOptions(trial.options, trial.layout || 'grid');
        setOptions(normalizeOptions(trial.options, isAr));
        return;
      }

      // choice — optional floating stimulus above the picks
      placeOptions(trial.options, trial.layout || 'row');
      if (trial.stimulus) {
        const stim = meshFor(
          trial.stimulus.mesh || 'octa',
          trial.stimulus.color ?? ATT,
          trial.stimulus.scale ?? 1.15,
        );
        stim.position.set(
          trial.stimulus.x ?? 0,
          trial.stimulus.y ?? 1.35,
          trial.stimulus.z ?? 0,
        );
        stim.rotation.z = trial.stimulus.rotZ || 0;
        stim.rotation.x = trial.stimulus.rotX || 0;
        playRoot.add(stim);
        setFitHalf(Math.max(3.6, (trial.layout === 'grid' ? 3.6 : 3.2) + 0.4));
        frame();
      }
      setOptions(normalizeOptions(trial.options, isAr));
    };

    apiRef.current = {
      nextTrial,
      start: () => {
        livesRef.current = livesMax;
        scoreRef.current = 0;
        pointsRef.current = 0;
        comboRef.current = 0;
        wrongsRef.current = 0;
        roundRef.current = 0;
        nbackHistRef.current = [];
        phaseRef.current = 'boot';
        runStartRef.current = performance.now();
        clearTrialTimer();
        setLives(livesMax);
        setScore(0);
        setPoints(0);
        setRound(0);
        setBanner(null);
        spec.onStart?.();
        if (survival) {
          clearRunTimer();
          runEndsAtRef.current = performance.now() + runMs;
          setTimeLeft(Math.ceil(runMs / 1000));
          tickTimerRef.current = setInterval(() => {
            const left = runEndsAtRef.current - performance.now();
            if (left <= 0) {
              setTimeLeft(0);
              finishOverRef.current(true, 'time');
            } else {
              setTimeLeft(Math.ceil(left / 1000));
            }
          }, 250);
        }
        nextTrial();
      },
      pickOption: (id) => {
        if (phaseRef.current !== 'play') return;
        const mesh = pickables.find((p) => p.userData.optId === id);
        const correct = !!mesh?.userData.correct;
        trialRef.current?.onAnswer?.(id, correct);
        if (mesh) flashMesh(mesh, correct);
        applyResultRef.current(correct);
      },
      // Overlay tap path for pick2 trials — mirrors the mesh two-tap logic.
      pickPair: (id) => {
        if (phaseRef.current !== 'play') return;
        const mesh = pickables.find((p) => p.userData.optId === id);
        if (!mesh) return;
        const pm = matOf(mesh);
        if (pick2First == null) {
          pick2First = id;
          if (pm) pm.emissiveIntensity = 0.85;
          return;
        }
        if (pick2First === id) {
          pick2First = null;
          if (pm) pm.emissiveIntensity = mesh.userData.baseEmissive ?? 0.28;
          return;
        }
        const pair = trialRef.current?.pairIds || [];
        const ok = pair.includes(pick2First) && pair.includes(id);
        const firstMesh = pickables.find((p) => p.userData.optId === pick2First);
        if (firstMesh) flashMesh(firstMesh, ok);
        flashMesh(mesh, ok);
        pick2First = null;
        applyResultRef.current(ok);
      },
      // Sequence overlay tap — mirrors the mesh-pick sequence path so labelled
      // number buttons (Trail Making) drive the same ordered-tap logic.
      pickSeq: (id) => {
        if (phaseRef.current !== 'play') return;
        const mesh = pickables.find((p) => p.userData.optId === id);
        if (!mesh) return;
        const want = seqIdxRef.current;
        const ok = mesh.userData.seqIndex === want;
        flashMesh(mesh, ok);
        if (ok) {
          pushSeqPoint(mesh);
          seqIdxRef.current += 1;
          setSeqHave(seqIdxRef.current);
          sfxRef.current?.('correct');
          if (seqIdxRef.current >= (trialRef.current?.sequence?.length || 0)) {
            applyResultRef.current(true);
          }
        } else {
          applyResultRef.current(false);
        }
      },
    };

    setPhase('boot');
    setBanner('go');

    return () => {
      mountedRef.current = false;
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      clearRunTimer();
      clearTrialTimer();
      seqLineGeo.dispose();
      seqLine.material.dispose();
      wrap.removeEventListener('pointerdown', onPointer);
      dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec.mode, isAr]);

  const startRun = () => {
    sfxRef.current?.('click');
    apiRef.current.start?.();
  };

  const pickOverlay = (id) => {
    sfxRef.current?.('click');
    // Prefer mesh pick path via api
    const trial = trialRef.current;
    if (!trial && spec.mode !== 'nback' && spec.mode !== 'sameDiff') return;
    if (phaseRef.current !== 'play') return;
    const mode = trial?.mode || spec.mode;

    if (mode === 'sequence') { apiRef.current.pickSeq?.(id); return; }
    if (mode === 'pick2') { apiRef.current.pickPair?.(id); return; }

    const opt = options.find((o) => o.id === id);
    if (!opt) return;
    trial?.onAnswer?.(id, !!opt.correct);
    applyResult(!!opt.correct);
  };

  const stats = [
    isAr ? `الجولة ${round}` : `Round ${round}`,
    (survival || endless)
      ? (isAr ? `✓ ${score}` : `✓ ${score}`)
      : (isAr ? `النقاط ${score}/${goal}` : `Score ${score}/${goal}`),
  ];
  if (spec.points) stats.push(isAr ? `${points} نقطة` : `${points} pts`);
  if (!noLives) stats.push(isAr ? `أرواح ${lives}` : `Lives ${lives}`);
  if (survival && phase !== 'boot') {
    stats.push(isAr ? `${timeLeft}ث` : `${timeLeft}s`);
  }
  if (trialSecs > 0 && phase === 'play') {
    stats.push(`⏱${trialSecs}`);
  }
  if (spec.mode === 'sequence' && phase === 'play') {
    stats.push(isAr ? `${seqHave}/${seqNeed}` : `${seqHave}/${seqNeed}`);
  }

  const activeMode = (phase === 'play' && trialRef.current?.mode) || spec.mode;
  const showOverlayChoices = (activeMode === 'choice' || activeMode === 'gates' || activeMode === 'sameDiff' || activeMode === 'nback' || activeMode === 'sequence' || activeMode === 'pick2')
    && phase === 'play'
    && !cardMode
    && options.some((o) => typeof o.label === 'string' && o.label.length > 0);

  return (
    <C3dProtoChrome
      isAr={isAr}
      title={title}
      tag={isAr ? 'نموذج' : 'prototype'}
      hint={bigPrompt ? (phase === 'play' ? '' : hint) : (phase === 'play' ? (prompt || hint) : hint)}
      question={bigPrompt && phase === 'play' ? prompt : null}
      chip={chip}
      stats={phase === 'boot' ? [] : stats}
      banner={banner === 'go' ? (isAr ? 'جاهز؟' : 'Ready?') : banner}
      bannerOver={bannerOver}
      bannerMeta={phase === 'boot' ? hint : (phase === 'over'
        ? (spec.points
          ? (isAr ? `${points} نقطة · ✓${score}` : `${points} pts · ✓${score}`)
          : (isAr ? `النقاط ${score}` : `Score ${score}`))
        : null)}
      bootError={bootError}
      onBack={onBack}
      playSfx={playSfx}
      canvasRef={wrapRef}
      bannerActions={
        phase === 'boot' || phase === 'over' ? (
          <div className="c3d-banner-actions">
            <button type="button" className="c3d-cta" onClick={startRun}>
              {phase === 'over' ? (isAr ? 'إعادة' : 'Retry') : (isAr ? 'انطلق' : 'ENGAGE')}
            </button>
            <button type="button" className="c3d-cta c3d-cta--ghost" onClick={() => { playSfx?.('click'); onBack(); }}>
              {isAr ? 'العودة' : 'Back to modes'}
            </button>
          </div>
        ) : null
      }
    >
      {showOverlayChoices && (
        <div className="c3d-overlay-actions">
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              className="c3d-choice-btn"
              onClick={() => pickOverlay(o.id)}
            >
              {typeof o.label === 'string' ? o.label : labelOf(o.label, isAr)}
            </button>
          ))}
        </div>
      )}
    </C3dProtoChrome>
  );
}

export { PALETTE, mulberry32, labelOf, ATT, CREAM };
