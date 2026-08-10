import React, { useRef, useCallback } from 'react';
import { isAdjacent } from './wordleData';

export default function LetterLinkBoard({
  grid,
  size,
  path,
  setPath,
  disabled,
  currentWord,
  onCommit,
  isAr = false,
}) {
  const draggingRef = useRef(false);
  const suppressClickRef = useRef(false);

  const cellFromPoint = useCallback((clientX, clientY) => {
    const el = document.elementFromPoint(clientX, clientY);
    const cell = el?.closest?.('[data-link-idx]');
    if (!cell) return null;
    const idx = Number(cell.getAttribute('data-link-idx'));
    return Number.isFinite(idx) ? idx : null;
  }, []);

  const extendPath = useCallback(
    (idx) => {
      setPath((prev) => {
        if (prev.length === 0) return [idx];
        if (prev.includes(idx)) {
          if (prev.length >= 2 && prev[prev.length - 2] === idx) {
            return prev.slice(0, -1);
          }
          return prev;
        }
        const last = prev[prev.length - 1];
        if (!isAdjacent(last, idx, size)) return prev;
        return [...prev, idx];
      });
    },
    [setPath, size],
  );

  const onPointerDown = (e) => {
    if (disabled) return;
    const idx = cellFromPoint(e.clientX, e.clientY);
    if (idx == null) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    draggingRef.current = true;
    setPath([idx]);
  };

  const onPointerMove = (e) => {
    if (!draggingRef.current || disabled) return;
    const idx = cellFromPoint(e.clientX, e.clientY);
    if (idx != null) extendPath(idx);
  };

  const endDrag = () => {
    if (draggingRef.current) {
      suppressClickRef.current = true;
      onCommit?.();
      // Pointer-up on a native button is followed by click. Ignore only that
      // synthetic click; keyboard activation still follows the click path.
      setTimeout(() => { suppressClickRef.current = false; }, 0);
    }
    draggingRef.current = false;
  };

  const onCellClick = (idx) => {
    if (disabled || suppressClickRef.current) return;
    if (path.length === 0) {
      setPath([idx]);
      return;
    }
    if (path[path.length - 1] === idx) {
      onCommit?.();
      return;
    }
    extendPath(idx);
  };

  return (
    <div className="ct-wordle-link-board">
      <p className="ct-wordle-link-draft" aria-live="polite">
        {currentWord ? currentWord.toUpperCase() : '—'}
      </p>
      <div
        className="ct-wordle-link-grid"
        style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
        role="group"
        aria-label={isAr ? 'شبكة الحروف — اسحب أو اختر الحروف واحداً تلو الآخر' : 'Letter grid — drag or select letters one at a time'}
      >
        {grid.map((ch, i) => {
          const pos = path.indexOf(i);
          const active = pos >= 0;
          return (
            <button
              key={i}
              type="button"
              data-link-idx={i}
              className={`ct-wordle-link-cell${active ? ' ct-wordle-link-cell--active' : ''}${pos === 0 ? ' ct-wordle-link-cell--start' : ''}${pos === path.length - 1 && path.length > 0 ? ' ct-wordle-link-cell--end' : ''}`}
              disabled={disabled}
              aria-pressed={active}
              aria-label={isAr
                ? `الحرف ${ch.toUpperCase()}، الصف ${Math.floor(i / size) + 1}، العمود ${(i % size) + 1}${active ? `، الترتيب ${pos + 1}` : ''}`
                : `Letter ${ch.toUpperCase()}, row ${Math.floor(i / size) + 1}, column ${(i % size) + 1}${active ? `, selected ${pos + 1}` : ''}`}
              onClick={() => onCellClick(i)}
            >
              {active && <span className="ct-wordle-link-order">{pos + 1}</span>}
              <span className="ct-wordle-link-letter">{ch.toUpperCase()}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
