/*
 * validate-stage — structural checks on the Story Time staged stories.
 *
 * These stories drive a 3D performance, so a typo does not merely read oddly —
 * an unknown cast id or an `act` that is not in the clip library means an actor
 * silently never appears or never moves, and the player is asked to order beats
 * they could not see. Catch it here.
 *
 *   npm run validate:stage
 */
import { createServer } from 'vite';

const server = await createServer({
  configFile: false,
  server: { middlewareMode: true },
  logLevel: 'error',
});
const base = '/src/features/training/domains/memory/games/story-grid/stage';
const { STAGE_STORIES } = await server.ssrLoadModule(`${base}/stories/index.js`);
const { SKY_IDS } = await server.ssrLoadModule(`${base}/schema.js`);
const { CAST, STORY_ACTS, ACTIONS } = await server.ssrLoadModule(
  '/src/features/training/shared/castRoster.js',
);
await server.close();

const problems = [];
const fail = (id, msg) => problems.push(`${id}: ${msg}`);

/** Every authored string must carry both languages — there is no fallback. */
function bilingual(id, where, v) {
  if (v == null) { fail(id, `${where} is missing`); return; }
  if (typeof v === 'string') { fail(id, `${where} is a bare string, expected { en, ar }`); return; }
  if (!v.en || !v.ar) fail(id, `${where} is missing ${v.en ? 'ar' : 'en'}`);
}

const seenIds = new Set();

for (const s of STAGE_STORIES) {
  if (seenIds.has(s.id)) fail(s.id, 'duplicate story id');
  seenIds.add(s.id);

  bilingual(s.id, 'title', s.title);
  bilingual(s.id, 'moral', s.moral);
  if (![1, 2, 3].includes(s.tier)) fail(s.id, `tier ${s.tier} is not 1, 2 or 3`);
  if (!s.beats?.length) fail(s.id, 'no beats');

  // ── beats ─────────────────────────────────────────────────────────────
  const beatIds = new Set();
  for (const [i, b] of (s.beats || []).entries()) {
    if (beatIds.has(b.id)) fail(s.id, `duplicate beat id "${b.id}"`);
    beatIds.add(b.id);
    bilingual(s.id, `beat ${b.id} label`, b.label);
    bilingual(s.id, `beat ${b.id} narr`, b.narr);
    if (!SKY_IDS.includes(b.sky)) fail(s.id, `beat "${b.id}" sky "${b.sky}" is not a known palette`);
    if (!b.actors?.length) fail(s.id, `beat "${b.id}" has nobody on stage`);

    const onStage = new Set();
    for (const a of b.actors || []) {
      if (!CAST[a.id]) fail(s.id, `beat "${b.id}" actor "${a.id}" is not a cast member`);
      if (onStage.has(a.id)) fail(s.id, `beat "${b.id}" places "${a.id}" twice`);
      onStage.add(a.id);
      if (!STORY_ACTS.includes(a.act)) {
        fail(s.id, `beat "${b.id}" act "${a.act}" is not a story verb`);
      } else if (!ACTIONS[a.act]) {
        fail(s.id, `beat "${b.id}" act "${a.act}" has no clip mapping`);
      }
      if (typeof a.x !== 'number' || a.x < -1.6 || a.x > 1.6) {
        fail(s.id, `beat "${b.id}" actor "${a.id}" x=${a.x} is off the stage disc`);
      }
    }

    if (b.say) {
      bilingual(s.id, `beat ${b.id} say`, b.say.t);
      if (!onStage.has(b.say.who)) {
        fail(s.id, `beat "${b.id}" is spoken by "${b.say.who}", who is not in that beat`);
      }
    }

    // The ordering cards show labels only. Two beats with the same label are
    // indistinguishable, so the task would be unfair rather than hard.
    const dupe = (s.beats || []).findIndex(
      (o, j) => j !== i && o.label?.en === b.label?.en,
    );
    if (dupe >= 0) fail(s.id, `beats "${b.id}" and "${s.beats[dupe].id}" share a label`);
  }

  // A story worth ordering needs enough beats for order to mean something.
  if ((s.beats?.length ?? 0) < 4) fail(s.id, 'fewer than 4 beats — ordering is trivial');

  // ── probes ────────────────────────────────────────────────────────────
  if (!s.probes?.length) fail(s.id, 'no detail probes');
  const probeIds = new Set();
  for (const p of s.probes || []) {
    if (probeIds.has(p.id)) fail(s.id, `duplicate probe id "${p.id}"`);
    probeIds.add(p.id);
    bilingual(s.id, `probe ${p.id} q`, p.q);
    if (!p.options?.length || p.options.length < 3) {
      fail(s.id, `probe "${p.id}" needs at least 3 options to be a real choice`);
    }
    const vals = new Set();
    for (const o of p.options || []) {
      bilingual(s.id, `probe ${p.id} option ${o.v}`, o.l);
      if (vals.has(o.v)) fail(s.id, `probe "${p.id}" repeats option value "${o.v}"`);
      vals.add(o.v);
    }
    if (!vals.has(p.answer)) fail(s.id, `probe "${p.id}" answer "${p.answer}" is not one of its options`);
  }

  // Everyone the story casts should actually appear, or the roster lies.
  const appeared = new Set((s.beats || []).flatMap((b) => (b.actors || []).map((a) => a.id)));
  for (const id of s.cast || []) {
    if (!appeared.has(id)) fail(s.id, `cast lists "${id}", who never appears in a beat`);
  }
  for (const id of appeared) {
    if (!(s.cast || []).includes(id)) fail(s.id, `"${id}" appears on stage but is not in cast`);
  }
}

const beats = STAGE_STORIES.reduce((n, s) => n + s.beats.length, 0);
const probes = STAGE_STORIES.reduce((n, s) => n + s.probes.length, 0);
if (problems.length) {
  console.error(`validate:stage — ${problems.length} problem(s)\n`);
  problems.forEach((p) => console.error(`  ✗ ${p}`));
  process.exit(1);
}
console.log(`validate:stage — ${STAGE_STORIES.length} stories, ${beats} beats, ${probes} probes, all wiring resolves.`);
STAGE_STORIES.forEach((s) => {
  console.log(`  · tier ${s.tier}  ${s.id.padEnd(16)} ${s.beats.length} beats · ${s.cast.length} cast · ${s.probes.length} probes`);
});
