import React, { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { useGamePause } from '../../../../../shared/useGamePause';
import OrderBoard from './components/OrderBoard';
import ProbeQuiz from './components/ProbeQuiz';
import {
  L, castOf, focusActor, pickShot, scoreOrder, scoreProbes,
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
 * WATCH is BROWSED, not played. The learner steps between moments with back and
 * forward, jumps straight to any of them from the track, and moves on when they
 * choose; the camera still cuts between shots, dialogue still arrives as a
 * subtitle, and each cut still dips.
 *
 * It used to auto-advance on a per-beat timer (beatHold in schema.js) with
 * transport controls, on the argument that a continuous scene is truer to encode
 * episodically than a slideshow, and that a static tableau invites drilling —
 * making the ordering task measure patience rather than memory.
 *
 * That reasoning lost to a simpler one: this is the ENCODING phase of a test the
 * player is about to sit, and a fixed hold either snatches away the moment they
 * are still studying or idles on one they already have. Self-paced study beats
 * fixed-pace for recall, and the old design conceded that already by shipping
 * pause and replay — it just made the learner fight the clock to get them. The
 * timer also jumped out of the story by itself on the last beat.
 *
 * If drilling ever shows up in the data, the lever is a cap on total study time,
 * not taking the controls away again.
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
  const [dip, setDip] = useState(false);
  const [placed, setPlaced] = useState([]);
  const [probeIdx, setProbeIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [stageFailed, setStageFailed] = useState(false);

  const beat = story.beats[Math.min(beatIdx, story.beats.length - 1)];
  const isLastBeat = beatIdx >= story.beats.length - 1;

  // Framing for this beat: the authored shot or the house grammar, aimed at
  // whoever is speaking.
  const shot = useMemo(
    () => pickShot(beat, beatIdx, story.beats.length),
    [beat, beatIdx, story.beats.length],
  );
  const focusX = useMemo(() => focusActor(beat)?.x ?? 0, [beat]);

  /* No clock. The beat hold, the pause/resume time-banking and the advance
   * timeout are all gone with the auto-advance (see the header) — `beatIdx` only
   * ever changes because the learner moved it. */

  // The cut. Skipped under reduced-motion, where a flashing overlay is exactly
  // the thing the setting exists to prevent.
  useEffect(() => {
    if (beatIdx === 0 || prefersReducedMotion()) return undefined;
    setDip(true);
    const id = window.setTimeout(() => setDip(false), DIP_MS);
    return () => window.clearTimeout(id);
  }, [beatIdx]);

  const goPrev = () => {
    playSfx?.('click');
    setBeatIdx((i) => Math.max(0, i - 1));
  };
  const goNext = () => {
    playSfx?.('click');
    setBeatIdx((i) => Math.min(story.beats.length - 1, i + 1));
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
          {/* The platform pause — stops the run and offers the same Resume /
              Quit menu every other game shows. It used to need distinguishing
              from a transport ⏸ that paused playback; with the story browsed
              rather than played, this is the only pause on screen. */}
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

        {/* Tap the picture to move on, as you would turn a page. It used to
            pause playback; with the story browsed rather than played, advancing
            is the gesture that has a meaning. On the last moment it does
            nothing — leaving the stage tap to trigger `proceed` would make it
            far too easy to leave the story by accident. */}
        {phase === 'watch' && !isLastBeat && (
          <button
            type="button"
            className="sgs-stage-tap"
            onClick={goNext}
            aria-label={t.nextBeat}
          />
        )}

        <div className={dip ? 'sgs-dip on' : 'sgs-dip'} aria-hidden="true" />
      </div>

      {phase === 'watch' && (
        <div className="sgs-watch">
          <p key={`narr-${beatIdx}`} className="sgs-narr">{L(beat.narr, isAr)}</p>

          <div className="sgs-transport">
            {/* One segment per moment: filled behind you, current one marked.
                The draining fill is gone with the timer — a bar counting down
                against a self-paced reader is just false urgency. Each segment
                is now also a jump target, so a player who wants to re-check the
                third moment does not have to arrow back through the second. */}
            <ol className="sgs-track" aria-label={t.watchingOf(beatIdx + 1, story.beats.length)}>
              {story.beats.map((b, i) => (
                <li
                  key={b.id}
                  className={i < beatIdx ? 'done' : i === beatIdx ? 'now' : ''}
                >
                  <button
                    type="button"
                    className="sgs-track-jump"
                    aria-label={`${i + 1}`}
                    aria-current={i === beatIdx ? 'true' : undefined}
                    onClick={() => { playSfx?.('click'); setBeatIdx(i); }}
                  />
                </li>
              ))}
            </ol>

            {/*
              Browse, don't play.
              Back / forward through the moments, and on the LAST one the forward
              control becomes the proceed action — so "I have seen everything"
              and "I am ready to rebuild" are the same gesture, in the same
              place, instead of a separate skip button that read as giving up.
              RTL flips the glyphs: in Arabic "back" points right.
            */}
            <div className="sgs-controls">
              <button
                type="button"
                className="sgs-ctl"
                onClick={goPrev}
                disabled={beatIdx === 0}
                aria-label={t.prevBeat}
                title={t.prevBeat}
              >
                {isAr ? '›' : '‹'}
              </button>

              <span className="sgs-ctl-count" aria-hidden="true">
                {t.watchingOf(beatIdx + 1, story.beats.length)}
              </span>

              {isLastBeat ? (
                <button
                  type="button"
                  className="sgs-ctl sgs-ctl--proceed"
                  onClick={skipToOrder}
                  aria-label={t.proceed}
                  title={t.proceed}
                >
                  {t.proceed}
                </button>
              ) : (
                <button
                  type="button"
                  className="sgs-ctl sgs-ctl--main"
                  onClick={goNext}
                  aria-label={t.nextBeat}
                  title={t.nextBeat}
                >
                  {isAr ? '‹' : '›'}
                </button>
              )}
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
