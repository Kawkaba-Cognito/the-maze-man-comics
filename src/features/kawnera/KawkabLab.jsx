import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
const tidy = (value) =>
  value
    .replace(/\b([A-Z])\s+([a-z]{2,})\b/g, '$1$2')
    .replace(/([A-Za-z])-\s+([A-Za-z])/g, '$1$2')
    .replace(/\s+/g, ' ')
    .trim();

const clip = (value, max = 190) => {
  const clean = tidy(value);
  return clean.length > max ? `${clean.slice(0, max).replace(/\s+\S*$/, '')}...` : clean;
};

const unique = (values) => [...new Set(values.map(tidy).filter(Boolean))];

function rotate(items, seed) {
  if (!items.length) return items;
  const shift = ((seed % items.length) + items.length) % items.length;
  return [...items.slice(shift), ...items.slice(0, shift)];
}

function optionsFor(correct, wrongPool, seed, fallbacks) {
  const cleanCorrect = clip(correct);
  const wrongs = unique([...wrongPool, ...fallbacks])
    .map((value) => clip(value))
    .filter((value) => value !== cleanCorrect)
    .slice(0, 2);
  const options = rotate([cleanCorrect, ...wrongs], seed);
  return { options, correct: options.indexOf(cleanCorrect) };
}

