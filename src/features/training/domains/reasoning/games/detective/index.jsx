import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';
import { makeRng } from '../../../../shared/rng';
import { FULL_BY_TIER, QUICK_BY_TIER } from './investigations';
import {
  L, buildReport, sceneLocations, locationResult, tierLabel, survivalTier,
} from './caseUtils';

/*
 * Detective Kawkab — story-first deduction.
 *
 *   1. Read the case briefing
 *   2. Examine scene locations (logical checklist — not random hotspot tapping)
 *   3. Read each suspect's written report
 *   4. Accuse ONE person — no picking proof clues
 *   5. Verdict shows who did it and why
 */

const DET_CSS = `
@keyframes dt-slide {0%{transform:translateY(12px);opacity:0}100%{transform:translateY(0);opacity:1}}
@keyframes dt-stamp {0%{transform:rotate(-8deg) scale(1.8);opacity:0}70%{transform:rotate(-8deg) scale(0.96);opacity:1}100%{transform:rotate(-8deg) scale(1);opacity:1}}
@keyframes dt-shake {0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-5px)}40%,80%{transform:translateX(5px)}}
@keyframes dt-fade {0%{opacity:0}100%{opacity:1}}
`;

const LIVES = 3;

const T = {
  en: {
    title: 'Detective Kawkab', caseNo: (n) => `Case #${n}`,
    introStamp: 'CASE FILE', start: 'Begin investigation',
    withAssistant: (n) => `with ${n}`, theSuspects: 'Persons of interest',
    tabScene: 'Scene', tabReports: 'Reports', tabNotes: 'Notes',
    sceneIntro: 'Examine each location in order. Take notes — the story is in the details.',
    reportsIntro: 'Each person gave a written statement. Read them all and look for what does not fit.',
    examine: 'Examine', examined: 'Examined', readReport: 'Read statement', read: 'Read',
    witnessTag: 'witness', suspectTag: 'suspect',
    notebook: 'Case notes', evidence: 'Evidence found', emptyNote: 'Examine the scene to collect evidence.',
    accuse: 'Make accusation', accuseTitle: 'Who did it?',
    accuseSub: 'Trust your reading of the story — pick the one person it must be.',
    confirmAccuse: 'Accuse this person', notYet: 'Keep investigating',
    fullWin: 'Correct!', lost: 'Wrong suspect',
    culpritWas: (n) => `The culprit: ${n}`, itWas: (n) => `It was ${n}`,
    chain: 'Why this person', epilogueHead: 'What happened next', caseClosed: 'CASE CLOSED',
    pts: (p) => `+${p} 🪙`, finish: 'Finish ›', next: 'Next case ›',
    cracked: (n) => `Solved ${n}`,
    overTitle: 'Out of chances!', overSub: (n) => `${n} cases solved`, again: 'Play again', menu: 'Menu',
    caughtSummary: 'Correct suspect',
    missedSummary: 'Wrong suspect',
    close: 'Close',
    locationOf: (n, t) => `${n} of ${t} locations checked`,
    reportsOf: (n, t) => `${n} of ${t} statements read`,
  },
  ar: {
    title: 'المحقّق كوكب', caseNo: (n) => `القضية رقم ${n}`,
    introStamp: 'ملف القضية', start: 'ابدأ التحقيق',
    withAssistant: (n) => `مع ${n}`, theSuspects: 'أشخاص محلّ الاهتمام',
    tabScene: 'المسرح', tabReports: 'الأقوال', tabNotes: 'الملاحظات',
    sceneIntro: 'افحص كل موقع بالترتيب. دوّن الملاحظات — القصة في التفاصيل.',
    reportsIntro: 'كل شخص قدّم إفادةً مكتوبة. اقرأها كلها وابحث عما لا ينسجم.',
    examine: 'افحص', examined: 'تم الفحص', readReport: 'اقرأ الإفادة', read: 'مقروء',
    witnessTag: 'شاهد', suspectTag: 'مشتبه',
    notebook: 'ملاحظات القضية', evidence: 'الأدلة المكتشفة', emptyNote: 'افحص مسرح الجريمة لجمع الأدلة.',
    accuse: 'وجّه الاتهام', accuseTitle: 'من الفاعل؟',
    accuseSub: 'ثق بقراءتك للقصة — اختر الشخص الوحيد الممكن.',
    confirmAccuse: 'اتّهم هذا الشخص', notYet: 'تابع التحقيق',
    fullWin: 'صحيح!', lost: 'مشتبه خاطئ',
    culpritWas: (n) => `الفاعل: ${n}`, itWas: (n) => `كان الفاعل ${n}`,
    chain: 'لماذا هذا الشخص', epilogueHead: 'ماذا حدث بعد', caseClosed: 'القضية مُغلقة',
    pts: (p) => `+${p} 🪙`, finish: 'إنهاء ›', next: 'قضية تالية ›',
    cracked: (n) => `محلولة ${n}`,
    overTitle: 'انتهت الفرص!', overSub: (n) => `حُلّت ${n} قضايا`, again: 'العب مجدداً', menu: 'القائمة',
    caughtSummary: 'المشتبه الصحيح',
    missedSummary: 'مشتبه خاطئ',
    close: 'إغلاق',
    locationOf: (n, t) => `${n} من ${t} مواقع فُحصت`,
    reportsOf: (n, t) => `${n} من ${t} إفادات قُرئت`,
  },
};

