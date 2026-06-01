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
  children,
  playSfx,
  isAr,
  hub = false,
  onReplayTutorial,
  replayHint,
}) {
  return (
    <div className="ct-fq-training-shell ct-fq-training-shell--hub-light" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="ct-fq-screen ct-fq-training-screen">
        <TrainingMenuBar
          variant="paper"
          playSfx={playSfx}
          onBack={onBack}
          hubSpaced={hub}
          onReplayTutorial={onReplayTutorial}
          replayHint={replayHint}
          center={
            title ? <div className="ct-fq-training-title ct-fq-training-title-sm">{title}</div> : undefined
          }
        />
        {children}
      </div>
    </div>
  );
}

export function TrainingDifficultySelect({ isAr, playSfx, onBack, title, blurb, diffKeys, dm, descs, onPick }) {
  return (
    <TrainingScreenShell isAr={isAr} playSfx={playSfx} onBack={onBack} title={title}>
      <div className="ct-fq-diff-body">
        {blurb ? <p className="ct-fq-sub ct-fq-training-blurb">{blurb}</p> : null}
        <div className="ct-fq-diff-cards">
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
    <TrainingScreenShell isAr={isAr} playSfx={playSfx} onBack={onBack} title={title}>
      {blurb ? <p className="ct-fq-sub ct-fq-training-blurb">{blurb}</p> : null}
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
    </TrainingScreenShell>
  );
}
