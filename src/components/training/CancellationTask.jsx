import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LANG } from '../../data/langStrings';

const ROWS = 6;
const COLS = 8;
const TARGET_COUNT = 14;
const TIME_LIMIT_MS = 90_000;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateGrid(targetChar) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const distractors = alphabet.split('').filter((c) => c !== targetChar);
  const total = ROWS * COLS;
  const targetIndices = new Set(shuffle([...Array(total).keys()]).slice(0, TARGET_COUNT));
  return [...Array(total)].map((_, i) => ({
    id: i,
    char: targetIndices.has(i)
      ? targetChar
      : distractors[Math.floor(Math.random() * distractors.length)],
    isTarget: targetIndices.has(i),
    cancelled: false,
  }));
}

export default function CancellationTask({ onBack }) {
  const { playSfx, updateXP, currentLang } = useApp();
  const t = LANG[currentLang];
  const isAr = currentLang === 'ar';
  const copy = t.cancellation;

  const [phase, setPhase] = useState('intro');
  const [roundKey, setRoundKey] = useState(0);
  const [targetChar, setTargetChar] = useState('R');
  const [grid, setGrid] = useState([]);
  const [wrongTaps, setWrongTaps] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [outcome, setOutcome] = useState(null);
  const [flashId, setFlashId] = useState(null);
  const startRef = useRef(0);
  const finishedRef = useRef(false);

  const pool = useMemo(() => ['R', 'K', 'P', 'H', 'Z', 'N', 'M'], []);

  const startRound = useCallback(() => {
    const tc = pool[Math.floor(Math.random() * pool.length)];
    setTargetChar(tc);
    setGrid(generateGrid(tc));
    setWrongTaps(0);
    setElapsedMs(0);
    setOutcome(null);
    finishedRef.current = false;
    startRef.current = Date.now();
    setPhase('play');
    setRoundKey((k) => k + 1);
    playSfx('click');
  }, [playSfx, pool]);

  useEffect(() => {
    if (phase !== 'play') return undefined;
    const id = window.setInterval(() => {
      if (finishedRef.current) return;
      const e = Date.now() - startRef.current;
      setElapsedMs(e);
      if (e >= TIME_LIMIT_MS) {
        finishedRef.current = true;
        setOutcome('timeout');
        setPhase('results');
        playSfx('error');
      }
    }, 200);
    return () => window.clearInterval(id);
  }, [phase, roundKey, playSfx]);

  useEffect(() => {
    if (phase !== 'play' || grid.length === 0 || finishedRef.current) return;
    const left = grid.some((c) => c.isTarget && !c.cancelled);
    if (left) return;
    finishedRef.current = true;
    const ms = Date.now() - startRef.current;
    setElapsedMs(ms);
    setOutcome('win');
    setPhase('results');
    playSfx('win');
    const errPenalty = wrongTaps * 3;
    const timeBonus = Math.max(0, Math.round((TIME_LIMIT_MS - ms) / 1000));
    updateXP(Math.max(15, 40 + timeBonus - errPenalty));
  }, [grid, phase, playSfx, updateXP, wrongTaps]);

  function handleCellTap(cell) {
    if (phase !== 'play' || cell.cancelled) return;
    if (cell.isTarget) {
      playSfx('collect');
      setGrid((g) => g.map((c) => (c.id === cell.id ? { ...c, cancelled: true } : c)));
    } else {
      playSfx('error');
      setWrongTaps((w) => w + 1);
      setFlashId(cell.id);
      window.setTimeout(() => setFlashId(null), 350);
    }
  }

  const targetsTotal = grid.filter((c) => c.isTarget).length;
  const targetsFound = grid.filter((c) => c.isTarget && c.cancelled).length;

  const fmtTime = (ms) => {
    const s = Math.floor(ms / 1000);
    const cs = Math.floor((ms % 1000) / 100);
    return `${s}.${cs}s`;
  };

  return (
    <div className="cancellation-task" dir={isAr ? 'rtl' : 'ltr'}>
      <button
        type="button"
        className="cancel-back-btn"
        onClick={() => {
          playSfx('click');
          onBack();
        }}
        style={{ fontFamily: isAr ? "'Cairo',sans-serif" : "'Bangers',cursive" }}
      >
        {isAr ? `${copy.back} →` : `← ${copy.back}`}
      </button>

      {phase === 'intro' && (
        <div className="cancellation-intro-card content-card">
          <h2
            style={{
              fontFamily: isAr ? "'Cairo',sans-serif" : "'Bangers',cursive",
              fontSize: '2em',
              marginBottom: '12px',
            }}
          >
            {copy.title}
          </h2>
          <p className="cancellation-blurb">{copy.blurb}</p>
          <ul className="cancellation-rules">
            <li>{copy.rule1}</li>
            <li>{copy.rule2}</li>
            <li>{copy.rule3}</li>
          </ul>
          <button
            type="button"
            className="comic-btn cancellation-start-btn"
            onClick={startRound}
            style={{ fontFamily: isAr ? "'Cairo',sans-serif" : "'Bangers',cursive", marginTop: '16px' }}
          >
            {copy.start}
          </button>
        </div>
      )}

      {phase === 'play' && (
        <div className="cancellation-play-wrap">
          <div className="cancellation-hud">
            <div className="cancellation-target-display">
              <span className="cancellation-hud-label">{copy.targetLabel}</span>
              <span className="cancellation-target-char" aria-hidden="true">
                {targetChar}
              </span>
            </div>
            <div className="cancellation-stats">
              <span>
                {copy.found}: {targetsFound}/{targetsTotal}
              </span>
              <span>
                {copy.time}: {fmtTime(Math.min(elapsedMs, TIME_LIMIT_MS))}
              </span>
            </div>
          </div>
          <div
            className="cancellation-grid"
            role="grid"
            aria-label={copy.gridLabel}
          >
            {grid.map((cell) => (
              <button
                key={cell.id}
                type="button"
                role="gridcell"
                className={`cancellation-cell${cell.cancelled ? ' cancelled' : ''}${flashId === cell.id ? ' wrong-flash' : ''}`}
                onClick={() => handleCellTap(cell)}
                disabled={cell.cancelled}
              >
                {cell.char}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'results' && (
        <div className="cancellation-results content-card">
          <h2
            style={{
              fontFamily: isAr ? "'Cairo',sans-serif" : "'Bangers',cursive",
              fontSize: '2em',
              marginBottom: '12px',
            }}
          >
            {outcome === 'timeout' ? copy.timesUp : copy.complete}
          </h2>
          <p className="cancellation-result-line">
            {copy.found}: <strong>{targetsFound}</strong> / {targetsTotal}
          </p>
          <p className="cancellation-result-line">
            {copy.wrong}: <strong>{wrongTaps}</strong>
          </p>
          <p className="cancellation-result-line">
            {copy.time}: <strong>{fmtTime(Math.min(elapsedMs, TIME_LIMIT_MS))}</strong>
          </p>
          {outcome === 'win' && <p className="cancellation-result-note">{copy.praise}</p>}
          <div className="cancellation-result-actions">
            <button
              type="button"
              className="comic-btn"
              onClick={startRound}
              style={{ fontFamily: isAr ? "'Cairo',sans-serif" : "'Bangers',cursive" }}
            >
              {copy.again}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