const shuffleR = (arr, rng) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const tierForDiff = { easy: 0, med: 1, hard: 2 };
const FULL_POOLS = FULL_BY_TIER.map((l) => (l.length ? l : FULL_BY_TIER[0]));
const QUICK_POOLS = QUICK_BY_TIER.map((l, i) => (l.length ? l : FULL_POOLS[i]));

function makePools(rng) {
  return [0, 1, 2].map((tierI) => ({ list: shuffleR(QUICK_POOLS[tierI], rng), idx: 0, lastId: null }));
}

function pickFromPool(tierI, pools, rng) {
  const pool = pools[tierI];
  if (pool.idx >= pool.list.length) {
    pool.list = shuffleR(QUICK_POOLS[tierI], rng);
    if (pool.list.length > 1 && pool.list[0].id === pool.lastId) {
      const last = pool.list.length - 1;
      [pool.list[0], pool.list[last]] = [pool.list[last], pool.list[0]];
    }
    pool.idx = 0;
  }
  const c = pool.list[pool.idx++];
  pool.lastId = c.id;
  return c;
}

function pickAdaptive(solved, pools, rng) {
  const tierI = survivalTier(solved);
  return pickFromPool(tierI, pools, rng);
}

function InvestigationEngine({ mode, diff, level, seed, attempt, onResult, onExit, isAr, playSfx, awardPoints }) {
  const t = isAr ? T.ar : T.en;
  const rng = useMemo(() => (seed != null ? makeRng(seed) : Math.random), [seed]);
  const ppTrials = mode === 'passplay' ? (attempt?.trials ?? 2) : 0;

  const livesRef = useRef(LIVES);
  const solvedRef = useRef(0);
  const caseNoRef = useRef(0);
  const ppDoneRef = useRef(0);
  const ppSolvedRef = useRef(0);
  const seqRef = useRef(null);
  const poolsRef = useRef(null);
  const foundRef = useRef(new Set());

  const [c, setC] = useState(null);
  const [phase, setPhase] = useState('briefing');
  const [tab, setTab] = useState('scene');
  const [overlay, setOverlay] = useState(null);
  const [found, setFound] = useState([]);
  const [examined, setExamined] = useState(() => new Set());
  const [readReports, setReadReports] = useState(() => new Set());
  const [accuseSid, setAccuseSid] = useState(null);
  const [verdict, setVerdict] = useState(null);
  const [lives, setLives] = useState(LIVES);

  const caseFor = useCallback(() => {
    if (mode === 'levels') {
      const list = FULL_POOLS[tierForDiff[diff] ?? 1];
      return list[((level || 1) - 1) % list.length];
    }
    if (mode === 'passplay') {
      const tierI = Math.min(2, Math.floor(ppDoneRef.current / 2));
      if (!seqRef.current?.[tierI]) {
        if (!seqRef.current) seqRef.current = {};
        seqRef.current[tierI] = shuffleR(QUICK_POOLS[tierI], rng);
      }
      const list = seqRef.current[tierI];
      return list[ppDoneRef.current % list.length];
    }
    if (!poolsRef.current) poolsRef.current = makePools(rng);
    return pickAdaptive(solvedRef.current, poolsRef.current, rng);
  }, [mode, diff, level, rng]);

  const newCase = useCallback(() => {
    setC(caseFor());
    caseNoRef.current += 1;
    foundRef.current = new Set();
    setPhase('briefing');
    setTab('scene');
    setOverlay(null);
    setFound([]);
    setExamined(new Set());
    setReadReports(new Set());
    setAccuseSid(null);
    setVerdict(null);
  }, [caseFor]);

  useEffect(() => {
    livesRef.current = LIVES;
    setLives(LIVES);
    solvedRef.current = 0;
    caseNoRef.current = 0;
    ppDoneRef.current = 0;
    ppSolvedRef.current = 0;
    seqRef.current = null;
    poolsRef.current = null;
    newCase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, level, diff]);

  const people = useMemo(() => (c ? [...c.suspects, ...(c.witnesses || [])] : []), [c]);
  const clueById = useMemo(() => {
    const m = {};
    (c?.clues || []).forEach((cl) => { m[cl.id] = cl; });
    return m;
  }, [c]);
  const locations = useMemo(() => (c ? sceneLocations(c) : []), [c]);
  const suspectIds = useMemo(() => new Set((c?.suspects || []).map((s) => s.id)), [c]);

  const addClue = useCallback((id) => {
    if (foundRef.current.has(id)) return;
    foundRef.current.add(id);
    setFound((prev) => [...prev, id]);
  }, []);

  const examineLocation = (loc) => {
    if (examined.has(loc.id)) return;
    playSfx?.('click');
    const result = locationResult(loc, clueById, isAr);
    setExamined((p) => new Set(p).add(loc.id));
    if (result.clueId) {
      addClue(result.clueId);
      playSfx?.('win');
    }
    setOverlay({ t: 'location', loc, result });
  };

  const openReport = (person) => {
    playSfx?.('click');
    setReadReports((p) => new Set(p).add(person.id));
    setOverlay({ t: 'report', person });
  };

  const confirmAccuse = () => {
    const culpritOk = accuseSid === c.solution.culprit;
    const pts = culpritOk ? (mode === 'levels' ? 8 : 5) : 0;
    if (pts > 0 && mode !== 'passplay') awardPoints?.(pts);
    setVerdict({ culpritOk, pts });
    setOverlay(null);
    setPhase('verdict');
    playSfx?.(culpritOk ? 'win' : 'error');
  };

  const afterVerdict = () => {
    playSfx?.('click');
    const { culpritOk } = verdict;
    if (mode === 'levels') {
      onResult({ won: culpritOk, score: culpritOk ? 1 : 0, summary: culpritOk ? t.caughtSummary : t.missedSummary });
      return;
    }
    if (mode === 'passplay') {
      if (culpritOk) ppSolvedRef.current += 1;
      ppDoneRef.current += 1;
      if (ppDoneRef.current >= ppTrials) { onResult({ score: ppSolvedRef.current }); return; }
      newCase();
      return;
    }
    if (culpritOk) { solvedRef.current += 1; newCase(); return; }
    livesRef.current -= 1;
    setLives(livesRef.current);
    if (livesRef.current <= 0) { playSfx?.('lose'); setPhase('over'); return; }
    newCase();
  };

  const boot = () => {
    livesRef.current = LIVES;
    setLives(LIVES);
    solvedRef.current = 0;
    caseNoRef.current = 0;
    ppDoneRef.current = 0;
    ppSolvedRef.current = 0;
    seqRef.current = null;
    poolsRef.current = null;
    newCase();
  };

  if (!c) return <div style={S.root} dir={isAr ? 'rtl' : 'ltr'} />;

  const tier = c.tier || 1;
  const hud = mode === 'passplay'
    ? (isAr ? `قضية ${Math.min(ppDoneRef.current + 1, ppTrials)}/${ppTrials}` : `Case ${Math.min(ppDoneRef.current + 1, ppTrials)}/${ppTrials}`)
    : mode === 'free'
      ? `${t.cracked(solvedRef.current)} · ${tierLabel(tier, isAr)} · ${'♥'.repeat(Math.max(0, lives))}`
      : `${isAr ? `مستوى ${level}` : `Level ${level}`} · ${tierLabel(tier, isAr)}`;

  const culpritOpt = c.suspects.find((s) => s.id === c.solution.culprit);
  const examinedCount = examined.size;
  const reportsCount = readReports.size;

  if (phase === 'over') {
    return (
      <div style={S.root} dir={isAr ? 'rtl' : 'ltr'}>
        <style>{DET_CSS}</style>
        <div style={S.overWrap}>
          <div style={S.detectiveIcon}>🕵️</div>
          <h2 style={S.overTitle}>{t.overTitle}</h2>
          <p style={S.overSub}>{t.overSub(solvedRef.current)}</p>
          <div style={S.btnRow}>
            <button type="button" style={S.primary} onClick={() => { playSfx?.('click'); boot(); }}>{t.again}</button>
            <button type="button" style={S.ghost} onClick={() => { playSfx?.('click'); onExit?.(); }}>{t.menu}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={S.root} dir={isAr ? 'rtl' : 'ltr'}>
      <style>{DET_CSS}</style>
      <header className="ct-training-play-header">
        <button className="ct-training-chrome-btn" aria-label={t.menu} onClick={() => { playSfx?.('click'); onExit?.(); }}>‹</button>
        <div className="ct-training-play-header-body">
          <div className="ct-training-play-title">{`🕵️ ${t.title}`}</div>
          <div className="ct-training-play-sub">{hud}</div>
        </div>
        <div className="ct-training-chrome-spacer" aria-hidden="true" />
      </header>

      {phase === 'briefing' && (
        <div style={S.body}>
          <div style={S.fileCard}>
            <div style={S.stampRow}>
              <span style={S.stamp}>{t.introStamp}{mode !== 'levels' ? ` #${caseNoRef.current}` : ''}</span>
              <span style={S.tierBadge}>{tierLabel(tier, isAr)}</span>
            </div>
            <h2 style={S.caseTitle}>{L(c.title, isAr)}</h2>
            <div style={S.chipRow}>
              <span style={S.metaChip}>📍 {L(c.setting, isAr)}</span>
              {c.assistant && <span style={S.metaChip}>{c.assistant.e} {t.withAssistant(L(c.assistant.name, isAr))}</span>}
            </div>
            <p style={S.setup}>{L(c.briefing, isAr)}</p>
            <div style={S.sectionHead}>{t.theSuspects}</div>
            <div style={S.suspectGrid}>
              {c.suspects.map((s) => (
                <div key={s.id} style={S.suspectCard}>
                  <div style={S.portrait}>{s.e}</div>
                  <div style={S.suspectMeta}>
                    <span style={S.suspectName}>{L(s.name, isAr)}</span>
                    <span style={S.suspectDesc}>{L(s.role, isAr)}</span>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" style={{ ...S.primary, alignSelf: 'center', marginTop: 8 }} onClick={() => { playSfx?.('click'); setPhase('investigate'); }}>
              {t.start}
            </button>
          </div>
        </div>
      )}

      {phase === 'investigate' && (
        <div style={S.investWrap}>
          <div style={S.tabBar}>
            {['scene', 'reports', 'notes'].map((id) => (
              <button key={id} type="button" style={{ ...S.tab, ...(tab === id ? S.tabOn : null) }} onClick={() => { playSfx?.('click'); setTab(id); }}>
                {id === 'scene' ? t.tabScene : id === 'reports' ? t.tabReports : t.tabNotes}
                {id === 'scene' && locations.length > 0 && <span style={S.tabCount}>{examinedCount}/{locations.length}</span>}
                {id === 'reports' && people.length > 0 && <span style={S.tabCount}>{reportsCount}/{people.length}</span>}
                {id === 'notes' && found.length > 0 && <span style={S.tabCount}>{found.length}</span>}
              </button>
            ))}
          </div>

          <div style={S.tabBody}>
            {tab === 'scene' && (
              <>
                <p style={S.tabIntro}>{t.sceneIntro}</p>
                <p style={S.progressLine}>{t.locationOf(examinedCount, locations.length)}</p>
                <div style={S.cardList}>
                  {locations.map((loc, i) => {
                    const done = examined.has(loc.id);
                    return (
                      <button key={loc.id} type="button" style={{ ...S.locCard, ...(done ? S.locCardDone : null) }} onClick={() => examineLocation(loc)}>
                        <span style={S.locNum}>{i + 1}</span>
                        <span style={S.locIcon}>{loc.icon}</span>
                        <span style={S.locText}>
                          <span style={S.locName}>{L(loc.name, isAr)}</span>
                          <span style={S.locAction}>{done ? t.examined : t.examine}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {tab === 'reports' && (
              <>
                <p style={S.tabIntro}>{t.reportsIntro}</p>
                <p style={S.progressLine}>{t.reportsOf(reportsCount, people.length)}</p>
                <div style={S.cardList}>
                  {people.map((p) => {
                    const done = readReports.has(p.id);
                    const isSuspect = suspectIds.has(p.id);
                    return (
                      <button key={p.id} type="button" style={{ ...S.reportCard, ...(done ? S.reportCardDone : null) }} onClick={() => openReport(p)}>
                        <span style={S.portraitSm}>{p.e}</span>
                        <span style={S.locText}>
                          <span style={S.locName}>{L(p.name, isAr)}</span>
                          <span style={S.suspectDesc}>{L(p.role, isAr)}</span>
                          <span style={S.tagChip}>{isSuspect ? t.suspectTag : t.witnessTag}</span>
                        </span>
                        <span style={S.readMark}>{done ? t.read : t.readReport}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {tab === 'notes' && (
              <>
                {found.length === 0 && <div style={S.emptyNote}>{t.emptyNote}</div>}
                {found.length > 0 && (
                  <>
                    <div style={S.sectionHead}>{t.evidence}</div>
                    {found.map((id) => {
                      const cl = clueById[id];
                      if (!cl) return null;
                      return (
                        <div key={id} style={S.noteCard}>
                          <span style={S.noteIcon}>{cl.e}</span>
                          <div style={S.noteBody}>
                            <span style={S.clueName}>{L(cl.name, isAr)}</span>
                            <span style={S.clueTxt}>{L(cl.text, isAr)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </>
            )}
          </div>

          <div style={S.bottomBar}>
            <button type="button" style={S.accuseBtn} onClick={() => { playSfx?.('click'); setAccuseSid(null); setOverlay({ t: 'accuse' }); }}>
              {t.accuse}
            </button>
          </div>
        </div>
      )}

      {phase === 'verdict' && verdict && (
        <div style={S.body}>
          <div style={{ ...S.verdictCard, animation: verdict.culpritOk ? 'dt-slide 0.3s ease-out' : 'dt-shake 0.4s ease-out' }}>
            {verdict.culpritOk && <div style={S.closedStamp}>{t.caseClosed}</div>}
            <div style={{ ...S.verdictTitle, color: verdict.culpritOk ? '#2e8b57' : '#d23b3b' }}>
              {verdict.culpritOk ? t.fullWin : t.lost}
            </div>
            <div style={S.truth}>
              <span style={S.portraitSm}>{culpritOpt.e}</span>
              <span>{verdict.culpritOk ? t.culpritWas(L(culpritOpt.name, isAr)) : t.itWas(L(culpritOpt.name, isAr))}</span>
            </div>
            <div style={S.explain}>
              <div style={S.explainHead}>{t.chain}</div>
              {c.solution.explanation.map((s, i) => (
                <div key={i} style={S.solStep}>
                  <span style={S.solNum}>{i + 1}</span>
                  <span style={S.solTxt}>{L(s, isAr)}</span>
                </div>
              ))}
            </div>
            {verdict.culpritOk && (
              <div style={S.epilogueCard}>
                <div style={S.explainHead}>{t.epilogueHead}</div>
                <p style={S.epilogueText}>{L(c.solution.epilogue, isAr)}</p>
              </div>
            )}
            {verdict.pts > 0 && <span style={S.ptsChip}>{t.pts(verdict.pts)}</span>}
            {mode === 'free' && !verdict.culpritOk && (
              <div style={S.livesLeft}>{'♥'.repeat(Math.max(0, livesRef.current))}{'♡'.repeat(Math.min(LIVES, LIVES - livesRef.current))}</div>
            )}
            <button type="button" style={S.primary} onClick={afterVerdict}>{mode === 'levels' ? t.finish : t.next}</button>
          </div>
        </div>
      )}

      {overlay?.t === 'location' && (
        <div style={S.dim} onClick={() => setOverlay(null)}>
          <div style={S.sheetCard} onClick={(e) => e.stopPropagation()}>
            <div style={S.sheetIcon}>{overlay.result.icon}</div>
            <h3 style={S.sheetTitle}>{L(overlay.result.title, isAr)}</h3>
            <p style={S.sheetText}>{L(overlay.result.text, isAr)}</p>
            <button type="button" style={S.primary} onClick={() => { playSfx?.('click'); setOverlay(null); }}>{t.close}</button>
          </div>
        </div>
      )}

      {overlay?.t === 'report' && (
        <div style={S.dim} onClick={() => setOverlay(null)}>
          <div style={S.sheetCard} onClick={(e) => e.stopPropagation()}>
            <div style={S.reportHead}>
              <span style={S.portrait}>{overlay.person.e}</span>
              <div>
                <h3 style={S.sheetTitle}>{L(overlay.person.name, isAr)}</h3>
                <p style={S.reportRole}>{L(overlay.person.role, isAr)}</p>
              </div>
            </div>
            <div style={S.reportBody}>{buildReport(overlay.person, isAr)}</div>
            <button type="button" style={S.primary} onClick={() => { playSfx?.('click'); setOverlay(null); }}>{t.close}</button>
          </div>
        </div>
      )}

      {overlay?.t === 'accuse' && (
        <div style={S.dim} onClick={() => setOverlay(null)}>
          <div style={S.sheetCard} onClick={(e) => e.stopPropagation()}>
            <h3 style={S.sheetTitle}>{t.accuseTitle}</h3>
            <p style={S.accuseSub}>{t.accuseSub}</p>
            <div style={S.accuseGrid}>
              {c.suspects.map((s) => (
                <button key={s.id} type="button" style={{ ...S.accuseCard, ...(accuseSid === s.id ? S.accuseCardOn : null) }}
                  onClick={() => { playSfx?.('click'); setAccuseSid(s.id); }}>
                  <span style={S.portraitSm}>{s.e}</span>
                  <span style={S.suspectName}>{L(s.name, isAr)}</span>
                </button>
              ))}
            </div>
            {accuseSid && (
              <button type="button" style={{ ...S.primary, marginTop: 12 }} onClick={confirmAccuse}>{t.confirmAccuse}</button>
            )}
            <button type="button" style={{ ...S.ghostSm, marginTop: 8 }} onClick={() => { playSfx?.('click'); setOverlay(null); }}>{t.notYet}</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DetectiveGame({ onBack, workoutMode = false }) {
  const { currentLang, playSfx, awardPoints } = useApp();
  const isAr = currentLang === 'ar';
  return (
    <ModeShell
      storageKey="mm_reason_detective"
      scienceId="detective"
      title={{ en: 'Detective', ar: 'المحقّق' }}
      hints={{
        free: { en: 'Read the story · examine the scene · accuse when ready · 3 misses out', ar: 'اقرأ القصة · افحص المسرح · اتّهم حين تجهز · ٣ أخطاء وتخرج' },
        levels: { en: 'Study each report and the scene — then name the culprit', ar: 'ادرس كل إفادة والمسرح — ثم سمِّ الفاعل' },
        pass: { en: 'Same cases for all · most correct accusations wins', ar: 'نفس القضايا للجميع · من يصيب أكثر يفوز' },
      }}
      diffLabels={{ easy: { en: 'Easy', ar: 'سهل' }, med: { en: 'Medium', ar: 'متوسط' }, hard: { en: 'Hard', ar: 'صعب' } }}
      pass={{ trials: 2, scoreLabel: { en: 'correct accusations', ar: 'اتهامات صحيحة' }, lowerBetter: false, diff: 'med' }}
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      workoutMode={workoutMode}
      renderEngine={(p) => <InvestigationEngine key={`inv-${p.mode}-${p.diff}-${p.level}-${p.seed}`} {...p} isAr={isAr} playSfx={playSfx} awardPoints={awardPoints} />}
    />
  );
}

const S = {
  root: {
    position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column',
    background: 'var(--color-training-palette-surface, #fff7f2)', color: '#2d2d2d',
    fontFamily: "'Outfit', system-ui, sans-serif",
  },
  body: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    padding: '8px 16px calc(16px + env(safe-area-inset-bottom))', maxWidth: 480, width: '100%',
    margin: '0 auto', overflowY: 'auto',
  },
  investWrap: { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, maxWidth: 480, width: '100%', margin: '0 auto' },
  tabBar: { display: 'flex', gap: 6, padding: '8px 14px 0', flexShrink: 0 },
  tab: {
    flex: 1, padding: '10px 6px', borderRadius: '12px 12px 0 0', border: '1.5px solid #e3d6c4',
    borderBottom: 'none', background: '#fffdf8', color: '#8a7a62', fontWeight: 800, fontSize: 12.5,
    cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
  },
  tabOn: { background: '#fbf3e4', color: '#2d2210', borderColor: '#d9c294' },
  tabCount: { fontSize: 10, fontWeight: 700, color: '#b9842f' },
  tabBody: { flex: 1, overflowY: 'auto', padding: '12px 14px', background: '#fbf3e4', border: '1.5px solid #e3d6c4', margin: '0 14px', borderRadius: '0 0 14px 14px' },
  tabIntro: { margin: '0 0 6px', fontWeight: 600, fontSize: 13, color: '#6a5a42', lineHeight: 1.45 },
  progressLine: { margin: '0 0 10px', fontWeight: 800, fontSize: 11, color: '#a49a88', textTransform: 'uppercase', letterSpacing: 0.6 },
  cardList: { display: 'flex', flexDirection: 'column', gap: 8 },
  locCard: {
    display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 14px',
    borderRadius: 12, border: '1.5px solid #e3d6c4', background: '#fffdf8', cursor: 'pointer',
    textAlign: 'start', color: 'inherit', font: 'inherit', animation: 'dt-fade 0.2s ease-out',
  },
  locCardDone: { opacity: 0.72, borderColor: '#9ecfb2' },
  locNum: { flexShrink: 0, width: 22, height: 22, borderRadius: 11, background: '#b9842f', color: '#fff', fontWeight: 900, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  locIcon: { fontSize: 22, flexShrink: 0 },
  locText: { display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 },
  locName: { fontWeight: 900, fontSize: 14, color: '#2d2210' },
  locAction: { fontWeight: 700, fontSize: 11.5, color: '#b9842f' },
  reportCard: {
    display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 14px',
    borderRadius: 12, border: '1.5px solid #e3d6c4', background: '#fffdf8', cursor: 'pointer',
    textAlign: 'start', color: 'inherit', font: 'inherit',
  },
  reportCardDone: { borderColor: '#9ecfb2' },
  readMark: { flexShrink: 0, fontWeight: 800, fontSize: 10.5, color: '#b9842f', maxWidth: 72, textAlign: 'end' },
  tagChip: { alignSelf: 'flex-start', fontWeight: 800, fontSize: 9, color: '#7a6a52', textTransform: 'uppercase', letterSpacing: 0.5 },
  bottomBar: { padding: '10px 14px calc(12px + env(safe-area-inset-bottom))', flexShrink: 0 },
  accuseBtn: {
    width: '100%', padding: '14px 16px', borderRadius: 14, border: '2px solid #1a1208',
    background: '#c0392b', color: '#fff', fontWeight: 900, fontSize: 15, cursor: 'pointer',
    boxShadow: '3px 3px 0 #1a1208',
  },
  fileCard: {
    width: '100%', background: '#fbf3e4', border: '2px solid #d9c294', borderRadius: 16,
    padding: '14px 16px 18px', display: 'flex', flexDirection: 'column', gap: 8,
    boxShadow: '4px 4px 0 rgba(26,18,8,0.18)', animation: 'dt-slide 0.35s ease-out', marginTop: 10, color: '#2d2210',
  },
  stampRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  stamp: {
    display: 'inline-block', transform: 'rotate(-8deg)', border: '3px solid #c0392b', color: '#c0392b',
    fontFamily: "'Bangers','Cairo',cursive", fontSize: 15, letterSpacing: 1.5, padding: '2px 10px',
    borderRadius: 6, animation: 'dt-stamp 0.5s ease-out',
  },
  tierBadge: { fontWeight: 900, fontSize: 11, color: '#7a5a1e', background: '#fff1d8', border: '1.5px solid #e3c489', borderRadius: 999, padding: '3px 10px' },
  caseTitle: { margin: 0, fontWeight: 900, fontSize: 'clamp(18px, 5vw, 22px)', color: '#2d2210', textAlign: 'center' },
  chipRow: { display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' },
  metaChip: { fontWeight: 800, fontSize: 12, color: '#7a5a1e', background: '#fff1d8', border: '1.5px solid #e3c489', borderRadius: 999, padding: '3px 12px' },
  setup: { margin: 0, fontWeight: 700, fontSize: 'clamp(14px, 3.9vw, 15.5px)', color: '#3a2c18', lineHeight: 1.55 },
  sectionHead: { width: '100%', fontSize: 11, fontWeight: 900, color: '#a35a48', textTransform: 'uppercase', letterSpacing: 0.7, marginTop: 4 },
  suspectGrid: { display: 'flex', flexDirection: 'column', gap: 7, width: '100%' },
  suspectCard: { display: 'flex', gap: 10, alignItems: 'center', background: '#fffdf8', border: '1.5px solid #e3d6c4', borderRadius: 12, padding: '10px 12px' },
  portrait: { width: 44, height: 44, borderRadius: 999, background: '#fffdf8', border: '2.5px solid #d8cab4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 },
  portraitSm: { width: 36, height: 36, borderRadius: 999, background: '#fffdf8', border: '2.5px solid #d8cab4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 },
  suspectMeta: { display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 },
  suspectName: { fontWeight: 900, fontSize: 13.5, color: '#2d2210' },
  suspectDesc: { fontWeight: 700, fontSize: 12, color: '#6a5a42', lineHeight: 1.4 },
  noteCard: { display: 'flex', gap: 10, padding: '10px 12px', borderRadius: 12, border: '1.5px solid #e3d6c4', background: '#fffdf8' },
  noteIcon: { fontSize: 20, flexShrink: 0 },
  noteBody: { display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 },
  clueName: { fontWeight: 900, fontSize: 13, color: '#2d2210' },
  clueTxt: { fontWeight: 700, fontSize: 12.5, color: '#5a4a32', lineHeight: 1.45 },
  emptyNote: { fontWeight: 700, fontSize: 13.5, color: '#a49a88', textAlign: 'center', marginTop: 24 },
  dim: { position: 'absolute', inset: 0, background: 'rgba(26,18,8,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 9 },
  sheetCard: {
    width: '100%', maxWidth: 380, background: '#fffdf8', border: '2.5px solid #1a1208', borderRadius: 18,
    padding: '18px 18px 16px', display: 'flex', flexDirection: 'column', gap: 10, color: '#2d2210',
    boxShadow: '5px 5px 0 rgba(26,18,8,0.3)', animation: 'dt-slide 0.25s ease-out', maxHeight: '85vh', overflowY: 'auto',
  },
  sheetIcon: { fontSize: 36, textAlign: 'center' },
  sheetTitle: { margin: 0, fontWeight: 900, fontSize: 17, textAlign: 'center', color: '#2d2210' },
  sheetText: { margin: 0, fontWeight: 700, fontSize: 14.5, lineHeight: 1.55, color: '#3a2c18' },
  reportHead: { display: 'flex', gap: 12, alignItems: 'center' },
  reportRole: { margin: '2px 0 0', fontWeight: 700, fontSize: 12, color: '#6a5a42' },
  reportBody: { fontWeight: 700, fontSize: 14.5, lineHeight: 1.6, color: '#3a2c18', whiteSpace: 'pre-wrap', padding: '4px 2px 8px' },
  accuseSub: { margin: 0, fontWeight: 700, fontSize: 13, color: '#6a5a42', textAlign: 'center', lineHeight: 1.45 },
  accuseGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 8, width: '100%' },
  accuseCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '12px 8px', borderRadius: 13, border: '2px solid #d8cab4', background: '#fffdf8', cursor: 'pointer', font: 'inherit' },
  accuseCardOn: { borderColor: '#c0392b', background: '#fdf0ee', boxShadow: '0 0 0 2px rgba(192,57,43,0.3)' },
  verdictCard: { width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginTop: 8, paddingBottom: 8 },
  closedStamp: { alignSelf: 'center', transform: 'rotate(-8deg)', border: '3px solid #2e8b57', color: '#2e8b57', fontFamily: "'Bangers','Cairo',cursive", fontSize: 16, letterSpacing: 1.5, padding: '2px 12px', borderRadius: 6, background: 'rgba(255,253,248,0.9)', animation: 'dt-stamp 0.6s ease-out 0.15s both' },
  verdictTitle: { fontWeight: 900, fontSize: 22, textAlign: 'center' },
  truth: { display: 'flex', gap: 10, alignItems: 'center', fontWeight: 900, fontSize: 15, textAlign: 'center', color: '#2d2210' },
  explain: { width: '100%', background: '#fffdf8', border: '2px solid #e3d6c4', borderRadius: 14, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 },
  explainHead: { fontWeight: 900, fontSize: 12, color: '#7a6a52', textTransform: 'uppercase', letterSpacing: 0.6 },
  solStep: { display: 'flex', gap: 9, alignItems: 'flex-start' },
  solNum: { flexShrink: 0, width: 20, height: 20, borderRadius: 10, background: '#b9842f', color: '#fff', fontWeight: 900, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  solTxt: { fontWeight: 700, fontSize: 13.5, color: '#3a3a3a', lineHeight: 1.45 },
  epilogueCard: { width: '100%', background: '#fbf3e4', border: '2px solid #d9c294', borderRadius: 14, padding: '12px 15px', display: 'flex', flexDirection: 'column', gap: 6 },
  epilogueText: { margin: 0, fontWeight: 700, fontSize: 'clamp(13.5px, 3.7vw, 15px)', color: '#3a2c18', lineHeight: 1.55 },
  ptsChip: { fontWeight: 900, fontSize: 15, color: '#7a5a1e', background: '#fdeecb', border: '2px solid #b9842f', borderRadius: 999, padding: '3px 12px' },
  livesLeft: { fontWeight: 900, fontSize: 16, color: '#d23b3b', letterSpacing: 2 },
  detectiveIcon: { fontSize: 46 },
  primary: { padding: '12px 26px', borderRadius: 14, border: '2px solid #1a1208', background: '#2e8b57', color: '#fff', fontWeight: 900, fontSize: 15, cursor: 'pointer', boxShadow: '3px 3px 0 #1a1208' },
  ghost: { padding: '12px 20px', borderRadius: 14, border: '2px solid #cdbfa6', background: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', color: '#4a3c28' },
  ghostSm: { padding: '9px 14px', borderRadius: 12, border: '2px solid #cdbfa6', background: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer', color: '#4a3c28' },
  overWrap: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24, textAlign: 'center' },
  overTitle: { margin: '4px 0 0', fontWeight: 900, fontSize: 24, color: '#2d2210' },
  overSub: { margin: 0, fontWeight: 700, color: '#5a4a32' },
  btnRow: { display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 14 },
};
