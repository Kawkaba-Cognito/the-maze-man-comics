import React, { useCallback, useMemo, useRef, useState } from 'react';
import OpeningSequence from '../../../../../shared/scene/OpeningSequence';
import SceneBoard from '../../../../../shared/scene/SceneBoard';
import SpeechBubble from '../../../../../shared/scene/SpeechBubble';
import { CASE_FILE_CONFIG } from './caseFileConfig';
import DeductionBoard from './components/DeductionBoard';
import ProofChainPreview from './components/ProofChainPreview';
import AssistantNudge from './components/AssistantNudge';
import LocationPolaroid from './components/LocationPolaroid';
import VerdictFilePage from './components/VerdictFilePage';
import {
  L, buildReport, sceneLocations, locationResult, getConfrontations, allConfrontations,
  validateAccusation, proofCount, canAccuse, confrontTargets, assistantLine,
  PROTO_CSS, PT,
} from './protoUtils';
import { tierLabel } from '../caseUtils';

/**
 * Case File investigation engine — BASE + B1/B2/B3 enhancement configs.
 */
export default function ProtoEngine({
  variant, caseData, caseIndex, caseTotal, isAr, playSfx, onCaseDone, onExit,
  hudSub, caseStamp, verdictLabels,
}) {
  const cfg = CASE_FILE_CONFIG[variant] || CASE_FILE_CONFIG.b3;
  const t = verdictLabels || (isAr ? PT.ar : PT.en);

  const foundRef = useRef(new Set());
  const testimonyRef = useRef(new Set());

  const initialPhase = () => {
    if (cfg.openingHook && caseData.openingHook) return 'hook';
    if (cfg.openingPanels && caseData.openingPanels?.length) return 'opening';
    return 'briefing';
  };

  const [phase, setPhase] = useState(initialPhase);
  const [tab, setTab] = useState('casefile');
  const [overlay, setOverlay] = useState(null);
  const [found, setFound] = useState([]);
  const [testimony, setTestimony] = useState([]);
  const [examined, setExamined] = useState(() => new Set());
  const [readReports, setReadReports] = useState(() => new Set());
  const [doneConfronts, setDoneConfronts] = useState(() => new Set());
  const [clearedSuspects, setClearedSuspects] = useState(() => new Set());
  const [assistantMsg, setAssistantMsg] = useState(null);
  const [sceneView, setSceneView] = useState('map');
  const [accuseSid, setAccuseSid] = useState(null);
  const [proofIds, setProofIds] = useState([]);
  const [accuseStep, setAccuseStep] = useState('who');
  const [verdict, setVerdict] = useState(null);

  const clueById = useMemo(() => {
    const m = {};
    (caseData.clues || []).forEach((cl) => { m[cl.id] = cl; });
    return m;
  }, [caseData]);

  const locations = useMemo(() => sceneLocations(caseData), [caseData]);
  const people = useMemo(() => [...caseData.suspects, ...(caseData.witnesses || [])], [caseData]);
  const suspectIds = useMemo(() => new Set(caseData.suspects.map((s) => s.id)), [caseData]);
  const foundSet = useMemo(() => new Set(found), [found]);
  const doneSet = useMemo(() => doneConfronts, [doneConfronts]);

  const addClue = useCallback((id, kind = 'evidence') => {
    if (kind === 'testimony') {
      if (testimonyRef.current.has(id)) return;
      testimonyRef.current.add(id);
      setTestimony((prev) => [...prev, id]);
    } else {
      if (foundRef.current.has(id)) return;
      foundRef.current.add(id);
      setFound((prev) => [...prev, id]);
      if (cfg.assistantNudges && caseData.assistant) {
        setAssistantMsg(assistantLine('clue', caseData.assistant, isAr));
      }
    }
  }, [cfg.assistantNudges, caseData.assistant, isAr]);

  const examineHotspot = (hotspot) => {
    playSfx?.('click');
    const loc = locations.find((l) => l.id === hotspot.id) || {
      id: hotspot.id, icon: hotspot.e, name: hotspot.name,
      clueId: hotspot.clueId || null, empty: hotspot.empty || null,
    };
    const result = locationResult(loc, clueById, isAr);
    setExamined((p) => new Set(p).add(loc.id));
    if (result.clueId && !foundRef.current.has(result.clueId)) {
      addClue(result.clueId, 'evidence');
      playSfx?.('win');
    }
    setOverlay({ t: 'location', loc, result });
  };

  const examineLocation = (loc) => {
    playSfx?.('click');
    const result = locationResult(loc, clueById, isAr);
    setExamined((p) => new Set(p).add(loc.id));
    if (result.clueId && !foundRef.current.has(result.clueId)) {
      addClue(result.clueId, 'evidence');
      playSfx?.('win');
    }
    setOverlay({ t: 'location', loc, result });
  };

  const openReport = (person) => {
    playSfx?.('click');
    setReadReports((p) => new Set(p).add(person.id));
    (person.questions || []).forEach((q) => {
      if (q.givesClue && !q.needsClue) addClue(q.givesClue, 'testimony');
    });
    setOverlay({ t: 'report', person });
  };

  const startConfront = (person, question) => {
    playSfx?.('click');
    setOverlay({ t: 'confront', person, question });
  };

  const finishConfront = (person, question) => {
    const key = `${person.id}:${question.id}`;
    setDoneConfronts((p) => new Set(p).add(key));
    if (question.givesClue) addClue(question.givesClue, 'testimony');
    if (cfg.assistantNudges && caseData.assistant) {
      setAssistantMsg(assistantLine('confront', caseData.assistant, isAr));
    }
    playSfx?.('win');
    setOverlay(null);
  };

  const toggleCleared = (sid) => {
    playSfx?.('click');
    setClearedSuspects((p) => {
      const n = new Set(p);
      if (n.has(sid)) n.delete(sid); else n.add(sid);
      return n;
    });
  };

  const startUseClue = (clueId) => {
    const targets = confrontTargets(caseData, clueId, foundSet, doneSet);
    if (targets.length === 0) return;
    if (targets.length === 1) {
      startConfront(targets[0].person, targets[0].question);
      return;
    }
    playSfx?.('click');
    setOverlay({ t: 'pickSuspect', clueId, targets });
  };

  const accuseGate = canAccuse(cfg, found.length, doneConfronts.size);
  const accuseSuspect = caseData.suspects.find((s) => s.id === accuseSid);

  const toggleProof = (id) => {
    playSfx?.('click');
    const need = proofCount(caseData);
    setProofIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (need === 1) return [id];
      if (prev.length >= need) return [...prev.slice(1), id];
      return [...prev, id];
    });
  };

  const confirmAccuse = () => {
    const { win, culpritOk, partial } = validateAccusation(caseData, accuseSid, proofIds, cfg.proofAccuse);
    setVerdict({ win, culpritOk, partial, proofIds: [...proofIds] });
    setOverlay(null);
    setPhase('verdict');
    playSfx?.(win ? 'win' : partial ? 'error' : 'error');
  };

  const openAccuse = () => {
    setAccuseSid(null);
    setProofIds([]);
    setAccuseStep('who');
    setOverlay({ t: 'accuse' });
  };

  const culpritOpt = caseData.suspects.find((s) => s.id === caseData.solution.culprit);
  const tier = caseData.tier || 1;
  const baseTabs = ['casefile', 'scene', 'people', 'notes'];
  const tabs = cfg.deductionBoard ? ['casefile', 'scene', 'board', 'people', 'notes'] : baseTabs;
  const allClues = [...found, ...testimony];
  const needProof = proofCount(caseData);
  const fileChrome = cfg.fileChrome;
  const showSpeech = cfg.speechBubbles || cfg.transcriptUI;

  const accuseGateMsg = !accuseGate.ok
    ? (accuseGate.reason === 'evidence' ? t.accuseNeedEvidence(accuseGate.need) : t.accuseNeedConfront(accuseGate.need))
    : null;

  const renderNoteRow = (id, kind = 'evidence') => {
    const cl = clueById[id];
    if (!cl) return null;
    const targets = cfg.activeConfrontLink ? confrontTargets(caseData, id, foundSet, doneSet) : [];
    const sourceLabel = kind === 'testimony' ? t.sourceTestimony : t.sourceScene;
    return (
      <div key={id} style={S.noteRowWrap}>
        <button type="button" style={S.noteCardBtn} onClick={() => setOverlay({ t: 'clue', clue: cl })}>
          <span style={S.noteIcon}>{cl.e}</span>
          <div style={S.noteBody}>
            <span style={S.clueName}>{L(cl.name, isAr)}</span>
            {cfg.clueSourceChip && <span style={S.sourceChip}>{sourceLabel}</span>}
            <span style={S.clueTxt}>{L(cl.text, isAr)}</span>
          </div>
        </button>
        {cfg.activeConfrontLink && targets.length > 0 && (
          <button type="button" style={S.useClueBtn} onClick={() => startUseClue(id)}>{t.useOnSuspect}</button>
        )}
      </div>
    );
  };

  const caseFileCard = (
    <div style={S.fileCard}>
      <div style={S.stampRow}>
        <span style={S.stamp}>{t.introStamp}{caseStamp != null ? ` #${caseStamp}` : ''}</span>
        <span style={S.tierBadge}>{tierLabel(tier, isAr)}</span>
      </div>
      <h2 style={S.caseTitle}>{L(caseData.title, isAr)}</h2>
      <div style={S.chipRow}>
        <span style={S.metaChip}>📍 {L(caseData.setting, isAr)}</span>
        {caseData.assistant && (
          <span style={S.metaChip}>{caseData.assistant.e} {t.withAssistant(L(caseData.assistant.name, isAr))}</span>
        )}
      </div>
      <p style={S.setup}>{L(caseData.briefing, isAr)}</p>
      <div style={S.sectionHead}>{t.theSuspects}</div>
      <div style={S.suspectGrid}>
        {caseData.suspects.map((s) => (
          <div key={s.id} style={S.suspectCard}>
            <div style={S.portrait}>{s.e}</div>
            <div style={S.suspectMeta}>
              <span style={S.suspectName}>{L(s.name, isAr)}</span>
              <span style={S.suspectDesc}>{L(s.role, isAr)}</span>
            </div>
          </div>
        ))}
      </div>
      {phase === 'briefing' && (
        <button type="button" style={{ ...S.primary, alignSelf: 'center', marginTop: 8 }} onClick={() => { playSfx?.('click'); setPhase('investigate'); setTab('scene'); }}>
          {t.start}
        </button>
      )}
    </div>
  );

  return (
    <div style={{ ...S.root, ...(fileChrome ? S.rootFile : null) }} dir={isAr ? 'rtl' : 'ltr'}>
      <style>{PROTO_CSS}</style>
      <header className="ct-training-play-header">
        <button className="ct-training-chrome-btn" aria-label={t.menu} onClick={() => { playSfx?.('click'); onExit?.(); }}>‹</button>
        <div className="ct-training-play-header-body">
          <div className="ct-training-play-title">🕵️ {L(caseData.title, isAr)}</div>
          <div className="ct-training-play-sub">{hudSub ?? `${caseIndex + 1}/${caseTotal} · ${cfg.label[isAr ? 'ar' : 'en']}`}</div>
        </div>
        <div className="ct-training-chrome-spacer" aria-hidden="true" />
      </header>

      {cfg.assistantNudges && assistantMsg && (
        <AssistantNudge assistant={caseData.assistant} message={assistantMsg} isAr={isAr} />
      )}

      {phase === 'hook' && caseData.openingHook && (
        <OpeningSequence
          panels={[caseData.openingHook]}
          isAr={isAr}
          labels={{
            panelOf: () => '',
            next: t.startInvestigation,
            skip: t.openingHookSkip,
            start: t.startInvestigation,
          }}
          onDone={() => { setPhase('briefing'); playSfx?.('click'); }}
          onSkip={() => { setPhase('briefing'); playSfx?.('click'); }}
        />
      )}

      {phase === 'opening' && caseData.openingPanels && !cfg.openingHook && (
        <OpeningSequence
          panels={caseData.openingPanels}
          isAr={isAr}
          labels={{
            panelOf: t.panelOf,
            next: t.next,
            skip: t.skip,
            start: t.startInvestigation,
          }}
          onDone={() => { setPhase('briefing'); playSfx?.('click'); }}
          onSkip={() => { setPhase('briefing'); playSfx?.('click'); }}
        />
      )}

      {phase === 'briefing' && (
        <div style={S.body}>{caseFileCard}</div>
      )}

      {phase === 'investigate' && (
        <div style={S.investWrap}>
          <div style={S.tabBar}>
            {tabs.map((id) => (
              <button key={id} type="button" style={{ ...S.tab, ...(tab === id ? S.tabOn : null) }} onClick={() => { playSfx?.('click'); setTab(id); }}>
                {t[id] || id}
                {id === 'scene' && locations.length > 0 && <span style={S.tabCount}>{examined.size}/{locations.length}</span>}
                {id === 'people' && people.length > 0 && <span style={S.tabCount}>{readReports.size}/{people.length}</span>}
                {id === 'notes' && allClues.length > 0 && <span style={S.tabCount}>{allClues.length}</span>}
              </button>
            ))}
          </div>

          <div style={{ ...S.tabBody, ...(fileChrome ? S.tabBodyFile : null) }}>
            {tab === 'casefile' && caseFileCard}

            {tab === 'board' && cfg.deductionBoard && (
              <DeductionBoard
                suspects={caseData.suspects}
                clearedIds={clearedSuspects}
                onToggleClear={toggleCleared}
                clues={allClues}
                clueById={clueById}
                isAr={isAr}
                labels={t}
              />
            )}

            {tab === 'scene' && (
              <>
                <p style={S.tabIntro}>{cfg.sceneBoard ? t.sceneIntro : t.sceneListIntro}</p>
                <p style={S.progressLine}>{t.locationOf(examined.size, locations.length)}</p>
                {cfg.sceneListToggle && cfg.sceneBoard && (
                  <div style={S.viewToggle}>
                    <button type="button" style={{ ...S.viewBtn, ...(sceneView === 'map' ? S.viewBtnOn : null) }} onClick={() => setSceneView('map')}>{t.mapView}</button>
                    <button type="button" style={{ ...S.viewBtn, ...(sceneView === 'list' ? S.viewBtnOn : null) }} onClick={() => setSceneView('list')}>{t.listView}</button>
                  </div>
                )}
                {cfg.polaroidScene && (
                  <div style={S.polaroidGrid}>
                    {locations.map((loc) => (
                      <LocationPolaroid key={loc.id} loc={loc} examined={examined} isAr={isAr} onTap={examineLocation} labels={t} />
                    ))}
                  </div>
                )}
                {!cfg.polaroidScene && cfg.sceneBoard && sceneView === 'map' && (
                  <SceneBoard caseData={caseData} isAr={isAr} examined={examined} onPinTap={examineHotspot} />
                )}
                {!cfg.polaroidScene && (!cfg.sceneBoard || sceneView === 'list') && (
                  <div style={S.cardList}>
                    {locations.map((loc, i) => {
                      const done = examined.has(loc.id);
                      return (
                        <button key={loc.id} type="button" style={{ ...S.locCard, ...(done ? S.locCardDone : null) }} onClick={() => examineLocation(loc)}>
                          <span style={S.locNum}>{i + 1}</span>
                          <span style={S.locIcon}>{loc.icon}</span>
                          <span style={S.locText}>
                            <span style={S.locName}>{L(loc.name, isAr)}</span>
                            <span style={S.locAction}>{done ? t.review : t.examine}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {tab === 'people' && (
              <>
                {cfg.transcriptUI && <div style={S.transcriptHead}>{t.transcriptHead}</div>}
                <p style={S.tabIntro}>{t.peopleIntro}</p>
                <div style={S.cardList}>
                  {people.map((p) => {
                    const done = readReports.has(p.id);
                    const confronts = cfg.confrontations && !cfg.activeConfrontLink
                      ? getConfrontations(p, foundSet, doneSet) : [];
                    const isSuspect = suspectIds.has(p.id);
                    return (
                      <div key={p.id} style={{ ...S.personBlock, ...(cfg.transcriptUI ? S.transcriptBlock : null) }}>
                        <button type="button" style={{ ...S.reportCard, ...(done ? S.reportCardDone : null) }} onClick={() => openReport(p)}>
                          <span style={S.portraitSm}>{p.e}</span>
                          <span style={S.locText}>
                            <span style={S.locName}>{L(p.name, isAr)}</span>
                            <span style={S.suspectDesc}>{L(p.role, isAr)}</span>
                            <span style={S.tagChip}>{cfg.transcriptUI ? t.statementEntry : (isSuspect ? t.suspectTag : t.witnessTag)}</span>
                          </span>
                          <span style={S.readMark}>{done ? t.read : t.readStatement}</span>
                        </button>
                        {!cfg.activeConfrontLink && confronts.map((q) => (
                          <button key={q.id} type="button" style={S.confrontBtn} onClick={() => startConfront(p, q)}>
                            ⚡ {t.confront} — {L(clueById[q.needsClue]?.name || { en: q.needsClue, ar: q.needsClue }, isAr)}
                          </button>
                        ))}
                        {cfg.confrontations && allConfrontations(p).filter((q) => doneSet.has(`${p.id}:${q.id}`)).map((q) => (
                          <div key={`done-${q.id}`} style={S.confrontDone}>
                            {cfg.transcriptUI ? `📋 ${t.confrontEntry}` : `✓ ${t.confronted}`} — {L(clueById[q.needsClue]?.name || q.needsClue, isAr)}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {tab === 'notes' && (
              <>
                {allClues.length === 0 && <div style={S.emptyNote}>{t.emptyNote}</div>}
                {cfg.evidenceSplit ? (
                  <>
                    {found.length > 0 && (
                      <>
                        <div style={S.sectionHead}>{t.evidence}</div>
                        {found.map((id) => renderNoteRow(id, 'evidence'))}
                      </>
                    )}
                    {testimony.length > 0 && (
                      <>
                        <div style={S.sectionHead}>{t.testimony}</div>
                        {testimony.map((id) => renderNoteRow(id, 'testimony'))}
                      </>
                    )}
                  </>
                ) : (
                  found.length > 0 && (
                    <>
                      <div style={S.sectionHead}>{t.evidence}</div>
                      {found.map((id) => renderNoteRow(id, 'evidence'))}
                    </>
                  )
                )}
              </>
            )}
          </div>

          <div style={S.bottomBar}>
            <button
              type="button"
              disabled={!accuseGate.ok}
              style={{ ...S.accuseBtn, ...(!accuseGate.ok ? S.accuseBtnLocked : null) }}
              onClick={() => { if (!accuseGate.ok) return; playSfx?.('click'); openAccuse(); }}
            >
              {!accuseGate.ok ? t.accuseLocked : t.accuse}
            </button>
            {!accuseGate.ok && accuseGateMsg && <p style={S.gateHint}>{accuseGateMsg}</p>}
          </div>
        </div>
      )}

      {phase === 'verdict' && verdict && (
        cfg.verdictFile ? (
          <VerdictFilePage
            verdict={verdict}
            caseData={caseData}
            culpritOpt={culpritOpt}
            isAr={isAr}
            labels={{ ...t, nextCase: caseIndex + 1 >= caseTotal ? t.backToProtos : t.nextCase }}
            onContinue={() => { playSfx?.('click'); onCaseDone?.(verdict); }}
            styles={S}
          />
        ) : (
        <div style={S.body}>
          <div style={{ ...S.verdictCard, animation: verdict.win ? 'dt-slide 0.3s ease-out' : 'dt-shake 0.4s ease-out' }}>
            {verdict.win && <div style={S.closedStamp}>{t.caseClosed}</div>}
            <div style={{ ...S.verdictTitle, color: verdict.win ? '#2e8b57' : '#d23b3b' }}>
              {verdict.win ? t.fullWin : verdict.partial ? t.partial : t.lost}
            </div>
            {verdict.partial && <p style={S.partialSub}>{t.partialSub}</p>}
            <div style={S.truth}>
              <span style={S.portraitSm}>{culpritOpt.e}</span>
              <span>{verdict.win ? t.culpritWas(L(culpritOpt.name, isAr)) : t.itWas(L(culpritOpt.name, isAr))}</span>
            </div>
            <div style={S.explain}>
              <div style={S.explainHead}>{t.chain}</div>
              {caseData.solution.explanation.map((s, i) => (
                <div key={i} style={S.solStep}>
                  <span style={S.solNum}>{i + 1}</span>
                  <span style={S.solTxt}>{L(s, isAr)}</span>
                </div>
              ))}
            </div>
            {verdict.win && (
              <div style={S.epilogueCard}>
                <div style={S.explainHead}>{t.epilogueHead}</div>
                <p style={S.epilogueText}>{L(caseData.solution.epilogue, isAr)}</p>
              </div>
            )}
            <button type="button" style={S.primary} onClick={() => { playSfx?.('click'); onCaseDone?.(verdict); }}>
              {caseIndex + 1 >= caseTotal ? t.backToProtos : t.nextCase}
            </button>
          </div>
        </div>
        )
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

      {overlay?.t === 'clue' && (
        <div style={S.dim} onClick={() => setOverlay(null)}>
          <div style={S.sheetCard} onClick={(e) => e.stopPropagation()}>
            <div style={S.sheetIcon}>{overlay.clue.e}</div>
            <h3 style={S.sheetTitle}>{L(overlay.clue.name, isAr)}</h3>
            <p style={S.sheetText}>{L(overlay.clue.text, isAr)}</p>
            <button type="button" style={S.primary} onClick={() => setOverlay(null)}>{t.close}</button>
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
            {showSpeech ? (
              <SpeechBubble style={{ marginTop: 8 }}>{buildReport(overlay.person, isAr)}</SpeechBubble>
            ) : (
              <div style={S.reportBody}>{buildReport(overlay.person, isAr)}</div>
            )}
            <button type="button" style={S.primary} onClick={() => setOverlay(null)}>{t.close}</button>
          </div>
        </div>
      )}

      {overlay?.t === 'confront' && (
        <div style={S.dim} onClick={() => setOverlay(null)}>
          <div style={S.sheetCard} onClick={(e) => e.stopPropagation()}>
            <div style={S.reportHead}>
              <span style={S.portrait}>{overlay.person.e}</span>
              <h3 style={S.sheetTitle}>{L(overlay.person.name, isAr)}</h3>
            </div>
            {showSpeech ? (
              <>
                <SpeechBubble style={{ marginTop: 4 }}>{L(overlay.question.q, isAr)}</SpeechBubble>
                <SpeechBubble style={{ marginTop: 12, marginInlineStart: 20 }} tail="bottom">{L(overlay.question.a, isAr)}</SpeechBubble>
              </>
            ) : (
              <>
                <p style={S.sheetText}><strong>Q:</strong> {L(overlay.question.q, isAr)}</p>
                <p style={S.sheetText}><strong>A:</strong> {L(overlay.question.a, isAr)}</p>
              </>
            )}
            {overlay.question.reaction && (
              <p style={S.reaction}><em>{L(overlay.question.reaction, isAr)}</em></p>
            )}
            <button type="button" style={S.primary} onClick={() => finishConfront(overlay.person, overlay.question)}>{t.close}</button>
          </div>
        </div>
      )}

      {overlay?.t === 'accuse' && (
        <div style={S.dim} onClick={() => setOverlay(null)}>
          <div style={S.sheetCard} onClick={(e) => e.stopPropagation()}>
            {(!cfg.proofAccuse || accuseStep === 'who') && (
              <>
                <h3 style={S.sheetTitle}>{t.accuseWho}</h3>
                <p style={S.accuseSub}>{t.accuseSubWho}</p>
                <div style={S.accuseGrid}>
                  {caseData.suspects.map((s) => (
                    <button key={s.id} type="button" style={{ ...S.accuseCard, ...(accuseSid === s.id ? S.accuseCardOn : null) }}
                      onClick={() => { playSfx?.('click'); setAccuseSid(s.id); }}>
                      <span style={S.portraitSm}>{s.e}</span>
                      <span style={S.suspectName}>{L(s.name, isAr)}</span>
                    </button>
                  ))}
                </div>
                {accuseSid && (
                  <button type="button" style={{ ...S.primary, marginTop: 12 }} onClick={() => {
                    if (cfg.proofAccuse) { setAccuseStep('proof'); playSfx?.('click'); }
                    else confirmAccuse();
                  }}>
                    {cfg.proofAccuse ? t.next : t.confirmAccuse}
                  </button>
                )}
              </>
            )}
            {cfg.proofAccuse && accuseStep === 'proof' && (
              <>
                <h3 style={S.sheetTitle}>{t.accuseProof}</h3>
                <p style={S.accuseSub}>{t.accuseSubProof} ({needProof})</p>
                <div style={S.proofList}>
                  {allClues.map((id) => {
                    const cl = clueById[id];
                    if (!cl) return null;
                    const on = proofIds.includes(id);
                    return (
                      <button key={id} type="button" style={{ ...S.proofChip, ...(on ? S.proofChipOn : null) }} onClick={() => toggleProof(id)}>
                        {cl.e} {L(cl.name, isAr)}
                      </button>
                    );
                  })}
                </div>
                {proofIds.length >= needProof && (
                  <button type="button" style={{ ...S.primary, marginTop: 12 }} onClick={() => {
                    if (cfg.proofPreview) { setAccuseStep('preview'); playSfx?.('click'); }
                    else confirmAccuse();
                  }}>
                    {cfg.proofPreview ? t.next : t.confirmAccuse}
                  </button>
                )}
                <button type="button" style={{ ...S.ghostSm, marginTop: 8 }} onClick={() => setAccuseStep('who')}>{t.accuseWho}</button>
              </>
            )}
            {cfg.proofAccuse && accuseStep === 'preview' && (
              <>
                <h3 style={S.sheetTitle}>{t.proofPreviewStep}</h3>
                <ProofChainPreview
                  suspect={accuseSuspect}
                  proofIds={proofIds}
                  clueById={clueById}
                  isAr={isAr}
                  labels={t}
                />
                <button type="button" style={{ ...S.primary, marginTop: 12 }} onClick={confirmAccuse}>{t.confirmAccuse}</button>
                <button type="button" style={{ ...S.ghostSm, marginTop: 8 }} onClick={() => setAccuseStep('proof')}>{t.accuseProof}</button>
              </>
            )}
            <button type="button" style={{ ...S.ghostSm, marginTop: 8 }} onClick={() => setOverlay(null)}>{t.keepInvestigating}</button>
          </div>
        </div>
      )}

      {overlay?.t === 'pickSuspect' && (
        <div style={S.dim} onClick={() => setOverlay(null)}>
          <div style={S.sheetCard} onClick={(e) => e.stopPropagation()}>
            <h3 style={S.sheetTitle}>{t.pickSuspectForClue}</h3>
            <p style={S.accuseSub}>{L(clueById[overlay.clueId]?.name, isAr)}</p>
            <div style={S.accuseGrid}>
              {overlay.targets.map(({ person, question }) => (
                <button
                  key={person.id}
                  type="button"
                  style={S.accuseCard}
                  onClick={() => { setOverlay(null); startConfront(person, question); }}
                >
                  <span style={S.portraitSm}>{person.e}</span>
                  <span style={S.suspectName}>{L(person.name, isAr)}</span>
                </button>
              ))}
            </div>
            <button type="button" style={{ ...S.ghostSm, marginTop: 8 }} onClick={() => setOverlay(null)}>{t.close}</button>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  root: {
    position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column',
    background: 'var(--color-training-palette-surface, #fff7f2)', color: 'var(--color-training-ink, #2d2d2d)',
    fontFamily: "'Outfit', system-ui, sans-serif",
  },
  rootFile: { background: '#e8dcc8' },
  body: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    padding: '8px 16px calc(16px + env(safe-area-inset-bottom))', maxWidth: 480, width: '100%',
    margin: '0 auto', overflowY: 'auto',
  },
  investWrap: { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, maxWidth: 480, width: '100%', margin: '0 auto' },
  tabBar: { display: 'flex', gap: 4, padding: '8px 10px 0', flexShrink: 0, overflowX: 'auto' },
  tab: {
    flex: '1 0 auto', minWidth: 72, padding: '8px 4px', borderRadius: '12px 12px 0 0', border: '1.5px solid #e3d6c4',
    borderBottom: 'none', background: '#fffdf8', color: '#8a7a62', fontWeight: 800, fontSize: 11,
    cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
  },
  tabOn: { background: '#fbf3e4', color: '#2d2210', borderColor: '#d9c294' },
  tabCount: { fontSize: 9, fontWeight: 700, color: '#b9842f' },
  tabBody: { flex: 1, overflowY: 'auto', padding: '12px 14px', background: '#fbf3e4', border: '1.5px solid #e3d6c4', margin: '0 10px', borderRadius: '0 0 14px 14px' },
  tabBodyFile: { background: '#fffdf8', borderColor: '#1a1208', boxShadow: 'inset 0 0 0 1px rgba(26,18,8,0.06)' },
  viewToggle: { display: 'flex', gap: 6, marginBottom: 10 },
  viewBtn: {
    flex: 1, padding: '8px 10px', borderRadius: 10, border: '1.5px solid #d9c294',
    background: '#fffdf8', fontWeight: 800, fontSize: 12, color: '#7a6a52', cursor: 'pointer',
  },
  viewBtnOn: { background: '#fff1d8', borderColor: '#b9842f', color: '#2d2210' },
  polaroidGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 },
  transcriptHead: {
    fontWeight: 900, fontSize: 11, color: '#7a6a52', letterSpacing: 1, textTransform: 'uppercase',
    borderBottom: '2px solid #d9c294', paddingBottom: 6, marginBottom: 4,
  },
  transcriptBlock: { borderInlineStart: '3px solid #d9c294', paddingInlineStart: 8 },
  noteRowWrap: { display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 6 },
  sourceChip: {
    alignSelf: 'flex-start', fontWeight: 800, fontSize: 9, color: '#7a5a1e',
    background: '#fff1d8', border: '1px solid #e3c489', borderRadius: 999, padding: '2px 8px',
    textTransform: 'uppercase', letterSpacing: 0.4,
  },
  useClueBtn: {
    marginInlineStart: 12, padding: '8px 12px', borderRadius: 10, border: '1.5px solid #b9842f',
    background: '#fff1d8', color: '#7a5a1e', fontWeight: 800, fontSize: 12, cursor: 'pointer', textAlign: 'start',
  },
  accuseBtnLocked: { background: '#a49a88', borderColor: '#8a7a62', boxShadow: 'none', cursor: 'not-allowed', opacity: 0.85 },
  gateHint: { margin: '6px 0 0', fontWeight: 700, fontSize: 11.5, color: '#8a7a62', textAlign: 'center' },
  tabIntro: { margin: '0 0 6px', fontWeight: 600, fontSize: 13, color: '#6a5a42', lineHeight: 1.45 },
  progressLine: { margin: '0 0 10px', fontWeight: 800, fontSize: 11, color: '#a49a88', textTransform: 'uppercase', letterSpacing: 0.6 },
  cardList: { display: 'flex', flexDirection: 'column', gap: 8 },
  personBlock: { display: 'flex', flexDirection: 'column', gap: 4 },
  locCard: {
    display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 14px',
    borderRadius: 12, border: '1.5px solid #e3d6c4', background: '#fffdf8', cursor: 'pointer', textAlign: 'start', color: 'inherit', font: 'inherit',
  },
  locCardDone: { opacity: 0.85, borderColor: '#9ecfb2' },
  locNum: { flexShrink: 0, width: 22, height: 22, borderRadius: 11, background: '#b9842f', color: '#fff', fontWeight: 900, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  locIcon: { fontSize: 22, flexShrink: 0 },
  locText: { display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 },
  locName: { fontWeight: 900, fontSize: 14, color: '#2d2210' },
  locAction: { fontWeight: 700, fontSize: 11.5, color: '#b9842f' },
  reportCard: {
    display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 14px',
    borderRadius: 12, border: '1.5px solid #e3d6c4', background: '#fffdf8', cursor: 'pointer', textAlign: 'start', color: 'inherit', font: 'inherit',
  },
  reportCardDone: { borderColor: '#9ecfb2' },
  confrontBtn: {
    marginInlineStart: 12, padding: '8px 12px', borderRadius: 10, border: '1.5px solid #c0392b',
    background: '#fdf0ee', color: '#8b2e2e', fontWeight: 800, fontSize: 12, cursor: 'pointer', textAlign: 'start',
  },
  confrontDone: { marginInlineStart: 12, fontWeight: 700, fontSize: 11, color: '#2e8b57' },
  readMark: { flexShrink: 0, fontWeight: 800, fontSize: 10.5, color: '#b9842f' },
  tagChip: { alignSelf: 'flex-start', fontWeight: 800, fontSize: 9, color: '#7a6a52', textTransform: 'uppercase' },
  bottomBar: { padding: '10px 14px calc(12px + env(safe-area-inset-bottom))', flexShrink: 0 },
  accuseBtn: {
    width: '100%', padding: '14px 16px', borderRadius: 14, border: '2px solid #1a1208',
    background: '#c0392b', color: '#fff', fontWeight: 900, fontSize: 15, cursor: 'pointer', boxShadow: '3px 3px 0 #1a1208',
  },
  fileCard: {
    width: '100%', background: '#fbf3e4', border: '2px solid #d9c294', borderRadius: 16,
    padding: '14px 16px 18px', display: 'flex', flexDirection: 'column', gap: 8,
    boxShadow: '4px 4px 0 rgba(26,18,8,0.18)', animation: 'dt-slide 0.35s ease-out', color: '#2d2210',
  },
  stampRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  stamp: {
    display: 'inline-block', transform: 'rotate(-8deg)', border: '3px solid #c0392b', color: '#c0392b',
    fontFamily: "'Bangers','Cairo',cursive", fontSize: 15, letterSpacing: 1.5, padding: '2px 10px', borderRadius: 6,
  },
  tierBadge: { fontWeight: 900, fontSize: 11, color: '#7a5a1e', background: '#fff1d8', border: '1.5px solid #e3c489', borderRadius: 999, padding: '3px 10px' },
  caseTitle: { margin: 0, fontWeight: 900, fontSize: 'clamp(18px, 5vw, 22px)', color: '#2d2210', textAlign: 'center' },
  chipRow: { display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' },
  metaChip: { fontWeight: 800, fontSize: 12, color: '#7a5a1e', background: '#fff1d8', border: '1.5px solid #e3c489', borderRadius: 999, padding: '3px 12px' },
  setup: { margin: 0, fontWeight: 700, fontSize: 14.5, color: '#3a2c18', lineHeight: 1.55 },
  sectionHead: { width: '100%', fontSize: 11, fontWeight: 900, color: '#a35a48', textTransform: 'uppercase', letterSpacing: 0.7, marginTop: 4 },
  suspectGrid: { display: 'flex', flexDirection: 'column', gap: 7, width: '100%' },
  suspectCard: { display: 'flex', gap: 10, alignItems: 'center', background: '#fffdf8', border: '1.5px solid #e3d6c4', borderRadius: 12, padding: '10px 12px' },
  portrait: { width: 44, height: 44, borderRadius: 999, background: '#fffdf8', border: '2.5px solid #d8cab4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 },
  portraitSm: { width: 36, height: 36, borderRadius: 999, background: '#fffdf8', border: '2.5px solid #d8cab4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 },
  suspectMeta: { display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 },
  suspectName: { fontWeight: 900, fontSize: 13.5, color: '#2d2210' },
  suspectDesc: { fontWeight: 700, fontSize: 12, color: '#6a5a42', lineHeight: 1.4 },
  noteCardBtn: {
    display: 'flex', gap: 10, padding: '10px 12px', borderRadius: 12, border: '1.5px solid #e3d6c4',
    background: '#fffdf8', width: '100%', textAlign: 'start', cursor: 'pointer', color: 'inherit', font: 'inherit', marginBottom: 6,
  },
  noteIcon: { fontSize: 20, flexShrink: 0 },
  noteBody: { display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 },
  clueName: { fontWeight: 900, fontSize: 13, color: '#2d2210' },
  clueTxt: { fontWeight: 700, fontSize: 12, color: '#5a4a32', lineHeight: 1.45 },
  emptyNote: { fontWeight: 700, fontSize: 13.5, color: '#a49a88', textAlign: 'center', marginTop: 24 },
  dim: { position: 'absolute', inset: 0, background: 'rgba(26,18,8,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 9 },
  sheetCard: {
    width: '100%', maxWidth: 380, background: '#fffdf8', border: '2.5px solid #1a1208', borderRadius: 18,
    padding: '18px 18px 16px', display: 'flex', flexDirection: 'column', gap: 10, color: '#2d2210',
    boxShadow: '5px 5px 0 rgba(26,18,8,0.3)', maxHeight: '85vh', overflowY: 'auto',
  },
  sheetIcon: { fontSize: 36, textAlign: 'center' },
  sheetTitle: { margin: 0, fontWeight: 900, fontSize: 17, textAlign: 'center', color: '#2d2210' },
  sheetText: { margin: 0, fontWeight: 700, fontSize: 14.5, lineHeight: 1.55, color: '#3a2c18' },
  reportHead: { display: 'flex', gap: 12, alignItems: 'center' },
  reportRole: { margin: '2px 0 0', fontWeight: 700, fontSize: 12, color: '#6a5a42' },
  reportBody: { fontWeight: 700, fontSize: 14.5, lineHeight: 1.6, color: '#3a2c18', whiteSpace: 'pre-wrap' },
  reaction: { margin: 0, fontWeight: 700, fontSize: 13, color: '#6a5a42', fontStyle: 'italic' },
  accuseSub: { margin: 0, fontWeight: 700, fontSize: 13, color: '#6a5a42', textAlign: 'center' },
  accuseGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 8, width: '100%' },
  accuseCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '12px 8px', borderRadius: 13, border: '2px solid #d8cab4', background: '#fffdf8', cursor: 'pointer', font: 'inherit' },
  accuseCardOn: { borderColor: '#c0392b', background: '#fdf0ee' },
  proofList: { display: 'flex', flexDirection: 'column', gap: 6 },
  proofChip: {
    padding: '10px 12px', borderRadius: 10, border: '1.5px solid #d8cab4', background: '#fffdf8',
    fontWeight: 700, fontSize: 13, cursor: 'pointer', textAlign: 'start',
  },
  proofChipOn: { borderColor: '#2e8b57', background: '#eef8f0' },
  verdictCard: { width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginTop: 8 },
  closedStamp: { transform: 'rotate(-8deg)', border: '3px solid #2e8b57', color: '#2e8b57', fontFamily: "'Bangers','Cairo',cursive", fontSize: 16, padding: '2px 12px', borderRadius: 6 },
  verdictTitle: { fontWeight: 900, fontSize: 22, textAlign: 'center' },
  partialSub: { margin: 0, fontWeight: 700, fontSize: 14, color: '#6a5a42', textAlign: 'center' },
  truth: { display: 'flex', gap: 10, alignItems: 'center', fontWeight: 900, fontSize: 15, color: '#2d2210' },
  explain: { width: '100%', background: '#fffdf8', border: '2px solid #e3d6c4', borderRadius: 14, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 },
  explainHead: { fontWeight: 900, fontSize: 12, color: '#7a6a52', textTransform: 'uppercase' },
  solStep: { display: 'flex', gap: 9, alignItems: 'flex-start' },
  solNum: { flexShrink: 0, width: 20, height: 20, borderRadius: 10, background: '#b9842f', color: '#fff', fontWeight: 900, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  solTxt: { fontWeight: 700, fontSize: 13.5, color: '#3a3a3a', lineHeight: 1.45 },
  epilogueCard: { width: '100%', background: '#fbf3e4', border: '2px solid #d9c294', borderRadius: 14, padding: '12px 15px' },
  epilogueText: { margin: 0, fontWeight: 700, fontSize: 14.5, color: '#3a2c18', lineHeight: 1.55 },
  primary: { padding: '12px 26px', borderRadius: 14, border: '2px solid #1a1208', background: '#2e8b57', color: '#fff', fontWeight: 900, fontSize: 15, cursor: 'pointer', boxShadow: '3px 3px 0 #1a1208' },
  ghostSm: { padding: '9px 14px', borderRadius: 12, border: '2px solid #cdbfa6', background: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer', color: '#4a3c28' },
};
