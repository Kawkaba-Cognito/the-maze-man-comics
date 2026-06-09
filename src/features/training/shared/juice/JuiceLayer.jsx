import React from 'react';

/** Particle burst — green on a hit, red on a miss. */
export function Particles({ data }) {
  if (!data) return null;
  const n = 8;
  return (
    <div key={data.id} className={`ct-juice-particles ct-juice-particles--${data.type}`}>
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className="ct-juice-particle" style={{ ['--a']: `${(360 / n) * i}deg` }} />
      ))}
    </div>
  );
}

/** Shrinking deadline ring for reaction games — place behind the stimulus. */
export function DeadlineRing({ ms, k }) {
  const R = 80;
  const C = 2 * Math.PI * R;
  return (
    <svg key={k} className="ct-juice-ring" width="184" height="184" viewBox="0 0 184 184" aria-hidden="true">
      <circle className="ct-juice-ring-track" cx="92" cy="92" r={R} />
      <circle
        className="ct-juice-ring-fill"
        cx="92"
        cy="92"
        r={R}
        style={{
          strokeDasharray: C,
          strokeDashoffset: 0,
          ['--ring-c']: C,
          animation: `ctJuiceRing ${ms}ms linear forwards`,
        }}
      />
    </svg>
  );
}

/** One-shot confetti celebration for puzzle / word solves. */
export function SolveBurst({ id }) {
  if (id == null) return null;
  const n = 16;
  return (
    <div key={id} className="ct-juice-burst" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <span
          key={i}
          className={`ct-juice-confetti ct-juice-confetti--${i % 4}`}
          style={{ ['--a']: `${(360 / n) * i}deg`, ['--d']: `${(i % 4) * 45}ms` }}
        />
      ))}
    </div>
  );
}

/**
 * JuiceLayer — drop inside a game's play stage (a position:relative container).
 * Deliberately CALM: the per-action particle bursts, combo chip and RT-rating
 * floats were too distracting, so only an informational toast and a single
 * end-of-solve celebration remain. (Extra props are accepted but ignored so
 * existing call sites keep working.)
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
