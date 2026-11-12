import React, { useState, useCallback } from 'react';
import { ArrowRight, ArrowLeft } from '@phosphor-icons/react';
import { useApp } from '../../context/AppContext';
import { assetUrl } from '../../lib/assetUrl';

/**
 * Minimalist Nayzak Door Stage:
 * - Clean cartoon scene: Nayzak standing beside the wooden training door.
 * - Zero cluttered speech bubbles or extra plaques.
 * - Tapping the door, character, or action pill enters Training.
 */
export default function NayzakDoorStage({ onOpenTraining }) {
  const { currentLang, playSfx } = useApp();
  const isAr = currentLang === 'ar';

  const [doorOpen, setDoorOpen] = useState(false);

  const handleDoorClick = useCallback(() => {
    if (doorOpen) return;
    playSfx?.('whoosh');
    setDoorOpen(true);
    setTimeout(() => {
      onOpenTraining?.();
      setDoorOpen(false);
    }, 420);
  }, [doorOpen, playSfx, onOpenTraining]);

  return (
    <div className="nayzak-door-stage" aria-label={isAr ? 'بوابة التدريب' : 'Training Door'}>
      {/* Door + Nayzak Clean Lockup */}
      <div className="door-scene-container">
        <div
          className={`cartoon-door-frame ${doorOpen ? 'is-open' : ''}`}
          onClick={handleDoorClick}
          role="button"
          tabIndex={0}
          aria-label={isAr ? 'افتح الباب للدخول إلى التدريب' : 'Open door to enter training'}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleDoorClick(); }}
        >
          <div className="door-interior-glow">
            <span className="door-interior-stars">✦</span>
          </div>

          <div className="cartoon-door-leaf">
            <div className="door-inset-panel door-inset-top" />
            <div className="door-inset-panel door-inset-bottom" />
            <div className="door-knob">
              <span className="door-knob-glint" />
            </div>
            <div className="door-keyhole" />
          </div>
        </div>

        <div
          className="door-nayzak-standing"
          onClick={handleDoorClick}
          role="button"
          tabIndex={0}
          aria-label={isAr ? 'نيزك عند الباب' : 'Nayzak at the door'}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleDoorClick(); }}
        >
          <img
            src={assetUrl('Assets/cartoon/nayzak_unified_presenter.png')}
            alt={isAr ? 'نيزك عند الباب' : 'Nayzak at the door'}
            className="door-nayzak-img"
            draggable="false"
          />
          <div className="door-nayzak-shadow" aria-hidden="true" />
        </div>
      </div>

      {/* Single Clean Minimalist CTA */}
      <button
        type="button"
        className="door-cta-btn"
        onClick={handleDoorClick}
      >
        <span>{isAr ? 'ادخل للتدريب' : 'Enter Training'}</span>
        {isAr ? <ArrowLeft size={16} weight="bold" /> : <ArrowRight size={16} weight="bold" />}
      </button>
    </div>
  );
}
