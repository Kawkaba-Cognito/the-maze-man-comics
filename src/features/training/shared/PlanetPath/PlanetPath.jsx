import React, { useMemo, useLayoutEffect, useRef, useState } from 'react';
import { TrainingScreenShell } from '../TrainingScreens';
import KawkabSprite from '../KawkabSprite.jsx';
import { assetUrl } from '../../../../lib/assetUrl';
import './planetPath.css';

/*
 * SHARED COSMIC PLANET PATH
 *
 * Reusable cosmic orbital trail and level progression map across training games.
 * Features:
 *   - Continuous sinusoidal SVG orbital trail (full + walked progress)
 *   - Chapter cards for each decade band with cosmic sigils, titles, and mechanics
 *   - Celestial sphere nodes with level numerals, cleared checks, lock badges, and stars
 *   - Active frontier node with pulsing beacon and sublabel
 *   - Dr. Kawkab walker sprite on the current level
 *   - Themed landscape landmarks (volcano, dune, lake, storm, tree, farworld)
 *   - Auto-scroll to frontier on mount
 *   - Modal help guide on top-right '?'
 */

const ROW_H = 112;
const AMPLITUDE = 30;
const BAND_SIZE = 10;
const BAND_GAP = 120;
const FIRST_NODE_Y = 190;
const BAND_MARKER_OFFSET = 170;

const yOf = (i) => FIRST_NODE_Y + i * ROW_H + Math.floor(i / BAND_SIZE) * BAND_GAP;

export const BAND_SIGIL = ['star', 'comet', 'meteor-cluster', 'nebula-bolt', 'warp-gate', 'supernova'];

export const atlasUrl = (file) => assetUrl(`Assets/training/cancel-cosmic-atlas-2026/${file}.webp`);

let lastFrontierLv = null;

const PROP = {
  volcano: (
    <svg viewBox="0 0 120 84" width="100%" height="100%" aria-hidden="true">
      <path d="M4 84 L46 10 Q60 -4 74 10 L116 84 Z" fill="var(--game-ink)" opacity="0.72" />
      <path d="M46 12 Q60 2 74 12 L82 26 Q60 18 38 26 Z" fill="var(--cpp-sec-lit)" opacity="0.92" />
      <path d="M58 20 L52 52 L62 70 L58 84 L70 84 L66 56 L72 30 Z" fill="var(--cpp-sec-lit)" opacity="0.6" />
    </svg>
  ),
  basalt: (
    <svg viewBox="0 0 160 46" width="100%" height="100%" aria-hidden="true">
      <path d="M6 40 Q24 22 52 28 Q78 12 104 26 Q134 20 154 40 Q120 46 78 44 Q34 46 6 40 Z"
        fill="var(--game-ink)" opacity="0.66" />
      <path d="M26 36 Q56 28 88 34 Q118 38 140 34" stroke="var(--cpp-sec-lit)" strokeWidth="2"
        fill="none" opacity="0.75" />
    </svg>
  ),
  dune: (
    <svg viewBox="0 0 220 52" width="100%" height="100%" aria-hidden="true">
      <path d="M0 52 Q48 12 108 22 Q168 32 220 8 L220 52 Z" fill="var(--cpp-sec)" opacity="0.5" />
      <path d="M0 52 Q48 14 108 24 Q168 34 220 10" stroke="var(--cpp-sec-lit)" strokeWidth="2"
        fill="none" opacity="0.6" />
    </svg>
  ),
  lake: (
    <svg viewBox="0 0 180 76" width="100%" height="100%" aria-hidden="true">
      <ellipse cx="90" cy="38" rx="86" ry="33" fill="var(--cpp-sec-lit)" opacity="0.4" />
      <ellipse cx="90" cy="38" rx="86" ry="33" fill="none" stroke="var(--cpp-sec-lit)"
        strokeWidth="2" opacity="0.8" />
      <path d="M28 30 L62 42 L96 28 L134 44" stroke="var(--cpp-sec-lit)" strokeWidth="1.5"
        fill="none" opacity="0.7" />
    </svg>
  ),
  shard: (
    <svg viewBox="0 0 64 96" width="100%" height="100%" aria-hidden="true">
      <path d="M32 0 L56 52 L40 96 L20 96 L6 50 Z" fill="var(--cpp-sec-lit)" opacity="0.42" />
      <path d="M32 0 L40 96 L20 96 Z" fill="var(--cpp-sec-lit)" opacity="0.62" />
    </svg>
  ),
  storm: (
    <svg viewBox="0 0 150 90" width="100%" height="100%" aria-hidden="true">
      <path d="M26 46 Q16 26 38 22 Q46 4 70 12 Q92 2 102 22 Q128 22 124 46 Z"
        fill="var(--game-ink)" opacity="0.5" />
      <path d="M72 48 L58 72 L72 72 L62 90 L88 64 L74 64 L84 48 Z"
        fill="var(--cpp-sec-lit)" opacity="0.9" />
    </svg>
  ),
  tree: (
    <svg viewBox="0 0 90 120" width="100%" height="100%" aria-hidden="true">
      <rect x="41" y="70" width="8" height="50" fill="var(--game-ink)" opacity="0.6" />
      <ellipse cx="45" cy="46" rx="42" ry="38" fill="var(--cpp-sec)" opacity="0.72" />
      <ellipse cx="34" cy="36" rx="22" ry="19" fill="var(--cpp-sec-lit)" opacity="0.45" />
    </svg>
  ),
  farworld: (
    <svg viewBox="0 0 140 90" width="100%" height="100%" aria-hidden="true">
      <circle cx="70" cy="45" r="27" fill="var(--cpp-sec-lit)" opacity="0.34" />
      <circle cx="62" cy="38" r="20" fill="var(--cpp-sec-lit)" opacity="0.22" />
      <ellipse cx="70" cy="45" rx="64" ry="13" fill="none" stroke="var(--cpp-sec-lit)"
        strokeWidth="2" opacity="0.5" transform="rotate(-16 70 45)" />
    </svg>
  ),
};

