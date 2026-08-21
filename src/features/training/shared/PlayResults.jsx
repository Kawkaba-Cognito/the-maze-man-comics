import React, { useId } from 'react';
import { TrainingMenuBar } from './TrainingChrome';
import { STR_COMMON } from './trainingStrings';
/* Its own styles AND its own --fq-* tokens live here. Imported explicitly even
 * though PlayHud imports the same file: today this only renders in games that
 * also mount the HUD, so the CSS arrives by luck. A game that used results
 * WITHOUT the HUD would get the unstyled screen PlayHud already shipped once —
 * a shared component must carry its own styles. */
import './playHud.css';

/*
 * PlayResults — the screen every game shows when a run ends.
 *
 * ── Why this exists ───────────────────────────────────────────────────────
 * Thirteen games hand-rolled this screen. They all say the same four things —
 * "the run is over", one headline number, some secondary figures, and two ways
 * out — but they said it in thirteen layouts, with the stats mashed into a
 * single run-together line ("3 rounds · 40 pts", "✓ 8 · 120 pts") that no two
 * games punctuated the same way.
 *
 * Modelled on Cancellation's, which is the platform standard: a big headline
 * number with a caption under it, then quieter lines, then Play again / Menu.
 *
 * ── The shape ─────────────────────────────────────────────────────────────
 *   headline  { value, label }   the one number that IS the result
 *   stats     [{ value, label }] optional secondary figures, as columns
 *   notes     [string]           quiet lines: personal bests, context
 *   extra     node               anything game-specific (a capacity readout,
 *                                a science panel link) — an escape hatch, but
 *                                one that keeps the surrounding frame identical
 *
 * `onAgain` is optional: a game with nothing to replay (a finished level)
 * simply omits it and gets a single Menu button.
 */
export default function PlayResults({
  isAr,
  title,
  headline,
  stats,
  notes,
  extra,
  onAgain,
  onMenu,
  againLabel,
  menuLabel,
  playSfx,
  actions,
  tone = 'neutral',
}) {
  const L = isAr ? STR_COMMON.ar : STR_COMMON.en;
  const rows = (stats || []).filter(Boolean);
  const lines = (notes || []).filter(Boolean);
  const resultActions = (actions || []).filter(Boolean);
  const titleId = useId();
  const displayTitle = title || L.freeGameOver;

  return (
    <div className="ct-play-results" dir={isAr ? 'rtl' : 'ltr'}>
      <TrainingMenuBar
        onBack={onMenu}
        playSfx={playSfx}
        variant="paper"
        center={<span className="ct-play-results-kicker">{isAr ? 'النتيجة' : 'Results'}</span>}
      />

      <main className={`ct-play-results-card ct-play-results-card--${tone}`} aria-labelledby={titleId}>
        <span className="ct-play-results-mark" aria-hidden="true">
          {tone === 'success' ? '✓' : tone === 'retry' ? '↻' : '◇'}
        </span>
        <h2 id={titleId} className="ct-play-results-title">{displayTitle}</h2>

        {headline ? (
          <div className="ct-play-results-headline">
            <div className="ct-fq-sbig">{headline.value}</div>
            <div className="ct-fq-ies-lbl">{headline.label}</div>
          </div>
        ) : null}

        {rows.length ? (
          <div className="ct-play-results-stats">
            {rows.map((s, i) => (
              <div className="ct-play-results-stat" key={s.label ?? i}>
                <div className="ct-play-results-stat-v">{s.value}</div>
                <div className="ct-play-results-stat-l">{s.label}</div>
              </div>
            ))}
          </div>
        ) : null}

        {lines.length ? (
          <div className="ct-play-results-notes">
            {lines.map((n, i) => <p key={i}>{n}</p>)}
          </div>
        ) : null}

        {extra ? <div className="ct-play-results-extra">{extra}</div> : null}

        <div className="ct-play-results-actions">
          {resultActions.length ? resultActions.map((action, index) => (
            <button
              key={action.key || action.label || index}
              type="button"
              className={`ct-fq-btn ${action.variant === 'ghost' ? 'ct-fq-btn-ghost' : 'ct-fq-btn-pri'}`}
              onClick={() => { playSfx?.('click'); action.onClick?.(); }}
            >
              {action.label}
            </button>
          )) : (
            <>
              {onAgain ? (
                <button
                  type="button"
                  className="ct-fq-btn ct-fq-btn-pri"
                  onClick={() => { playSfx?.('click'); onAgain(); }}
                >
                  {againLabel || L.freePlayAgain || L.again}
                </button>
              ) : null}
              <button
                type="button"
                className="ct-fq-btn ct-fq-btn-ghost"
                onClick={() => { playSfx?.('click'); onMenu?.(); }}
              >
                {menuLabel || L.menu}
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
