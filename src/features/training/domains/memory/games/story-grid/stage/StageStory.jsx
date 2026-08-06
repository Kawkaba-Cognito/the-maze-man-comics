import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGamePause } from '../../../../../shared/useGamePause';
import OrderBoard from './components/OrderBoard';
import ProbeQuiz from './components/ProbeQuiz';
import {
  L, beatHold, castOf, focusActor, pickShot, scoreOrder, scoreProbes,
} from './schema';
import { pickStrings } from './stageStrings';
import { CAST } from '../../../../../shared/castRoster';
import './stage.css';

// The illustrated stage only loads once a story actually opens.
const StoryStage2D = lazy(() => import('./components/StoryStage2D'));

// How long the cut between beats dips. Short enough to read as an edit rather
// than a loading screen.
const DIP_MS = 200;

const prefersReducedMotion = () =>
  typeof window !== 'undefined'
  && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/*
 * One staged story, start to finish.
 *
 *   watch → order → probes → reveal
 *
 * WATCH plays as a short film: beats advance on their own clock (see beatHold
 * in schema.js), the camera cuts between shots, dialogue arrives as a subtitle
 * and each cut dips briefly. It is not a slideshow with a Next button, because
 * a continuous scene is a truer thing to encode episodically — and because a
 * static tableau can be sat on and drilled, which makes the ordering task
 * measure patience instead of memory.
 *
 * The learner keeps control where it matters: pause, replay from the top, or
 * skip ahead. Self-paced study beats fixed-pace for recall, so taking the
 * pacing away entirely would trade real learning for atmosphere.
 *
 * The stage stays mounted across watch AND the retrieval phases (dimmed and
 * non-interactive behind the panels) so the cast loads once and the room the
 * story happened in is still there while you try to recall it — context at
 * retrieval, preserving the visual context without returning to static panels.
 */
