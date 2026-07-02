import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useApp } from '../../../../context/AppContext';
import { INK, SUB, FAINT, LINE, CARD, GOLD, SERIF, SANS, PACKS, rnd, fmt, shuffle } from './groupTheme';

/*
 * WordRaceGame — shared engine for the timed "one player, everyone guesses" party
 * games (Charades = act it out, Describe It = say clues). One player sees the word
 * and gets the team to guess it before the timer; tap ✓ for a point or Skip.
 *
 * Props: { onBack, accent, emoji, title:{en,ar}, rule:{en,ar}, ready:{en,ar} }
 */
export default function WordRaceGame({ onBack, accent, emoji, title, rule, ready }) {
  const { currentLang, playSfx } = useApp();
  const isAr = currentLang === 'ar';

  const [phase, setPhase] = useState('setup');   // setup | ready | play | summary
  const [packId, setPackId] = useState('random');
  const [roundSecs, setRoundSecs] = useState(90);
  const [actor, setActor] = useState(1);
  const [word, setWord] = useState('');
  const [timeLeft, setTimeLeft] = useState(90);
  const [correct, setCorrect] = useState(0);
  const [skipped, setSkipped] = useState(0);
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
    player: isAr ? 'اللاعب' : 'Player',
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
  }), [isAr, title, rule, ready]);

  const refill = useCallback(() => { queueRef.current = shuffle(packRef.current.words); }, []);
  const nextWord = useCallback(() => {
    if (!queueRef.current.length) refill();
    const w = queueRef.current.pop();
    setWord(isAr ? w.ar : w.en);
  }, [isAr, refill]);

  const startRound = useCallback(() => {
    playSfx?.('click');
    packRef.current = packId === 'random' ? PACKS[rnd(PACKS.length)] : PACKS.find((p) => p.id === packId);
    refill();
    setCorrect(0); setSkipped(0); setTimeLeft(roundSecs);
    nextWord();
    setPhase('play');
  }, [packId, roundSecs, playSfx, refill, nextWord]);

  // round countdown
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
  const skip = useCallback(() => { playSfx?.('click'); setSkipped((v) => v + 1); nextWord(); }, [playSfx, nextWord]);

  const pct = Math.max(0, timeLeft / roundSecs);

  return (
    <div className="wr-root" dir={isAr ? 'rtl' : 'ltr'}>
      <style>{CSS}</style>
      <div className="wr-app" style={{ '--acc': accent }}>
        <div className="wr-head">
          <button className="wr-back" onClick={() => { playSfx?.('click'); onBack?.(); }} aria-label={T.menu}>‹</button>
          <div className="wr-title serif">{T.title}</div>
          <div style={{ width: 36 }} />
        </div>

        {/* SETUP */}
        {phase === 'setup' && (
          <div className="wr-body">
            <div className="wr-hero">{emoji}</div>
            <div className="wr-rule">{T.rule}</div>

            <div className="wr-field">
              <div className="wr-label">{T.packL}</div>
              <div className="wr-packs">
                <button className={`wr-pack${packId === 'random' ? ' on' : ''}`} onClick={() => { playSfx?.('click'); setPackId('random'); }}>🎲 {T.random}</button>
                {PACKS.map((p) => (
                  <button key={p.id} className={`wr-pack${packId === p.id ? ' on' : ''}`} onClick={() => { playSfx?.('click'); setPackId(p.id); }}>{p.icon} {isAr ? p.ar : p.en}</button>
                ))}
              </div>
            </div>

            <div className="wr-field">
              <div className="wr-label">{T.timeL}</div>
              <div className="wr-times">
                {[60, 90, 120].map((s) => (
                  <button key={s} className={`wr-time${roundSecs === s ? ' on' : ''}`} onClick={() => { playSfx?.('click'); setRoundSecs(s); }}>{s}s</button>
                ))}
              </div>
            </div>

            <button className="wr-primary" onClick={() => { playSfx?.('click'); setActor(1); setTotal(0); setPhase('ready'); }}>{T.start}</button>
            <div className="wr-tip">{T.tip}</div>
          </div>
        )}

        {/* READY (pass the phone) */}
        {phase === 'ready' && (
          <div className="wr-body wr-center">
            <div className="wr-round-tag">{T.round} {actor}</div>
            <div className="wr-pass-name serif">{T.player} {actor}</div>
            <div className="wr-ready-card">
              <div className="wr-ready-emoji">{emoji}</div>
              <div className="wr-ready-rule">{T.ready}</div>
              <div className="wr-ready-rule2">{T.rule}</div>
            </div>
            <button className="wr-primary" onClick={startRound}>{T.startRound} ›</button>
          </div>
        )}

        {/* PLAY */}
        {phase === 'play' && (
          <div className="wr-body wr-center">
            <div className="wr-timebar"><div className="wr-timefill" style={{ width: `${pct * 100}%`, background: pct < 0.2 ? '#cf5b50' : accent }} /></div>
            <div className="wr-hud"><span>⏱ {fmt(timeLeft)}</span><span>✓ {correct}</span></div>
            <div className="wr-word serif">{word}</div>
            <div className="wr-actions">
              <button className="wr-skip" onClick={skip}>↷ {T.skip}</button>
              <button className="wr-got" onClick={got}>✓ {T.got}</button>
            </div>
          </div>
        )}

        {/* SUMMARY */}
        {phase === 'summary' && (
          <div className="wr-body wr-center">
            <div className="wr-timeup">{T.timeUp}</div>
            <div className="wr-score-big">{correct}</div>
            <div className="wr-score-sub">{T.scored} {correct} {T.thisRound}</div>
            <div className="wr-total">{T.totalL}: {total}</div>
            <div className="wr-result-btns">
              <button className="wr-primary" onClick={() => { playSfx?.('click'); setActor((n) => n + 1); setPhase('ready'); }}>{T.next}</button>
              <button className="wr-ghost" onClick={() => { playSfx?.('click'); setPhase('setup'); }}>{T.newGame}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const CSS = `
.wr-root { position:absolute; inset:0; overflow-y:auto; -webkit-overflow-scrolling:touch; background:var(--color-training-palette-surface,#fff7f2); color:${INK}; font-family:${SANS}; }
.wr-root *, .wr-root *::before, .wr-root *::after { box-sizing:border-box; }
.wr-app { max-width:480px; margin:0 auto; min-height:100%; display:flex; flex-direction:column; padding-bottom:40px; }
.wr-head { display:flex; align-items:center; justify-content:space-between; padding:calc(14px + env(safe-area-inset-top)) 14px 10px; }
.wr-back { width:36px; height:36px; border-radius:10px; border:2px solid ${LINE}; background:${CARD}; color:#141210; font-size:22px; line-height:1; cursor:pointer; }
.wr-title { font-family:${SERIF}; font-size:26px; font-weight:600; color:${INK}; }
.serif { font-family:${SERIF}; font-weight:600; }
.wr-body { flex:1; padding:8px 22px; display:flex; flex-direction:column; gap:18px; }
.wr-center { align-items:center; text-align:center; justify-content:center; }
.wr-hero { font-size:64px; text-align:center; }
.wr-rule { text-align:center; color:${SUB}; font-size:15px; font-weight:700; margin-top:-6px; }
.wr-field { display:flex; flex-direction:column; gap:10px; }
.wr-label { font-size:11px; letter-spacing:2px; text-transform:uppercase; color:${SUB}; font-weight:800; }
.wr-packs { display:flex; flex-wrap:wrap; gap:8px; }
.wr-pack { padding:9px 14px; border-radius:999px; border:2px solid ${LINE}; background:${CARD}; color:${SUB}; font-size:13.5px; font-weight:700; cursor:pointer; font-family:inherit; }
.wr-pack.on { border-color:var(--acc); background:#fff5ee; color:#8a5a30; }
.wr-times { display:flex; gap:8px; }
.wr-time { flex:1; padding:12px; border-radius:12px; border:2px solid ${LINE}; background:${CARD}; color:${SUB}; font-size:15px; font-weight:800; cursor:pointer; font-family:inherit; }
.wr-time.on { border-color:var(--acc); background:#fff5ee; color:${INK}; }
.wr-primary { width:100%; padding:15px; border-radius:14px; border:none; background:var(--acc); color:#fff; font-size:16px; font-weight:800; cursor:pointer; font-family:inherit; box-shadow:3px 3px 0 rgba(26,18,8,0.14); }
.wr-ghost { width:100%; padding:13px; border-radius:14px; border:2px solid ${LINE}; background:${CARD}; color:${SUB}; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; }
.wr-tip { text-align:center; font-size:12px; color:${FAINT}; }
.wr-round-tag { font-size:12px; letter-spacing:2px; text-transform:uppercase; color:${SUB}; font-weight:800; }
.wr-pass-name { font-family:${SERIF}; font-size:34px; font-weight:600; color:${INK}; margin-top:-6px; }
.wr-ready-card { width:100%; max-width:320px; background:${CARD}; border:2px solid ${LINE}; border-radius:20px; padding:26px; display:flex; flex-direction:column; align-items:center; gap:10px; box-shadow:4px 4px 0 rgba(26,18,8,0.08); }
.wr-ready-emoji { font-size:46px; }
.wr-ready-rule { font-size:15px; color:#6a5a40; line-height:1.5; }
.wr-ready-rule2 { font-size:16px; font-weight:800; color:var(--acc); }
.wr-timebar { width:100%; max-width:340px; height:8px; border-radius:999px; background:#ece0cc; overflow:hidden; }
.wr-timefill { height:100%; border-radius:999px; transition:width 1s linear; }
.wr-hud { width:100%; max-width:340px; display:flex; justify-content:space-between; font-size:16px; font-weight:800; color:${SUB}; font-variant-numeric:tabular-nums; }
.wr-word { font-family:${SERIF}; font-size:clamp(40px, 13vw, 64px); font-weight:700; color:${INK}; line-height:1.1; padding:20px 0; }
.wr-actions { display:flex; gap:12px; width:100%; max-width:340px; }
.wr-skip { flex:1; padding:20px; border-radius:16px; border:2px solid ${LINE}; background:${CARD}; color:${SUB}; font-size:17px; font-weight:800; cursor:pointer; font-family:inherit; }
.wr-got { flex:2; padding:20px; border-radius:16px; border:none; background:#3a9d5d; color:#fff; font-size:19px; font-weight:800; cursor:pointer; font-family:inherit; box-shadow:3px 3px 0 rgba(26,18,8,0.14); }
.wr-timeup { font-size:15px; letter-spacing:2px; text-transform:uppercase; color:#cf5b50; font-weight:800; }
.wr-score-big { font-size:72px; font-weight:800; color:${INK}; line-height:1; }
.wr-score-sub { font-size:15px; color:${SUB}; }
.wr-total { font-size:14px; color:${FAINT}; font-weight:700; }
.wr-result-btns { display:flex; flex-direction:column; gap:10px; width:100%; max-width:320px; margin-top:14px; }
`;
