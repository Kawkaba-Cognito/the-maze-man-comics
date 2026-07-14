import React from 'react';

/**
 * Shared "Why this trains your brain" modal — one design for every game hub,
 * domain pick screen, and in-flow science link.
 */
export default function ScienceBrainPanel({
  open,
  onClose,
  title,
  intro,
  sections = [],
  foot,
  isAr,
  playSfx,
  closeLabel,
}) {
  if (!open) return null;

  const done = closeLabel || (isAr ? 'فهمت' : 'Got it');

  return (
    <div
      className="ct-ms-sci-ov ct-domain-sci-ov"
      role="dialog"
      aria-modal="true"
      aria-labelledby="science-brain-title"
      dir={isAr ? 'rtl' : 'ltr'}
      onClick={() => {
        playSfx?.('click');
        onClose();
      }}
    >
      <div className="ct-ms-sci ct-domain-sci-panel" onClick={(e) => e.stopPropagation()}>
        <h2 id="science-brain-title" className="ct-ms-sci-title ct-domain-sci-title">{title}</h2>
        {intro ? <p className="ct-ms-sci-intro ct-domain-sci-intro">{intro}</p> : null}
        {sections.length > 0 ? (
          <div className="ct-ms-sci-list">
            {sections.map((s) => (
              <div key={s.h} className="ct-ms-sci-item ct-domain-sci-item">
                <div className="ct-ms-sci-h ct-domain-sci-h">{s.h}</div>
                <div className="ct-ms-sci-b ct-domain-sci-b">{s.b}</div>
              </div>
            ))}
          </div>
        ) : null}
        {foot ? <p className="ct-ms-sci-foot ct-domain-sci-foot">{foot}</p> : null}
        <button
          type="button"
          className="ct-ms-sci-close ct-domain-sci-close"
          onClick={() => {
            playSfx?.('click');
            onClose();
          }}
        >
          {done}
        </button>
      </div>
    </div>
  );
}

/** Canonical chip trigger — always the same pill under the three mode cards. */
export function ScienceBrainChip({ label, onClick, className = '' }) {
  return (
    <button
      type="button"
      className={`ct-fq-sci-link ct-fq-sci-link--chip${className ? ` ${className}` : ''}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
