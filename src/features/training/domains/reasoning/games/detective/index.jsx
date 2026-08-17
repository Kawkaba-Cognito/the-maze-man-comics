import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';
import { makeRng } from '../../../../shared/rng';
import { cast2dUrl } from '../../../../shared/cast2d';
import Emoji from '../../../../../../components/shared/Emoji';
import { useGamePause } from '../../../../shared/useGamePause';
import { createTrialLog } from '../../../../shared/trialLog';
import { assetUrl } from '../../../../../../lib/assetUrl';
import {
  TRAITS, buildCase, evalStatement, levelCfg, levelPassed, nameOf as nameOfId,
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

const MARKS = ['none', 'clear', 'suspect'];
const MARK_ICON = { none: '', clear: '✓', suspect: '?' };

export function DetectiveEngine({
  mode, diff, level, seed, attempt, onResult, onExit, isAr, playSfx, awardPoints, cosmos = false,
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
    if (mode === 'levels') return levelCfg(diff, level);
    if (mode === 'passplay') return passCfg();
    return survivalCfg(stageRef.current);
  }, [mode, diff, level]);

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
    trialLogRef.current = createTrialLog({ game: 'detective', mode, meta: { diff, level } });
    return () => { trialLogRef.current?.discard(); trialLogRef.current = null; };
  }, [mode, diff, level]);

  const q = caseData ? caseData.question : null;
  const isMulti = q && q.kind === 'clearAll';
  const canConfirm = isMulti ? true : choice != null;

  const cycleMark = (id) => {
    if (judged) return;
    playSfx?.('click');
    setMarks((m) => {
      const cur = m[id] || 'none';
      return { ...m, [id]: MARKS[(MARKS.indexOf(cur) + 1) % MARKS.length] };
    });
  };

  const confirm = () => {
    if (!caseData || judged || !canConfirm) return;
    let ok;
    let given;
    if (isMulti) {
      const s = scoreClearAll(multi, caseData.answer);
      ok = s.ok;
      given = [...multi].sort().join(',');
    } else {
      given = String(choice);
      ok = given === String(caseData.answer);
    }
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    trialLogRef.current?.trial({
      ok,
      kind: q.kind,
      rule: caseData.rule.kind,
      suspects: caseData.people.length,
      // how many arrangements survived: 1 = fully determined, >1 = the player
      // had to answer under genuine uncertainty. Worth separating in analysis.
      worlds: caseData.tally,
      given,
      rt: Math.max(0, Math.round(now - askedAtRef.current)),
    });
    setJudged({ ok });
    setResults((r) => [...r, ok]);
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
      trialLogRef.current?.finish({ won, score: n, level, diff });
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
  }, [mode, results, onResult, t, playSfx, awardPoints, level, diff, dealCase]);

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
  const showNotebook = caseData.people.length >= 4 && !judged;
  const solvedCount = results.filter(Boolean).length;

  /* ── the run is over ── */
  if (done) {
    const n = solvedCount;
    const m = results.length;
    return (
      <div style={rootStyle} className={cosmos ? 'c3d-embed-root' : undefined} dir={isAr ? 'rtl' : 'ltr'}>
        <Header t={t} sub={hudSub} pause={pause} cosmos={cosmos} />
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
      <Header t={t} sub={hudSub} pause={pause} cosmos={cosmos} />
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
            {caseData.people.map((p) => {
              const mk = marks[p] || 'none';
              const revealed = judged && caseData.tally === 1;
              const isThief = revealed && caseData.worlds[0].thief === p;
              return (
                <button
                  key={p}
                  type="button"
                  disabled={!showNotebook}
                  onClick={() => cycleMark(p)}
                  aria-label={nameOf(p)}
                  style={{
                    ...S.sus,
                    ...(mk === 'clear' ? S.susClear : null),
                    ...(mk === 'suspect' ? S.susMark : null),
                    ...(isThief ? S.susThief : null),
                    cursor: showNotebook ? 'pointer' : 'default',
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

          {/* the answer controls */}
          {!judged && (
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

          {/* the verdict */}
          {judged && (
            <>
              <div style={S.stampWrap}>
                <div style={{ ...S.stamp, ...(judged.ok ? S.stampOk : S.stampNo) }}>
                  {judged.ok ? t.solved : t.missed}
                </div>
              </div>
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

function Header({ t, sub, pause, cosmos }) {
  return (
    <header className="ct-training-play-header" style={cosmos ? { background: 'transparent', paddingTop: 52 } : undefined}>
      {!cosmos && (
        <button className="ct-training-chrome-btn" aria-label={t.menu} onClick={pause.requestQuit}>‹</button>
      )}
      {cosmos && <div className="ct-training-chrome-spacer" aria-hidden="true" />}
      <div className="ct-training-play-header-body">
        <div className="ct-training-play-title" style={cosmos ? { color: '#f0e2c0' } : undefined}>{t.title}</div>
        <div className="ct-training-play-sub" style={cosmos ? { color: 'rgba(240,226,192,0.75)' } : undefined}>{sub}</div>
      </div>
      <button
        type="button"
        className="ct-training-chrome-btn"
        aria-label={pause.labels.paused}
        onClick={pause.start}
        disabled={pause.open}
      >
        ⏸
      </button>
    </header>
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
        levels: { en: '3 difficulties · 100 levels each', ar: '٣ صعوبات · ١٠٠ مستوى لكل' },
        pass: { en: 'Same cases for all · most solved wins', ar: 'نفس القضايا للجميع · الأكثر حلاً يفوز' },
      }}
      diffLabels={{ easy: { en: 'Easy', ar: 'سهل' }, med: { en: 'Medium', ar: 'متوسط' }, hard: { en: 'Hard', ar: 'صعب' } }}
      pass={{ trials: 1, scoreLabel: { en: 'solved', ar: 'محلولة' }, lowerBetter: false, diff: 'med' }}
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      workoutMode={workoutMode}
      renderEngine={(p) => (
        <DetectiveEngine
          key={`${p.mode}-${p.diff}-${p.level}-${p.seed}`}
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
