/*
 * validate-kawnera — structural checks on the authored Kawnera chapters.
 *
 * The whole point of authored content is that it is complete and honest: a
 * chapter that claims to be a written lesson but is missing its evidence, or
 * whose recall prompts are the same generic five the old build used, is worse
 * than one that admits it is still raw extract. Catch that here.
 *
 *   npm run validate:kawnera
 */
import { createServer } from 'vite';

const server = await createServer({
  configFile: false,
  server: { middlewareMode: true },
  logLevel: 'error',
});
const base = '/src/features/kawnera';
const { AUTHORED } = await server.ssrLoadModule(`${base}/authored/index.js`);
const { isAuthored, AUTHORED_FIELDS } = await server.ssrLoadModule(`${base}/authored/schema.js`);
const extracted = (await server.ssrLoadModule(`${base}/chapter-content.json?raw`)).default;
await server.close();

const bank = typeof extracted === 'string' ? JSON.parse(extracted) : extracted;

const problems = [];
const fail = (id, msg) => problems.push(`${id}: ${msg}`);

// Prompts that were identical across all 161 chapters in the old build. If one
// shows up in authored content, the chapter was not really written.
const GENERIC = [
  'state the chapter',
  'name one piece of evidence',
  'identify one limit',
  'apply the chapter',
];

for (const [bookId, chapters] of Object.entries(AUTHORED)) {
  const source = bank[bookId];
  if (!source) {
    fail(bookId, 'authored book has no matching entry in chapter-content.json');
    continue;
  }
  if (chapters.length !== source.length) {
    fail(bookId, `${chapters.length} authored chapters but the book has ${source.length}`);
  }

  chapters.forEach((c, i) => {
    const at = `${bookId}[${i + 1}]`;

    if (!isAuthored(c)) {
      const missing = AUTHORED_FIELDS.filter((f) => {
        const v = c?.[f];
        if (Array.isArray(v)) return v.length === 0;
        if (v && typeof v === 'object') return Object.keys(v).length === 0;
        return !v;
      });
      fail(at, `incomplete — missing ${missing.join(', ')}`);
      return;
    }

    // Page anchor must survive, or a reader cannot check a claim.
    if (!Array.isArray(c.pages) || c.pages.length !== 2 || c.pages[0] >= c.pages[1]) {
      fail(at, `pages ${JSON.stringify(c.pages)} is not a usable range`);
    }

    // A question, not a topic label.
    if (!c.question.trim().endsWith('?')) fail(at, 'question does not ask anything');

    // Enough substance to be a lesson rather than a stub.
    if (c.summary.split(/\s+/).length < 35) fail(at, 'summary is too thin to explain a chapter');
    if (c.recall.length < 3) fail(at, `only ${c.recall.length} recall prompt(s)`);

    // The bar: reading this should leave you understanding the REAL chapter.
    // A walkthrough that skips most of the chapter fails that, so scale the
    // required coverage to how long the chapter actually is — roughly one
    // section per four source pages, which is what the book itself runs at.
    const srcPages = c.pages[1] - c.pages[0];
    const wanted = Math.max(2, Math.round(srcPages / 4));
    if (c.sections.length < wanted) {
      fail(at, `${c.sections.length} sections for ${srcPages} source pages — expected about ${wanted}`);
    }

    c.sections.forEach((s, j) => {
      for (const f of ['n', 'title', 'body']) {
        if (!s?.[f]?.trim()) fail(at, `section ${j + 1} is missing ${f}`);
      }
      if (s?.body && s.body.split(/\s+/).length < 30) {
        fail(at, `section ${j + 1} ("${s.title}") is a stub, not an explanation`);
      }
      if (s?.points && s.points.some((p) => !p?.trim())) {
        fail(at, `section ${j + 1} has an empty point`);
      }
    });

    // Every term the chapter leans on has to be defined somewhere.
    if (c.terms.length < 2) fail(at, `only ${c.terms.length} glossary term(s)`);
    c.terms.forEach((tm, j) => {
      for (const f of ['term', 'meaning']) {
        if (!tm?.[f]?.trim()) fail(at, `term ${j + 1} is missing ${f}`);
      }
    });
    c.evidence.forEach((e, j) => {
      for (const f of ['study', 'did', 'found']) {
        if (!e?.[f]?.trim()) fail(at, `evidence ${j + 1} is missing ${f}`);
      }
    });
    for (const f of ['believed', 'actually']) {
      if (!c.misconception?.[f]?.trim()) fail(at, `misconception is missing ${f}`);
    }

    // Retrieval must be about THIS chapter.
    c.recall.forEach((r, j) => {
      const low = r.toLowerCase();
      if (GENERIC.some((g) => low.includes(g))) {
        fail(at, `recall ${j + 1} is one of the old generic prompts`);
      }
    });

    // ── the learning layer ──────────────────────────────────────────────
    const p = c.predict;
    for (const f of ['setup', 'question', 'reveal']) {
      if (!p?.[f]?.trim()) fail(at, `predict is missing ${f}`);
    }
    if (!Array.isArray(p?.options) || p.options.length < 3) {
      fail(at, 'predict needs at least 3 options to be a real guess');
    } else if (typeof p.answer !== 'number' || !p.options[p.answer]) {
      fail(at, `predict answer ${p.answer} does not point at an option`);
    }
    // The reveal has to explain, not just announce. A bare number teaches nothing.
    if (p?.reveal && p.reveal.split(/\s+/).length < 25) {
      fail(at, 'predict reveal states the answer without explaining it');
    }

    if (c.checks.length < 2) fail(at, `only ${c.checks.length} comprehension check(s)`);
    c.checks.forEach((chk, j) => {
      const where = `check ${j + 1}`;
      if (!chk?.q?.trim()) fail(at, `${where} has no question`);
      const opts = chk?.options || [];
      if (opts.length < 3) fail(at, `${where} has ${opts.length} options — too few to discriminate`);

      const correct = opts.filter((o) => o?.ok);
      if (correct.length !== 1) fail(at, `${where} has ${correct.length} correct options, needs exactly 1`);

      opts.forEach((o, k) => {
        if (!o?.t?.trim()) fail(at, `${where} option ${k + 1} has no text`);
        // THE point of this format: a wrong answer must teach why it is wrong.
        if (!o?.why?.trim()) fail(at, `${where} option ${k + 1} has no explanation`);
        else if (o.why.split(/\s+/).length < 8) {
          fail(at, `${where} option ${k + 1} explanation is too short to teach anything`);
        }
      });

      // Lazy option-writing tells: these give the answer away or dodge the work.
      if (opts.some((o) => /all of the above|none of the above/i.test(o?.t || ''))) {
        fail(at, `${where} uses an "all/none of the above" option`);
      }
      // A correct answer conspicuously longer than every distractor is guessable
      // on length alone, without understanding anything.
      const len = (o) => (o?.t || '').length;
      const right = opts.find((o) => o?.ok);
      const others = opts.filter((o) => !o?.ok);
      if (others.length && len(right) > Math.max(...others.map(len)) * 2.2) {
        fail(at, `${where} correct answer is far longer than every distractor — guessable by length`);
      }
    });
  });
}

