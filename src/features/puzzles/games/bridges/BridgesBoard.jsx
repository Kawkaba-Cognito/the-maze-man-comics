import React from 'react';
import { islandSums } from './bridgesEngine';

/**
 * Bridges board — SVG drawn in lattice units (one unit per grid cell), so it
 * scales cleanly at any board size. Islands are tappable; bridges are drawn
 * between island centres (a double bridge = two parallel lines).
 */
export default function BridgesBoard({ state, selected, solved, onIslandTap }) {
  const { gridN, islands, edges, player } = state;
  const sums = islandSums(state);

  const PAD = 0.6;
  const span = gridN - 1 + PAD * 2;
  const X = (c) => PAD + c;
  const Y = (r) => PAD + r;
  const R = 0.36;
  const OFF = 0.12; // half-gap between the two lines of a double bridge

  return (
    <div className="ct-bridges-wrap">
      <svg
        className="ct-bridges-svg"
        viewBox={`0 0 ${span} ${span}`}
        role="group"
        aria-label="Bridges puzzle board"
      >
        {/* Bridges */}
        {edges.map((e, i) => {
          const n = player[i];
          if (!n) return null;
          const A = islands[e.a];
          const B = islands[e.b];
          const x1 = X(A.c);
          const y1 = Y(A.r);
          const x2 = X(B.c);
          const y2 = Y(B.r);
          const horiz = e.orient === 'h';
          const segs =
            n === 1
              ? [[x1, y1, x2, y2]]
              : horiz
                ? [[x1, y1 - OFF, x2, y2 - OFF], [x1, y1 + OFF, x2, y2 + OFF]]
                : [[x1 - OFF, y1, x2 - OFF, y2], [x1 + OFF, y1, x2 + OFF, y2]];
          return (
            <g key={`b${i}`}>
              {segs.map((s, k) => (
                <line key={k} x1={s[0]} y1={s[1]} x2={s[2]} y2={s[3]} className="ct-bridges-line" />
              ))}
            </g>
          );
        })}

        {/* Islands */}
        {islands.map((p, i) => {
          const cx = X(p.c);
          const cy = Y(p.r);
          const done = sums[i] === p.need;
          const over = sums[i] > p.need;
          const sel = selected === i;
          const cls = `ct-bridges-isle${done ? ' is-done' : ''}${over ? ' is-over' : ''}${sel ? ' is-sel' : ''}`;
          return (
            <g
              key={`i${i}`}
              onClick={() => onIslandTap(i)}
              style={{ cursor: solved ? 'default' : 'pointer' }}
            >
              {/* generous invisible hit target */}
              <circle cx={cx} cy={cy} r={0.5} fill="transparent" />
              <circle cx={cx} cy={cy} r={R} className={cls} />
              <text
                x={cx}
                y={cy}
                className="ct-bridges-num"
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={0.46}
                style={{ fontFamily: "'Fredoka One', cursive", fontWeight: 400 }}
              >
                {p.need}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