const TERRAIN = {
  ember: [
    { p: 'volcano', l: '4%', t: '58%', w: 230 },
    { p: 'volcano', l: '76%', t: '22%', w: 150 },
    { p: 'basalt', l: '58%', t: '72%', w: 300 },
    { p: 'basalt', l: '2%', t: '31%', w: 220 },
    { p: 'basalt', l: '68%', t: '90%', w: 190 },
  ],
  dust: [
    { p: 'dune', l: '-4%', t: '26%', w: 420 },
    { p: 'dune', l: '52%', t: '54%', w: 480 },
    { p: 'dune', l: '6%', t: '82%', w: 380 },
  ],
  frost: [
    { p: 'lake', l: '2%', t: '30%', w: 300 },
    { p: 'lake', l: '62%', t: '66%', w: 340 },
    { p: 'shard', l: '82%', t: '14%', w: 78 },
    { p: 'shard', l: '10%', t: '72%', w: 64 },
    { p: 'shard', l: '73%', t: '90%', w: 92 },
  ],
  tempest: [
    { p: 'storm', l: '3%', t: '18%', w: 230 },
    { p: 'storm', l: '70%', t: '52%', w: 280 },
    { p: 'storm', l: '14%', t: '78%', w: 190 },
  ],
  verdant: [
    { p: 'tree', l: '4%', t: '24%', w: 130 },
    { p: 'tree', l: '80%', t: '38%', w: 165 },
    { p: 'tree', l: '9%', t: '62%', w: 150 },
    { p: 'tree', l: '76%', t: '80%', w: 120 },
  ],
  void: [
    { p: 'farworld', l: '4%', t: '26%', w: 260 },
    { p: 'farworld', l: '66%', t: '68%', w: 200 },
  ],
};

function TerrainArt({ section }) {
  const props = TERRAIN[section];
  if (!props) return null;
  return props.map((f, i) => (
    <span
      key={`${f.p}${i}`}
      className="cpp-prop"
      style={{ left: f.l, top: f.t, width: f.w }}
      aria-hidden="true"
    >
      {PROP[f.p]}
    </span>
  ));
}

function CheckGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path d="M4 12.5 L9.5 18 L20 6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
      <rect x="5" y="11" width="14" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <path d="M8 11 V7.5 a4 4 0 0 1 8 0 V11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function StarRow({ n }) {
  return (
    <span className="cpp-stars" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <svg key={i} className={`cpp-star${i < n ? ' cpp-star--on' : ''}`} viewBox="0 0 24 24" width="9" height="9">
          <path d="M12 3.2l2.5 6.1 6.5.5-5 4.3 1.6 6.4-5.6-3.5-5.6 3.5 1.6-6.4-5-4.3 6.5-.5z" />
        </svg>
      ))}
    </span>
  );
}

