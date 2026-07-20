import React, { useEffect, useRef, useState } from 'react';
import { bootC3dScene, matStd, disposeObject, THREE } from '../../../../shared/c3dBoot';
import C3dProtoChrome from '../../../../shared/C3dProtoChrome';
import { getRange, isWon, clonePieces } from './engine';
import { getCuratedRushHourFreeRound } from './curated-levels';
import { rhFreeParPoints } from './data';

/*
 * Rush Hour · 3D — the REAL 2D Survival (free run), face-on in the cosmos:
 *   • boards: getCuratedRushHourFreeRound(stage, nonce) — the endless curated
 *     staircase (easy → medium → hard), stage +1 on solve / −1 on timeout
 *   • per-puzzle clock: clamp(par×5+25, 30, 120)s; timing out costs a life
 *     and the streak; 3 lives end the run
 *   • scoring: rhFreeParPoints(par, moves, streak) on every solve
 *   • legal slides: getRange() rails · win: isWon() · reset: unlimited,
 *     resets pieces + moves (the clock keeps running) — all 2D rules.
 */

const BOARD = 6; // curated boards are all 6×6
const CELL = 0.92;
const EXIT_COLOR = 0xe8ac4e;
const LIVES0 = 3;
const CAR_COLORS = [0x6bb3c8, 0xc47bb0, 0x7cbc7a, 0xd4a574, 0x8b9dc3, 0xd98f5a, 0x9b8fd6, 0x69a89a, 0xcf6f6f, 0x8aa1c0, 0xb3a06b, 0x7a8bd0];

const UI = {
  en: {
    title: 'Rush Hour · 3D',
    tag: 'prototype',
    hint: 'Tap a car, then tap where it should slide. Get the gold car to the exit before the clock runs out.',
    solved: 'Solved!',
    next: 'Next puzzle ›',
    timeout: 'Out of time',
    over: 'Run over',
    overSub: (n, s) => `${n} puzzles · ${s} pts`,
    retry: 'Play again',
    hub: 'Back to modes',
    go: 'ENGAGE',
    reset: 'Reset board',
    round: 'Round',
    moves: 'Moves',
  },
  ar: {
    title: 'ساعة الذروة · ثلاثي الأبعاد',
    tag: 'نموذج',
    hint: 'المس سيارة، ثم المس المكان الذي تنزلق إليه. أوصل السيارة الذهبية إلى المخرج قبل نفاد الوقت.',
    solved: 'محلول!',
    next: 'اللغز التالي ›',
    timeout: 'نفد الوقت',
    over: 'انتهت المحاولة',
    overSub: (n, s) => `${n} ألغاز · ${s} نقطة`,
    retry: 'العب مجددًا',
    hub: 'العودة للأوضاع',
    go: 'انطلق',
    reset: 'إعادة اللوحة',
    round: 'جولة',
    moves: 'حركات',
  },
};

function buildRound(stage, nonce) {
  const b = getCuratedRushHourFreeRound(stage, nonce);
  const cars = b.pieces.map((p, i) => ({
    id: p.id,
    isHero: !!p.isHero,
    color: p.isHero ? EXIT_COLOR : CAR_COLORS[(i - 1 + CAR_COLORS.length) % CAR_COLORS.length],
    row: p.row, col: p.col, len: p.len, dir: p.dir,
    horizontal: p.dir === 'h',
  }));
  return {
    grid: b.grid || BOARD,
    exitRow: b.exitRow,
    cars,
    par: b.par ?? 6,
    diff: b.diff,
    // Same per-puzzle clock formula as the 2D free mode.
    timeSec: Math.max(30, Math.min(120, (b.par ?? 6) * 5 + 25)),
  };
}

function worldX(col) { return (col - (BOARD - 1) / 2) * CELL; }
function worldY(row) { return ((BOARD - 1) / 2 - row) * CELL; }

