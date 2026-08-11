import React, { useEffect, useState } from 'react';
import './universe-dive-transition.css';

const STAR_STREAKS = [
  ['12%', '18%', '82px', '-12deg', '40ms'],
  ['78%', '14%', '118px', '16deg', '180ms'],
  ['22%', '38%', '68px', '-7deg', '260ms'],
  ['88%', '42%', '96px', '9deg', '90ms'],
  ['6%', '61%', '124px', '-18deg', '330ms'],
  ['72%', '67%', '76px', '13deg', '210ms'],
  ['31%', '78%', '106px', '-5deg', '120ms'],
  ['91%', '81%', '138px', '19deg', '380ms'],
  ['45%', '12%', '64px', '3deg', '300ms'],
  ['57%', '88%', '92px', '-2deg', '20ms'],
];

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
}

export default function UniverseDiveTransition({ isAr = false, ready = false, failed = false, onComplete }) {
  const [minimumJourneyDone, setMinimumJourneyDone] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setMinimumJourneyDone(true),
      prefersReducedMotion() ? 160 : 2100,
    );
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!minimumJourneyDone || (!ready && !failed)) return undefined;
    setLeaving(true);
    const timer = window.setTimeout(onComplete, prefersReducedMotion() ? 80 : 520);
    return () => window.clearTimeout(timer);
  }, [failed, minimumJourneyDone, onComplete, ready]);

  const waiting = minimumJourneyDone && !ready && !failed;

  return (
    <div
      className={`universe-dive${waiting ? ' is-waiting' : ''}${leaving ? ' is-leaving' : ''}`}
      role="status"
      aria-live="polite"
      aria-label={isAr ? 'دخول عالم المتاهة' : 'Entering the maze universe'}
    >
      <div className="universe-dive__streaks" aria-hidden="true">
        {STAR_STREAKS.map(([left, top, width, angle, delay]) => (
          <i
            key={`${left}-${top}`}
            style={{
              '--streak-left': left,
              '--streak-top': top,
              '--streak-width': width,
              '--streak-angle': angle,
              '--streak-delay': delay,
            }}
          />
        ))}
      </div>

      <div className="universe-dive__atmosphere" aria-hidden="true" />
      <div className="universe-dive__horizon" aria-hidden="true" />

      <div className="universe-dive__maze" aria-hidden="true">
        <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
          <g>
            <path d="M-40 650H170V540H330V700H490V480H650V620H830V410H1010V560H1240" />
            <path d="M-20 350H130V220H300V390H430V170H610V330H760V210H930V360H1080V160H1230" />
            <path d="M110 850V700H250V570H410V760H590V590H740V740H910V610H1080V820" />
            <path d="M60-20V130H220V280H370V90H540V250H700V70H870V250H1030V40H1180V310" />
          </g>
        </svg>
      </div>

      <div className="universe-dive__copy">
        <span>{isAr ? 'رحلة إلى الداخل' : 'Journey inward'}</span>
        <strong>
          {waiting
            ? isAr
              ? 'يُبنى كونك الآن'
              : 'Your universe is taking shape'
            : isAr
              ? 'دخول كونك'
              : 'Entering your universe'}
        </strong>
        <i aria-hidden="true" />
      </div>
    </div>
  );
}
