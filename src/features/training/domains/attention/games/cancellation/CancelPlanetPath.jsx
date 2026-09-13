import React, { useMemo, useLayoutEffect, useRef, useState } from 'react';
import { TrainingScreenShell } from '../../../../shared/TrainingScreens';
import KawkabSprite from '../../../../shared/KawkabSprite.jsx';
import { assetUrl } from '../../../../../../lib/assetUrl';
import './cancelPlanetPath.css';

/*
 * CANCEL PLANET PATH — Cancellation only (owner: "i am planning to make the
 * levels like planets, and you move on them... we can try it for now only on
 * cancellation task"). If this reads well it is the model for every other
 * game's level grid; until then it replaces nothing else.
 *
 * ⚠ SAME PROP CONTRACT AS `TrainingLevelGrid` (shared/TrainingScreens.jsx),
 * on purpose — this is a drop-in visual swap at ONE call site
 * (cancellation/index.jsx's `phase === 'levels'` branch), not a new level
 * system. Progress, unlock rules and what happens on pick are all still
 * owned by the caller; this component only decides where each level SITS
 * and what stands on it. The new `bands` prop (Master Prompt Step 5b) is
 * OPTIONAL and purely presentational — it reads `FQ_LADDER`'s band titles,
 * it never derives a difficulty value, so `audit:curves` has nothing here
 * to gate.
 *
 * ── ROUND 4: real art, not a procedural rainbow ──
 * Nodes draw from `cancel-cosmic-atlas-2026` — a fixed 12-piece cycle, not
 * one asset per level, so the browser caches twelve images rather than
 * sixty. Cycled by POSITION, never by the round's actual target shape, so
 * the map can never pre-cue a search.
 *
 * ── MASTER PROMPT Step 5: a chart with chapters ──
 * Band-chapter markers (5b), Kawkab actually walking between planets on a
 * clear (5c, session-lifetime only — module-scope, never persisted), and
 * the walked trail drawing itself in (5d) — all presentation, all gated off
 * `prefers-reduced-motion`.
 */

const ROW_H = 112;    // px between one level's centre and the next
const AMPLITUDE = 30;  // how far a node swings from centre, in % of width
const BAND_SIZE = 10;
const BAND_GAP = 120;  // breathing room where a chapter card sits
const FIRST_NODE_Y = 190;
const BAND_MARKER_OFFSET = 170;

// The first node's own offset (was 56) has to clear KAWKAB standing above
// it too, not just the orb — his sprite reaches roughly 60px above
// whichever node is current, and level 1 IS the current node for every
// new player. 56 gave him ~4px of headroom before `.cpp-path`'s own top
// edge, which is what the header-crowding report was actually measuring.
const yOf = (i) => FIRST_NODE_Y + i * ROW_H + Math.floor(i / BAND_SIZE) * BAND_GAP;

/* ⚠ THE PER-LEVEL ART IS GONE (2026-09-13, owner: "in level mode it looks so
 * random", then "remove the image and upgrade the design").
 *
 * Every node used to carry a different piece from a 12-item cycle, assigned by
 * `(lv - 1) % 12` — so a rainbow spiral, a star, a lightning bolt and a green
 * block sat next to each other, meaning nothing and agreeing with nothing. The
 * word for that is exactly the one used: random. Worse, the number the player
 * actually needs was a small overlay ON the picture, and a locked level got a
 * padlock stamped through the middle of the illustration.
 *
 * A map's job is to tell you WHERE YOU ARE. So the node is now the level
 * number, in the atlas' own clock voice, and the illustration moves to the one
 * place on this screen where a picture carries information: the chapter card
 * at the head of each band of ten, which already had its own sigil. Art where
 * it means something, numbers where you need them.
 *
 * BAND_SIGIL is exported so the results screen's band-cleared callout
 * (index.jsx) uses the exact same sigil-per-band mapping as the map itself. */
export const BAND_SIGIL = ['star', 'comet', 'meteor-cluster', 'nebula-bolt', 'warp-gate', 'supernova'];

// Exported so any other screen in this game reaches the same 43 tracked
// pieces through the same one path convention (CancelModeAtlas.jsx, the
// results screen) — never a second `Assets/...` string built by hand.
export const atlasUrl = (file) => assetUrl(`Assets/training/cancel-cosmic-atlas-2026/${file}.webp`);

