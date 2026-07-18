import React from 'react';
import { IconBack, IconPause } from './TrainingIcons';

/** Comic training chrome — back / pause icon buttons (Rush Hour play style). */
export function TrainingChromeBtn({
  type = 'button',
  className = '',
  ariaLabel,
  title,
  onClick,
  children,
}) {
  return (
    <button
      type={type}
      className={`ct-training-chrome-btn${className ? ` ${className}` : ''}`}
      onClick={onClick}
      aria-label={ariaLabel}
      title={title}
    >
      {children}
    </button>
  );
}

/** Hub / lobby top bar — back, centered title, optional tutorial replay. */
export function TrainingMenuBar({
  onBack,
  playSfx,
  center,
  hubSpaced = false,
  onReplayTutorial,
  replayHint,
  variant = 'comic',
}) {
  const isPaper = variant === 'paper';
  return (
    <div
      className={`ct-training-menubar${hubSpaced ? ' ct-training-menubar--hub' : ''}${isPaper ? ' ct-training-menubar--paper' : ''}`}
    >
      <TrainingChromeBtn
        ariaLabel="Back"
        className={isPaper ? 'ct-training-chrome-btn--paper' : ''}
        onClick={() => {
          playSfx('click');
          onBack();
        }}
      >
        <IconBack size={18} c={isPaper ? '#3a3228' : '#141210'} />
      </TrainingChromeBtn>
      <div className="ct-training-menubar-center" role="presentation">
        {center}
      </div>
      {onReplayTutorial ? (
        <TrainingChromeBtn
          ariaLabel={replayHint || 'Replay tutorial'}
          title={replayHint || 'Replay tutorial'}
          className={
            isPaper
              ? 'ct-training-chrome-btn--paper ct-training-chrome-btn--tutorial'
              : 'ct-training-chrome-btn--tutorial'
          }
          onClick={() => {
            playSfx('click');
            onReplayTutorial();
          }}
        >
          <span aria-hidden="true">?</span>
        </TrainingChromeBtn>
      ) : (
        <div className="ct-training-chrome-spacer" aria-hidden="true" />
      )}
    </div>
  );
}

/** In-game header: back (menu), title, optional pause or tutorial (?). */
export function TrainingPlayHeader({
  isAr,
  title,
  subtitle,
  onMenu,
  onPause,
  onTutorial,
  pauseAriaLabel = 'Pause',
  menuAriaLabel = 'Menu',
  tutorialAriaLabel = 'How to play',
  playSfx,
}) {
  return (
    <header className="ct-training-play-header">
      {onMenu ? (
        <TrainingChromeBtn
          ariaLabel={menuAriaLabel}
          onClick={() => {
            playSfx('click');
            onMenu();
          }}
        >
          <IconBack size={18} c="#141210" />
        </TrainingChromeBtn>
      ) : (
        <div className="ct-training-chrome-spacer" aria-hidden="true" />
      )}
      <div className="ct-training-play-header-body">
        <div
          className="ct-training-play-title"
          style={{
            fontFamily: isAr ? "'Cairo', sans-serif" : "'Fredoka One', cursive",
            fontWeight: isAr ? 900 : 400,
            letterSpacing: isAr ? 0 : 1,
          }}
        >
          {title}
        </div>
        {subtitle ? <div className="ct-training-play-sub">{subtitle}</div> : null}
      </div>
      {onTutorial ? (
        <TrainingChromeBtn
          ariaLabel={tutorialAriaLabel}
          title={tutorialAriaLabel}
          className="ct-training-chrome-btn--tutorial"
          onClick={() => {
            playSfx('click');
            onTutorial();
          }}
        >
          <span aria-hidden="true">?</span>
        </TrainingChromeBtn>
      ) : onPause ? (
        <TrainingChromeBtn
          ariaLabel={pauseAriaLabel}
          onClick={() => {
            playSfx('click');
            onPause();
          }}
        >
          <IconPause size={17} c="#141210" />
        </TrainingChromeBtn>
      ) : (
        <div className="ct-training-chrome-spacer" aria-hidden="true" />
      )}
    </header>
  );
}

export function TrainingPauseModal({
  open,
  labels,
  onResume,
  onRestart,
  onQuitMenu,
  showRestart = true,
}) {
  if (!open) return null;
  return (
    <div className="ct-training-ov" role="dialog" aria-modal="true" aria-labelledby="training-pause-title">
      <div className="ct-training-modal ct-training-modal--pause">
        <h2 id="training-pause-title" className="ct-training-modal-title">
          {labels.paused}
        </h2>
        <div className="ct-training-modal-actions">
          <button type="button" className="ct-training-btn ct-training-btn--pri" onClick={onResume}>
            {labels.resume}
          </button>
          {showRestart && onRestart ? (
            <button type="button" className="ct-training-btn ct-training-btn--ghost" onClick={onRestart}>
              {labels.restart}
            </button>
          ) : null}
          <button type="button" className="ct-training-btn ct-training-btn--ghost" onClick={onQuitMenu}>
            {labels.quitMenu}
          </button>
        </div>
      </div>
    </div>
  );
}

export function TrainingQuitModal({
  open,
  labels,
  onConfirmQuit,
  onKeepPlaying,
}) {
  if (!open) return null;
  return (
    <div className="ct-training-ov" role="dialog" aria-modal="true" aria-labelledby="training-quit-title">
      <div className="ct-training-modal ct-training-modal--quit">
        <h2 id="training-quit-title" className="ct-training-modal-title">
          {labels.quitQ}
        </h2>
        <p className="ct-training-modal-text">{labels.quitLose}</p>
        <div className="ct-training-modal-actions">
          <button type="button" className="ct-training-btn ct-training-btn--warn" onClick={onConfirmQuit}>
            {labels.yesQuit}
          </button>
          <button type="button" className="ct-training-btn ct-training-btn--ghost" onClick={onKeepPlaying}>
            {labels.keep}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Pass-and-play handoff — clearer than generic ct-fq-box ready screen. */
export function TrainingChallengeHandoff({
  isAr,
  kicker,
  playerName,
  roundLine,
  metaLine,
  instruction,
  bullets = [],
  startLabel,
  onStart,
  playSfx,
}) {
  return (
    <div className="ct-training-ov ct-training-ov--handoff" role="dialog" aria-modal="true">
      <div className="ct-training-handoff" dir={isAr ? 'rtl' : 'ltr'}>
        {roundLine ? <p className="ct-training-handoff-round">{roundLine}</p> : null}
        <p className="ct-training-handoff-kicker">{kicker}</p>
        <h2
          className="ct-training-handoff-name"
          style={{
            fontFamily: isAr ? "'Cairo', sans-serif" : "'Fredoka One', cursive",
            fontWeight: isAr ? 900 : 400,
          }}
        >
          {playerName}
        </h2>
        {metaLine ? <p className="ct-training-handoff-meta">{metaLine}</p> : null}
        <p className="ct-training-handoff-instruction">{instruction}</p>
        {bullets.length > 0 ? (
          <ul className="ct-training-handoff-bullets">
            {bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        ) : null}
        <button
          type="button"
          className="ct-training-btn ct-training-btn--start"
          onClick={() => {
            playSfx('click');
            onStart();
          }}
        >
          {startLabel}
        </button>
      </div>
    </div>
  );
}