const authoredCount = Object.values(AUTHORED).reduce((n, c) => n + c.length, 0);
const totalCount = Object.values(bank).reduce((n, c) => n + c.length, 0);

if (problems.length) {
  console.error(`validate:kawnera — ${problems.length} problem(s)\n`);
  problems.forEach((p) => console.error(`  ✗ ${p}`));
  process.exit(1);
}

console.log(
  `validate:kawnera — ${authoredCount}/${totalCount} chapters authored, all complete.`,
);
const words = (c) => {
  const parts = [c.summary, c.takeaway, ...c.recall];
  c.sections.forEach((s) => { parts.push(s.body, ...(s.points || [])); });
  c.terms.forEach((t) => parts.push(t.meaning));
  c.evidence.forEach((e) => parts.push(e.did, e.found));
  parts.push(c.misconception.believed, c.misconception.actually);
  return parts.join(' ').split(/\s+/).length;
};

for (const [bookId, chapters] of Object.entries(AUTHORED)) {
  const secs = chapters.reduce((n, c) => n + c.sections.length, 0);
  const tms = chapters.reduce((n, c) => n + c.terms.length, 0);
  const ev = chapters.reduce((n, c) => n + c.evidence.length, 0);
  const wc = chapters.reduce((n, c) => n + words(c), 0);
  console.log(`  · ${bookId.padEnd(12)} ${chapters.length} chapters · ${secs} sections · ${tms} terms · ${ev} studies · ${wc.toLocaleString()} words`);
  chapters.forEach((c, i) => {
    console.log(`      ch${String(i + 1).padStart(2)}  pp ${String(c.pages[0]).padStart(3)}–${String(c.pages[1]).padStart(3)}  ${String(c.sections.length).padStart(2)} sections  ${String(words(c)).padStart(5)} words`);
  });
}
const pending = Object.keys(bank).filter((b) => !AUTHORED[b]);
console.log(`  · still on source extracts: ${pending.join(', ')} (${totalCount - authoredCount} chapters)`);
