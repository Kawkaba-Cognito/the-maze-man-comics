import { createServer } from 'vite';

const server = await createServer({ appType: 'custom', server: { middlewareMode: true }, logLevel: 'error' });
let failures = 0;
function check(cond, msg) { if (!cond) { failures++; console.error('FAIL:', msg); } }

try {
  const eng = await server.ssrLoadModule('/src/features/puzzles/games/bridges/bridgesEngine.js');

  // Independent solution counter (natural edge order, need + crossing pruning).
  // Different implementation/order from the engine, so it's a genuine cross-check.
  function countSolutionsRef(st) {
    const { islands, edges, crossings } = st;
    const nIsl = islands.length;
    const needs = islands.map((i) => i.need);
    const E = edges.length;
    const incident = Array.from({ length: nIsl }, () => []);
    edges.forEach((e, i) => { incident[e.a].push(i); incident[e.b].push(i); });
    const val = new Int8Array(E).fill(-1);
    const sum = new Int16Array(nIsl);
    const rem = new Int16Array(nIsl);
    for (let k = 0; k < nIsl; k++) rem[k] = 2 * incident[k].length;
    const okk = (k) => sum[k] <= needs[k] && sum[k] + rem[k] >= needs[k];
    let count = 0;
    function connected() {
      const parent = [...Array(nIsl).keys()];
      const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
      for (let i = 0; i < E; i++) if (val[i] > 0) parent[find(edges[i].a)] = find(edges[i].b);
      const root = find(0);
      for (let k = 1; k < nIsl; k++) if (find(k) !== root) return false;
      return true;
    }
    function rec(pos) {
      if (count >= 3) return;
      if (pos === E) { if (connected()) count++; return; }
      const { a, b } = edges[pos];
      for (let v = 0; v <= 2; v++) {
        if (v > 0) { let bad = false; for (const j of crossings[pos]) if (val[j] > 0) { bad = true; break; } if (bad) continue; }
        val[pos] = v; sum[a] += v; sum[b] += v; rem[a] -= 2; rem[b] -= 2;
        if (okk(a) && okk(b)) rec(pos + 1);
        sum[a] -= v; sum[b] -= v; rem[a] += 2; rem[b] += 2; val[pos] = -1;
      }
    }
    rec(0);
    return count;
  }

  for (const tier of [7, 9, 11, 13]) {
    for (let s = 0; s < 12; s++) {
      const t0 = Date.now();
      const st = eng.generateBridges(tier, 1000 + tier * 31 + s);
      const dt = Date.now() - t0;
      check(st && st.islands.length >= eng.TIERS[tier].minIslands, `tier ${tier} seed ${s}: too few islands`);
      // clue numbers must equal the solution's incident bridge sums
      const sums = st.islands.map(() => 0);
      st.edges.forEach((e, i) => { sums[e.a] += st.solution[i]; sums[e.b] += st.solution[i]; });
      check(sums.every((v, k) => v === st.islands[k].need), `tier ${tier} seed ${s}: clue/solution mismatch`);
      // applying the solution must register as solved
      const solvedState = { ...st, player: st.solution.slice() };
      check(eng.isBridgesSolved(solvedState), `tier ${tier} seed ${s}: solution not accepted as solved`);
      // empty board must NOT be solved
      check(!eng.isBridgesSolved(st), `tier ${tier} seed ${s}: empty board marked solved`);
      // independent uniqueness check
      const n = countSolutionsRef(st);
      check(n === 1, `tier ${tier} seed ${s}: NOT unique (found ${n} solutions)`);
      check(dt < 1500, `tier ${tier} seed ${s}: slow generation ${dt}ms`);
      if (s === 0) console.log(`tier ${tier}: islands=${st.islands.length} edges=${st.edges.length} gen=${dt}ms uniq=${n}`);
    }
  }

  if (failures === 0) console.log('\nAll Bridges engine checks passed.');
  else console.error(`\n${failures} check(s) FAILED.`);
} finally {
  await server.close();
}
process.exit(failures === 0 ? 0 : 1);
