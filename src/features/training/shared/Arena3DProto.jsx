import React, { useEffect, useRef, useState, useCallback } from 'react';
import { bootC3dScene, matStd, disposeObject, THREE, ATT, CREAM } from './c3dBoot';
import C3dProtoChrome from './C3dProtoChrome';

/*
 * Shared playable cosmos arena for training 3D prototypes.
 * Spec-driven: choice / sameDiff / nback / sequence / gates.
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
  const goal = spec.goal ?? 8;

  const [phase, setPhase] = useState('boot'); // boot | play | feedback | over
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(livesMax);
  const [prompt, setPrompt] = useState('');
  const [chip, setChip] = useState('3D');
  const [options, setOptions] = useState([]);
  const [banner, setBanner] = useState('go');
  const [bannerOver, setBannerOver] = useState(false);
  const [bootError, setBootError] = useState(null);
  const [seqNeed, setSeqNeed] = useState(0);
  const [seqHave, setSeqHave] = useState(0);

  const phaseRef = useRef('boot');
  const livesRef = useRef(livesMax);
  const scoreRef = useRef(0);
  const roundRef = useRef(0);
  const trialRef = useRef(null);
  const seqIdxRef = useRef(0);
  const nbackHistRef = useRef([]);
  const nbackIdxRef = useRef(0);
  const applyResultRef = useRef(() => {});
  const mountedRef = useRef(true);
  const timersRef = useRef([]);

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

  const finishOver = useCallback((won) => {
    phaseRef.current = 'over';
    setPhase('over');
    setBannerOver(!won);
    setBanner(won ? (isAr ? 'أحسنت!' : 'Nice run!') : (isAr ? 'انتهت المحاولة' : 'Run over'));
  }, [isAr]);

  const applyResult = useCallback((ok) => {
    if (phaseRef.current !== 'play') return;
    sfxRef.current?.(ok ? 'correct' : 'wrong');
    if (ok) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
      if (scoreRef.current >= goal) {
        finishOver(true);
        return;
      }
      phaseRef.current = 'feedback';
      setPhase('feedback');
      setBanner(isAr ? 'صحيح!' : 'Correct!');
      setBannerOver(false);
      later(() => apiRef.current.nextTrial?.(), 480);
    } else {
      livesRef.current -= 1;
      setLives(livesRef.current);
      phaseRef.current = 'feedback';
      setPhase('feedback');
      setBanner(isAr ? 'خطأ' : 'Miss');
      setBannerOver(true);
      if (livesRef.current <= 0) {
        later(() => finishOver(false), 550);
      } else {
        later(() => apiRef.current.nextTrial?.(), 550);
      }
    }
  }, [finishOver, goal, isAr, later]);
  applyResultRef.current = applyResult;

  useEffect(() => {
    mountedRef.current = true;
    const wrap = wrapRef.current;
    if (!wrap) return undefined;

    const boot = bootC3dScene(wrap, { fov: 52, fitHalf: 4.2, bloom: true });
    if (boot.error) {
      setBootError(isAr ? 'تعذّر تشغيل ثلاثي الأبعاد' : 'Could not start 3D');
      return () => boot.dispose();
    }

    const { scene, camera, playRoot, coarse, setTick, setFitHalf, dispose, frame } = boot;
    const pickables = [];
    let pulseT = 0;

    const clearPlay = () => {
      while (playRoot.children.length) {
        const c = playRoot.children[0];
        playRoot.remove(c);
        disposeObject(c);
      }
      pickables.length = 0;
    };

    const placeOptions = (opts, layout = 'row') => {
      clearPlay();
      const n = opts.length;
      const span = Math.min(3.6, 0.95 * n);
      opts.forEach((opt, i) => {
        const mesh = meshFor(opt.mesh || 'box', opt.color ?? PALETTE[i % PALETTE.length], coarse ? 1.15 : 1);
        const t = n === 1 ? 0 : (i / (n - 1)) * 2 - 1;
        if (layout === 'arc') {
          const a = t * 0.7;
          mesh.position.set(Math.sin(a) * 2.4, Math.cos(a) * 0.35 - 0.2, -Math.cos(a) * 0.4);
        } else if (layout === 'grid') {
          const cols = Math.ceil(Math.sqrt(n));
          const r = Math.floor(i / cols);
          const c = i % cols;
          mesh.position.set((c - (cols - 1) / 2) * 1.15, ((Math.ceil(n / cols) - 1) / 2 - r) * 1.15, 0);
        } else {
          mesh.position.set(t * (span / 2), -0.15, 0);
        }
        mesh.userData.optId = opt.id;
        mesh.userData.correct = !!opt.correct;
        mesh.userData.seqIndex = opt.seqIndex;
        playRoot.add(mesh);
        pickables.push(mesh);
      });
      setFitHalf(layout === 'grid' ? 3.6 : 3.2);
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

    const flashMesh = (mesh, ok) => {
      if (!mesh?.material) return;
      const m = mesh.material;
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
      const hits = raycaster.intersectObjects(pickables, false);
      if (hits.length) return hits[0].object;
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

      if (spec.mode === 'sequence') {
        const want = seqIdxRef.current;
        const ok = obj.userData.seqIndex === want;
        flashMesh(obj, ok);
        if (ok) {
          seqIdxRef.current += 1;
          setSeqHave(seqIdxRef.current);
          sfxRef.current?.('correct');
          if (seqIdxRef.current >= (trial.sequence?.length || 0)) {
            applyResultRef.current(true);
          }
        } else {
          applyResultRef.current(false);
        }
        return;
      }

      if (spec.mode === 'sameDiff' || spec.mode === 'nback' || spec.mode === 'choice' || spec.mode === 'gates') {
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
      if (livesRef.current <= 0 || scoreRef.current >= goal) return;
      roundRef.current += 1;
      setRound(roundRef.current);
      phaseRef.current = 'play';
      setPhase('play');
      setBanner(null);
      setBannerOver(false);

      const rng = mulberry32((Date.now() ^ (roundRef.current * 9973)) >>> 0);
      const trial = spec.makeTrial(rng, roundRef.current);
      trialRef.current = trial;
      setPrompt(labelOf(trial.prompt, isAr));
      setChip(labelOf(trial.chip, isAr) || '3D');

      if (spec.mode === 'nback') {
        // Stream one stimulus at a time; Match / New via overlay or two spheres
        const hist = nbackHistRef.current;
        const n = trial.n || 2;
        let item = trial.item;
        // Force ~40% matches once history is deep enough
        if (hist.length >= n && rng() < 0.4) {
          item = { ...hist[hist.length - n] };
          trial.item = item;
        }
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

      if (spec.mode === 'sameDiff') {
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

      if (spec.mode === 'sequence') {
        seqIdxRef.current = 0;
        setSeqHave(0);
        setSeqNeed(trial.sequence.length);
        const opts = trial.sequence.map((node, i) => ({
          ...node,
          id: node.id ?? `n${i}`,
          seqIndex: i,
          correct: false,
        }));
        // Shuffle visual positions but keep seqIndex
        const order = opts.map((_, i) => i);
        for (let i = order.length - 1; i > 0; i--) {
          const j = Math.floor(rng() * (i + 1));
          [order[i], order[j]] = [order[j], order[i]];
        }
        const laid = order.map((idx) => opts[idx]);
        placeOptions(laid, trial.layout || 'grid');
        setOptions(normalizeOptions(laid.map((o) => ({ ...o, correct: false })), isAr));
        return;
      }

      if (spec.mode === 'gates') {
        placeGates(trial.options);
        setOptions(normalizeOptions(trial.options, isAr));
        return;
      }

      // choice
      placeOptions(trial.options, trial.layout || 'row');
      setOptions(normalizeOptions(trial.options, isAr));
    };

    apiRef.current = {
      nextTrial,
      start: () => {
        livesRef.current = livesMax;
        scoreRef.current = 0;
        roundRef.current = 0;
        nbackHistRef.current = [];
        setLives(livesMax);
        setScore(0);
        setRound(0);
        setBanner(null);
        nextTrial();
      },
      pickOption: (id) => {
        if (phaseRef.current !== 'play') return;
        const mesh = pickables.find((p) => p.userData.optId === id);
        const correct = !!mesh?.userData.correct;
        if (mesh) flashMesh(mesh, correct);
        applyResultRef.current(correct);
      },
    };

    setPhase('boot');
    setBanner('go');

    return () => {
      mountedRef.current = false;
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
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

    if (spec.mode === 'sequence') return; // mesh only

    const opt = options.find((o) => o.id === id);
    if (!opt) return;
    applyResult(!!opt.correct);
  };

  const stats = [
    isAr ? `الجولة ${round}` : `Round ${round}`,
    isAr ? `النقاط ${score}/${goal}` : `Score ${score}/${goal}`,
    isAr ? `أرواح ${lives}` : `Lives ${lives}`,
  ];
  if (spec.mode === 'sequence' && phase === 'play') {
    stats.push(isAr ? `${seqHave}/${seqNeed}` : `${seqHave}/${seqNeed}`);
  }

  const showOverlayChoices = (spec.mode === 'choice' || spec.mode === 'gates' || spec.mode === 'sameDiff' || spec.mode === 'nback')
    && phase === 'play'
    && options.some((o) => typeof o.label === 'string' && o.label.length > 0);

  return (
    <C3dProtoChrome
      isAr={isAr}
      title={title}
      tag={isAr ? 'نموذج' : 'prototype'}
      hint={phase === 'play' ? (prompt || hint) : hint}
      chip={chip}
      stats={phase === 'boot' ? [] : stats}
      banner={banner === 'go' ? (isAr ? 'جاهز؟' : 'Ready?') : banner}
      bannerOver={bannerOver}
      bannerMeta={phase === 'boot' ? hint : (phase === 'over' ? (isAr ? `النقاط ${score}` : `Score ${score}`) : null)}
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
