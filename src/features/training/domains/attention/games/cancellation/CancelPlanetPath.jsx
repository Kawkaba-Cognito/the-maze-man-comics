import React, { useMemo } from 'react';
import { TrainingScreenShell } from '../../../../shared/TrainingScreens';
import KawkabSprite from '../../../../shared/KawkabSprite.jsx';
import './cancelPlanetPath.css';

/*
 * CANCEL PLANET PATH — a level-map PROTOTYPE, Cancellation only (owner:
 * "i am planning to make the levels like planets, and you move on them, for
 * example dr kawkab is standing on planet one, he solves it, then he walks
 * to the second planet and so on. we can try it for now only on cancellation
 * task"). If this reads well it is the model for every other game's level
 * grid; until then it replaces nothing else.
 *
 * ⚠ SAME PROP CONTRACT AS `TrainingLevelGrid` (shared/TrainingScreens.jsx),
 * on purpose — this is a drop-in visual swap at ONE call site
 * (cancellation/index.jsx's `phase === 'levels'` branch), not a new level
 * system. Progress, unlock rules and what happens on pick are all still
 * owned by the caller; this component only decides where each level SITS
 * and what stands on it.
 *
 * ⚠ NO NEW ART. Sixty individual hand-painted planets is a real asset ask,
 * not a prototype-sized one — each "planet" here is a CSS sphere (radial
 * gradient + rim light), hued by its own position along the ladder so a
 * long scroll still reads as variety rather than one repeated tile. Kawkab
 * himself is the one real asset already shared everywhere else he appears
 * (`KawkabSprite` — the same mascot the Training hub and every coach use).
 *
 * ⚠ "WALKS TO THE NEXT PLANET" IS WHERE HE STANDS, NOT AN ANIMATION.
 * He is positioned on the first level that is unlocked but not yet done —
 * the run's actual frontier — recomputed from `isUnlocked`/`isDone` on every
 * render, so completing a level moves him there on the very next paint with
 * no separate "walk" state to keep in sync with real progress.
 */

const ROW_H = 108;   // px between one level's centre and the next
const AMPLITUDE = 30; // how far a node swings from centre, in % of width

function CancelPlanet({
  lv, x, y, unlocked, done, current, label, onPick, playSfx,
}) {
  const hue = (lv * 47) % 360; // varies smoothly but never repeats a short cycle
  return (
    <button
      type="button"
      className={`cpp-node${done ? ' cpp-node--done' : ''}${current ? ' cpp-node--current' : ''}${!unlocked ? ' cpp-node--locked' : ''}`}
      style={{ left: `${x}%`, top: y, '--cpp-hue': hue }}
      disabled={!unlocked}
      onClick={() => { if (!unlocked) return; playSfx?.('click'); onPick(lv); }}
      aria-label={done ? `${lv}, cleared` : unlocked ? `${lv}` : `${lv}, locked`}
    >
      <span className="cpp-orb" aria-hidden="true">
        <span className="cpp-orb-rim" />
        <span className="cpp-orb-shade" />
      </span>
      <span className="cpp-num">{done ? '✓' : unlocked ? lv : '🔒'}</span>
      {unlocked && label ? <span className="cpp-sub">{label}</span> : null}
    </button>
  );
}

export default function CancelPlanetPath({
  isAr, playSfx, onBack, title, blurb, count, isUnlocked, isDone, sublabel, onPick,
}) {
  const nodes = useMemo(() => Array.from({ length: count }, (_, i) => {
    const lv = i + 1;
    const x = 50 + AMPLITUDE * Math.sin(i * 0.9);
    return { lv, x, y: i * ROW_H + 56 };
  }), [count]);

  /* The frontier: first unlocked-but-not-done level. Falls back to the last
     node if the whole ladder is somehow clear, so Kawkab is never standing
     nowhere. */
  const current = useMemo(() => {
    const found = nodes.find((n) => isUnlocked(n.lv) && !isDone(n.lv));
    return found || nodes[nodes.length - 1];
  }, [nodes, isUnlocked, isDone]);

  const pathHeight = count * ROW_H + 130;

  return (
    <TrainingScreenShell isAr={isAr} playSfx={playSfx} onBack={onBack}>
      <div className="ct-lv-grid-wrap">
        {title ? <h1 className="ct-lv-hero-title">{title}</h1> : null}
        {blurb ? <p className="ct-lv-hero-sub">{blurb}</p> : null}
        <div className="cpp-path" style={{ height: pathHeight }}>
          {/* The spine — a single guide line down the centre. Real segment-by-
              segment lines between each node's exact (x, y) would look better
              but need a post-mount measurement pass; a straight centre spine
              gets the "a path, not a grid" read for a fraction of the code,
              which is the right trade for a prototype being judged on the
              IDEA first. */}
          <div className="cpp-spine" aria-hidden="true" />
          {nodes.map((n) => (
            <CancelPlanet
              key={n.lv}
              lv={n.lv}
              x={n.x}
              y={n.y}
              unlocked={isUnlocked(n.lv)}
              done={isDone(n.lv)}
              current={n.lv === current.lv}
              label={isUnlocked(n.lv) ? sublabel(n.lv) : null}
              onPick={onPick}
              playSfx={playSfx}
            />
          ))}
          <div
            className="cpp-kawkab"
            style={{ left: `${current.x}%`, top: current.y }}
            aria-hidden="true"
          >
            <KawkabSprite size={44} />
          </div>
        </div>
      </div>
    </TrainingScreenShell>
  );
}
