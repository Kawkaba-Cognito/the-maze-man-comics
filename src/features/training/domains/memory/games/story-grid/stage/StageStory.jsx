import React, { Suspense, lazy, useCallback, useMemo, useState } from 'react';
import OrderBoard from './components/OrderBoard';
import ProbeQuiz from './components/ProbeQuiz';
import { L, castOf, scoreOrder, scoreProbes } from './schema';
import { pickStrings } from './stageStrings';
import { CAST } from '../../../../../shared/castRoster';
import './stage.css';

// three.js only loads once a story actually opens.
const StoryStage3D = lazy(() => import('./components/StoryStage3D'));

/*
 * One staged story, start to finish.
 *
 *   watch → order → probes → reveal
 *
 * The stage stays mounted across watch AND the retrieval phases (dimmed and
 * non-interactive behind the panels) so the cast loads once and the room the
 * story happened in is still there while you try to recall it — context at
 * retrieval, which is the whole reason to stage it in 3D rather than draw
 * panels.
 */
export default function StageStory({
  story, storyNo, isAr, playSfx, hudRight, onStoryDone, onExit,
}) {
  const t = pickStrings(isAr);
  const cast = useMemo(() => castOf(story), [story]);

  const [phase, setPhase] = useState('watch');
  const [beatIdx, setBeatIdx] = useState(0);
  const [placed, setPlaced] = useState([]);
  const [probeIdx, setProbeIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [stageFailed, setStageFailed] = useState(false);

  const beat = story.beats[Math.min(beatIdx, story.beats.length - 1)];
  const isLastBeat = beatIdx >= story.beats.length - 1;

  const nextBeat = () => {
    playSfx?.('click');
    if (isLastBeat) { setPhase('order'); return; }
    setBeatIdx((i) => i + 1);
  };

  const place = useCallback((id) => setPlaced((p) => (p.includes(id) ? p : [...p, id])), []);
  const unplace = useCallback((id) => setPlaced((p) => p.filter((x) => x !== id)), []);

  const answer = (probeId, v) => {
    setAnswers((a) => ({ ...a, [probeId]: v }));
    const last = probeIdx >= story.probes.length - 1;
    window.setTimeout(() => {
      if (last) { playSfx?.('win'); setPhase('reveal'); }
      else setProbeIdx((i) => i + 1);
    }, 420);
  };

  const order = useMemo(
    () => (phase === 'reveal' ? scoreOrder(placed, story) : null),
    [phase, placed, story],
  );
  const probes = useMemo(
    () => (phase === 'reveal' ? scoreProbes(answers, story) : null),
    [phase, answers, story],
  );

  // During retrieval the stage holds the LAST beat, so the scene behind the
  // panels is the story's ending rather than a blank room.
  const stageBeat = phase === 'watch' ? beat : story.beats[story.beats.length - 1];

  return (
    <div className="sgs" dir={isAr ? 'rtl' : 'ltr'}>
      <header className="sgs-top">
        <span className="sgs-mono">
          📖 {storyNo != null ? `${storyNo} · ` : ''}{L(story.title, isAr)}
        </span>
        <span className="sgs-top-right">
          {hudRight}
          <button
            type="button"
            className="sgs-chip"
            onClick={() => { playSfx?.('click'); onExit?.(); }}
          >
            {t.quitMenu}
          </button>
        </span>
      </header>

      <div className={`sgs-stage-host${phase === 'watch' ? '' : ' recalling'}`}>
        {!stageFailed && (
          <Suspense fallback={null}>
            <StoryStage3D
              beat={stageBeat}
              cast={cast}
              isAr={isAr}
              onError={() => setStageFailed(true)}
            />
          </Suspense>
        )}
      </div>

      {phase === 'watch' && (
        <div className="sgs-watch">
          <div className="sgs-beatline">{t.beatOf(beatIdx + 1, story.beats.length)}</div>
          {beat.say && (
            <div className="sgs-say" style={{ borderColor: CAST[beat.say.who]?.accent }}>
              <b style={{ color: CAST[beat.say.who]?.accent }}>
                {L(CAST[beat.say.who]?.name, isAr)}
              </b>
              <span>“{L(beat.say.t, isAr)}”</span>
            </div>
          )}
          <p className="sgs-narr">{L(beat.narr, isAr)}</p>
          <div className="sgs-bar">
            <button type="button" className="sgs-btn sgs-btn--go" onClick={nextBeat}>
              {isLastBeat ? t.toOrder : t.next}
            </button>
          </div>
        </div>
      )}

      {phase === 'order' && (
        <div className="sgs-panel">
          <OrderBoard
            story={story}
            isAr={isAr}
            t={t}
            placed={placed}
            onPlace={place}
            onUnplace={unplace}
            onConfirm={() => {
              playSfx?.('click');
              setPhase(story.probes.length ? 'probes' : 'reveal');
            }}
            playSfx={playSfx}
          />
        </div>
      )}

      {phase === 'probes' && (
        <div className="sgs-panel">
          <ProbeQuiz
            story={story}
            isAr={isAr}
            t={t}
            index={probeIdx}
            answers={answers}
            onAnswer={answer}
            playSfx={playSfx}
          />
        </div>
      )}

      {phase === 'reveal' && order && probes && (
        <div className="sgs-panel">
          <div className="sgs-reveal">
            <div className="sgs-stamp">
              {order.perfect && probes.perfect ? t.perfect : t.revealTitle}
            </div>
            <h2>{L(story.title, isAr)}</h2>

            <ul className="sgs-scores">
              <li>{t.orderScore(order.exact, order.total)}</li>
              <li>{t.pairScore(order.pairsOk, order.pairs)}</li>
              <li>{t.probeScore(probes.correct, probes.total)}</li>
            </ul>

            {/* The true sequence, with the player's misplacements marked. */}
            <ol className="sgs-truth">
              {story.beats.map((b, i) => {
                const ok = placed[i] === b.id;
                return (
                  <li key={b.id} className={ok ? 'ok' : 'bad'}>
                    <span>{i + 1}</span>
                    {L(b.label, isAr)}
                  </li>
                );
              })}
            </ol>

            <div className="sgs-moral">
              <span className="sgs-moral-tag">{t.moralTag}</span>
              {L(story.moral, isAr)}
            </div>

            <div className="sgs-bar">
              <button
                type="button"
                className="sgs-btn sgs-btn--go"
                onClick={() => {
                  playSfx?.('click');
                  onStoryDone?.({
                    orderExact: order.exact,
                    orderTotal: order.total,
                    probesCorrect: probes.correct,
                    probesTotal: probes.total,
                    perfect: order.perfect && probes.perfect,
                  });
                }}
              >
                {t.nextStory}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
