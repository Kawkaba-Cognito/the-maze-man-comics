import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import PracticeShell, { INK, SUB, SERIF } from './PracticeShell';

/*
 * Progressive Muscle Relaxation (Jacobson) — guided tense-and-release through the
 * major muscle groups. Tense ~5s, release ~12s, notice the difference. Non-medical.
 */

const ACCENT = '#b07ac8';
const TENSE_S = 5;
const RELEASE_S = 12;

const GROUPS = [
  { en: 'Hands & forearms', ar: 'اليدان والساعدان', cue: { en: 'Clench both fists tight', ar: 'اقبض قبضتيك بإحكام' } },
  { en: 'Upper arms', ar: 'العضدان', cue: { en: 'Bend your elbows, tense your biceps', ar: 'اثنِ مرفقيك وشُدّ عضلاتك' } },
  { en: 'Shoulders', ar: 'الكتفان', cue: { en: 'Shrug them up toward your ears', ar: 'ارفعهما نحو أذنيك' } },
  { en: 'Face', ar: 'الوجه', cue: { en: 'Scrunch your whole face', ar: 'قطّب وجهك بالكامل' } },
  { en: 'Neck', ar: 'الرقبة', cue: { en: 'Gently press your head back', ar: 'اضغط رأسك للخلف برفق' } },
  { en: 'Chest & back', ar: 'الصدر والظهر', cue: { en: 'Deep breath in, arch slightly', ar: 'شهيق عميق وتقوّس قليلاً' } },
  { en: 'Stomach', ar: 'البطن', cue: { en: 'Tighten your abdomen', ar: 'شُدّ عضلات بطنك' } },
  { en: 'Thighs', ar: 'الفخذان', cue: { en: 'Press your thighs together', ar: 'اضغط فخذيك معاً' } },
  { en: 'Calves & feet', ar: 'الساقان والقدمان', cue: { en: 'Point your toes, tense your calves', ar: 'مُدّ أصابع قدميك وشُدّ ساقيك' } },
];

