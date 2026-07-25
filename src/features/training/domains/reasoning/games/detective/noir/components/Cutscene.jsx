import React, { useCallback, useEffect, useRef, useState } from 'react';
import { L } from '../schema';
import { CAST } from '../../../../../../shared/castRoster';

/*
 * The dialogue box. Types a line out, waits for a tap, moves on, and calls
 * onDone when the script runs out. Tapping mid-type completes the line
 * instantly — the reference game's most-used affordance by far.
 *
 * A line's speaker `w` is 'n' for narration, 'kawkab' for the detective, or a
 * suspect id; the suspect's own accent colour tints the nameplate.
 */
export default function Cutscene({ lines, isAr, speakers, playSfx, onDone }) {
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState('');
  const [complete, setComplete] = useState(false);
  const timerRef = useRef(0);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  const line = lines?.[index];
  const full = line ? L(line.t, isAr) : '';

  useEffect(() => {
    if (!line) return undefined;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setShown(full);
      setComplete(true);
      return undefined;
    }
    setShown('');
    setComplete(false);
    let i = 0;
    timerRef.current = window.setInterval(() => {
      i += 1;
      setShown(full.slice(0, i));
      if (i >= full.length) {
        window.clearInterval(timerRef.current);
        setComplete(true);
      }
    }, 16);
    return () => window.clearInterval(timerRef.current);
  }, [full, line]);

  const advance = useCallback(() => {
    if (!complete) {
      window.clearInterval(timerRef.current);
      setShown(full);
      setComplete(true);
      return;
    }
    playSfx?.('click');
    if (index + 1 >= lines.length) doneRef.current?.();
    else setIndex((n) => n + 1);
  }, [complete, full, index, lines, playSfx]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== ' ' && e.key !== 'Enter') return;
      e.preventDefault();
      advance();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [advance]);

  if (!line) return null;

  const isNarration = line.w === 'n';
  const speaker = line.w === 'kawkab'
    ? { name: CAST.kawkab.name, accent: CAST.kawkab.accent }
    : speakers?.[line.w];
  const accent = speaker?.accent || '#d9a441';

  return (
    <div
      className="nr-dialog"
      role="button"
      tabIndex={0}
      onClick={advance}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); advance(); } }}
    >
      {!isNarration && speaker && (
        <span className="nr-speaker" style={{ color: accent, borderColor: accent }}>
          {L(speaker.name, isAr)}
        </span>
      )}
      <div className={`nr-dtext${isNarration ? ' nar' : ''}`}>{shown}</div>
      {complete && <span className="nr-cont" aria-hidden="true">▾</span>}
    </div>
  );
}
