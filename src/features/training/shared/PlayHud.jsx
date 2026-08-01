import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { getShapeScale, subscribeShapeNorm, getShapeNormVersion } from './shapeNorm';
import { SH } from './focusQuestData';
import { TrainingChromeBtn } from './TrainingChrome';
import { IconBack, IconPause } from './TrainingIcons';
import './playHud.css';

/*
 * PlayHud — the standard in-game header for every training game.
 *
 * This lived inside cancellation/index.jsx as `CtLiveHud`, which meant the one
 * header we actually wanted everywhere was the one header no other game could
 * import. Every other game grew its own — four different chromes across 18
 * games, six with none at all — and that, not stray colours, is why the
 * platform looked inconsistent.
 *
 * It owns its own rAF tick so the timer updates without repainting the board.
 *
 * Games pass VALUES, never styles. If you find yourself wanting a colour prop
 * here, the answer is a new semantic role in gamePalette, not a prop.
 */

const FALLBACK_SHAPE_EL = <circle cx="50" cy="50" r="38" fill="currentColor" />;
const shapeElCache = Object.create(null);
function getShapeEl(shape) {
  const key = shape in SH ? shape : 'circle';
  if (key in shapeElCache) return shapeElCache[key];
  const markup = SH[key] || SH.circle;
  let el = null;
  if (typeof DOMParser !== 'undefined') {
    try {
      const doc = new DOMParser().parseFromString(
        `<svg xmlns="http://www.w3.org/2000/svg">${markup}</svg>`,
        'image/svg+xml',
      );
      const node = doc.documentElement && doc.documentElement.firstElementChild;
      if (node && !doc.querySelector('parsererror')) {
        const props = {};
        for (const attr of node.attributes) props[attr.name] = attr.value;
        el = React.createElement(node.nodeName, props);
      }
    } catch {
      el = null;
    }
  }
  // Guaranteed fallback — a tile is never blank even if parsing failed.
  if (!el) el = FALLBACK_SHAPE_EL;
  shapeElCache[key] = el;
  return el;
}

export const ShapeSvg = React.memo(function ShapeSvg({ shape, color, size = 40 }) {
  // Re-render once filled-area measurement completes (memo only blocks
  // prop-driven updates, not this external-store subscription).
  useSyncExternalStore(subscribeShapeNorm, getShapeNormVersion, getShapeNormVersion);
  const scale = getShapeScale(shape);
  // Apply the area-normalization scale through the VIEWBOX, not a CSS transform.
  // A CSS `transform: scale()` with `transform-origin: center` on an SVG that is
  // also CSS-sized (the cell sets svg width/height to 90%) is browser-flaky and
  // could intermittently push the shape off-canvas → a blank cell. Widening the
  // viewBox around the centre (50,50) shrinks the drawn shape with pure
  // coordinates — no transform, no origin, always renders.
  let viewBox = '0 0 100 100';
  if (scale > 0 && scale < 1) {
    const span = 100 / scale;
    const off = (span - 100) / 2;
    viewBox = `${-off.toFixed(2)} ${-off.toFixed(2)} ${span.toFixed(2)} ${span.toFixed(2)}`;
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      style={{ color: color || '#2d2d2d', display: 'block' }}
    >
      {getShapeEl(shape)}
    </svg>
  );
});

