import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../../../../context/AppContext';
import { INK, SUB, FAINT, LINE, CARD, GOLD, SERIF, SANS, PACKS, rnd, fmt } from '../_shared/groupTheme';

/*
 * Imposter — pass-and-play social deduction (Group Challenge).  [puzzles]
 *
 * Everyone secretly gets the same SECRET WORD — except one random player, the
 * IMPOSTER, who only learns the category. Pass the phone around so each player
 * reveals their card privately, then discuss, vote, and reveal. No accounts, no
 * network — one device, 3–10 players.
 */

const ACCENT = '#d46a6a';

export default function ImposterGame({ onBack }) {
  const { currentLang, playSfx } = useApp();
  const isAr = currentLang === 'ar';

  const [phase, setPhase] = useState('setup');   // setup | reveal | discuss | result
  const [players, setPlayers] = useState(4);
  const [packId, setPackId] = useState('random');
  const [round, setRound] = useState(null);       // { word, category, imposter }
  const [revealIdx, setRevealIdx] = useState(0);
  const [shown, setShown] = useState(false);
  const [secs, setSecs] = useState(120);
  const [timerOn, setTimerOn] = useState(false);
  const [starter, setStarter] = useState(0);

  const t = useMemo(() => ({
    title: isAr ? 'الدخيل' : 'Imposter',
    tagline: isAr ? 'الجميع يعرف الكلمة… إلا واحد.' : 'Everyone knows the word… except one.',
    playersL: isAr ? 'عدد اللاعبين' : 'Players',
    packL: isAr ? 'الفئة' : 'Category',
    random: isAr ? 'عشوائي' : 'Random',
    start: isAr ? 'ابدأ الجولة' : 'Start round',
    passTo: isAr ? 'مرّر الهاتف إلى' : 'Pass the phone to',
    player: isAr ? 'اللاعب' : 'Player',
    tapReveal: isAr ? 'اضغط لرؤية دورك' : 'Tap to see your role',
    youAreImp: isAr ? 'أنت الدخيل!' : "You're the Imposter!",
    impHint: isAr ? 'لا تعرف الكلمة. الفئة:' : "You don't know the word. Category:",
    impBlend: isAr ? 'اندمج ولا تنكشف.' : "Blend in — don't get caught.",
    yourWord: isAr ? 'كلمتك السرية' : 'Your secret word',
    hidePass: isAr ? 'أخفِ ومرّر' : 'Hide & pass',
    allSeen: isAr ? 'رأى الجميع بطاقاتهم' : 'Everyone has seen their card',
    discuss: isAr ? 'ناقشوا وصوّتوا' : 'Discuss & vote',
    startsFirst: isAr ? 'يبدأ الكلام' : 'Speaks first',
    reveal: isAr ? 'اكشف الدخيل' : 'Reveal the imposter',
    timer: isAr ? 'مؤقّت النقاش' : 'Discussion timer',
    theImp: isAr ? 'الدخيل كان' : 'The imposter was',
    theWord: isAr ? 'الكلمة كانت' : 'The word was',
    newRound: isAr ? 'جولة جديدة' : 'New round',
    newGame: isAr ? 'إعدادات جديدة' : 'New setup',
    menu: isAr ? 'القائمة' : 'Menu',
    howTitle: isAr ? 'كيف تلعب' : 'How to play',
    how: isAr
      ? 'يحصل كل لاعب على نفس الكلمة عدا الدخيل الذي يعرف الفئة فقط. مرّروا الهاتف ليرى كلٌّ بطاقته سراً، ثم صِفوا الكلمة بكلمة واحدة بالتناوب — الدخيل يحاول التخفّي. صوّتوا على المشتبه به ثم اكشفوا.'
      : 'Each player gets the same word except the imposter, who only sees the category. Pass the phone so everyone reads their card in secret, then take turns describing the word in one word — the imposter tries to blend in. Vote on a suspect, then reveal.',
  }), [isAr]);

  const startRound = useCallback(() => {
    const pack = packId === 'random' ? PACKS[rnd(PACKS.length)] : PACKS.find((p) => p.id === packId);
    const w = pack.words[rnd(pack.words.length)];
    setRound({ word: isAr ? w.ar : w.en, category: isAr ? pack.ar : pack.en, imposter: rnd(players) });
    setRevealIdx(0); setShown(false);
    setStarter(rnd(players));
    setSecs(120); setTimerOn(false);
    setPhase('reveal');
    playSfx?.('click');
  }, [packId, players, isAr, playSfx]);

  const nextReveal = useCallback(() => {
    playSfx?.('click');
    if (revealIdx + 1 >= players) { setPhase('discuss'); return; }
    setRevealIdx((i) => i + 1); setShown(false);
  }, [revealIdx, players, playSfx]);

  useEffect(() => {
    if (!timerOn) return undefined;
    if (secs <= 0) { setTimerOn(false); playSfx?.('collect'); return undefined; }
    const id = setTimeout(() => setSecs((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [timerOn, secs, playSfx]);

  return (
    <div className="imp-root" dir={isAr ? 'rtl' : 'ltr'}>
      <style>{CSS}</style>
      <div className="imp-app">
        <div className="imp-head">
          <button className="imp-back" onClick={() => { playSfx?.('click'); onBack?.(); }} aria-label={t.menu}>‹</button>
          <div className="imp-title serif">{t.title}</div>
          <div style={{ width: 36 }} />
        </div>

        {/* ── SETUP ── */}
        {phase === 'setup' && (
          <div className="imp-body">
            <div className="imp-hero">🕵️</div>
            <div className="imp-tagline">{t.tagline}</div>

            <div className="imp-field">
              <div className="imp-label">{t.playersL}</div>
              <div className="imp-stepper">
                <button className="imp-step-btn" onClick={() => { playSfx?.('click'); setPlayers((n) => Math.max(3, n - 1)); }} aria-label="−">−</button>
                <span className="imp-step-val">{players}</span>
                <button className="imp-step-btn" onClick={() => { playSfx?.('click'); setPlayers((n) => Math.min(10, n + 1)); }} aria-label="+">+</button>
              </div>
            </div>

            <div className="imp-field">
              <div className="imp-label">{t.packL}</div>
              <div className="imp-packs">
                <button className={`imp-pack${packId === 'random' ? ' on' : ''}`} onClick={() => { playSfx?.('click'); setPackId('random'); }}>🎲 {t.random}</button>
                {PACKS.map((p) => (
                  <button key={p.id} className={`imp-pack${packId === p.id ? ' on' : ''}`} onClick={() => { playSfx?.('click'); setPackId(p.id); }}>
                    {p.icon} {isAr ? p.ar : p.en}
                  </button>
                ))}
              </div>
            </div>

            <button className="imp-primary" onClick={startRound}>{t.start}</button>

            <div className="imp-how">
              <div className="imp-how-title">{t.howTitle}</div>
              <div className="imp-how-text">{t.how}</div>
            </div>
          </div>
        )}

        {/* ── REVEAL (pass the phone) ── */}
        {phase === 'reveal' && round && (
          <div className="imp-body imp-center">
            <div className="imp-pass-to">{t.passTo}</div>
            <div className="imp-pass-name">{t.player} {revealIdx + 1}</div>

            {!shown ? (
              <button className="imp-card imp-card-hidden" onClick={() => { playSfx?.('click'); setShown(true); }}>
                <div className="imp-card-eye">👁️</div>
                <div className="imp-card-hint">{t.tapReveal}</div>
              </button>
            ) : (
              <div className={`imp-card ${revealIdx === round.imposter ? 'imp-card-imp' : 'imp-card-word'}`}>
                {revealIdx === round.imposter ? (
                  <>
                    <div className="imp-card-role">🕵️ {t.youAreImp}</div>
                    <div className="imp-card-sub">{t.impHint} <b>{round.category}</b></div>
                    <div className="imp-card-note">{t.impBlend}</div>
                  </>
                ) : (
                  <>
                    <div className="imp-card-cat">{round.category}</div>
                    <div className="imp-card-word-txt serif">{round.word}</div>
                    <div className="imp-card-note">{t.yourWord}</div>
                  </>
                )}
              </div>
            )}

            {shown && (
              <button className="imp-primary" onClick={nextReveal}>{t.hidePass} ›</button>
            )}
            <div className="imp-dots">
              {Array.from({ length: players }).map((_, i) => (
                <span key={i} className={`imp-dot${i < revealIdx ? ' done' : ''}${i === revealIdx ? ' cur' : ''}`} />
              ))}
            </div>
          </div>
        )}

        {/* ── DISCUSS ── */}
        {phase === 'discuss' && round && (
          <div className="imp-body imp-center">
            <div className="imp-seen">✓ {t.allSeen}</div>
            <div className="imp-discuss-title serif">{t.discuss}</div>
            <div className="imp-starter">👉 {t.startsFirst}: <b>{t.player} {starter + 1}</b></div>

            <div className="imp-timer-box">
              <div className="imp-timer">{fmt(secs)}</div>
              <div className="imp-timer-row">
                {[60, 120, 180].map((s) => (
                  <button key={s} className={`imp-mini${secs === s && !timerOn ? ' on' : ''}`} onClick={() => { playSfx?.('click'); setTimerOn(false); setSecs(s); }}>{s / 60}m</button>
                ))}
                <button className="imp-mini imp-mini-go" onClick={() => { playSfx?.('click'); setTimerOn((v) => !v); }}>{timerOn ? '⏸' : '▶'}</button>
              </div>
              <div className="imp-timer-label">{t.timer}</div>
            </div>

            <button className="imp-primary imp-danger" onClick={() => { playSfx?.('click'); setPhase('result'); }}>{t.reveal}</button>
          </div>
        )}

        {/* ── RESULT ── */}
        {phase === 'result' && round && (
          <div className="imp-body imp-center">
            <div className="imp-reveal-emoji">🕵️</div>
            <div className="imp-reveal-line">{t.theImp}</div>
            <div className="imp-reveal-imp serif">{t.player} {round.imposter + 1}</div>
            <div className="imp-reveal-word-box">
              <span className="imp-reveal-word-l">{t.theWord}</span>
              <span className="imp-reveal-word serif">{round.word}</span>
            </div>
            <div className="imp-result-btns">
              <button className="imp-primary" onClick={startRound}>{t.newRound}</button>
              <button className="imp-ghost" onClick={() => { playSfx?.('click'); setPhase('setup'); }}>{t.newGame}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const CSS = `
.imp-root { position:absolute; inset:0; overflow-y:auto; -webkit-overflow-scrolling:touch; background:var(--color-training-palette-surface,#fff7f2); color:${INK}; font-family:${SANS}; }
.imp-root *, .imp-root *::before, .imp-root *::after { box-sizing:border-box; }
.imp-app { max-width:480px; margin:0 auto; min-height:100%; display:flex; flex-direction:column; padding-bottom:40px; }
.imp-head { display:flex; align-items:center; justify-content:space-between; padding:calc(14px + env(safe-area-inset-top)) 14px 10px; }
.imp-back { width:36px; height:36px; border-radius:10px; border:2px solid ${LINE}; background:${CARD}; color:#141210; font-size:22px; line-height:1; cursor:pointer; }
.imp-title { font-family:${SERIF}; font-size:26px; font-weight:600; color:${INK}; }
.imp-serif, .serif { font-family:${SERIF}; font-weight:600; }
.imp-body { flex:1; padding:8px 22px; display:flex; flex-direction:column; gap:18px; }
.imp-center { align-items:center; text-align:center; justify-content:center; }
.imp-hero { font-size:64px; text-align:center; }
.imp-tagline { text-align:center; color:${SUB}; font-size:15px; margin-top:-6px; }
.imp-field { display:flex; flex-direction:column; gap:10px; }
.imp-label { font-size:11px; letter-spacing:2px; text-transform:uppercase; color:${SUB}; font-weight:800; }
.imp-stepper { display:flex; align-items:center; gap:20px; justify-content:center; background:${CARD}; border:2px solid ${LINE}; border-radius:14px; padding:10px; }
.imp-step-btn { width:44px; height:44px; border-radius:12px; border:none; background:#f1e7d6; color:${GOLD}; font-size:26px; font-weight:800; cursor:pointer; line-height:1; }
.imp-step-val { font-size:30px; font-weight:800; min-width:40px; color:${INK}; }
.imp-packs { display:flex; flex-wrap:wrap; gap:8px; }
.imp-pack { padding:9px 14px; border-radius:999px; border:2px solid ${LINE}; background:${CARD}; color:${SUB}; font-size:13.5px; font-weight:700; cursor:pointer; font-family:inherit; }
.imp-pack.on { border-color:${ACCENT}; background:#fbeeee; color:#b5453f; }
.imp-primary { width:100%; padding:15px; border-radius:14px; border:none; background:linear-gradient(135deg,#e08a6a,${ACCENT}); color:#fff; font-size:16px; font-weight:800; cursor:pointer; font-family:inherit; box-shadow:3px 3px 0 rgba(26,18,8,0.14); }
.imp-danger { background:linear-gradient(135deg,#e07070,#c0433d); }
.imp-ghost { width:100%; padding:13px; border-radius:14px; border:2px solid ${LINE}; background:${CARD}; color:${SUB}; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; }
.imp-how { margin-top:8px; background:${CARD}; border:2px solid ${LINE}; border-radius:14px; padding:14px 16px; }
.imp-how-title { font-size:11px; letter-spacing:2px; text-transform:uppercase; color:${GOLD}; font-weight:800; margin-bottom:6px; }
.imp-how-text { font-size:13px; color:#6a5a40; line-height:1.6; }
.imp-pass-to { font-size:13px; letter-spacing:2px; text-transform:uppercase; color:${SUB}; font-weight:800; }
.imp-pass-name { font-family:${SERIF}; font-size:34px; font-weight:600; color:${INK}; margin-top:-6px; }
.imp-card { width:100%; max-width:320px; min-height:220px; border-radius:22px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; padding:26px; cursor:pointer; border:none; font-family:inherit; box-shadow:4px 4px 0 rgba(26,18,8,0.10); }
.imp-card-hidden { background:linear-gradient(150deg,#2c2418,#443624); color:#f0e2c0; }
.imp-card-eye { font-size:52px; }
.imp-card-hint { font-size:14px; font-weight:700; letter-spacing:0.5px; opacity:0.9; }
.imp-card-word { background:linear-gradient(150deg,#fffdf8,#f6efe1); border:2px solid ${LINE}; }
.imp-card-imp { background:linear-gradient(150deg,#fbeeee,#f6dede); border:2px solid #e2a9a4; }
.imp-card-cat { font-size:12px; letter-spacing:2px; text-transform:uppercase; color:${GOLD}; font-weight:800; }
.imp-card-word-txt { font-family:${SERIF}; font-size:44px; font-weight:700; color:${INK}; line-height:1.1; }
.imp-card-role { font-size:26px; font-weight:800; color:#c0433d; }
.imp-card-sub { font-size:15px; color:#8a5a52; }
.imp-card-sub b { color:#b5453f; }
.imp-card-note { font-size:12px; color:${SUB}; }
.imp-dots { display:flex; gap:7px; margin-top:6px; }
.imp-dot { width:9px; height:9px; border-radius:50%; background:#e3d6c4; }
.imp-dot.done { background:${ACCENT}; }
.imp-dot.cur { background:${GOLD}; transform:scale(1.25); }
.imp-seen { font-size:13px; color:#2e8b57; font-weight:800; }
.imp-discuss-title { font-family:${SERIF}; font-size:30px; color:${INK}; }
.imp-starter { font-size:15px; color:${SUB}; }
.imp-starter b { color:${INK}; }
.imp-timer-box { background:${CARD}; border:2px solid ${LINE}; border-radius:18px; padding:16px 20px; width:100%; max-width:320px; }
.imp-timer { font-size:48px; font-weight:800; color:${INK}; font-variant-numeric:tabular-nums; }
.imp-timer-row { display:flex; gap:8px; justify-content:center; margin-top:8px; }
.imp-mini { padding:7px 12px; border-radius:10px; border:2px solid ${LINE}; background:#faf4ea; color:${SUB}; font-size:13px; font-weight:800; cursor:pointer; font-family:inherit; }
.imp-mini.on { border-color:${GOLD}; color:${GOLD}; }
.imp-mini-go { background:${GOLD}; color:#fff; border-color:${GOLD}; }
.imp-timer-label { font-size:11px; color:${FAINT}; margin-top:8px; letter-spacing:1px; }
.imp-reveal-emoji { font-size:60px; }
.imp-reveal-line { font-size:13px; letter-spacing:2px; text-transform:uppercase; color:${SUB}; font-weight:800; }
.imp-reveal-imp { font-family:${SERIF}; font-size:40px; font-weight:700; color:#c0433d; }
.imp-reveal-word-box { display:flex; flex-direction:column; gap:2px; margin-top:6px; }
.imp-reveal-word-l { font-size:12px; letter-spacing:2px; text-transform:uppercase; color:${SUB}; font-weight:800; }
.imp-reveal-word { font-family:${SERIF}; font-size:30px; font-weight:700; color:${INK}; }
.imp-result-btns { display:flex; flex-direction:column; gap:10px; width:100%; max-width:320px; margin-top:14px; }
`;
