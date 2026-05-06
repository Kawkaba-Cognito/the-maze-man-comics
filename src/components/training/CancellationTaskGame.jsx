import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useLayoutEffect,
  useReducer,
} from 'react';
import { useApp } from '../../context/AppContext';
import {
  SH,
  DM,
  prepareLevelRound,
  prepareChallengeSeed,
  prepareChallengePlayState,
  prepareFreeRound,
  computeRoundStats,
  isLevelUnlocked,
  getLvCfg,
  loadGameSettings,
  FREE_SESSION_START_SEC,
  FREE_SESSION_CAP_SEC,
  freeClearBonusSec,
  freeTimeDrainMultiplier,
} from './focusQuestData';
import { PALETTE, DOMAIN_COLOR } from './trainingData';
import { IconBack } from './TrainingIcons';

const TR = PALETTE;
const ATT = DOMAIN_COLOR.attention;

function fqTrainingChromeBtn() {
  return {
    width: 34,
    height: 34,
    borderRadius: 11,
    border: `1px solid ${TR.accent}33`,
    background: `linear-gradient(180deg, ${TR.card} 0%, ${TR.cardDeep} 100%)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: TR.text,
    cursor: 'pointer',
    boxShadow: `0 2px 8px rgba(0,0,0,0.3), 0 0 0 1px ${TR.accent}11 inset`,
    flexShrink: 0,
  };
}

/** Same layered atmosphere as Training / RadialMazeHub (scoped pattern id). */
function FqTrainingBackdrop({ patternId }) {
  const p = `url(#${patternId})`;
  return (
    <>
      <div
        className="ct-fq-tr-bg"
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 420px 520px at 50% 42%, ${TR.accent}24 0%, transparent 70%)`,
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: -80,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 300,
          height: 180,
          background: `radial-gradient(ellipse, ${TR.accent}40 0%, transparent 65%)`,
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 600px 800px at 50% 50%, transparent 40%, ${TR.bg} 100%)`,
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />
      <svg
        width="100%"
        height="100%"
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.07,
          pointerEvents: 'none',
          zIndex: 0,
        }}
        aria-hidden="true"
      >
        <defs>
          <pattern
            id={patternId}
            x="0"
            y="0"
            width="100"
            height="100"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M20 20v20M20 20l10 10-10 10"
              stroke={TR.accent}
              strokeWidth="1"
              fill="none"
            />
            <path
              d="M60 24l6 10-6 10M60 24v20"
              stroke={TR.accent}
              strokeWidth="1"
              fill="none"
            />
            <path
              d="M40 70h10M45 65v10"
              stroke={TR.accent}
              strokeWidth="1"
              fill="none"
            />
            <circle cx="78" cy="78" r="5" stroke={TR.accent} strokeWidth="1" fill="none" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={p} />
      </svg>
    </>
  );
}

