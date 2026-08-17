import React from 'react';
import { IconBack, IconPause } from './TrainingIcons';

/** Comic training chrome — back / pause icon buttons (Rush Hour play style). */
/*
 * ⚠ Every handler in this file calls playSfx OPTIONALLY.
 *
 * These were bare `playSfx('click')`. playSfx is an optional prop, and Rush
 * Hour and Arrow Rush never passed one — so the handler threw a TypeError
 * BEFORE running onMenu/onPause and their back and pause buttons were simply
 * dead. No error surfaced to the player; the button just did nothing.
 *
 * A shared control must never be armed by an optional prop. If you add a
 * handler here, use ?. — the sound is a garnish, the navigation is not.
 */
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
          playSfx?.('click');
          onBack();
        }}
      >
        <IconBack size={18} c="currentColor" />
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
            playSfx?.('click');
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

/**
 * THE in-game header: back (menu), a middle, and pause or tutorial (?).
 *
 * ── Two content modes ─────────────────────────────────────────────────────
 *   title    <TrainingPlayHeader title="Detective" subtitle="Level 100" … />
 *   stats    <TrainingPlayHeader>{…live counters…}</TrainingPlayHeader>
 *
 * Both render the identical frame — same width, same back glyph in the same
 * place, same pause on the right. Only the middle differs. Cancellation needs
 * lives and a found-counter in the bar; Story Time needs a title; neither
 * should have to invent a header to get one.
 *
 * ── Why the modes were added (2026-08-17) ─────────────────────────────────
 * This component already existed and was already correct. The problem was that
 * games were not using it: the in-game back button had drifted into four
 * treatments, and no gate checked it, so `keep-track` scored 22/22 while
 * looking nothing like `story-grid`.
 *
 *   ct-training-play-header  7 games  — this component's frame, hand-rolled
 *   PlayHud / ct-fq-bar      4 games  — full width, CARD BACKGROUND, radius
 *   TrainingMenuBar          6 games  — a LOBBY bar used mid-play, pad 18px
 *   hand-rolled              2 games  — intercept, paired-associates
 *
 * The glyph differed too: story-grid and detective drew a text ‹, everything
 * built on TrainingChromeBtn drew IconBack.
 *
 * The lobby/play distinction is semantic, not stylistic, so CSS alone could not
 * fix it — `ct-training-menubar` is the right class in a hub and the wrong one
 * in play. PlayHud now renders its stats INSIDE this frame rather than beside
 * a second one.
 *
 * ⚠ The frame is TRANSPARENT on purpose. It is `max-width: 420px; margin: 0
 * auto`, and CLAUDE.md records what phone-width centred chrome with a fill does
 * on a wider viewport: it renders as a rectangle floating at the top of the
 * screen. Puzzle Studio shipped exactly that, because it looks fine on a phone.
 */
export function TrainingPlayHeader({
  isAr,
  title,
  subtitle,
  children,
  onMenu,
  onPause,
  onTutorial,
  pauseAriaLabel = 'Pause',
  menuAriaLabel = 'Menu',
  tutorialAriaLabel = 'How to play',
  playSfx,
  className = '',
  style,
}) {
  return (
    <header className={`ct-training-play-header${className ? ` ${className}` : ''}`} style={style}>
      {onMenu ? (
        <TrainingChromeBtn
          ariaLabel={menuAriaLabel}
          onClick={() => {
            playSfx?.('click');
            onMenu();
          }}
        >
          <IconBack size={18} c="currentColor" />
        </TrainingChromeBtn>
      ) : (
        <div className="ct-training-chrome-spacer" aria-hidden="true" />
      )}
      <div className="ct-training-play-header-body">
        {children ?? (
          <>
            <div
              className="ct-training-play-title"
              style={{
                fontFamily: isAr ? "'Cairo', sans-serif" : "'Outfit', system-ui, sans-serif",
                fontWeight: isAr ? 900 : 400,
                letterSpacing: isAr ? 0 : 1,
              }}
            >
              {title}
            </div>
            {subtitle ? <div className="ct-training-play-sub">{subtitle}</div> : null}
          </>
        )}
      </div>
      {onTutorial ? (
        <TrainingChromeBtn
          ariaLabel={tutorialAriaLabel}
          title={tutorialAriaLabel}
          className="ct-training-chrome-btn--tutorial"
          onClick={() => {
            playSfx?.('click');
            onTutorial();
          }}
        >
          <span aria-hidden="true">?</span>
        </TrainingChromeBtn>
      ) : onPause ? (
        <TrainingChromeBtn
          ariaLabel={pauseAriaLabel}
          onClick={() => {
            playSfx?.('click');
            onPause();
          }}
        >
          <IconPause size={17} c="currentColor" />
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
            fontFamily: isAr ? "'Cairo', sans-serif" : "'Outfit', system-ui, sans-serif",
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
            playSfx?.('click');
            onStart();
          }}
        >
          {startLabel}
        </button>
      </div>
    </div>
  );
}