// Session-lifetime only, deliberately NOT persisted: which level was the
// frontier the last time this screen mounted, so a fresh mount after an
// actual clear can animate Kawkab walking from the old spot to the new one.
// A page reload starting fresh (no walk) is the right lifetime for a flourish.
let lastFrontierLv = null;

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
  // Three slots always, so a two-star level reads as "two of three" rather
  // than as a shorter row you have to compare against its neighbours.
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

function CancelPlanet({
  lv, x, y, unlocked, done, current, label, onPick, playSfx, isAr, nodeRef, stars = 0, section,
}) {
  // Full detail lives in aria-label (status + timing, where sighted players
  // get the status from the glyph/tint and the timing only when it's the
  // node they can actually press); the visible .cpp-sub caption is reserved
  // for the current node only, so 60 nodes don't all talk at once.
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
      /* The world this level belongs to. Everything visual about the section
         hangs off this one attribute in CSS, so a node never has to know what
         a colour is — and adding a seventh world is a data change. */
      data-section={section || undefined}
      style={{ left: `${x}%`, top: y }}
      disabled={!unlocked}
      onClick={() => { if (!unlocked) return; playSfx?.('click'); onPick(lv); }}
      aria-current={current ? 'step' : undefined}
      aria-label={ariaLabel}
    >
      {/* The number is the node. It stays visible in EVERY state — including
          cleared and locked — because "which level is this" is the one
          question this screen exists to answer, and the old markup replaced
          it with a glyph in exactly the states a player scrolls past most.
          State is carried by the disc's tint and a small corner badge
          instead, so nothing is ever stamped over the thing you are reading. */}
      <span className="cpp-orb" aria-hidden="true">
        <span className="cpp-num">{lv}</span>
        {done ? <span className="cpp-badge cpp-badge--done"><CheckGlyph /></span> : null}
        {!unlocked ? <span className="cpp-badge cpp-badge--locked"><LockGlyph /></span> : null}
      </span>
      {/* Stars sit UNDER the disc, never on it — the number is the thing being
          read, and a row of stars across it is the same mistake the padlock
          made. Only on a cleared level: an empty row on every locked node
          would read as sixty failures. */}
      {done && stars > 0 ? <StarRow n={stars} /> : null}
      {current && unlocked && label ? <span className="cpp-sub">{label}</span> : null}
    </button>
  );
}