function FqTrainingMenuBar({ onBack, playSfx, center, hubSpaced = false }) {
  return (
    <div
      className={`ct-fq-training-menubar${hubSpaced ? ' ct-fq-training-menubar--hub' : ''}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingTop: 'max(52px, env(safe-area-inset-top))',
        paddingLeft: 18,
        paddingRight: 18,
        paddingBottom: hubSpaced ? 22 : 10,
        position: 'relative',
        zIndex: 5,
        boxSizing: 'border-box',
      }}
    >
      <button
        type="button"
        style={fqTrainingChromeBtn()}
        onClick={() => {
          playSfx('click');
          onBack();
        }}
        aria-label="Back"
      >
        <IconBack size={18} c={TR.text} />
      </button>
      <div style={{ flex: 1, minWidth: 0, padding: '0 8px' }} role="presentation">
        {center}
      </div>
      <div style={{ width: 34, flexShrink: 0 }} aria-hidden="true" />
    </div>
  );
}

/** Merge one challenge pass into running per-player aggregates (avg IES/time/etc., total errors). */
function mergeChallengePlayerStats(prev, stats, errCount, nm) {
  const snap = { ...stats, errors: errCount };
  const rounds = [...(prev?.rounds || []), snap];
  const n = rounds.length;
  let iesSum = 0;
  let timeSum = 0;
  let accSum = 0;
  let avgRtSum = 0;
  let tpsSum = 0;
  let scoreSum = 0;
  let errSum = 0;
  for (const r of rounds) {
    iesSum += r.ies;
    timeSum += r.timeUsed;
    accSum += r.acc;
    avgRtSum += r.avgRt;
    tpsSum += r.tps;
    scoreSum += r.score;
    errSum += r.errors;
  }
  return {
    nm,
    rounds,
    ies: +(iesSum / n).toFixed(1),
    timeUsed: +(timeSum / n).toFixed(1),
    errors: errSum,
    acc: Math.round(accSum / n),
    avgRt: Math.round(avgRtSum / n),
    tps: +(tpsSum / n).toFixed(3),
    score: +(scoreSum / n).toFixed(1),
  };
}

const PROFILE_KEY = 'mm_cancel_fq_v1';

function loadProfile() {
  try {
    const j = localStorage.getItem(PROFILE_KEY);
    if (j) {
      const parsed = JSON.parse(j);
      return {
        tel: parsed.tel || [],
        done: parsed.done || {},
        freeBest: parsed.freeBest ?? 0,
      };
    }
  } catch {
    /* ignore */
  }
  return { tel: [], done: {}, freeBest: 0 };
}

function saveProfile(p) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const ShapeSvg = React.memo(function ShapeSvg({ shape, color, size = 40 }) {
  const inner = SH[shape] || SH.circle;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ color, display: 'block' }}
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  );
});

/** Deterministic PRNG for stable hub maze (same layout every load). */
function fqMazeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = Math.imul(s ^ (s << 13), 1597334677);
    s = Math.imul(s ^ (s >>> 15), 3812015801);
    return (s >>> 0) / 4294967296;
  };
}

function fqShuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Polar cell midpoint in viewBox 0–100 (θ = 0 at top). */
function fqPolarCellMid(CX, CY, rLo, rHi, s, S) {
  const th = -Math.PI / 2 + ((s + 0.5) * 2 * Math.PI) / S;
  const rm = (rLo + rHi) / 2;
  return [CX + rm * Math.cos(th), CY + rm * Math.sin(th)];
}

/**
 * Circular polar maze (rings × sectors): real DFS carve, arcs + radials.
 * Outer radius fits inside the hub disc; interior is annular maze (not a square grid).
 */
function buildPolarFocusQuestHubMaze() {
  const CX = 50;
  const CY = 50;
  const S = 16;
  const RINGS = 7;
  const rInner = 8.5;
  const rOuter = 45.5;
  const rB = Array.from({ length: RINGS + 1 }, (_, k) => rInner + (k * (rOuter - rInner)) / RINGS);

  const radialWall = Array.from({ length: RINGS }, () => Array(S).fill(true));
  const downWall = Array.from({ length: RINGS - 1 }, () => Array(S).fill(true));
  const vis = Array.from({ length: RINGS }, () => Array(S).fill(false));

  const rng = fqMazeRng(0x4d617a65);
  const ang = (sector) => -Math.PI / 2 + (sector * 2 * Math.PI) / S;
  const polar = (rad, th) => [CX + rad * Math.cos(th), CY + rad * Math.sin(th)];

  function dfs(ring, s) {
    vis[ring][s] = true;
    const opts = fqShuffle(
      [
        [ring, (s + 1) % S, 'cw'],
        [ring, (s - 1 + S) % S, 'ccw'],
        [ring + 1, s, 'out'],
        [ring - 1, s, 'in'],
      ],
      rng,
    );
    for (const [nr, ns, d] of opts) {
      if (nr < 0 || nr >= RINGS || vis[nr][ns]) continue;
      if (d === 'cw' && radialWall[ring][s]) {
        radialWall[ring][s] = false;
        dfs(nr, ns);
      } else if (d === 'ccw' && radialWall[ring][(s - 1 + S) % S]) {
        radialWall[ring][(s - 1 + S) % S] = false;
        dfs(nr, ns);
      } else if (d === 'out' && ring < RINGS - 1 && downWall[ring][s]) {
        downWall[ring][s] = false;
        dfs(nr, ns);
      } else if (d === 'in' && ring > 0 && downWall[ring - 1][s]) {
        downWall[ring - 1][s] = false;
        dfs(nr, ns);
      }
    }
  }
  dfs(0, 0);

  function neighbors(ring, s) {
    const o = [];
    if (!radialWall[ring][s]) o.push([ring, (s + 1) % S]);
    const sp = (s - 1 + S) % S;
    if (!radialWall[ring][sp]) o.push([ring, sp]);
    if (ring < RINGS - 1 && !downWall[ring][s]) o.push([ring + 1, s]);
    if (ring > 0 && !downWall[ring - 1][s]) o.push([ring - 1, s]);
    return o;
  }

  const SR = 0;
  const SS = 0;
  const G1 = { ring: RINGS - 1, s: Math.floor(S / 4) };
  const G2 = { ring: RINGS - 1, s: Math.floor((3 * S) / 4) };

  function bfsPath(gr, gs) {
    const prev = new Map();
    const key = (a, b) => `${a},${b}`;
    const q = [[SR, SS]];
    prev.set(key(SR, SS), null);
    while (q.length) {
      const [r, s] = q.shift();
      if (r === gr && s === gs) break;
      for (const [nr, ns] of neighbors(r, s)) {
        const k = key(nr, ns);
        if (prev.has(k)) continue;
        prev.set(k, [r, s]);
        q.push([nr, ns]);
      }
    }
    if (!prev.has(key(gr, gs))) return null;
    const chain = [];
    let cur = [gr, gs];
    while (cur) {
      chain.push(cur);
      cur = prev.get(key(cur[0], cur[1]));
    }
    chain.reverse();
    return chain;
  }

  const chain1 = bfsPath(G1.ring, G1.s) || [[SR, SS]];
  const chain2 = bfsPath(G2.ring, G2.s) || [[SR, SS]];

  function chainToPathD(chain) {
    if (!chain.length) return '';
    const [x0, y0] = fqPolarCellMid(CX, CY, rB[chain[0][0]], rB[chain[0][0] + 1], chain[0][1], S);
    let d = `M ${x0.toFixed(2)} ${y0.toFixed(2)}`;
    for (let i = 1; i < chain.length; i++) {
      const [x, y] = fqPolarCellMid(CX, CY, rB[chain[i][0]], rB[chain[i][0] + 1], chain[i][1], S);
      d += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
    }
    return d;
  }

  let fork = 0;
  for (; fork < chain1.length && fork < chain2.length; fork++) {
    if (chain1[fork][0] !== chain2[fork][0] || chain1[fork][1] !== chain2[fork][1]) break;
  }
  if (fork === 0) fork = 1;
  const trunkD = chainToPathD(chain1.slice(0, fork));
  const armLeftD = chainToPathD(chain1.slice(fork - 1));
  const armRightD = chainToPathD(chain2.slice(fork - 1));

  let wallPathD = '';
  for (let r = 0; r < RINGS; r++) {
    for (let s = 0; s < S; s++) {
      if (radialWall[r][s]) {
        const th = ang(s + 1);
        const [x1, y1] = polar(rB[r], th);
        const [x2, y2] = polar(rB[r + 1], th);
        wallPathD += `M${x1.toFixed(2)},${y1.toFixed(2)} L${x2.toFixed(2)},${y2.toFixed(2)} `;
      }
    }
  }
  for (let r = 0; r < RINGS - 1; r++) {
    for (let s = 0; s < S; s++) {
      if (downWall[r][s]) {
        const rad = rB[r + 1];
        const a0 = ang(s);
        const a1 = ang(s + 1);
        const [x1, y1] = polar(rad, a0);
        const [x2, y2] = polar(rad, a1);
        wallPathD += `M${x1.toFixed(2)},${y1.toFixed(2)} A${rad.toFixed(3)},${rad.toFixed(3)} 0 0 1 ${x2.toFixed(2)},${y2.toFixed(2)} `;
      }
    }
  }
  for (let s = 0; s < S; s++) {
    const rad = rB[RINGS];
    const a0 = ang(s);
    const a1 = ang(s + 1);
    const [x1, y1] = polar(rad, a0);
    const [x2, y2] = polar(rad, a1);
    wallPathD += `M${x1.toFixed(2)},${y1.toFixed(2)} A${rad.toFixed(3)},${rad.toFixed(3)} 0 0 1 ${x2.toFixed(2)},${y2.toFixed(2)} `;
  }

  function stripLeadingMove(d) {
    return d.replace(/^M\s*[\d.-]+\s+[\d.-]+\s*/, '').trim();
  }

  return {
    wallPathD: wallPathD.trim(),
    armLeftD,
    armRightD,
    trunkD,
    stripLeadingMove,
    innerHubR: rInner,
    outerR: rOuter,
  };
}

const FQ_HUB_MAZE = buildPolarFocusQuestHubMaze();

/** Orbit button positions on rim (deg from top, clockwise). */
function fqHubOrbitPos(degFromTop) {
  // Orbit radius in % of the disc. On phones the disc is at most 90vw and the
  // floater nodes are min(120px, 32vw); at the original R=48 the side nodes
  // (120°/240°) overflow the viewport. Tighten R on small screens so nodes
  // always sit inside the disc on mobile while keeping the decorative outer
  // orbit on tablets and desktops.
  const w = typeof window !== 'undefined' ? window.innerWidth : 768;
  const ORBIT_R = w < 520 ? 40 : 48;
  const rad = (degFromTop * Math.PI) / 180;
  const x = 50 + ORBIT_R * Math.sin(rad);
  const y = 50 - ORBIT_R * Math.cos(rad);
  return {
    left: `${Math.round(x * 100) / 100}%`,
    top: `${Math.round(y * 100) / 100}%`,
  };
}

function FqHubModeMap({ t, isAr, onFree, onLevels, onChallenge, playSfx }) {
  const uid = React.useId().replace(/:/g, '');
  const pathGlowId = `fq-pg-${uid}`;
  const gradGold = `fq-gg-${uid}`;
  const wallGrad = `fq-wg-${uid}`;
  const polarBg = `fq-pbg-${uid}`;
  const bhGrad = `fq-bh-${uid}`;
  const { wallPathD, armLeftD, armRightD, trunkD, stripLeadingMove, innerHubR } = FQ_HUB_MAZE;

  const solLeft = `${trunkD} ${stripLeadingMove(armLeftD)}`.trim();
  const solRight = `${trunkD} ${stripLeadingMove(armRightD)}`.trim();

  const posFree = fqHubOrbitPos(0);
  const posLevels = fqHubOrbitPos(120);
  const posChallenge = fqHubOrbitPos(240);

  return (
    <div className="ct-fq-hub-disc-shell">
      <div className="ct-fq-hub-orbit-stage">
        <div className="ct-fq-hub-disc-stack">
          <div className="ct-fq-hub-disc-cavity">
            <div
              className="ct-fq-hub-maze ct-fq-hub-maze-training ct-fq-hub-maze--real ct-fq-hub-maze--disc"
              dir="ltr"
              aria-label={t.hubMapAria}
            >
              <svg
                className="ct-fq-hub-maze-svg ct-fq-hub-maze-svg--real ct-fq-hub-maze-svg--polar"
                viewBox="0 0 100 100"
                aria-hidden="true"
              >
                <defs>
                  <radialGradient id={polarBg} cx="50%" cy="50%" r="52%">
                    <stop offset="35%" stopColor="#1a0f09" />
                    <stop offset="72%" stopColor="#0c0604" />
                    <stop offset="100%" stopColor="#050302" />
                  </radialGradient>
                  <radialGradient id={bhGrad} cx="38%" cy="32%" r="72%">
                    <stop offset="0%" stopColor="#000000" />
                    <stop offset="42%" stopColor="#050201" />
                    <stop offset="68%" stopColor="#0c0705" />
                    <stop offset="100%" stopColor="#120c09" />
                  </radialGradient>
                  <linearGradient id={wallGrad} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2a1810" />
                    <stop offset="45%" stopColor="#1a0e08" />
                    <stop offset="100%" stopColor="#3d2818" />
                  </linearGradient>
                  <linearGradient id={gradGold} x1="18" y1="8" x2="82" y2="88" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#fff6d8" />
                    <stop offset="35%" stopColor={ATT} />
                    <stop offset="100%" stopColor="#9a7020" />
                  </linearGradient>
                  <filter id={pathGlowId} x="-80%" y="-80%" width="260%" height="260%">
                    <feGaussianBlur stdDeviation="1.4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <circle cx="50" cy="50" r="50" fill={`url(#${polarBg})`} />
                <circle cx="50" cy="50" r={innerHubR} fill={`url(#${bhGrad})`} />
                <circle
                  cx="50"
                  cy="50"
                  r={innerHubR}
                  fill="none"
                  stroke="rgba(232,172,78,0.22)"
                  strokeWidth="0.45"
                />
                <circle
                  cx="50"
                  cy="50"
                  r={(Number(innerHubR) * 0.92).toFixed(2)}
                  fill="none"
                  stroke="rgba(255,200,120,0.12)"
                  strokeWidth="0.28"
                />
                <path
                  d={wallPathD}
                  fill="none"
                  stroke={`url(#${wallGrad})`}
                  strokeWidth="1.35"
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                  className="ct-fq-hub-wall-depth"
                />
                <path
                  d={wallPathD}
                  fill="none"
                  stroke="rgba(0,0,0,0.5)"
                  strokeWidth="1.65"
                  strokeLinecap="square"
                  strokeLinejoin="round"
                  opacity="0.85"
                  transform="translate(0.12 0.14)"
                />
                <path
                  d={wallPathD}
                  fill="none"
                  stroke={ATT}
                  strokeWidth="0.25"
                  strokeLinecap="square"
                  opacity="0.26"
                />
                <path
                  d={trunkD}
                  fill="none"
                  stroke="rgba(0,0,0,0.55)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={solLeft}
                  fill="none"
                  stroke={`url(#${gradGold})`}
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter={`url(#${pathGlowId})`}
                  className="ct-fq-hub-sol-branch ct-fq-hub-sol-left"
                />
                <path
                  d={solRight}
                  fill="none"
                  stroke={`url(#${gradGold})`}
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter={`url(#${pathGlowId})`}
                  className="ct-fq-hub-sol-branch ct-fq-hub-sol-right"
                />
                <path
                  d={solLeft}
                  fill="none"
                  stroke="#fff9e8"
                  strokeWidth="0.28"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.38"
                />
                <path
                  d={solRight}
                  fill="none"
                  stroke="#fff9e8"
                  strokeWidth="0.28"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.38"
                />
                <path
                  d={solLeft}
                  fill="none"
                  stroke={ATT}
                  strokeWidth="0.4"
                  strokeDasharray="0.5 2.5"
                  strokeLinecap="round"
                  opacity="0.42"
                  className="ct-fq-hub-path-flow"
                />
                <path
                  d={solRight}
                  fill="none"
                  stroke={ATT}
                  strokeWidth="0.4"
                  strokeDasharray="0.5 2.5"
                  strokeLinecap="round"
                  opacity="0.42"
                  className="ct-fq-hub-path-flow ct-fq-hub-path-flow-d"
                />
                <g className="ct-fq-hub-attn-sig" transform="translate(50 50)" pointerEvents="none">
                  <circle r="6.4" fill="none" stroke="#e8ac4e" strokeWidth="0.42" opacity="0.92" />
                  <circle r="3.9" fill="none" stroke="#e8ac4e" strokeWidth="0.32" opacity="0.78" />
                  <circle r="1.2" fill="#e8ac4e" opacity="0.95" />
                  <path
                    d="M0 -7.4 L0 -5.6 M7.4 0 L5.6 0 M0 7.4 L0 5.6 M-7.4 0 L-5.6 0"
                    fill="none"
                    stroke="#e8ac4e"
                    strokeWidth="0.48"
                    strokeLinecap="round"
                    opacity="0.88"
                  />
                </g>
              </svg>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="ct-fq-hub-node ct-fq-hub-node-training ct-fq-hub-node-free ct-fq-hub-orbit-floater"
          style={posFree}
          onClick={() => {
            playSfx('click');
            onFree();
          }}
        >
          <span className="ct-fq-hub-orbit-ring" aria-hidden="true" />
          <span className="ct-fq-hub-node-ic" aria-hidden="true">
            ♾️
          </span>
          <span className="ct-fq-hub-node-lb">{t.freeMode}</span>
          <span className={`ct-fq-hub-node-hint${isAr ? ' ct-fq-hub-node-hint-ar' : ''}`}>
            {t.hubNodeFreeHint}
          </span>
        </button>
        <button
          type="button"
          className="ct-fq-hub-node ct-fq-hub-node-training ct-fq-hub-node-levels ct-fq-hub-orbit-floater"
          style={posLevels}
          onClick={() => {
            playSfx('click');
            onLevels();
          }}
        >
          <span className="ct-fq-hub-orbit-ring" aria-hidden="true" />
          <span className="ct-fq-hub-node-ic" aria-hidden="true">
            🎯
          </span>
          <span className="ct-fq-hub-node-lb">{t.levelMode}</span>
          <span className={`ct-fq-hub-node-hint${isAr ? ' ct-fq-hub-node-hint-ar' : ''}`}>
            {t.hubNodeLevelsHint}
          </span>
        </button>
        <button
          type="button"
          className="ct-fq-hub-node ct-fq-hub-node-training ct-fq-hub-node-chal ct-fq-hub-orbit-floater"
          style={posChallenge}
          onClick={() => {
            playSfx('click');
            onChallenge();
          }}
        >
          <span className="ct-fq-hub-orbit-ring" aria-hidden="true" />
          <span className="ct-fq-hub-node-ic" aria-hidden="true">
            ⚔️
          </span>
          <span className="ct-fq-hub-node-lb">{t.challengeMode}</span>
          <span className={`ct-fq-hub-node-hint${isAr ? ' ct-fq-hub-node-hint-ar' : ''}`}>
            {t.hubNodeChallengeHint}
          </span>
        </button>
      </div>
    </div>
  );
}

const FqGridCell = React.memo(function FqGridCell({ cell, idx, size, running, onTap }) {
  return (
    <button
      type="button"
      className={`ct-fq-sc ${cell.feedback === 'ok' ? 'ok' : ''} ${cell.feedback === 'bad' ? 'bad' : ''}`}
      disabled={cell.tapped || !running}
      onClick={() => onTap(idx)}
    >
      <ShapeSvg shape={cell.shape} color={cell.fill} size={size} />
      {cell.feedback === 'ok' && <span className="ct-fq-ck">✓</span>}
      {cell.feedback === 'bad' && <span className="ct-fq-pi">-1s</span>}
    </button>
  );
});

/** Top stats + timer bars only; own rAF tick so the shape grid is not repainted every frame. */
function CtLiveHud({
  t,
  playStep,
  pauseOpen,
  tlRef,
  tlimRef,
  roundTlim,
  useSessionTimer,
  found,
  tc,
  errors,
  errorsLabel,
  errorsMax,
  lvlLabel,
  onPause,
  onQuit,
}) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (playStep !== 'running' || pauseOpen) return undefined;
    let id = 0;
    const step = () => {
      setTick((n) => (n + 1) % 1_000_000);
      id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [playStep, pauseOpen]);

  const liveAnim = playStep === 'running' && !pauseOpen;
  const denom = (() => {
    if (useSessionTimer) return tlimRef.current || 1;
    return tlimRef.current || roundTlim || 1;
  })();
  const displaySeconds = useSessionTimer
    ? tlRef.current
    : playStep === 'running'
      ? tlRef.current
      : roundTlim;
  const pctTime = useSessionTimer
    ? Math.max(0, Math.min(1, tlRef.current / denom))
    : playStep !== 'running'
      ? 1
      : Math.max(0, Math.min(1, tlRef.current / denom));

  const pctFound = tc > 0 ? Math.max(0, Math.min(1, found / tc)) : 0;

  return (
    <>
      <div className="ct-fq-g-top" data-fq-chrome>
        <div className="ct-fq-gs">
          <div className={`ct-fq-gv ${liveAnim && tlRef.current <= 10 ? 'tv' : ''}`}>
            {`${Number(displaySeconds).toFixed(1)}s`}
          </div>
          <div className="ct-fq-gl">{t.time}</div>
        </div>
        <div className="ct-fq-gs">
          <div className="ct-fq-gv">
            {found}/{tc}
          </div>
          <div className="ct-fq-gl">{t.found}</div>
        </div>
        <div className="ct-fq-gs">
          <div className="ct-fq-gv ac2">
            {errorsMax != null ? `${errors}/${errorsMax}` : errors}
          </div>
          <div className="ct-fq-gl">{errorsLabel ?? t.err}</div>
        </div>
        <div className="ct-fq-gs">
          <div className="ct-fq-gv sm">{lvlLabel}</div>
          <div className="ct-fq-gl">{t.lvl}</div>
        </div>
        <div className="ct-fq-g-actions">
          <button type="button" className="ct-fq-mini" onClick={onPause}>
            {t.pause}
          </button>
          <button type="button" className="ct-fq-mini ct-fq-mini-warn" onClick={onQuit}>
            {t.quit}
          </button>
        </div>
      </div>
      <div className="ct-fq-cbw" data-fq-chrome>
        <div
          className="ct-fq-cb"
          style={{
            width: `${pctTime * 100}%`,
            background:
              pctTime > 0.5
                ? 'linear-gradient(90deg,#6b9e7a,#7ab87a)'
                : pctTime > 0.2
                  ? 'linear-gradient(90deg,#e8c47a,#e8a07a)'
                  : 'linear-gradient(90deg,#e8a07a,#c97a7a)',
          }}
        />
      </div>
      <div className="ct-fq-pbw" data-fq-chrome>
        <div className="ct-fq-pb" style={{ width: `${pctFound * 100}%` }} />
      </div>
    </>
  );
}

const UI = {
  en: {
    back: '‹ BACK',
    title: 'CANCELLATION',
    subtitle: 'Selective attention & inhibition',
    freeMode: '♾️ Free mode',
    freeMenuSub: 'One clock for the whole run · Clear rounds to gain time · 3 strikes ends the run',
    freeStrikes: 'Strikes',
    freeLvlLabel: (tier, lv) => `Free · ${tier} ${lv}`,
    freeGameOver: 'Run ended',
    freeRoundsCleared: (n) => `Rounds cleared: ${n}`,
    freeBest: (n) => `Best: ${n}`,
    freePlayAgain: 'Play again',
    hubChamberKicker: '⟡ FOCUS QUEST ⟡',
    hubAttentionWord: 'Attention',
    hubTrainingTag: 'training',
    resultsLevelPass: 'Level passed',
    resultsLevelRetryTitle: 'Try again',
    resultsChalTitle: 'Challenge results',
    hubMapAria: 'Modes map — choose a path',
    hubNodeFreeHint: 'Session timer · bonus per clear',
    hubNodeLevelsHint: 'Tier grid · unlock 20',
    hubNodeChallengeHint: 'Same maze · pass & play',
    levelMode: '🎯 Level mode',
    challengeMode: '⚔️ Challenge',
    menuHint: 'Visual search training: bind features, suppress distractors, and respond quickly—like lab tasks for attention and cognitive control.',
    pickDiff: 'Choose difficulty',
    pickDiffSub: 'Every mode has levels 1–20. Unlock in order.',
    levelsSub: (pop, g) => `${pop} · ${g}×${g} grid · Levels 1–20`,
    levelsBack: '← Back',
    challengeTitle: '⚔️ Challenge mode',
    challengeSub: 'Same shape layout for everyone · Extra hard 9×9 · 50s',
    players: 'Players (2–10)',
    addPl: '＋ Add player',
    startCh: '⚔️ Start',
    needTwo: 'Add at least 2 players.',
    ready: (n) => `Ready — ${n}`,
    handTo: (n) => `Hand the device to ${n}.`,
    goReady: 'Start round',
    hubMenu: 'Same grid, fair compare.',
    time: 'Time',
    found: 'Found',
    err: 'Errors',
    lvl: 'Level',
    pause: 'Pause',
    quit: 'Quit',
    resume: 'Resume',
    restart: 'Restart level',
    quitMenu: 'Quit to menu',
    paused: 'Paused',
    quitQ: 'Quit?',
    quitLose: 'Progress on this round will be lost.',
    yesQuit: 'Yes, quit',
    keep: 'Keep playing',
    nextLv: 'Next level',
    retry: 'Retry',
    menu: 'Menu',
    newCh: 'New challenge',
    chalRounds: 'Rounds',
    chalRoundsHint: 'Each player plays once per round · New fair grid each round',
    roundNofM: (n, m) => `Round ${n}/${m}`,
    chalResDetail: (nr, t, e, a, tp) =>
      nr > 1
        ? `${nr}× · ${t}s avg · ${e} err total · ${a}% · ${tp} t/s`
        : `${t}s · ${e} err · ${a}% · ${tp} t/s`,
    ies: 'IES score',
    rt: 'Avg RT',
    countdownHint: 'Get ready…',
    cueExact: 'Tap every tile that looks exactly like this.',
    cueShape: 'Tap every tile that shows this shape.',
  },
  ar: {
    back: '‹ رجوع',
    title: 'مهمة الإلغاء',
    subtitle: 'انتباه انتقائي وكبح استجابي',
    freeMode: '♾️ وضع حر',
    freeMenuSub: 'وقت واحد للجولة كاملة · إكمال الجولات يضيف وقتاً · ٣ أخطاء تنهي المحاولة',
    freeStrikes: 'الأخطاء',
    freeLvlLabel: (tier, lv) => `حر · ${tier} ${lv}`,
    freeGameOver: 'انتهت المحاولة',
    freeRoundsCleared: (n) => `جولات ناجحة: ${n}`,
    freeBest: (n) => `الأفضل: ${n}`,
    freePlayAgain: 'العب مجددًا',
    hubChamberKicker: '⟡ مهمة التركيز ⟡',
    hubAttentionWord: 'الانتباه',
    hubTrainingTag: 'تدريب',
    resultsLevelPass: 'المستوى اجتُاز',
    resultsLevelRetryTitle: 'حاول مجددًا',
    resultsChalTitle: 'نتائج التحدي',
    hubMapAria: 'خريطة الأوضاع — اختر مسارًا',
    hubNodeFreeHint: 'مؤقت مستمر · مكافأة وقت عند النجاح',
    hubNodeLevelsHint: 'شبكة · ٢٠ مستوى',
    hubNodeChallengeHint: 'نفس المتاهة · مع الأصدقاء',
    levelMode: '🎯 وضع المستويات',
    challengeMode: '⚔️ تحدي',
    menuHint: 'تدريب بحث بصري: ربط السمات، كبح المشتتات، والاستجابة بسرعة—كمهام الانتباه في العلوم المعرفية.',
    pickDiff: 'اختر الصعوبة',
    pickDiffSub: 'كل وضع يحتوي على مستويات 1–20. افتحها بالترتيب.',
    levelsSub: (pop, g) => `${pop} · شبكة ${g}×${g} · مستويات 1–20`,
    levelsBack: '← رجوع',
    challengeTitle: '⚔️ وضع التحدي',
    challengeSub: 'نفس تخطيط الأشكال للجميع · صعب جداً 9×9 · 50ث',
    players: 'اللاعبون (2–10)',
    addPl: '＋ إضافة لاعب',
    startCh: '⚔️ ابدأ',
    needTwo: 'أضف لاعبين على الأقل.',
    ready: (n) => `جاهز — ${n}`,
    handTo: (n) => `سلّم الجهاز إلى ${n}.`,
    goReady: 'ابدأ الجولة',
    hubMenu: 'شبكة واحدة، مقارنة عادلة.',
    time: 'الوقت',
    found: 'مُوجَد',
    err: 'أخطاء',
    lvl: 'مستوى',
    pause: 'إيقاف',
    quit: 'خروج',
    resume: 'متابعة',
    restart: 'إعادة المستوى',
    quitMenu: 'خروج للقائمة',
    paused: 'متوقف',
    quitQ: 'خروج؟',
    quitLose: 'ستفقد تقدم هذه الجولة.',
    yesQuit: 'نعم',
    keep: 'إكمال',
    nextLv: 'المستوى التالي',
    retry: 'إعادة',
    menu: 'القائمة',
    newCh: 'تحدي جديد',
    chalRounds: 'الجولات',
    chalRoundsHint: 'كل لاعب يلعب مرة في الجولة · شبكة جديدة عادلة كل جولة',
    roundNofM: (n, m) => `الجولة ${n}/${m}`,
    chalResDetail: (nr, t, e, a, tp) =>
      nr > 1
        ? `${nr}× · ${t}s معدل · ${e} أخطاء المجموع · ${a}% · ${tp} هدف/ث`
        : `${t}s · ${e} أخطاء · ${a}% · ${tp} هدف/ث`,
    ies: 'درجة IES',
    rt: 'متوسط زمن الاستجابة',
    countdownHint: 'استعد…',
    cueExact: 'المس كل مربع يطابق هذا الرمز تمامًا.',
    cueShape: 'المس كل مربع يحتوي على هذا الشكل.',
  },
};

export default function CancellationTaskGame({ onBack }) {
  const { playSfx, currentLang } = useApp();
  const isAr = currentLang === 'ar';
  const t = isAr ? UI.ar : UI.en;
  const settings = loadGameSettings();
  const trainingPatternId = React.useId().replace(/:/g, '');

  const [profile, setProfile] = useState(() => loadProfile());
  const [phase, setPhase] = useState('hub');
  const [diffKey, setDiffKey] = useState('easy');
  const [, bumpFrame] = useReducer((x) => x + 1, 0);

  const [round, setRound] = useState(null);
  const [cells, setCells] = useState([]);
  const [playStep, setPlayStep] = useState('idle');
  const [cdShow, setCdShow] = useState(false);
  const [cdVal, setCdVal] = useState(3);
  const [found, setFound] = useState(0);
  const [errors, setErrors] = useState(0);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [quitOpen, setQuitOpen] = useState(false);
  const [shake, setShake] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const [chalNames, setChalNames] = useState(['Player 1', 'Player 2']);
  const [chalSeed, setChalSeed] = useState(null);
  const [chalIdx, setChalIdx] = useState(0);
  const [chalScores, setChalScores] = useState([]);
  const [chalTurnOpen, setChalTurnOpen] = useState(false);
  const [chalRoundsTotal, setChalRoundsTotal] = useState(1);
  const [chalRoundIdx, setChalRoundIdx] = useState(0);

  const tlRef = useRef(0);
  const tlimRef = useRef(0);
  const runRef = useRef(false);
  const pendingPenaltyRef = useRef(0);
  const lastTapRef = useRef(0);
  const tapsRef = useRef([]);
  const warned10Ref = useRef(false);
  const roundRef = useRef(null);
  const gridWrapRef = useRef(null);
  const talliesRef = useRef({ found: 0, errors: 0 });
  const chalIdxRef = useRef(0);
  const chalNamesRef = useRef(chalNames);
  const chalScoresRef = useRef([]);
  const chalRoundsTotalRef = useRef(1);
  const chalCycleRef = useRef(0);
  const roundEndedRef = useRef(false);
  const endRoundRef = useRef((_won) => {});
  const freeStageRef = useRef(0);
  const freeRoundsWonRef = useRef(0);
  const freeStrikesRef = useRef(0);
  const [freeStrikes, setFreeStrikes] = useState(0);
  const [gridMetrics, setGridMetrics] = useState({ cell: 32, gap: 3, pad: 6 });
  const shakeTimerRef = useRef(0);

  useEffect(() => () => {
    if (shakeTimerRef.current) {
      clearTimeout(shakeTimerRef.current);
      shakeTimerRef.current = 0;
    }
  }, []);

  useEffect(() => {
    chalIdxRef.current = chalIdx;
  }, [chalIdx]);
  useEffect(() => {
    chalNamesRef.current = chalNames;
  }, [chalNames]);

  const doneMap = profile.done || {};

  const persistLevel = useCallback(
    (r, stats, f, e) => {
      const p = { ...profile, tel: [...(profile.tel || [])], done: { ...doneMap } };
      p.tel.push({
        lv: r.lv,
        diff: r.diff,
        won: stats.won,
        timeUsed: stats.timeUsed,
        errors: e,
        found: f,
        tc: r.tc,
        acc: stats.acc,
        score: stats.score,
        ies: stats.ies,
        tps: stats.tps,
        avgRt: stats.avgRt,
        ts: new Date().toISOString(),
      });
      if (stats.won && r.mode === 'level') {
        p.done[`${r.diff}-${r.lv}`] = true;
      }
      saveProfile(p);
      setProfile(p);
    },
    [profile, doneMap],
  );

  const stopTimer = useCallback(() => {
    runRef.current = false;
  }, []);

  const beginFreeRoundAtStage = useCallback(
    async (stageIndex) => {
      try {
        setPhase('play');
        setPlayStep('idle');
        setCdShow(false);
        const r = prepareFreeRound(stageIndex);
        roundRef.current = r;
        setRound(r);
        setCells(r.cells);
        setFound(0);
        setErrors(0);
        talliesRef.current = { found: 0, errors: 0 };
        if (stageIndex === 0 && freeRoundsWonRef.current === 0) {
          tlRef.current = FREE_SESSION_START_SEC;
          tlimRef.current = FREE_SESSION_START_SEC;
        }
        tapsRef.current = [];
        pendingPenaltyRef.current = 0;
        const s = loadGameSettings();
        if (!s.countdown) {
          setPlayStep('running');
          return;
        }
        setCdShow(true);
        for (let i = 3; i > 0; i--) {
          setCdVal(i);
          playSfx('click');
          await sleep(380);
        }
        setCdVal('GO');
        playSfx('collect');
        await sleep(320);
        setCdShow(false);
        setPlayStep('running');
      } finally {
        roundEndedRef.current = false;
      }
    },
    [playSfx],
  );

  const startFreeMode = useCallback(() => {
    freeStageRef.current = 0;
    freeRoundsWonRef.current = 0;
    freeStrikesRef.current = 0;
    setFreeStrikes(0);
    void beginFreeRoundAtStage(0);
  }, [beginFreeRoundAtStage]);

  const endRound = useCallback(
    (won) => {
      if (roundEndedRef.current) return;
      roundEndedRef.current = true;
      stopTimer();
      const r = roundRef.current;
      if (!r) {
        roundEndedRef.current = false;
        return;
      }
      const { found: f, errors: e } = talliesRef.current;
      const tl = tlRef.current;
      const tlim = tlimRef.current;
      const targetTc = Array.isArray(r.cells)
        ? r.cells.filter((c) => c.isT).length
        : r.tc;
      const stats = computeRoundStats({
        tlim,
        tl,
        found: f,
        errors: e,
        tc: targetTc || r.tc,
        taps: [...tapsRef.current],
        diff: r.diff,
        won,
      });
      if (r.mode === 'challenge') {
        const idx = chalIdxRef.current;
        const names = chalNamesRef.current;
        const base = [...chalScoresRef.current];
        const prevRow = base[idx];
        base[idx] = mergeChallengePlayerStats(prevRow, stats, e, names[idx]);
        chalScoresRef.current = base;
        setChalScores(base);
        if (won) playSfx('win');
        else playSfx('error');
        const nextIdx = idx + 1;
        if (nextIdx < names.length) {
          setChalIdx(nextIdx);
          setChalTurnOpen(true);
          setPhase('play');
          setPlayStep('idle');
          setRound(null);
          setCells([]);
          roundEndedRef.current = false;
        } else {
          const cycle = chalCycleRef.current;
          const totalR = chalRoundsTotalRef.current;
          if (cycle + 1 < totalR) {
            chalCycleRef.current = cycle + 1;
            setChalRoundIdx(chalCycleRef.current);
            const newSeed = prepareChallengeSeed();
            setChalSeed(newSeed);
            setChalIdx(0);
            chalIdxRef.current = 0;
            setChalTurnOpen(true);
            setPhase('play');
            setPlayStep('idle');
            setRound(null);
            setCells([]);
            roundEndedRef.current = false;
          } else {
            setLastResult({ type: 'challenge', rows: base });
            setPhase('chalRes');
          }
        }
        return;
      }
      if (r.mode === 'free') {
        if (won) {
          playSfx('win');
          const completed = r.freeStage ?? 0;
          const bonus = freeClearBonusSec(completed, r.tlim);
          tlRef.current = Math.min(FREE_SESSION_CAP_SEC, tlRef.current + bonus);
          tlimRef.current = Math.max(tlimRef.current, tlRef.current);
          freeRoundsWonRef.current += 1;
          freeStageRef.current += 1;
          setPauseOpen(false);
          void beginFreeRoundAtStage(freeStageRef.current);
        } else {
          playSfx('error');
          const rw = freeRoundsWonRef.current;
          setProfile((prev) => {
            const prevB = prev.freeBest ?? 0;
            if (rw <= prevB) return prev;
            const p = { ...prev, freeBest: rw };
            saveProfile(p);
            return p;
          });
          setLastResult({ type: 'free', roundsWon: rw, lastR: r });
          setPhase('freeRes');
          setPlayStep('idle');
          setPauseOpen(false);
          setQuitOpen(false);
          setCdShow(false);
          setRound(null);
          setCells([]);
        }
        return;
      }
      if (won) playSfx('win');
      else playSfx('error');
      persistLevel(r, stats, f, e);
      setLastResult({ type: 'level', stats, r, won, found: f, errors: e });
      setPhase('res');
    },
    [stopTimer, persistLevel, playSfx, beginFreeRoundAtStage],
  );

  useEffect(() => {
    endRoundRef.current = endRound;
  }, [endRound]);

  useEffect(() => {
    if (playStep !== 'running' || pauseOpen) return;
    let id;
    let last = performance.now();
    warned10Ref.current = false;
    runRef.current = true;
    const loop = (ts) => {
      if (!runRef.current || pauseOpen) return;
      const dt = (ts - last) / 1000;
      last = ts;
      const rr = roundRef.current;
      const drainMult =
        rr?.mode === 'free' ? freeTimeDrainMultiplier(rr.freeStage ?? 0) : 1;
      tlRef.current = Math.max(
        0,
        tlRef.current - dt * drainMult - pendingPenaltyRef.current,
      );
      pendingPenaltyRef.current = 0;
      if (!warned10Ref.current && tlRef.current <= 10) {
        warned10Ref.current = true;
        playSfx('click');
      }
      if (tlRef.current <= 0) {
        endRoundRef.current(false);
        return;
      }
      id = requestAnimationFrame(loop);
    };
    lastTapRef.current = performance.now();
    id = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(id);
    };
  }, [playStep, pauseOpen, playSfx]);

  useLayoutEffect(() => {
    if (phase !== 'play' || !round) return;
    const wrap = gridWrapRef.current;
    if (!wrap) return;
    const gridN = round.grid;
    const isDeadly = round.diff === 'deadly';
    let raf = 0;
    const measure = () => {
      const vpH = window.visualViewport?.height ?? window.innerHeight;
      const vpW = window.visualViewport?.width ?? window.innerWidth;
      let fixed = 0;
      wrap.querySelectorAll('[data-fq-chrome]').forEach((el) => {
        fixed += el.getBoundingClientRect().height;
      });
      fixed += 28;
      // Compute the wrap's actual content width (excluding its own padding)
      // and reserve a small overhead for the grid-outer and grid-inner
      // padding inside it, so the rendered grid never overflows the wrap.
      // Cap by 0.98·vpW as a viewport-edge safety net.
      const cs = window.getComputedStyle(wrap);
      const wrapPadX =
        (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
      const wrapBoundW = wrap.getBoundingClientRect().width || vpW;
      const GRID_OUTER_INNER_OVERHEAD = 16;
      const availFromWrap = Math.max(
        120,
        Math.floor(wrapBoundW - wrapPadX - GRID_OUTER_INNER_OVERHEAD),
      );
      const availW = Math.min(availFromWrap, Math.floor(vpW * 0.98));
      const availRatio = isDeadly ? 0.86 : 0.8;
      const availH = Math.floor(Math.min(vpH * availRatio, vpH - fixed));
      const square = Math.max(Math.min(availW, availH), isDeadly ? 72 : 64);
      const gap = gridN >= 9 ? 2 : 3;
      const INNER_PAD = 6;
      const totalGap = gap * (gridN - 1);
      const minCell = gridN >= 10 ? (isDeadly ? 22 : 16) : 8;
      const cell = Math.max(
        minCell,
        Math.floor((square - totalGap - INNER_PAD * 2) / gridN),
      );
      setGridMetrics({ cell, gap, pad: INNER_PAD });
    };
    measure();
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    });
    ro.observe(wrap);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [phase, round, cells.length]);

  const runCountdownThen = async (onDone) => {
    if (!settings.countdown) {
      onDone();
      return;
    }
    setCdShow(true);
    for (let n = 3; n > 0; n--) {
      setCdVal(n);
      playSfx('click');
      await sleep(380);
    }
    setCdVal('GO');
    playSfx('collect');
    await sleep(320);
    setCdShow(false);
    onDone();
  };

  const startLevelGame = async (diff, lv) => {
    setPhase('play');
    setPlayStep('idle');
    setCdShow(false);
    const r = prepareLevelRound(diff, lv);
    roundRef.current = r;
    setRound(r);
    setCells(r.cells);
    setFound(0);
    setErrors(0);
    talliesRef.current = { found: 0, errors: 0 };
    tlRef.current = r.tlim;
    tlimRef.current = r.tlim;
    tapsRef.current = [];
    pendingPenaltyRef.current = 0;
    roundEndedRef.current = false;
    await runCountdownThen(() => {
      setPlayStep('running');
    });
  };

  const onCellTap = useCallback((idx) => {
    if (playStep !== 'running' || pauseOpen) return;
    const r = roundRef.current;
    if (!r) return;
    setCells((prev) => {
      const c = prev[idx];
      if (!c || c.tapped) return prev;
      const now = performance.now();
      if (lastTapRef.current) tapsRef.current.push(now - lastTapRef.current);
      lastTapRef.current = now;
      if (c.isT) {
        playSfx('collect');
        const nextCells = prev.map((x, i) =>
          i === idx ? { ...x, tapped: true, feedback: 'ok' } : x,
        );
        const totalTargets = nextCells.filter((x) => x.isT).length;
        const tappedTargets = nextCells.filter((x) => x.isT && x.tapped).length;
        talliesRef.current.found = tappedTargets;
        setFound(tappedTargets);
        if (totalTargets > 0 && tappedTargets === totalTargets) {
          queueMicrotask(() => endRoundRef.current(true));
        }
        return nextCells;
      }
      playSfx('error');
      pendingPenaltyRef.current += 1;
      talliesRef.current.errors += 1;
      setErrors(talliesRef.current.errors);
      if (r.mode === 'free') {
        const ns = freeStrikesRef.current + 1;
        freeStrikesRef.current = ns;
        setFreeStrikes(ns);
        if (ns >= 3) {
          queueMicrotask(() => endRoundRef.current(false));
        }
      }
      setShake(true);
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
      shakeTimerRef.current = setTimeout(() => {
        setShake(false);
        shakeTimerRef.current = 0;
      }, 350);
      return prev.map((x, i) =>
        i === idx ? { ...x, tapped: true, feedback: 'bad' } : x,
      );
    });
  }, [playStep, pauseOpen, playSfx]);

  const onHudPause = useCallback(() => {
    if (playStep !== 'running') return;
    stopTimer();
    setPauseOpen(true);
  }, [playStep, stopTimer]);

  const onHudQuit = useCallback(() => {
    if (playStep === 'running') stopTimer();
    setQuitOpen(true);
  }, [playStep, stopTimer]);

  const openChallenge = () => {
    const names = chalNames.map((s, i) => s.trim() || `Player ${i + 1}`);
    if (names.length < 2) {
      alert(t.needTwo);
      return;
    }
    setChalNames(names);
    chalRoundsTotalRef.current = chalRoundsTotal;
    chalCycleRef.current = 0;
    setChalRoundIdx(0);
    const seed = prepareChallengeSeed();
    setChalSeed(seed);
    setChalIdx(0);
    chalIdxRef.current = 0;
    const initial = names.map((nm) => ({ nm, rounds: [] }));
    chalScoresRef.current = initial;
    setChalScores(initial);
    setChalTurnOpen(true);
    setPhase('play');
  };

  const startChallengeRound = () => {
    if (!chalSeed) return;
    setChalTurnOpen(false);
    roundEndedRef.current = false;
    const r = prepareChallengePlayState(chalSeed);
    roundRef.current = r;
    setRound(r);
    setCells(r.cells);
    setFound(0);
    setErrors(0);
    talliesRef.current = { found: 0, errors: 0 };
    tlRef.current = r.tlim;
    tlimRef.current = r.tlim;
    tapsRef.current = [];
    pendingPenaltyRef.current = 0;
    setPlayStep('running');
    playSfx('click');
  };

  const confirmQuit = () => {
    setQuitOpen(false);
    stopTimer();
    roundEndedRef.current = false;
    setPlayStep('idle');
    setRound(null);
    setCells([]);
    setPhase('hub');
  };

  return (
    <div
      className="cancellation-task-game ct-fq-root"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {phase === 'hub' && (
        <div className="ct-fq-training-shell">
          <FqTrainingBackdrop patternId={trainingPatternId} />
          <div className="ct-fq-screen ct-fq-training-screen ct-fq-training-screen--hub">
            <FqTrainingMenuBar
              onBack={onBack}
              playSfx={playSfx}
              hubSpaced
              center={
                <div className="ct-fq-hub-attn-head">
                  <div className="ct-fq-hub-attn-big">{t.hubAttentionWord}</div>
                  <div className="ct-fq-hub-attn-sub">{t.hubTrainingTag}</div>
                </div>
              }
            />
            <FqHubModeMap
              t={t}
              isAr={isAr}
              playSfx={playSfx}
              onFree={startFreeMode}
              onLevels={() => setPhase('diff')}
              onChallenge={() => setPhase('chal')}
            />
          </div>
        </div>
      )}

      {phase === 'diff' && (
        <div className="ct-fq-training-shell">
          <FqTrainingBackdrop patternId={trainingPatternId} />
          <div className="ct-fq-screen ct-fq-training-screen">
            <FqTrainingMenuBar
              onBack={() => setPhase('hub')}
              playSfx={playSfx}
              center={
                <div style={{ textAlign: 'center' }}>
                  <div className="ct-fq-training-title ct-fq-training-title-sm">{t.pickDiff}</div>
                </div>
              }
            />
            <p className="ct-fq-sub ct-fq-training-blurb">{t.pickDiffSub}</p>
            {Object.entries(DM).map(([k, m]) => (
              <button
                key={k}
                type="button"
                className={`ct-fq-db ct-fq-db-${k} ct-fq-db-training`}
                onClick={() => {
                  playSfx('click');
                  setDiffKey(k);
                  setPhase('levels');
                }}
              >
                <span>{m.label}</span>
                <span className="ct-fq-dbg">
                  {m.pop} · {m.grid}×{m.grid}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'levels' && (
        <div className="ct-fq-training-shell">
          <FqTrainingBackdrop patternId={trainingPatternId} />
          <div className="ct-fq-screen ct-fq-training-screen">
            <FqTrainingMenuBar
              onBack={() => setPhase('diff')}
              playSfx={playSfx}
              center={
                <div style={{ textAlign: 'center' }}>
                  <div className="ct-fq-training-title ct-fq-training-title-sm">{DM[diffKey].label}</div>
                </div>
              }
            />
            <p className="ct-fq-sub ct-fq-training-blurb">
              {t.levelsSub(DM[diffKey].pop, DM[diffKey].grid)}
            </p>
            <div className="ct-fq-lg ct-fq-lg-training">
              {Array.from({ length: 20 }, (_, i) => i + 1).map((lv) => {
                const un = isLevelUnlocked(diffKey, lv, doneMap);
                const dn = !!doneMap[`${diffKey}-${lv}`];
                const cfg = getLvCfg(diffKey, lv - 1);
                const cls = `ct-fq-lb ${un ? `ct-${DM[diffKey].lvc}` : 'ct-lvk'}`;
                return (
                  <button
                    key={lv}
                    type="button"
                    className={cls}
                    disabled={!un}
                    onClick={() => {
                      if (!un) return;
                      playSfx('click');
                      startLevelGame(diffKey, lv);
                    }}
                  >
                    <span className="ct-ln">{dn ? '✓' : lv}</span>
                    <span className="ct-ls">
                      {un ? `${cfg.tc}t·${cfg.time}s` : '🔒'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {phase === 'chal' && (
        <div className="ct-fq-training-shell">
          <FqTrainingBackdrop patternId={trainingPatternId} />
          <div className="ct-fq-screen ct-fq-training-screen">
            <FqTrainingMenuBar
              onBack={() => setPhase('hub')}
              playSfx={playSfx}
              center={
                <div style={{ textAlign: 'center' }}>
                  <div className="ct-fq-training-title ct-fq-training-title-sm">{t.challengeTitle}</div>
                </div>
              }
            />
            <p className="ct-fq-sub ct-fq-training-blurb">{t.challengeSub}</p>
            <div className="ct-fq-card ct-fq-card-training">
              <h3>{t.players}</h3>
              {chalNames.map((nm, i) => (
                <div key={i} className="ct-fq-pr">
                  <input
                    value={nm}
                    maxLength={20}
                    onChange={(e) => {
                      const next = [...chalNames];
                      next[i] = e.target.value;
                      setChalNames(next);
                    }}
                  />
                  {chalNames.length > 2 && (
                    <button
                      type="button"
                      className="ct-fq-prm"
                      onClick={() => {
                        setChalNames(chalNames.filter((_, j) => j !== i));
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              {chalNames.length < 10 && (
                <button
                  type="button"
                  className="ct-fq-apb ct-fq-apb-training"
                  onClick={() => setChalNames([...chalNames, `Player ${chalNames.length + 1}`])}
                >
                  {t.addPl}
                </button>
              )}
              <h3 style={{ marginTop: 14 }}>{t.chalRounds}</h3>
              <p className="ct-fq-sub" style={{ marginTop: 2, marginBottom: 8, fontSize: '0.78rem' }}>
                {t.chalRoundsHint}
              </p>
              <div className="ct-fq-rr" role="group" aria-label={t.chalRounds}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`ct-fq-rrb${chalRoundsTotal === n ? ' ct-fq-rrb-on ct-fq-rrb-on-training' : ''} ct-fq-rrb-training`}
                    onClick={() => {
                      playSfx('click');
                      setChalRoundsTotal(n);
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              className="ct-fq-btn ct-fq-btn-pri"
              onClick={() => { playSfx('click'); openChallenge(); }}
            >
              {t.startCh}
            </button>
          </div>
        </div>
      )}

      {phase === 'play' && chalTurnOpen && !round && chalNames[chalIdx] && (
        <div className="ct-fq-ov">
          <div className="ct-fq-box">
            {chalRoundsTotal > 1 && (
              <p className="ct-fq-cpb" style={{ marginBottom: 10 }}>
                {t.roundNofM(chalRoundIdx + 1, chalRoundsTotal)}
              </p>
            )}
            <h2>{t.ready(chalNames[chalIdx])}</h2>
            <p>{t.handTo(chalNames[chalIdx])}</p>
            <button type="button" className="ct-fq-btn ct-fq-btn-pri" onClick={startChallengeRound}>
              {t.goReady}
            </button>
          </div>
        </div>
      )}

      {phase === 'play' && round && (
        <>
          <div className="ct-fq-g-wrap" ref={gridWrapRef}>
            {round.mode === 'challenge' && (
              <div className="ct-fq-cpb" data-fq-chrome>
                {chalRoundsTotal > 1 ? `${t.roundNofM(chalRoundIdx + 1, chalRoundsTotal)} · ` : ''}
                {chalNames[chalIdx]} — {chalIdx + 1}/{chalNames.length}
              </div>
            )}
            <CtLiveHud
              t={t}
              playStep={playStep}
              pauseOpen={pauseOpen}
              tlRef={tlRef}
              tlimRef={tlimRef}
              roundTlim={round.tlim}
              useSessionTimer={round.mode === 'free'}
              found={found}
              tc={cells.filter((c) => c.isT).length}
              errors={round.mode === 'free' ? freeStrikes : errors}
              errorsLabel={round.mode === 'free' ? t.freeStrikes : undefined}
              errorsMax={round.mode === 'free' ? 3 : undefined}
              lvlLabel={
                round.mode === 'free'
                  ? t.freeLvlLabel(DM[round.diff].label, round.lv)
                  : round.lv === 'CH'
                    ? 'CH'
                    : `L${round.lv}`
              }
              onPause={onHudPause}
              onQuit={onHudQuit}
            />
            <div className="ct-fq-tb" data-fq-chrome>
              <div className="ct-fq-tb-row">
                <div
                  className={`ct-fq-tb-icon-wrap${round.diff === 'deadly' ? ' ct-fq-tb-icon-deadly' : ''}`}
                  aria-hidden="true"
                >
                  <ShapeSvg
                    shape={
                      round.target in SH
                        ? round.target
                        : cells.find((c) => c.isT)?.shape || 'circle'
                    }
                    color={
                      round.targetCol ||
                      cells.find((c) => c.isT)?.fill ||
                      '#2d2d2d'
                    }
                    size={round.diff === 'deadly' ? 40 : 34}
                  />
                </div>
                <span className="ct-fq-tb-cue">
                  {round.searchMode === 'identity' ? t.cueExact : t.cueShape}
                </span>
              </div>
            </div>
            <div className="ct-fq-grid-outer">
              <div
                className="ct-fq-grid-inner"
                style={{
                  width: round.grid * gridMetrics.cell + (round.grid - 1) * gridMetrics.gap + gridMetrics.pad * 2,
                  height: round.grid * gridMetrics.cell + (round.grid - 1) * gridMetrics.gap + gridMetrics.pad * 2,
                }}
              >
                <div
                  className={`ct-fq-sg ${shake ? 'shake' : ''}`}
                  style={{
                    gridTemplateColumns: `repeat(${round.grid}, ${gridMetrics.cell}px)`,
                    gridTemplateRows: `repeat(${round.grid}, ${gridMetrics.cell}px)`,
                    gap: gridMetrics.gap,
                    width: round.grid * gridMetrics.cell + (round.grid - 1) * gridMetrics.gap,
                  }}
                >
                  {cells.map((c, idx) => (
                    <FqGridCell
                      key={c.id}
                      cell={c}
                      idx={idx}
                      size={Math.max(16, gridMetrics.cell - 6)}
                      running={playStep === 'running' && !pauseOpen}
                      onTap={onCellTap}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {pauseOpen && (
            <div className="ct-fq-ov">
              <div className="ct-fq-box">
                <h2>{t.paused}</h2>
                <button
                  type="button"
                  className="ct-fq-btn ct-fq-btn-pri"
                  onClick={() => {
                    setPauseOpen(false);
                    runRef.current = true;
                    bumpFrame();
                  }}
                >
                  {t.resume}
                </button>
                <button
                  type="button"
                  className="ct-fq-btn ct-fq-btn-ghost"
                  onClick={() => {
                    setPauseOpen(false);
                    if (round.mode === 'level') startLevelGame(round.diff, round.lv);
                    else if (round.mode === 'free') void beginFreeRoundAtStage(round.freeStage ?? 0);
                    else startChallengeRound();
                  }}
                >
                  {t.restart}
                </button>
                <button
                  type="button"
                  className="ct-fq-btn ct-fq-btn-ghost"
                  onClick={() => { setPauseOpen(false); setQuitOpen(true); }}
                >
                  {t.quitMenu}
                </button>
              </div>
            </div>
          )}

          {quitOpen && (
            <div className="ct-fq-ov">
              <div className="ct-fq-box">
                <h2>{t.quitQ}</h2>
                <p>{t.quitLose}</p>
                <button type="button" className="ct-fq-btn ct-fq-btn-pri" onClick={confirmQuit}>
                  {t.yesQuit}
                </button>
                <button
                  type="button"
                  className="ct-fq-btn ct-fq-btn-ghost"
                  onClick={() => {
                    setQuitOpen(false);
                    if (playStep === 'running') runRef.current = true;
                  }}
                >
                  {t.keep}
                </button>
              </div>
            </div>
          )}

        </>
      )}

      {phase === 'res' && lastResult?.type === 'level' && (
        <div className="ct-fq-training-shell">
          <FqTrainingBackdrop patternId={trainingPatternId} />
          <div className="ct-fq-screen ct-fq-training-screen">
            <FqTrainingMenuBar
              onBack={() => {
                setLastResult(null);
                setPhase('hub');
              }}
              playSfx={playSfx}
              center={
                <div style={{ textAlign: 'center' }}>
                  <div className="ct-fq-training-title ct-fq-training-title-sm">
                    {lastResult.stats.won ? t.resultsLevelPass : t.resultsLevelRetryTitle}
                  </div>
                </div>
              }
            />
            <div className="ct-fq-sbig">{Math.round(lastResult.stats.ies)}</div>
            <div className="ct-fq-ies-lbl">{t.ies}</div>
            <div className="ct-fq-rm ct-fq-rm-training">
              <div className="ct-fq-rmi">
                <div className="ct-fq-rv">{lastResult.stats.timeUsed}s</div>
                <div className="ct-fq-rl">{t.time}</div>
              </div>
              <div className="ct-fq-rmi">
                <div className="ct-fq-rv">{lastResult.errors}</div>
                <div className="ct-fq-rl">{t.err}</div>
              </div>
              <div className="ct-fq-rmi">
                <div className="ct-fq-rv">{lastResult.stats.acc}%</div>
                <div className="ct-fq-rl">Acc</div>
              </div>
              <div className="ct-fq-rmi">
                <div className="ct-fq-rv">{lastResult.stats.avgRt}ms</div>
                <div className="ct-fq-rl">{t.rt}</div>
              </div>
            </div>
            <div className="ct-fq-row">
              {lastResult.stats.won && lastResult.r.lv < 20 && (
                <button
                  type="button"
                  className="ct-fq-btn ct-fq-btn-pri"
                  onClick={() => {
                    playSfx('click');
                    setPhase('play');
                    setLastResult(null);
                    startLevelGame(lastResult.r.diff, lastResult.r.lv + 1);
                  }}
                >
                  {t.nextLv}
                </button>
              )}
              <button
                type="button"
                className="ct-fq-btn ct-fq-btn-ghost"
                onClick={() => {
                  playSfx('click');
                  setLastResult(null);
                  startLevelGame(lastResult.r.diff, lastResult.r.lv);
                }}
              >
                {t.retry}
              </button>
              <button
                type="button"
                className="ct-fq-btn ct-fq-btn-ghost"
                onClick={() => {
                  setLastResult(null);
                  setPhase('hub');
                }}
              >
                {t.menu}
              </button>
            </div>
          </div>
        </div>
      )}

      {phase === 'freeRes' && lastResult?.type === 'free' && (
        <div className="ct-fq-training-shell">
          <FqTrainingBackdrop patternId={trainingPatternId} />
          <div className="ct-fq-screen ct-fq-training-screen">
            <FqTrainingMenuBar
              onBack={() => {
                setLastResult(null);
                setPhase('hub');
              }}
              playSfx={playSfx}
              center={
                <div style={{ textAlign: 'center' }}>
                  <div className="ct-fq-training-title ct-fq-training-title-sm">{t.freeGameOver}</div>
                </div>
              }
            />
            <div className="ct-fq-sbig">{lastResult.roundsWon}</div>
            <div className="ct-fq-ies-lbl">{t.freeRoundsCleared(lastResult.roundsWon)}</div>
            <p className="ct-fq-sub ct-fq-training-blurb">{t.freeBest(profile.freeBest ?? 0)}</p>
            <button
              type="button"
              className="ct-fq-btn ct-fq-btn-pri"
              onClick={() => {
                playSfx('click');
                setLastResult(null);
                startFreeMode();
              }}
            >
              {t.freePlayAgain}
            </button>
            <button
              type="button"
              className="ct-fq-btn ct-fq-btn-ghost"
              onClick={() => {
                setLastResult(null);
                setPhase('hub');
              }}
            >
              {t.menu}
            </button>
          </div>
        </div>
      )}

      {phase === 'chalRes' && lastResult?.type === 'challenge' && lastResult.rows && (
        <div className="ct-fq-training-shell">
          <FqTrainingBackdrop patternId={trainingPatternId} />
          <div className="ct-fq-screen ct-fq-training-screen">
            <FqTrainingMenuBar
              onBack={() => {
                setLastResult(null);
                setPhase('hub');
              }}
              playSfx={playSfx}
              center={
                <div style={{ textAlign: 'center' }}>
                  <div className="ct-fq-training-title ct-fq-training-title-sm">{t.resultsChalTitle}</div>
                </div>
              }
            />
            {[...lastResult.rows].sort((a, b) => b.ies - a.ies).map((row, i) => (
              <div key={row.nm} className={`ct-fq-lbr ct-fq-lbr-training ${i === 0 ? 'win' : ''}`}>
                <div className="ct-fq-lbrk">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</div>
                <div>
                  <div className="ct-fq-lbnm">{row.nm}</div>
                  <div className="ct-fq-lbdt">
                    {t.chalResDetail(
                      row.rounds?.length || 1,
                      row.timeUsed,
                      row.errors,
                      row.acc,
                      row.tps,
                    )}
                  </div>
                </div>
                <div className="ct-fq-lbsc">{Math.round(row.ies)}</div>
              </div>
            ))}
            <button
              type="button"
              className="ct-fq-btn ct-fq-btn-pri"
              onClick={() => {
                setLastResult(null);
                setPhase('chal');
                setChalSeed(null);
              }}
            >
              {t.newCh}
            </button>
            <button
              type="button"
              className="ct-fq-btn ct-fq-btn-ghost"
              onClick={() => {
                setLastResult(null);
                setPhase('hub');
              }}
            >
              {t.menu}
            </button>
          </div>
        </div>
      )}

      {phase === 'play' && cdShow && (
        <div className="ct-fq-cd">
          <div className="ct-fq-cd-num">{cdVal}</div>
          <div className="ct-fq-cd-lbl">{t.countdownHint}</div>
        </div>
      )}
    </div>
  );
}