function PlanetNode({
  lv, x, y, unlocked, done, current, label, onPick, playSfx, isAr, nodeRef, stars = 0, section,
}) {
  const statusWord = done ? (isAr ? 'مكتمل' : 'cleared') : !unlocked ? (isAr ? 'مقفل' : 'locked') : null;
  const ariaLabel = [
    isAr ? `المستوى ${lv}` : `Level ${lv}`,
    statusWord,
    unlocked && current && label ? label : null,
  ].filter(Boolean).join(', ');

  return (
    <button
      ref={nodeRef}
      type="button"
      className={`cpp-node${done ? ' cpp-node--done' : ''}${current ? ' cpp-node--current' : ''}${!unlocked ? ' cpp-node--locked' : ''}`}
      data-section={section || undefined}
      style={{ left: `${x}%`, top: y }}
      disabled={!unlocked}
      onClick={() => { if (!unlocked) return; playSfx?.('click'); onPick(lv); }}
      aria-current={current ? 'step' : undefined}
      aria-label={ariaLabel}
    >
      <span className="cpp-orb" aria-hidden="true">
        <span className="cpp-num">{lv}</span>
        {done ? <span className="cpp-badge cpp-badge--done"><CheckGlyph /></span> : null}
        {!unlocked ? <span className="cpp-badge cpp-badge--locked"><LockGlyph /></span> : null}
      </span>
      {done && stars > 0 ? <StarRow n={stars} /> : null}
      {current && unlocked && label ? <span className="cpp-sub">{label}</span> : null}
    </button>
  );
}

const DEFAULT_SECTIONS = [
  { id: 'ember' },
  { id: 'dust' },
  { id: 'frost' },
  { id: 'tempest' },
  { id: 'verdant' },
  { id: 'void' },
];

