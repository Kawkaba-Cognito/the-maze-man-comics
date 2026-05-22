import React, { useEffect, useState } from 'react';

/** FocusQuest-style live HUD (matches Attention cancellation task). */
export default function WordleLiveHud({
  t,
  pauseOpen,
  tlRef,
  tlimRef,
  roundTlim,
  found,
  target,
  lvlLabel,
  score,
  useSessionTimer = false,
}) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (pauseOpen) return undefined;
    let id = 0;
    const step = () => {
      setTick((n) => (n + 1) % 1_000_000);
      id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [pauseOpen]);

  const liveAnim = !pauseOpen;
  const denom = useSessionTimer
    ? tlimRef.current || 1
    : tlimRef.current || roundTlim || 1;
  const displaySeconds = useSessionTimer
    ? tlRef.current
    : tlRef.current;
  const pctTime = Math.max(0, Math.min(1, displaySeconds / denom));
  const pctFound = target > 0 ? Math.max(0, Math.min(1, found / target)) : 0;

  return (
    <>
      <div className="ct-fq-g-top" data-fq-chrome>
        <div className="ct-fq-gs">
          <div className={`ct-fq-gv ${liveAnim && tlRef.current <= 10 ? 'tv' : ''}`}>
            {`${Number(displaySeconds).toFixed(1)}s`}
          </div>
          <div className="ct-fq-gl">{t.time}</div>
        </div>
        <div className="ct-fq-gs">
          <div className="ct-fq-gv">
            {found}/{target}
          </div>
          <div className="ct-fq-gl">{t.found}</div>
        </div>
        <div className="ct-fq-gs">
          <div className="ct-fq-gv ac2">{score}</div>
          <div className="ct-fq-gl">{t.score}</div>
        </div>
        <div className="ct-fq-gs">
          <div className="ct-fq-gv sm">{lvlLabel}</div>
          <div className="ct-fq-gl">{t.lvl}</div>
        </div>
      </div>
      <div className="ct-fq-cbw" data-fq-chrome>
        <div
          className="ct-fq-cb"
          style={{
            width: `${pctTime * 100}%`,
            background:
              pctTime > 0.5
                ? 'linear-gradient(90deg,#6b9e7a,#7ab87a)'
                : pctTime > 0.2
                  ? 'linear-gradient(90deg,#e8c47a,#e8a07a)'
                  : 'linear-gradient(90deg,#e8a07a,#c97a7a)',
          }}
        />
      </div>
      <div className="ct-fq-pbw" data-fq-chrome>
        <div className="ct-fq-pb" style={{ width: `${pctFound * 100}%` }} />
      </div>
    </>
  );
}
