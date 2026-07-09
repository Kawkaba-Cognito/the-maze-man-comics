import { CATEGORIES } from '../odd-one-out/data';

const GENERIC_WRONG = [
  { en: 'Both are metals', ar: 'كلاهما معدن' },
  { en: 'Both are liquids', ar: 'كلاهما سائل' },
  { en: 'Both are verbs', ar: 'كلاهما فعل' },
  { en: 'Both are seasons', ar: 'كلاهما فصل' },
  { en: 'Both are tools only', ar: 'كلاهما أداة فقط' },
  { en: 'Both are colours only', ar: 'كلاهما لون فقط' },
  { en: 'Both are buildings', ar: 'كلاهما مبنى' },
  { en: 'Both are weather events', ar: 'كلاهما حدث طقس' },
  { en: 'Both are identical words', ar: 'كلاهما نفس الكلمة' },
  { en: 'Both are numbers', ar: 'كلاهما رقم' },
];

function shuffle(a, rng) {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const pickOne = (a, rng) => a[Math.floor(rng() * a.length)];

function linkRuleFor(cat) {
  if (cat.linkRule) return cat.linkRule;
  const id = cat.id.replace(/-/g, ' ');
  return { en: `Both belong to the same group (${id})`, ar: `كلاهما ينتمي إلى نفس المجموعة (${id})` };
}

function pairRuleFor(cat) {
  if (cat.pairRule) return cat.pairRule;
  const id = cat.id.replace(/-/g, ' ');
  return { en: `Both are ${id}`, ar: `كلاهما ${id}` };
}

/** Procedural similarity from semantic categories. */
export function genSimilarity(rng, tier) {
  const cat = pickOne(CATEGORIES, rng);
  const members = shuffle(cat.members, rng);
  const a = members[0];
  const b = members[1];
  const correct = linkRuleFor(cat);
  const wrongPool = GENERIC_WRONG.filter((w) => w.en !== correct.en);
  const wrong = shuffle(wrongPool, rng).slice(0, 3);
  const id = `proc:sim:${cat.id}:${a.en}:${b.en}`;
  return {
    id,
    kind: 'similarity',
    tier,
    rel: 'category',
    a,
    b,
    correct,
    wrong,
  };
}

/** Procedural analogy: member : member :: member : ? within / across categories. */
export function genAnalogy(rng, tier) {
  const catAB = pickOne(CATEGORIES, rng);
  const mem = shuffle(catAB.members, rng);
  const stem = [mem[0], mem[1], mem[2] ?? mem[0]];
  let catCD = pickOne(CATEGORIES.filter((c) => c.id !== catAB.id), rng);
  const memCD = shuffle(catCD.members, rng);
  const correct = memCD[0];
  const wrong = shuffle(
    CATEGORIES.flatMap((c) => c.members)
      .filter((m) => m.en !== correct.en && m.en !== stem[2].en)
      .slice(0, 12),
    rng,
  ).slice(0, 3);
  const id = `proc:an:${catAB.id}:${stem[0].en}:${stem[1].en}:${stem[2].en}:${correct.en}`;
  return {
    id,
    kind: 'analogy',
    tier,
    rel: 'analogy',
    stem: [stem[0], stem[1], stem[2]],
    correct,
    wrong: wrong.length >= 3 ? wrong : GENERIC_WRONG.slice(0, 3).map((w) => ({ en: w.en, ar: w.ar })),
  };
}

/** Procedural pair match — two from one category, two distractors elsewhere. */
export function genPair(rng, tier) {
  const cat = pickOne(CATEGORIES, rng);
  const pairMem = shuffle(cat.members, rng).slice(0, 2);
  const others = CATEGORIES.filter((c) => c.id !== cat.id);
  const d1 = pickOne(pickOne(others, rng).members, rng);
  const d2 = pickOne(pickOne(others, rng).members, rng);
  const words = shuffle([...pairMem, d1, d2], rng);
  const pair = [words.indexOf(pairMem[0]), words.indexOf(pairMem[1])];
  const id = `proc:pair:${cat.id}:${pairMem[0].en}:${pairMem[1].en}`;
  return {
    id,
    kind: 'pair',
    tier,
    rel: 'pair',
    words,
    pair,
    rule: pairRuleFor(cat),
  };
}

export function genProcedural(kind, rng, tier) {
  if (kind === 'similarity') return genSimilarity(rng, tier);
  if (kind === 'analogy') return genAnalogy(rng, tier);
  if (kind === 'pair') return genPair(rng, tier);
  return null;
}

/** Rough upper bound on distinct procedural trials (for UI / docs). */
export function proceduralCapacity() {
  const n = CATEGORIES.length;
  const m = CATEGORIES[0]?.members?.length ?? 6;
  return {
    categories: n,
    oddCombos: n * (m * (m - 1) / 2) * (n - 1) * m,
    similarityCombos: n * (m * (m - 1) / 2),
    pairCombos: n * (m * (m - 1) / 2) * (n - 1) * m,
  };
}
