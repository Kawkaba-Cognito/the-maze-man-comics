import React, { useMemo, useState } from 'react';
import { REFLECTION_QUESTIONS, getReflection, saveReflection, weekKey } from './habitState';

const INK = '#2d2210';
const SUB = '#524b3f';
const LINE = '#e3d6c4';
const CARD = '#fffdf8';
const GOLD = '#b9842f';
const SERIF = "'Cormorant Garamond', Georgia, serif";

export default function HabitReflectTab({ isAr, st, setSt, playSfx }) {
  const wk = weekKey();
  const saved = useMemo(() => getReflection(st, wk), [st, wk]);
  const [answers, setAnswers] = useState(() => {
    const d = {};
    REFLECTION_QUESTIONS.forEach((q) => { d[q.id] = saved?.[q.id] || ''; });
    return d;
  });
  const [flash, setFlash] = useState(false);

  const t = {
    title: isAr ? 'تأمّل أسبوعي' : 'Weekly reflection',
    sub: isAr ? '5 دقائق — لاحظ ما ينجح وعدّل بلطف.' : '5 minutes — notice what works, adjust with compassion.',
    save: isAr ? 'حفظ' : 'Save',
    saved: isAr ? 'تم الحفظ!' : 'Saved!',
    prior: isAr ? 'محفوظ هذا الأسبوع' : 'Saved this week',
    sourcesTitle: isAr ? 'من أين تأتي هذه الأفكار' : 'Where these ideas come from',
    sourcesBody: isAr
      ? 'صياغة "العادات أصوات" و"لا تفوّت مرتين" وتسلسل العادات مأخوذة من James Clear؛ وفكرة البدء بخطوة صغيرة جداً من BJ Fogg. وهذه أطر شائعة ومفيدة، لا نتائج تجريبية. أمّا الجزء الذي يسنده بحث قوي فهو بنية "بعد أن… سأ…" نفسها: تُسمّى نوايا التنفيذ، وقد وجد تحليل بريدي شمل أكثر من ٩٠ دراسة أنها تُحسّن المتابعة الفعلية بفارق ملموس (Gollwitzer & Sheeran, 2006). ولهذا تطلب منك كل عادة هنا مرتكزاً، لا مجرد نيّة.'
      : 'The "habits are votes" framing, "never miss twice" and habit stacking come from James Clear; starting absurdly small comes from BJ Fogg. Those are popular frameworks, not experimental findings. The part with strong evidence behind it is the "After I… I will…" structure itself: those are implementation intentions, and a meta-analysis of over 90 studies found they produce a substantial improvement in actually following through (Gollwitzer & Sheeran, 2006). That is why every habit here asks you for an anchor rather than just an intention.',
  };

  const onSave = () => {
    playSfx?.('collect');
    setSt(saveReflection(answers, wk));
    setFlash(true);
    setTimeout(() => setFlash(false), 2000);
  };

  const hasContent = Object.values(answers).some((v) => v.trim());

  return (
    <div className="hb-reflect">
      <div className="hb-reflect-head">
        <div className="hb-reflect-title serif">{t.title}</div>
        <p className="hb-reflect-sub">{t.sub}</p>
        {saved && <div className="hb-reflect-badge">✓ {t.prior}</div>}
      </div>
      {REFLECTION_QUESTIONS.map((q) => (
        <label key={q.id} className="hb-reflect-q">
          <span>{isAr ? q.ar : q.en}</span>
          <textarea
            rows={3}
            value={answers[q.id]}
            onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
            placeholder="…"
          />
        </label>
      ))}
      <button
        type="button"
        className="hb-reflect-save"
        disabled={!hasContent}
        onClick={onSave}
      >
        {flash ? t.saved : t.save}
      </button>

      {/* ⚠ ATTRIBUTION (2026-09-07). This module's vocabulary is borrowed and was
          uncredited: "habits are votes for the person you want to be", "never
          miss twice" and habit stacking are James Clear; starting absurdly small
          is BJ Fogg. Meanwhile the ONE mechanic here with a real evidence base —
          the if-then anchor, which is an implementation intention — was never
          named, so the app was borrowing others' words while giving away its own
          strongest claim. Both fixed here. */}
      <div className="hb-sources">
        <div className="hb-sources-title">{t.sourcesTitle}</div>
        <p>{t.sourcesBody}</p>
      </div>
    </div>
  );
}

export const REFLECT_TAB_CSS = `
.hb-reflect-head { margin-bottom:18px; }
.hb-reflect-title { font-family:${SERIF}; font-size:28px; font-weight:600; color:${INK}; margin-bottom:6px; }
.hb-reflect-sub { font-size:13px; color:${SUB}; margin:0 0 10px; line-height:1.45; }
.hb-reflect-badge { display:inline-block; padding:4px 10px; border-radius:999px; background:#e8f5ea; color:#3a7a48; font-size:12px; font-weight:800; }
.hb-reflect-q { display:block; margin-bottom:16px; }
.hb-reflect-q span { display:block; font-size:14px; font-weight:800; color:${INK}; margin-bottom:6px; line-height:1.4; }
.hb-reflect-q textarea { width:100%; padding:12px; border-radius:12px; border:2px solid ${LINE}; background:${CARD}; font-size:14px; font-family:inherit; color:${INK}; resize:vertical; min-height:72px; }
.hb-reflect-save { width:100%; padding:14px; border-radius:12px; border:none; background:linear-gradient(135deg,#c89a4a,${GOLD}); color:#201d18; font-size:15px; font-weight:800; cursor:pointer; font-family:inherit; }
.hb-reflect-save:disabled { opacity:0.45; cursor:not-allowed; }
.hb-sources { margin-top:20px; padding:13px 15px; border-radius:13px; border:1px solid ${LINE}; background:${CARD}; }
.hb-sources-title { font-size:12px; font-weight:800; letter-spacing:0.5px; color:${INK}; margin-bottom:5px; }
.hb-sources p { margin:0; font-size:12px; color:${SUB}; line-height:1.65; }
.serif { font-family:${SERIF}; }
`;
