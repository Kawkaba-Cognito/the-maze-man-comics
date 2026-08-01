import React, {
  useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import { useGamePause } from '../../../../../shared/useGamePause';
import Weather from './components/Weather';
import Cutscene from './components/Cutscene';
import CrimeScene from './components/CrimeScene';
import Interrogation3D from './components/Interrogation3D';
import EvidencePicker from './components/EvidencePicker';
import AccusationBoard from './components/AccusationBoard';
import Notebook from './components/Notebook';
import { L, lieCount, accusationFault } from './schema';
import { pickStrings, liesRemaining, formatTime } from './noirStrings';
import './noir.css';

/*
 * One case, start to finish.
 *
 * intro → scene (search) → line-up → interrogation → board → verdict
 *
 * The interrogation stage stays mounted across the line-up and the one-to-one
 * questioning so the models load once and the characters can physically step
 * forward when picked, rather than the view cutting between two scenes.
 */
export default function NoirCase({
  caseData, isAr, playSfx, caseNo, hudRight, onCaseDone, onExit,
}) {
  const t = pickStrings(isAr);
  const lieTotal = useMemo(() => lieCount(caseData), [caseData]);

  const [phase, setPhase] = useState('intro');
  const [script, setScript] = useState(null); // { lines, then }
  const [found, setFound] = useState([]);
  const [testimony, setTestimony] = useState([]);
  const [examined, setExamined] = useState(() => new Set());
  const [quirkSeen, setQuirkSeen] = useState({});
  const [lieState, setLieState] = useState({}); // "sid:i" → { done, strikes }
  const [asked, setAsked] = useState({});
  const [mistakes, setMistakes] = useState(0);
  const [activeId, setActiveId] = useState(null);
  const [acc, setAcc] = useState({});
  const [overlay, setOverlay] = useState(null); // clue card | picker | fault
  const [notebook, setNotebook] = useState(false);
  const [bigText, setBigText] = useState(null);
  const [hinted, setHinted] = useState(false);
  const [reaction, setReaction] = useState(null);
  const [stage3d, setStage3d] = useState('loading'); // loading | ready | failed

  const startedAt = useRef(Date.now());
  const timers = useRef([]);
  const later = (fn, ms) => { timers.current.push(window.setTimeout(fn, ms)); };
  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  const speakers = useMemo(() => Object.fromEntries(
    caseData.suspects.map((s) => [s.id, { name: s.name, accent: s.accent }]),
  ), [caseData]);

  const clueIds = useMemo(() => Object.keys(caseData.clues), [caseData]);
  const has = useCallback(
    (id) => found.includes(id) || testimony.includes(id),
    [found, testimony],
  );
  const liesDone = Object.values(lieState).filter((s) => s.done).length;
  const allLiesBroken = liesDone >= lieTotal;

  const say = useCallback((lines, then) => setScript({ lines, then: then || null }), []);

  // Open on the case file, then roll the briefing.
  useEffect(() => {
    startedAt.current = Date.now();
    const id = window.setTimeout(() => setScript({ lines: caseData.intro, then: null }), 700);
    return () => window.clearTimeout(id);
  }, [caseData]);

  const finishScript = useCallback(() => {
    const then = script?.then;
    setScript(null);
    then?.();
  }, [script]);

  // ── scene ──────────────────────────────────────────────────────────────
  const examine = (hotspot) => {
    if (script || overlay) return;
    playSfx?.('click');
    setExamined((prev) => new Set(prev).add(hotspot.id));

    if (hotspot.quirk?.length) {
      const seen = quirkSeen[hotspot.id] || 0;
      setQuirkSeen((q) => ({ ...q, [hotspot.id]: seen + 1 }));
      say(hotspot.quirk[Math.min(seen, hotspot.quirk.length - 1)]);
      return;
    }
    if (!hotspot.clue || found.includes(hotspot.clue)) return;

    const clue = caseData.clues[hotspot.clue];
    playSfx?.('win');
    setOverlay({ type: 'clue', id: hotspot.clue });
    later(() => {
      setOverlay(null);
      let isLast = false;
      setFound((prev) => {
        if (prev.includes(hotspot.clue)) return prev;
        const next = [...prev, hotspot.clue];
        isLast = next.length === clueIds.length;
        return next;
      });
      say(
        [{ w: 'n', t: clue.narr }],
        // Once the room is exhausted, Dr Kawkab says so rather than leaving the
        // player hunting for a clue that is not there.
        () => (isLast
          ? say([{ w: 'kawkab', t: { en: t.allCluesFound, ar: t.allCluesFound } }])
          : undefined),
      );
    }, 1100);
  };

  const useInstinct = () => {
    playSfx?.('click');
    setHinted(true);
    later(() => setHinted(false), 2600);
  };

  // ── interrogation ──────────────────────────────────────────────────────
  const askQuestion = (sid, index) => {
    if (script || overlay) return;
    playSfx?.('click');
    setAsked((a) => ({ ...a, [`${sid}:${index}`]: true }));
    const suspect = caseData.suspects.find((s) => s.id === sid);
    say([{ w: sid, t: suspect.qs[index].a }]);
  };

  const pressLie = (sid, index) => {
    if (script || overlay) return;
    const suspect = caseData.suspects.find((s) => s.id === sid);
    const lie = suspect.lies[index];
    if (lieState[`${sid}:${index}`]?.done) return;
    if (!has(lie.needs)) {
      say([{ w: 'n', t: { en: t.noProofYet, ar: t.noProofYet } }]);
      return;
    }
    playSfx?.('click');
    setOverlay({ type: 'picker', sid, index });
  };

  const presentEvidence = (evidenceId) => {
    const { sid, index } = overlay;
    const suspect = caseData.suspects.find((s) => s.id === sid);
    const lie = suspect.lies[index];
    setOverlay(null);

    if (evidenceId === lie.needs) {
      playSfx?.('win');
      setBigText(t.contradiction);
      setReaction({ sid, action: lie.react || 'rattled', nonce: Date.now() });
      later(() => setBigText(null), 950);
      later(() => {
        setLieState((prev) => ({ ...prev, [`${sid}:${index}`]: { done: true, strikes: 0 } }));
        if (lie.unlocks) {
          setTestimony((prev) => (prev.includes(lie.unlocks) ? prev : [...prev, lie.unlocks]));
        }
        say(lie.seq);
      }, 900);
      return;
    }

    playSfx?.('lose');
    setMistakes((m) => m + 1);
    setReaction({ sid, action: 'deny', nonce: Date.now() });
    setLieState((prev) => {
      const key = `${sid}:${index}`;
      const cur = prev[key] || { done: false, strikes: 0 };
      return { ...prev, [key]: { ...cur, strikes: cur.strikes + 1 } };
    });
    const reply = suspect.wrong?.[evidenceId] || suspect.wrong.def;
    say([{ w: sid, t: reply }]);
  };

  // ── accusation ─────────────────────────────────────────────────────────
  const accuse = () => {
    const fault = accusationFault(caseData, acc);
    if (!fault) {
      playSfx?.('win');
      setPhase('verdict');
      say(caseData.ending);
      return;
    }
    playSfx?.('lose');
    setMistakes((m) => m + 1);
    const name = fault === 'who'
      ? L(caseData.suspects.find((s) => s.id === acc.who)?.name, isAr)
      : '';
    const line = fault === 'who' ? t.faultWho(name)
      : fault === 'how' ? t.faultHow
        : fault === 'why' ? t.faultWhy : t.faultProof;
    say(
      [
        { w: 'n', t: { en: t.chiefFraming, ar: t.chiefFraming } },
        { w: 'kawkab', t: { en: line, ar: line } },
      ],
      () => setOverlay({ type: 'fault' }),
    );
  };

  const rank = () => {
    if (mistakes === 0) return { title: t.rankMaster, desc: t.rankMasterD };
    if (mistakes <= 2) return { title: t.rankSharp, desc: t.rankSharpD };
    if (mistakes <= 4) return { title: t.rankGood, desc: t.rankGoodD };
    return { title: t.rankBarely, desc: t.rankBarelyD };
  };

  const activeSuspect = caseData.suspects.find((s) => s.id === activeId) || null;
  const clearedIds = caseData.suspects
    .filter((s) => s.lies.every((_, i) => lieState[`${s.id}:${i}`]?.done))
    .map((s) => s.id);

  const showStage = phase === 'lineup' || phase === 'talk';

  // ── render ─────────────────────────────────────────────────────────────
  const pause = useGamePause({ isAr, playSfx, onQuit: onExit });

  return (
    <div className="nr" dir={isAr ? 'rtl' : 'ltr'}>
      <Weather onThunder={() => playSfx?.('tick')} />

      <header className="nr-top">
        <span className="nr-mono nr-top-case">🕵 {t.caseNo(caseNo)}</span>
        <span className="nr-mono nr-top-mid">
          {phase === 'scene' ? t.phaseScene
            : showStage ? t.phaseSuspects
              : phase === 'board' ? t.phaseBoard
                : phase === 'verdict' ? t.phaseClosed : ''}
        </span>
        <span className="nr-top-btns">
          {hudRight}
          <button type="button" className="nr-chip" onClick={() => { playSfx?.('click'); setNotebook((v) => !v); }}>
            {t.notebook}
          </button>
          {/* The platform pause, same menu as every other game. */}
          <button
            type="button"
            className="nr-chip"
            aria-label={pause.labels.paused}
            onClick={pause.start}
          >
            ⏸
          </button>
          <button
            type="button"
            className="nr-chip"
            aria-label={t.quitMenu}
            onClick={() => { playSfx?.('click'); onExit?.(); }}
          >
            <span className="nr-wide-only">{t.quitMenu}</span>
            <span className="nr-narrow-only" aria-hidden="true">✕</span>
          </button>
        </span>
      </header>
      {pause.modal}

      <div className="nr-body">
        {phase === 'intro' && (
          <div className="nr-center">
            <div className="nr-file">
              <h2>{L(caseData.title, isAr)}</h2>
              <div className="nr-rule" />
              <p>{L(caseData.stamp, isAr)}</p>
              <p>{L(caseData.setting, isAr)}</p>
              <p>{L(caseData.time, isAr)}</p>
            </div>
          </div>
        )}

        {phase === 'scene' && (
          <div className="nr-scene-wrap">
            <CrimeScene
              caseData={caseData}
              isAr={isAr}
              found={found}
              hinted={hinted}
              examined={examined}
              onExamine={examine}
            />
            <div className="nr-scene-cap nr-mono">{L(caseData.time, isAr)}</div>
            <div className="nr-bar">
              <button type="button" className="nr-btn" onClick={useInstinct}>{t.instinct}</button>
              <button
                type="button"
                className="nr-btn nr-btn--red"
                onClick={() => { playSfx?.('click'); setPhase('lineup'); }}
              >
                {t.toSuspects}
              </button>
            </div>
          </div>
        )}

        {showStage && (
          <>
            {stage3d !== 'failed' && (
              <Interrogation3D
                suspects={caseData.suspects}
                activeId={phase === 'talk' ? activeId : null}
                reaction={reaction}
                cleared={clearedIds}
                isAr={isAr}
                onSelect={(sid) => {
                  if (script || overlay) return;
                  playSfx?.('click');
                  setActiveId(sid);
                  setPhase('talk');
                }}
                onReady={() => setStage3d('ready')}
                onError={() => setStage3d('failed')}
              />
            )}

            {/* The panel grows now rather than hugging its content: the stage
                is a fixed band on phones (noir.css), so something has to take
                up the slack or it floats with a gap beneath it. */}
            {phase === 'lineup' && (
              <div className="nr-scroll" style={{ paddingTop: 8 }}>
                {stage3d === 'failed' && (
                  <div className="nr-lineup">
                    {caseData.suspects.map((s) => {
                      const done = clearedIds.includes(s.id);
                      const left = s.lies.filter((_, i) => !lieState[`${s.id}:${i}`]?.done).length;
                      return (
                        <button
                          type="button"
                          key={s.id}
                          className={`nr-sus${done ? ' done' : ''}`}
                          onClick={() => { playSfx?.('click'); setActiveId(s.id); setPhase('talk'); }}
                        >
                          <div className="nr-sus-face" aria-hidden="true">🕴</div>
                          <div className="nr-sus-name">{L(s.name, isAr)}</div>
                          <div className="nr-sus-role nr-mono">{L(s.role, isAr)}</div>
                          <div className="nr-sus-status nr-mono">
                            {done ? t.truthOut : liesRemaining(t, left, isAr)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
                <div className="nr-stage-hint nr-mono" style={{ position: 'static', transform: 'none', marginBottom: 10 }}>
                  {stage3d === 'loading' ? t.loading : t.suspectsSub}
                </div>
                <div className="nr-bar">
                  <button
                    type="button"
                    className="nr-btn"
                    onClick={() => { playSfx?.('click'); setPhase('scene'); }}
                  >
                    {t.backToScene}
                  </button>
                  {allLiesBroken && (
                    <button
                      type="button"
                      className="nr-btn nr-btn--red nr-btn--big"
                      onClick={() => { playSfx?.('click'); setPhase('board'); }}
                    >
                      {t.gather}
                    </button>
                  )}
                </div>
              </div>
            )}

            {phase === 'talk' && activeSuspect && (
              <div className="nr-scroll" style={{ flex: '0 1 auto', maxHeight: '58%' }}>
                <div className="nr-talk">
                  <div>
                    <div className="nr-sus-name" style={{ padding: 0, color: activeSuspect.accent }}>
                      {L(activeSuspect.name, isAr)}
                    </div>
                    <div className="nr-sus-role nr-mono" style={{ padding: '2px 0 10px' }}>
                      {L(activeSuspect.role, isAr)}
                    </div>
                    <p className="nr-desc">{L(activeSuspect.desc, isAr)}</p>

                    {activeSuspect.qs.map((q, i) => (
                      <button
                        type="button"
                        key={q.q.en}
                        className={`nr-q${asked[`${activeSuspect.id}:${i}`] ? ' asked' : ''}`}
                        onClick={() => askQuestion(activeSuspect.id, i)}
                      >
                        {asked[`${activeSuspect.id}:${i}`] ? '✓ ' : '❓ '}
                        {L(q.q, isAr)}
                      </button>
                    ))}

                    <div className="nr-liebox">
                      <h4>{activeSuspect.lies.length > 1 ? t.theLies : t.theLie}</h4>
                      {activeSuspect.lies.map((lie, i) => {
                        const st = lieState[`${activeSuspect.id}:${i}`] || { done: false, strikes: 0 };
                        const canPress = has(lie.needs);
                        return (
                          <div key={lie.claim.en} className={`nr-lie${st.done ? ' done' : ''}`}>
                            <q>{L(lie.claim, isAr)}</q>
                            {st.done ? (
                              <span className="nr-lie-done">{t.truthOut}</span>
                            ) : (
                              <button
                                type="button"
                                className="nr-btn nr-btn--red"
                                onClick={() => pressLie(activeSuspect.id, i)}
                              >
                                {canPress ? t.pressLie : t.needProof}
                              </button>
                            )}
                            {!st.done && st.strikes >= 3 && (
                              <p className="nr-hint">💡 {L(lie.hint, isAr)}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="nr-bar" style={{ justifyContent: 'flex-start' }}>
                      <button
                        type="button"
                        className="nr-btn"
                        onClick={() => { playSfx?.('click'); setActiveId(null); setPhase('lineup'); }}
                      >
                        {t.hallway}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {phase === 'board' && (
          <div className="nr-scroll">
            <h2>{t.phaseBoard}</h2>
            <div className="nr-mono" style={{ color: 'var(--nr-dim)', margin: '8px 0 20px' }}>
              {t.boardSub}
            </div>
            <AccusationBoard
              caseData={caseData}
              isAr={isAr}
              t={t}
              found={found}
              acc={acc}
              onPick={(axis, v) => { playSfx?.('click'); setAcc((a) => ({ ...a, [axis]: v })); }}
              onAccuse={accuse}
            />
          </div>
        )}

        {phase === 'verdict' && !script && (
          <div className="nr-scroll">
            <div className="nr-verdict">
              <div className="nr-verdict-stamp">{t.solved}</div>
              <h2 className="nr-rank">{rank().title}</h2>
              <p className="nr-rank-d">{rank().desc}</p>
              <div className="nr-statline">
                {t.statLine(
                  found.length,
                  liesDone,
                  mistakes,
                  formatTime(Date.now() - startedAt.current, isAr),
                )}
              </div>
              <button
                type="button"
                className="nr-btn nr-btn--big"
                onClick={() => { playSfx?.('click'); onCaseDone?.({ win: true, mistakes }); }}
              >
                {t.nextCase}
              </button>
            </div>
          </div>
        )}
      </div>

      {notebook && (
        <Notebook
          caseData={caseData}
          isAr={isAr}
          t={t}
          found={found}
          testimony={testimony}
          liesDone={liesDone}
          lieTotal={lieTotal}
          mistakes={mistakes}
          onClose={() => { playSfx?.('click'); setNotebook(false); }}
        />
      )}

      {overlay?.type === 'clue' && (
        <div className="nr-modal">
          <div className="nr-card">
            <div className="nr-card-icon" aria-hidden="true">{caseData.clues[overlay.id].e}</div>
            <h3>{L(caseData.clues[overlay.id].name, isAr)}</h3>
            <div className="nr-stamp">{t.acquired}</div>
          </div>
        </div>
      )}

      {overlay?.type === 'picker' && (
        <EvidencePicker
          caseData={caseData}
          isAr={isAr}
          t={t}
          found={found}
          testimony={testimony}
          onPick={presentEvidence}
          onCancel={() => { playSfx?.('click'); setOverlay(null); }}
        />
      )}

      {overlay?.type === 'fault' && (
        <div className="nr-modal">
          <div className="nr-info">
            <h3>{t.warrantTitle}</h3>
            <p>{t.warrantBody}</p>
            <button
              type="button"
              className="nr-btn nr-btn--red"
              onClick={() => { playSfx?.('click'); setOverlay(null); }}
            >
              {t.backToBoard}
            </button>
          </div>
        </div>
      )}

      {bigText && <div className="nr-bigtext">{bigText}</div>}

      {script && (
        <Cutscene
          key={`${phase}-${script.lines[0]?.t?.en?.slice(0, 24)}`}
          lines={script.lines}
          isAr={isAr}
          speakers={speakers}
          playSfx={playSfx}
          onDone={() => {
            if (phase === 'intro') { setScript(null); setPhase('scene'); return; }
            finishScript();
          }}
        />
      )}
    </div>
  );
}