export default function RushHour3DProto({ isAr, playSfx, onBack }) {
  const wrapRef = useRef(null);
  const sfxRef = useRef(playSfx);
  sfxRef.current = playSfx;
  const apiRef = useRef({});
  const mountedRef = useRef(true);
  const t = UI[isAr ? 'ar' : 'en'];

  const [phase, setPhase] = useState('boot'); // boot | play | won | over
  const [stage, setStage] = useState(0);
  const [moves, setMoves] = useState(0);
  const [par, setPar] = useState(6);
  const [lives, setLives] = useState(LIVES0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [roundsWon, setRoundsWon] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [diffKey, setDiffKey] = useState('easy');
  const [banner, setBanner] = useState('go');
  const [bootError, setBootError] = useState(null);

  useEffect(() => {
    mountedRef.current = true;
    const wrap = wrapRef.current;
    if (!wrap) return undefined;

    const boot = bootC3dScene(wrap, { fov: 50, fitHalf: 3.6, bloom: true });
    if (boot.error) {
      setBootError(isAr ? 'تعذّر تشغيل ثلاثي الأبعاد' : 'Could not start 3D');
      return () => boot.dispose();
    }
    const { camera, playRoot, setTick, setFitBox, dispose, frame } = boot;

    // Tilt the board toward a 3/4 top-down view so cars read as raised blocks
    // on a lit deck — the pointer maths convert hits back to board-local coords.
    const boardGroup = new THREE.Group();
    boardGroup.rotation.x = -0.62;
    playRoot.add(boardGroup);

    // Soft ground glow disc behind the board for depth.
    const deck = new THREE.Mesh(
      new THREE.PlaneGeometry(BOARD * CELL + 1.4, BOARD * CELL + 1.4),
      matStd(0x0d0a06, { emissiveIntensity: 0.02, metalness: 0.1, roughness: 0.95 }),
    );
    deck.position.z = -0.28;
    boardGroup.add(deck);

    const boardPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(BOARD * CELL + 0.25, BOARD * CELL + 0.25),
      matStd(0x18140d, { emissive: 0xe8ac4e, emissiveIntensity: 0.03, metalness: 0.2, roughness: 0.9 }),
    );
    boardPlane.position.z = -0.15;
    boardGroup.add(boardPlane);

    const lineMat = matStd(0x3a342c, { emissiveIntensity: 0.1, metalness: 0.2, roughness: 0.7 });
    for (let i = 0; i <= BOARD; i++) {
      const v = new THREE.Mesh(new THREE.BoxGeometry(0.02, BOARD * CELL, 0.04), lineMat);
      v.position.set(worldX(i) - CELL / 2, 0, -0.06);
      boardGroup.add(v);
      const h = new THREE.Mesh(new THREE.BoxGeometry(BOARD * CELL, 0.02, 0.04), lineMat);
      h.position.set(0, worldY(i) + CELL / 2, -0.06);
      boardGroup.add(h);
    }

    const exitMarker = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, CELL * 0.85, 0.14),
      matStd(EXIT_COLOR, { emissiveIntensity: 0.75, metalness: 0.2, roughness: 0.3, transparent: true, opacity: 0.85 }),
    );
    exitMarker.position.set(worldX(BOARD - 1) + CELL * 0.85, worldY(0), 0.05);
    boardGroup.add(exitMarker);

    const carGroup = new THREE.Group();
    boardGroup.add(carGroup);

    // ── Run state (mirrors the 2D free loop) ──
    const nonce = (Math.imul(Date.now(), 1103515245) + 12345) >>> 0;
    let round = null;
    let carsState = [];
    let baseCars = [];
    const carMeshes = new Map();
    let selectedId = null;
    let anim = null;
    let curExitRow = 0;
    let stageN = 0;
    let livesN = LIVES0;
    let scoreN = 0;
    let streakN = 0;
    let winsN = 0;
    let movesN = 0;
    let clock = 0;
    let playing = false;
    let finished = false;
    let clockTimer = null;
    const stopClock = () => { if (clockTimer) { clearInterval(clockTimer); clockTimer = null; } };

    const carMesh = (car) => {
      const w = car.horizontal ? car.len * CELL - 0.16 : CELL - 0.16;
      const h = car.horizontal ? CELL - 0.16 : car.len * CELL - 0.16;
      const grp = new THREE.Group();
      const tall = car.isHero ? 0.66 : 0.54;
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, tall),
        matStd(car.color, { emissive: car.color, emissiveIntensity: car.isHero ? 0.42 : 0.28, metalness: 0.4, roughness: 0.38 }),
      );
      body.position.z = tall / 2;
      grp.add(body);
      // Glass cabin strip along the car's long axis.
      const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(car.horizontal ? w * 0.5 : w * 0.7, car.horizontal ? h * 0.7 : h * 0.5, tall * 0.5),
        matStd(0x0e1a22, { emissive: 0x6bb3c8, emissiveIntensity: 0.3, metalness: 0.6, roughness: 0.2 }),
      );
      cabin.position.z = tall + 0.02;
      grp.add(cabin);
      grp.userData.carId = car.id;
      grp.userData.body = body;
      return grp;
    };

    const carCenter = (car) => ({
      x: car.horizontal ? worldX(car.col) + ((car.len - 1) * CELL) / 2 : worldX(car.col),
      y: car.horizontal ? worldY(car.row) : worldY(car.row) - ((car.len - 1) * CELL) / 2,
    });

    const clearCars = () => {
      while (carGroup.children.length) {
        const c = carGroup.children[0];
        carGroup.remove(c);
        disposeObject(c);
      }
      carMeshes.clear();
    };

    const layoutCars = () => {
      clearCars();
      carsState.forEach((car) => {
        const mesh = carMesh(car);
        const c = carCenter(car);
        mesh.position.set(c.x, c.y, 0.05);
        carGroup.add(mesh);
        carMeshes.set(car.id, mesh);
      });
      frame();
    };

    const endRun = () => {
      finished = true;
      playing = false;
      stopClock();
      setPhase('over');
      setBanner('over');
      sfxRef.current?.('error');
    };

    const loadStage = (s) => {
      if (finished) return;
      stageN = Math.max(0, s);
      round = buildRound(stageN, nonce);
      baseCars = clonePieces(round.cars);
      carsState = clonePieces(round.cars);
      curExitRow = round.exitRow;
      exitMarker.position.y = worldY(curExitRow);
      selectedId = null;
      anim = null;
      movesN = 0;
      clock = round.timeSec;
      playing = true;
      setStage(stageN);
      setMoves(0);
      setPar(round.par);
      setDiffKey(round.diff);
      setTimeLeft(clock);
      setPhase('play');
      setBanner(null);
      layoutCars();
      stopClock();
      clockTimer = setInterval(() => {
        if (!playing || finished) return;
        clock = Math.max(0, clock - 1);
        setTimeLeft(clock);
        if (clock <= 0) {
          // 2D rule: timeout → streak 0, lose a life; stage steps DOWN if alive.
          playing = false;
          stopClock();
          streakN = 0;
          setStreak(0);
          livesN = Math.max(0, livesN - 1);
          setLives(livesN);
          sfxRef.current?.('error');
          if (livesN <= 0) { endRun(); return; }
          setBanner('timeout');
          window.setTimeout(() => { if (!finished) loadStage(stageN - 1); }, 1100);
        }
      }, 1000);
    };

    const resetBoard = () => {
      if (!playing || finished) return;
      sfxRef.current?.('click');
      carsState = clonePieces(baseCars);
      selectedId = null;
      anim = null;
      movesN = 0;
      setMoves(0);
      layoutCars();
    };

    const setHighlight = (id, on) => {
      const mesh = carMeshes.get(id);
      const body = mesh?.userData.body;
      if (body?.material) body.material.emissiveIntensity = on ? 0.85 : (id === 'hero' ? 0.42 : 0.28);
    };

    // Slide a car to the tapped cell, clamped to its legal rail (real engine getRange).
    const tryMove = (car, targetRow, targetCol) => {
      const range = getRange(car, carsState, BOARD);
      if (car.horizontal) {
        if (targetRow !== car.row) return false;
        const newCol = Math.max(range.lo, Math.min(range.hi, targetCol));
        if (newCol === car.col) return false;
        car.col = newCol;
        return { moved: true };
      }
      if (targetCol !== car.col) return false;
      const newRow = Math.max(range.lo, Math.min(range.hi, targetRow));
      if (newRow === car.row) return false;
      car.row = newRow;
      return { moved: true };
    };

    const startTween = (mesh, to, dur, onDone) => {
      anim = { mesh, from: mesh.position.clone(), to, elapsed: 0, dur, onDone };
    };

    const handleWin = () => {
      if (!mountedRef.current || finished) return;
      playing = false;
      stopClock();
      // 2D solve rules: streak++, par/streak points, puzzles-won++.
      streakN += 1;
      const pts = rhFreeParPoints(round.par, Math.max(1, movesN), streakN);
      scoreN += pts;
      winsN += 1;
      setStreak(streakN);
      setScore(scoreN);
      setRoundsWon(winsN);
      setPhase('won');
      setBanner('won');
      sfxRef.current?.('win');
    };

    const finishMoveUI = (car) => {
      movesN += 1;
      setMoves(movesN);
      const mesh = carMeshes.get(car.id);
      if (!mesh) return;
      const won = car.isHero && isWon(carsState, BOARD, curExitRow);
      const to = carCenter(car);
      if (won) {
        sfxRef.current?.('collect');
        selectedId = null;
        startTween(mesh, new THREE.Vector3(to.x + CELL * 1.5, to.y, mesh.position.z), 0.4, handleWin);
      } else {
        sfxRef.current?.('click');
        startTween(mesh, new THREE.Vector3(to.x, to.y, mesh.position.z), 0.2, null);
      }
    };

    const raycaster = new THREE.Raycaster();
    const ptr = new THREE.Vector2();

    const onPointer = (e) => {
      if (!playing || finished) return;
      const x = e.clientX ?? e.touches?.[0]?.clientX;
      const y = e.clientY ?? e.touches?.[0]?.clientY;
      if (x == null) return;
      const rect = wrap.getBoundingClientRect();
      ptr.x = ((x - rect.left) / rect.width) * 2 - 1;
      ptr.y = -((y - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ptr, camera);

      const carHits = raycaster.intersectObjects(Array.from(carMeshes.values()), true);
      if (carHits.length) {
        let o = carHits[0].object;
        while (o && o.userData.carId === undefined && o.parent) o = o.parent;
        const id = o?.userData.carId;
        if (id === undefined) return;
        if (selectedId === id) {
          setHighlight(id, false);
          selectedId = null;
        } else {
          if (selectedId) setHighlight(selectedId, false);
          selectedId = id;
          setHighlight(id, true);
          sfxRef.current?.('click');
        }
        return;
      }

      if (!selectedId) return;
      const car = carsState.find((c) => c.id === selectedId);
      if (!car) return;

      const exitHits = raycaster.intersectObject(exitMarker, false);
      if (exitHits.length && car.isHero) {
        const range = getRange(car, carsState, BOARD);
        const res = tryMove(car, curExitRow, range.hi);
        if (res && res.moved) finishMoveUI(car);
        return;
      }

      const groundHits = raycaster.intersectObject(boardPlane, false);
      if (!groundHits.length) return;
      // Convert the world-space hit back into the (tilted) board's local plane.
      const p = boardGroup.worldToLocal(groundHits[0].point.clone());
      const targetCol = Math.max(0, Math.min(BOARD - 1, Math.round(p.x / CELL + (BOARD - 1) / 2)));
      const targetRow = Math.max(0, Math.min(BOARD - 1, Math.round((BOARD - 1) / 2 - p.y / CELL)));
      const res = tryMove(car, targetRow, targetCol);
      if (res && res.moved) finishMoveUI(car);
    };
    wrap.addEventListener('pointerdown', onPointer, { passive: true });

    setTick((dt) => {
      if (anim) {
        anim.elapsed += dt;
        const tt = Math.min(1, anim.elapsed / anim.dur);
        anim.mesh.position.lerpVectors(anim.from, anim.to, tt);
        if (tt >= 1) {
          const done = anim.onDone;
          anim = null;
          done?.();
        }
      }
    });

    apiRef.current = {
      start: () => {
        finished = false;
        livesN = LIVES0;
        scoreN = 0;
        streakN = 0;
        winsN = 0;
        setLives(LIVES0);
        setScore(0);
        setStreak(0);
        setRoundsWon(0);
        loadStage(0);
      },
      nextPuzzle: () => { if (!finished) loadStage(stageN + 1); },
      resetBoard,
    };

    // Tilt compresses the board vertically → fit width fully, height a touch less.
    setFitBox(BOARD * CELL * 0.6, BOARD * CELL * 0.52);
    setPhase('boot');
    setBanner('go');

    return () => {
      mountedRef.current = false;
      finished = true;
      stopClock();
      wrap.removeEventListener('pointerdown', onPointer);
      clearCars();
      disposeObject(boardGroup);
      dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAr]);

  useEffect(() => {
    const id = requestAnimationFrame(() => { sfxRef.current?.('click'); apiRef.current.start?.(); });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mm = Math.floor(timeLeft / 60);
  const ss = String(timeLeft % 60).padStart(2, '0');
  const stats = phase === 'boot' ? [] : [
    `${t.round} ${stage + 1}`,
    `${t.moves} ${moves}/${par}`,
    `${'♥'.repeat(Math.max(0, lives))}`,
    `${score} ${isAr ? 'نقطة' : 'pts'}${streak > 1 ? ` · 🔥${streak}` : ''}`,
    `${mm}:${ss}`,
  ];

  const bannerText = banner === 'go' ? t.go
    : banner === 'won' ? t.solved
      : banner === 'timeout' ? t.timeout
        : banner === 'over' ? t.over
          : null;

  return (
    <C3dProtoChrome
      isAr={isAr}
      title={t.title}
      tag={t.tag}
      hint={t.hint}
      chip={`${diffKey} · ${t.round} ${stage + 1}`}
      chipStyle={{ fontSize: '0.7rem', fontWeight: 800, color: '#e8ac4e', textTransform: 'capitalize' }}
      stats={stats}
      banner={bannerText}
      bannerOver={banner === 'over' || banner === 'timeout'}
      bannerMeta={banner === 'over' ? t.overSub(roundsWon, score) : null}
      bootError={bootError}
      onBack={onBack}
      playSfx={playSfx}
      canvasRef={wrapRef}
      bannerActions={
        banner === 'won' ? (
          <button type="button" className="c3d-cta" onClick={() => { playSfx?.('click'); apiRef.current.nextPuzzle?.(); }}>
            {t.next}
          </button>
        ) : banner === 'over' ? (
          <div className="c3d-banner-actions">
            <button type="button" className="c3d-cta" onClick={() => { playSfx?.('click'); apiRef.current.start?.(); }}>{t.retry}</button>
            <button type="button" className="c3d-cta c3d-cta--ghost" onClick={() => { playSfx?.('click'); onBack(); }}>{t.hub}</button>
          </div>
        ) : null
      }
    >
      {phase === 'play' && (
        <div className="c3d-overlay-actions">
          <button type="button" className="c3d-choice-btn" onClick={() => apiRef.current.resetBoard?.()}>
            {t.reset}
          </button>
        </div>
      )}
    </C3dProtoChrome>
  );
}
