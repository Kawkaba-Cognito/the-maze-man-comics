/*
 * Procedural trivia — questions built from structured tables, not authored one
 * by one.
 *
 * ── Why this exists ──
 * The authored bank is 1,288 questions: about 4.3 hours of play at 12s each.
 * The brief was a bank that a daily player could not exhaust in ten years,
 * which is 6.6–16.4 MILLION questions depending on pace. Authoring cannot get
 * there — at a couple of minutes to write and translate one bilingual question
 * with a fact, ten million of them is a third of a million hours of writing.
 *
 * Combinatorics gets there trivially. Ask "which of these four is largest?" over
 * a table of n entities and there are C(n,4) distinct quadruples: 195 countries
 * on ONE attribute is 58,409,520 questions, and every quadruple is genuinely a
 * different thing to know rather than a reshuffle of the same one. Pair
 * questions, C(n,2), give a gentler tier from the same data.
 *
 * ── The part that makes them real questions ──
 * Combinatorics alone produces garbage: pick four countries at random and ask
 * which is biggest and you will regularly generate a coin-flip between two
 * near-identical values, or a "hardest" question that is actually unanswerable.
 * So every generated item is checked before it is offered:
 *
 *   • SEPARATION — the winner must beat the runner-up by a margin, so there is
 *     one defensible answer rather than an arguable one.
 *   • DISTINCTNESS — no duplicate options, and for mappings no distractor that
 *     is also correct (two countries can share a capital name; two elements
 *     cannot share a symbol, but the guard is cheap and the data will grow).
 *   • DIFFICULTY comes from the SPREAD, not from a hand-set number: four values
 *     an order of magnitude apart is an easy question, four within 20% is a hard
 *     one. That means the same table serves every tier honestly.
 *
 * Items come out in the authored shape — { d, en, ar, o, a, f } — so the engine,
 * the anti-repeat memory and the star grading need no special case.
 */

/** Deterministic shuffle so a seeded run is reproducible (Fisher-Yates). */
function shuffled(list, rnd) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** k distinct rows drawn without replacement. */
function sample(rows, k, rnd) {
  return shuffled(rows, rnd).slice(0, k);
}

/**
 * Is the winner clearly ahead of the runner-up?
 *
 * `minRatio` is per-attribute because "clearly bigger" is not one number: land
 * areas differ by orders of magnitude and a 10% gap is noise, while an atomic
 * number gap of 1 is exact and unarguable. A table declares what counts.
 */
function separated(values, minRatio) {
  const sorted = values.slice().sort((a, b) => b - a);
  if (sorted.length < 2) return false;
  const [top, next] = sorted;
  if (top === next) return false;
  if (!minRatio) return true;
  // Guard against a zero/negative runner-up before dividing.
  if (next <= 0) return top > 0;
  return top / next >= minRatio;
}

/** Spread across the four options → star rating. Wider spread = easier. */
function difficultyFromSpread(values) {
  const sorted = values.slice().sort((a, b) => b - a);
  const top = sorted[0];
  const next = sorted[1];
  if (next <= 0) return 2;
  const ratio = top / next;
  if (ratio >= 8) return 1;      // ★     an obvious outlier
  if (ratio >= 2.5) return 2;    // ★★    clear once you know the entities
  if (ratio >= 1.35) return 3;   // ★★★   needs real knowledge
  return 4;                      // ★★★★  expert: the values are close
}

const fill = (tpl, x) => tpl.replace('{x}', x);

/**
 * One superlative question: "which of these four has the most/least <attr>?"
 * Returns null when the draw does not make a fair question — the caller retries.
 */
