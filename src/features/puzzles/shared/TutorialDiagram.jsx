import React from 'react';

/**
 * Problem → Answer row with clear labels (KenKen-style tutorial diagrams).
 */
export function ProblemAnswer({ problem, answer, isAr, problemLabel, answerLabel }) {
  const prob = problemLabel ?? (isAr ? 'المسألة' : 'Problem');
  const ans = answerLabel ?? (isAr ? 'الحل' : 'Answer');
  return (
    <div className="mm-tut-prob-ans">
      <div className="mm-tut-prob-ans-col">
        <div className="mm-tut-prob-ans-label">{prob}</div>
        <div className="mm-tut-prob-ans-art">{problem}</div>
      </div>
      <div className="mm-tut-prob-ans-arrow" aria-hidden="true">→</div>
      <div className="mm-tut-prob-ans-col">
        <div className="mm-tut-prob-ans-label mm-tut-prob-ans-label--answer">{ans}</div>
        <div className="mm-tut-prob-ans-art">{answer}</div>
      </div>
    </div>
  );
}

export function MiniBoard({ cells, cell = 30 }) {
  const cols = cells[0]?.length || 1;
  return (
    <div className="ct-tut-board" style={{ gridTemplateColumns: `repeat(${cols}, ${cell}px)` }}>
      {cells.map((row, r) =>
        row.map((c, ci) => (
          <div
            key={`${r}-${ci}`}
            className={`ct-tut-cell${c.ring ? ` ct-tut-cell--${c.ring}` : ''}${c.answer ? ' ct-tut-cell--answer' : ''}`}
            style={{
              width: cell,
              height: cell,
              background: c.bg || '#fbf6ee',
              color: c.fg || '#1a1208',
              fontSize: Math.round(cell * 0.52),
              fontWeight: c.answer ? 800 : 600,
            }}
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
      <div className={`ct-tut-tag${kind ? ` ct-tut-tag--${kind}` : ''}`}>
        {kind === 'good' ? '✓ ' : kind === 'bad' ? '✗ ' : ''}{label}
      </div>
    </div>
  );
}

export function crownsCells(regionGrid, colors, { crowns = [], marks = [], rings = {} } = {}) {
  const has = (list, r, c) => list.some(([rr, cc]) => rr === r && cc === c);
  return regionGrid.map((row, r) =>
    row.map((reg, c) => {
      const bg = colors[reg % colors.length];
      if (has(crowns, r, c)) return { content: '👑', bg, ring: rings[`${r},${c}`] };
      if (has(marks, r, c)) return { content: '×', bg, fg: 'rgba(26,18,8,0.5)' };
      return { content: '', bg, ring: rings[`${r},${c}`] };
    }),
  );
}
