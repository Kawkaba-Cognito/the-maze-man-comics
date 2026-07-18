import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { makeRng } from '../../../../shared/rng';
import { tierLabel } from './caseUtils';
import {
  createCaseSession, pickCase, resetSession, LIVES,
} from './caseSelection';
import ProtoEngine from './prototypes/ProtoEngine';
import { PT, PROTO_CSS } from './prototypes/protoUtils';

/**
 * Production Detective Kawkab — Investigator File (B3) with ModeShell integration.
 */
export default function CaseFileEngine({
  mode, diff, level, seed, attempt, onResult, onExit, isAr, playSfx, awardPoints, awardFreeRun,
  cosmos = false,
}) {
  const t = isAr ? PT.ar : PT.en;
  const rng = useMemo(() => (seed != null ? makeRng(seed) : Math.random), [seed]);
  const ppTrials = mode === 'passplay' ? (attempt?.trials ?? 2) : 0;

  const sessionRef = useRef(createCaseSession(rng));
  const [caseData, setCaseData] = useState(null);
  const [engineKey, setEngineKey] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [phase, setPhase] = useState('play');

  const loadCase = useCallback(() => {
    const session = sessionRef.current;
    session.caseNo += 1;
    const c = pickCase(mode, {
      diff, level, session, rng, ppDone: session.ppDone,
    });
    setCaseData(c);
    setEngineKey((k) => k + 1);
  }, [mode, diff, level, rng]);

  useEffect(() => {
    resetSession(sessionRef.current);
    setLives(LIVES);
    setPhase('play');
    loadCase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, level, diff]);

  const session = sessionRef.current;
  const tier = caseData?.tier || 1;

  const hudSub = mode === 'passplay'
    ? (isAr ? `قضية ${Math.min(session.ppDone + 1, ppTrials)}/${ppTrials}` : `Case ${Math.min(session.ppDone + 1, ppTrials)}/${ppTrials}`)
    : mode === 'free'
      ? `${t.cracked(session.solved)} · ${tierLabel(tier, isAr)} · ${'♥'.repeat(Math.max(0, lives))}`
      : `${isAr ? `مستوى ${level}` : `Level ${level}`} · ${tierLabel(tier, isAr)}`;

  const handleCaseDone = (verdict) => {
    const win = verdict.win;
    const pts = win ? (mode === 'levels' ? 8 : 5) : 0;
    if (pts > 0 && mode !== 'passplay') awardPoints?.(pts);

    if (mode === 'levels') {
      onResult?.({
        won: win,
        score: win ? 1 : 0,
        summary: win ? t.caughtSummary : t.missedSummary,
      });
      return;
    }

    if (mode === 'passplay') {
      if (win) session.ppSolved += 1;
      session.ppDone += 1;
      if (session.ppDone >= ppTrials) {
        onResult?.({ score: session.ppSolved });
        return;
      }
      loadCase();
      return;
    }

    if (win) {
      session.solved += 1;
      loadCase();
      return;
    }

    session.lives -= 1;
    setLives(session.lives);
    if (session.lives <= 0) {
      playSfx?.('lose');
      if (mode === 'free') awardFreeRun?.('detective', session.solved);
      setPhase('over');
      return;
    }
    loadCase();
  };

  const boot = () => {
    resetSession(sessionRef.current);
    setLives(LIVES);
    setPhase('play');
    loadCase();
  };

  const rootStyle = cosmos ? { ...S.root, ...S.cosmosRoot } : S.root;
  const embedCls = cosmos ? 'c3d-embed-root' : undefined;

  if (phase === 'over') {
    return (
      <div style={rootStyle} className={embedCls} data-c3d-embed={cosmos || undefined} dir={isAr ? 'rtl' : 'ltr'}>
        <style>{PROTO_CSS}</style>
        <div style={S.overWrap}>
          <div style={S.detectiveIcon}>🕵️</div>
          <h2 style={S.overTitle}>{t.overTitle}</h2>
          <p style={S.overSub}>{t.overSub(session.solved)}</p>
          <div style={S.btnRow}>
            <button type="button" style={S.primary} onClick={() => { playSfx?.('click'); boot(); }}>{t.again}</button>
            <button type="button" style={S.ghost} onClick={() => { playSfx?.('click'); onExit?.(); }}>{t.menu}</button>
          </div>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return <div style={rootStyle} className={embedCls} data-c3d-embed={cosmos || undefined} dir={isAr ? 'rtl' : 'ltr'} />;
  }

  const verdictLabels = {
    ...t,
    nextCase: mode === 'levels' ? t.finish : t.nextCase,
  };

  return (
    <ProtoEngine
      key={`${caseData.id}-${engineKey}`}
      variant="b3"
      caseData={caseData}
      caseIndex={session.caseNo - 1}
      caseTotal={session.caseNo}
      hudSub={hudSub}
      caseStamp={mode !== 'levels' ? session.caseNo : null}
      verdictLabels={verdictLabels}
      isAr={isAr}
      playSfx={playSfx}
      onCaseDone={handleCaseDone}
      onExit={onExit}
      cosmos={cosmos}
    />
  );
}

const S = {
  root: {
    position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column',
    background: '#e8dcc8', color: '#2d2d2d', fontFamily: "'Outfit', system-ui, sans-serif",
  },
  cosmosRoot: { background: 'transparent', color: '#f0e2c0', zIndex: 81 },
  overWrap: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: 24, gap: 8, textAlign: 'center',
  },
  detectiveIcon: { fontSize: 48 },
  overTitle: { margin: '8px 0', fontWeight: 900, fontSize: 22, color: '#2d2210' },
  overSub: { margin: 0, fontWeight: 700, color: '#5a4a32', lineHeight: 1.5 },
  btnRow: { display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' },
  primary: {
    padding: '12px 24px', borderRadius: 14, border: '2px solid #1a1208',
    background: '#2e8b57', color: '#fff', fontWeight: 900, fontSize: 15, cursor: 'pointer',
  },
  ghost: {
    padding: '10px 18px', borderRadius: 12, border: '2px solid #cdbfa6', background: '#fff',
    fontWeight: 800, fontSize: 14, cursor: 'pointer', color: '#4a3c28',
  },
};
