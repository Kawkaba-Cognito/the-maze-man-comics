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
 * Renders particles, the combo chip, the RT-rating float, the solve burst and toasts.
 */
export function JuiceLayer({ combo, particle, rtFx, toast, burst, ratingLabels, showCombo = true }) {
  return (
    <>
      <Particles data={particle} />
      <SolveBurst id={burst} />
      {rtFx && rtFx.key !== 'good' && (
        <div key={rtFx.id} className={`ct-juice-rtfx ct-juice-rtfx--${rtFx.key}`}>
          {ratingLabels?.[rtFx.key]}
        </div>
      )}
      {showCombo && combo > 1 && (
        <div className="ct-juice-combo" key={combo}>
          ×{combo}
        </div>
      )}
      {toast && (
        <div key={toast.id} className="ct-juice-toast">
          {toast.text}
        </div>
      )}
    </>
  );
}
