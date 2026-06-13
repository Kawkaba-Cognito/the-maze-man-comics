import { createServer } from 'vite';
const server = await createServer({ appType: 'custom', server: { middlewareMode: true }, logLevel: 'error' });
const base = '/src/features/training/domains/reasoning/games/tower-hanoi';
const E = await server.ssrLoadModule(`${base}/colourSortEngine.js`);
const D = await server.ssrLoadModule(`${base}/colourSortData.js`);
const fail = [];
const ck = (c, m) => { if (!c) fail.push(m); };

const key = (pegs) => pegs.map((p) => p.map((d) => d.c * 100 + d.s).join('.')).sort().join('|');
// Independent BFS min-moves (separate loop from the engine's) to cross-check par.
function indepMinMoves(pegs, cap, nodeCap = 2500000) {
  if (E.isSolved(pegs)) return 0;
  const seen = new Set([key(pegs)]);
  let frontier = [pegs], depth = 0, nodes = 0;
  while (frontier.length) {
    const next = [];
    for (const cur of frontier) {
      if (++nodes > nodeCap) return null;
      for (const [f, t] of E.legalMoves(cur, cap)) {
        const r = E.applyMove({ pegs: cur, cap, moves: 0 }, f, t).state.pegs;
        if (E.isSolved(r)) return depth + 1;
        const k = key(r); if (!seen.has(k)) { seen.add(k); next.push(r); }
      }
    }
    frontier = next; depth++;
  }
  return null;
}

try {
  // ── move rules (cap-aware) ──
  ck(E.isSolved(E.makeSolved(3, 3, 5)), 'makeSolved should be solved');
  const crafted = [[{ c: 0, s: 2 }], [{ c: 0, s: 1 }], []];
  ck(E.canMove(crafted, 1, 0, 3), 'same colour smaller(1) on larger(2) allowed');
  ck(!E.canMove(crafted, 0, 1, 3), 'bigger(2) on smaller(1) blocked');
  ck(E.canMove(crafted, 0, 2, 3), 'onto empty tube allowed');
  ck(!E.canMove([[{ c: 1, s: 3 }], [{ c: 0, s: 1 }], []], 1, 0, 3), 'different colour blocked');
  ck(!E.canMove([[{ c: 0, s: 2 }, { c: 0, s: 1 }], []], 1, 0, 2), 'full tube (cap 2) blocked');
  ck(!E.isSolved([[{ c: 0, s: 2 }], [{ c: 0, s: 1 }], [{ c: 1, s: 1 }], []]), 'colour split is not solved');

  // ── determinism ──
  const g1 = E.generateColourSort({ ...D.colourSortLevelSpec('medium', 8), seed: 321 });
  const g2 = E.generateColourSort({ ...D.colourSortLevelSpec('medium', 8), seed: 321 });
  ck(key(g1.pegs) === key(g2.pegs) && g1.par === g2.par, 'generation deterministic');

  // ── well-mixed, solvable, true-optimal par across tiers/levels ──
  let parMismatch = 0, parChecked = 0, maxMs = 0, minDistOk = true;
  const curve = {}, distReport = {};
  const t0 = Date.now();
  for (const diff of D.CS_DIFF_KEYS) {
    for (const lv of [1, 10, 20]) {
      const spec = D.colourSortLevelSpec(diff, lv);
      let parSum = 0, distSum = 0;
      for (let s = 0; s < 5; s++) {
        const ts = Date.now();
        const g = E.generateColourSort({ ...spec, seed: 9000 + lv * 41 + s });
        maxMs = Math.max(maxMs, Date.now() - ts);
        ck(!E.isSolved(g.pegs), `gen ${diff}-${lv}s${s}: not solved at start`);
        ck(g.par >= 2, `gen ${diff}-${lv}s${s}: TRIVIAL par=${g.par}`);
        ck(g.pegs.length === spec.pegs && g.cap === spec.sizes, `gen ${diff}-${lv}: shape`);
        // THE FIX: every colour must be disturbed (not "all sorted except one")
        if (g.disturbed < spec.minDisturbed) { minDistOk = false; ck(false, `gen ${diff}-${lv}s${s}: only ${g.disturbed}/${spec.colours} disturbed`); }
        const mm = indepMinMoves(g.pegs, g.cap);
        if (mm !== null) { parChecked++; if (mm !== g.par) parMismatch++; }
        parSum += g.par; distSum += g.disturbed;
      }
      curve[`${diff}-${lv}`] = (parSum / 5).toFixed(1);
      distReport[`${diff}-${lv}`] = `${(distSum / 5).toFixed(1)}/${spec.colours}`;
    }
  }
  ck(parMismatch === 0, `par != independent min-moves on ${parMismatch}/${parChecked}`);
  ck(minDistOk, 'some puzzles under-mixed');
  ck(+curve['easy-1'] <= 9 && +curve['hard-20'] >= 18, `difficulty curve off: easy1 ${curve['easy-1']}, hard20 ${curve['hard-20']}`);
  console.log('  par curve  :', JSON.stringify(curve));
  console.log('  disturbed  :', JSON.stringify(distReport));
  console.log(`  gen: par=true-optimal (cross-checked ${parChecked}), slowest ${maxMs}ms, total ${Date.now() - t0}ms`);

  // ── grading + unlock ──
  for (const diff of D.CS_DIFF_KEYS) for (let lv = 1; lv <= D.CS_LEVELS_PER_TIER; lv++) {
    const par = D.colourSortLevelSpec(diff, lv).minPar;
    ck(D.gradeColourSort(par, par, true).stars === 3, `grade optimal=3star ${diff}-${lv}`);
    ck(!D.gradeColourSort(999, par, false).won, `grade unsolved=loss ${diff}-${lv}`);
  }
  ck(D.isColourSortLevelUnlocked('easy', 1, {}) && !D.isColourSortLevelUnlocked('easy', 2, {}), 'unlock chain');
  ck(D.colourSortChallengeScore(10, 10, true) === 100 && D.colourSortChallengeScore(0, 10, false) === 0, 'challenge score');
  console.log('  data: grading + unlock OK');

  console.log(fail.length ? `\n✗ ${fail.length} FAILURES:\n` + fail.slice(0, 25).join('\n') : '\n✓ ALL COLOUR-SORT TESTS PASSED');
} finally { await server.close(); }
