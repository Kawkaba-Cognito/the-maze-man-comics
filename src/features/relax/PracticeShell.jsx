import React, { useLayoutEffect, useRef } from 'react';
import './wellbeing.css';

/*
 * Shared shell for the Wellbeing practices (Breathe, Grounding, PMR, Ikigai,
 * Sleep Sounds, and both quizzes). Provides the header plus a set of base CSS
 * classes (rxp-*) scoped under .rxp-root. Each practice sets its area hue via
 * the `accent` prop (exposed as --rx-hue).
 */

/*
 * ⚠ THESE ARE CSS VARIABLES NOW, NOT HEX (2026-09-05), AND THAT IS THE WHOLE
 * MIGRATION.
 *
 * Eight files import these constants and interpolate them into CSS template
 * strings (`color:${INK}`). While they were frozen hex, every one of those eight
 * emitted a literal that no theme could reach — so the dark appearance had to be
 * hand-written a second time, as a parallel block of `[data-home-theme='dark']`
 * overrides with its own hard-coded palette. Two palettes, nothing forcing them
 * to agree: the half-migrated-token failure this repo keeps paying for, at the
 * scale of a whole feature.
 *
 * Pointing the names at `var(--rx-*)` means the SAME eight files now theme
 * themselves, and the duplicate dark block below could simply be deleted rather
 * than maintained. The names are kept so no caller has to change.
 *
 * ⚠ Safe only because none of these reach a canvas. `ctx.fillStyle = 'var(--x)'`
 * silently paints nothing — checked before doing this; there is no getContext
 * anywhere under relax/.
 */
export const INK = 'var(--rx-ink)';
export const SUB = 'var(--rx-sub)';
export const FAINT = 'var(--rx-faint)';
export const LINE = 'var(--rx-hair)';
export const CARD = 'var(--rx-card)';
export const GOLD = 'var(--rx-meaning-core)';
export const SERIF = "'Cormorant Garamond', Georgia, serif";
export const SANS = "'Outfit', system-ui, sans-serif";

export default function PracticeShell({ title, accent, accentLit, isAr, onBack, children }) {
  const rootRef = useRef(null);

  // A card near the bottom of the scrollable Wellbeing menu can leave the
  // browser preserving that scroll offset while React swaps in a practice.
  // Start every practice at its header so navigation is never clipped.
  useLayoutEffect(() => {
    const resetScroll = () => rootRef.current?.scrollTo({ top: 0, left: 0 });
    resetScroll();
    const frame = requestAnimationFrame(resetScroll);
    return () => cancelAnimationFrame(frame);
  }, [title]);

  return (
    /* ⚠ `rx-wb` is what carries the palette — wellbeing.css scopes every token
       to that class. Drop it and every `var(--rx-*)` below resolves to nothing,
       which renders as unstyled text rather than as an error. */
    <div ref={rootRef} className="rx-wb rxp-root" dir={isAr ? 'rtl' : 'ltr'}>
      <style>{BASE_CSS}</style>
      <div
        className="rxp-app"
        /* `accent` names an area hue. A practice appears in more than one
           category (Breathe is in both Calm and Sleep), so the caller decides
           which one it is wearing rather than the practice hard-coding it. */
        style={{ '--rx-hue': accent || 'var(--rx-calm-core)', '--rx-hue-lit': accentLit || 'var(--rx-calm-lit)' }}
      >
        <div className="rxp-head">
          <button className="rxp-back" onClick={onBack} aria-label="Back">‹</button>
          <div className="rxp-title serif">{title}</div>
          <div style={{ width: 36 }} />
        </div>
        {children}
      </div>
    </div>
  );
}

/*
 * ⚠ THERE IS NO `[data-home-theme='dark']` BLOCK ANY MORE, AND ITS ABSENCE IS
 * THE POINT. There used to be nine overrides here re-stating the whole surface
 * in a second hard-coded palette (#f0e2c0, #211a10, rgba(212,168,80,0.25)…).
 * Everything below now resolves through `--rx-*` → `--universe-*`, which flips
 * on its own, so the duplicate had nothing left to say. If you find yourself
 * adding a dark override to this file, the colour above it is wrong.
 *
 * ⚠ The ground is `--rx-ground`, NOT `--color-training-palette-surface`. The
 * latter is the play surface and tokens.css keeps it fixed light in BOTH
 * appearances on purpose, so using it here pinned every practice screen to a
 * pale board while the chrome around it went dark.
 */
/**
 * The hero on a practice screen: the area's own celestial body, with the
 * practice's emblem riding on it.
 *
 * ⚠ It takes the SAME `.rx-body`/`.rx-emblem` markup as the landing's orbs, on
 * purpose. A practice opened from Sleep should visibly be the Sleep planet seen
 * closer up; two different drawings of the same idea is how an area stops
 * feeling like one place. `emoji` is the fallback for the practices whose
 * emblem is a glyph rather than a file.
 */
export function PracticeHero({ emblem, emoji }) {
  return (
    <div className="rxp-hero">
      <span aria-hidden="true" className="rx-halo" />
      <span aria-hidden="true" className="rx-body">
        {emblem
          ? <img className="rx-emblem" src={emblem} alt="" draggable={false} />
          : <span className="rxp-hero-glyph">{emoji}</span>}
      </span>
    </div>
  );
}

