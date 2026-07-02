import React, { useState, useCallback, useMemo } from 'react';
import { useApp } from '../../../../context/AppContext';
import { INK, SUB, FAINT, LINE, CARD, GOLD, SERIF, SANS, rnd } from '../_shared/groupTheme';

/*
 * On a Scale (Wavelength-style) — a perspective-taking party game.  [puzzles]
 *
 * A hidden TARGET sits on a spectrum between two opposites. The Psychic sees it
 * and gives a one-word clue; the group turns a dial to where they think it is.
 * Reveal scores by how close they got. Pure theory-of-mind fun — one device.
 */

const ACCENT = '#5a9fd4';

const SPECTRA = [
  { l: { en: 'Cold', ar: 'بارد' }, r: { en: 'Hot', ar: 'حار' } },
  { l: { en: 'Useless', ar: 'عديم الفائدة' }, r: { en: 'Essential', ar: 'ضروري' } },
  { l: { en: 'Weakness', ar: 'ضعف' }, r: { en: 'Strength', ar: 'قوة' } },
  { l: { en: 'Underrated', ar: 'مبخوس حقه' }, r: { en: 'Overrated', ar: 'مبالغ فيه' } },
  { l: { en: 'Scary', ar: 'مخيف' }, r: { en: 'Safe', ar: 'آمن' } },
  { l: { en: 'Cheap', ar: 'رخيص' }, r: { en: 'Expensive', ar: 'غالٍ' } },
  { l: { en: 'Quiet', ar: 'هادئ' }, r: { en: 'Loud', ar: 'صاخب' } },
  { l: { en: 'Old-fashioned', ar: 'قديم الطراز' }, r: { en: 'Modern', ar: 'عصري' } },
  { l: { en: 'Boring', ar: 'ممل' }, r: { en: 'Exciting', ar: 'مثير' } },
  { l: { en: 'Unhealthy', ar: 'غير صحي' }, r: { en: 'Healthy', ar: 'صحي' } },
  { l: { en: 'Ugly', ar: 'قبيح' }, r: { en: 'Beautiful', ar: 'جميل' } },
  { l: { en: 'Fantasy', ar: 'خيال' }, r: { en: 'Reality', ar: 'واقع' } },
  { l: { en: 'Simple', ar: 'بسيط' }, r: { en: 'Complicated', ar: 'معقّد' } },
  { l: { en: 'Common', ar: 'شائع' }, r: { en: 'Rare', ar: 'نادر' } },
  { l: { en: 'Villain', ar: 'شرير' }, r: { en: 'Hero', ar: 'بطل' } },
  { l: { en: 'Temporary', ar: 'مؤقّت' }, r: { en: 'Permanent', ar: 'دائم' } },
  { l: { en: 'Casual', ar: 'عفوي' }, r: { en: 'Formal', ar: 'رسمي' } },
  { l: { en: 'Dangerous', ar: 'خطير' }, r: { en: 'Harmless', ar: 'غير مؤذٍ' } },
  { l: { en: 'Forgettable', ar: 'يُنسى' }, r: { en: 'Memorable', ar: 'لا يُنسى' } },
  { l: { en: 'Introvert', ar: 'انطوائي' }, r: { en: 'Extrovert', ar: 'اجتماعي' } },
  { l: { en: 'Logical', ar: 'منطقي' }, r: { en: 'Emotional', ar: 'عاطفي' } },
  { l: { en: 'Waste of time', ar: 'مضيعة للوقت' }, r: { en: 'Worth it', ar: 'يستحق العناء' } },
  { l: { en: 'Normal', ar: 'عادي' }, r: { en: 'Weird', ar: 'غريب' } },
  { l: { en: 'Comfort', ar: 'راحة' }, r: { en: 'Adventure', ar: 'مغامرة' } },
];

