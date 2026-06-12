import React from 'react';

/**
 * One-shot solve acknowledgement — a single quiet expanding ring.
 * Deliberately clinical: confirms completion without confetti or
 * attention-capturing motion (flashy effects are a distractor confound
 * in attention/speed training).
 */
export function SolveBurst({ id }) {
  if (id == null) return null;
  return <div key={id} className="ct-juice-solvepulse" aria-hidden="true" />;
}

/**
 * JuiceLayer — drop inside a game's play stage (a position:relative container).
 * Calm professional feedback only: an informational toast and a single
 * end-of-solve pulse. (Extra props are accepted but ignored so existing call
 * sites keep working.)
 */
export function JuiceLayer({ toast, burst }) {
  return (
    <>
      <SolveBurst id={burst} />
      {toast && (
        <div key={toast.id} className="ct-juice-toast">
          {toast.text}
        </div>
      )}
    </>
  );
}
