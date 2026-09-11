import React, { createContext, useContext, useLayoutEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import UniverseStage from '../../components/shared/UniverseStage';
import { wellbeingPillarArtUrl } from '../../lib/planetIcons';
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
/* ⚠ Point at the shared --rx-display/--rx-sans tokens (wellbeing.css) rather
   than restating the stacks here — every one of the ~15 files that imports
   SERIF/SANS gets the type-scale fix and the Arabic fallback (Cairo is in
   --rx-sans; --rx-display has no Arabic glyphs at all, which is what the
   [dir='rtl'] .serif rule in wellbeing.css corrects for).
   ⚠ Both tokens are only DEFINED on .rx-wb (wellbeing.css). DailyHabits.jsx
   and its two Insights/Reflect tabs root at plain .rx-root, never .rx-wb, so
   var(--rx-display) resolves to nothing there and the inherited body sans
   silently wins over the intended serif. The inline fallback keeps those
   screens correct without widening the .rx-wb selector (which would also
   hand .rx-root the whole type scale, a bigger change than this needs). */
export const SERIF = "var(--rx-display, 'Cormorant Garamond', Georgia, serif)";
export const SANS = "var(--rx-sans, 'Outfit', 'Cairo', system-ui, sans-serif)";

const PracticeArtContext = createContext(null);

export default function PracticeShell({ title, accent, accentLit, isAr, onBack, children }) {
  const { appTheme } = useApp();
  const rootRef = useRef(null);
  const pillarMatch = typeof accent === 'string' ? accent.match(/--rx-([a-z-]+)-core/) : null;
  const pillarArt = wellbeingPillarArtUrl(pillarMatch?.[1] || 'calm');

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
      <UniverseStage accent="wellbeing" dark={appTheme !== 'light'} homeDusk />
      <div
        className="rxp-app"
        /* `accent` names an area hue. A practice appears in more than one
           category (Breathe is in both Calm and Sleep), so the caller decides
           which one it is wearing rather than the practice hard-coding it. */
        style={{
          '--rx-hue': accent || 'var(--rx-calm-core)',
          '--rx-hue-lit': accentLit || 'var(--rx-calm-lit)',
          /* Text-only variant (see wellbeing.css) — derived from the same
             pillar match `pillarArt` already computes above. */
          '--rx-hue-ink': `var(--rx-${pillarMatch?.[1] || 'calm'}-ink)`,
        }}
      >
        <div className="rxp-head">
          <button className="rxp-back" onClick={onBack} aria-label="Back">‹</button>
          <div className="rxp-title serif">{title}</div>
          <div style={{ width: 36 }} />
        </div>
        <PracticeArtContext.Provider value={pillarArt}>
          {children}
        </PracticeArtContext.Provider>
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
  const pillarArt = useContext(PracticeArtContext);
  /*
   * ⚠ THE ART IS THE PLACE, THE EMOJI IS THE PRACTICE — show both, not
   * either/or. Every one of the 15 practices calling this only ever passes
   * `emoji`, never `emblem`, so the old either/or branch meant EVERY practice
   * in a pillar (Breathe, Grounding, Thought Record, the Calm worksheets…)
   * opened on the identical pillar photo with no way to tell them apart. The
   * pillar art becomes the sphere's surface; the emblem (an explicit image)
   * or the emoji rides on top of it, same as it always did on the plain CSS
   * sphere — so a practice is still visibly ITS pillar, but also still
   * visibly itself.
   */
  return (
    <div className="rxp-hero">
      <span aria-hidden="true" className="rx-halo" />
      <span aria-hidden="true" className="rx-body">
        {pillarArt && <img className="rxp-hero-art" src={pillarArt} alt="" draggable={false} />}
        {emblem
          ? <img className="rx-emblem" src={emblem} alt="" draggable={false} />
          : emoji
            ? <span className={`rxp-hero-glyph${pillarArt ? ' rxp-hero-glyph--onart' : ''}`}>{emoji}</span>
            : null}
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
.rxp-app { width:100%; max-width:560px; margin:0 auto; min-height:100%; display:flex; flex-direction:column; padding-bottom:40px; position:relative; z-index:2; }
.rxp-head { position:sticky; top:0; z-index:8; display:flex; align-items:center; justify-content:space-between; padding:calc(14px + env(safe-area-inset-top)) 16px 10px; background:color-mix(in srgb, var(--rx-ground) 72%, transparent); border-bottom:1px solid color-mix(in srgb, var(--rx-line) 58%, transparent); backdrop-filter:blur(18px); -webkit-backdrop-filter:blur(18px); }
.rxp-back { width:36px; height:36px; border-radius:11px; border:1px solid ${LINE}; background:${CARD}; color:${INK}; font-size:22px; line-height:1; cursor:pointer; box-shadow:var(--elev-rest); }
.rxp-back:active { box-shadow:var(--elev-press); }
.rxp-title { font-family:${SERIF}; font-size:var(--rx-fs-display); font-weight:600; line-height:1.12; letter-spacing:.01em; color:${INK}; }
.rxp-root .serif { font-family:${SERIF}; font-weight:600; }
.rxp-body { flex:1; width:100%; padding:18px 24px 28px; display:flex; flex-direction:column; gap:20px; }
.rxp-center { align-items:center; text-align:center; justify-content:center; }
.rxp-field { display:flex; flex-direction:column; gap:10px; }
/* ⚠ WAS var(--rx-hue-lit) — that value fails contrast as TEXT in light theme
   (see wellbeing.css). --rx-hue-ink is the text-safe variant of the same
   pillar hue. */
.rxp-label { font-size:var(--rx-fs-label); letter-spacing:2.2px; text-transform:uppercase; color:var(--rx-hue-ink); font-weight:700; }
.rxp-chips { display:flex; flex-wrap:wrap; gap:8px; }
.rxp-chip { min-height:44px; padding:10px 14px; border-radius:999px; border:1px solid ${LINE}; background:color-mix(in srgb, ${CARD} 88%, transparent); color:${SUB}; font-size:var(--rx-fs-body); font-weight:600; cursor:pointer; font-family:inherit; text-align:start; box-shadow:var(--elev-rest); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); transition:border-color .16s, background .16s, color .16s, box-shadow .16s; }
.rxp-chip.on { border-color:var(--rx-hue); background:color-mix(in srgb, var(--rx-hue) 16%, ${'var(--rx-card)'}); color:${INK}; }
.rxp-chip:focus-visible, .rxp-primary:focus-visible, .rxp-ghost:focus-visible, .rxp-back:focus-visible { outline:3px solid color-mix(in srgb, var(--rx-hue-lit) 78%, transparent); outline-offset:3px; }
.rxp-chip small { display:block; font-size:var(--rx-fs-label); font-weight:600; color:${FAINT}; margin-top:1px; }

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
/* ⚠ WAS linear-gradient(135deg, var(--rx-hue-lit), var(--rx-hue)) with
   white text — the LIT stop is the light limb colour, not a button fill, and
   white-on-lit measured 1.6-2.7:1 across the five pillars in both themes: the
   label was unreadable across roughly the first third of the button, on
   every practice. The core itself (darkened toward black, not lightened
   toward the lit value) is the correct floor - 4.6-6.9:1 with white.
   NO BACKTICKS IN THIS COMMENT: this whole block sits inside a CSS-in-JS
   template literal, and one ends the string early. */
.rxp-primary { align-self:center; width:100%; max-width:360px; min-height:52px; padding:15px 20px; border-radius:16px; border:1px solid color-mix(in srgb, var(--rx-hue-lit) 58%, transparent); background:linear-gradient(180deg, var(--rx-hue), color-mix(in srgb, var(--rx-hue) 78%, black)); color:#fff; font-size:var(--rx-fs-lead); font-weight:600; letter-spacing:.01em; cursor:pointer; font-family:inherit; box-shadow:var(--elev-raise); transition:box-shadow .18s, filter .18s; }
.rxp-primary:hover { filter:saturate(1.08) brightness(1.03); box-shadow:var(--elev-raise); }
.rxp-primary:active { box-shadow:var(--elev-press); }
.rxp-ghost { align-self:center; width:100%; max-width:340px; padding:13px; border-radius:14px; border:1px solid ${LINE}; background:${CARD}; color:${SUB}; font-size:var(--rx-fs-body); font-weight:600; cursor:pointer; font-family:inherit; box-shadow:var(--elev-rest); }
.rxp-ghost:active { box-shadow:var(--elev-press); }
/*
 * ⚠ align-self:center — THE SAME BUG AS .rxp-primary ABOVE, ONE RULE LOWER, and
 * it survived that fix because text-align:center makes it LOOK handled. The TEXT
 * was centred inside a 360px box that itself sat flush against the inline start
 * of a 520px stretched flex column, so on desktop every practice's hint sat
 * visibly left of the button it belongs to. Measured at 1366x577: box at x=416
 * in a column centred on 676.
 *
 * text-align centres content within a box; it never centres the box. Whenever a
 * child of .rxp-body caps itself with max-width it needs align-self or an auto
 * inline margin too — see .rx-caution, which uses margin:0 auto and is correct
 * for that reason.
 *
 * (No backticks in this comment on purpose: the whole block is inside a template
 * literal, so one would end the string and break the build — which is exactly
 * what the first version of this comment did.)
 */
.rxp-tip { align-self:center; font-size:var(--rx-fs-small); color:${FAINT}; line-height:1.6; text-align:center; max-width:360px; }

/*
 * ⚠ THE HERO IS A SPHERE NOW, NOT A 60px EMOJI. font-size:60px on a lone
 * emoji was the entire hero of every practice screen — a 🫁 over the breathing
 * pacer, a 💪 over muscle relaxation. The area's own body carries it instead,
 * so the practice is visibly part of the area it was opened from.
 */
.rxp-hero { width:118px; height:118px; margin:2px auto 6px; position:relative; display:flex; align-items:center; justify-content:center; }
.rxp-hero .rx-body { border:1px solid color-mix(in srgb, var(--rx-hue-lit) 62%, var(--rx-line)); box-shadow:0 16px 36px color-mix(in srgb, var(--rx-hue) 32%, transparent), inset 0 0 0 1px color-mix(in srgb, var(--rx-hue-lit) 30%, transparent); }
.rxp-hero-art { position:absolute; inset:0; width:100%; height:100%; display:block; object-fit:cover; }
.rxp-hero-glyph { position:relative; z-index:1; font-size:38px; line-height:1; filter:drop-shadow(0 1px 2px rgba(0,0,0,0.45)); }
/* Riding on a photo rather than the plain CSS sphere — a bit more contact
   shadow so the glyph still reads as sitting ON the surface, not just near it. */
.rxp-hero-glyph--onart { filter:drop-shadow(0 2px 5px rgba(0,0,0,0.6)) drop-shadow(0 0 10px rgba(0,0,0,0.35)); }
.rxp-remain { font-size:var(--rx-fs-body); font-weight:600; color:${SUB}; font-variant-numeric:tabular-nums; }
`;