export default function CancelPlanetPath({
  isAr, playSfx, onBack, title, blurb, count, isUnlocked, isDone, sublabel, onPick, bands,
  stars, sections,
}) {
  const nodes = useMemo(() => Array.from({ length: count }, (_, i) => {
    const lv = i + 1;
    const x = 50 + AMPLITUDE * Math.sin(i * 0.9);
    return { lv, x, y: yOf(i) };
  }), [count]);

  /* The frontier: first unlocked-but-not-done level. Falls back to the last
     node if the whole ladder is somehow clear, so Kawkab is never standing
     nowhere. */
  const current = useMemo(() => {
    const found = nodes.find((n) => isUnlocked(n.lv) && !isDone(n.lv));
    return found || nodes[nodes.length - 1];
  }, [nodes, isUnlocked, isDone]);

  const pathHeight = yOf(count - 1) + 74;

  // A trail that actually touches the planets: two smoothed paths (one for
  // the whole route, one for the walked portion) through the nodes' real
  // (x, y) coordinates, rather than a straight centre spine the nodes swing
  // past. `x` is in % (0-100), `y` in px — the viewBox below maps both 1:1.
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

  // Land on the player's own marker — a long scroll always opening at the
  // top means a high-level player hunts thousands of px for their own
  // position. Deliberately instant (no smooth option), which also
  // sidesteps prefers-reduced-motion entirely: nobody watches a
  // multi-thousand-px scroll fly by either way.
  //
  // ⚠ `block:'center'` FORCES a scroll even when the node is already on
  // screen (owner: "the circle is covering up words" — reported for a
  // low-level frontier, where the marker sits close to the title/blurb
  // above `.cpp-path`). Centering an early node drags the viewport down
  // by however much the rest of the page has to move to put it dead
  // centre, which can crop the header mid-line instead of leaving it
  // above the fold the way it already was. `nearest` only scrolls the
  // minimum needed to bring the marker fully into view — nothing at all
  // for a frontier that's already visible, which is exactly the
  // low-level case this broke, and still a real jump for a frontier
  // thousands of px down the ladder.
  const currentRef = useRef(null);
  useLayoutEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'nearest' });
    // Intentionally once-on-mount: re-running on every `current` change would
    // yank the screen out from under a player who scrolled away to look at a
    // future planet's tag.
  }, []);

  // Kawkab walks (Master Prompt 5c). Module-scope `lastFrontierLv`, not
  // persisted — this is a session-lifetime flourish, not progress data.
  const [walk, setWalk] = useState(null);
  useLayoutEffect(() => {
    if (lastFrontierLv != null && lastFrontierLv !== current.lv) {
      const prev = nodes.find((n) => n.lv === lastFrontierLv);
      if (prev) {
        setWalk({ dx: prev.x - current.x, dy: prev.y - current.y });
        // Clear the walking class after the animation completes so it does
        // not replay on an unrelated re-render (e.g. a language toggle).
        const id = setTimeout(() => setWalk(null), 950);
        lastFrontierLv = current.lv;
        return () => clearTimeout(id);
      }
    }
    lastFrontierLv = current.lv;
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.lv]);

  const bandStarts = bands ? Array.from({ length: Math.ceil(count / BAND_SIZE) }, (_, b) => b) : [];

  // How much of a band is behind you. Derived from the same `isDone` the nodes
  // use, so the card can never disagree with the discs under it.
  const bandCleared = (b) => {
    let n = 0;
    for (let lv = b * BAND_SIZE + 1; lv <= Math.min((b + 1) * BAND_SIZE, count); lv += 1) {
      if (isDone(lv)) n += 1;
    }
    return n;
  };

  return (
    <TrainingScreenShell isAr={isAr} playSfx={playSfx} onBack={onBack} shellClassName="cx-page">
      <div className="ct-lv-grid-wrap">
        {title ? <h1 className="ct-lv-hero-title">{title}</h1> : null}
        {blurb ? <p className="ct-lv-hero-sub">{blurb}</p> : null}
        <div className="cpp-path" style={{ height: pathHeight }}>
          <svg
            className="cpp-trail"
            viewBox={`0 0 100 ${pathHeight}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path className="cpp-trail-rest" d={trailD.full} vectorEffect="non-scaling-stroke" />
            <path className="cpp-trail-done" d={trailD.done} vectorEffect="non-scaling-stroke" pathLength="1" />
          </svg>
          {bands && bandStarts.map((b) => (
            bands[b] ? (
              <div
                className="cpp-band"
                data-section={sections ? sections[b]?.id : undefined}
                style={{ top: yOf(b * BAND_SIZE) - BAND_MARKER_OFFSET }}
                key={`b${b}`}
              >
                <span className="cpp-band-rule" aria-hidden="true" />
                <span className="cpp-band-pill" role="note" aria-label={bands[b].aria || bands[b].title}>
                  <img className="cpp-band-sigil" src={atlasUrl(BAND_SIGIL[b % BAND_SIGIL.length])} alt="" aria-hidden="true" />
                  <span className="cpp-band-name">{bands[b].title}</span>
                  <span className="cpp-band-sub">{bands[b].sub}</span>
                  {/* Numerals only, no words — so it needs no translation and
                      cannot drift between the EN and AR halves of a dict, the
                      most repeated string bug in this repo. */}
                  <span className="cpp-band-count">{bandCleared(b)}/{BAND_SIZE}</span>
                </span>
              </div>
            ) : null
          ))}
          {nodes.map((n) => (
            <CancelPlanet
              key={n.lv}
              lv={n.lv}
              x={n.x}
              y={n.y}
              unlocked={isUnlocked(n.lv)}
              done={isDone(n.lv)}
              current={n.lv === current.lv}
              label={isUnlocked(n.lv) ? sublabel(n.lv) : null}
              onPick={onPick}
              playSfx={playSfx}
              isAr={isAr}
              nodeRef={n.lv === current.lv ? currentRef : undefined}
              stars={stars ? stars(n.lv) : 0}
              section={sections ? sections[Math.floor((n.lv - 1) / BAND_SIZE)]?.id : undefined}
            />
          ))}
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
    </TrainingScreenShell>
  );
}
