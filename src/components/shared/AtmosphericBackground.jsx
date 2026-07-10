import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { assetUrl } from '../../lib/assetUrl';
import { homeBgPaths } from '../../lib/appTheme';

/**
 * Full-bleed stage background matching Home (light/dark one-door art).
 * `strength`: "hub" (lighter veil) | "panel" (stronger for readable cards).
 * `photo`: whether to render the background photo itself (default true).
 * AppShell already renders a global `.bg-poster` photo behind every screen
 * except the training home (see `isTrainingHome` in AppShell.jsx) — pass
 * `photo={false}` on any screen where that global layer is already present,
 * so this component only adds its veil/glow tint instead of stacking a
 * second, redundant copy of the same image underneath.
 */
export default function AtmosphericBackground({ strength = 'hub', photo = true }) {
  const { appTheme } = useApp();
  const [desktop, setDesktop] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia?.('(min-width: 768px)').matches,
  );

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = () => setDesktop(mq.matches);
    onChange();
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  const paths = homeBgPaths(appTheme);
  const bgUrl = assetUrl(desktop ? paths.desktop : paths.mobile);
  const dark = appTheme === 'dark';
  const heavy = strength === 'panel';

  const veil = dark
    ? (heavy
      ? 'linear-gradient(180deg, rgba(10,8,18,0.55) 0%, rgba(12,10,22,0.42) 42%, rgba(8,6,16,0.68) 100%)'
      : 'linear-gradient(180deg, rgba(10,8,18,0.28) 0%, rgba(12,10,22,0.18) 42%, rgba(8,6,16,0.42) 100%)')
    : (heavy
      ? 'linear-gradient(180deg, rgba(255,252,246,0.42) 0%, rgba(240,236,228,0.28) 42%, rgba(232,228,218,0.55) 100%)'
      : 'linear-gradient(180deg, rgba(255,252,246,0.22) 0%, rgba(240,236,228,0.12) 42%, rgba(232,228,218,0.32) 100%)');

  // Dark theme's signature is the blue light of Home's Universe (Kawkab's
  // glow) — every dark screen carries a whisper of it so the whole app
  // reads as one night. Light keeps the warm dawn glow.
  const glow = dark
    ? 'radial-gradient(ellipse 58% 46% at 50% 39%, rgba(120,180,255,0.13) 0%, rgba(120,180,255,0.03) 44%, transparent 72%)'
    : 'radial-gradient(ellipse 58% 46% at 50% 42%, rgba(255,236,180,0.35) 0%, rgba(255,236,180,0.08) 48%, transparent 74%)';

  return (
    <>
      {photo && (
        <div
          className="atm-bg-photo"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: dark ? '#12101c' : '#e8eef5',
            backgroundImage: `url("${bgUrl}")`,
            backgroundSize: 'cover',
            backgroundPosition: desktop ? 'center center' : 'center 42%',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />
      )}
      <div
        className="atm-bg-veil"
        style={{
          position: 'absolute',
          inset: 0,
          background: veil,
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />
      <div
        className="atm-bg-glow"
        style={{
          position: 'absolute',
          inset: 0,
          background: glow,
          zIndex: 2,
          pointerEvents: 'none',
          mixBlendMode: dark ? 'screen' : 'soft-light',
        }}
      />
    </>
  );
}