export default function PmrPractice({ onBack }) {
  const { currentLang, playSfx } = useApp();
  const isAr = currentLang === 'ar';

  const [phase, setPhase] = useState('intro'); // intro | run | done
  const [gIdx, setGIdx] = useState(0);
  const [sub, setSub] = useState('tense'); // tense | release
  const [secsLeft, setSecsLeft] = useState(TENSE_S);

  const t = useMemo(() => ({
    title: isAr ? 'استرخاء العضلات' : 'Muscle Relaxation',
    intro: isAr ? 'سنشدّ كل مجموعة عضلية ثم نُرخيها، ونلاحظ الفرق. اجلس أو استلقِ في مكان مريح.'
      : "We'll tense each muscle group, then release it and notice the difference. Sit or lie down somewhere comfortable.",
    start: isAr ? 'ابدأ' : 'Begin',
    tense: isAr ? 'شُدّ' : 'Tense',
    release: isAr ? 'أرخِ ولاحظ الفرق' : 'Release & notice',
    stop: isAr ? 'إنهاء' : 'Finish',
    done: isAr ? 'جسدك أهدأ الآن' : 'Your body is calmer now',
    doneSub: isAr ? 'ابقَ مستلقياً لحظة واستمتع بالثِّقل.' : 'Stay a moment and enjoy the heaviness.',
    again: isAr ? 'مرة أخرى' : 'Again',
    back: isAr ? 'رجوع' : 'Back',
    note: isAr ? 'ممارسة استرخاء، وليست علاجاً طبياً.' : 'A relaxation practice, not medical treatment.',
    of: isAr ? 'من' : 'of',
  }), [isAr]);

  const start = useCallback(() => { setGIdx(0); setSub('tense'); setSecsLeft(TENSE_S); setPhase('run'); playSfx?.('click'); }, [playSfx]);

  useEffect(() => {
    if (phase !== 'run') return undefined;
    const dur = sub === 'tense' ? TENSE_S : RELEASE_S;
    setSecsLeft(dur);
    const tick = setInterval(() => setSecsLeft((s) => Math.max(0, s - 1)), 1000);
    const id = setTimeout(() => {
      if (sub === 'tense') { setSub('release'); }
      else if (gIdx + 1 >= GROUPS.length) { setPhase('done'); playSfx?.('collect'); }
      else { setGIdx(gIdx + 1); setSub('tense'); }
    }, dur * 1000);
    return () => { clearInterval(tick); clearTimeout(id); };
  }, [phase, gIdx, sub, playSfx]);

  const g = GROUPS[gIdx];
  const tensing = sub === 'tense';

  return (
    <PracticeShell title={t.title} accent={ACCENT} isAr={isAr} onBack={onBack}>
      <style>{CSS}</style>

      {phase === 'intro' && (
        <div className="rxp-body rxp-center">
          <div className="rxp-hero">💪</div>
          <div className="pmr-intro">{t.intro}</div>
          <button className="rxp-primary" onClick={start}>{t.start}</button>
          <div className="rxp-tip">{t.note}</div>
        </div>
      )}

      {phase === 'run' && (
        <div className="rxp-body rxp-center">
          <div className="rxp-remain">{gIdx + 1} {t.of} {GROUPS.length}</div>
          <div className="pmr-group serif">{isAr ? g.ar : g.en}</div>
          <div className={`pmr-circle ${tensing ? 'tense' : 'release'}`}>
            <span className="pmr-num">{secsLeft}</span>
          </div>
          <div className={`pmr-action ${tensing ? 'tense' : 'release'}`}>{tensing ? t.tense : t.release}</div>
          <div className="pmr-cue">{isAr ? g.cue.ar : g.cue.en}</div>
          <button className="rxp-ghost" onClick={() => { playSfx?.('click'); setPhase('done'); }}>{t.stop}</button>
        </div>
      )}

      {phase === 'done' && (
        <div className="rxp-body rxp-center">
          <div className="rxp-hero">🌙</div>
          <div className="pmr-doneT serif">{t.done}</div>
          <div className="pmr-doneS">{t.doneSub}</div>
          <button className="rxp-primary" onClick={start}>{t.again}</button>
          <button className="rxp-ghost" onClick={onBack}>{t.back}</button>
        </div>
      )}
    </PracticeShell>
  );
}

const CSS = `
.pmr-intro { font-size:15px; color:${SUB}; line-height:1.7; max-width:340px; }
.pmr-group { font-family:${SERIF}; font-size:30px; font-weight:600; color:${INK}; }
.pmr-circle { width:170px; height:170px; border-radius:50%; display:grid; place-items:center; margin:6px 0; transition:transform .6s ease-in-out, background .6s, box-shadow .6s; }
.pmr-circle.tense { transform:scale(0.86); background:linear-gradient(160deg,#c88fdd,#a25fc0); box-shadow:0 6px 20px rgba(160,95,192,0.4); }
.pmr-circle.release { transform:scale(1.12); background:linear-gradient(160deg,#e7d3f0,#cdb0dd); box-shadow:0 10px 30px rgba(160,95,192,0.22); }
.pmr-num { font-family:${SERIF}; font-size:52px; font-weight:700; color:#fff; text-shadow:0 2px 6px rgba(80,40,100,0.3); }
.pmr-action { font-weight:800; font-size:18px; letter-spacing:1px; }
.pmr-action.tense { color:#9b4fbf; }
.pmr-action.release { color:#6fae7a; }
.pmr-cue { font-size:14px; color:${SUB}; max-width:300px; }
.pmr-doneT { font-family:${SERIF}; font-size:30px; font-weight:600; color:${INK}; }
.pmr-doneS { font-size:14px; color:${SUB}; max-width:300px; }
`;
