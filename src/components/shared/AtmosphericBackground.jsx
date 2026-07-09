import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { assetUrl } from '../../lib/assetUrl';
import { homeBgPaths } from '../../lib/appTheme';

/**
 * Full-bleed stage background matching Home (light/dark one-door art).
 * `strength`: "hub" (lighter veil) | "panel" (stronger for readable cards).
 */
export default function AtmosphericBackground({ strength = 'hub' }) {
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

  const glow = dark
    ? 'radial-gradient(ellipse 58% 46% at 50% 39%, rgba(255,214,132,0.14) 0%, rgba(255,214,132,0.03) 44%, transparent 72%)'
    : 'radial-gradient(ellipse 58% 46% at 50% 42%, rgba(255,236,180,0.35) 0%, rgba(255,236,180,0.08) 48%, transparent 74%)';

  return (
    <>
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
