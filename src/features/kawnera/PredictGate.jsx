import React, { useState } from 'react';
import ChapterFigure from './ChapterFigures';

/*
 * The prediction gate — the first thing you meet in an authored chapter.
 *
 * You commit a guess before reading anything. Then the real result.
 *
 * This is the pretesting effect (Richland, Kornell & Kao; Potts & Shanks):
 * generating an answer BEFORE being taught improves retention of the correct
 * answer more than studying alone does — and it works even, especially, when
 * the guess is wrong. Psychology suits it unusually well because its findings
 * are counterintuitive, so the gap between expectation and result is wide
 * enough to feel.
 *
 * Two deliberate design choices:
 *   · You cannot see the answer without choosing. A gate you can skip is a
 *     paragraph, and a paragraph does not produce the effect.
 *   · Being wrong is framed as the useful outcome, not the failure. That is not
 *     encouragement — it is what the literature actually says.
 */
export default function PredictGate({ predict, accent, figure, onDone }) {
  const [picked, setPicked] = useState(null);
  const revealed = picked !== null;
  const right = picked === predict.answer;

  return (
    <section className="predictGate" style={{ '--accent': accent }}>
      <small>BEFORE YOU READ · MAKE A GUESS</small>
      <p className="setup">{predict.setup}</p>
      <h2>{predict.question}</h2>

      <div className="predictOpts">
        {predict.options.map((o, i) => {
          const state = !revealed
            ? ''
            : i === predict.answer
              ? ' correct'
              : i === picked
                ? ' wrong'
                : ' faded';
          return (
            <button
              key={i}
              type="button"
              className={`predictOpt${state}`}
              disabled={revealed}
              onClick={() => { setPicked(i); onDone?.(i === predict.answer); }}
            >
              {o}
            </button>
          );
        })}
      </div>

      {revealed && (
        <div className="predictReveal">
          <b>{right ? 'You had it' : 'Most people guess wrong here'}</b>
          {/* The number you just guessed, as a picture. Guess → see the gap →
              read why: pretesting and dual coding in one move. */}
          {figure && <div className="predictFigure"><ChapterFigure figure={figure} /></div>}
          <p>{predict.reveal}</p>
          {!right && (
            <small>
              Guessing wrong first and then seeing the answer is a better way to
              remember it than reading the answer cold. That is the point of the guess.
            </small>
          )}
        </div>
      )}
    </section>
  );
}
