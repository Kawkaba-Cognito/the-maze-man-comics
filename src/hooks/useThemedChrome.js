import { useApp } from '../context/AppContext';

/**
 * Shared top-bar chrome for tab landings — universe / Home language.
 * Dark cosmos is the default brand look; light is a softer dawn variant.
 */
export function useThemedChrome(isAr = false) {
  const { appTheme } = useApp();
  const dark = appTheme !== 'light';

  const chromeBtn = {
    width: 34,
    height: 34,
    borderRadius: 999,
    border: dark
      ? '1px solid rgba(232, 172, 78, 0.38)'
      : '1px solid rgba(170, 140, 80, 0.35)',
    background: dark
      ? 'rgba(14, 12, 24, 0.78)'
      : 'rgba(255, 252, 246, 0.78)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: dark ? '#e8d4a8' : '#5f4824',
    cursor: 'pointer',
    boxShadow: dark
      ? '0 4px 16px rgba(0, 0, 0, 0.4)'
      : '0 4px 14px rgba(100, 80, 40, 0.12)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  };

  const title = {
    textAlign: 'center',
    fontFamily: isAr ? "'Cairo', sans-serif" : "'Outfit', system-ui, sans-serif",
    fontSize: isAr ? 22 : 20,
    fontWeight: 800,
    letterSpacing: isAr ? 0 : 0.04,
    color: dark ? '#f0e2c0' : '#5a4018',
    textTransform: 'none',
    lineHeight: 1.15,
    maxWidth: 220,
    textShadow: dark
      ? '0 1px 0 rgba(255,220,120,0.25), 0 0 14px rgba(232,172,78,0.35)'
      : 'none',
  };

  const langBtn = {
    ...chromeBtn,
    width: 'auto',
    padding: '0 12px',
    fontFamily: isAr ? "'Cairo', sans-serif" : "'Outfit', system-ui, sans-serif",
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: isAr ? 0 : 0.02,
    color: dark ? '#e8ac4e' : '#6a4e22',
  };

  const shell = {
    background: 'transparent',
    color: dark ? '#f0e2c0' : '#4a3818',
  };

  /** Shared glass card for Learn / Other / landing menus — matches Home cosmos. */
  const glassCard = {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '14px 16px',
    borderRadius: 16,
    width: '100%',
    textAlign: isAr ? 'right' : 'left',
    cursor: 'pointer',
    border: dark
      ? '1px solid rgba(232, 172, 78, 0.34)'
      : '1px solid rgba(170, 140, 80, 0.28)',
    background: dark
      ? 'rgba(14, 12, 24, 0.72)'
      : 'rgba(255, 252, 246, 0.72)',
    boxShadow: dark
      ? '0 4px 18px rgba(0, 0, 0, 0.35)'
      : '0 6px 18px rgba(100, 80, 40, 0.1)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    color: dark ? '#e8d4a8' : '#5f4824',
    fontFamily: isAr ? "'Cairo', sans-serif" : "'Outfit', system-ui, sans-serif",
  };

  const muted = dark ? '#b9a878' : '#8a7348';
  const accent = dark ? '#e8ac4e' : '#9a6828';

  return { dark, chromeBtn, title, langBtn, shell, glassCard, muted, accent, text: shell.color };
}
