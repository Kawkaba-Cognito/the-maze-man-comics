import React, { useCallback, useRef, useState } from 'react';
import PlayHud from './PlayHud';
import { TrainingPauseModal } from './TrainingChrome';
import { STR_COMMON } from './trainingStrings';
import { setScenePaused } from './c3dBoot';
import { setTrainingPaused } from './pauseStore';
import './c3dProto.css';

/*
 * ── One header, not two (2026-08-01) ──────────────────────────────────────
 * This component used to draw its OWN header (.c3d-top: back button, game
 * title, tag chip) and its own stats row (.c3d-stats). That made it the live
 * header for seven games while Cancellation used PlayHud — two shared headers
 * solving the same problem, which is why the platform looked inconsistent even
 * though most games already shared chrome.
 *
 * It now renders PlayHud. The seven games get Cancellation's header for free,
 * with no per-game edits.
 *
 * The game TITLE is deliberately gone: Cancellation never showed one in-game,
 * you just chose the game two taps ago, and dropping it is what makes these
 * screens actually match rather than merely rhyme.
 */

/**
 * Adapt the loose `stats` this component has always taken into PlayHud slots.
 *
 * Callers pass display strings — '✓0', '0 pts', '12/16'. PlayHud wants
 * { value, label } so the numbers line up in columns with a caption underneath,
 * the way Cancellation's do. Splitting on the LAST space separates '0 pts' into
 * value '0' + label 'pts' while leaving '✓0' and '12/16' as bare values.
 *
 * Callers may also pass { value, label } directly, which is preferred for new
 * code — no parsing, and the label can be translated properly.
 */
function toHudStats(stats, isAr, textOfFn) {
  return (stats || [])
    .map((s) => {
      if (s && typeof s === 'object' && !React.isValidElement(s) && ('value' in s || 'label' in s)) {
        return { value: textOfFn(s.value, isAr), label: textOfFn(s.label, isAr), tone: s.tone };
      }
      const str = textOfFn(s, isAr);
      if (!str) return null;
      const cut = String(str).lastIndexOf(' ');
      if (cut > 0 && Number.isNaN(Number(String(str).slice(cut + 1)))) {
        return { value: String(str).slice(0, cut), label: String(str).slice(cut + 1) };
      }
      return { value: str, label: '' };
    })
    .filter(Boolean);
}

/** Coerce bilingual {en,ar} bags to strings; pass through React nodes / primitives. */
function textOf(v, isAr) {
  if (v == null || typeof v === 'boolean') return '';
  if (typeof v === 'string' || typeof v === 'number') return String(v);
  if (React.isValidElement(v)) return v;
  if (typeof v === 'object' && ('en' in v || 'ar' in v)) {
    const s = isAr ? (v.ar ?? v.en) : (v.en ?? v.ar);
    if (s != null && typeof s !== 'object') return String(s);
    return '';
  }
  return '';
}

/**
 * Shared HUD / banners for training 3D prototypes.
 */
export default function C3dProtoChrome({
  isAr,
  title,
  tag,
  hint,
  question,
  chip,
  chipStyle,
  stats = [],
  banner,
  bannerOver,
  bannerMeta,
  bannerActions,
  bootError,
  onBack,
  playSfx,
  canvasRef,
  /* Rendered INSIDE the canvas box. The 3D scenes appended their WebGL canvas
     to this div imperatively; the 2D boards pass their <canvas> here instead. */
  canvasChildren,
  children,
}) {
  const hintText = textOf(hint, isAr);
  const questionText = textOf(question, isAr);
  const bannerText = textOf(banner, isAr);
  const metaText = textOf(bannerMeta, isAr);
  const errText = textOf(bootError, isAr);
  const hudStats = toHudStats(stats, isAr, textOf);

  /*
   * Pause, for all seven games that render this chrome.
   *
   * The state lives here rather than in each game because the only thing a
   * pause actually has to DO is stop the scene's clock, and c3dBoot now owns
   * that (setScenePaused freezes the `now` it hands the tick, so deadlines do
   * not expire behind the menu). So the chrome can offer a correct pause with
   * no cooperation from the game at all.
   *
   * `canvasRef` may be the caller's own ref — fall back to ours so the lookup
   * always has an element. Games that pass their own still work: it is the same
   * node either way.
   */
  const ownCanvasRef = useRef(null);
  const canvasEl = canvasRef ?? ownCanvasRef;
  const [pauseOpen, setPauseOpen] = useState(false);
  const L = isAr ? STR_COMMON.ar : STR_COMMON.en;

  const openPause = useCallback(() => {
    setScenePaused(canvasEl.current, true);
    setTrainingPaused(true);
    setPauseOpen(true);
  }, [canvasEl]);

  const closePause = useCallback(() => {
    setScenePaused(canvasEl.current, false);
    setTrainingPaused(false);
    setPauseOpen(false);
  }, [canvasEl]);

  const quitFromPause = useCallback(() => {
    // Unpause before leaving: the scene is about to be disposed, but if the
    // player returns to the same game the WeakMap entry would otherwise still
    // read "paused" for a freshly mounted scene.
    setScenePaused(canvasEl.current, false);
    setTrainingPaused(false);
    setPauseOpen(false);
    onBack();
  }, [canvasEl, onBack]);

  return (
    <div className="c3d-root" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="c3d-canvas" ref={canvasEl} aria-hidden="true">{canvasChildren}</div>
      {errText ? (
        <div className="c3d-banner c3d-banner--over">
          <span>{errText}</span>
          <button type="button" className="c3d-cta" onClick={() => { playSfx?.('click'); onBack(); }}>
            {isAr ? 'العودة' : 'Back'}
          </button>
        </div>
      ) : null}
      <div className="c3d-ui c3d-ui--overlay">
        {/* The standard header. No clock: these games run their own timers (or
            none), and a frozen 0.0s would be worse than no slot at all. */}
        <PlayHud
          t={{}}
          playStep="running"
          showTimer={false}
          showTimeBar={false}
          stats={hudStats}
          pauseOpen={pauseOpen}
          onMenu={() => onBack()}
          onPause={openPause}
          menuAriaLabel={isAr ? 'القائمة' : 'Menu'}
          pauseAriaLabel={L.paused}
          playSfx={playSfx}
        />
        {questionText
          ? <div className="c3d-question">{questionText}</div>
          : hintText ? <p className="c3d-hint">{hintText}</p> : null}
      </div>
      {children}
      {/* The same pause menu Cancellation shows. No Restart: these seven games
          reach a fresh run through the mode menu, and a half-implemented
          restart is worse than none. */}
      <TrainingPauseModal
        open={pauseOpen}
        labels={L}
        showRestart={false}
        onResume={() => { playSfx?.('click'); closePause(); }}
        onQuitMenu={() => { playSfx?.('click'); quitFromPause(); }}
      />
      {bannerText && !errText ? (
        <div className={`c3d-banner${bannerOver ? ' c3d-banner--over' : ''}`}>
          <span>{bannerText}</span>
          {metaText ? <p className="c3d-banner-meta">{metaText}</p> : null}
          {bannerActions}
        </div>
      ) : null}
    </div>
  );
}

/** Standard ModeShell extraItems entry for 3D mode. */
export function proto3dExtraItem({ isAr, on, hintEn, hintAr }) {
  return {
    k: 'proto3d',
    lb: isAr ? 'ثلاثي الأبعاد' : '3D',
    hint: isAr ? (hintAr || 'نموذج ثلاثي الأبعاد') : (hintEn || '3D prototype'),
    on,
  };
}