export default function PlayHud({
  t,
  /** Generic stat slots: [{ value, label, tone?, small? }]. Overrides the
   *  named cancellation-shaped stats below when provided. */
  stats,
  /** Some games have no per-round clock; hide the timer slot rather than
   *  showing a frozen 0.0s. */
  showTimer = true,
  /** Hide the time progress bar for the same reason. */
  showTimeBar = true,
  playStep,
  pauseOpen,
  tlRef,
  tlimRef,
  roundTlim,
  useSessionTimer,
  found,
  tc,
  errors,
  errorsLabel,
  errorsMax,
  hideErrors,
  lvlLabel,
  freeScore,
  freeLives,
  freeLivesMax,   // total lives, so the HUD can draw the spent ones
  targetShape,
  targetColor,
  onMenu,
  onPause,
  menuAriaLabel,
  pauseAriaLabel,
  playSfx,
}) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (playStep !== 'running' || pauseOpen) return undefined;
    let id = 0;
    const step = () => {
      setTick((n) => (n + 1) % 1_000_000);
      id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [playStep, pauseOpen]);

  /* The timer refs are OPTIONAL. A game with no clock (every C3dProtoChrome
   * caller) renders this with showTimer/showTimeBar off and passes no refs at
   * all — dereferencing them unconditionally threw and took the whole game to
   * the error boundary. A shared component must not crash on a prop its own
   * flags say it will not use. */
  const timeLeft = tlRef?.current ?? 0;
  const timeLimit = tlimRef?.current ?? 0;

  const liveAnim = playStep === 'running' && !pauseOpen;
  const denom = (useSessionTimer ? timeLimit : timeLimit || roundTlim) || 1;
  const displaySeconds = useSessionTimer || playStep === 'running'
    ? timeLeft
    : roundTlim;
  const pctTime = !useSessionTimer && playStep !== 'running'
    ? 1
    : Math.max(0, Math.min(1, timeLeft / denom));

  return (
    <>
      <div className="ct-fq-bar" data-fq-chrome>
        <TrainingChromeBtn
          ariaLabel={menuAriaLabel}
          onClick={() => {
            playSfx('click');
            onMenu();
          }}
        >
          <IconBack size={18} c="#141210" />
        </TrainingChromeBtn>
        {/* Only games with a "find this" target carry the chip. Without this
            gate every other game showed ShapeSvg's fallback circle — a target
            reminder for a target that does not exist. */}
        {targetShape && (
          <div className="ct-fq-bar-chip" aria-hidden="true">
            <ShapeSvg shape={targetShape} color={targetColor} size={30} />
          </div>
        )}
        <div className="ct-fq-bar-stats">
          {/*
            `stats` is the generic escape hatch, and the reason this component
            can now be the header for every game rather than only Cancellation.
            The named props below (found/tc, errors, lives…) describe a
            cancellation-shaped run; a game that counts something else — Card
            Sort's rules found, Speed Match's combo — passes stats instead and
            gets the same chrome, spacing and type without inventing a header.

              stats={[{ value: `${total}/${max}`, label: t.trials },
                      { value: `✓${correct}`,     label: t.correct, tone: 'ac2' }]}

            Named props still render when `stats` is absent, so Cancellation and
            every existing caller are untouched.
          */}
          {stats
            ? stats.filter(Boolean).map((s, i) => (
              <div className="ct-fq-gs" key={s.label ?? i}>
                <div className={`ct-fq-gv${s.tone ? ` ${s.tone}` : ''}${s.small ? ' sm' : ''}`}>
                  {s.value}
                </div>
                <div className="ct-fq-gl">{s.label}</div>
              </div>
            ))
            : null}
          {!stats && showTimer && (
            <div className="ct-fq-gs">
              <div className={`ct-fq-gv ${liveAnim && timeLeft <= 10 ? 'tv' : ''}`}>
                {`${Number(displaySeconds).toFixed(1)}s`}
              </div>
              <div className="ct-fq-gl">{t.time}</div>
            </div>
          )}
          {!stats && (
          <div className="ct-fq-gs">
            <div className="ct-fq-gv">
              {found}/{tc}
            </div>
            <div className="ct-fq-gl">{t.found}</div>
          </div>
          )}
          {!stats && !hideErrors && (
            <div className="ct-fq-gs">
              <div className="ct-fq-gv ac2">
                {errorsMax != null ? `${errors}/${errorsMax}` : errors}
              </div>
              <div className="ct-fq-gl">{errorsLabel ?? t.err}</div>
            </div>
          )}
          {!stats && lvlLabel != null && (
            <div className="ct-fq-gs">
              <div className="ct-fq-gv sm">{lvlLabel}</div>
              <div className="ct-fq-gl">{t.lvl}</div>
            </div>
          )}
          {!stats && freeLives != null && (
            <div className="ct-fq-gs">
              <div className="ct-fq-gv ct-fq-lives" aria-label={`${freeLives} lives`}>
                {'♥'.repeat(Math.max(0, freeLives))}
                <span className="ct-fq-lives-spent">
                  {'♥'.repeat(Math.max(0, (freeLivesMax ?? 1) - freeLives))}
                </span>
              </div>
              <div className="ct-fq-gl">{t.lives}</div>
            </div>
          )}
          {!stats && freeScore != null && (
            <div className="ct-fq-gs">
              <div className="ct-fq-gv">{freeScore}</div>
              <div className="ct-fq-gl">{t.score}</div>
            </div>
          )}
        </div>
        {onPause && (
          <TrainingChromeBtn
            ariaLabel={pauseAriaLabel}
            onClick={() => {
              playSfx('click');
              onPause();
            }}
          >
            <IconPause size={17} c="#141210" />
          </TrainingChromeBtn>
        )}
      </div>
      {showTimeBar && (
      <div className="ct-fq-cbw" data-fq-chrome>
        <div
          className="ct-fq-cb"
          style={{
            width: `${pctTime * 100}%`,
            background:
              pctTime > 0.5
                ? 'linear-gradient(90deg,#6b9e7a,#7ab87a)'
                : pctTime > 0.2
                  ? 'linear-gradient(90deg,#e8c47a,#e8a07a)'
                  : 'linear-gradient(90deg,#e8a07a,#c97a7a)',
          }}
        />
      </div>
      )}
    </>
  );
}

