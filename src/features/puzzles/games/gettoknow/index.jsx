import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '../../../../context/AppContext';
import GroupShell, { GroupHow, GroupPackChips } from '../_shared/GroupShell';
import GroupHandoff from '../_shared/GroupHandoff';
import GroupPlayerSetup, { useGroupPlayers } from '../_shared/GroupPlayerSetup';
import { createDrawer } from '../_shared/drawWithoutRepeat';
import { DECKS, deckById } from './data';

const ACCENT = '#d46a8a';
const drawers = Object.fromEntries(
  DECKS.map((d) => [d.id, createDrawer(`mm_group_gtk_${d.id}_v1`, { maxRecent: 400 })]),
);

export default function GetToKnowGame({ onBack }) {
  const { currentLang, playSfx } = useApp();
  const isAr = currentLang === 'ar';

  const [phase, setPhase] = useState('setup'); // setup | handoff | card | summary
  const [deckId, setDeckId] = useState('duo');
  const [players, setPlayers, commitPlayers] = useGroupPlayers(2, 12);
  const [names, setNames] = useState(players);
  const [speakerIdx, setSpeakerIdx] = useState(0);
  const [question, setQuestion] = useState(null);
  const [asked, setAsked] = useState(0);
  const [answered, setAnswered] = useState(0);

  const deck = deckById(deckId) || DECKS[0];
  const accent = deck.accent || ACCENT;

  const t = useMemo(() => ({
    title: isAr ? 'تعارف' : 'Get to Know',
    tagline: isAr
      ? 'أسئلة للتعارف — للأزواج والأصدقاء والمجموعات.'
      : 'Conversation prompts for couples, friends, and groups.',
    deckL: isAr ? 'الفئة' : 'Category',
    start: isAr ? 'ابدأ' : 'Start',
    next: isAr ? 'التالي' : 'Next',
    skip: isAr ? 'تخطَّ' : 'Skip',
    answeredBtn: isAr ? 'أُجيبت ✓' : 'Answered ✓',
    end: isAr ? 'إنهاء الجلسة' : 'End session',
    again: isAr ? 'جلسة جديدة' : 'New session',
    menu: isAr ? 'القائمة' : 'Menu',
    howTitle: isAr ? 'كيف تلعب' : 'How to play',
    how: isAr
      ? 'اختاروا فئة، أضيفوا الأسماء، ثم مرّروا الهاتف. يقرأ كل شخص السؤال ويجيب بصوت عالٍ — لا نقاط، فقط تعارف.'
      : 'Pick a deck, add names, then pass the phone. Each person reads the prompt and answers out loud — no scoring, just connection.',
    speaker: isAr ? 'دَوْرك للإجابة' : 'Your turn to answer',
    askedL: isAr ? 'أسئلة الليلة' : 'Asked tonight',
    answeredL: isAr ? 'أُجيب عنها' : 'Answered',
    summary: isAr ? 'انتهت الجلسة' : 'Session wrapped',
    needPlayers: isAr ? 'أضيفوا لاعبين أكثر لهذه الفئة' : 'Add more players for this deck',
  }), [isAr]);

  const clampPlayersForDeck = useCallback((list, d) => {
    let next = [...list];
    const min = d.minPlayers || 2;
    const max = d.maxPlayers || 12;
    while (next.length < min) next.push(`Player ${next.length + 1}`);
    return next.slice(0, max);
  }, []);

  useEffect(() => {
    setPlayers((prev) => clampPlayersForDeck(prev, deck));
  }, [deckId, deck, clampPlayersForDeck, setPlayers]);

  const drawQuestion = useCallback((id = deckId) => {
    const d = deckById(id) || DECKS[0];
    const drawer = drawers[d.id];
    const items = d.questions.map((q) => ({ ...q, id: q.id }));
    const picked = drawer.draw(items, (q) => q.id);
    setQuestion(picked);
    if (picked) setAsked((n) => n + 1);
  }, [deckId]);

  const speakerName = names[speakerIdx % Math.max(names.length, 1)] || 'Player 1';

  const beginSession = () => {
    playSfx?.('click');
    const d = deckById(deckId) || DECKS[0];
    let list = commitPlayers(players);
    list = clampPlayersForDeck(list, d);
    setPlayers(list);
    setNames(list);
    setSpeakerIdx(0);
    setAsked(0);
    setAnswered(0);
    setPhase('handoff');
  };

  const showCard = () => {
    drawQuestion();
    setPhase('card');
    playSfx?.('click');
  };

  const advance = (didAnswer) => {
    playSfx?.('click');
    if (didAnswer) setAnswered((n) => n + 1);
    setSpeakerIdx((i) => i + 1);
    setPhase('handoff');
  };

  const deckChips = DECKS.map((d) => ({
    id: d.id,
    en: d.en,
    ar: d.ar,
    icon: d.icon,
    accent: d.accent,
  }));

  const minP = deck.minPlayers || 2;
  const maxP = deck.maxPlayers || 12;
  const playersOk = players.length >= minP;

  return (
    <GroupShell
      isAr={isAr}
      title={t.title}
      accent={accent}
      onBack={() => { playSfx?.('click'); onBack?.(); }}
      menuLabel={t.menu}
      center={phase !== 'setup'}
      chip={phase === 'card' || phase === 'summary' ? `${asked}` : null}
    >
      {phase === 'setup' && (
        <>
          <div className="gc-hero">💬</div>
          <div className="gc-tagline">{t.tagline}</div>

          <div className="gc-section">
            <div className="gc-label">{t.deckL}</div>
            <GroupPackChips
              packs={deckChips}
              packId={deckId}
              onPick={(id) => {
                setDeckId(id);
                const d = deckById(id);
                if (d) setPlayers((prev) => clampPlayersForDeck(prev, d));
              }}
              isAr={isAr}
              randomLabel=""
              playSfx={playSfx}
              showRandom={false}
            />
          </div>

          <GroupPlayerSetup
            isAr={isAr}
            playSfx={playSfx}
            players={players}
            onPlayersChange={setPlayers}
            min={minP}
            max={maxP}
          />

          {!playersOk && <div className="gc-tip">{t.needPlayers}</div>}

          <button type="button" className="gc-btn" disabled={!playersOk} onClick={beginSession} style={{ opacity: playersOk ? 1 : 0.5 }}>
            {t.start}
          </button>
          <GroupHow title={t.howTitle} text={t.how} />
        </>
      )}

      {phase === 'handoff' && (
        <GroupHandoff
          isAr={isAr}
          name={speakerName}
          kicker={t.speaker}
          emoji={deck.icon}
          body={isAr ? deck.ar : deck.en}
          cta={isAr ? 'اعرض السؤال ›' : 'Show question ›'}
          onReady={showCard}
          playSfx={playSfx}
        />
      )}

      {phase === 'card' && question && (
        <>
          <div className="gc-deck-bar" style={{ background: accent }} />
          <div className="gc-progress">{speakerName} · {isAr ? deck.ar : deck.en}</div>
          <div className="gc-card" style={{ width: '100%', maxWidth: 400, borderColor: accent }}>
            <div className="gc-question">{isAr ? question.ar : question.en}</div>
          </div>
          <div className="gc-btn-col">
            <button type="button" className="gc-btn" onClick={() => advance(true)}>{t.answeredBtn}</button>
            <button type="button" className="gc-btn gc-btn--ghost" onClick={() => advance(false)}>{t.skip}</button>
            <button type="button" className="gc-btn gc-btn--ghost" onClick={() => { playSfx?.('click'); setPhase('summary'); }}>{t.end}</button>
          </div>
        </>
      )}

      {phase === 'summary' && (
        <>
          <div className="gc-hero">{deck.icon}</div>
          <div className="gc-handoff-name" style={{ fontSize: '2rem' }}>{t.summary}</div>
          <div className="gc-card" style={{ width: '100%', maxWidth: 320, textAlign: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{t.askedL}: {asked}</div>
            <div style={{ fontWeight: 700, color: '#8a7f6f', marginTop: 6 }}>{t.answeredL}: {answered}</div>
          </div>
          <div className="gc-btn-col">
            <button type="button" className="gc-btn" onClick={() => { playSfx?.('click'); setPhase('setup'); }}>{t.again}</button>
            <button type="button" className="gc-btn gc-btn--ghost" onClick={() => { playSfx?.('click'); onBack?.(); }}>{t.menu}</button>
          </div>
        </>
      )}
    </GroupShell>
  );
}
