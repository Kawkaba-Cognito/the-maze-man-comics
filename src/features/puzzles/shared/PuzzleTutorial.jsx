import React, { useState } from 'react';
import MazeManAvatar from '../../training/shared/MazeManAvatar';
import { TUTORIAL_UI } from './tutorialContent';

export default function PuzzleTutorial({ steps, isAr, onClose, playSfx }) {
  const t = TUTORIAL_UI[isAr ? 'ar' : 'en'];
  const [stepIdx, setStepIdx] = useState(0);
  const step = steps[stepIdx];
  const total = steps.length;

  if (!step || total === 0) return null;

  const skip = () => {
    playSfx?.('click');
    onClose?.();
  };
  const next = () => {
    playSfx?.('click');
    setStepIdx((s) => Math.min(s + 1, total - 1));
  };
  const back = () => {
    playSfx?.('click');
    setStepIdx((s) => Math.max(s - 1, 0));
  };
  const finish = () => {
    playSfx?.('win');
    onClose?.();
  };

  const mood =
    stepIdx === 0 ? 'ready' : stepIdx === total - 1 ? 'proud' : 'focused';

  return (
    <div className="ct-fq-tut-root ct-fq-tut-main" role="dialog" aria-modal="true" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="ct-fq-tut-backdrop" />
      <div className="ct-puzzle-tut-demo" aria-hidden="true">
        <span className="ct-puzzle-tut-demo-icon">{step.icon ?? '?'}</span>
      </div>
      <div className="ct-fq-tut-dock">
        <div className="ct-fq-tut-dock-mm">
          <MazeManAvatar size={92} mood={mood} glow />
        </div>
        <div className="ct-fq-tut-bubble">
          <div className="ct-fq-tut-bubble-progress" aria-live="polite">
            {t.progress(stepIdx + 1, total)}
          </div>
          <h3 className="ct-fq-tut-bubble-title">{step.title}</h3>
          <p className="ct-fq-tut-bubble-text">{step.body}</p>
          <div className="ct-fq-tut-bubble-actions">
            {stepIdx === 0 && (
              <>
                <button type="button" className="ct-fq-tut-btn ct-fq-tut-btn-ghost" onClick={skip}>
                  {t.skip}
                </button>
                <button type="button" className="ct-fq-tut-btn ct-fq-tut-btn-pri" onClick={next}>
                  {t.start}
                </button>
              </>
            )}
            {stepIdx > 0 && stepIdx < total - 1 && (
              <>
                <button type="button" className="ct-fq-tut-btn ct-fq-tut-btn-ghost" onClick={skip}>
                  {t.skip}
                </button>
                <button type="button" className="ct-fq-tut-btn ct-fq-tut-btn-ghost" onClick={back}>
                  {t.back}
                </button>
                <button type="button" className="ct-fq-tut-btn ct-fq-tut-btn-pri" onClick={next}>
                  {t.next}
                </button>
              </>
            )}
            {stepIdx === total - 1 && (
              <button type="button" className="ct-fq-tut-btn ct-fq-tut-btn-pri" onClick={finish}>
                {t.done}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
