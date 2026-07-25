/*
 * validate-noir — structural checks on the Detective Kawkab noir cases.
 *
 * These cases are hand-authored and heavily cross-referenced: a lie points at
 * a clue id, a clue is reached through a hotspot, a testimony is unlocked by
 * one lie and required by another, and the accusation names an option from
 * each of four lists. A single typo makes a case quietly unsolvable — the
 * player would break every lie and still be unable to finish. Catch it here.
 *
 *   npm run validate:noir
 */
import { createServer } from 'vite';

const server = await createServer({
  configFile: false,
  server: { middlewareMode: true },
  logLevel: 'error',
});
const { NOIR_CASES } = await server.ssrLoadModule(
  '/src/features/training/domains/reasoning/games/detective/noir/cases/index.js',
);
const { CAST } = await server.ssrLoadModule('/src/features/training/shared/castRoster.js');
const { SCENES } = await server.ssrLoadModule(
  '/src/features/training/domains/reasoning/games/detective/noir/scenes/index.js',
);
await server.close();

const problems = [];
const fail = (caseId, msg) => problems.push(`${caseId}: ${msg}`);

/** Every authored string must carry both languages — there is no fallback. */
function checkBilingual(caseId, where, value) {
  if (value == null) return;
  if (typeof value === 'string') {
    fail(caseId, `${where} is a bare string, expected { en, ar }`);
    return;
  }
  if (!value.en || !value.ar) fail(caseId, `${where} is missing ${value.en ? 'ar' : 'en'}`);
}

