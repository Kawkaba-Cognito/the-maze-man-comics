/* Validate the authored stories used by the live Story Time engine. */
import fs from 'node:fs';

const storyUrl = new URL('../src/features/training/domains/memory/games/story-grid/stories.js', import.meta.url);
const source = fs.readFileSync(storyUrl, 'utf8');
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const { STORIES } = await import(moduleUrl);

const BACKGROUNDS = new Set([
  'home', 'street', 'school', 'classroom', 'kitchen', 'garden', 'park',
  'beach', 'pool', 'museum', 'library', 'space', 'stage', 'bedroom', 'night',
]);
const ACTIONS = new Set([
  'walk', 'greet', 'hug', 'idea', 'tell', 'find', 'help', 'build', 'eat',
  'cook', 'study', 'read', 'ace', 'paint', 'plant', 'play', 'swim', 'sing',
  'dance', 'fly', 'win', 'gift', 'cheer', 'sleep',
]);
const CAST = new Set(['kawkab', 'star', 'noor', 'rami', 'lola']);
const ROLES = new Set(['H', 'F']);
const problems = [];
const fail = (id, message) => problems.push(`${id}: ${message}`);
const bilingual = (id, where, value) => {
  if (!value?.en?.trim() || !value?.ar?.trim()) fail(id, `${where} must have non-empty en and ar text`);
};

const ids = new Set();
const byLength = new Map();
for (const story of STORIES) {
  if (!story.id) fail('unknown', 'story id is missing');
  if (ids.has(story.id)) fail(story.id, 'duplicate story id');
  ids.add(story.id);
  bilingual(story.id, 'title', story.title);
  bilingual(story.id, 'moral', story.moral);

  const beats = story.beats || [];
  if (beats.length < 3 || beats.length > 6) fail(story.id, `has ${beats.length} beats; the engine supports 3–6`);
  byLength.set(beats.length, (byLength.get(beats.length) || 0) + 1);

  beats.forEach((beat, index) => {
    const where = `beat ${index + 1}`;
    if (!BACKGROUNDS.has(beat.bg)) fail(story.id, `${where} has unknown background "${beat.bg}"`);
    if (!ACTIONS.has(beat.action)) fail(story.id, `${where} has unknown action "${beat.action}"`);
    if (!Array.isArray(beat.who) || !beat.who.length) fail(story.id, `${where} has no cast`);
    for (const who of beat.who || []) {
      const allowed = story.fixed ? CAST : ROLES;
      if (!allowed.has(who)) fail(story.id, `${where} has invalid ${story.fixed ? 'cast id' : 'role'} "${who}"`);
    }
    bilingual(story.id, `${where} narration`, beat.narr);
    if (beat.say) bilingual(story.id, `${where} dialogue`, beat.say);
  });
}

for (const length of [3, 4, 5, 6]) {
  if (!byLength.get(length)) fail('story-bank', `no ${length}-beat stories for the difficulty curve`);
}

if (problems.length) {
  console.error(`validate:story — ${problems.length} problem(s)`);
  problems.forEach((problem) => console.error(`  ✗ ${problem}`));
  process.exit(1);
}

const beats = STORIES.reduce((total, story) => total + story.beats.length, 0);
console.log(`validate:story — ${STORIES.length} stories, ${beats} beats, all live Story Time wiring resolves.`);
console.log(`  · story lengths: ${[3, 4, 5, 6].map((n) => `${n} beats × ${byLength.get(n)}`).join(' · ')}`);
