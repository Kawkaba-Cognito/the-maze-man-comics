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

/*
 * ── WHAT IS ACTUALLY STANDING IN EACH WORLD ─────────────────────────────────
 *
 * Owner, 2026-09-17: "add some designs, like in the red put some volcanoes and
 * some black parts that look like lava ground and so on, and the same with
 * others, e.g. put lakes in the ice."
 *
 * The first pass gave each band a coloured GROUND, which answered "different
 * colours" and not "different places" — a red gradient is a filter, a volcano
 * is a landscape. These are the landmarks: each world gets a few real props
 * standing on its ground.
 *
 * ⚠ SVG AT A FIXED PIXEL SIZE, NOT A STRETCHED BACKGROUND. A band is ~1,240px
 * tall and as wide as the viewport, so one image stretched to fill it would
 * squash every cone and oval by whatever the aspect happened to be. Each prop
 * is its own small SVG, placed by percentage and sized in px, so a volcano is
 * the same volcano on a 390px phone and a 1,366px desktop.
 *
 * ⚠ EVERY FILL IS A TOKEN. `--cpp-sec` / `--cpp-sec-lit` are the world's own
 * pair (set from `--fx-sec-*`), and the black of cooled lava is `--game-ink`,
 * this game's fixed dark. `--cpp-` is not `--fx-`, so audit:design's
 * raw-colour rule applies to anything written here.
 *
 * ⚠ THEY SIT LOW AND OUT AT THE EDGES, DELIBERATELY. The trail runs down the
 * middle (AMPLITUDE=30, so nodes swing between 20% and 80%) and the chapter
 * card sits at the top of every band. Landmarks are placed outside that lane
 * so they never compete with the thing the player is actually reading.
 */
const PROP = {
  // A cone of cooled basalt with a lit crater and one lava run down its flank.
  volcano: (
    <svg viewBox="0 0 120 84" width="100%" height="100%" aria-hidden="true">
      <path d="M4 84 L46 10 Q60 -4 74 10 L116 84 Z" fill="var(--game-ink)" opacity="0.72" />
      <path d="M46 12 Q60 2 74 12 L82 26 Q60 18 38 26 Z" fill="var(--cpp-sec-lit)" opacity="0.92" />
      <path d="M58 20 L52 52 L62 70 L58 84 L70 84 L66 56 L72 30 Z" fill="var(--cpp-sec-lit)" opacity="0.6" />
    </svg>
  ),
  // Cooled lava ground — an irregular black slab with a glowing seam in it.
  basalt: (
    <svg viewBox="0 0 160 46" width="100%" height="100%" aria-hidden="true">
      <path d="M6 40 Q24 22 52 28 Q78 12 104 26 Q134 20 154 40 Q120 46 78 44 Q34 46 6 40 Z"
        fill="var(--game-ink)" opacity="0.66" />
      <path d="M26 36 Q56 28 88 34 Q118 38 140 34" stroke="var(--cpp-sec-lit)" strokeWidth="2"
        fill="none" opacity="0.75" />
    </svg>
  ),
  // A dune: one long ridge, lit along its crest.
  dune: (
    <svg viewBox="0 0 220 52" width="100%" height="100%" aria-hidden="true">
      <path d="M0 52 Q48 12 108 22 Q168 32 220 8 L220 52 Z" fill="var(--cpp-sec)" opacity="0.5" />
      <path d="M0 52 Q48 14 108 24 Q168 34 220 10" stroke="var(--cpp-sec-lit)" strokeWidth="2"
        fill="none" opacity="0.6" />
    </svg>
  ),
  // A frozen lake: flat pale ice with a crack across it and a bright rim.
  lake: (
    <svg viewBox="0 0 180 76" width="100%" height="100%" aria-hidden="true">
      <ellipse cx="90" cy="38" rx="86" ry="33" fill="var(--cpp-sec-lit)" opacity="0.4" />
      <ellipse cx="90" cy="38" rx="86" ry="33" fill="none" stroke="var(--cpp-sec-lit)"
        strokeWidth="2" opacity="0.8" />
      <path d="M28 30 L62 42 L96 28 L134 44" stroke="var(--cpp-sec-lit)" strokeWidth="1.5"
        fill="none" opacity="0.7" />
    </svg>
  ),
  // A shard of ice pushed up out of the field.
  shard: (
    <svg viewBox="0 0 64 96" width="100%" height="100%" aria-hidden="true">
      <path d="M32 0 L56 52 L40 96 L20 96 L6 50 Z" fill="var(--cpp-sec-lit)" opacity="0.42" />
      <path d="M32 0 L40 96 L20 96 Z" fill="var(--cpp-sec-lit)" opacity="0.62" />
    </svg>
  ),
  // A storm cloud with the bolt still under it.
  storm: (
    <svg viewBox="0 0 150 90" width="100%" height="100%" aria-hidden="true">
      <path d="M26 46 Q16 26 38 22 Q46 4 70 12 Q92 2 102 22 Q128 22 124 46 Z"
        fill="var(--game-ink)" opacity="0.5" />
      <path d="M72 48 L58 72 L72 72 L62 90 L88 64 L74 64 L84 48 Z"
        fill="var(--cpp-sec-lit)" opacity="0.9" />
    </svg>
  ),
  // A tree: canopy over a short trunk.
  tree: (
    <svg viewBox="0 0 90 120" width="100%" height="100%" aria-hidden="true">
      <rect x="41" y="70" width="8" height="50" fill="var(--game-ink)" opacity="0.6" />
      <ellipse cx="45" cy="46" rx="42" ry="38" fill="var(--cpp-sec)" opacity="0.72" />
      <ellipse cx="34" cy="36" rx="22" ry="19" fill="var(--cpp-sec-lit)" opacity="0.45" />
    </svg>
  ),
  // A far-off ringed world.
  farworld: (
    <svg viewBox="0 0 140 90" width="100%" height="100%" aria-hidden="true">
      <circle cx="70" cy="45" r="27" fill="var(--cpp-sec-lit)" opacity="0.34" />
      <circle cx="62" cy="38" r="20" fill="var(--cpp-sec-lit)" opacity="0.22" />
      <ellipse cx="70" cy="45" rx="64" ry="13" fill="none" stroke="var(--cpp-sec-lit)"
        strokeWidth="2" opacity="0.5" transform="rotate(-16 70 45)" />
    </svg>
  ),
};

