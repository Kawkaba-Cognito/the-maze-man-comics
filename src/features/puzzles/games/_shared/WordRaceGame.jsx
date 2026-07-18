import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useApp } from '../../../../context/AppContext';
import { PACKS, fmt, packById, randomPack } from './groupTheme';
import GroupShell, { GroupHow, GroupPackChips } from './GroupShell';
import GroupHandoff from './GroupHandoff';
import GroupPlayerSetup, { useGroupPlayers } from './GroupPlayerSetup';
import { createDrawer } from './drawWithoutRepeat';

const drawer = createDrawer('mm_group_wordrace_words_v1', { maxRecent: 600 });

/*
 * WordRaceGame — Charades / Describe It timed party engine.
 * Props: { onBack, accent, emoji, title:{en,ar}, rule:{en,ar}, ready:{en,ar} }
 */
export default function WordRaceGame({ onBack, accent, emoji, title, rule, ready }) {
  const { currentLang, playSfx } = useApp();
  const isAr = currentLang === 'ar';

  const [phase, setPhase] = useState('setup');
  const [players, setPlayers, commitPlayers] = useGroupPlayers(2, 10);
  const [packId, setPackId] = useState('random');
  const [roundSecs, setRoundSecs] = useState(90);
  const [actorIdx, setActorIdx] = useState(0);
  const [names, setNames] = useState(players);
  const [word, setWord] = useState('');
  const [wordAccent, setWordAccent] = useState(accent);
  const [categoryLabel, setCategoryLabel] = useState('');
  const [timeLeft, setTimeLeft] = useState(90);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const queueRef = useRef([]);
  const packRef = useRef(null);

  const T = useMemo(() => ({
    title: isAr ? title.ar : title.en,
    rule: isAr ? rule.ar : rule.en,
    ready: isAr ? ready.ar : ready.en,
    packL: isAr ? 'الفئة' : 'Category',
    timeL: isAr ? 'مدة الجولة' : 'Round time',
    random: isAr ? 'عشوائي' : 'Random',
    start: isAr ? 'ابدأ' : 'Start',
    round: isAr ? 'جولة' : 'Round',
    startRound: isAr ? 'ابدأ الجولة' : 'Start round',
    got: isAr ? 'صحيح' : 'Got it',
    skip: isAr ? 'تخطَّ' : 'Skip',
    timeUp: isAr ? 'انتهى الوقت!' : "Time's up!",
    scored: isAr ? 'أصبتم' : 'You got',
    thisRound: isAr ? 'هذه الجولة' : 'this round',
    totalL: isAr ? 'المجموع' : 'Total',
    next: isAr ? 'اللاعب التالي' : 'Next player',
    newGame: isAr ? 'إعدادات جديدة' : 'New setup',
    menu: isAr ? 'القائمة' : 'Menu',
    tip: isAr ? 'كلمة صحيحة = نقطة · تخطَّ متى شئت' : 'Right word = a point · skip any time',
    howTitle: isAr ? 'كيف تلعب' : 'How to play',
    actor: isAr ? 'الدور الآن' : 'Up next',
  }), [isAr, title, rule, ready]);

  const refill = useCallback(() => {
    const pack = packRef.current;
    if (!pack) return;
    const items = pack.words.map((w) => ({ id: `${pack.id}:${w.en}`, ...w }));
    queueRef.current = drawer.makeQueue(items, (it) => it.id);
  }, []);

  const nextWord = useCallback(() => {
    if (!queueRef.current.length) refill();
    const item = queueRef.current.shift();
    if (!item) return;
    drawer.mark(item.id);
    setWord(isAr ? item.ar : item.en);
    setWordAccent(packRef.current?.accent || accent);
    setCategoryLabel(isAr ? packRef.current?.ar : packRef.current?.en);
  }, [isAr, refill, accent]);

  const startRound = useCallback(() => {
    playSfx?.('click');
    packRef.current = packId === 'random' ? randomPack() : packById(packId) || randomPack();
    refill();
    setCorrect(0);
    setTimeLeft(roundSecs);
    nextWord();
    setPhase('play');
  }, [packId, roundSecs, playSfx, refill, nextWord]);

  useEffect(() => {
    if (phase !== 'play') return undefined;
    if (timeLeft <= 0) {
      setTotal((v) => v + correct);
      setPhase('summary');
      playSfx?.('error');
      return undefined;
    }
    const id = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, timeLeft, correct, playSfx]);

  const got = useCallback(() => { playSfx?.('win'); setCorrect((v) => v + 1); nextWord(); }, [playSfx, nextWord]);
  const skip = useCallback(() => { playSfx?.('click'); nextWord(); }, [playSfx, nextWord]);

  const pct = Math.max(0, timeLeft / roundSecs);
  const actorName = names[actorIdx % names.length] || `Player ${actorIdx + 1}`;

  return (
    <GroupShell
      isAr={isAr}
      title={T.title}
      accent={accent}
      onBack={() => { playSfx?.('click'); onBack?.(); }}
      menuLabel={T.menu}
      center={phase !== 'setup'}
      chip={phase === 'play' || phase === 'summary' ? `✓ ${total + (phase === 'play' ? 0 : 0)}` : null}
    >
      {phase === 'setup' && (
        <>
          <div className="gc-hero">{emoji}</div>
          <div className="gc-tagline">{T.rule}</div>

          <GroupPlayerSetup
            isAr={isAr}
            playSfx={playSfx}
            players={players}
            onPlayersChange={setPlayers}
            min={2}
            max={10}
          />

          <div className="gc-section">
            <div className="gc-label">{T.packL}</div>
            <GroupPackChips
              packs={PACKS}
              packId={packId}
              onPick={setPackId}
              isAr={isAr}
              randomLabel={T.random}
              playSfx={playSfx}
            />
          </div>

          <div className="gc-section">
            <div className="gc-label">{T.timeL}</div>
            <div className="gc-times">
              {[60, 90, 120].map((s) => (
                <button key={s} type="button" className={`gc-time${roundSecs === s ? ' on' : ''}`}
                  onClick={() => { playSfx?.('click'); setRoundSecs(s); }}>{s}s</button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="gc-btn"
            onClick={() => {
              playSfx?.('click');
              const list = commitPlayers(players);
              setNames(list);
              setActorIdx(0);
              setTotal(0);
              setPhase('ready');
            }}
          >
            {T.start}
          </button>
          <div className="gc-tip">{T.tip}</div>
          <GroupHow title={T.howTitle} text={T.rule} />
        </>
      )}

      {phase === 'ready' && (
        <GroupHandoff
          isAr={isAr}
          name={actorName}
          kicker={`${T.round} ${actorIdx + 1} · ${T.actor}`}
          emoji={emoji}
          body={T.ready}
          sub={T.rule}
          cta={`${T.startRound} ›`}
          onReady={startRound}
          playSfx={playSfx}
        />
      )}

      {phase === 'play' && (
        <>
          <div style={{ width: '100%', maxWidth: 340, height: 8, borderRadius: 999, background: '#ece0cc', overflow: 'hidden' }}>
            <div style={{ width: `${pct * 100}%`, height: '100%', background: pct < 0.2 ? '#cf5b50' : accent, transition: 'width 1s linear' }} />
          </div>
          <div style={{ width: '100%', maxWidth: 340, display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: '#8a7f6f' }}>
            <span>⏱ {fmt(timeLeft)}</span>
            <span style={{ color: wordAccent }}>{categoryLabel}</span>
            <span>✓ {correct}</span>
          </div>
          <div className="gc-word" style={{ color: '#2d2210' }}>{word}</div>
          <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 340 }}>
            <button type="button" className="gc-btn gc-btn--ghost" style={{ flex: 1 }} onClick={skip}>↷ {T.skip}</button>
            <button type="button" className="gc-btn gc-btn--ok" style={{ flex: 2 }} onClick={got}>✓ {T.got}</button>
          </div>
        </>
      )}

      {phase === 'summary' && (
        <>
          <div className="gc-handoff-kicker" style={{ color: '#cf5b50' }}>{T.timeUp}</div>
          <div style={{ fontSize: '4rem', fontWeight: 800, lineHeight: 1 }}>{correct}</div>
          <div style={{ color: '#8a7f6f', fontWeight: 600 }}>{T.scored} {correct} {T.thisRound}</div>
          <div className="gc-tip">{T.totalL}: {total}</div>
          <div className="gc-btn-col">
            <button
              type="button"
              className="gc-btn"
              onClick={() => {
                playSfx?.('click');
                setActorIdx((i) => i + 1);
                setPhase('ready');
              }}
            >
              {T.next}
            </button>
            <button type="button" className="gc-btn gc-btn--ghost" onClick={() => { playSfx?.('click'); setPhase('setup'); }}>{T.newGame}</button>
          </div>
        </>
      )}
    </GroupShell>
  );
}
