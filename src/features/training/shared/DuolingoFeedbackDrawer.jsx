import React from 'react';
import { Check, X } from '@phosphor-icons/react';
import { useApp } from '../../../context/AppContext';

/**
 * DuolingoFeedbackDrawer
 * Signature bottom tray sliding up on user answer/action:
 * - Green for correct with "أحسنت!" and continue button
 * - Red for incorrect with reason and continue button
 */
export default function DuolingoFeedbackDrawer({
  isOpen = false,
  isCorrect = true,
  title,
  subtitle,
  buttonLabel,
  onContinue,
}) {
  const { currentLang, playSfx } = useApp();
  const isAr = currentLang === 'ar';

  if (!isOpen) return null;

  const defaultTitle = isCorrect
    ? (isAr ? 'أحسنت! إجابة صحيحة' : 'Excellent!')
    : (isAr ? 'ليست صحيحة تماماً' : 'Not quite!');

  const defaultBtnLabel = isAr ? 'متابعة' : 'Continue';

  return (
    <div className={`duo-feedback-drawer ${isCorrect ? 'is-correct' : 'is-wrong'}`} dir={isAr ? 'rtl' : 'ltr'}>
      <div className="duo-feedback-info">
        <div className="duo-feedback-badge">
          {isCorrect ? (
            <Check size={32} weight="bold" color="#58CC02" />
          ) : (
            <X size={32} weight="bold" color="#FF4B4B" />
          )}
        </div>
        <div>
          <h3 className="duo-feedback-title">{title || defaultTitle}</h3>
          {subtitle && <p className="duo-feedback-subtitle">{subtitle}</p>}
        </div>
      </div>

      <button
        type="button"
        className="duo-btn-continue"
        onClick={() => {
          playSfx?.('tap');
          onContinue?.();
        }}
      >
        {buttonLabel || defaultBtnLabel}
      </button>
    </div>
  );
}