/* Where each world's landmarks stand. `t` is a percentage down the BAND, so a
   band of any height lays them out proportionally; `w` is px, so nothing
   distorts. Kept off the centre lane (see above). */
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
  stars, sections, help,
}) {
  const [helpOpen, setHelpOpen] = useState(false);
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

  /*
   * ── THE GROUND EACH BAND IS WALKED ON (2026-09-17) ───────────────────────
   *
   * Owner: "lets say the lava set that have 10 levels, the planets can be
   * totally red and the pallete look like volcano and so on, and the other set
   * is ice and so on."
   *
   * The six worlds already had names, sigils and hue pairs, and this screen
   * already knew which band was which — but it painted all sixty levels on one
   * beige page, so Ember Reach and The Long Void were the same place with
   * different captions. One terrain per band fixes that: scrolling the trail
   * now walks you out of the volcano and into the ice.
   *
   * ⚠ IT SPANS BAND-TO-BAND, NOT NODE-TO-NODE. A band's ground has to start
   * ABOVE its chapter card — the card announces the world, so it has to be
   * standing in it. `BAND_MARKER_OFFSET` is where the card sits, and the extra
   * 40px is the crossfade's landing room.
   *
   * ⚠ THE FIRST BAND STARTS AT 0 AND THE LAST ENDS AT `pathHeight`, so there
   * is no seam of bare page at either end of a 6,610px scroll.
   */
  const terrainOf = (b) => {
    const top = b === 0 ? 0 : yOf(b * BAND_SIZE) - BAND_MARKER_OFFSET - 40;
    const next = b + 1 < bandStarts.length
      ? yOf((b + 1) * BAND_SIZE) - BAND_MARKER_OFFSET - 40
      : pathHeight;
    return { top, height: Math.max(0, next - top) };
  };

  return (
    <TrainingScreenShell
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      shellClassName="cx-page cpp-page"
      /*
       * ⚠ THE RIGHT-HAND SLOT ALREADY DRAWS A LITERAL "?" (TrainingChrome), so
       * the help button is the shared chrome rather than a fourth button
       * invented here. Owner, 2026-09-17: "put a question mark up on the right
       * that if i press it it explains everything on the level mode."
       */
      onReplayTutorial={help ? () => setHelpOpen(true) : undefined}
      replayHint={help?.open}
    >
      <div className="ct-lv-grid-wrap">
        {/*
          ⚠ NO TITLE, NO BLURB (owner, 2026-09-17: "remove the upper beige part
          that has cancellation on it, and we start from the red immediately").
          They were a `ct-lv-hero-title` + `ct-lv-hero-sub` pair sitting on bare
          page above the first world, which is precisely the strip of beige the
          six grounds were added to get rid of — the map now opens standing IN
          Ember Reach. What they said lives in the help sheet the "?" opens, so
          nothing is lost, it just stops costing the top of every screen.
          `title` / `blurb` are still accepted so the prop contract with
          `TrainingLevelGrid` (see this file's header) does not fork.
        */}
        <div className="cpp-path" style={{ height: pathHeight }}>
          {sections && bandStarts.map((b) => (
            sections[b] ? (
              <div
                key={`t${b}`}
                className="cpp-terrain"
                data-section={sections[b].id}
                style={terrainOf(b)}
                aria-hidden="true"
              >
                <TerrainArt section={sections[b].id} />
              </div>
            ) : null
          ))}
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

      {/* ── What Level mode actually is, on demand ──────────────────────────
          Everything the removed header used to say, plus what it never did:
          the worlds, that each one teaches a rule, what the stars mean and how
          unlocking works. Content comes from the caller so both languages sit
          on the same object in the game's own dict and cannot drift apart. */}
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
              className="ct-fq-btn"
              onClick={() => { playSfx?.('click'); setHelpOpen(false); }}
            >
              {help.close}
            </button>
          </div>
        </div>
      ) : null}
    </TrainingScreenShell>
  );
}
