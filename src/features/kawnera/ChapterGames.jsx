import React, { useMemo, useState } from 'react';
import { makeRng } from '../../lib/rng';

/*
 * Chapter games — training-platform mechanics, pointed at a chapter.
 *
 * The training side of this app has spent a long time working out which
 * interactions actually exercise a cognitive process rather than decorating
 * one. Three of them transfer here almost unchanged, and the test for each was
 * the same: does the DEMAND the game makes match the thing we want understood?
 *
 *   Story Time (memory/story-grid)   → SEQUENCE
 *     Story Time shuffles the beats of a story and asks you to restore the
 *     order. A chapter of Lavelle is also a sequence — an argument that builds —
 *     so scrambling its sections tests whether you followed the STRUCTURE, which
 *     no multiple-choice question does. Scoring is borrowed too: exact
 *     placements plus adjacent pairs, so a reader who shifted everything by one
 *     is scored differently from one who never had the shape.
 *     Tap-to-place, not drag — the same reason story-grid chose it: dragging on
 *     a phone turns a memory test into a motor test.
 *
 *   Detective (reasoning/detective)  → EVIDENCE
 *     Detective's core move is confronting a claim with the one piece of
 *     evidence that settles it. Here: given what a study DID, pick what it
 *     FOUND. Distractors are real findings from other studies in the same book,
 *     so it cannot be solved by picking the sciencey-sounding option.
 *
 *   Pair Match (memory/paired-associates) → PAIRS
 *     Term to meaning, which is what paired-associates trains. This is the one
 *     genuinely rote task of the three, and it is here because the vocabulary
 *     really does have to be automatic before the argument can be followed.
 *
 * A fourth was considered and rejected for now: a Wisconsin-style sort of
 * claims into Lavelle's four questions (what / why / when / how). It is the
 * best fit of all — it would make the reader practise the book's own method —
 * but unlike these three it needs new authored tagging per claim, so it is not
 * free. Noted rather than half-built.
 *
 * All three derive entirely from content that already exists in the authored
 * chapter, which is why they cost nothing per chapter to add.
 */

const shuffle = (list, rng) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/* ══ SEQUENCE ═══════════════════════════════════════════════════════════ */

/*
 * Borrowed wholesale from story-grid's scoreOrder: `exact` is the headline,
 * but a reader who shifted everything by one still remembered the sequence, so
 * we also report how many neighbouring PAIRS kept their true relative order.
 * That separates "misremembered the argument" from "fumbled one card".
 */
function scoreOrder(attempt, truth) {
  const exact = attempt.reduce((n, id, i) => n + (id === truth[i] ? 1 : 0), 0);
  let pairsOk = 0;
  let pairs = 0;
  for (let i = 0; i < attempt.length; i += 1) {
    for (let j = i + 1; j < attempt.length; j += 1) {
      pairs += 1;
      if (truth.indexOf(attempt[i]) < truth.indexOf(attempt[j])) pairsOk += 1;
    }
  }
  return { exact, total: truth.length, pairsOk, pairs };
}