export default function StageStory({
  story, storyNo, isAr, playSfx, hudRight, onStoryDone, onExit,
}) {
  const t = pickStrings(isAr);
  const cast = useMemo(() => castOf(story), [story]);

  const [phase, setPhase] = useState('watch');
  const [beatIdx, setBeatIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [dip, setDip] = useState(false);
  const [placed, setPlaced] = useState([]);
  const [probeIdx, setProbeIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [stageFailed, setStageFailed] = useState(false);

  const beat = story.beats[Math.min(beatIdx, story.beats.length - 1)];
  const isLastBeat = beatIdx >= story.beats.length - 1;
  const hold = useMemo(() => beatHold(beat, isAr), [beat, isAr]);

  // Framing for this beat: the authored shot or the house grammar, aimed at
  // whoever is speaking.
  const shot = useMemo(
    () => pickShot(beat, beatIdx, story.beats.length),
    [beat, beatIdx, story.beats.length],
  );
  const focusX = useMemo(() => focusActor(beat)?.x ?? 0, [beat]);

  // ── the clock ───────────────────────────────────────────────────────────
  // Pausing must FREEZE the current beat, not restart it, so the remaining
  // time is banked on pause and spent on resume.
  const remainRef = useRef(null);
  const deadlineRef = useRef(0);

  // Declared before the timer effect so it runs first: a new beat always gets
  // its full hold, never the leftovers of the one before.
  useEffect(() => { remainRef.current = null; }, [beatIdx]);

  useEffect(() => {
    if (phase !== 'watch') return undefined;
    if (!playing) {
      if (deadlineRef.current) {
        remainRef.current = Math.max(0, deadlineRef.current - Date.now());
      }
      return undefined;
    }
    const ms = remainRef.current ?? hold;
    deadlineRef.current = Date.now() + ms;
    const id = window.setTimeout(() => {
      deadlineRef.current = 0;
      if (isLastBeat) setPhase('order');
      else setBeatIdx((i) => i + 1);
    }, ms);
    return () => window.clearTimeout(id);
  }, [phase, playing, beatIdx, hold, isLastBeat]);

  // The cut. Skipped under reduced-motion, where a flashing overlay is exactly
  // the thing the setting exists to prevent.
  useEffect(() => {
    if (beatIdx === 0 || prefersReducedMotion()) return undefined;
    setDip(true);
    const id = window.setTimeout(() => setDip(false), DIP_MS);
    return () => window.clearTimeout(id);
  }, [beatIdx]);

  const replay = () => {
    playSfx?.('click');
    remainRef.current = null;
    setBeatIdx(0);
    setPlaying(true);
  };
  const togglePlay = () => {
    playSfx?.('click');
    setPlaying((p) => !p);
  };
  const skipToOrder = () => {
    playSfx?.('click');
    setPhase('order');
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

  const pause = useGamePause({ isAr, playSfx, onQuit: onExit });

  return (
    <div className="sgs" dir={isAr ? 'rtl' : 'ltr'}>
      <header className="sgs-top">
        <span className="sgs-mono">
          📖 {storyNo != null ? `${storyNo} · ` : ''}{L(story.title, isAr)}
        </span>
        <span className="sgs-top-right">
          {hudRight}
          {/* The platform pause. Distinct from the transport's ⏸ below, which
              pauses the STORY playback — this one stops the run and offers the
              same Resume / Quit menu every other game shows. */}
          <button
            type="button"
            className="sgs-chip"
            aria-label={pause.labels.paused}
            onClick={pause.start}
          >
            ⏸
          </button>
          <button
            type="button"
            className="sgs-chip"
            onClick={() => { playSfx?.('click'); onExit?.(); }}
          >
            {t.quitMenu}
          </button>
        </span>
      </header>
      {pause.modal}

      <div className={`sgs-stage-host${phase === 'watch' ? '' : ' recalling'}`}>
        {!stageFailed && (
          <Suspense fallback={null}>
            <StoryStage2D
              beat={stageBeat}
              cast={cast}
              isAr={isAr}
              shot={phase === 'watch' ? shot : 'wide'}
              focusX={phase === 'watch' ? focusX : 0}
              onError={() => setStageFailed(true)}
            />
          </Suspense>
        )}

        {/* Dialogue rides IN the frame, like a film subtitle — the narration
            below is the storyteller's voice, which is a different register. */}
        {phase === 'watch' && beat.say && (
          <div
            key={`say-${beatIdx}`}
            className="sgs-subtitle"
            style={{ '--who': CAST[beat.say.who]?.accent }}
          >
            <b>{L(CAST[beat.say.who]?.name, isAr)}</b>
            <span>“{L(beat.say.t, isAr)}”</span>
          </div>
        )}

        {/* Tap the picture to pause, as any video player would. */}
        {phase === 'watch' && (
          <button
            type="button"
            className="sgs-stage-tap"
            onClick={togglePlay}
            aria-label={playing ? t.pause : t.play}
          />
        )}

        <div className={dip ? 'sgs-dip on' : 'sgs-dip'} aria-hidden="true" />
      </div>

      {phase === 'watch' && (
        <div className="sgs-watch">
          <p key={`narr-${beatIdx}`} className="sgs-narr">{L(beat.narr, isAr)}</p>

          <div className="sgs-transport">
            {/* One segment per beat: filled behind you, draining on the one
                playing now. Doubles as the "how much is left" cue. */}
            <ol className="sgs-track" aria-label={t.watchingOf(beatIdx + 1, story.beats.length)}>
              {story.beats.map((b, i) => (
                <li
                  key={b.id}
                  className={i < beatIdx ? 'done' : i === beatIdx ? 'now' : ''}
                >
                  {i === beatIdx && (
                    <i
                      key={`fill-${beatIdx}`}
                      style={{
                        animationDuration: `${hold}ms`,
                        animationPlayState: playing ? 'running' : 'paused',
                      }}
                    />
                  )}
                </li>
              ))}
            </ol>

            <div className="sgs-controls">
              <button
                type="button"
                className="sgs-ctl"
                onClick={replay}
                disabled={beatIdx === 0 && playing}
                aria-label={t.replay}
                title={t.replay}
              >
                ⟲
              </button>
              <button
                type="button"
                className="sgs-ctl sgs-ctl--main"
                onClick={togglePlay}
                aria-label={playing ? t.pause : t.play}
                title={playing ? t.pause : t.play}
              >
                {playing ? '❙❙' : '▶'}
              </button>
              <button
                type="button"
                className="sgs-ctl"
                onClick={skipToOrder}
                aria-label={t.skip}
                title={t.skip}
              >
                ⏭
              </button>
            </div>
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
