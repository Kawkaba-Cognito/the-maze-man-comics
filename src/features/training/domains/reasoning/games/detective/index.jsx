import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';
import { makeRng } from '../../../../shared/rng';
import { cast2dUrl } from '../../../../shared/cast2d';
import Emoji from '../../../../../../components/shared/Emoji';
import { useGamePause } from '../../../../shared/useGamePause';
import { TrainingPlayHeader } from '../../../../shared/TrainingChrome';
import { createTrialLog } from '../../../../shared/trialLog';
import { assetUrl } from '../../../../../../lib/assetUrl';
import {
  TRAITS, buildCase, evalStatement, LADDER_LEVELS, levelCfg, levelPassed, nameOf as nameOfId,
  passCfg, scoreClearAll, survivalCfg,
} from './data.js';
import { T, ruleText, sayText } from './strings.js';

/*
 * DETECTIVE KAWKAB — Liars' Ring.
 *
 * A case is a handful of suspects, one statement each, and a rule about who
 * lies. Read them, work out the only arrangement that holds, answer. Under a
 * minute; four cases to a level.
 *
 * Replaced the noir investigation engine on 2026-08-17 — that version was a
 * five-minute authored adventure (search the scene, interrogate, build a proof
 * chain) across ~40 files, with no way to generate or verify a case. See
 * data.js for the model and scripts/validate-liars.mjs for the gate.
 *
 * ── WHAT KEEPS IT FROM BEING THE SAME PUZZLE TWICE ──
 * Seven question shapes (who · who is lying · who is honest · how many lie ·
 * is X guilty incl. NOT ENOUGH EVIDENCE · tap everyone provably innocent ·
 * which statement is load-bearing), twelve statement types and six rules, all
 * drawn per case from the tier's pool. The mix is weighted deliberately in
 * data.js and asserted by the gate, because the first version let whichever
 * question was easiest to satisfy take over the tier.
 *
 * ── THE NOTEBOOK ──
 * From four suspects up, tapping a suspect's card cycles a private mark
 * (unmarked → cleared → suspect). It scores nothing. It is there because the
 * construct is REASONING, and without somewhere to park a partial conclusion a
 * five-suspect case quietly becomes a working-memory test instead.
 */

const KAWKAB_URL = assetUrl('Assets/characters/kawkab/kawkab-planet.webp');
const KAWKAB_ASPECT = 480 / 546;

/*
 * ── THE NOTEBOOK AND THE HOLDING CELL ────────────────────────────────────
 *
 * Two gestures, deliberately different weights:
 *   TAP  cycles a private mark — unmarked → cleared → held → unmarked.
 *   DRAG a suspect down into the cell to lock them up.
 *
 * The marks are private working memory and score nothing — they exist because
 * the construct here is REASONING, and without somewhere to park a partial
 * conclusion a five-suspect case quietly becomes a working-memory test.
 *
 * ⚠ THE GESTURES ARE SPLIT BY WEIGHT, NOT BY TASTE. A mark is a thought and
 * costs a tap; an arrest is a COMMITMENT and costs a deliberate drag across the
 * screen. When the cell sat at the end of the tap cycle, a third tap while
 * taking notes jailed somebody by accident, and the one scored decision in the
 * game was the easiest thing on it to do by mistake.
 *
 * `jail` is different: it is a COMMITMENT, at most one per case, and it is
 * scored against the case's consistent worlds. Its whole point is that it asks
 * a question the case's own question often does not — "who do you actually
 * think did it" — so a level that asks how many are lying still exercises the
 * judgement the game is named for.
 *
 * ⚠ IT IS SCORED SEPARATELY AND NEVER FOLDED INTO `ok`. Correctness of the
 * ANSWER is the measure this game feeds to rating.js; a bonus judgement bolted
 * onto the same number would make two players with identical reasoning score
 * differently, and would quietly change what the reasoning domain means. Same
 * discipline CLAUDE.md records for keeping Intercept's three measures apart.
 */
/* The tap cycle. `jail` is NOT in it — the cell is reached by dragging, or by
   the cell's own picker (below), never by tapping a card one more time. */
const MARKS = ['none', 'clear', 'suspect'];
const MARK_ICON = { none: '', clear: '✓', suspect: '?', jail: '🔒' };

/*
 * Questions whose answer IS a person. For these the jail is the answer box:
 * you drag the one you accuse into it and submit, and — following Hotel
 * Oddity's tray in the Grand Parlor prototype — they LEAVE THE LINE-UP while
 * they are in there, so a name is never on screen twice. The old build showed
 * the same three faces in the line-up and again as answer buttons directly
 * below, which read as two different questions.
 *
 * The other kinds answer with a number, a yes/no/unsure, or a statement, so
 * they never duplicated a name; they keep their own controls and the jail
 * stays what it was there — a separate arrest, scored apart from the answer.
 */
const PERSON_Q = new Set(['who', 'liar', 'honest']);

/* How far a pointer must travel before a press counts as a drag rather than a
   tap. Below it the card's own onClick still runs and cycles the mark. */
const DRAG_SLOP = 7;
/* The cell's hit box is grown by this much while a drag is live. A thumb is
   fatter than a 40px row, and a drop that lands *almost* on the cell reading as
   a cancel is the whole difference between premium and fiddly. */
const DROP_PAD = 20;

