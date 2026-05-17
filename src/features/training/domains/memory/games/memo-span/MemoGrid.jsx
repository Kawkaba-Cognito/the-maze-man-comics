import React from 'react';

export default function MemoGrid({
  grid,
  activeCell = -1,
  tappedCells = [],
  wrongCell = -1,
  disabled,
  onCell,
}) {
  const n = grid * grid;
  return (
    <div
      className="ct-ms-grid"
      style={{
        gridTemplateColumns: `repeat(${grid}, 1fr)`,
        gridTemplateRows: `repeat(${grid}, 1fr)`,
      }}
      role="grid"
    >
      {Array.from({ length: n }, (_, i) => {
        const lit = activeCell === i;
        const done = tappedCells.includes(i);
        const wrong = wrongCell === i;
        return (
          <button
            key={i}
            type="button"
            role="gridcell"
            disabled={disabled}
            className={`ct-ms-cell${lit ? ' ct-ms-cell--lit' : ''}${done ? ' ct-ms-cell--done' : ''}${wrong ? ' ct-ms-cell--wrong' : ''}`}
            onClick={() => onCell?.(i)}
            aria-label={`cell ${i + 1}`}
          />
        );
      })}
    </div>
  );
}
