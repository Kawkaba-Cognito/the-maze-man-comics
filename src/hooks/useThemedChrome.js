import { useApp } from '../context/AppContext';

/**
 * Shared top-bar chrome for tab landings — universe / Home language.
 * Dark cosmos is the default brand look; light is a softer dawn variant.
 */
/*
 * ⚠️ `cosmic` no longer means "paint it cream".
 *
 * This hook used to hardcode #fff4df ink, amber accents and a near-black glass
 * whenever `universe: true` was passed — which is every landing in the app. So
 * when the app gained a real light theme, every landing title stayed cream and
 * became invisible on the beige ground: "WELLBEING" and "OTHER" were there,
 * just unreadable.
 *
 * All eight surfaces now read the --universe-* tokens, which follow
 * html[data-home-theme]. `cosmic` survives only to decide SHAPE — whether a
 * surface gets glass and blur at all — not colour.
 */
export function useThemedChrome(isAr = false, { universe = false } = {}) {
  const { appTheme } = useApp();
  const dark = appTheme !== 'light';
  /* Every surface below now reads tokens, so nothing branches on this any more.
     Kept as a no-op read so the `universe` option stays part of the signature
     for the eleven call sites that pass it — removing it is a separate tidy. */
  void (dark || universe);

  const chromeBtn = {
    width: 34,
    height: 34,
    borderRadius: 999,
    border: '1px solid var(--universe-line)',
    background: 'var(--universe-glass)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--universe-ink)',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.14)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  };

  // Premium display titles: Cinzel (engraved cosmic serif) in caps for EN,
  // Cairo for AR. Bigger + more letter-spacing than the old Outfit header.
  const title = {
    textAlign: 'center',
    fontFamily: isAr ? "'Cairo', sans-serif" : "'Cinzel', 'Cormorant Garamond', serif",
    fontSize: isAr ? 24 : 23,
    fontWeight: 700,
    letterSpacing: isAr ? 0 : 1.6,
    color: 'var(--universe-ink)',
    textTransform: isAr ? 'none' : 'uppercase',
    lineHeight: 1.18,
    maxWidth: 280,
    /* No glow. A glow is emitted light — it only reads on a dark ground, and on
       the beige theme it painted a dirty halo behind every landing title. */
    textShadow: 'none',
  };

  const langBtn = {
    ...chromeBtn,
    width: 'auto',
    padding: '0 12px',
    fontFamily: isAr ? "'Cairo', sans-serif" : "'Outfit', system-ui, sans-serif",
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: isAr ? 0 : 0.02,
    color: 'var(--universe-accent)',
  };

  const shell = {
    background: 'transparent',
    color: 'var(--universe-ink)',
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
    border: '1px solid var(--universe-line)',
    background: 'var(--universe-glass)',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.14)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    color: 'var(--universe-ink)',
    fontFamily: isAr ? "'Cairo', sans-serif" : "'Outfit', system-ui, sans-serif",
  };

  const muted = 'var(--universe-muted)';
  const accent = 'var(--universe-accent)';

  return { dark, chromeBtn, title, langBtn, shell, glassCard, muted, accent, text: shell.color };
}
