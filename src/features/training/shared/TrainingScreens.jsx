import React from 'react';
import { TrainingMenuBar } from './TrainingChrome';

/**
 * Shared training screens — one source of truth for the menu / difficulty /
 * level-pick screens so every game looks and sits identically.
 *
 * All games already use the `ct-fq-*` classes; these components standardise the
 * shell, header placement and card markup so they stop drifting.
 */

export function TrainingScreenShell({
  onBack,
  title,
  tag,
  children,
  playSfx,
  isAr,
  hub = false,
  onReplayTutorial,
  replayHint,
  shellClassName = '',
}) {
  // The canonical training screen (matches Speed Match). On the game hub a big
  // title + tag head is shown; sub-screens (difficulty/levels) use a small title.
  const center = hub && title
    ? (
      <div className="ct-fq-hub-attn-head">
        <div className="ct-fq-hub-attn-big">{title}</div>
        {tag ? <div className="ct-fq-hub-attn-sub">{tag}</div> : null}
      </div>
    )
    : title
      ? <div className="ct-fq-training-title ct-fq-training-title-sm">{title}</div>
      : undefined;
  return (
    <div
      className={`cancellation-task-game ct-fq-training-shell ct-fq-training-shell--hub-light${shellClassName ? ` ${shellClassName}` : ''}`}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className={`ct-fq-screen ct-fq-training-screen${hub ? ' ct-fq-training-screen--hub' : ''}`}>
        <TrainingMenuBar
          variant="paper"
          playSfx={playSfx}
          onBack={onBack}
          hubSpaced={hub}
          onReplayTutorial={onReplayTutorial}
          replayHint={replayHint}
          center={center}
        />
        {children}
      </div>
    </div>
  );
}

/**
 * Canonical mode list (Survival / Levels / Pass n Play) — the one component every
 * game's hub uses, so the menu can never drift. `items`: [{ k, ic, lb, hint, on }].
 */
export function TrainingModeList({ items, isAr, playSfx }) {
  const MOD = { free: 'ct-fq-attn-mode--free', levels: 'ct-fq-attn-mode--levels', chal: 'ct-fq-attn-mode--chal' };
  return (
    <div className="ct-fq-attn-modes" role="group">
      {items.map((m) => (
        <button
          key={m.k}
          type="button"
          className={`ct-fq-attn-mode ${MOD[m.k] || ''}`}
          onClick={() => { playSfx?.('click'); m.on(); }}
        >
          <span className="ct-fq-attn-mode-ic" aria-hidden="true">{m.ic}</span>
          <span className="ct-fq-attn-mode-body">
            <span className="ct-fq-attn-mode-lb">{m.lb}</span>
            {m.hint ? <span className={`ct-fq-attn-mode-hint${isAr ? ' ct-fq-attn-mode-hint-ar' : ''}`}>{m.hint}</span> : null}
          </span>
          <span className="ct-fq-attn-mode-chev" aria-hidden="true">›</span>
        </button>
      ))}
    </div>
  );
}

export function TrainingDifficultySelect({ isAr, playSfx, onBack, title, blurb, diffKeys, dm, descs, onPick }) {
  const secLabel = isAr ? 'الصعوبة' : 'Difficulty';
  return (
    <TrainingScreenShell isAr={isAr} playSfx={playSfx} onBack={onBack}>
      <div className="ct-lv-select-body">
        {title ? <h1 className="ct-lv-hero-title">{title}</h1> : null}
        {blurb ? <p className="ct-lv-hero-sub">{blurb}</p> : null}
        <div className="ct-lv-select-card">
          <div className="ct-lv-sec">{secLabel}</div>
          <div className="ct-fq-diff-cards ct-fq-diff-cards--lv">
            {diffKeys.map((k) => (
              <button
                key={k}
                type="button"
                className={`ct-fq-db ct-fq-db-${k} ct-fq-db-training ct-fq-diffcard`}
                onClick={() => {
                  playSfx?.('click');
                  onPick(k);
                }}
              >
                <span className="ct-fq-diffcard-main">
                  <span className="ct-fq-diffcard-label">{dm[k].label}</span>
                  {descs?.[k] ? <span className="ct-fq-diffcard-desc">{descs[k]}</span> : null}
                </span>
                {dm[k].pop ? (
                  <span className="ct-fq-diffcard-meta">
                    <span className="ct-fq-diffcard-pop">{dm[k].pop}</span>
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      </div>
    </TrainingScreenShell>
  );
}

export function TrainingLevelGrid({
  isAr,
  playSfx,
  onBack,
  title,
  blurb,
  count,
  isUnlocked,
  isDone,
  sublabel,
  lvc = 'fq-lve',
  onPick,
}) {
  return (
    <TrainingScreenShell isAr={isAr} playSfx={playSfx} onBack={onBack}>
      <div className="ct-lv-grid-wrap">
        {title ? <h1 className="ct-lv-hero-title">{title}</h1> : null}
        {blurb ? <p className="ct-lv-hero-sub">{blurb}</p> : null}
        <div className="ct-fq-lg ct-fq-lg-training">
        {Array.from({ length: count }, (_, i) => i + 1).map((lv) => {
          const un = isUnlocked(lv);
          const dn = isDone(lv);
          return (
            <button
              key={lv}
              type="button"
              className={`ct-fq-lb ${un ? `ct-${lvc}` : 'ct-lvk'}`}
              disabled={!un}
              onClick={() => {
                if (!un) return;
                playSfx?.('click');
                onPick(lv);
              }}
            >
              <span className="ct-ln">{dn ? '✓' : lv}</span>
              <span className="ct-ls">{un ? sublabel(lv) : '🔒'}</span>
            </button>
          );
        })}
        </div>
      </div>
    </TrainingScreenShell>
  );
}