for (const c of NOIR_CASES) {
  const clueIds = new Set(Object.keys(c.clues || {}));
  const testimonyIds = new Set(Object.keys(c.testimony || {}));
  const suspectIds = new Set(c.suspects.map((s) => s.id));

  checkBilingual(c.id, 'title', c.title);
  checkBilingual(c.id, 'setting', c.setting);
  checkBilingual(c.id, 'victim.line', c.victim?.line);

  // ── cast ──────────────────────────────────────────────────────────────
  for (const s of c.suspects) {
    if (!CAST[s.id]) fail(c.id, `suspect "${s.id}" is not a cast member`);
    checkBilingual(c.id, `suspect ${s.id} name`, s.name);
    checkBilingual(c.id, `suspect ${s.id} role`, s.role);
    if (!s.qs?.length) fail(c.id, `suspect "${s.id}" has no questions`);
    if (!s.lies?.length) fail(c.id, `suspect "${s.id}" has no lies`);
    (s.qs || []).forEach((q, i) => {
      checkBilingual(c.id, `${s.id} q${i}`, q.q);
      checkBilingual(c.id, `${s.id} a${i}`, q.a);
    });
  }
  if (new Set(c.suspects.map((s) => s.id)).size !== c.suspects.length) {
    fail(c.id, 'duplicate suspect ids — each cast member can only appear once');
  }

  // ── hotspots reach every clue exactly once ────────────────────────────
  const reachable = new Set();
  for (const h of c.hotspots) {
    checkBilingual(c.id, `hotspot ${h.id} name`, h.name);
    if (h.clue) {
      if (!clueIds.has(h.clue)) fail(c.id, `hotspot "${h.id}" points at unknown clue "${h.clue}"`);
      if (reachable.has(h.clue)) fail(c.id, `clue "${h.clue}" is reachable from two hotspots`);
      reachable.add(h.clue);
    } else if (!h.quirk?.length) {
      fail(c.id, `hotspot "${h.id}" has neither a clue nor quirk lines`);
    }
    if (h.pos == null || h.pos.x == null || h.pos.y == null) fail(c.id, `hotspot "${h.id}" has no position`);
  }

  // The drawn room owns hotspot placement — every hotspot needs an anchor, or
  // it will float somewhere arbitrary instead of sitting on its prop.
  const scene = SCENES[c.id];
  if (!scene) {
    fail(c.id, 'no drawn scene — the room would fall back to an empty box');
  } else {
    for (const h of c.hotspots) {
      const a = scene.anchors[h.id];
      if (!a) fail(c.id, `hotspot "${h.id}" has no anchor in the drawn room`);
      else if (a.x < 3 || a.x > 97 || a.y < 5 || a.y > 95) {
        fail(c.id, `anchor for "${h.id}" (${a.x}%, ${a.y}%) is too close to the edge to tap`);
      }
    }
    for (const key of Object.keys(scene.anchors)) {
      if (!c.hotspots.some((h) => h.id === key)) {
        fail(c.id, `the room anchors "${key}", which is not a hotspot in this case`);
      }
    }
  }
  for (const id of clueIds) {
    if (!reachable.has(id)) fail(c.id, `clue "${id}" is unreachable — no hotspot yields it`);
  }

  // ── lies: solvable, and unlocks that go somewhere ─────────────────────
  const unlocked = new Set();
  for (const s of c.suspects) {
    for (const lie of s.lies) {
      checkBilingual(c.id, `${s.id} lie claim`, lie.claim);
      checkBilingual(c.id, `${s.id} lie hint`, lie.hint);
      if (!lie.needs) fail(c.id, `a lie of "${s.id}" needs no evidence — it can never be pressed`);
      else if (!clueIds.has(lie.needs) && !testimonyIds.has(lie.needs)) {
        fail(c.id, `lie of "${s.id}" needs "${lie.needs}", which is neither a clue nor a testimony`);
      }
      if (!lie.seq?.length) fail(c.id, `lie of "${s.id}" has no confrontation sequence`);
      (lie.seq || []).forEach((line, i) => {
        checkBilingual(c.id, `${s.id} lie seq[${i}]`, line.t);
        if (line.w !== 'n' && line.w !== 'kawkab' && !suspectIds.has(line.w)) {
          fail(c.id, `lie of "${s.id}" seq[${i}] is spoken by unknown "${line.w}"`);
        }
      });
      if (lie.unlocks) {
        if (!testimonyIds.has(lie.unlocks)) fail(c.id, `lie of "${s.id}" unlocks unknown testimony "${lie.unlocks}"`);
        if (unlocked.has(lie.unlocks)) fail(c.id, `testimony "${lie.unlocks}" is unlocked twice`);
        unlocked.add(lie.unlocks);
      }
      for (const key of Object.keys(lie.wrong || {})) {
        if (key !== 'def' && !clueIds.has(key)) fail(c.id, `"${s.id}" has a wrong-evidence reply for unknown clue "${key}"`);
      }
    }
    if (!s.wrong?.def) fail(c.id, `suspect "${s.id}" has no default wrong-evidence reply`);
    for (const key of Object.keys(s.wrong || {})) {
      if (key !== 'def' && !clueIds.has(key) && !testimonyIds.has(key)) {
        fail(c.id, `"${s.id}" wrong-evidence key "${key}" is not a clue`);
      }
    }
  }

  // A testimony required by a lie must actually be unlockable, and unlocking
  // it must not depend on itself — otherwise the case deadlocks.
  for (const t of testimonyIds) {
    if (!unlocked.has(t)) fail(c.id, `testimony "${t}" is never unlocked by any lie`);
  }
  for (const s of c.suspects) {
    for (const lie of s.lies) {
      if (!testimonyIds.has(lie.needs)) continue;
      const source = c.suspects.flatMap((x) => x.lies).find((l) => l.unlocks === lie.needs);
      if (source === lie) fail(c.id, `lie of "${s.id}" requires the testimony it unlocks itself`);
    }
  }

  // ── the accusation must be reachable ──────────────────────────────────
  const sol = c.solution || {};
  if (!suspectIds.has(sol.who)) fail(c.id, `solution.who "${sol.who}" is not a suspect`);
  if (!c.board.how.some((o) => o.v === sol.how)) fail(c.id, `solution.how "${sol.how}" is not on the board`);
  if (!c.board.why.some((o) => o.v === sol.why)) fail(c.id, `solution.why "${sol.why}" is not on the board`);
  if (!clueIds.has(sol.proof)) fail(c.id, `solution.proof "${sol.proof}" is not a clue`);
  else if (!reachable.has(sol.proof)) fail(c.id, `solution.proof "${sol.proof}" cannot be found in the scene`);
  ['how', 'why'].forEach((axis) => {
    c.board[axis].forEach((o, i) => checkBilingual(c.id, `board.${axis}[${i}]`, o.l));
    if (c.board[axis].length < 3) fail(c.id, `board.${axis} needs at least 3 options to be a real choice`);
  });

  if (!c.intro?.length) fail(c.id, 'no intro cutscene');
  if (!c.ending?.length) fail(c.id, 'no ending cutscene');
  [...(c.intro || []), ...(c.ending || [])].forEach((line, i) => {
    checkBilingual(c.id, `cutscene line ${i}`, line.t);
    if (line.w !== 'n' && line.w !== 'kawkab' && !suspectIds.has(line.w)) {
      fail(c.id, `cutscene line ${i} is spoken by unknown "${line.w}"`);
    }
  });
  for (const [id, clue] of Object.entries(c.clues)) {
    checkBilingual(c.id, `clue ${id} name`, clue.name);
    checkBilingual(c.id, `clue ${id} desc`, clue.desc);
    checkBilingual(c.id, `clue ${id} narr`, clue.narr);
  }
}

const lieTotal = NOIR_CASES.reduce((n, c) => n + c.suspects.reduce((k, s) => k + s.lies.length, 0), 0);
if (problems.length) {
  console.error(`validate:noir — ${problems.length} problem(s)\n`);
  problems.forEach((p) => console.error(`  ✗ ${p}`));
  process.exit(1);
}
console.log(`validate:noir — ${NOIR_CASES.length} cases, ${lieTotal} lies, all wiring resolves.`);
NOIR_CASES.forEach((c) => {
  const lies = c.suspects.reduce((n, s) => n + s.lies.length, 0);
  console.log(`  · tier ${c.tier}  ${c.id.padEnd(12)} ${c.suspects.length} suspects · ${Object.keys(c.clues).length} clues · ${lies} lies`);
});