function buildQuestions(data, bank, seed) {
  const other = bank.filter((_, index) => index !== seed);
  const central =
    data.core.find((value) => tidy(value).length > 70) ?? data.intro[0] ?? data.conclusion[0];
  const claim = optionsFor(
    central,
    other.flatMap((chapter) => chapter.core.slice(0, 2)),
    seed,
    [
      'The chapter claims that one universal rule explains every form of thinking.',
      'The chapter argues that evidence should be ignored whenever intuition feels convincing.',
    ],
  );
  const evidenceText =
    data.evidence.find((value) => tidy(value).length > 55) ?? data.core[1] ?? central;
  const evidence = optionsFor(
    evidenceText,
    other.flatMap((chapter) => chapter.evidence.slice(0, 1)),
    seed + 1,
    [
      "A purely imaginary result with no connection to the chapter's argument.",
      'A conclusion borrowed from an unrelated topic without supporting observations.',
    ],
  );
  const termText = data.terms.find((term) => /^[a-z][a-z'-]{3,}$/i.test(term)) ?? 'reasoning';
  const terms = optionsFor(
    termText,
    other.flatMap((chapter) => chapter.terms.slice(0, 3)),
    seed + 2,
    ['astronomy', 'geology'],
  );
  return [
    {
      prompt: "Which statement belongs to this chapter's central argument?",
      ...claim,
      explanation: "Dr. Kawkab traced this statement to the chapter's central claim.",
    },
    {
      prompt: 'Which example or observation is used as evidence in this chapter?',
      ...evidence,
      explanation: "This example appears in the chapter's evidence trail.",
    },
    {
      prompt: "Which term belongs to this chapter's key language?",
      ...terms,
      explanation: "This term is part of the chapter's recurring vocabulary.",
    },
  ];
}

export default function KawkabLab({
  bookId,
  bookTitle,
  chapterIndex,
  chapterTitle,
  color,
  data,
  bank,
  onClose,
  isAr = false,
}) {
  const [mode, setMode] = useState('menu');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [best, setBest] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [seconds, setSeconds] = useState(60);
  const [running, setRunning] = useState(false);
  const [draft, setDraft] = useState('');
  const storageKey = `atlas-lab-${bookId}-${chapterIndex}`;
  const questions = useMemo(
    () => buildQuestions(data, bank, chapterIndex),
    [data, bank, chapterIndex],
  );
  const cards = useMemo(() => {
    const material = unique([...data.core, ...data.evidence, ...data.conclusion]);
    return unique(data.terms)
      .filter((term) => /^[a-z][a-z'-]{3,}$/i.test(term))
      .slice(0, 6)
      .map((term) => ({
        term,
        clue: clip(
          material.find((line) => line.toLowerCase().includes(term.toLowerCase())) ??
            `Explain how "${term}" changes the chapter's argument.`,
          230,
        ),
      }));
  }, [data]);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      setBest(parsed.best ?? 0);
      setDraft(parsed.draft ?? '');
    } catch {}
  }, [storageKey]);

  useEffect(() => {
    if (mode !== 'teach' || !running || seconds <= 0) return;
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [mode, running, seconds]);

  useEffect(() => {
    if (seconds === 0) setRunning(false);
  }, [seconds]);

  const saveResult = (nextBest = best, nextDraft = draft) => {
    localStorage.setItem(storageKey, JSON.stringify({ best: nextBest, draft: nextDraft }));
  };

  const choose = (index) => {
    if (selected !== null) return;
    setSelected(index);
    if (index === questions[questionIndex].correct) setScore((value) => value + 1);
  };

  const advanceQuiz = () => {
    if (questionIndex < questions.length - 1) {
      setQuestionIndex((value) => value + 1);
      setSelected(null);
      return;
    }
    const nextBest = Math.max(best, score);
    setBest(nextBest);
    saveResult(nextBest);
    setFinished(true);
  };

  const resetQuiz = () => {
    setQuestionIndex(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  };

  const changeMode = (next) => {
    setMode(next);
    if (next === 'quiz') resetQuiz();
    if (next === 'cards') {
      setCardIndex(0);
      setFlipped(false);
    }
    if (next === 'teach') {
      setSeconds(60);
      setRunning(false);
    }
  };

  const card = cards[cardIndex];

  return createPortal(
    <div className="kawneraLabBackdrop" dir={isAr ? 'rtl' : 'ltr'}>
      <section
        className="kawneraLab"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lab-title"
        style={{ '--lab': color }}
      >
        <header className="labHeader">
          <div>
            <small>DR. KAWKAB'S LEARNING LAB</small>
            <h2 id="lab-title">{chapterTitle}</h2>
            <p>
              {bookTitle} · Chapter {chapterIndex + 1}
            </p>
          </div>
          <button className="labClose" onClick={onClose} aria-label="Close learning lab">
            &times;
          </button>
        </header>
        <nav className="labTabs" aria-label="Learning lab activities">
          <button className={mode === 'menu' ? 'on' : ''} onClick={() => changeMode('menu')}>
            Mission control
          </button>
          <button className={mode === 'quiz' ? 'on' : ''} onClick={() => changeMode('quiz')}>
            Quiz arena
          </button>
          <button className={mode === 'cards' ? 'on' : ''} onClick={() => changeMode('cards')}>
            Memory cards
          </button>
          <button className={mode === 'teach' ? 'on' : ''} onClick={() => changeMode('teach')}>
            Teach it back
          </button>
        </nav>
        <div className="labStage">
          {mode === 'menu' && (
            <div className="labMenu">
              <div className="labIntro">
                <span>MISSION {String(chapterIndex + 1).padStart(2, '0')}</span>
                <h3>
                  Do not just reread.
                  <br />
                  Make your brain retrieve.
                </h3>
                <p>
                  Choose a challenge. Dr. Kawkab will make you identify the argument, retrieve its
                  language, and explain it without looking.
                </p>
              </div>
              <div className="labChoices">
                <button onClick={() => changeMode('quiz')}>
                  <span>01</span>
                  <small>3 QUESTIONS · SCORED</small>
                  <strong>Quiz arena</strong>
                  <p>Find the real claim, evidence, and key term among plausible alternatives.</p>
                </button>
                <button onClick={() => changeMode('cards')}>
                  <span>02</span>
                  <small>{Math.max(cards.length, 1)} CONCEPT CARDS</small>
                  <strong>Memory cards</strong>
                  <p>Predict the connection before revealing the chapter-grounded clue.</p>
                </button>
                <button onClick={() => changeMode('teach')}>
                  <span>03</span>
                  <small>60 SECOND CHALLENGE</small>
                  <strong>Teach it back</strong>
                  <p>Explain the chapter in your own words while the mission clock runs.</p>
                </button>
              </div>
            </div>
          )}

          {mode === 'quiz' && (
            <div className="quizArena">
              {!finished ? (
                <>
                  <div className="quizMeta">
                    <span>
                      QUESTION {questionIndex + 1} / {questions.length}
                    </span>
                    <b>SCORE {score}</b>
                  </div>
                  <h3>{questions[questionIndex].prompt}</h3>
                  <div className="quizOptions">
                    {questions[questionIndex].options.map((option, index) => {
                      const revealed = selected !== null;
                      const isCorrect = index === questions[questionIndex].correct;
                      const isWrong = selected === index && !isCorrect;
                      return (
                        <button
                          key={`${questionIndex}-${index}`}
                          className={revealed && isCorrect ? 'correct' : isWrong ? 'wrong' : ''}
                          onClick={() => choose(index)}
                          disabled={revealed}
                        >
                          <span>{String.fromCharCode(65 + index)}</span>
                          <p>{option}</p>
                        </button>
                      );
                    })}
                  </div>
                  {selected !== null && (
                    <div className="quizFeedback" role="status">
                      <b>
                        {selected === questions[questionIndex].correct
                          ? 'CORRECT — SIGNAL LOCKED'
                          : 'NOT QUITE — MODEL RECALIBRATED'}
                      </b>
                      <p>{questions[questionIndex].explanation}</p>
                      <button onClick={advanceQuiz}>
                        {questionIndex === questions.length - 1 ? 'SEE RESULT' : 'NEXT QUESTION →'}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="quizResult">
                  <small>MISSION COMPLETE</small>
                  <strong>
                    {score}
                    <i> / {questions.length}</i>
                  </strong>
                  <h3>
                    {score === questions.length
                      ? 'Perfect retrieval.'
                      : score >= 2
                        ? 'Strong model. One more pass will lock it in.'
                        : 'Good attempt. Revisit the chapter map, then try again.'}
                  </h3>
                  <p>
                    Best score on this device: {best}/{questions.length}
                  </p>
                  <div>
                    <button onClick={resetQuiz}>TRY AGAIN</button>
                    <button onClick={() => changeMode('menu')}>OTHER GAMES</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {mode === 'cards' && (
            <div className="memoryGame">
              <div className="quizMeta">
                <span>
                  MEMORY CARD {cards.length ? cardIndex + 1 : 0} / {cards.length}
                </span>
                <b>THINK BEFORE FLIPPING</b>
              </div>
              {card ? (
                <>
                  <button
                    className={flipped ? 'memoryCard flipped' : 'memoryCard'}
                    onClick={() => setFlipped((value) => !value)}
                  >
                    <span>{flipped ? 'CHAPTER CONNECTION' : 'KEY TERM'}</span>
                    <strong>{flipped ? card.clue : card.term}</strong>
                    <small>{flipped ? 'TAP TO SEE TERM' : 'SAY WHAT IT MEANS, THEN TAP'}</small>
                  </button>
                  <div className="cardControls">
                    <button
                      disabled={cardIndex === 0}
                      onClick={() => {
                        setCardIndex((value) => value - 1);
                        setFlipped(false);
                      }}
                    >
                      ← PREVIOUS
                    </button>
                    <button
                      disabled={cardIndex === cards.length - 1}
                      onClick={() => {
                        setCardIndex((value) => value + 1);
                        setFlipped(false);
                      }}
                    >
                      NEXT →
                    </button>
                  </div>
                </>
              ) : (
                <div className="emptyGame">
                  <h3>No clean key terms were extracted for this chapter.</h3>
                  <button onClick={() => changeMode('teach')}>TRY TEACH IT BACK</button>
                </div>
              )}
            </div>
          )}

          {mode === 'teach' && (
            <div className="teachBack">
              <div className="teachClock" aria-live="polite">
                <strong>
                  {String(Math.floor(seconds / 60)).padStart(2, '0')}:
                  {String(seconds % 60).padStart(2, '0')}
                </strong>
                <span>
                  {running
                    ? 'MISSION RUNNING'
                    : seconds === 0
                      ? 'TIME — FINISH YOUR LAST SENTENCE'
                      : 'READY WHEN YOU ARE'}
                </span>
              </div>
              <div className="teachPrompt">
                <small>YOUR MISSION</small>
                <h3>Explain “{chapterTitle}” to someone who has never read this book.</h3>
                <ul>
                  <li>Name the central problem.</li>
                  <li>Explain the chapter's answer.</li>
                  <li>Use one example or piece of evidence.</li>
                </ul>
              </div>
              <textarea
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value);
                  saveResult(best, event.target.value);
                }}
                placeholder="Write your explanation here. Use your own words—not the chapter's sentences."
                aria-label="Your teach-back explanation"
              />
              <div className="teachActions">
                <button
                  onClick={() => {
                    setSeconds(60);
                    setRunning(true);
                  }}
                >
                  {running ? 'RESTART 60 SECONDS' : 'START 60-SECOND TIMER'}
                </button>
                <button
                  onClick={() => {
                    saveResult();
                    setRunning(false);
                  }}
                >
                  SAVE ON THIS DEVICE
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>,
    document.body,
  );
}