function makeSuperlative(table, attr, rnd) {
  const rows = sample(table.rows, 4, rnd);
  if (rows.length < 4) return null;
  const values = rows.map((r) => r[attr.key]);
  if (values.some((v) => typeof v !== 'number' || !Number.isFinite(v))) return null;

  const most = rnd() < 0.5;
  const ordered = rows.slice().sort((a, b) => (most ? b[attr.key] - a[attr.key] : a[attr.key] - b[attr.key]));
  const compare = ordered.map((r) => r[attr.key]);
  // Separation is judged on the two that matter — the winner and the runner-up.
  if (!separated(most ? compare : compare.map((v) => -v), attr.minRatio)) return null;

  const winner = ordered[0];
  const names = rows.map((r) => [r.en, r.ar]);
  const answerIdx = rows.indexOf(winner);
  const prompt = most ? attr.most : attr.least;
  if (!prompt) return null;

  const unit = attr.unit ? ` ${attr.unit.en}` : '';
  const unitAr = attr.unit ? ` ${attr.unit.ar}` : '';
  return {
    d: difficultyFromSpread(compare.map(Math.abs)),
    en: prompt.en,
    ar: prompt.ar,
    o: names,
    a: answerIdx,
    f: {
      en: `${winner.en}: ${attr.format ? attr.format(winner[attr.key]) : winner[attr.key].toLocaleString()}${unit}.`,
      ar: `${winner.ar}: ${attr.format ? attr.format(winner[attr.key]) : winner[attr.key].toLocaleString()}${unitAr}.`,
    },
    gen: `${table.id}:${attr.key}:${most ? 'max' : 'min'}:${rows.map((r) => r.en).sort().join('|')}`,
  };
}

/** One mapping question: "what is the <relation> of <entity>?" */
function makeMapping(table, rel, rnd) {
  const pool = table.rows.filter((r) => r[rel.key]);
  if (pool.length < 4) return null;
  const [subject, ...rest] = sample(pool, 4, rnd);
  const answer = subject[rel.key];
  // A distractor that is also a correct answer makes the item unanswerable.
  if (rest.some((r) => r[rel.key].en === answer.en)) return null;

  const options = shuffled([answer, ...rest.map((r) => r[rel.key])], rnd);
  return {
    d: rel.d || 2,
    en: fill(rel.en, subject.en),
    ar: fill(rel.ar, subject.ar),
    o: options.map((v) => [v.en, v.ar]),
    a: options.findIndex((v) => v.en === answer.en),
    f: rel.fact
      ? { en: fill(rel.fact.en, subject.en).replace('{y}', answer.en), ar: fill(rel.fact.ar, subject.ar).replace('{y}', answer.ar) }
      : { en: `${subject.en} → ${answer.en}.`, ar: `${subject.ar} → ${answer.ar}.` },
    gen: `${table.id}:${rel.key}:${subject.en}`,
  };
}

/**
 * Draw `count` generated questions for a category.
 *
 * `seen` is the set of `gen` signatures already served — the caller passes the
 * game's anti-repeat memory so a generated item is no more likely to repeat than
 * an authored one. Retries are bounded: with millions of combinations a clash is
 * rare, and giving up quietly is better than spinning.
 */
export function generateFor(table, count, rnd, seen = new Set()) {
  const out = [];
  const numeric = table.numeric || [];
  const mappings = table.mappings || [];
  if (!numeric.length && !mappings.length) return out;

  let guard = count * 24;
  while (out.length < count && guard > 0) {
    guard -= 1;
    const useNumeric = numeric.length && (!mappings.length || rnd() < 0.65);
    const q = useNumeric
      ? makeSuperlative(table, numeric[Math.floor(rnd() * numeric.length)], rnd)
      : makeMapping(table, mappings[Math.floor(rnd() * mappings.length)], rnd);
    if (!q || seen.has(q.gen) || out.some((o) => o.gen === q.gen)) continue;
    out.push(q);
  }
  return out;
}

/**
 * How many distinct questions a table can produce — reported honestly rather
 * than advertised. Superlatives are C(n,4) per attribute per direction;
 * mappings are one per row.
 */
export function capacityOf(table) {
  const n = table.rows.length;
  const choose4 = n < 4 ? 0 : (n * (n - 1) * (n - 2) * (n - 3)) / 24;
  const sup = (table.numeric || []).reduce(
    (sum, a) => sum + choose4 * ((a.most ? 1 : 0) + (a.least ? 1 : 0)),
    0,
  );
  const map = (table.mappings || []).reduce(
    (sum, r) => sum + table.rows.filter((x) => x[r.key]).length,
    0,
  );
  return { superlative: sup, mapping: map, total: sup + map };
}
