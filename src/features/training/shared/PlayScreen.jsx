import React, { useLayoutEffect, useRef, useState } from 'react';
import './playScreen.css';

/*
 * PlayScreen — the frame every training game plays inside.
 *
 * A game supplies a BOARD and some VALUES. It does not supply styles, a
 * background, a header, or a button row. That is the entire point: the four
 * different chromes across eighteen games (and six games with none) are why the
 * platform drifted, and why "make them consistent" kept meaning eighteen
 * separate fixes.
 *
 * ── Rules this encodes, each from a real failure ──────────────────────────
 *
 * 1. THE GAME NEVER PAINTS THE SURFACE. Block Escape was fixed four times and
 *    stayed dark, because it had a root background, an `isCosmos ? undefined`
 *    branch, a full-bleed starfield child, AND a `!important` deep-surface rule
 *    all fighting each other. Here there is exactly one background and a game
 *    cannot reach it. `surface="deep"` is the only opt-out, for boards built on
 *    additive blending (Story Time, Detective) where a light ground renders
 *    them invisible.
 *
 * 2. THE BOARD IS GIVEN ITS SLOT, IT DOES NOT GUESS. Block Escape estimated
 *    `chrome = 240` for header + HUD + buttons, was wrong, and ran under the
 *    Reset button; that constant had already been revised once for the same
 *    reason. Pass `children` as a function and it receives the measured slot:
 *      <PlayScreen>{({ width, height }) => <Board w={width} h={height} />}</PlayScreen>
 *    No game should ever subtract a hardcoded chrome height again.
 *
 * 3. THE ACTION ROW CANNOT WRAP INTO THE BOARD. Two 200px buttons in a 420px
 *    container with 12px padding wrapped by 14px, doubling the row's height and
 *    pushing it over the board. Sizing lives in playScreen.css, once.
 */

/**
 * @param {object}   p
 * @param {boolean}  p.isAr
 * @param {string}   p.title
 * @param {string}   [p.subtitle]
 * @param {React.ReactNode} [p.hud]       usually <PlayHud/>
 * @param {() => void} [p.onBack]
 * @param {() => void} [p.onPause]
 * @param {{ label: string, onClick: () => void, variant?: 'primary'|'ghost' }[]} [p.actions]
 * @param {React.ReactNode} [p.overlay]   countdown / cue veil, drawn above everything
 * @param {'light'|'deep'} [p.surface]    'deep' ONLY for additive-blended boards
 * @param {React.ReactNode | ((slot: {width:number,height:number}) => React.ReactNode)} p.children
 */
export default function PlayScreen({
  isAr,
  title,
  subtitle,
  hud,
  onBack,
  onPause,
  actions = [],
  overlay,
  surface = 'light',
  className = '',
  children,
}) {
  const slotRef = useRef(null);
  const [slot, setSlot] = useState({ width: 0, height: 0 });

  /* Measure the board's slot and hand the numbers down. A ResizeObserver, not a
   * one-shot read: the slot has no size until after first paint, and it changes
   * whenever the HUD gains a row or the viewport moves. */
  useLayoutEffect(() => {
    const el = slotRef.current;
    if (!el) return undefined;
    const measure = () => setSlot({ width: el.clientWidth, height: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      className={`play-screen play-screen--${surface}${className ? ` ${className}` : ''}`}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* The header is OPTIONAL. Cancellation — the visual standard — has no
          title bar while playing: PlayHud is its whole chrome, carrying back,
          pause, the target chip and the stats in one row. A game that works
          that way passes only `hud` and gets no second bar. Rendering one
          unconditionally would have changed the very screen this frame is
          meant to preserve. */}
      {(title || onBack || onPause) ? (
      <header className="play-screen-header">
        {onBack ? (
          <button
            type="button"
            className="play-screen-chrome-btn"
            onClick={onBack}
            aria-label={isAr ? 'رجوع' : 'Back'}
          >
            ‹
          </button>
        ) : <span className="play-screen-chrome-spacer" />}

        <div className="play-screen-titles">
          <div className="play-screen-title">{title}</div>
          {subtitle ? <div className="play-screen-sub">{subtitle}</div> : null}
        </div>

        {onPause ? (
          <button
            type="button"
            className="play-screen-chrome-btn"
            onClick={onPause}
            aria-label={isAr ? 'إيقاف مؤقت' : 'Pause'}
          >
            ‖
          </button>
        ) : <span className="play-screen-chrome-spacer" />}
      </header>
      ) : null}

      {hud ? <div className="play-screen-hud">{hud}</div> : null}

      <div className="play-screen-slot" ref={slotRef}>
        {typeof children === 'function' ? children(slot) : children}
      </div>

      {actions.length ? (
        <div className="play-screen-actions">
          {actions.map((a) => (
            <button
              key={a.label}
              type="button"
              className={`play-screen-btn play-screen-btn--${a.variant || 'ghost'}`}
              onClick={a.onClick}
            >
              {a.label}
            </button>
          ))}
        </div>
      ) : null}

      {overlay ? <div className="play-screen-overlay">{overlay}</div> : null}
    </div>
  );
}
