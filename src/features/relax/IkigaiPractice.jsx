import React, { useCallback, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import PracticeShell, { INK, SUB, SERIF, SANS, LINE, CARD, GOLD } from './PracticeShell';
import { markWellbeingPracticeDone } from './habitState';

/*
 * Ikigai — four overlapping circles of purpose (Meaning / Wellbeing).
 * Classic Venn layout with a live diagram that fills in as you reflect,
 * a step-by-step reveal, then a final map with your answers on the drawing.
 */

const ACCENT = '#c9a24b';
const STORAGE_KEY = 'rx_ikigai_v1';

const QUADRANTS = [
  {
    id: 'love', icon: '❤️', pos: 'top', color: '#d4847a', fill: 'rgba(212,132,122,0.32)',
    en: 'What you love', ar: 'ما تحبّ', shortEn: 'Love', shortAr: 'حب',
    hintEn: 'Activities that make you lose track of time.',
    hintAr: 'ما الذي يجعلك تفقد الإحساس بالوقت؟',
  },
  {
    id: 'good', icon: '⭐', pos: 'right', color: '#6fae7a', fill: 'rgba(111,174,122,0.32)',
    en: "What you're good at", ar: 'ما تجيد', shortEn: 'Good at', shortAr: 'إتقان',
    hintEn: 'Skills others notice — or you quietly trust.',
    hintAr: 'مهارات يلاحظها الآخرون — أو تثق بها أنت.',
  },
  {
    id: 'paid', icon: '🌱', pos: 'bottom', color: '#c9a24b', fill: 'rgba(201,162,75,0.32)',
    en: 'What you can offer', ar: 'ما يمكنك تقديمه', shortEn: 'Offer', shortAr: 'عطاء',
    hintEn: 'Ways your effort could sustain you or others.',
    hintAr: 'طرق يمكن أن يدعم بها جهدك نفسك أو غيرك.',
  },
  {
    id: 'need', icon: '🌍', pos: 'left', color: '#7b86c8', fill: 'rgba(123,134,200,0.32)',
    en: 'What the world needs', ar: 'ما يحتاجه العالم', shortEn: 'World needs', shortAr: 'حاجة',
    hintEn: 'Problems you care about fixing, near or far.',
    hintAr: 'مشكلات تهمّك حلّها، قريبة أو بعيدة.',
  },
];

const OVERLAPS = [
  { ids: ['love', 'good'], en: 'Passion', ar: 'شغف', color: '#c9956a', ox: 192, oy: 108 },
  { ids: ['love', 'need'], en: 'Mission', ar: 'رسالة', color: '#a88bb8', ox: 108, oy: 108 },
  { ids: ['need', 'paid'], en: 'Vocation', ar: 'دعوة', color: '#8aab8a', ox: 108, oy: 192 },
  { ids: ['good', 'paid'], en: 'Profession', ar: 'مهنة', color: '#8a9e72', ox: 192, oy: 192 },
];

const CX = 150;
const CY = 150;
const R = 72;
const POSITIONS = {
  top: { cx: CX, cy: CY - 44, lx: CX, ly: 18, tx: CX, ty: 48, ax: CX, ay: 8 },
  right: { cx: CX + 44, cy: CY, lx: 258, ly: CY + 4, tx: 232, ty: CY + 4, ax: 278, ay: CY + 4 },
  bottom: { cx: CX, cy: CY + 44, lx: CX, ly: 282, tx: CX, ty: 252, ax: CX, ay: 292 },
  left: { cx: CX - 44, cy: CY, lx: 42, ly: CY + 4, tx: 68, ty: CY + 4, ax: 22, ay: CY + 4 },
};

const truncate = (text, max = 36) => {
  const s = (text || '').trim();
  if (!s) return '';
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
};

const wrapCentre = (text, maxLine = 11) => {
  const words = (text || '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const lines = [];
  let line = words[0];
  for (let i = 1; i < words.length; i += 1) {
    const next = `${line} ${words[i]}`;
    if (next.length <= maxLine) line = next;
    else { lines.push(line); line = words[i]; }
  }
  lines.push(line);
  return lines.slice(0, 3);
};

const loadSaved = () => {
  try {
    const v = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (v && typeof v === 'object') return v;
  } catch { /* ignore */ }
  return { love: '', good: '', need: '', paid: '', center: '', savedAt: null };
};

const hasContent = (a) => QUADRANTS.some((q) => a[q.id]?.trim()) || a.center?.trim();

function IkigaiDiagram({
  answers,
  activeId,
  reveal,
  revealProgress = 0,
  showAnswers = false,
  isAr,
  size = 'full',
}) {
  const compact = size === 'compact';
  const large = size === 'large';

  const isDone = (id) => {
    const idx = QUADRANTS.findIndex((q) => q.id === id);
    if (reveal && revealProgress > 0) return idx < revealProgress;
    return !!(answers[id]?.trim());
  };

  const centreWord = (answers.center || '').trim();
  const centreLines = wrapCentre(centreWord, large ? 14 : 10);
  const centreLit = reveal && centreWord && (revealProgress >= QUADRANTS.length || showAnswers);

  return (
    <svg
      className={`ikg-svg${compact ? ' ikg-svg--compact' : ''}${large ? ' ikg-svg--large' : ''}${reveal ? ' ikg-svg--reveal' : ''}${showAnswers ? ' ikg-svg--answers' : ''}`}
      viewBox="0 0 300 300"
      role="img"
      aria-label={isAr ? 'رسم إيكيغاي' : 'Ikigai diagram'}
    >
      <defs>
        <filter id="ikg-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <radialGradient id="ikg-centre-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff3d6" />
          <stop offset="100%" stopColor="#fdeecb" />
        </radialGradient>
      </defs>

      {/* soft paper backdrop */}
      <rect x="8" y="8" width="284" height="284" rx="24" className="ikg-backdrop" />

      {QUADRANTS.map((q) => {
        const p = POSITIONS[q.pos];
        const on = activeId === q.id;
        const done = isDone(q.id);
        const answer = truncate(answers[q.id], large ? 44 : compact ? 0 : 32);
        return (
          <g key={q.id} className={`ikg-quad${done ? ' ikg-quad--done' : ''}${on ? ' ikg-quad--active' : ''}`}>
            <circle
              cx={p.cx} cy={p.cy} r={R}
              fill={done || on ? q.fill : 'rgba(255,253,248,0.12)'}
              stroke={on ? q.color : done ? q.color : LINE}
              strokeWidth={on ? 3.2 : done ? 2.4 : 1.4}
              className="ikg-circle"
            />
            {!compact && (
              <text x={p.tx} y={p.ty} textAnchor="middle" className="ikg-svg-label" fill={done ? q.color : SUB}>
                {isAr ? q.shortAr : q.shortEn}
              </text>
            )}
            {showAnswers && answer && (
              <text x={p.ax} y={p.ay} textAnchor="middle" className="ikg-answer-label">
                <tspan x={p.ax} dy="0">{answer}</tspan>
              </text>
            )}
          </g>
        );
      })}

      {/* overlap labels — only on full map */}
      {showAnswers && OVERLAPS.map((o) => {
        const [a, b] = o.ids;
        if (!answers[a]?.trim() || !answers[b]?.trim()) return null;
        return (
          <text key={o.en} x={o.ox} y={o.oy} textAnchor="middle" className="ikg-overlap-label" fill={o.color}>
            {isAr ? o.ar : o.en}
          </text>
        );
      })}

      {/* centre */}
      <circle
        cx={CX} cy={CY}
        r={centreLit ? (large ? 42 : 38) : 30}
        className={`ikg-centre${centreLit ? ' ikg-centre--lit' : ''}`}
        fill={centreLit ? 'url(#ikg-centre-glow)' : '#fff8ef'}
        filter={centreLit ? 'url(#ikg-glow)' : undefined}
      />
      {centreLit && centreLines.length ? (
        centreLines.map((line, i) => (
          <text
            key={line}
            x={CX}
            y={CY - (centreLines.length - 1) * 5 + i * 10}
            textAnchor="middle"
            className="ikg-centre-user"
          >
            {line}
          </text>
        ))
      ) : (
        <text x={CX} y={CY + 5} textAnchor="middle" className="ikg-centre-mark">✦</text>
      )}
    </svg>
  );
}

export default function IkigaiPractice({ onBack }) {
  const { currentLang, playSfx } = useApp();
  const isAr = currentLang === 'ar';
  const saved = useMemo(() => loadSaved(), []);
  const [phase, setPhase] = useState('intro');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(saved);
  const [revealStep, setRevealStep] = useState(0);

  const t = useMemo(() => ({
    title: isAr ? 'إيكيغاي' : 'Ikigai',
    intro: isAr
      ? 'أربعة دوائر تتقاطع — ما تحبّ، ما تجيد، ما يحتاجه العالم، وما يمكنك تقديمه. في الوسط، حيث يلتقي الكل، يظهر معنى حياتك.'
      : 'Four circles overlap — what you love, what you\'re good at, what the world needs, and what you can offer. At the centre, where they meet, your purpose lives.',
    start: isAr ? 'ابدأ التأمل' : 'Begin reflection',
    viewSaved: isAr ? 'عرض إيكيغاي المحفوظ' : 'View saved Ikigai',
    stepOf: (n, total) => (isAr ? `${n} من ${total}` : `${n} of ${total}`),
    fillCircle: isAr ? 'املأ هذه الدائرة' : 'Fill this circle',
    placeholder: isAr ? 'اكتب بحرّية — جملة أو فكرة…' : 'Write freely — a phrase or idea…',
    next: isAr ? 'التالي' : 'Next',
    toCentre: isAr ? 'إلى المركز' : 'To the centre',
    centerTitle: isAr ? 'إيكيغاي — في المركز' : 'Your Ikigai — the centre',
    centerHint: isAr
      ? 'انظر إلى الدوائر الأربع. ما الكلمة أو الفكرة التي تجمعها؟ لا يلزم أن تكون نهائية — ابدأ هنا.'
      : 'Look at all four circles. What word or idea holds them together? It doesn\'t have to be final — start here.',
    centerPh: isAr ? 'معنى حياتك يبدأ هنا…' : 'Your purpose starts here…',
    reveal: isAr ? 'كشف خريطتي' : 'Reveal my map',
    mapTitle: isAr ? 'خريطة إيكيغاي' : 'Your Ikigai map',
    mapSub: isAr ? 'حيث يلتقي ما تحبّ وما تجيد وما يحتاجه العالم وما تقدّمه.' : 'Where love, skill, need, and offering meet.',
    yourWord: isAr ? 'كلمتك في المركز' : 'Your centre word',
    theFour: isAr ? 'الدوائر الأربع' : 'The four circles',
    overlaps: isAr ? 'أين تتقاطع' : 'Where they overlap',
    again: isAr ? 'مراجعة الدوائر' : 'Review circles',
    back: isAr ? 'رجوع' : 'Back',
    note: isAr ? 'تأمل شخصي — ليس تشخيصاً أو نصيحة مهنية.' : 'Personal reflection — not diagnosis or career advice.',
    empty: '—',
    together: isAr ? 'دوائرك تكتمل…' : 'Your circles come together…',
    seeMap: isAr ? 'عرض الخريطة الكاملة' : 'See full map',
    continue: isAr ? 'تابع' : 'Continue',
  }), [isAr]);

  const q = QUADRANTS[step];
  const setField = (id, val) => setAnswers((a) => ({ ...a, [id]: val }));

  const persist = useCallback((data) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, savedAt: Date.now() }));
    } catch { /* ignore */ }
  }, []);

  const goReveal = () => {
    playSfx?.('click');
    persist(answers);
    setRevealStep(0);
    setPhase('reveal');
  };

  const advanceReveal = () => {
    playSfx?.('click');
    if (revealStep < 5) setRevealStep((s) => s + 1);
  };

  const openMap = () => {
    playSfx?.('collect');
    markWellbeingPracticeDone('ikigai');
    setPhase('map');
  };

  const savedDate = answers.savedAt
    ? new Date(answers.savedAt).toLocaleDateString(isAr ? 'ar' : 'en', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <PracticeShell title={t.title} accent={ACCENT} isAr={isAr} onBack={onBack}>
      <style>{CSS}</style>

      {phase === 'intro' && (
        <div className="rxp-body rxp-center">
          <IkigaiDiagram answers={answers} isAr={isAr} reveal={hasContent(answers)} showAnswers={hasContent(answers)} />
          <p className="ikg-intro">{t.intro}</p>
          <button type="button" className="rxp-primary" onClick={() => { playSfx?.('click'); setPhase('quadrant'); setStep(0); }}>
            {t.start}
          </button>
          {hasContent(saved) && (
            <button type="button" className="rxp-ghost" onClick={() => { playSfx?.('click'); setPhase('map'); }}>
              {t.viewSaved}
            </button>
          )}
          <p className="rxp-tip">{t.note}</p>
        </div>
      )}

      {phase === 'quadrant' && q && (
        <div className="rxp-body">
          <IkigaiDiagram answers={answers} activeId={q.id} isAr={isAr} size="compact" />
          <div className="ikg-step-meta">{t.stepOf(step + 1, QUADRANTS.length)} · {t.fillCircle}</div>
          <div className="ikg-q-head">
            <span className="ikg-q-icon">{q.icon}</span>
            <h2 className="ikg-q-title serif">{isAr ? q.ar : q.en}</h2>
          </div>
          <p className="ikg-q-hint">{isAr ? q.hintAr : q.hintEn}</p>
          <textarea
            className="ikg-input"
            value={answers[q.id] || ''}
            onChange={(e) => setField(q.id, e.target.value)}
            placeholder={t.placeholder}
            rows={4}
            maxLength={400}
          />
          <div className="ikg-dots">
            {QUADRANTS.map((quad, i) => (
              <span key={quad.id} className={`ikg-dot${i === step ? ' on' : ''}${answers[quad.id]?.trim() ? ' done' : ''}`} style={{ '--dot-c': quad.color }} />
            ))}
          </div>
          <button
            type="button"
            className="rxp-primary"
            onClick={() => {
              playSfx?.('click');
              if (step + 1 >= QUADRANTS.length) setPhase('center');
              else setStep(step + 1);
            }}
          >
            {step + 1 >= QUADRANTS.length ? t.toCentre : t.next}
          </button>
        </div>
      )}

      {phase === 'center' && (
        <div className="rxp-body">
          <IkigaiDiagram answers={answers} isAr={isAr} size="compact" />
          <h2 className="ikg-q-title serif">{t.centerTitle}</h2>
          <p className="ikg-q-hint">{t.centerHint}</p>
          <textarea
            className="ikg-input ikg-input--centre"
            value={answers.center || ''}
            onChange={(e) => setField('center', e.target.value)}
            placeholder={t.centerPh}
            rows={3}
            maxLength={120}
          />
          <button type="button" className="rxp-primary" onClick={goReveal}>{t.reveal}</button>
        </div>
      )}

      {phase === 'reveal' && (
        <div className="rxp-body rxp-center ikg-reveal-wrap">
          <IkigaiDiagram
            answers={answers}
            isAr={isAr}
            reveal
            revealProgress={revealStep >= 1 && revealStep <= 4 ? revealStep : revealStep >= 5 ? 4 : 0}
            showAnswers={revealStep >= 5}
            size={revealStep >= 5 ? 'full' : 'compact'}
          />
          {revealStep === 0 && (
            <>
              <p className="ikg-reveal-msg serif">{t.together}</p>
              <button type="button" className="rxp-primary" onClick={advanceReveal}>{t.continue}</button>
            </>
          )}
          {revealStep >= 1 && revealStep <= 4 && (() => {
            const quad = QUADRANTS[revealStep - 1];
            const text = answers[quad.id]?.trim();
            return (
              <>
                <div className="ikg-reveal-chip" style={{ borderColor: quad.color, color: quad.color }}>
                  <span>{quad.icon} {isAr ? quad.ar : quad.en}</span>
                </div>
                <p className="ikg-reveal-answer">{text || t.empty}</p>
                <button type="button" className="rxp-primary" onClick={advanceReveal}>
                  {revealStep < 4 ? t.next : t.toCentre}
                </button>
              </>
            );
          })()}
          {revealStep === 5 && (
            <>
              <div className="ikg-centre-reveal serif">{answers.center?.trim() || '…'}</div>
              <p className="ikg-reveal-msg">{t.mapSub}</p>
              <button type="button" className="rxp-primary" onClick={openMap}>{t.seeMap}</button>
            </>
          )}
        </div>
      )}

      {phase === 'map' && (
        <div className="rxp-body ikg-map-body">
          <div className="ikg-final-header">
            <h2 className="ikg-map-title serif">{t.mapTitle}</h2>
            {savedDate && <span className="ikg-saved-date">{savedDate}</span>}
          </div>

          <div className="ikg-final-hero">
            <IkigaiDiagram answers={answers} isAr={isAr} reveal showAnswers size="large" />
          </div>

          {answers.center?.trim() && (
            <div className="ikg-final-centre">
              <span className="ikg-final-label">{t.yourWord}</span>
              <p className="ikg-final-word serif">{answers.center.trim()}</p>
            </div>
          )}

          <div className="ikg-section-label">{t.theFour}</div>
          <div className="ikg-map-grid">
            {QUADRANTS.map((quad) => (
              <div key={quad.id} className="ikg-map-card" style={{ borderColor: `${quad.color}88`, background: `color-mix(in srgb, ${quad.color} 6%, ${CARD})` }}>
                <span className="ikg-map-label" style={{ color: quad.color }}>
                  {quad.icon} {isAr ? quad.shortAr : quad.shortEn}
                </span>
                <p className="ikg-map-text">{answers[quad.id]?.trim() || t.empty}</p>
              </div>
            ))}
          </div>

          <div className="ikg-section-label">{t.overlaps}</div>
          <div className="ikg-overlap-row">
            {OVERLAPS.map((o) => {
              const [a, b] = o.ids;
              const qa = QUADRANTS.find((x) => x.id === a);
              const qb = QUADRANTS.find((x) => x.id === b);
              const hasBoth = answers[a]?.trim() && answers[b]?.trim();
              return (
                <div key={o.en} className={`ikg-overlap-card${hasBoth ? ' on' : ''}`} style={{ '--ov': o.color }}>
                  <span className="ikg-overlap-name">{isAr ? o.ar : o.en}</span>
                  {hasBoth ? (
                    <span className="ikg-overlap-snippet">
                      {truncate(answers[a], 48)} · {truncate(answers[b], 48)}
                    </span>
                  ) : (
                    <span className="ikg-overlap-snippet muted">{qa.icon} + {qb.icon}</span>
                  )}
                </div>
              );
            })}
          </div>

          <button type="button" className="rxp-primary" onClick={() => { playSfx?.('click'); setPhase('quadrant'); setStep(0); }}>
            {t.again}
          </button>
          <button type="button" className="rxp-ghost" onClick={onBack}>{t.back}</button>
        </div>
      )}
    </PracticeShell>
  );
}

