import React, { useEffect, useRef, useState } from 'react';
import { bootC3dScene, matStd, disposeObject, THREE } from '../../../../shared/c3dBoot';
import C3dProtoChrome from '../../../../shared/C3dProtoChrome';
import {
  prepareFreeBlock,
  nbStreams,
  emptyNbStats,
  gradeBlock,
  adaptiveNextN,
  NB_GRID,
} from './nbackData';
import { MEMO_OBJECTS } from '../memo-span/memoObjects';
import '../../../../shared/c3dProto.css';

/*
 * N-Back · 3D — the REAL 2D free mode: DUAL n-back (place + object) on a
 * timed, auto-advancing stream. Blocks come from prepareFreeBlock(n, seed,
 * 'dual') — same 20-trial blocks, 2000ms stim / 900ms ISI pacing, same
 * hit/miss/FA/CR scoring per stream, gradeBlock accuracy and adaptiveNextN
 * (≥85% up, <60% down) level flow starting at 1-back. You press ▦ PLACE and/or
 * ◆ OBJECT only when the stimulus repeats from N back — exactly the 2D game.
 */

const UI = {
  en: {
    title: 'N-Back · 3D',
    tag: 'prototype',
    getReady: (n) => `${n}-back — get ready…`,
    prompt: 'Repeat from N back? ▦ place · ◆ object',
    pos: 'PLACE',
    obj: 'OBJECT',
    popUp: 'Level up!',
    popDown: 'Stepping down',
    popHold: 'Holding steady',
    popAcc: (a) => `Last round: ${a}%`,
    popCont: (n) => `Continue · ${n}-back ›`,
    popEnd: 'End run',
    over: 'Run ended',
    hub: 'Back to modes',
    go: 'ENGAGE',
    nBadge: (n) => `${n}-back`,
    trial: (i, n) => `${i}/${n}`,
  },
  ar: {
    title: 'إن-باك · ثلاثي الأبعاد',
    tag: 'نموذج',
    getReady: (n) => `${n}-عودة — استعد…`,
    prompt: 'هل تكرّر قبل N؟ ▦ المكان · ◆ الشيء',
    pos: 'المكان',
    obj: 'الشيء',
    popUp: 'مستوى أعلى!',
    popDown: 'نزول مستوى',
    popHold: 'ثبات',
    popAcc: (a) => `الجولة السابقة: ${a}٪`,
    popCont: (n) => `متابعة · ${n}-عودة ›`,
    popEnd: 'إنهاء',
    over: 'انتهت المحاولة',
    hub: 'العودة للأوضاع',
    go: 'انطلق',
    nBadge: (n) => `${n}-عودة`,
    trial: (i, n) => `${i}/${n}`,
  },
};

