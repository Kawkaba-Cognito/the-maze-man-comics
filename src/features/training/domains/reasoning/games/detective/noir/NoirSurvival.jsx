import React, { useCallback, useEffect, useRef, useState } from 'react';
import { makeRng } from '../../../../../shared/rng';
import { NOIR_BY_TIER, NOIR_CASES } from './cases';
import NoirCase from './NoirCase';
import { pickStrings } from './noirStrings';
import './noir.css';

/*
 * Survival: cases back to back until the lives run out.
 *
 * A closed case moves you up the tiers, a failed one costs a life — the same
 * adaptive shape the rest of the detective game uses, kept local because the
 * noir rotation is its own pool.
 */
const LIVES = 3;

/** Solve count → tier index, easing up rather than jumping. */
const tierFor = (solved) => (solved < 2 ? 0 : solved < 5 ? 1 : 2);

function shuffle(list, rng) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function NoirSurvival({
  seed, onExit, isAr, playSfx, awardPoints, awardFreeRun,
}) {
  const t = pickStrings(isAr);
  const rngRef = useRef(null);
  if (!rngRef.current) rngRef.current = makeRng(seed ?? ((Math.random() * 1e9) >>> 0));

  const poolsRef = useRef(null);
  const lastIdRef = useRef(null);
  const [solved, setSolved] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [caseNo, setCaseNo] = useState(1);
  const [caseData, setCaseData] = useState(null);
  const [over, setOver] = useState(false);

  const nextCase = useCallback((solvedCount) => {
    const rng = rngRef.current;
    if (!poolsRef.current) {
      poolsRef.current = NOIR_BY_TIER.map((list) => ({
        list: shuffle(list.length ? list : NOIR_CASES, rng),
        idx: 0,
      }));
    }
    const pool = poolsRef.current[tierFor(solvedCount)];
    if (pool.idx >= pool.list.length) {
      pool.list = shuffle(pool.list, rng);
      pool.idx = 0;
    }
    let picked = pool.list[pool.idx];
    pool.idx += 1;
    // Each tier is a tightly authored chapter. If its chapter would repeat,
    // preview an adjacent file instead of making the player solve the same
    // mystery twice in a row; the target tier resumes on the next draw.
    if (picked.id === lastIdRef.current && NOIR_CASES.length > 1) {
      const alternatives = NOIR_CASES.filter((item) => item.id !== lastIdRef.current);
      const targetTier = tierFor(solvedCount) + 1;
      alternatives.sort((a, b) => Math.abs(a.tier - targetTier) - Math.abs(b.tier - targetTier));
      const nearestDistance = Math.abs(alternatives[0].tier - targetTier);
      const nearest = alternatives.filter((item) => Math.abs(item.tier - targetTier) === nearestDistance);
      picked = nearest[Math.floor(rng() * nearest.length)];
    }
    lastIdRef.current = picked.id;
    return picked;
  }, []);

  const boot = useCallback(() => {
    poolsRef.current = null;
    lastIdRef.current = null;
    setSolved(0);
    setLives(LIVES);
    setCaseNo(1);
    setOver(false);
    setCaseData(nextCase(0));
  }, [nextCase]);

  useEffect(() => { boot(); }, [boot]);

  const handleCaseDone = ({ mistakes }) => {
    // Every case ends in a conviction; the run's currency is how clean it was.
    // More than four wrong moves costs a life.
    const clean = mistakes <= 4;
    if (clean) awardPoints?.(mistakes === 0 ? 8 : 5);

    const nextSolved = solved + 1;
    setSolved(nextSolved);
    setCaseNo((n) => n + 1);

    if (!clean) {
      const remaining = lives - 1;
      setLives(remaining);
      if (remaining <= 0) {
        playSfx?.('lose');
        awardFreeRun?.('detective', nextSolved);
        setOver(true);
        return;
      }
    }
    setCaseData(nextCase(nextSolved));
  };

  if (over) {
    return (
      <div className="nr" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="nr-center">
          <div style={{ fontSize: '3rem' }} aria-hidden="true">🕵️</div>
          <h2>{t.runOver}</h2>
          <p style={{ color: 'var(--nr-dim)' }}>{t.runOverSub(solved)}</p>
          <div className="nr-bar">
            <button type="button" className="nr-btn nr-btn--big" onClick={() => { playSfx?.('click'); boot(); }}>
              {t.freePlayAgain}
            </button>
            <button type="button" className="nr-btn" onClick={() => { playSfx?.('click'); onExit?.(); }}>
              {t.quitMenu}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!caseData) return <div className="nr" dir={isAr ? 'rtl' : 'ltr'} />;

  return (
    <NoirCase
      key={`${caseData.id}-${caseNo}`}
      caseData={caseData}
      caseNo={caseNo}
      isAr={isAr}
      playSfx={playSfx}
      hudRight={(
        <span className="nr-chip" style={{ cursor: 'default' }}>
          {'♥'.repeat(Math.max(0, lives))}
          <span className="nr-wide-only"> · {t.cracked(solved)}</span>
          <span className="nr-narrow-only"> {solved}</span>
        </span>
      )}
      onCaseDone={handleCaseDone}
      onExit={onExit}
    />
  );
}
