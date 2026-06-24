import React, { useEffect, useState } from 'react';

const PHASES = ['intro', 'charge', 'clash', 'combo', 'boss-hit', 'victory'];

/**
 * Full-screen boss fight spectacle — soldiers vs the Gate Warden.
 * Runs over the maze canvas; onComplete opens the labyrinth door.
 */
export default function BossFightCinematic({ soldiers, boss, isAr, playSfx, onComplete }) {
  const [phase, setPhase] = useState(0);
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState(false);
  const [hp, setHp] = useState(100);

  useEffect(() => {
    const timeline = [
      { t: 400, fn: () => { setPhase(1); playSfx?.('click'); } },
      { t: 1200, fn: () => { setPhase(2); playSfx?.('collect'); setFlash(true); setTimeout(() => setFlash(false), 120); } },
      { t: 2200, fn: () => { setPhase(3); setShake(true); playSfx?.('collect'); setHp(55); } },
      { t: 3400, fn: () => { setPhase(4); playSfx?.('error'); setHp(18); setFlash(true); setTimeout(() => setFlash(false), 150); } },
      { t: 4600, fn: () => { setPhase(5); setShake(false); setHp(0); playSfx?.('win'); } },
      { t: 6200, fn: () => onComplete?.() },
    ];
    const ids = timeline.map(({ t, fn }) => setTimeout(fn, t));
    return () => ids.forEach(clearTimeout);
  }, [playSfx, onComplete]);

  const p = PHASES[phase] || 'intro';
  const s1 = soldiers?.[0];
  const s2 = soldiers?.[1];

  return (
    <div className={`bf-cine${shake ? ' bf-cine--shake' : ''}${flash ? ' bf-cine--flash' : ''}`} role="dialog" aria-modal="true">
      <div className="bf-cine-bg" />
      <div className="bf-cine-vignette" />

      <header className="bf-cine-hud">
        <span className="bf-cine-kicker">{isAr ? '⚔️ معركة البوابة' : '⚔️ GATE BATTLE'}</span>
        <h2 className="bf-cine-title">{isAr ? boss?.nameAr : boss?.name}</h2>
        <div className="bf-cine-boss-hp">
          <div className="bf-cine-boss-hp-fill" style={{ width: `${hp}%` }} />
        </div>
      </header>

      <div className="bf-cine-arena">
        <div className={`bf-side bf-side--heroes${p === 'charge' || p === 'combo' ? ' bf-side--lunge' : ''}`}>
          <div className="bf-fighter bf-fighter--a">
            <span className="bf-fighter-sprite" style={{ background: s1?.color || '#6a9fd8' }} />
            <span className="bf-fighter-name">{s1?.name?.split(' ')[0] || 'Finn'}</span>
          </div>
          <div className={`bf-fighter bf-fighter--b${p === 'combo' ? ' bf-fighter--jump' : ''}`}>
            <span className="bf-fighter-sprite" style={{ background: s2?.color || '#5ec6b6' }} />
            <span className="bf-fighter-name">{s2?.name?.split(' ')[0] || 'Mara'}</span>
          </div>
        </div>

        <div className="bf-fx-center">
          {p === 'clash' && <div className="bf-spark">💥</div>}
          {p === 'combo' && <div className="bf-spark bf-spark--big">⚡</div>}
          {p === 'boss-hit' && <div className="bf-spark bf-spark--crit">🔥</div>}
        </div>

        <div className={`bf-side bf-side--boss${p === 'boss-hit' ? ' bf-side--stagger' : ''}${p === 'victory' ? ' bf-side--fall' : ''}`}>
          <div className="bf-boss">
            <span className="bf-boss-sprite" style={{ background: boss?.color || '#9a68c8' }}>👹</span>
            <span className="bf-boss-crown">👑</span>
          </div>
        </div>
      </div>

      <footer className="bf-cine-caption">
        {p === 'intro' && (isAr ? 'جيشك يتحرّك…' : 'Your army advances…')}
        {p === 'charge' && (isAr ? 'هجوم!' : 'CHARGE!')}
        {p === 'clash' && (isAr ? 'اصطدام!' : 'CLASH!')}
        {p === 'combo' && (isAr ? 'ضربة مزدوجة!' : 'Double strike!')}
        {p === 'boss-hit' && (isAr ? 'الزعيم يرتج!' : 'The Warden staggers!')}
        {p === 'victory' && (isAr ? '✓ البوابة تفتح!' : '✓ THE GATE OPENS!')}
      </footer>
    </div>
  );
}