const CSS = `
.ikg-svg { width:min(300px,92vw); height:auto; display:block; margin:0 auto; }
.ikg-svg--compact { width:min(220px,78vw); }
.ikg-svg--large { width:min(340px,96vw); }
.ikg-backdrop { fill:#fffdf8; stroke:${LINE}; stroke-width:1.5; }
.ikg-svg--reveal .ikg-quad--done { animation:ikg-pop .5s ease-out both; }
.ikg-svg--reveal .ikg-centre--lit { animation:ikg-centre-pulse 1.4s ease-in-out infinite; }
.ikg-svg--answers .ikg-quad--done .ikg-circle { stroke-width:2.6; }
@keyframes ikg-pop { 0%{transform:scale(0.9);opacity:0.45} 100%{transform:scale(1);opacity:1} }
@keyframes ikg-centre-pulse { 0%,100%{filter:drop-shadow(0 0 0 rgba(201,162,75,0))} 50%{filter:drop-shadow(0 0 12px rgba(201,162,75,0.5))} }
.ikg-circle { transition:fill .4s ease, stroke .3s ease, stroke-width .3s ease; }
.ikg-quad--active .ikg-circle { animation:ikg-pulse-ring 1.4s ease-in-out infinite; }
@keyframes ikg-pulse-ring { 0%,100%{opacity:1} 50%{opacity:0.78} }
.ikg-svg-label { font-size:11px; font-weight:800; font-family:${SANS}; letter-spacing:0.4px; }
.ikg-answer-label { font-size:9px; font-weight:700; fill:${INK}; font-family:${SANS}; opacity:0.88; }
.ikg-centre { stroke:${ACCENT}; stroke-width:2.5; transition:all .45s ease; }
.ikg-centre--lit { stroke:${GOLD}; stroke-width:3.2; }
.ikg-centre-mark { font-size:20px; fill:${ACCENT}; font-family:${SERIF}; }
.ikg-centre-user { font-size:10px; font-weight:800; fill:${INK}; font-family:${SERIF}; }
.ikg-svg--large .ikg-centre-user { font-size:11px; }
.ikg-overlap-label { font-size:8.5px; font-weight:800; font-family:${SANS}; opacity:0.9; pointer-events:none; letter-spacing:0.2px; }
.ikg-intro { font-size:15px; color:${SUB}; line-height:1.7; max-width:340px; text-align:center; margin:0; }
.ikg-step-meta { font-size:11px; font-weight:800; letter-spacing:2px; text-transform:uppercase; color:${SUB}; text-align:center; }
.ikg-q-head { display:flex; align-items:center; gap:12px; }
.ikg-q-icon { font-size:32px; }
.ikg-q-title { margin:0; font-size:26px; color:${INK}; line-height:1.15; }
.ikg-q-hint { margin:0; font-size:14px; color:${SUB}; line-height:1.55; }
.ikg-input { width:100%; padding:14px 16px; border-radius:14px; border:2px solid ${LINE}; background:${CARD}; font-family:inherit; font-size:15px; line-height:1.55; color:${INK}; resize:vertical; min-height:100px; }
.ikg-input--centre { border-color:${ACCENT}; background:#fff8ef; text-align:center; font-family:${SERIF}; font-size:18px; font-weight:600; min-height:72px; }
.ikg-input:focus { outline:none; border-color:${ACCENT}; box-shadow:0 0 0 3px rgba(201,162,75,0.2); }
.ikg-dots { display:flex; gap:10px; justify-content:center; }
.ikg-dot { width:10px; height:10px; border-radius:50%; background:#e8dfd0; transition:transform .15s, background .15s; }
.ikg-dot.done { background:var(--dot-c, ${ACCENT}); opacity:0.55; }
.ikg-dot.on { background:var(--dot-c, ${ACCENT}); transform:scale(1.4); opacity:1; }
.ikg-reveal-wrap { gap:14px; }
.ikg-reveal-msg { margin:0; font-size:20px; color:${INK}; text-align:center; max-width:300px; line-height:1.35; }
.ikg-reveal-chip { display:inline-block; padding:6px 14px; border-radius:999px; border:2px solid; background:${CARD}; font-size:13px; font-weight:800; }
.ikg-reveal-answer { margin:0; font-size:17px; line-height:1.55; color:${INK}; text-align:center; max-width:320px; font-weight:600; }
.ikg-centre-reveal { font-size:clamp(26px,7vw,34px); color:${GOLD}; text-align:center; line-height:1.2; max-width:300px; word-break:break-word; }
.ikg-map-body { gap:14px; }
.ikg-final-header { display:flex; flex-direction:column; align-items:center; gap:4px; }
.ikg-map-title { margin:0; font-size:28px; color:${INK}; text-align:center; }
.ikg-saved-date { font-size:11px; font-weight:700; color:${SUB}; letter-spacing:0.5px; }
.ikg-final-hero { background:${CARD}; border:2px solid ${LINE}; border-radius:22px; padding:12px 6px 6px; box-shadow:5px 5px 0 rgba(26,18,8,0.07); animation:ikg-hero-in .6s ease-out both; }
@keyframes ikg-hero-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
.ikg-final-centre { text-align:center; padding:18px 20px; background:linear-gradient(180deg,#fff8ef 0%,#fdeecb 100%); border:2px solid ${ACCENT}; border-radius:16px; box-shadow:0 4px 16px rgba(201,162,75,0.15); }
.ikg-final-label { display:block; font-size:10px; font-weight:800; letter-spacing:2px; text-transform:uppercase; color:${SUB}; margin-bottom:6px; }
.ikg-final-word { margin:0; font-size:clamp(24px,6.5vw,34px); color:${INK}; line-height:1.15; }
.ikg-section-label { font-size:11px; font-weight:800; letter-spacing:2px; text-transform:uppercase; color:${SUB}; margin-top:4px; }
.ikg-map-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.ikg-map-card { border:2px solid ${LINE}; border-radius:14px; padding:12px 14px; }
.ikg-map-label { display:block; font-size:11px; font-weight:800; letter-spacing:0.5px; margin-bottom:6px; }
.ikg-map-text { margin:0; font-size:13.5px; line-height:1.45; color:${INK}; white-space:pre-wrap; word-break:break-word; }
.ikg-overlap-row { display:flex; flex-direction:column; gap:8px; }
.ikg-overlap-card { background:${CARD}; border:2px solid ${LINE}; border-radius:12px; padding:10px 14px; opacity:0.65; }
.ikg-overlap-card.on { opacity:1; border-color:color-mix(in srgb, var(--ov) 55%, ${LINE}); background:color-mix(in srgb, var(--ov) 8%, ${CARD}); }
.ikg-overlap-name { display:block; font-size:12px; font-weight:900; color:var(--ov, ${SUB}); margin-bottom:3px; }
.ikg-overlap-snippet { font-size:12px; color:${SUB}; line-height:1.4; }
.ikg-overlap-snippet.muted { opacity:0.7; }
`;