export default function WavelengthGame({ onBack }) {
  const { currentLang, playSfx } = useApp();
  const isAr = currentLang === 'ar';

  const [phase, setPhase] = useState('intro'); // intro | clue | guess | reveal
  const [spectrum, setSpectrum] = useState(SPECTRA[0]);
  const [target, setTarget] = useState(50);
  const [guess, setGuess] = useState(50);
  const [psychic, setPsychic] = useState(1);
  const [score, setScore] = useState(0);
  const [lastPts, setLastPts] = useState(0);

  const t = useMemo(() => ({
    title: isAr ? 'على المقياس' : 'On a Scale',
    tagline: isAr ? 'دليل واحد… والمجموعة تخمّن الموضع.' : 'One clue… the group guesses the spot.',
    how: isAr
      ? 'هدف مخفي يقع بين نقيضين. يرى «قارئ الأفكار» الهدف ويعطي دليلاً من كلمة واحدة يربط المفهوم بالمقياس. تتناقش المجموعة وتحرّك المؤشّر إلى المكان المتوقّع، ثم نكشف ونحسب القرب.'
      : 'A hidden target sits between two opposites. The Psychic sees it and gives a one-word clue linking a concept to the scale. The group discusses, moves the dial to their guess, then reveals — closer = more points.',
    start: isAr ? 'ابدأ' : 'Start',
    psychicL: isAr ? 'قارئ الأفكار' : 'Psychic',
    onlyYou: isAr ? 'أنت وحدك ترى الهدف' : 'Only you can see the target',
    clueInstr: isAr ? 'أعطِ دليلاً من كلمة واحدة بصوت عالٍ' : 'Say a one-word clue out loud',
    hidePass: isAr ? 'أخفِ ومرّر' : 'Hide & pass',
    dialInstr: isAr ? 'حرّكوا المؤشّر معاً إلى تخمينكم' : 'Move the dial together to your guess',
    lockIn: isAr ? 'ثبّتوا التخمين' : 'Lock it in',
    bull: isAr ? 'إصابة مباشرة!' : 'Bullseye!',
    great: isAr ? 'رائع!' : 'Great!',
    close: isAr ? 'قريب' : 'Close',
    missed: isAr ? 'بعيد' : 'Missed',
    pts: isAr ? 'نقاط' : 'pts',
    scoreL: isAr ? 'المجموع' : 'Score',
    nextRound: isAr ? 'جولة جديدة' : 'Next round',
    reset: isAr ? 'صفّر النقاط' : 'Reset score',
    menu: isAr ? 'القائمة' : 'Menu',
    howTitle: isAr ? 'كيف تلعب' : 'How to play',
  }), [isAr]);

  const newRound = useCallback(() => {
    playSfx?.('click');
    setSpectrum(SPECTRA[rnd(SPECTRA.length)]);
    setTarget(12 + rnd(77)); // 12..88
    setGuess(50);
    setPhase('clue');
  }, [playSfx]);

  const lockIn = useCallback(() => {
    const d = Math.abs(guess - target);
    const pts = d <= 5 ? 4 : d <= 11 ? 3 : d <= 18 ? 2 : 0;
    setLastPts(pts);
    setScore((s) => s + pts);
    playSfx?.(pts >= 3 ? 'win' : pts > 0 ? 'click' : 'error');
    setPhase('reveal');
  }, [guess, target, playSfx]);

  const bandLabel = lastPts === 4 ? t.bull : lastPts === 3 ? t.great : lastPts === 2 ? t.close : t.missed;
  const L = isAr ? spectrum.l.ar : spectrum.l.en;
  const R = isAr ? spectrum.r.ar : spectrum.r.en;

  const Bar = ({ showTarget, showGuess }) => (
    <div className="wv-bar-wrap">
      <div className="wv-bar">
        {showTarget && (
          <>
            <div className="wv-zone wv-z2" style={{ left: `${target - 18}%`, width: '36%' }} />
            <div className="wv-zone wv-z3" style={{ left: `${target - 11}%`, width: '22%' }} />
            <div className="wv-zone wv-z4" style={{ left: `${target - 5}%`, width: '10%' }} />
            <div className="wv-target" style={{ left: `${target}%` }} />
          </>
        )}
        {showGuess && <div className="wv-guess" style={{ left: `${guess}%` }} />}
      </div>
      <div className="wv-poles"><span>◄ {L}</span><span>{R} ►</span></div>
    </div>
  );

  return (
    <div className="wv-root" dir={isAr ? 'rtl' : 'ltr'}>
      <style>{CSS}</style>
      <div className="wv-app">
        <div className="wv-head">
          <button className="wv-back" onClick={() => { playSfx?.('click'); onBack?.(); }} aria-label={t.menu}>‹</button>
          <div className="wv-title serif">{t.title}</div>
          <div className="wv-score-chip">{t.scoreL}: {score}</div>
        </div>

        {phase === 'intro' && (
          <div className="wv-body">
            <div className="wv-hero">🎯</div>
            <div className="wv-tagline">{t.tagline}</div>
            <button className="wv-primary" onClick={newRound}>{t.start}</button>
            <div className="wv-how">
              <div className="wv-how-title">{t.howTitle}</div>
              <div className="wv-how-text">{t.how}</div>
            </div>
          </div>
        )}

        {phase === 'clue' && (
          <div className="wv-body wv-center">
            <div className="wv-round-tag">{t.psychicL} {psychic}</div>
            <div className="wv-only">🔒 {t.onlyYou}</div>
            <Bar showTarget showGuess={false} />
            <div className="wv-clue-instr">{t.clueInstr}</div>
            <button className="wv-primary" onClick={() => { playSfx?.('click'); setPhase('guess'); }}>{t.hidePass} ›</button>
          </div>
        )}

        {phase === 'guess' && (
          <div className="wv-body wv-center">
            <div className="wv-dial-instr">{t.dialInstr}</div>
            <Bar showTarget={false} showGuess />
            <input
              className="wv-slider" type="range" min="0" max="100" value={guess}
              onChange={(e) => setGuess(Number(e.target.value))}
              style={{ accentColor: ACCENT }}
            />
            <button className="wv-primary" onClick={lockIn}>{t.lockIn}</button>
          </div>
        )}

        {phase === 'reveal' && (
          <div className="wv-body wv-center">
            <div className={`wv-band-label${lastPts >= 3 ? ' good' : lastPts === 0 ? ' bad' : ''}`}>{bandLabel}</div>
            <div className="wv-pts">+{lastPts} {t.pts}</div>
            <Bar showTarget showGuess />
            <div className="wv-result-btns">
              <button className="wv-primary" onClick={() => { setPsychic((n) => n + 1); newRound(); }}>{t.nextRound}</button>
              <button className="wv-ghost" onClick={() => { playSfx?.('click'); setScore(0); setPsychic(1); setPhase('intro'); }}>{t.reset}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const CSS = `
.wv-root { position:absolute; inset:0; overflow-y:auto; -webkit-overflow-scrolling:touch; background:var(--color-training-palette-surface,#fff7f2); color:${INK}; font-family:${SANS}; }
.wv-root *, .wv-root *::before, .wv-root *::after { box-sizing:border-box; }
.wv-app { max-width:480px; margin:0 auto; min-height:100%; display:flex; flex-direction:column; padding-bottom:40px; }
.wv-head { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:calc(14px + env(safe-area-inset-top)) 14px 10px; }
.wv-back { width:36px; height:36px; border-radius:10px; border:2px solid ${LINE}; background:${CARD}; color:#141210; font-size:22px; line-height:1; cursor:pointer; flex-shrink:0; }
.wv-title { font-family:${SERIF}; font-size:26px; font-weight:600; color:${INK}; flex:1; text-align:center; }
.serif { font-family:${SERIF}; font-weight:600; }
.wv-score-chip { font-size:12px; font-weight:800; color:${ACCENT}; background:#eef5fb; border:2px solid #cfe2f2; border-radius:999px; padding:6px 10px; white-space:nowrap; }
.wv-body { flex:1; padding:12px 22px; display:flex; flex-direction:column; gap:20px; }
.wv-center { align-items:center; text-align:center; justify-content:center; }
.wv-hero { font-size:64px; text-align:center; }
.wv-tagline { text-align:center; color:${SUB}; font-size:15px; margin-top:-6px; }
.wv-primary { width:100%; max-width:340px; padding:15px; border-radius:14px; border:none; background:${ACCENT}; color:#fff; font-size:16px; font-weight:800; cursor:pointer; font-family:inherit; box-shadow:3px 3px 0 rgba(26,18,8,0.14); }
.wv-ghost { width:100%; max-width:340px; padding:13px; border-radius:14px; border:2px solid ${LINE}; background:${CARD}; color:${SUB}; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; }
.wv-how { margin-top:4px; background:${CARD}; border:2px solid ${LINE}; border-radius:14px; padding:14px 16px; }
.wv-how-title { font-size:11px; letter-spacing:2px; text-transform:uppercase; color:${GOLD}; font-weight:800; margin-bottom:6px; }
.wv-how-text { font-size:13px; color:#6a5a40; line-height:1.6; }
.wv-round-tag { font-size:12px; letter-spacing:2px; text-transform:uppercase; color:${SUB}; font-weight:800; }
.wv-only { font-size:14px; color:#b5453f; font-weight:800; }
.wv-clue-instr, .wv-dial-instr { font-size:16px; font-weight:700; color:${INK}; }
.wv-bar-wrap { width:100%; max-width:360px; }
.wv-bar { position:relative; height:46px; border-radius:12px; overflow:hidden; border:2px solid ${LINE};
  background:linear-gradient(90deg, #dce6ee 0%, #eef2f0 50%, #f4e6d6 100%); }
.wv-zone { position:absolute; top:0; bottom:0; }
.wv-z2 { background:rgba(90,159,212,0.20); }
.wv-z3 { background:rgba(90,159,212,0.38); }
.wv-z4 { background:rgba(232,172,78,0.75); }
.wv-target { position:absolute; top:-3px; bottom:-3px; width:3px; background:${GOLD}; transform:translateX(-50%); box-shadow:0 0 6px rgba(185,132,47,0.8); }
.wv-guess { position:absolute; top:-6px; bottom:-6px; width:4px; background:#c0433d; transform:translateX(-50%); box-shadow:0 0 6px rgba(192,67,61,0.7); }
.wv-poles { display:flex; justify-content:space-between; margin-top:8px; font-size:13px; font-weight:800; color:${SUB}; }
.wv-slider { width:100%; max-width:360px; height:34px; }
.wv-band-label { font-family:${SERIF}; font-size:34px; font-weight:700; color:${SUB}; }
.wv-band-label.good { color:#2e8b57; }
.wv-band-label.bad { color:#c0433d; }
.wv-pts { font-size:16px; font-weight:800; color:${INK}; margin-top:-8px; }
.wv-result-btns { display:flex; flex-direction:column; gap:10px; width:100%; max-width:340px; margin-top:10px; align-items:center; }
`;