const STEP_GET_READY_MS = 800; // same as 2D
const OBJ_EMOJI = Object.fromEntries(MEMO_OBJECTS.map((o) => [o.id, o.emoji]));

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function emojiTexture(emoji) {
  const S = 220;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fbf3e2';
  roundRectPath(ctx, 6, 6, S - 12, S - 12, 30);
  ctx.fill();
  ctx.lineWidth = 7;
  ctx.strokeStyle = 'rgba(232,172,78,0.7)';
  ctx.stroke();
  ctx.font = '150px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji || '❓', S / 2, S / 2 + 10);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export default function NBack3DProto({ isAr, playSfx, onBack }) {
  const t = UI[isAr ? 'ar' : 'en'];
  const wrapRef = useRef(null);
  const apiRef = useRef({});
  const playSfxRef = useRef(playSfx);
  playSfxRef.current = playSfx;

  const [phase, setPhase] = useState('boot'); // boot | ready | run | pop | over
  const [n, setN] = useState(1);
  const [trialIx, setTrialIx] = useState(0);
  const [trialCount, setTrialCount] = useState(0);
  const [resp, setResp] = useState({ obj: false, pos: false });
  const [feedback, setFeedback] = useState({ obj: null, pos: null });
  const [pop, setPop] = useState(null); // { dir, prevN, nextN, acc }
  const [banner, setBanner] = useState('go');
  const [bootError, setBootError] = useState(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;

    const boot = bootC3dScene(wrap, { fov: 52, fitHalf: 3.9, bloom: true });
    if (boot.error) {
      setBootError(isAr ? 'تعذّر تشغيل ثلاثي الأبعاد' : 'Could not start 3D');
      return () => boot.dispose();
    }
    const { playRoot, coarse, setTick, setFitHalf, dispose } = boot;

    // ── 3×3 place grid ──
    const gap = coarse ? 1.5 : 1.62;
    const cells = [];
    for (let i = 0; i < NB_GRID; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.28, 1.28, 0.14),
        matStd(0x24211a, { emissive: 0xe8ac4e, emissiveIntensity: 0.04, metalness: 0.2, roughness: 0.8 }),
      );
      mesh.position.set((col - 1) * gap, (1 - row) * gap, 0);
      playRoot.add(mesh);
      cells.push(mesh);
    }
    setFitHalf(gap * 1.5 + 0.7);

    // Stimulus card (object emoji shown at the active cell)
    let stimMesh = null;
    let stimTex = null;
    const hideStim = () => {
      if (stimMesh) { playRoot.remove(stimMesh); disposeObject(stimMesh); stimMesh = null; }
      if (stimTex) { stimTex.dispose(); stimTex = null; }
      cells.forEach((m) => { m.material.emissiveIntensity = 0.04; });
    };
    const showStim = (step) => {
      hideStim();
      const cell = cells[step.pos] || cells[4];
      cell.material.emissiveIntensity = 0.6;
      stimTex = emojiTexture(OBJ_EMOJI[step.obj]);
      const face = new THREE.MeshStandardMaterial({ map: stimTex, emissive: new THREE.Color(0xe8ac4e), emissiveIntensity: 0.18, metalness: 0.1, roughness: 0.55 });
      const side = matStd(0x241d13, { emissive: 0xe8ac4e, emissiveIntensity: 0.1, metalness: 0.2, roughness: 0.6 });
      stimMesh = new THREE.Group();
      const tile = new THREE.Mesh(new THREE.BoxGeometry(1.32, 1.32, 0.2), [side, side, side, side, face, side]);
      stimMesh.add(tile);
      // Glow disc behind the tile → the current item pops off the grid.
      const glow = new THREE.Mesh(
        new THREE.CircleGeometry(0.95, 26),
        new THREE.MeshBasicMaterial({ color: 0xe8ac4e, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false }),
      );
      glow.position.z = -0.12;
      stimMesh.add(glow);
      stimMesh.position.set(cell.position.x, cell.position.y, 0.5);
      playRoot.add(stimMesh);
    };

    // ── Block state (mirrors the 2D loop) ──
    let block = null;
    let stats = emptyNbStats();
    let idx = -1;
    let respState = { obj: false, pos: false };
    let finished = false;
    const timers = [];
    const later = (fn, ms) => { const id = window.setTimeout(fn, ms); timers.push(id); return id; };
    const clearTimers = () => { timers.forEach((id) => window.clearTimeout(id)); timers.length = 0; };

    const scoreTrial = (i) => {
      const bN = block.spec.n;
      if (i < bN) return;
      const streams = nbStreams(block.spec.variant);
      const step = block.seq[i];
      const prior = block.seq[i - bN];
      streams.forEach((k) => {
        const isTarget = step[k] === prior[k];
        const did = respState[k];
        const ss = stats[k];
        if (isTarget) { if (did) ss.hit++; else ss.miss++; } else { if (did) ss.fa++; else ss.cr++; }
      });
    };

    const finishBlock = () => {
      clearTimers();
      hideStim();
      const grade = gradeBlock(stats, block.spec.variant);
      const bN = block.spec.n;
      const nextN = adaptiveNextN(bN, grade.acc);
      playSfxRef.current?.(nextN > bN ? 'win' : 'click');
      setPop({ dir: nextN > bN ? 'up' : nextN < bN ? 'down' : 'hold', prevN: bN, nextN, acc: grade.acc });
      setPhase('pop');
    };

    const runTrial = (i) => {
      if (finished || !block) return;
      if (i >= block.seq.length) { finishBlock(); return; }
      idx = i;
      setTrialIx(i + 1);
      respState = { obj: false, pos: false };
      setResp({ obj: false, pos: false });
      setFeedback({ obj: null, pos: null });
      showStim(block.seq[i]);
      later(() => hideStim(), block.spec.stimMs);
      later(() => { scoreTrial(i); runTrial(i + 1); }, block.spec.stimMs + block.spec.isiMs);
    };

    const beginBlock = (startN) => {
      clearTimers();
      hideStim();
      finished = false;
      const seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
      block = prepareFreeBlock(startN, seed, 'dual');
      stats = emptyNbStats();
      idx = -1;
      setN(block.spec.n);
      setTrialCount(block.seq.length);
      setTrialIx(0);
      setPop(null);
      setBanner(null);
      setPhase('ready');
      later(() => { if (!finished) { setPhase('run'); runTrial(0); } }, STEP_GET_READY_MS);
    };

    const respond = (stream) => {
      if (finished || !block || idx < 0) return;
      if (!nbStreams(block.spec.variant).includes(stream)) return;
      if (respState[stream]) return;
      respState = { ...respState, [stream]: true };
      setResp((p) => ({ ...p, [stream]: true }));
      const bN = block.spec.n;
      const isTarget = idx >= bN && block.seq[idx][stream] === block.seq[idx - bN][stream];
      setFeedback((p) => ({ ...p, [stream]: isTarget ? 'good' : 'bad' }));
      playSfxRef.current?.(isTarget ? 'correct' : 'wrong');
    };

    setTick((_dt, now) => {
      if (stimMesh) stimMesh.rotation.y = Math.sin(now * 0.002) * 0.08;
    });

    apiRef.current = {
      start: (startN = 1) => beginBlock(startN),
      respond,
      stop: () => { finished = true; clearTimers(); hideStim(); },
    };

    return () => {
      finished = true;
      clearTimers();
      hideStim();
      cells.forEach((m) => { disposeObject(m); playRoot.remove(m); });
      dispose();
      apiRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAr]);

  useEffect(() => {
    const id = requestAnimationFrame(() => { playSfx?.('click'); apiRef.current.start?.(1); });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = phase === 'boot' ? [] : [
    t.nBadge(n),
    phase === 'run' || phase === 'ready' ? t.trial(trialIx, trialCount) : '',
  ].filter(Boolean);

  const popTitle = pop ? (pop.dir === 'up' ? t.popUp : pop.dir === 'down' ? t.popDown : t.popHold) : null;

  return (
    <C3dProtoChrome
      isAr={isAr}
      title={t.title}
      tag={t.tag}
      hint={phase === 'ready' ? t.getReady(n) : t.prompt}
      chip={t.nBadge(n)}
      chipStyle={{ fontSize: '0.75rem', fontWeight: 800, color: '#e8ac4e' }}
      stats={stats}
      banner={banner === 'go' ? t.go : (phase === 'pop' && pop ? popTitle : null)}
      bannerOver={phase === 'pop' && pop?.dir === 'down'}
      bannerMeta={phase === 'pop' && pop ? `${t.popAcc(pop.acc)} · ${t.nBadge(pop.nextN)}` : null}
      bootError={bootError}
      onBack={onBack}
      playSfx={playSfx}
      canvasRef={wrapRef}
      bannerActions={
        phase === 'pop' && pop ? (
          <div className="c3d-banner-actions">
            <button type="button" className="c3d-cta" onClick={() => { playSfx?.('click'); apiRef.current.start?.(pop.nextN); }}>
              {t.popCont(pop.nextN)}
            </button>
            <button type="button" className="c3d-cta c3d-cta--ghost" onClick={() => { playSfx?.('click'); onBack(); }}>
              {t.popEnd}
            </button>
          </div>
        ) : null
      }
    >
      {(phase === 'run' || phase === 'ready') && (
        <div className="c3d-overlay-actions">
          <button
            type="button"
            className="c3d-choice-btn"
            disabled={resp.pos || phase !== 'run'}
            style={feedback.pos ? { borderColor: feedback.pos === 'good' ? '#62b277' : '#dd7f7a', color: feedback.pos === 'good' ? '#62b277' : '#dd7f7a' } : undefined}
            onClick={() => apiRef.current.respond?.('pos')}
          >
            ▦ {t.pos}
          </button>
          <button
            type="button"
            className="c3d-choice-btn"
            disabled={resp.obj || phase !== 'run'}
            style={feedback.obj ? { borderColor: feedback.obj === 'good' ? '#62b277' : '#dd7f7a', color: feedback.obj === 'good' ? '#62b277' : '#dd7f7a' } : undefined}
            onClick={() => apiRef.current.respond?.('obj')}
          >
            ◆ {t.obj}
          </button>
        </div>
      )}
    </C3dProtoChrome>
  );
}
