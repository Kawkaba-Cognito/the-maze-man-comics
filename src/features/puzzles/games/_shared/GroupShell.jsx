import React from 'react';
import './group-challenge.css';

/**
 * Fullscreen chrome for Group Challenge party games.
 */
export default function GroupShell({
  isAr,
  title,
  onBack,
  accent = '#d46a6a',
  chip,
  children,
  center = false,
  menuLabel,
}) {
  return (
    <div className="gc-root" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="gc-app" style={{ '--gc-accent': accent }}>
        <header className="gc-head">
          <button
            type="button"
            className="gc-back"
            onClick={onBack}
            aria-label={menuLabel || (isAr ? 'القائمة' : 'Menu')}
          >
            ‹
          </button>
          <div className="gc-title">{title}</div>
          <div className="gc-head-slot">
            {chip ? <div className="gc-chip">{chip}</div> : null}
          </div>
        </header>
        <div className={`gc-body${center ? ' gc-body--center' : ''}`}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function GroupHow({ title, text }) {
  return (
    <div className="gc-how">
      <div className="gc-how-title">{title}</div>
      <div className="gc-how-text">{text}</div>
    </div>
  );
}

export function GroupPackChips({ packs, packId, onPick, isAr, randomLabel, playSfx, showRandom = true }) {
  return (
    <div className="gc-packs" role="group">
      {showRandom && (
        <button
          type="button"
          className={`gc-pack${packId === 'random' ? ' on' : ''}`}
          style={{ '--pack-accent': '#b9842f' }}
          onClick={() => { playSfx?.('click'); onPick('random'); }}
        >
          🎲 {randomLabel}
        </button>
      )}
      {packs.map((p) => (
        <button
          key={p.id}
          type="button"
          className={`gc-pack${packId === p.id ? ' on' : ''}`}
          style={{ '--pack-accent': p.accent || '#b9842f' }}
          onClick={() => { playSfx?.('click'); onPick(p.id); }}
        >
          {p.icon ? `${p.icon} ` : ''}{isAr ? p.ar : p.en}
        </button>
      ))}
    </div>
  );
}
