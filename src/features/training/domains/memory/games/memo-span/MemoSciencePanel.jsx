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
