import React from 'react';
import { PUZZLE_UI, sizeTierHint } from './puzzleStrings';

const SIZE_MODS = {
  3: 'ct-puzzle-grid-pick--s3',
  4: 'ct-puzzle-grid-pick--s4',
  5: 'ct-puzzle-grid-pick--s5',
  6: 'ct-puzzle-grid-pick--s6',
};

/** Grid-size picker — mirrors training mode cards but for N×N sizes. */
export default function GridSizePicker({ t, isAr, sizes, onPick, playSfx, hintForSize }) {
  return (
    <div className="ct-puzzle-grid-picks" role="group" aria-label={t.pickGrid}>
      {sizes.map((size, idx) => (
        <button
          key={size}
          type="button"
          className={`ct-puzzle-grid-pick ${SIZE_MODS[size] ?? ''}`}
          onClick={() => {
            playSfx('click');
            onPick(size);
          }}
        >
          <span className="ct-puzzle-grid-pick-ic" aria-hidden="true">
            {t.gridLabel(size)}
          </span>
          <span className="ct-puzzle-grid-pick-body">
            <span className="ct-puzzle-grid-pick-lb">{t.gridLabel(size)}</span>
            <span className={`ct-puzzle-grid-pick-hint${isAr ? ' ct-puzzle-grid-pick-hint-ar' : ''}`}>
              {hintForSize ? hintForSize(size) : sizeTierHint(idx, sizes.length, isAr)}
            </span>
          </span>
          <span className="ct-puzzle-grid-pick-chev" aria-hidden="true">
            ›
          </span>
        </button>
      ))}
    </div>
  );
}

export function PuzzleHint({ children }) {
  return <p className="ct-puzzle-hint">{children}</p>;
}

export function PuzzleWinBanner({ t, moves, elapsed, onPlayAgain, onChangeSize, playSfx }) {
  return (
    <div className="ct-puzzle-win" role="status">
      <div className="ct-puzzle-win-badge">★</div>
      <h3 className="ct-puzzle-win-title">{t.solved}</h3>
      <p className="ct-puzzle-win-meta">
        {moves != null ? t.moves(moves) : null}
        {moves != null && elapsed != null ? ' · ' : null}
        {elapsed != null ? t.time(elapsed) : null}
      </p>
      <div className="ct-puzzle-win-actions">
        <button
          type="button"
          className="ct-training-btn ct-training-btn--pri"
          onClick={() => {
            playSfx('click');
            onPlayAgain();
          }}
        >
          {t.playAgain}
        </button>
        <button
          type="button"
          className="ct-training-btn ct-training-btn--ghost"
          onClick={() => {
            playSfx('click');
            onChangeSize();
          }}
        >
          {t.changeSize}
        </button>
      </div>
    </div>
  );
}

export function PuzzleToolbar({ t, onNew, onReset, playSfx, extra, hint }) {
  const [needMsg, setNeedMsg] = React.useState(false);

  const onHintClick = () => {
    if (!hint || hint.disabled) return;
    if (hint.points < hint.cost) {
      playSfx?.('error');
      setNeedMsg(true);
      setTimeout(() => setNeedMsg(false), 1500);
      return;
    }
    const did = hint.onReveal(); // true only if a cell was actually revealed
    if (did) {
      hint.spendPoints(hint.cost);
      playSfx?.('collect');
    }
  };

  return (
    <div className="ct-puzzle-toolbar">
      <button type="button" className="ct-puzzle-tool-btn ct-puzzle-tool-btn--pri" onClick={() => { playSfx('click'); onNew(); }}>
        {t.start}
      </button>
      {onReset ? (
        <button type="button" className="ct-puzzle-tool-btn" onClick={() => { playSfx('click'); onReset(); }}>
          {t.reset}
        </button>
      ) : null}
      {hint ? (
        <button
          type="button"
          className="ct-puzzle-tool-btn ct-puzzle-tool-btn--hint"
          disabled={hint.disabled}
          onClick={onHintClick}
        >
          {needMsg ? t.needPoints(hint.cost) : t.hintBtn(hint.cost)}
        </button>
      ) : null}
      {extra}
    </div>
  );
}

export function NumberPad({ max, selected, onPick, onClear, isAr, playSfx }) {
  return (
    <div className="ct-puzzle-numberpad" role="group" aria-label={isAr ? 'لوحة الأرقام' : 'Number pad'}>
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          className="ct-puzzle-numkey"
          disabled={!selected}
          onClick={() => {
            playSfx('click');
            onPick(n);
          }}
        >
          {n}
        </button>
      ))}
      <button
        type="button"
        className="ct-puzzle-numkey ct-puzzle-numkey--clear"
        disabled={!selected}
        onClick={() => {
          playSfx('click');
          onClear();
        }}
      >
        {isAr ? 'مسح' : 'Clear'}
      </button>
    </div>
  );
}