export default function PlanetPath({
  isAr,
  playSfx,
  onBack,
  title,
  blurb,
  count = 40,
  isUnlocked,
  isDone,
  sublabel,
  onPick,
  bands,
  stars,
  sections = DEFAULT_SECTIONS,
  help,
  bandSigils,
  shellClassName = 'cx-page cpp-page cx-atlas',
}) {
  const [helpOpen, setHelpOpen] = useState(false);

  const nodes = useMemo(() => Array.from({ length: count }, (_, i) => {
    const lv = i + 1;
    const x = 50 + AMPLITUDE * Math.sin(i * 0.9);
    return { lv, x, y: yOf(i) };
  }), [count]);

  const current = useMemo(() => {
    const found = nodes.find((n) => isUnlocked(n.lv) && !isDone(n.lv));
    return found || nodes[nodes.length - 1];
  }, [nodes, isUnlocked, isDone]);

  const pathHeight = yOf(count - 1) + 74;

  const trailD = useMemo(() => {
    const seg = (list) => {
      if (list.length < 2) return '';
      let d = `M ${list[0].x} ${list[0].y}`;
      for (let i = 1; i < list.length; i += 1) {
        const p = list[i - 1];
        const q = list[i];
        const m = (p.y + q.y) / 2;
        d += ` C ${p.x} ${m}, ${q.x} ${m}, ${q.x} ${q.y}`;
      }
      return d;
    };
    const currentIdx = nodes.findIndex((n) => n.lv === current.lv);
    return {
      full: seg(nodes),
      done: seg(nodes.slice(0, Math.max(1, currentIdx + 1))),
    };
  }, [nodes, current]);

  const currentRef = useRef(null);
  useLayoutEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'nearest' });
  }, []);

  const [walk, setWalk] = useState(null);
  useLayoutEffect(() => {
    if (lastFrontierLv != null && lastFrontierLv !== current.lv) {
      const prev = nodes.find((n) => n.lv === lastFrontierLv);
      if (prev) {
        setWalk({ dx: prev.x - current.x, dy: prev.y - current.y });
        const id = setTimeout(() => setWalk(null), 950);
        lastFrontierLv = current.lv;
        return () => clearTimeout(id);
      }
    }
    lastFrontierLv = current.lv;
    return undefined;
  }, [current.lv]);

  const bandCount = Math.ceil(count / BAND_SIZE);
  const bandStarts = bands ? Array.from({ length: bandCount }, (_, b) => b) : [];

  const bandCleared = (b) => {
    let n = 0;
    for (let lv = b * BAND_SIZE + 1; lv <= Math.min((b + 1) * BAND_SIZE, count); lv += 1) {
      if (isDone(lv)) n += 1;
    }
    return n;
  };

  const TERRAIN_OVERSCAN_TOP = 240;
  const TERRAIN_OVERSCAN_BOTTOM = 320;
  const terrainOf = (b) => {
    const first = b === 0;
    const last = b + 1 >= bandStarts.length;
    const top = first ? -TERRAIN_OVERSCAN_TOP : yOf(b * BAND_SIZE) - BAND_MARKER_OFFSET - 40;
    const next = last
      ? pathHeight + TERRAIN_OVERSCAN_BOTTOM
      : yOf((b + 1) * BAND_SIZE) - BAND_MARKER_OFFSET - 40;
    return { top, height: Math.max(0, next - top) };
  };

  const effectiveSigils = bandSigils || BAND_SIGIL;

  return (
    <TrainingScreenShell
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      shellClassName={shellClassName}
      onReplayTutorial={help ? () => setHelpOpen(true) : undefined}
      replayHint={help?.open}
    >
      <div className="ct-lv-grid-wrap">
        <div className="cpp-path" style={{ height: pathHeight }}>
          {sections && bandStarts.map((b) => {
            const sec = sections[b % sections.length];
            const secId = typeof sec === 'string' ? sec : sec?.id;
            return secId ? (
              <div
                key={`t${b}`}
                className="cpp-terrain"
                data-section={secId}
                style={terrainOf(b)}
                aria-hidden="true"
              >
                <TerrainArt section={secId} />
              </div>
            ) : null;
          })}

          <svg
            className="cpp-trail"
            viewBox={`0 0 100 ${pathHeight}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path className="cpp-trail-rest" d={trailD.full} vectorEffect="non-scaling-stroke" />
            <path className="cpp-trail-done" d={trailD.done} vectorEffect="non-scaling-stroke" pathLength="1" />
          </svg>

          {bands && bandStarts.map((b, bi) => {
            if (!bands[b]) return null;
            const sec = sections ? sections[b % sections.length] : null;
            const secId = typeof sec === 'string' ? sec : sec?.id;
            const sigilName = bands[b].sigil || effectiveSigils[b % effectiveSigils.length];
            const bandTotal = Math.min((b + 1) * BAND_SIZE, count) - (b * BAND_SIZE);

            return (
              <div
                className={`cpp-band${bi === 0 ? ' cpp-band--first' : ''}`}
                data-section={secId || undefined}
                style={{ top: yOf(b * BAND_SIZE) - BAND_MARKER_OFFSET }}
                key={`b${b}`}
              >
                <span className="cpp-band-rule" aria-hidden="true" />
                <span className="cpp-band-pill" role="note" aria-label={bands[b].aria || bands[b].title}>
                  <img className="cpp-band-sigil" src={atlasUrl(sigilName)} alt="" aria-hidden="true" />
                  <span className="cpp-band-name">{bands[b].title}</span>
                  <span className="cpp-band-sub">{bands[b].sub}</span>
                  <span className="cpp-band-count">{bandCleared(b)}/{bandTotal}</span>
                </span>
              </div>
            );
          })}

          {nodes.map((n) => {
            const secIndex = Math.floor((n.lv - 1) / BAND_SIZE);
            const sec = sections ? sections[secIndex % sections.length] : null;
            const secId = typeof sec === 'string' ? sec : sec?.id;
            const subStr = sublabel ? (typeof sublabel === 'function' ? sublabel(n.lv) : sublabel) : `L${n.lv}`;

            return (
              <PlanetNode
                key={n.lv}
                lv={n.lv}
                x={n.x}
                y={n.y}
                unlocked={isUnlocked ? isUnlocked(n.lv) : true}
                done={isDone ? isDone(n.lv) : false}
                current={n.lv === current.lv}
                label={isUnlocked ? (isUnlocked(n.lv) ? subStr : null) : subStr}
                onPick={onPick}
                playSfx={playSfx}
                isAr={isAr}
                nodeRef={n.lv === current.lv ? currentRef : undefined}
                stars={stars ? stars(n.lv) : 0}
                section={secId}
              />
            );
          })}

          <div
            className={`cpp-kawkab${walk ? ' cpp-kawkab--walking' : ''}`}
            style={walk ? {
              left: `${current.x}%`,
              top: current.y,
              '--cx-walk-dx': `${walk.dx}%`,
              '--cx-walk-dy': `${walk.dy}px`,
            } : { left: `${current.x}%`, top: current.y }}
            aria-hidden="true"
          >
            <div className="cpp-kawkab-bob">
              <KawkabSprite size="var(--cpp-kawkab-size)" />
            </div>
          </div>
        </div>
      </div>

      {help && helpOpen ? (
        <div
          className="cpp-help"
          role="dialog"
          aria-modal="true"
          aria-label={help.title}
          onClick={() => setHelpOpen(false)}
        >
          <div className="cpp-help-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="cpp-help-title">{help.title}</h2>
            <dl className="cpp-help-list">
              {(help.rows || []).map((row) => (
                <div className="cpp-help-row" key={row.k}>
                  <dt className="cpp-help-k">{row.k}</dt>
                  <dd className="cpp-help-v">{row.v}</dd>
                </div>
              ))}
            </dl>
            <button
              type="button"
              className="cpp-help-btn"
              onClick={() => { playSfx?.('click'); setHelpOpen(false); }}
            >
              {help.close || (isAr ? 'إغلاق' : 'Close')}
            </button>
          </div>
        </div>
      ) : null}
    </TrainingScreenShell>
  );
}
