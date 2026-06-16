import React from 'react';

/**
 * "Why this trains your brain" — surfaces the neuroscience behind the Memory
 * domain so it reads like a real cognitive-training tool, not just a game.
 */
const CONTENT = {
  en: {
    title: 'The science',
    intro: 'Every mode here targets a well-studied memory system. Here is what each one trains and why it matters.',
    sections: [
      { h: '🧱 Span (Corsi block-tapping)', b: 'Reproducing a sequence of lit cells is the Corsi test (Corsi, 1972) — the standard measure of visuospatial short-term memory. The number you can hold is your span.' },
      { h: '🔄 Forward vs. reverse', b: 'Forward recall is storage; reverse recall forces you to hold AND manipulate the sequence — true working memory, driven by the dorsolateral prefrontal cortex (Baddeley’s central executive).' },
      { h: '🔗 Object–location binding', b: 'Remembering which object sat where engages the hippocampus, which binds “what” with “where” into a single memory — the system that fails first in aging.' },
      { h: '🎯 N-Back', b: 'Responding when an item matches one N steps back is the n-back task (Kirchner, 1958; Jaeggi et al., 2008) — the most-studied working-memory trainer. It taxes continuous updating and interference control.' },
      { h: '📈 Adaptive difficulty', b: 'Difficulty tracks your accuracy so you train at the edge of your ability — the condition shown to drive the largest working-memory gains.' },
    ],
    foot: 'Train a few minutes daily. Working memory improves with spaced, adaptive practice.',
    close: 'Got it',
  },
  ar: {
    title: 'العلم وراء اللعبة',
    intro: 'كل وضع هنا يستهدف نظام ذاكرة مدروساً جيداً. إليك ما يدرّبه كلٌّ منها ولماذا يهمّ.',
    sections: [
      { h: '🧱 المدى (اختبار كورسي)', b: 'إعادة تسلسل الخلايا المضيئة هو اختبار كورسي (1972) — المقياس المعياري للذاكرة البصرية-المكانية قصيرة المدى. ما تستطيع حفظه هو «مداك».' },
      { h: '🔄 المباشر مقابل المعكوس', b: 'الاستدعاء المباشر تخزين؛ أما المعكوس فيجبرك على الحفظ والمعالجة معاً — ذاكرة عاملة حقيقية يقودها القشرة الجبهية الظهرية الوحشية.' },
      { h: '🔗 ربط الشيء بالمكان', b: 'تذكّر أي شيء كان في أي مكان يُشغّل الحُصين الذي يربط «ماذا» بـ«أين» في ذكرى واحدة — وهو أول ما يضعف مع التقدّم في العمر.' },
      { h: '🎯 العودة-N', b: 'الاستجابة عندما يطابق عنصرٌ ما ظهر قبل N خطوات هي مهمة n-back (1958؛ ياغي وآخرون 2008) — أكثر مدرّبات الذاكرة العاملة دراسةً.' },
      { h: '📈 الصعوبة التكيّفية', b: 'تتبع الصعوبة دقّتك لتتدرّب عند حافة قدرتك — وهو الشرط الذي يحقّق أكبر المكاسب.' },
    ],
    foot: 'تدرّب بضع دقائق يومياً. تتحسّن الذاكرة العاملة بالتدريب المتباعد والتكيّفي.',
    close: 'فهمت',
  },
};

export default function MemoSciencePanel({ isAr, onClose }) {
  const c = isAr ? CONTENT.ar : CONTENT.en;
  return (
    <div className="ct-ms-sci-ov" role="dialog" aria-modal="true" dir={isAr ? 'rtl' : 'ltr'} onClick={onClose}>
      <div className="ct-ms-sci" onClick={(e) => e.stopPropagation()}>
        <h2 className="ct-ms-sci-title">{c.title}</h2>
        <p className="ct-ms-sci-intro">{c.intro}</p>
        <div className="ct-ms-sci-list">
          {c.sections.map((s) => (
            <div key={s.h} className="ct-ms-sci-item">
              <div className="ct-ms-sci-h">{s.h}</div>
              <div className="ct-ms-sci-b">{s.b}</div>
            </div>
          ))}
        </div>
        <p className="ct-ms-sci-foot">{c.foot}</p>
        <button type="button" className="ct-fq-btn ct-fq-btn-pri" onClick={onClose}>{c.close}</button>
      </div>
    </div>
  );
}

/** Rotating evidence-based memory strategy tips, shown between rounds. */
export const MEMO_TIPS = {
  en: [
    '💡 Chunk items into groups of 3–4 — your memory holds chunks, not singles.',
    '💡 Link the objects into a quick story; narrative beats rote rehearsal.',
    '💡 Say the order silently as it plays — verbal rehearsal anchors it.',
    '💡 Picture a path through the cells; spatial routes are sticky (memory palace).',
    '💡 Don’t panic on a miss — accuracy at your edge is what builds memory.',
  ],
  ar: [
    '💡 جمّع العناصر في مجموعات من ٣–٤ — الذاكرة تحفظ مجموعات لا أفراداً.',
    '💡 اربط الأشياء في قصة سريعة؛ السرد أقوى من التكرار الآلي.',
    '💡 ردّد الترتيب بصمت أثناء عرضه — التكرار اللفظي يثبّته.',
    '💡 تخيّل مساراً بين الخلايا؛ المسارات المكانية تثبت (قصر الذاكرة).',
    '💡 لا تقلق من خطأ — الدقّة عند حدّك هي ما يبني الذاكرة.',
  ],
};

export function memoTip(isAr, seed = Date.now()) {
  const arr = isAr ? MEMO_TIPS.ar : MEMO_TIPS.en;
  return arr[Math.floor(seed) % arr.length];
}
