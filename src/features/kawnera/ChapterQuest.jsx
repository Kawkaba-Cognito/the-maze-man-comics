import React, { useEffect, useMemo, useRef, useState } from 'react';
import Kawkab3D from './Kawkab3D';
import PredictGate from './PredictGate';
import { refsFor, sourceSection } from './kawkabRefs';
import ChapterFigure from './ChapterFigures';
import { recordLearned } from '../universe/learningStore';

/*
 * A chapter, run as a guided expedition with Dr. Kawkab.
 *
 * WHY A RUN AND NOT A PAGE
 * ------------------------
 * The scrollable chapter is complete and it is still a wall of text — you can
 * reach the bottom having read every word and retrieved none of it. This turns
 * the same content into stages you move THROUGH, which buys three things that
 * the page could not:
 *
 *   1. Retrieval is unavoidable. Checks sit BETWEEN groups of sections rather
 *      than in a modal you may never open, so you are tested while the material
 *      is still warm instead of at the end, when it is too late to matter.
 *   2. Spacing falls out of the structure. Two or three sections, then a check
 *      on what you just read — that is distributed practice inside one sitting,
 *      not a separate revision session nobody does.
 *   3. Difficulty gets framed. Dr. Kawkab says in advance when a chapter is
 *      genuinely hard. A reader who knows that reads differently from one who
 *      assumes they are just slow.
 *
 * The point tally is deliberately quiet. It marks progress; it is not the
 * reason to be here, and making it loud would train people to optimise the
 * score rather than the understanding.
 */

// Sections per leg before a checkpoint. Two or three is short enough that the
// material is still in mind, long enough that the check is not trivial.
const LEG = 2;

/** Build the ordered stages for one chapter. */
function buildStages(ch) {
  const stages = [{ kind: 'guess' }, { kind: 'brief' }];

  const legs = [];
  for (let i = 0; i < ch.sections.length; i += LEG) {
    legs.push(ch.sections.slice(i, i + LEG));
  }

  // Interleave: read a leg, then answer something about what you just read.
  // Any checks left over after the legs run out are held back for the test.
  legs.forEach((sections, i) => {
    stages.push({ kind: 'read', sections, leg: i + 1, legs: legs.length });
    if (ch.checks[i]) stages.push({ kind: 'check', check: ch.checks[i], n: i });
  });

  stages.push({ kind: 'trap' });
  ch.checks.slice(legs.length).forEach((check, i) => {
    stages.push({ kind: 'check', check, n: legs.length + i });
  });
  stages.push({ kind: 'verdict' });
  return stages;
}

/*
 * What Dr. Kawkab says when he reacts. Kept short — a mentor who delivers a
 * paragraph every time you tap something stops being read.
 */
const REACTIONS = {
  right: [
    'That is the one.',
    'Exactly that.',
    'Good — you were following the argument, not the wording.',
    'Yes. That distinction is the one that matters.',
  ],
  wrong: [
    'Not that one. Read what it says underneath — the mistake is the useful part.',
    'No, but it is the tempting answer, which is why it is there.',
    'Not quite. Look at what it actually claims.',
  ],
};