export function DetectiveEngine({
  mode, level, seed, attempt, onResult, onExit, isAr, playSfx, awardPoints, cosmos = false,
}) {
  const t = isAr ? T.ar : T.en;
  const lang = isAr ? 'ar' : 'en';
  const rng = useMemo(() => (seed != null ? makeRng(seed) : Math.random), [seed]);
  const nameOf = useCallback((id) => nameOfId(id, lang), [lang]);
  const traitWord = useCallback((id) => (TRAITS[id] ? TRAITS[id][lang] : ''), [lang]);

  const stageRef = useRef(0);
  const roundsRef = useRef(0);
  const bestRef = useRef(0);
  const ppDoneRef = useRef(0);
  const ppCorrectRef = useRef(0);
  const askedAtRef = useRef(0);
  const trialLogRef = useRef(null);

  const [caseData, setCaseData] = useState(null);
  const [idx, setIdx] = useState(0);
  const [total, setTotal] = useState(4);
  const [marks, setMarks] = useState({});
  const [choice, setChoice] = useState(null);       // suspect id · number · 'yes'/'no'/'unknown' · statement index
  const [multi, setMulti] = useState(() => new Set()); // clearAll picks
  const [judged, setJudged] = useState(null);       // { ok } once confirmed
  const [results, setResults] = useState([]);
  const [done, setDone] = useState(false);

  const handleExit = useCallback(() => {
    if (mode === 'free') {
      trialLogRef.current?.finish({ rounds: roundsRef.current, best: bestRef.current });
      trialLogRef.current = null;
    }
    onExit();
  }, [mode, onExit]);
  const pause = useGamePause({ isAr, playSfx, onQuit: handleExit });

  const cfgFor = useCallback(() => {
    if (mode === 'levels') return levelCfg(level);
    if (mode === 'passplay') return level ? levelCfg(level) : passCfg();
    return survivalCfg(stageRef.current);
  }, [mode, level]);

  const dealCase = useCallback(() => {
    const cfg = cfgFor();
    let c = buildCase(rng, cfg);
    // A config that cannot deal is a dead level, so fall back to the plainest
    // possible case rather than showing an empty board. The gate asserts this
    // path is never needed in practice; it exists so it cannot ever be fatal.
    if (!c) c = buildCase(rng, { ...cfg, questions: ['who'], kit: ['accuse', 'clear', 'selfClear'], rules: ['exactlyTrue'], evidenceChance: 0 });
    setCaseData(c);
    setMarks({});
    setChoice(null);
    setMulti(new Set());
    setJudged(null);
    askedAtRef.current = typeof performance !== 'undefined' ? performance.now() : Date.now();
    return c;
  }, [cfgFor, rng]);

  useEffect(() => {
    const cfg = cfgFor();
    setTotal(cfg.cases || 4);
    dealCase();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  useEffect(() => {
    trialLogRef.current?.discard();
    trialLogRef.current = createTrialLog({ game: 'detective', mode, meta: { level } });
    return () => { trialLogRef.current?.discard(); trialLogRef.current = null; };
  }, [mode, level]);

  const q = caseData ? caseData.question : null;
  const isMulti = q && q.kind === 'clearAll';
  /** True when the jail IS the answer box rather than a separate arrest. */
  const jailIsAnswer = !!q && PERSON_Q.has(q.kind);

  /** Who is in the cell right now — at most one, by construction. */
  const jailed = useMemo(
    () => Object.keys(marks).find((id) => marks[id] === 'jail') || null,
    [marks],
  );

  // clearAll needs at least one pick like every other kind: scoreClearAll wants
  // hits === want.length with no false alarms, and validate:liars guarantees
  // `want` is never empty — so an empty submission can only ever be wrong. Armed
  // from the first frame, one stray tap burned the case with no confirmation.
  const canConfirm = isMulti ? multi.size > 0 : (jailIsAnswer ? jailed != null : choice != null);

  const cycleMark = (id) => {
    if (judged) return;
    playSfx?.('click');
    setMarks((m) => {
      // Somebody in the cell who gets tapped comes out of it first, rather than
      // jumping to the next mark — the visible state and the gesture agree.
      const cur = m[id] === 'jail' ? 'none' : (m[id] || 'none');
      return { ...m, [id]: MARKS[(MARKS.indexOf(cur) + 1) % MARKS.length] };
    });
  };

  /* ── dragging a suspect into the cell ─────────────────────────────────────
   *
   * Pointer events, so one code path covers mouse, touch and pen — the same
   * choice story-grid's scene swipe makes.
   *
   * The card MOVES ITSELF with a transform rather than a floating clone.
   * `#ui-shell` traps `position: fixed` (it is a transformed ancestor), so a
   * fixed ghost would need a portal to body; a transform is relative to the
   * card's own layout box and simply cannot be trapped. The cell sits directly
   * under the line-up, so the whole gesture is ~80px and never leaves the
   * scroll container.
   */
  const [drag, setDrag] = useState(null); // { id, dx, dy, over } while in hand
  const dragRef = useRef(null);
  const cellRef = useRef(null);
  const dragEndedAt = useRef(0);

  /** Point-in-cell, with a thumb-sized tolerance. */
  const overCell = useCallback((x, y) => {
    const r = cellRef.current?.getBoundingClientRect();
    if (!r) return false;
    return x >= r.left - DROP_PAD && x <= r.right + DROP_PAD
      && y >= r.top - DROP_PAD && y <= r.bottom + DROP_PAD;
  }, []);

  /** Put somebody in the cell, releasing whoever was already in it. */
  const putInCell = useCallback((id) => {
    setMarks((m) => {
      const out = { ...m };
      // The cell holds ONE. The evicted suspect keeps a `?`, not a blank — they
      // were on your list a second ago and losing that is losing your notes.
      for (const other of Object.keys(out)) if (out[other] === 'jail') out[other] = 'suspect';
      out[id] = 'jail';
      return out;
    });
  }, []);

  const emptyCell = useCallback(() => {
    setMarks((m) => {
      const out = { ...m };
      for (const id of Object.keys(out)) if (out[id] === 'jail') out[id] = 'suspect';
      return out;
    });
  }, []);

  /*
   * `from` is which side the drag started on — 'lineup' or 'jail'. The gesture
   * is symmetrical on purpose: whatever you can drag in, you can drag back out,
   * and a door that only opens one way is the thing a player notices first.
   */
  const onCardDown = (e, id, from = 'lineup') => {
    if (judged) return; // === !showNotebook, which is declared further down
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragRef.current = { id, from, x0: e.clientX, y0: e.clientY, moved: false, pid: e.pointerId };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* capture is a nicety */ }
  };

  const onCardMove = (e) => {
    const d = dragRef.current;
    if (!d || d.pid !== e.pointerId) return;
    const dx = e.clientX - d.x0;
    const dy = e.clientY - d.y0;
    if (!d.moved) {
      if (Math.hypot(dx, dy) < DRAG_SLOP) return;
      d.moved = true;
      playSfx?.('click'); // the lift
    }
    setDrag({ id: d.id, from: d.from, dx, dy, over: overCell(e.clientX, e.clientY) });
  };

  const onCardUp = (e) => {
    const d = dragRef.current;
    dragRef.current = null;
    setDrag(null);
    if (!d || d.pid !== e.pointerId || !d.moved) return; // a tap: let onClick handle it
    // A drag is not also a tap. Pointer capture means the trailing click may
    // land anywhere or not fire at all, so this is a timestamp rather than a
    // flag — a flag left set would eat the NEXT genuine tap.
    dragEndedAt.current = Date.now();
    const dropped = overCell(e.clientX, e.clientY);
    if (d.from === 'jail') {
      // Carried out of the cell and let go: they walk. Dropped back inside, the
      // door simply shuts again.
      if (!dropped) { emptyCell(); playSfx?.('click'); }
    } else if (dropped && marks[d.id] !== 'jail') {
      putInCell(d.id);
      playSfx?.('collect');
    }
  };

  const onCardCancel = () => { dragRef.current = null; setDrag(null); };

  /*
   * The cell is ALSO a picker, and that is an accessibility requirement rather
   * than a convenience: tapping it walks nobody → first suspect → … → nobody.
   *
   * ⚠ Do not remove it to make dragging the only way in. CLAUDE.md records
   * Mirror World shipping an accessible control that could not reach the win
   * condition — 156 of 300 levels unpassable, with every button rendering and
   * every tap registering. A drag needs a pointer that can press, move and hold;
   * a keyboard has none, and neither does a player with a tremor.
   */
  const pickNextForCell = () => {
    if (!caseData || judged) return;
    const order = caseData.people;
    const at = jailed ? order.indexOf(jailed) : -1;
    const next = order[at + 1] || null;
    playSfx?.(next ? 'collect' : 'click');
    if (next) putInCell(next); else emptyCell();
  };

  /**
   * How the cell's occupant stands against the evidence.
   *   sound    — the thief in EVERY consistent world
   *   wrongful — the thief in NONE of them
   *   open     — the thief in some but not all: allowed, but not settled
   */
  const jailVerdict = useCallback((c, who) => {
    if (!who || !c) return null;
    if (c.worlds.every((w) => w.thief === who)) return 'sound';
    if (c.worlds.every((w) => w.thief !== who)) return 'wrongful';
    return 'open';
  }, []);

  const confirm = () => {
    if (!caseData || judged || !canConfirm) return;
    let ok;
    let given;
    if (isMulti) {
      const s = scoreClearAll(multi, caseData.answer);
      ok = s.ok;
      given = [...multi].sort().join(',');
    } else {
      // On a person question the jail's occupant IS the submitted answer.
      given = String(jailIsAnswer ? jailed : choice);
      ok = given === String(caseData.answer);
    }
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    /*
     * The separate arrest verdict only exists where the jail is NOT the answer.
     * When it is, "sound arrest" alongside "SOLVED" would be the same fact
     * stamped twice, and the 2-point bonus would silently double the value of
     * one question kind.
     */
    const jv = jailIsAnswer ? null : jailVerdict(caseData, jailed);
    trialLogRef.current?.trial({
      ok,
      // The cell, recorded as its OWN fields. `ok` above is untouched by it.
      jailed: jailed || null,
      jailVerdict: jv,
      kind: q.kind,
      rule: caseData.rule.kind,
      suspects: caseData.people.length,
      // how many arrangements survived: 1 = fully determined, >1 = the player
      // had to answer under genuine uncertainty. Worth separating in analysis.
      worlds: caseData.tally,
      given,
      rt: Math.max(0, Math.round(now - askedAtRef.current)),
    });
    setJudged({ ok, jail: jv, jailedId: jailed });
    setResults((r) => [...r, ok]);
    // A sound arrest is worth something on its own, so the cell is a real
    // decision rather than a sticker. It cannot rescue a wrong answer.
    if (jv === 'sound') awardPoints?.(2);
    playSfx?.(ok ? 'win' : 'error');
  };

  const advance = () => {
    playSfx?.('click');
    if (idx >= total - 1) { setDone(true); return; }
    setIdx(idx + 1);
    dealCase();
  };

  const finishRun = useCallback(() => {
    playSfx?.('click');
    const n = results.filter(Boolean).length;
    const m = results.length;
    const won = m > 0 && levelPassed(n, m);
    if (mode === 'levels') {
      trialLogRef.current?.finish({ won, score: n, level });
      trialLogRef.current = null;
      onResult({ won, score: n, summary: t.score(n, m) });
      return;
    }
    if (mode === 'passplay') {
      ppCorrectRef.current += n; ppDoneRef.current += 1;
      trialLogRef.current?.finish({ score: ppCorrectRef.current, rounds: ppDoneRef.current });
      trialLogRef.current = null;
      onResult({ score: ppCorrectRef.current });
      return;
    }
    // Survival: one case a round, so the ladder moves on every case.
    roundsRef.current += 1;
    if (n === m) { stageRef.current += 1; awardPoints?.(3); }
    else stageRef.current = Math.max(0, stageRef.current - 1);
    bestRef.current = Math.max(bestRef.current, stageRef.current);
    setResults([]);
    setIdx(0);
    setDone(false);
    dealCase();
  }, [mode, results, onResult, t, playSfx, awardPoints, level, dealCase]);

  const hudSub = mode === 'levels'
    ? (isAr ? `مستوى ${level}` : `Level ${level}`)
    : mode === 'passplay'
      ? (isAr ? `✓${ppCorrectRef.current}` : `✓${ppCorrectRef.current}`)
      : (isAr ? `قضية ${roundsRef.current + 1} · أفضل ${bestRef.current}` : `Case ${roundsRef.current + 1} · best ${bestRef.current}`);

  if (!caseData) {
    return <div style={cosmos ? { ...S.root, ...S.cosmosRoot } : S.root} dir={isAr ? 'rtl' : 'ltr'} />;
  }

  const rootStyle = cosmos ? { ...S.root, ...S.cosmosRoot } : S.root;
  const cardStyle = cosmos ? { ...S.card, ...S.cosmosCard } : S.card;
  /*
   * The notebook used to appear only from four suspects up, because two private
   * marks were clutter on a three-suspect board. The cycle now ends in the
   * holding cell, which is a real mechanic and the game's namesake judgement, so
   * it is available on every case.
   */
  const showNotebook = !judged;
  const solvedCount = results.filter(Boolean).length;

  /* ── the run is over ── */
  if (done) {
    const n = solvedCount;
    const m = results.length;
    return (
      <div style={rootStyle} className={cosmos ? 'c3d-embed-root' : undefined} dir={isAr ? 'rtl' : 'ltr'}>
        <Header t={t} sub={hudSub} pause={pause} cosmos={cosmos} isAr={isAr} playSfx={playSfx} />
        {pause.modal}
        <div style={S.body}>
          <div style={cardStyle}>
            <div style={S.verdictBig}>{n === m ? t.perfect : t.score(n, m)}</div>
            <div style={S.marksRow}>
              {results.map((ok, i) => (
                <span key={i} style={{ ...S.mark, ...(ok ? S.markOk : S.markBad) }} />
              ))}
            </div>
          </div>
          <button type="button" style={S.primary} onClick={finishRun}>{t.cont}</button>
        </div>
      </div>
    );
  }

  return (
    <div style={rootStyle} className={cosmos ? 'c3d-embed-root' : undefined} data-c3d-embed={cosmos || undefined} dir={isAr ? 'rtl' : 'ltr'}>
      <Header t={t} sub={hudSub} pause={pause} cosmos={cosmos} isAr={isAr} playSfx={playSfx} />
      {pause.modal}

      <div style={S.body}>
        <div style={cardStyle}>
          {/* case counter + streak */}
          <div style={S.hud}>
            <span>{t.caseOf(idx + 1, total)}</span>
            <span style={S.marksRow}>
              {Array.from({ length: total }).map((_, i) => (
                <span
                  key={i}
                  style={{
                    ...S.mark,
                    ...(results[i] === true ? S.markOk : null),
                    ...(results[i] === false ? S.markBad : null),
                    ...(i === idx && results[i] == null ? S.markNow : null),
                  }}
                />
              ))}
            </span>
          </div>

          {/* the rule */}
          <div style={S.ruleCard}>
            <span style={S.ruleLabel}>{t.ruleLabel}</span>
            {ruleText(caseData.rule, t, caseData.people)}
          </div>

          {/* forensic evidence, when the case has any */}
          {caseData.evidence && (
            <div style={{ ...S.ruleCard, ...S.evidenceCard }}>
              <span style={S.ruleLabel}>
                <Emoji char="🔬" /> {t.evidenceLabel}
              </span>
              {t.evidence[caseData.evidence.polarity === 'not' ? 'not' : 'has'](traitWord(caseData.evidence.trait))}
            </div>
          )}

          {/* the line-up */}
          <div style={S.lineUp}>
            {/* Somebody in the jail is NOT also standing in the line-up — the
                Hotel Oddity rule, and the whole point: one name, one place.
                After judging everyone comes back, because the reveal has to be
                able to colour the thief's card. */}
            {caseData.people.filter((p) => judged || marks[p] !== 'jail').map((p) => {
              const mk = marks[p] || 'none';
              const revealed = judged && caseData.tally === 1;
              const isThief = revealed && caseData.worlds[0].thief === p;
              const inHand = drag?.id === p;
              return (
                <button
                  key={p}
                  type="button"
                  disabled={!showNotebook}
                  onPointerDown={(e) => onCardDown(e, p)}
                  onPointerMove={onCardMove}
                  onPointerUp={onCardUp}
                  onPointerCancel={onCardCancel}
                  onClick={() => {
                    // Swallow the click that trails a drag; see onCardUp.
                    if (Date.now() - dragEndedAt.current < 350) return;
                    cycleMark(p);
                  }}
                  aria-label={nameOf(p)}
                  style={{
                    ...S.sus,
                    ...(mk === 'clear' ? S.susClear : null),
                    ...(mk === 'suspect' ? S.susMark : null),
                    ...(mk === 'jail' ? S.susJail : null),
                    ...(isThief ? S.susThief : null),
                    ...(showNotebook ? S.susGrab : null),
                    // Everyone else recedes, so the card in hand reads as lifted
                    // off the board rather than merely tinted.
                    ...(drag && !inHand ? S.susAside : null),
                    ...(inHand ? S.susInHand : null),
                    ...(inHand ? {
                      transform: `translate(${drag.dx}px, ${drag.dy}px) `
                        + `rotate(${Math.max(-7, Math.min(7, drag.dx * 0.07))}deg) `
                        + `scale(${drag.over ? 1.14 : 1.07})`,
                    } : null),
                    cursor: showNotebook ? (inHand ? 'grabbing' : 'grab') : 'default',
                  }}
                >
                  <img src={cast2dUrl(p)} alt="" aria-hidden="true" draggable="false" style={S.susArt} />
                  <span style={S.susName}>{nameOf(p)}</span>
                  {caseData.traits && (
                    <span style={S.traitRow}>
                      {(caseData.traits[p] || []).map((tr) => (
                        <span key={tr} style={S.trait}><Emoji char={TRAITS[tr].e} /></span>
                      ))}
                    </span>
                  )}
                  {mk !== 'none' && !judged && <span style={S.markBadge}>{MARK_ICON[mk]}</span>}
                </button>
              );
            })}
          </div>
          {/* ── the holding cell ──
              Rendered as its own row rather than left implicit in a card's
              border, because it is a COMMITMENT and the player has to be able
              to see at a glance who they have decided to hold. */}
          {showNotebook && <div style={S.hint}>{t.notebookHint}</div>}

          {/* the statements */}
          <div style={S.says}>
            {caseData.says.map((s, i) => {
              const world = judged ? caseData.worlds[0] : null;
              const val = world ? evalStatement(s, world, { people: caseData.people, traits: caseData.traits }) : null;
              const keyPick = q.kind === 'key';
              const picked = keyPick && choice === i;
              const isAnswer = keyPick && judged && q.about === i;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={!keyPick || !!judged}
                  onClick={() => { if (keyPick && !judged) { playSfx?.('click'); setChoice(i); } }}
                  style={{
                    ...S.say,
                    ...(keyPick && !judged ? S.sayPick : null),
                    ...(picked ? S.sayPicked : null),
                    ...(isAnswer ? S.sayOk : null),
                    ...(judged && caseData.tally === 1 ? (val ? S.sayTrue : S.sayFalse) : null),
                  }}
                >
                  <img src={cast2dUrl(s.by)} alt="" aria-hidden="true" draggable="false" style={S.sayArt} />
                  <span style={S.sayBody}>
                    <span style={S.sayName}>{nameOf(s.by)}</span>
                    <span>{`“${sayText(s, t, nameOf, traitWord)}”`}</span>
                  </span>
                  {judged && caseData.tally === 1 && (
                    <span style={{ ...S.sayVerdict, ...(val ? S.sayVerdictTrue : S.sayVerdictFalse) }}>
                      {val ? t.truth : t.lie}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* the question — Detective Kawkab asks it, so the hub mascot is the
              one running the case rather than a disembodied prompt */}
          <div style={S.askRow}>
            <img
              src={KAWKAB_URL}
              alt=""
              aria-hidden="true"
              draggable="false"
              style={{ ...S.detective, height: Math.round(56 / KAWKAB_ASPECT) }}
            />
            <div style={S.question}>
              {q.kind === 'verdict' ? t.q.verdict(nameOf(q.about)) : t.q[q.kind]}
            </div>
          </div>

          {/* The answer controls — skipped entirely on a person question, where
              the jail below IS the answer box. */}
          {!judged && !jailIsAnswer && (
            <AnswerControls
              q={q}
              caseData={caseData}
              t={t}
              nameOf={nameOf}
              choice={choice}
              setChoice={(v) => { playSfx?.('click'); setChoice(v); }}
              multi={multi}
              toggleMulti={(id) => {
                playSfx?.('click');
                setMulti((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
              }}
            />
          )}

          {/* ── THE JAIL ──
              Always on screen, down at the bottom where a cell belongs, and on
              a person question it is where the answer goes. Drag a suspect in
              (or tap it to cycle through them) and submit. */}
          <div
            ref={cellRef}
            style={{
              ...S.jail,
              /* Only light up as a target for a card coming IN. During a drag
                 OUT the accent would be telling you to drop where you are
                 already leaving, which is the cancel, not the action. */
              ...(drag?.from === 'lineup' ? S.jailArmed : null),
              ...(drag?.from === 'lineup' && drag.over ? S.jailOver : null),
              ...(jailed && !drag ? S.jailFull : null),
            }}
          >
            <div style={S.jailHead}>
              <span style={S.cellLabel}>
                <Emoji char="🔒" /> {jailIsAnswer ? t.jailAccuse : t.cellLabel}
              </span>
              {showNotebook && (
                <button type="button" onClick={pickNextForCell} aria-label={t.cellPick} style={S.jailPick}>
                  {t.cellPickShort}
                </button>
              )}
            </div>

            <div
              style={{
                ...S.jailBay,
                ...(jailed && !drag ? S.jailBayShut : null),
                /* ⚠ The bay clips (overflow hidden gives the cell its recessed
                   mouth). Carrying the occupant out would make them VANISH at
                   the edge instead of following the finger, so the walls come
                   off for the duration of that one gesture. */
                ...(drag?.from === 'jail' ? S.jailBayOpen : null),
              }}
            >
              {/* The door only closes once somebody is inside. Bars over an
                  EMPTY cell read as a fence across the drop target — and the
                  first build drew them over the "drag your answer in" label,
                  which made the one instruction on screen unreadable. */}
              {jailed && !drag && <div aria-hidden="true" style={S.jailBars} />}
              {drag && drag.from === 'lineup' ? (
                <span style={{ ...S.cellEmpty, ...(drag.over ? S.cellDropNow : null) }}>
                  {drag.over ? t.cellDrop : t.cellDragHere}
                </span>
              ) : jailed ? (
                /* The occupant is draggable BACK OUT, and a plain tap releases
                   them too — the same thing tapping a filled room does in the
                   Hotel Oddity prototype this is modelled on. */
                <button
                  type="button"
                  disabled={!showNotebook}
                  onPointerDown={(e) => onCardDown(e, jailed, 'jail')}
                  onPointerMove={onCardMove}
                  onPointerUp={onCardUp}
                  onPointerCancel={onCardCancel}
                  onClick={() => {
                    if (Date.now() - dragEndedAt.current < 350) return;
                    playSfx?.('click');
                    emptyCell();
                  }}
                  aria-label={t.cellFree(nameOf(jailed))}
                  style={{
                    ...S.jailWho,
                    ...(showNotebook ? S.susGrab : null),
                    ...(drag?.from === 'jail' ? S.jailWhoOut : null),
                    ...(drag?.from === 'jail' ? {
                      transform: `translate(${drag.dx}px, ${drag.dy}px) `
                        + `rotate(${Math.max(-7, Math.min(7, drag.dx * 0.07))}deg) scale(1.07)`,
                    } : null),
                    cursor: showNotebook ? (drag?.from === 'jail' ? 'grabbing' : 'grab') : 'default',
                  }}
                >
                  <img src={cast2dUrl(jailed)} alt="" aria-hidden="true" draggable="false" style={S.jailArt} />
                  <span style={S.jailName}>{nameOf(jailed)}</span>
                </button>
              ) : (
                <span style={S.cellEmpty}>{jailIsAnswer ? t.jailEmptyAccuse : t.cellEmpty}</span>
              )}
            </div>
          </div>
          {showNotebook && (
            <div style={S.hint}>
              {drag?.from === 'jail' ? t.cellFreeHint
                : jailed ? t.cellOutHint
                  : jailIsAnswer ? t.jailHintAccuse : t.cellHint}
            </div>
          )}

          {/* the verdict */}
          {judged && (
            <>
              <div style={S.stampWrap}>
                <div style={{ ...S.stamp, ...(judged.ok ? S.stampOk : S.stampNo) }}>
                  {judged.ok ? t.solved : t.missed}
                </div>
              </div>
              {/* The cell's own verdict — a separate line, deliberately. It is
                  never merged into Solved/Missed above, because the answer is
                  what the domain score is built from. */}
              {judged.jail && (
                <div
                  style={{
                    ...S.jailVerdict,
                    ...(judged.jail === 'sound' ? S.jailSound
                      : judged.jail === 'wrongful' ? S.jailWrong : S.jailOpen),
                  }}
                >
                  <Emoji char={judged.jail === 'sound' ? '🔒' : judged.jail === 'wrongful' ? '🕊️' : '🕰️'} />
                  {' '}
                  {t[judged.jail === 'sound' ? 'jailSound' : judged.jail === 'wrongful' ? 'jailWrongful' : 'jailOpen'](nameOf(judged.jailedId))}
                </div>
              )}
              <Explanation caseData={caseData} t={t} nameOf={nameOf} />
            </>
          )}
        </div>

        {!judged ? (
          <button
            type="button"
            style={{ ...S.primary, ...(canConfirm ? null : S.primaryOff) }}
            disabled={!canConfirm}
            onClick={confirm}
          >
            {canConfirm ? t.confirm : t.confirmOff}
          </button>
        ) : (
          <button type="button" style={S.primary} onClick={advance}>
            {idx >= total - 1 ? t.closeFile : t.nextCase}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── the answer row, per question shape ─────────────────────────────────── */
function AnswerControls({ q, caseData, t, nameOf, choice, setChoice, multi, toggleMulti }) {
  if (q.kind === 'count') {
    return (
      <div style={S.answerRow}>
        {Array.from({ length: caseData.people.length + 1 }).map((_, k) => (
          <button
            key={k}
            type="button"
            aria-pressed={choice === String(k)}
            onClick={() => setChoice(String(k))}
            style={{ ...S.numBtn, ...(choice === String(k) ? S.answerSel : null) }}
          >
            {k}
          </button>
        ))}
      </div>
    );
  }
  if (q.kind === 'verdict') {
    const opts = [['yes', t.verdictYes], ['no', t.verdictNo], ['unknown', t.verdictUnknown]];
    return (
      <div style={S.answerCol}>
        {opts.map(([v, label]) => (
          <button
            key={v}
            type="button"
            aria-pressed={choice === v}
            onClick={() => setChoice(v)}
            style={{ ...S.wideBtn, ...(choice === v ? S.answerSel : null) }}
          >
            {label}
          </button>
        ))}
      </div>
    );
  }
  if (q.kind === 'clearAll') {
    return (
      <div style={S.answerRow}>
        {caseData.people.map((p) => (
          <button
            key={p}
            type="button"
            aria-pressed={multi.has(p)}
            onClick={() => toggleMulti(p)}
            style={{ ...S.pickBtn, ...(multi.has(p) ? S.answerSel : null) }}
          >
            <img src={cast2dUrl(p)} alt="" aria-hidden="true" draggable="false" style={S.pickArt} />
            <span style={S.pickName}>{nameOf(p)}</span>
          </button>
        ))}
      </div>
    );
  }
  if (q.kind === 'key') return <div style={S.hint}>{t.q.key}</div>;
  // who · liar · honest
  return (
    <div style={S.answerRow}>
      {caseData.people.map((p) => (
        <button
          key={p}
          type="button"
          aria-pressed={choice === p}
          onClick={() => setChoice(p)}
          style={{ ...S.pickBtn, ...(choice === p ? S.answerSel : null) }}
        >
          <img src={cast2dUrl(p)} alt="" aria-hidden="true" draggable="false" style={S.pickArt} />
          <span style={S.pickName}>{nameOf(p)}</span>
        </button>
      ))}
    </div>
  );
}

/* ── why that was the answer ────────────────────────────────────────────── */
function Explanation({ caseData, t, nameOf }) {
  const q = caseData.question;
  const a = caseData.answer;
  let html = '';
  if (q.kind === 'who') html = t.why.who(nameOf(a));
  else if (q.kind === 'liar') html = t.why.liar(nameOf(a));
  else if (q.kind === 'honest') html = t.why.honest(nameOf(a));
  else if (q.kind === 'count') html = t.why.count(a);
  else if (q.kind === 'key') html = t.why.key;
  else if (q.kind === 'verdict') {
    html = a === 'yes' ? t.why.verdictYes(nameOf(q.about))
      : a === 'no' ? t.why.verdictNo(nameOf(q.about))
        : t.why.verdictUnknown(nameOf(q.about));
  } else if (q.kind === 'clearAll') {
    const ids = a ? a.split(',').filter(Boolean) : [];
    const list = ids.length ? ids.map(nameOf).join(t.listSep) : t.clearNobody;
    html = t.why.clearAll(list);
  }
  return (
    <div style={S.explain}>
      <p style={S.why} dangerouslySetInnerHTML={{ __html: html }} />
      {/* how many arrangements survived — the honest picture of the evidence */}
      <div style={S.worlds}>
        {caseData.tally === 1 ? t.worldsOne : t.worldsMany(caseData.tally)}
      </div>
      <div style={S.workRow}>
        {caseData.people.map((p) => {
          const possible = caseData.worlds.some((w) => w.thief === p);
          return (
            <span key={p} style={{ ...S.workChip, ...(possible ? S.workLive : S.workDead) }}>
              {possible ? '?' : '✗'} {nameOf(p)}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/*
 * The shared header, not a hand-rolled one. This used to write the
 * `ct-training-play-header` markup itself with TEXT glyphs — a literal ‹ and ⏸
 * — while every game built on TrainingChromeBtn drew IconBack/IconPause. Same
 * frame, different glyph shapes, which is half of why the back button looked
 * inconsistent across the app.
 */
function Header({ t, sub, pause, cosmos, isAr, playSfx }) {
  return (
    <TrainingPlayHeader
      isAr={isAr}
      playSfx={playSfx}
      title={t.title}
      subtitle={sub}
      onMenu={cosmos ? undefined : pause.requestQuit}
      menuAriaLabel={t.menu}
      onPause={pause.open ? undefined : pause.start}
      pauseAriaLabel={pause.labels.paused}
      style={cosmos ? { background: 'transparent', paddingTop: 52 } : undefined}
    />
  );
}

export default function DetectiveGame({ onBack, workoutMode = false }) {
  const { currentLang, playSfx, awardPoints } = useApp();
  const isAr = currentLang === 'ar';
  return (
    <ModeShell
      /* v2: the old key held progress for a completely different game. */
      storageKey="mm_reason_detective_v2"
      scienceId="detective"
      title={{ en: 'Detective', ar: 'المحقّق' }}
      hints={{
        free: { en: 'Endless cases · they grow trickier', ar: 'قضايا بلا نهاية · تزداد مكراً' },
        levels: { en: '50 levels · a new kind of clue every 10', ar: '٥٠ مستوى · دليل جديد كل ١٠' },
        pass: { en: 'Same cases for all · most solved wins', ar: 'نفس القضايا للجميع · الأكثر حلاً يفوز' },
      }}
      /* ONE LADDER — no easy/med/hard. See data.js LADDER. */
      ladder={{ levels: LADDER_LEVELS }}
      pass={{ trials: 1, scoreLabel: { en: 'solved', ar: 'محلولة' }, lowerBetter: false }}
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      workoutMode={workoutMode}
      renderEngine={(p) => (
        <DetectiveEngine
          key={`${p.mode}-${p.level}-${p.seed}`}
          {...p}
          isAr={isAr}
          playSfx={playSfx}
          awardPoints={awardPoints}
        />
      )}
    />
  );
}

const S = {
  root: {
    position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column',
    background: 'var(--play-surface)', color: 'var(--play-ink)', fontFamily: "'Outfit', system-ui, sans-serif",
  },
  cosmosRoot: { background: 'transparent', color: '#f0e2c0', zIndex: 81 },
  cosmosCard: {
    background: 'rgba(12,10,8,0.72)', border: '1px solid rgba(232,172,78,0.4)',
    boxShadow: '0 0 28px rgba(232,172,78,0.18), 0 12px 32px rgba(0,0,0,0.45)',
    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
  },
  body: {
    flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 12, padding: '10px 14px 20px', overflowY: 'auto',
  },
  card: {
    width: 'min(100%, 480px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 11,
    background: 'var(--surface-raised)', border: '2px solid var(--line)', borderRadius: 22,
    padding: '14px 12px 16px', boxShadow: '4px 4px 0 rgba(26,18,8,0.1)',
  },
  hud: {
    width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    fontSize: 12, fontWeight: 800, letterSpacing: 0.4, color: 'var(--ink-dim)', textTransform: 'uppercase',
  },
  marksRow: { display: 'flex', gap: 5, alignItems: 'center' },
  mark: { width: 9, height: 9, borderRadius: '50%', background: 'var(--line)' },
  markNow: { background: 'var(--accent)', transform: 'scale(1.3)' },
  markOk: { background: 'var(--success)' },
  markBad: { background: 'var(--danger)' },

  ruleCard: {
    width: '100%', background: 'var(--surface)', border: '2px solid var(--line)',
    borderInlineStartWidth: 4, borderInlineStartColor: 'var(--accent)',
    borderRadius: 12, padding: '9px 13px', fontSize: 15, fontWeight: 650, lineHeight: 1.45, color: 'var(--ink)',
  },
  evidenceCard: { borderInlineStartColor: 'var(--info, var(--accent))' },
  ruleLabel: {
    display: 'block', fontSize: 10.5, fontWeight: 900, letterSpacing: 1.2, textTransform: 'uppercase',
    color: 'var(--ink-dim)', marginBottom: 2,
  },

  lineUp: { display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', width: '100%' },
  sus: {
    position: 'relative', width: 84, padding: '7px 5px 8px', borderRadius: 14,
    borderWidth: 2, borderStyle: 'solid', borderColor: 'var(--line)', background: 'var(--surface)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
    color: 'var(--ink)', transition: 'border-color 0.15s, background 0.15s, transform 0.12s',
  },
  susClear: { borderColor: 'var(--success)', background: 'color-mix(in srgb, var(--success) 14%, var(--surface))', opacity: 0.72 },
  susMark: { borderColor: 'var(--accent)', background: 'color-mix(in srgb, var(--accent) 16%, var(--surface))' },
  susThief: { borderColor: 'var(--danger)', background: 'color-mix(in srgb, var(--danger) 16%, var(--surface))' },
  /* In the cell. Darker and heavier than a mere mark, because it is a decision
     rather than a note — and it must not be mistaken for the `suspect` mark it
     sits next to in the cycle. */
  susJail: {
    borderColor: 'var(--ink)', borderWidth: 3,
    background: 'color-mix(in srgb, var(--ink) 20%, var(--surface))',
  },

  /* ── the drag ──
     `touchAction: none` is what stops a touch drag scrolling the page instead
     of moving the card. It is scoped to the live notebook so a finger that
     starts on a card AFTER judging still scrolls the results normally. */
  susGrab: { touchAction: 'none' },
  susInHand: {
    zIndex: 6,
    borderColor: 'var(--accent)',
    boxShadow: '0 16px 28px var(--fx-shadow-drop)',
    /* transform is deliberately NOT transitioned while in hand — the card has
       to sit under the finger, not chase it. Dropping restores S.sus's 0.12s
       transform transition, so the card springs home on release for free. */
    transition: 'border-color 0.15s, background 0.15s, box-shadow 0.15s',
  },
  susAside: { opacity: 0.45 },

  /* ── THE JAIL ──
     A real cell at the bottom of the case, not a status strip. Empty it is a
     dashed opening; filled, it closes to solid and the occupant stands behind
     bars. On a person question this is the answer box. */
  jail: {
    width: '100%', display: 'flex', flexDirection: 'column', gap: 6,
    padding: '9px 11px 11px', borderRadius: 14, color: 'var(--ink)',
    border: '2px dashed var(--line)', background: 'var(--surface)',
    transition: 'border-color 0.16s, background 0.16s, transform 0.16s, box-shadow 0.16s',
  },
  jailFull: {
    borderStyle: 'solid', borderColor: 'var(--ink)',
    background: 'color-mix(in srgb, var(--ink) 7%, var(--surface))',
  },
  /* Armed: a card is in hand. */
  jailArmed: {
    borderColor: 'var(--accent)',
    background: 'color-mix(in srgb, var(--accent) 7%, var(--surface))',
  },
  jailOver: {
    borderStyle: 'solid', borderColor: 'var(--accent)',
    background: 'color-mix(in srgb, var(--accent) 18%, var(--surface))',
    transform: 'scale(1.02)', boxShadow: '0 6px 18px var(--fx-shadow-soft)',
  },
  jailHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  jailPick: {
    fontSize: 10, fontWeight: 900, letterSpacing: 0.8, textTransform: 'uppercase',
    color: 'var(--ink-dim)', background: 'none', border: 'none', padding: '2px 4px',
    cursor: 'pointer', textDecoration: 'underline',
  },
  /* The bay is the cell mouth. Open and pale while it waits for somebody, so
     the label inside it stays readable and it reads as a place to drop. */
  jailBay: {
    position: 'relative', minHeight: 74, borderRadius: 9,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'color-mix(in srgb, var(--ink) 4%, var(--surface))',
    transition: 'background 0.16s',
    overflow: 'hidden',
  },
  jailBayShut: { background: 'color-mix(in srgb, var(--ink) 13%, var(--surface))' },
  jailBayOpen: { overflow: 'visible' },
  /* Vertical bars, in front of whoever is inside. A repeating gradient rather
     than N elements, and pointerEvents none so a drop is never eaten.
     ⚠ Spacing is the whole illusion: 3px-on-15px looked like a barcode. Real
     bars are thin and far apart, and you must be able to see the face between
     them — that is what makes it a cell instead of a hatched box. */
  jailBars: {
    position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2,
    backgroundImage: 'repeating-linear-gradient(90deg,'
      + ' var(--ink) 0 2px, transparent 2px 27px)',
    opacity: 0.42,
  },
  jailWho: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, zIndex: 1,
    background: 'none', border: 'none', padding: 0, color: 'var(--ink)',
    transition: 'transform 0.12s',
  },
  /* Being carried out. Lifts above the bars so they read as coming through the
     open door rather than sliding behind it. */
  jailWhoOut: {
    zIndex: 6,
    filter: 'drop-shadow(0 12px 18px var(--fx-shadow-drop))',
    transition: 'none',
  },
  jailArt: { width: 44, height: 44, objectFit: 'contain', objectPosition: 'center bottom' },
  jailName: { fontSize: 12.5, fontWeight: 900, color: 'var(--ink)' },
  cellDropNow: { color: 'var(--accent)', fontWeight: 900, opacity: 1 },
  cellLabel: {
    fontSize: 10.5, fontWeight: 900, letterSpacing: 1.1, textTransform: 'uppercase', color: 'var(--ink-dim)',
  },
  cellWho: { display: 'flex', alignItems: 'center', gap: 7, fontSize: 13.5, fontWeight: 900, color: 'var(--ink)' },
  cellArt: { width: 28, height: 28, objectFit: 'contain', objectPosition: 'center bottom' },
  cellEmpty: { fontSize: 12.5, fontWeight: 650, color: 'var(--ink-dim)', opacity: 0.8 },

  jailVerdict: {
    width: '100%', borderRadius: 11, padding: '9px 13px',
    fontSize: 13.5, fontWeight: 700, lineHeight: 1.45, textAlign: 'center',
    borderWidth: 2, borderStyle: 'solid',
  },
  jailSound: {
    color: 'var(--success)', borderColor: 'var(--success)',
    background: 'color-mix(in srgb, var(--success) 12%, var(--surface))',
  },
  jailWrong: {
    color: 'var(--danger)', borderColor: 'var(--danger)',
    background: 'color-mix(in srgb, var(--danger) 12%, var(--surface))',
  },
  jailOpen: {
    color: 'var(--ink-dim)', borderColor: 'var(--line)', background: 'var(--surface)',
  },
  susArt: { width: 46, height: 46, objectFit: 'contain', objectPosition: 'center bottom', display: 'block' },
  susName: { fontSize: 12.5, fontWeight: 800 },
  traitRow: { display: 'flex', gap: 2, fontSize: 13, lineHeight: 1 },
  trait: { lineHeight: 1 },
  markBadge: {
    position: 'absolute', top: -7, insetInlineEnd: -6, width: 20, height: 20, borderRadius: '50%',
    background: 'var(--accent)', color: '#fff', fontWeight: 900, fontSize: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--surface-raised)',
  },

  says: { display: 'flex', flexDirection: 'column', gap: 7, width: '100%' },
  say: {
    display: 'flex', gap: 9, alignItems: 'center', textAlign: 'start', width: '100%',
    background: 'var(--surface)', borderWidth: 2, borderStyle: 'solid', borderColor: 'var(--line)',
    borderRadius: 12, padding: '7px 11px', color: 'var(--ink)', fontSize: 14.5, lineHeight: 1.35,
  },
  sayPick: { cursor: 'pointer' },
  sayPicked: { borderColor: 'var(--accent)', background: 'color-mix(in srgb, var(--accent) 16%, var(--surface))' },
  sayOk: { borderColor: 'var(--success)', background: 'color-mix(in srgb, var(--success) 16%, var(--surface))' },
  sayTrue: { borderColor: 'var(--success)' },
  sayFalse: { borderColor: 'var(--danger)' },
  sayArt: { width: 34, height: 34, flex: '0 0 auto', objectFit: 'contain', objectPosition: 'center bottom' },
  sayBody: { flex: 1, minWidth: 0 },
  sayName: {
    display: 'block', fontSize: 10, fontWeight: 900, letterSpacing: 0.8, textTransform: 'uppercase',
    color: 'var(--ink-dim)',
  },
  sayVerdict: {
    flex: '0 0 auto', fontSize: 10, fontWeight: 900, letterSpacing: 0.6, textTransform: 'uppercase',
    padding: '2px 6px', borderRadius: 6, borderWidth: 1, borderStyle: 'solid',
  },
  sayVerdictTrue: { color: 'var(--success)', borderColor: 'var(--success)' },
  sayVerdictFalse: { color: 'var(--danger)', borderColor: 'var(--danger)' },

  askRow: { display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '2px 4px' },
  detective: {
    width: 56, flex: '0 0 auto', objectFit: 'contain', objectPosition: 'center bottom',
    filter: 'drop-shadow(0 5px 4px rgba(38,25,10,0.22))',
  },
  question: { flex: 1, fontSize: 17, fontWeight: 900, textAlign: 'start', color: 'var(--ink)', lineHeight: 1.35 },
  hint: { fontSize: 12, fontWeight: 650, color: 'var(--ink-dim)', textAlign: 'center', opacity: 0.85 },

  answerRow: { display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', width: '100%' },
  answerCol: { display: 'flex', flexDirection: 'column', gap: 7, width: '100%' },
  pickBtn: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '6px 8px 7px',
    minWidth: 76, borderRadius: 13, borderWidth: 2, borderStyle: 'solid', borderColor: 'var(--line)',
    background: 'var(--surface)', color: 'var(--ink)', cursor: 'pointer',
    transition: 'border-color 0.15s, background 0.15s, transform 0.12s',
  },
  pickArt: { width: 40, height: 40, objectFit: 'contain', objectPosition: 'center bottom', display: 'block' },
  pickName: { fontSize: 12.5, fontWeight: 800 },
  numBtn: {
    width: 54, height: 54, borderRadius: 13, borderWidth: 2, borderStyle: 'solid', borderColor: 'var(--line)',
    background: 'var(--surface)', color: 'var(--ink)', fontSize: 20, fontWeight: 900, cursor: 'pointer',
  },
  wideBtn: {
    width: '100%', padding: '11px 14px', borderRadius: 13, borderWidth: 2, borderStyle: 'solid',
    borderColor: 'var(--line)', background: 'var(--surface)', color: 'var(--ink)',
    fontSize: 15, fontWeight: 800, cursor: 'pointer', textAlign: 'center',
  },
  answerSel: {
    borderColor: 'var(--accent)', background: 'color-mix(in srgb, var(--accent) 18%, var(--surface))',
    boxShadow: '0 0 0 3px color-mix(in srgb, var(--accent) 32%, transparent)', transform: 'translateY(-2px)',
  },

  stampWrap: { display: 'grid', placeItems: 'center', minHeight: 44, width: '100%' },
  stamp: {
    fontSize: 22, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase',
    padding: '4px 14px', borderWidth: 3, borderStyle: 'solid', borderRadius: 8, transform: 'rotate(-5deg)',
  },
  stampOk: { color: 'var(--success)', borderColor: 'var(--success)' },
  stampNo: { color: 'var(--danger)', borderColor: 'var(--danger)' },

  explain: { width: '100%', display: 'flex', flexDirection: 'column', gap: 7, alignItems: 'center' },
  why: { fontSize: 14.5, fontWeight: 650, lineHeight: 1.5, color: 'var(--ink)', textAlign: 'center', margin: 0, maxWidth: 400 },
  worlds: { fontSize: 12, fontWeight: 800, color: 'var(--ink-dim)', textTransform: 'uppercase', letterSpacing: 0.5 },
  workRow: { display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  workChip: {
    fontSize: 11.5, fontWeight: 800, padding: '3px 9px', borderRadius: 999,
    borderWidth: 1, borderStyle: 'solid',
  },
  workLive: { color: 'var(--ink)', borderColor: 'var(--line)', background: 'var(--surface)' },
  workDead: { color: 'var(--ink-dim)', borderColor: 'var(--line)', background: 'transparent', opacity: 0.6, textDecoration: 'line-through' },

  verdictBig: { fontSize: 20, fontWeight: 900, color: 'var(--ink)', textAlign: 'center', padding: '6px 4px' },

  primary: {
    padding: '12px 24px', borderRadius: 14, borderWidth: 2, borderStyle: 'solid', borderColor: 'var(--ink-outline)',
    background: 'var(--success)', color: '#fff', fontWeight: 900, fontSize: 15, cursor: 'pointer',
    boxShadow: '3px 3px 0 var(--ink-outline)',
  },
  primaryOff: { background: '#c9bfae', borderColor: '#a89a82', boxShadow: 'none', cursor: 'default' },
};
