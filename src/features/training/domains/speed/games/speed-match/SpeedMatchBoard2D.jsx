import React, { useEffect, useRef, useState } from 'react';
import GamePiece from '../../../../shared/GamePiece';
import './speedMatchBoard2d.css';

/*
 * SpeedMatchBoard2D — the symbol–digit coding board.
 *
 * Replaces SpeedMatch3DProto.jsx. That scene drew every digit by rendering text
 * into a 150px canvas, uploading it as a texture and mapping it onto a box —
 * so the numerals were resampled twice before reaching the screen, on a task
 * whose entire measure is how fast you can read them. These are real text
 * nodes, and the answer keys are real buttons.
 *
 * CONTROLLED view. index.jsx owns the legend, trials, clock and scoring:
 *   - legend      [{ symbol?, digit }] the key, shown throughout
 *   - item        the probe: { symbol } or { digit }
 *   - interactive whether answers are accepted
 *   - onAnswer(digit)
 *   - pressedKey  a digit to flash (keyboard answers route through here)
 */

export default function SpeedMatchBoard2D({ legend, item, interactive, onAnswer, pressedKey }) {
  const entries = Array.isArray(legend) ? legend : [];
  const digits = entries.map((e) => e.digit).sort((a, b) => a - b);

  // Bumped once per probe; drives the remount that replays the enter animation.
  const trialRef = useRef(0);
  const lastItemRef = useRef(undefined);
  if (item !== lastItemRef.current) {
    lastItemRef.current = item;
    trialRef.current += 1;
  }

  // Which key just fired, so pointer and keyboard answers get the same feedback.
  const [flash, setFlash] = useState(null);
  const timer = useRef(0);
  useEffect(() => {
    if (pressedKey == null) return undefined;
    setFlash(pressedKey);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setFlash(null), 260);
    return undefined;
  }, [pressedKey]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const answer = (digit) => {
    if (!interactive) return;
    setFlash(digit);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setFlash(null), 260);
    onAnswer?.(digit);
  };

  return (
    <div className="sm2d-wrap">
      {/* The key. Stays on screen the whole time — this is a coding task, not a
          memory one, so hiding it would measure something else entirely. */}
      <div className="sm2d-legend">
        {entries.map((entry, i) => (
          <div className="sm2d-pair" key={`${entry.digit}-${i}`}>
            {entry.symbol && (
              <GamePiece shape={entry.symbol} state="idle" size={40} reduced />
            )}
            <span className="sm2d-pair-digit">{entry.digit}</span>
          </div>
        ))}
      </div>

      {/* Keyed on a per-trial counter, so the enter animation replays even when
          two consecutive probes are identical — without it a repeat looks
          frozen and the player cannot tell a new trial started. A key derived
          from the probe's own value would not change on a repeat; one derived
          from Math.random() would remount on every render, which is worse. */}
      <div className="sm2d-probe" key={trialRef.current}>
        {item?.symbol
          ? <GamePiece shape={item.symbol} state="cued" size={132} />
          : item?.digit != null
            ? <span className="sm2d-probe-digit">{item.digit}</span>
            : null}
      </div>

      <div className="sm2d-keys">
        {digits.map((digit) => (
          <button
            key={digit}
            type="button"
            className={`sm2d-key${flash === digit ? ' sm2d-key--flash' : ''}`}
            onPointerUp={() => answer(digit)}
            disabled={!interactive}
            aria-label={String(digit)}
          >
            {digit}
          </button>
        ))}
      </div>
    </div>
  );
}