const BASE_CSS = `
.rxp-root { position:fixed; inset:0; z-index:50; overflow-y:auto; -webkit-overflow-scrolling:touch; background:${'var(--rx-ground)'}; color:${INK}; font-family:${SANS}; }
.rxp-root *, .rxp-root *::before, .rxp-root *::after { box-sizing:border-box; }

/*
 * ⚠ A COLUMN, PLUS THE ROOM AROUND IT. This was a flat max-width:480px, so
 * every practice rendered a phone-shaped strip down the middle of a 1366px
 * window with ~440px of dead ground either side — measured on this project's
 * own desktop. The reading column still caps (long lines are unreadable and a
 * breathing pacer does not want to be a metre wide), but the shell now has a
 * padded field around it so the screen reads as composed rather than abandoned.
 */
.rxp-app { width:100%; max-width:520px; margin:0 auto; min-height:100%; display:flex; flex-direction:column; padding-bottom:40px; }
.rxp-head { display:flex; align-items:center; justify-content:space-between; padding:calc(14px + env(safe-area-inset-top)) 14px 8px; }
.rxp-back { width:36px; height:36px; border-radius:11px; border:1px solid ${LINE}; background:${CARD}; color:${INK}; font-size:22px; line-height:1; cursor:pointer; box-shadow:var(--elev-rest); }
.rxp-back:active { box-shadow:var(--elev-press); }
.rxp-title { font-family:${SERIF}; font-size:26px; font-weight:600; color:${INK}; }
.rxp-root .serif { font-family:${SERIF}; font-weight:600; }
.rxp-body { flex:1; padding:8px 22px 20px; display:flex; flex-direction:column; gap:18px; }
.rxp-center { align-items:center; text-align:center; justify-content:center; }
.rxp-field { display:flex; flex-direction:column; gap:10px; }
.rxp-label { font-size:11px; letter-spacing:2px; text-transform:uppercase; color:${SUB}; font-weight:800; }
.rxp-chips { display:flex; flex-wrap:wrap; gap:8px; }
.rxp-chip { padding:10px 14px; border-radius:999px; border:1px solid ${LINE}; background:${CARD}; color:${SUB}; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; text-align:start; transition:border-color .16s, background .16s, color .16s; }
.rxp-chip.on { border-color:var(--rx-hue); background:color-mix(in srgb, var(--rx-hue) 16%, ${'var(--rx-card)'}); color:${INK}; }
.rxp-chip small { display:block; font-size:11px; font-weight:600; color:${FAINT}; margin-top:1px; }

/*
 * ⚠ ELEVATION, NOT A STICKER. This was box-shadow:3px 3px 0 rgba(26,18,8,.14)
 * — the hard unblurred offset the training platform dropped on 2026-09-02 for
 * reading as a children's toy. Wellbeing kept wearing it for three more days
 * because nothing was checking this tree. Press SINKS rather than sliding: a
 * translate moves the label diagonally out from under the finger already on it.
 */
/*
 * ⚠ 'align-self:center' IS LOAD-BEARING. '.rxp-body' is a flex COLUMN with the
 * default 'align-items:stretch', and a stretched flex item that caps itself with
 * 'max-width' does NOT centre — it goes flush to the inline start. So Begin
 * rendered as a 340px button hard against the left of a 480px column while the
 * pattern chips above it ran the full width: visibly misaligned, on every
 * practice screen that has a primary action.
 *
 * CLAUDE.md records the identical bug in '.ct-play-results-actions', where it
 * was a grid track rather than a flex column. Same cause, same tell, same fix.
 */
.rxp-primary { align-self:center; width:100%; max-width:340px; padding:15px; border-radius:14px; border:1px solid color-mix(in srgb, var(--rx-hue) 55%, transparent); background:var(--rx-hue); color:#fff; font-size:16px; font-weight:750; cursor:pointer; font-family:inherit; box-shadow:var(--elev-rest); transition:box-shadow .18s; }
.rxp-primary:hover { box-shadow:var(--elev-raise); }
.rxp-primary:active { box-shadow:var(--elev-press); }
.rxp-ghost { align-self:center; width:100%; max-width:340px; padding:13px; border-radius:14px; border:1px solid ${LINE}; background:${CARD}; color:${SUB}; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; box-shadow:var(--elev-rest); }
.rxp-ghost:active { box-shadow:var(--elev-press); }
.rxp-tip { font-size:12.5px; color:${FAINT}; line-height:1.6; text-align:center; max-width:360px; }

/*
 * ⚠ THE HERO IS A SPHERE NOW, NOT A 60px EMOJI. font-size:60px on a lone
 * emoji was the entire hero of every practice screen — a 🫁 over the breathing
 * pacer, a 💪 over muscle relaxation. The area's own body carries it instead,
 * so the practice is visibly part of the area it was opened from.
 */
.rxp-hero { width:86px; height:86px; margin:0 auto; position:relative; display:flex; align-items:center; justify-content:center; }
.rxp-hero-glyph { position:relative; z-index:1; font-size:38px; line-height:1; filter:drop-shadow(0 1px 2px rgba(0,0,0,0.45)); }
.rxp-remain { font-size:15px; font-weight:800; color:${SUB}; font-variant-numeric:tabular-nums; }
`;