export default function ChapterQuest({
  chapter, chapters, book, chapterTitle, chapterNo, onExit, onOpenLab, awardPoints, onDone,
}) {
  const stages = useMemo(() => buildStages(chapter), [chapter]);
  const [at, setAt] = useState(0);
  const [answers, setAnswers] = useState({});
  const [guessRight, setGuessRight] = useState(null);
  const [act, setAct] = useState(null);
  const [say, setSay] = useState(null);
  const [detour, setDetour] = useState(null);
  const topRef = useRef(null);

  // `at` on the act makes the same reaction repeatable — two right answers in a
  // row should both get a cheer, not one cheer and then silence.
  const react = (name, line) => {
    setAct({ name, at: Date.now() });
    if (line !== undefined) setSay(line);
  };
  const pick = (list) => list[Math.floor(Math.random() * list.length)];

  // He greets you when the chapter opens, and only then. Intentionally runs
  // once on mount — `react` is stable enough for this and re-greeting on every
  // state change would make him twitch.
  useEffect(() => { setAct({ name: 'greet', at: Date.now() }); }, []);

  const stage = stages[at];
  const total = stages.length;
  const checkStages = stages.filter((s) => s.kind === 'check');
  const correct = Object.values(answers).filter((a) => a.right).length;

  const go = (next) => {
    setAt(next);
    setSay(null);
    const s = stages[next];
    if (s?.kind === 'verdict') {
      const all = stages.filter((x) => x.kind === 'check').length;
      const got = Object.values(answers).filter((a) => a.right).length;
      react(got === all ? 'triumph' : got > all / 2 ? 'celebrate' : 'agree');
      // Reaching the verdict is what puts this chapter in your sky — and a
      // repeat visit counts as a review, which lengthens its half-life.
      recordLearned(book.id, chapterNo - 1, all ? got / all : null);
      onDone?.();
    } else if (s?.kind === 'trap') {
      react('think');
    }
    topRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  // Terms from earlier chapters that turn up in what you are reading now.
  const refs = stage?.kind === 'read' ? refsFor(stage.sections, chapters, chapterNo - 1) : [];

  const openDetour = (r) => {
    react('lead', null);
    setDetour({ ...r, section: sourceSection(chapters, r.fromIndex, r.term) });
  };

  const answer = (n, picked, isRight) => {
    if (answers[n]) return;
    const next = { ...answers, [n]: { picked, right: isRight } };
    setAnswers(next);
    if (isRight) {
      awardPoints?.(2);
      // A run of three earns the big one. Celebrating everything equally means
      // celebrating nothing.
      const streak = Object.values(next).filter((a) => a.right).length;
      react(streak >= 3 ? 'triumph' : 'cheer', pick(REACTIONS.right));
    } else {
      react('puzzled', pick(REACTIONS.wrong));
    }
  };

  const mentorLine = () => {
    const m = chapter.mentor;
    if (!m) return null;
    if (stage.kind === 'guess') return m.open;
    if (stage.kind === 'trap') return m.trap;
    if (stage.kind === 'verdict') return m.close;
    if (stage.kind === 'read' && stage.leg === Math.ceil(stage.legs / 2)) return m.mid;
    return null;
  };
  const line = mentorLine();

  return (
    <div className="quest" style={{ '--accent': book.color }}>
      <span ref={topRef} aria-hidden="true" />

      <header className="questTop">
        <button type="button" className="questBack" onClick={onExit}>
          ← {book.code} contents
        </button>
        <div className="questWhere">
          <small>
            CHAPTER {String(chapterNo).padStart(2, '0')} · STAGE {at + 1} / {total}
          </small>
          <strong>{chapterTitle}</strong>
        </div>
        <div className="questScore" title="Checkpoints answered correctly">
          {correct}/{checkStages.length}
        </div>
      </header>

      <div className="questBar" aria-hidden="true">
        <i style={{ width: `${((at + 1) / total) * 100}%` }} />
      </div>

      {/* He is always present now, not only at the four scripted beats — he
          reacts to what you do, and `say` overrides the chapter line when he
          has something immediate to add. */}
      <aside className={`questMentor${say ? ' reacting' : ''}`}>
        <div className="questMentorFace">
          <Kawkab3D active mentor act={act} />
        </div>
        <div className="questMentorSay">
          <b>DR. KAWKAB</b>
          <p>{say || line || 'Take your time. I am here for the whole chapter.'}</p>

          {/* "We built that earlier — want me to show you?" */}
          {refs.length > 0 && !say && (
            <div className="questRefs">
              {refs.map((r) => (
                <button key={r.term} type="button" onClick={() => openDetour(r)}>
                  <b>{r.term}</b> — we built this in Chapter {r.from}. Show me →
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      {detour && (
        <Detour
          detour={detour}
          chapterNo={chapterNo}
          onBack={() => { setDetour(null); react('agree', null); }}
        />
      )}

      <main className="questStage">
        {stage.kind === 'guess' && (
          <PredictGate
            predict={chapter.predict}
            accent={book.color}
            figure={chapter.figures?.reveal}
            onDone={(right) => setGuessRight(right)}
          />
        )}

        {stage.kind === 'brief' && (
          <section className="questBrief">
            <small>THE QUESTION THIS CHAPTER ANSWERS</small>
            <h2>{chapter.question}</h2>
            <p>{chapter.summary}</p>
            <div className="questTerms">
              <small>TERMS YOU WILL MEET — {chapter.terms.length}</small>
              <p>{chapter.terms.map((t) => t.term).join(' · ')}</p>
            </div>
          </section>
        )}

        {stage.kind === 'read' && (
          <section className="questRead">
            <div className="questLeg">
              PART {stage.leg} OF {stage.legs}
            </div>
            {stage.sections.map((s, i) => (
              <article key={i}>
                <header>
                  <span>{s.n}</span>
                  <h3>{s.title}</h3>
                </header>
                <p>{s.body}</p>
                {s.points && (
                  <ul>{s.points.map((p, j) => <li key={j}>{p}</li>)}</ul>
                )}
                {/* A figure sits with the section it explains, not in a
                    gallery — split attention costs more than it buys. */}
                <ChapterFigure figure={chapter.figures?.inline?.[s.n]} />
              </article>
            ))}
          </section>
        )}

        {stage.kind === 'check' && (
          <Check
            check={stage.check}
            given={answers[stage.n]}
            onAnswer={(picked, right) => answer(stage.n, picked, right)}
          />
        )}

        {stage.kind === 'trap' && (
          <Trap misconception={chapter.misconception} />
        )}

        {stage.kind === 'verdict' && (
          <section className="questVerdict">
            <small>CHAPTER COMPLETE</small>
            <strong>
              {correct}
              <i> / {checkStages.length}</i>
            </strong>
            <p className="questTakeaway">{chapter.takeaway}</p>

            {guessRight === false && (
              <p className="questNote">
                You guessed wrong at the start — which, as Dr. Kawkab said, is the version
                that sticks better than reading the answer cold.
              </p>
            )}

            <div className="questRecall">
              <small>CARRY THESE OUT — TRY THEM WITHOUT LOOKING BACK</small>
              <ol>{chapter.recall.map((r, i) => <li key={i}>{r}</li>)}</ol>
            </div>

            <div className="questGlossary">
              <small>YOUR NOTES</small>
              <dl>
                {chapter.terms.map((t, i) => (
                  <React.Fragment key={i}>
                    <dt>{t.term}</dt>
                    <dd>{t.meaning}</dd>
                  </React.Fragment>
                ))}
              </dl>
            </div>

            <div className="questEnd">
              <button type="button" className="questGo" onClick={onOpenLab}>
                Take it to the lab →
              </button>
              <button type="button" className="questAlt" onClick={onExit}>
                Back to contents
              </button>
            </div>
          </section>
        )}
      </main>

      {stage.kind !== 'verdict' && (
        <nav className="questNav">
          <button type="button" disabled={at === 0} onClick={() => go(at - 1)}>
            ← Back
          </button>
          <button
            type="button"
            className="questGo"
            // A checkpoint must be answered before you move on: skippable
            // retrieval is not retrieval.
            disabled={stage.kind === 'check' && !answers[stage.n]}
            onClick={() => go(at + 1)}
          >
            {stage.kind === 'check' && !answers[stage.n] ? 'Choose an answer' : 'Continue →'}
          </button>
        </nav>
      )}
    </div>
  );
}

/*
 * The detour — Dr. Kawkab taking you back to where an idea was built.
 *
 * A full takeover rather than a tooltip, because the point is that you have
 * genuinely gone somewhere: the definition AND the section that introduced it,
 * so the term is re-met in its argument rather than as a flashcard. Quest state
 * is held behind it, so "take me back" returns you to the exact stage — going
 * back to check something should never cost you your place, or nobody will.
 */
function Detour({ detour, chapterNo, onBack }) {
  return (
    <div className="questDetour" role="dialog" aria-modal="true">
      <div className="questDetourCard">
        <header>
          <div className="questDetourFace">
            <Kawkab3D active mentor act={{ name: 'lead', at: 0 }} />
          </div>
          <div>
            <small>DR. KAWKAB IS TAKING YOU BACK</small>
            <h2>Chapter {detour.from}</h2>
            <p>You met this before reaching Chapter {chapterNo}. Here is where.</p>
          </div>
        </header>

        <div className="questDetourTerm">
          <b>{detour.term}</b>
          <p>{detour.meaning}</p>
        </div>

        {detour.section && (
          <div className="questDetourSection">
            <span>{detour.section.n}</span>
            <h3>{detour.section.title}</h3>
            <p>{detour.section.body}</p>
          </div>
        )}

        <button type="button" className="questGo" onClick={onBack}>
          Take me back →
        </button>
      </div>
    </div>
  );
}

/** One checkpoint. Every option explains itself once chosen. */
function Check({ check, given, onAnswer }) {
  const picked = given?.picked ?? null;
  const done = picked !== null;
  return (
    <section className="questCheck">
      <small>CHECKPOINT</small>
      <h2>{check.q}</h2>
      <div className="questOpts">
        {check.options.map((o, i) => {
          const state = !done ? '' : o.ok ? ' correct' : i === picked ? ' wrong' : ' faded';
          return (
            <button
              key={i}
              type="button"
              className={`questOpt${state}`}
              disabled={done}
              onClick={() => onAnswer(i, !!o.ok)}
            >
              <span>{String.fromCharCode(65 + i)}</span>
              <p>{o.t}</p>
            </button>
          );
        })}
      </div>
      {done && (
        <div className={given.right ? 'questWhy right' : 'questWhy'}>
          <b>{given.right ? 'THAT IS IT' : 'NOT THIS ONE'}</b>
          <p>{check.options[picked].why}</p>
          {!given.right && (
            <p className="questAnswer">
              <b>The answer: </b>
              {check.options.find((o) => o.ok).t}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

/** The misconception, staged as a challenge rather than a paragraph. */
function Trap({ misconception }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="questTrap">
      <small>THE TRAP</small>
      <h2>Most people finish this chapter believing:</h2>
      <blockquote>“{misconception.believed}”</blockquote>
      {!open ? (
        <button type="button" className="questGo" onClick={() => setOpen(true)}>
          Why is that wrong?
        </button>
      ) : (
        <p className="questTrapWhy">{misconception.actually}</p>
      )}
    </section>
  );
}
