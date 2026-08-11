import React from 'react';
import { assetUrl } from '../../../lib/assetUrl';
import { TrainingMenuBar } from './TrainingChrome';

const SURVIVAL_PLANET = assetUrl('Assets/mode-planets/survival.webp');

/**
 * Shared "Survival mode" intro shown before a Survival run in every game, so the
 * pre-game explainer looks identical platform-wide. Games pass an `onReady`
 * (start the run) and `onBack` (return to the hub). `title`/`body` default to a
 * generic Survival explanation but can be overridden per game. The planet is
 * deliberately shared with the Survival button in the mode hub, so entering
 * the mode has one continuous visual identity in every training game.
 */
export default function SurvivalIntro({ isAr, playSfx, onReady, onBack, title, body }) {
  const tTitle = title ?? (isAr ? 'وضع البقاء' : 'Survival mode');
  const tBody =
    body ??
    (isAr
      ? 'تدريبٌ لا ينتهي يتكيّف معك — يزداد صعوبةً كلّما تحسّنت. لا خطّ نهاية هنا، فاذهب أبعد ما تستطيع.'
      : 'Endless practice that adapts to you — it ramps up as you improve. There’s no finish line, so just go as far as you can.');
  const tReady = isAr ? 'ابدأ' : 'Start';

  return (
    <div
      className="ct-fq-training-shell ct-fq-training-shell--hub-light"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="ct-fq-screen ct-fq-training-screen ct-survival-intro">
        <TrainingMenuBar variant="paper" playSfx={playSfx} onBack={onBack} center={null} />
        <div className="ct-survival-intro-body">
          <div
            className="ct-mph-planet-orb ct-survival-intro-planet"
            style={{ '--mph-accent': 'var(--color-amber)' }}
            aria-hidden="true"
          >
            <span className="ct-mph-planet-glow" />
            <span className="ct-mph-planet-ring" />
            <img src={SURVIVAL_PLANET} alt="" className="ct-mph-planet-img" draggable={false} />
            <span className="ct-mph-planet-shade" />
          </div>
          <h2 className="ct-survival-intro-title">{tTitle}</h2>
          <p className="ct-survival-intro-text">{tBody}</p>
        </div>
        <button
          type="button"
          className="ct-survival-intro-go"
          onClick={() => {
            playSfx?.('click');
            onReady?.();
          }}
        >
          {tReady}
        </button>
      </div>
    </div>
  );
}
