import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { GAME_COLORS, GAME_INK, GAME_STIMULUS, shadeOf } from '../../../../shared/gamePalette';
import './trailBoard2d.css';

/*
 * TrailBoard2D — the Trail Making board.
 *
 * Replaces TrailMaking3DProto.jsx. The nodes never moved in depth and the whole
 * task is "read a number, find the next one, tap it" — a scanning-speed measure
 * where label legibility IS the task. A canvas-textured label on a sphere is
 * strictly worse at that than real text, so this draws SVG: crisp numerals at
 * any DPR, and each node is a real <button> for keyboard and screen readers.
 *
 * CONTROLLED view. index.jsx owns the ordering, clock, scoring and lives:
 *   - items       [{ id, n, color: 0|1, isDecoy, fx, fy }] fx/fy are 0..1
 *   - variant     'color' alternates the expected colour each step
 *   - startColor  which colour step 1 expects
 *   - progress    how many nodes are already connected
 *   - onPick(id)
 *
 * Colour is the TASK in the 'color' variant (you must alternate), so nodes use
 * the full-strength stimulus set, not the palette's semantic roles — same
 * reason Cancellation does. These are the same two Okabe hues the 3D used.
 */

const NODE_COLORS = [GAME_STIMULUS[0], GAME_STIMULUS[1]]; // blue, orange
const VIEW = 100;

export default function TrailBoard2D({ items, variant, startColor, progress, interactive, onPick }) {
  // Tap feedback lives here, as it did in the 3D — the parent only tells us how
  // far the trail has got, not whether the last tap was right.
  const [flash, setFlash] = useState(null); // { id, ok }
  const flashTimer = useRef(0);
  useEffect(() => () => clearTimeout(flashTimer.current), []);

  // The board's side, measured off the container (see trailBoard2d.css).
  const wrapRef = useRef(null);
  const [side, setSide] = useState(320);
  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;
    const fit = () => {
      const cs = getComputedStyle(wrap);
      const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
      const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      const w = (wrap.clientWidth || 1) - padX;
      const h = (wrap.clientHeight || 1) - padY;
      setSide(Math.max(120, Math.floor(Math.min(w, h, 640))));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  const list = useMemo(() => (Array.isArray(items) ? items : []), [items]);

  /** The nodes already connected, in trail order — drives the polyline. */
  const trail = useMemo(() => {
    const pts = [];
    for (let n = 1; n <= progress; n += 1) {
      const expected = variant === 'color' ? (startColor + n - 1) % 2 : 0;
      const hit = list.find((it) => !it.isDecoy && it.n === n && it.color === expected);
      if (hit) pts.push(`${hit.fx * VIEW},${hit.fy * VIEW}`);
    }
    return pts;
  }, [list, progress, variant, startColor]);

  const handlePick = (item) => {
    if (!interactive) return;
    const next = progress + 1;
    const expected = (startColor + next - 1) % 2;
    const ok = !item.isDecoy && item.n === next
      && (variant !== 'color' || item.color === expected);
    setFlash({ id: item.id, ok });
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 420);
    onPick?.(item.id);
  };

  return (
    <div className="tb2d-wrap" ref={wrapRef}>
      <svg
        className="tb2d-svg"
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        preserveAspectRatio="xMidYMid meet"
        width={side}
        height={side}
      >
        {/* The trail so far. Drawn first so nodes sit on top of it. */}
        {trail.length > 1 && (
          <polyline
            points={trail.join(' ')}
            fill="none"
            stroke={GAME_COLORS.accent.fill}
            strokeWidth="1.1"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.9"
          />
        )}
        {list.map((item) => {
          const done = !item.isDecoy && item.n <= progress;
          const isFlashing = flash && flash.id === item.id;
          let fill;
          if (isFlashing) fill = flash.ok ? GAME_COLORS.ok.fill : GAME_COLORS.bad.fill;
          else if (done) fill = GAME_COLORS.muted.fill;
          else if (item.isDecoy) fill = GAME_COLORS.muted.fill;
          else fill = NODE_COLORS[item.color] ?? NODE_COLORS[0];
          const r = done ? 5.4 : 6.6;
          const cx = item.fx * VIEW;
          const cy = item.fy * VIEW;

          return (
            <g
              key={item.id}
              className={`tb2d-node${done ? ' tb2d-node--done' : ''}${isFlashing ? ' tb2d-node--flash' : ''}`}
              onPointerDown={() => handlePick(item)}
              role="button"
              tabIndex={interactive ? 0 : -1}
              aria-label={item.isDecoy ? 'decoy' : `${item.n}`}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handlePick(item); } }}
            >
              {/* Invisible generous hit area — these are small targets and the
                  measure is speed, so a near-miss must not cost a tap. */}
              <circle cx={cx} cy={cy} r={Math.max(r * 1.9, 9)} fill="transparent" />
              <circle cx={cx} cy={cy + 0.5} r={r} fill={shadeOf(fill)} />
              <circle cx={cx} cy={cy} r={r} fill={fill} stroke={GAME_INK} strokeWidth="0.55" />
              {item.isDecoy ? (
                // Decoys carry no number — a ring instead, so they are obviously
                // not part of the sequence rather than an unreadable one.
                <circle cx={cx} cy={cy} r={r * 0.46} fill="none" stroke={GAME_INK} strokeWidth="0.7" opacity="0.75" />
              ) : (
                // No outline stroke on the numeral. The glyph is only ~8 units
                // tall in this viewBox, so even a 0.9-unit stroke eats most of
                // the counter and the digit reads as a dark blob — on a task
                // scored purely on how fast you can read it. The node fill
                // already carries the contrast.
                <text
                  x={cx} y={cy} fill={done ? GAME_COLORS.selected.fill : '#fff'}
                  fontSize={r * 1.25} fontWeight="800"
                  textAnchor="middle" dominantBaseline="central"
                  fontFamily="Outfit, system-ui, sans-serif"
                >
                  {item.n}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