export function SequenceGame({ chapter, seed, onScore }) {
  const truth = useMemo(() => chapter.sections.map((_, i) => i), [chapter]);
  const pool0 = useMemo(
    () => shuffle(truth, makeRng(seed ?? 1)),
    [truth, seed],
  );
  const [placed, setPlaced] = useState([]);
  const [done, setDone] = useState(false);

  const pool = pool0.filter((i) => !placed.includes(i));
  const result = done ? scoreOrder(placed, truth) : null;

  return (
    <div className="cgame">
      <p className="cgameHint">
        The chapter builds an argument in order. Put its parts back into the
        sequence Lavelle used.
      </p>

      <ol className="cgameSlots">
        {truth.map((_, i) => {
          const idx = placed[i];
          const ok = done && idx === truth[i];
          return (
            <li key={i} className={done ? (ok ? 'ok' : 'bad') : placed[i] != null ? 'filled' : ''}>
              <span>{i + 1}</span>
              {idx != null ? (
                <button
                  type="button"
                  disabled={done}
                  onClick={() => setPlaced((p) => p.filter((x) => x !== idx))}
                >
                  {chapter.sections[idx].title}
                </button>
              ) : (
                <em>—</em>
              )}
            </li>
          );
        })}
      </ol>

      {!done && pool.length > 0 && (
        <div className="cgamePool">
          {pool.map((i) => (
            <button
              type="button"
              key={i}
              onClick={() => setPlaced((p) => [...p, i])}
            >
              {chapter.sections[i].title}
            </button>
          ))}
        </div>
      )}

      {!done ? (
        <button
          type="button"
          className="cgameGo"
          disabled={placed.length !== truth.length}
          onClick={() => {
            const r = scoreOrder(placed, truth);
            setDone(true);
            onScore?.(r.exact, r.total);
          }}
        >
          {placed.length !== truth.length ? 'Place them all first' : 'Check the order'}
        </button>
      ) : (
        <div className="cgameResult">
          <b>
            {result.exact}/{result.total} in the right place
          </b>
          <p>
            {result.pairsOk}/{result.pairs} pairs kept their true order
            {result.exact < result.total && result.pairsOk / result.pairs > 0.8
              ? ' — you had the shape of the argument, just not every slot.'
              : ''}
          </p>
          <ol className="cgameTruth">
            {chapter.sections.map((s, i) => (
              <li key={i} className={placed[i] === i ? 'ok' : 'bad'}>
                <span>{s.n}</span>
                {s.title}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

/* ══ EVIDENCE ═══════════════════════════════════════════════════════════ */

export function EvidenceGame({ chapter, otherFindings = [], seed, onScore }) {
  const rounds = useMemo(() => {
    const rng = makeRng(seed ?? 7);
    return chapter.evidence.map((e, i) => {
      // Distractors are real findings from elsewhere in the book, so the
      // question cannot be answered by tone or plausibility alone.
      const wrong = shuffle(otherFindings.filter((f) => f !== e.found), rng).slice(0, 2);
      const opts = shuffle([e.found, ...wrong], makeRng((seed ?? 7) + i));
      return { study: e.study, did: e.did, opts, correct: opts.indexOf(e.found) };
    });
  }, [chapter, otherFindings, seed]);

  const [at, setAt] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);

  if (!rounds.length) return <p className="cgameHint">No studies recorded for this chapter.</p>;
  if (at >= rounds.length) {
    return (
      <div className="cgameResult">
        <b>{score}/{rounds.length}</b>
        <p>Matching a method to its result is the habit that stops you taking a claim on trust.</p>
      </div>
    );
  }

  const r = rounds[at];
  return (
    <div className="cgame">
      <p className="cgameHint">
        Study {at + 1} of {rounds.length} · what did it actually find?
      </p>
      <div className="cgameStudy">
        <small>{r.study}</small>
        <p>{r.did}</p>
      </div>
      <div className="cgameOpts">
        {r.opts.map((o, i) => {
          const state = picked === null ? '' : i === r.correct ? ' ok' : i === picked ? ' bad' : ' faded';
          return (
            <button
              key={i}
              type="button"
              className={`cgameOpt${state}`}
              disabled={picked !== null}
              onClick={() => {
                setPicked(i);
                if (i === r.correct) { setScore((s) => s + 1); onScore?.(1, 1); }
                else onScore?.(0, 1);
              }}
            >
              {o}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <button
          type="button"
          className="cgameGo"
          onClick={() => { setPicked(null); setAt((a) => a + 1); }}
        >
          {at === rounds.length - 1 ? 'See result' : 'Next study →'}
        </button>
      )}
    </div>
  );
}

/* ══ PAIRS ══════════════════════════════════════════════════════════════ */

export function PairsGame({ chapter, bookTerms = [], seed, onScore }) {
  // A short chapter may not carry enough vocabulary of its own — Lavelle's
  // conclusion has two terms. Rather than leaving a dead activity, fall back to
  // the whole book's glossary, which for a closing chapter is the better task
  // anyway: cumulative review across everything you have read, interleaved,
  // instead of a handful of terms in isolation.
  const pool = chapter.terms.length >= 4 ? chapter.terms : bookTerms;
  const wide = pool !== chapter.terms;

  const rounds = useMemo(() => {
    const rng = makeRng(seed ?? 13);
    const terms = pool;
    return shuffle(terms, rng).map((t, i) => {
      const wrong = shuffle(terms.filter((x) => x.term !== t.term), makeRng((seed ?? 13) + i))
        .slice(0, 3)
        .map((x) => x.term);
      const opts = shuffle([t.term, ...wrong], makeRng((seed ?? 13) + i * 7));
      return { meaning: t.meaning, opts, correct: opts.indexOf(t.term) };
    });
  }, [pool, seed]);

  const [at, setAt] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);

  if (rounds.length < 4) return <p className="cgameHint">Not enough terms recorded yet to pair.</p>;
  if (at >= rounds.length) {
    return (
      <div className="cgameResult">
        <b>{score}/{rounds.length}</b>
        <p>The vocabulary has to be automatic before the argument can be followed at speed.</p>
      </div>
    );
  }

  const r = rounds[at];
  return (
    <div className="cgame">
      <p className="cgameHint">
        Term {at + 1} of {rounds.length} · which one is this?
        {wide ? ' · drawn from the whole book' : ''}
      </p>
      <div className="cgameMeaning">{r.meaning}</div>
      <div className="cgameOpts cgameOpts--tight">
        {r.opts.map((o, i) => {
          const state = picked === null ? '' : i === r.correct ? ' ok' : i === picked ? ' bad' : ' faded';
          return (
            <button
              key={i}
              type="button"
              className={`cgameOpt${state}`}
              disabled={picked !== null}
              onClick={() => {
                setPicked(i);
                if (i === r.correct) { setScore((s) => s + 1); onScore?.(1, 1); }
                else onScore?.(0, 1);
              }}
            >
              {o}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <button
          type="button"
          className="cgameGo"
          onClick={() => { setPicked(null); setAt((a) => a + 1); }}
        >
          {at === rounds.length - 1 ? 'See result' : 'Next term →'}
        </button>
      )}
    </div>
  );
}
