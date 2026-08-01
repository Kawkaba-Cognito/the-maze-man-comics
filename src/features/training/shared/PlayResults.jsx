import React from 'react';
import { TrainingMenuBar } from './TrainingChrome';
import { STR_COMMON } from './trainingStrings';

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
}) {
  const L = isAr ? STR_COMMON.ar : STR_COMMON.en;
  const rows = (stats || []).filter(Boolean);
  const lines = (notes || []).filter(Boolean);

  return (
    <div className="ct-play-results" dir={isAr ? 'rtl' : 'ltr'}>
      <TrainingMenuBar
        onBack={onMenu}
        playSfx={playSfx}
        variant="paper"
        center={(
          <div style={{ textAlign: 'center' }}>
            <div className="ct-fq-training-title ct-fq-training-title-sm">
              {title || L.freeGameOver}
            </div>
          </div>
        )}
      />

      {headline ? (
        <>
          <div className="ct-fq-sbig">{headline.value}</div>
          <div className="ct-fq-ies-lbl">{headline.label}</div>
        </>
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

      {lines.map((n, i) => (
        <p
          className="ct-fq-sub ct-fq-training-blurb"
          style={{ marginTop: i === 0 ? 10 : 6 }}
          key={i}
        >
          {n}
        </p>
      ))}

      {extra}

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
    </div>
  );
}
