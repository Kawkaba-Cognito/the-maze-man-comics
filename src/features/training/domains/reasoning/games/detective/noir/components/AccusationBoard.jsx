import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { L, boardOptions } from '../schema';

const AXES = ['who', 'how', 'why', 'proof'];

/*
 * The corkboard. Four questions, one answer each, and a length of red string
 * from the victim card to every panel the player has committed to — the visual
 * that turns four dropdowns into an accusation.
 */
export default function AccusationBoard({
  caseData, isAr, t, found, acc, onPick, onAccuse,
}) {
  const boardRef = useRef(null);
  const victimRef = useRef(null);
  const panelRefs = useRef({});
  const [strings, setStrings] = useState([]);

  const options = boardOptions(caseData, found);
  const complete = AXES.every((k) => acc[k]);

  const measure = useCallback(() => {
    const board = boardRef.current;
    const victim = victimRef.current;
    if (!board || !victim) return;
    const b = board.getBoundingClientRect();
    const v = victim.getBoundingClientRect();
    const x1 = v.left - b.left + v.width / 2;
    const y1 = v.top - b.top + v.height;

    setStrings(AXES.filter((k) => acc[k]).map((k) => {
      const el = panelRefs.current[k];
      if (!el) return null;
      const p = el.getBoundingClientRect();
      return {
        k,
        x1,
        y1,
        x2: p.left - b.left + p.width / 2,
        y2: p.top - b.top + 3,
      };
    }).filter(Boolean));
  }, [acc]);

  useLayoutEffect(measure, [measure]);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(board);
    window.addEventListener('resize', measure);
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
  }, [measure]);

  const heading = {
    who: t.qWho, how: t.qHow, why: t.qWhy, proof: t.qProof,
  };

  return (
    <div className="nr-board" ref={boardRef}>
      <svg className="nr-strings" aria-hidden="true">
        {strings.map((s) => (
          <line
            key={s.k}
            x1={s.x1}
            y1={s.y1}
            x2={s.x2}
            y2={s.y2}
            stroke="#c34a44"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        ))}
      </svg>

      <div className="nr-victim" ref={victimRef}>
        <b>{L(caseData.victim.line, isAr)}</b>
        <span>{L(caseData.victim.sub, isAr)}</span>
      </div>

      <div className="nr-grid">
        {AXES.map((axis) => (
          <div
            className="nr-panel"
            key={axis}
            ref={(el) => { panelRefs.current[axis] = el; }}
          >
            <h3>{heading[axis]}</h3>
            <div className="nr-opts">
              {options[axis].map((o) => (
                <button
                  type="button"
                  key={o.v}
                  className={`nr-opt${acc[axis] === o.v ? ' sel' : ''}`}
                  onClick={() => onPick(axis, o.v)}
                >
                  {o.c && <i style={{ background: o.c }} aria-hidden="true" />}
                  {o.e && <span className="nr-opt-e" aria-hidden="true">{o.e}</span>}
                  <span>{L(o.l, isAr)}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="nr-bar">
        <button
          type="button"
          className="nr-btn nr-btn--red nr-btn--big"
          disabled={!complete}
          onClick={onAccuse}
        >
          {t.accuse}
        </button>
      </div>
    </div>
  );
}
