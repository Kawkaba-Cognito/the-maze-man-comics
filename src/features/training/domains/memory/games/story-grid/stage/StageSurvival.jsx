import React, { useCallback, useEffect, useRef, useState } from 'react';
import { makeRng } from '../../../../../shared/rng';
import { STAGE_STORIES } from './stories';
import StageStory from './StageStory';
import { pickStrings } from './stageStrings';
import './stage.css';

/*
 * Survival: staged stories back to back until the lives run out.
 *
 * A story counts as remembered when the ORDER is perfect and at most one detail
 * probe is missed — order is the thing this mode trains, so a scrambled
 * sequence costs a life even if every probe was right.
 */
const LIVES = 3;

/** Solves → tier index, easing up rather than jumping. */
const tierFor = (solved) => (solved < 2 ? 0 : solved < 4 ? 1 : 2);

function shuffle(list, rng) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function StageSurvival({
  seed, isAr, playSfx, awardPoints, awardFreeRun, onExit,
}) {
  const t = pickStrings(isAr);
  const rngRef = useRef(null);
  if (!rngRef.current) rngRef.current = makeRng(seed ?? ((Math.random() * 1e9) >>> 0));

  const poolsRef = useRef(null);
  const lastIdRef = useRef(null);
  const [solved, setSolved] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [storyNo, setStoryNo] = useState(1);
  const [story, setStory] = useState(null);
  const [over, setOver] = useState(false);

  const nextStory = useCallback((solvedCount) => {
    const rng = rngRef.current;
    if (!poolsRef.current) {
      const byTier = [1, 2, 3].map((tier) => STAGE_STORIES.filter((s) => s.tier === tier));
      poolsRef.current = byTier.map((list) => ({
        list: shuffle(list.length ? list : STAGE_STORIES, rng),
        idx: 0,
      }));
    }
    // Widen to every story at or below the current tier, so a three-story bank
    // never replays the same tale twice in a row the way a per-tier pool would.
    const cap = tierFor(solvedCount);
    const eligible = STAGE_STORIES.filter((s) => s.tier - 1 <= cap);
    const fresh = eligible.filter((s) => s.id !== lastIdRef.current);
    const from = fresh.length ? fresh : eligible;
    const picked = from[Math.floor(rng() * from.length)] || STAGE_STORIES[0];
    lastIdRef.current = picked.id;
    return picked;
  }, []);

  const boot = useCallback(() => {
    poolsRef.current = null;
    lastIdRef.current = null;
    setSolved(0);
    setLives(LIVES);
    setStoryNo(1);
    setOver(false);
    setStory(nextStory(0));
  }, [nextStory]);

  useEffect(() => { boot(); }, [boot]);

  const handleStoryDone = ({ orderExact, orderTotal, probesCorrect, probesTotal, perfect }) => {
    const orderClean = orderExact === orderTotal;
    const kept = orderClean && probesCorrect >= probesTotal - 1;
    if (kept) awardPoints?.(perfect ? 10 : 6);

    const nextSolved = kept ? solved + 1 : solved;
    setSolved(nextSolved);
    setStoryNo((n) => n + 1);

    if (!kept) {
      const remaining = lives - 1;
      setLives(remaining);
      if (remaining <= 0) {
        playSfx?.('lose');
        awardFreeRun?.('storyGrid', nextSolved);
        setOver(true);
        return;
      }
    }
    setStory(nextStory(nextSolved));
  };

  if (over) {
    return (
      <div className="sgs" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="sgs-centre">
          <div style={{ fontSize: '3rem' }} aria-hidden="true">📖</div>
          <h2>{t.runOver}</h2>
          <p className="sgs-sub">{t.runOverSub(solved)}</p>
          <div className="sgs-bar">
            <button
              type="button"
              className="sgs-btn sgs-btn--go"
              onClick={() => { playSfx?.('click'); boot(); }}
            >
              {t.playAgain}
            </button>
            <button
              type="button"
              className="sgs-btn"
              onClick={() => { playSfx?.('click'); onExit?.(); }}
            >
              {t.quitMenu}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!story) return <div className="sgs" dir={isAr ? 'rtl' : 'ltr'} />;

  return (
    <StageStory
      key={`${story.id}-${storyNo}`}
      story={story}
      storyNo={storyNo}
      isAr={isAr}
      playSfx={playSfx}
      hudRight={(
        <span className="sgs-chip" style={{ cursor: 'default' }}>
          {'♥'.repeat(Math.max(0, lives))} · {solved}
        </span>
      )}
      onStoryDone={handleStoryDone}
      onExit={onExit}
    />
  );
}
