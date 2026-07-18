/**
 * Group War — training games teams can duel on.
 * Launch prefers passplay (fixed trials + onResult score). Some titles
 * use levels@hard for a tougher bout when difficulty is hard.
 */

export const WAR_GAMES = [
  {
    id: 'mot',
    en: 'Target Tracking',
    ar: 'تتبّع الأهداف',
    icon: '🎯',
    accent: '#5a9fd4',
    blurb: { en: 'Track the flashing targets through the crowd.', ar: 'تتبّع الأهداف الوامضة بين الباقي.' },
    loader: () => import('../../../training/domains/attention/games/mot').then((m) => m.MotEngine),
    trials: { easy: 3, med: 4, hard: 5 },
    hardMode: 'passplay',
  },
  {
    id: 'math-gates',
    en: 'Math Gates',
    ar: 'بوابات الحساب',
    icon: '🔢',
    accent: '#e8ac4e',
    blurb: { en: 'Race through arithmetic gates before they close.', ar: 'سابق بوابات الحساب قبل أن تُغلق.' },
    loader: () => import('../../../training/domains/speed/games/math-gates').then((m) => m.MathGatesEngine),
    trials: { easy: 6, med: 10, hard: 12 },
    // passplay ignores diff — use levels@hard for challenge
    hardMode: 'levels',
    hardLevel: 40,
  },
  {
    id: 'paired-associates',
    en: 'Pair Match',
    ar: 'مطابقة الأزواج',
    icon: '🧩',
    accent: '#b696d4',
    blurb: { en: 'Remember where each symbol hid.', ar: 'تذكّر أين اختبأ كل رمز.' },
    loader: () => import('../../../training/domains/memory/games/paired-associates').then((m) => m.PalEngine),
    trials: { easy: 2, med: 3, hard: 4 },
    hardMode: 'passplay',
  },
  {
    id: 'story-grid',
    en: 'Story Time',
    ar: 'وقت القصة',
    icon: '📖',
    accent: '#d46a8a',
    blurb: { en: 'Watch the story, then rebuild it in order.', ar: 'شاهد القصة ثم أعد بناءها بالترتيب.' },
    loader: () => import('../../../training/domains/memory/games/story-grid').then((m) => m.StoryEngine),
    trials: { easy: 1, med: 2, hard: 3 },
    hardMode: 'passplay',
  },
  {
    id: 'trivia',
    en: 'Trivia',
    ar: 'أسئلة عامة',
    icon: '❓',
    accent: '#49a078',
    blurb: { en: 'Climb the knowledge stairs — one miss ends the climb.', ar: 'تسلّق سلّم المعرفة — خطأ واحد يوقفك.' },
    loader: () => import('../../../training/domains/language/games/trivia').then((m) => m.TriviaEngine),
    trials: { easy: 1, med: 1, hard: 1 },
    hardMode: 'levels',
    hardLevel: 1,
  },
  {
    id: 'synonyms',
    en: 'Word Links',
    ar: 'روابط الكلمات',
    icon: '🔗',
    accent: '#5ec6a0',
    blurb: { en: 'Link words that belong together — fast.', ar: 'اربط الكلمات المترابطة — بسرعة.' },
    loader: () => import('../../../training/domains/language/games/synonyms').then((m) => m.WordLinksEngine),
    trials: { easy: 6, med: 8, hard: 10 },
    hardMode: 'passplay', // already hard tier in passplay
  },
  {
    id: 'detective',
    en: 'Detective',
    ar: 'المحقّق',
    icon: '🕵️',
    accent: '#c0433d',
    blurb: { en: 'Crack the case — accuse the right suspect.', ar: 'حلّ القضية — اتّهم المشتبه الصحيح.' },
    loader: () => import('../../../training/domains/reasoning/games/detective/CaseFileEngine').then((m) => m.default),
    trials: { easy: 1, med: 1, hard: 2 },
    hardMode: 'passplay',
  },
  {
    id: 'brixton',
    en: 'Kawkab Hops',
    ar: 'قفزات كوكب',
    icon: '🪐',
    accent: '#7b2cbf',
    blurb: { en: 'Watch Kawkab hop, then continue the shifting rule.', ar: 'راقب قفزات كوكب ثم أكمل القاعدة المتغيّرة.' },
    loader: () => import('../../../training/domains/flexibility/games/brixton').then((m) => m.BrixtonEngine),
    trials: { easy: 4, med: 6, hard: 8 },
    hardMode: 'passplay',
  },
];

export function warGameById(id) {
  return WAR_GAMES.find((g) => g.id === id) || null;
}

/** Build engine launch props for a fair same-seed bout. */
export function launchPropsFor(game, diff, seed) {
  const trials = game.trials[diff] ?? game.trials.med;
  if (diff === 'hard' && game.hardMode === 'levels') {
    return {
      mode: 'levels',
      diff: 'hard',
      level: game.hardLevel ?? 1,
      seed,
      attempt: null,
    };
  }
  return {
    mode: 'passplay',
    diff: diff === 'easy' ? 'easy' : diff === 'hard' ? 'hard' : 'med',
    level: null,
    seed,
    attempt: { trials },
  };
}

/** Placement points: 1st = n, 2nd = n-1, … ties share the average. */
export function placementPoints(scores /* [{ teamIdx, score }] */, higherBetter = true) {
  const n = scores.length;
  const ranked = [...scores].sort((a, b) => (
    higherBetter ? (b.score - a.score) : (a.score - b.score)
  ));
  const pts = Array(n).fill(0);
  let i = 0;
  while (i < ranked.length) {
    let j = i;
    while (j < ranked.length && ranked[j].score === ranked[i].score) j += 1;
    const share = [];
    for (let k = i; k < j; k += 1) share.push(n - k);
    const avg = share.reduce((s, x) => s + x, 0) / share.length;
    for (let k = i; k < j; k += 1) pts[ranked[k].teamIdx] = avg;
    i = j;
  }
  return pts;
}
