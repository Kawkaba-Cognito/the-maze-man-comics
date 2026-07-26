import React from 'react';
import { L } from '../schema';

/*
 * Retrieval, part two: cued detail probes.
 *
 * Asked AFTER the ordering pass and scored separately, because they test a
 * different thing. Order is temporal; these are the bindings inside a beat —
 * who was present, where it happened, what followed. A player can ace one and
 * fail the other, and the reveal screen says which.
 *
 * One question at a time, no going back: revisiting answers turns recall into
 * deliberation and blurs what the score means.
 */
export default function ProbeQuiz({
  story, isAr, t, index, answers, onAnswer, playSfx,
}) {
  const probe = story.probes[index];
  if (!probe) return null;
  const answered = answers[probe.id] != null;

  return (
    <div className="sgs-probe">
      <div className="sgs-probe-count">{t.probeOf(index + 1, story.probes.length)}</div>
      <h2>{L(probe.q, isAr)}</h2>
      <div className="sgs-probe-opts">
        {probe.options.map((o) => {
          const picked = answers[probe.id] === o.v;
          return (
            <button
              type="button"
              key={o.v}
              className={`sgs-opt${picked ? ' picked' : ''}`}
              disabled={answered}
              onClick={() => { playSfx?.('click'); onAnswer(probe.id, o.v); }}
            >
              {L(o.l, isAr)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
