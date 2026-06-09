import React from 'react';

/**
 * Reusable tutorial diagram primitives — small code-drawn boards that show a
 * rule and a problem→solution, so tutorials teach visually (no asset files).
 *
 *   <MiniBoard cells={[[{bg,content,fg,ring}, …], …]} />
 *   <Captioned kind="bad|good" label="…"><MiniBoard …/></Captioned>
 *   <DiagramRow> board <Arrow/> board </DiagramRow>
 */
export function MiniBoard({ cells, cell = 30 }) {
  const cols = cells[0]?.length || 1;
  return (
    <div className="ct-tut-board" style={{ gridTemplateColumns: `repeat(${cols}, ${cell}px)` }}>
      {cells.map((row, r) =>
        row.map((c, ci) => (
          <div
            key={`${r}-${ci}`}
            className={`ct-tut-cell${c.ring ? ` ct-tut-cell--${c.ring}` : ''}`}
            style={{ width: cell, height: cell, background: c.bg || '#fbf6ee', color: c.fg || '#1a1208', fontSize: Math.round(cell * 0.52) }}
          >
            {c.content ?? ''}
          </div>
        )),
      )}
    </div>
  );
}

export function DiagramRow({ children }) {
  return <div className="ct-tut-diagram-row">{children}</div>;
}

export function Arrow() {
  return <div className="ct-tut-arrow" aria-hidden="true">➜</div>;
}

export function Captioned({ kind, label, children }) {
  return (
    <div className="ct-tut-cap">
      <div className="ct-tut-cap-art">{children}</div>
      <div className={`ct-tut-tag ct-tut-tag--${kind}`}>{kind === 'good' ? '✓ ' : kind === 'bad' ? '✗ ' : ''}{label}</div>
    </div>
  );
}

/** Helper: build a cells matrix from a region-id grid + crown/× overlays. */
export function crownsCells(regionGrid, colors, { crowns = [], marks = [], rings = {} } = {}) {
  const has = (list, r, c) => list.some(([rr, cc]) => rr === r && cc === c);
  return regionGrid.map((row, r) =>
    row.map((g, c) => ({
      bg: colors[g % colors.length],
      content: has(crowns, r, c) ? '👑' : has(marks, r, c) ? '×' : '',
      fg: has(marks, r, c) ? 'rgba(26,18,8,0.5)' : '#1a1208',
      ring: rings[`${r},${c}`],
    })),
  );
}
