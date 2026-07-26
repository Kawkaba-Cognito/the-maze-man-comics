/*
 * The cast roster — who exists, what they are called, what they look like.
 *
 * Deliberately free of any three.js import so case data, UI and the validation
 * script can all read it without pulling in WebGL. castModels.js turns these
 * entries into actual 3D actors.
 */

/**
 * How tall the cast actually draws, in world units. Nothing is scaled at
 * runtime — see castModels.js for why that breaks skinned meshes — so these
 * are properties of the assets themselves.
 *
 * Every rig in the cast is authored feet-at-origin and ~1.65 units tall
 * (their armature scale is cancelled by the skinning path, so the rendered
 * size is the mesh-space size). Dr Kawkab is unrigged and was sized to match
 * with scripts/normalize-character-height.mjs.
 */
export const RIG_HEIGHT = 1.65;
export const STAGE_HEIGHT = RIG_HEIGHT;

export const CAST = {
  // Dr Kawkab is the robot the app already uses as its mascot — the same model
  // behind shared/drKawkabModel.js — so he looks identical here and on the
  // training hub, and the download is already in the user's cache.
  kawkab: {
    url: 'Assets/biped-v1.glb',
    rigged: true,
    name: { en: 'Detective Kawkab', ar: 'المحقّق كوكب' },
    accent: '#e8ac4e',
  },
  ramy: {
    url: 'Assets/hooded-figure-v1.glb',
    rigged: true,
    name: { en: 'Ramy', ar: 'رامي' },
    accent: '#8a8fb0',
  },
  lola: {
    url: 'Assets/lola-v1.glb',
    rigged: true,
    name: { en: 'Lola', ar: 'لولا' },
    accent: '#e8ac4e',
  },
  mimi: {
    url: 'Assets/mimi-v1.glb',
    rigged: true,
    name: { en: 'Mimi', ar: 'ميمي' },
    accent: '#c0455a',
  },
  star: {
    url: 'Assets/star-v1.glb',
    rigged: true,
    name: { en: 'Star', ar: 'ستار' },
    accent: '#f0c674',
  },
  fadi: {
    url: 'Assets/kawkab-mascot-v1.glb',
    rigged: true,
    name: { en: 'Fadi', ar: 'فادي' },
    accent: '#5a7fae',
  },
};

export const CAST_IDS = Object.keys(CAST);

/** Suspects only — Dr Kawkab is never in the line-up. */
export const SUSPECT_IDS = CAST_IDS.filter((id) => id !== 'kawkab');

/**
 * Named beats the game asks for, mapped onto clips in the shared library.
 * Idles are a pool so a line-up of suspects doesn't breathe in lockstep.
 */
export const ACTIONS = {
  idle: ['Idle_02', 'Idle_3', 'Idle_4', 'Happy_Sway_Standing'],
  greet: ['Big_Wave_Hello'],
  concede: ['Agree_Gesture'],
  deny: ['Angry_Stomp', 'Angry_Ground_Stomp'],
  rattled: ['Look_Around_Dumbfounded'],
  fidget: ['air_squat'],
  cleared: ['victory'],
  walk: ['Walking'],

  // Story Time beat verbs. Deliberately aliases onto the same twelve clips in
  // cast-clips-v1.glb rather than new names, so authoring a story never asks
  // for animation that does not exist — validate:stage rejects anything else.
  arrive: ['Walking'],
  search: ['Look_Around_Dumbfounded'],
  agree: ['Agree_Gesture'],
  cheer: ['victory'],
  upset: ['Angry_Stomp', 'Angry_Ground_Stomp'],
  work: ['air_squat'],
  wait: ['Happy_Sway_Standing'],
};

/** Beat verbs a story may ask an actor to perform (see validate-stage). */
export const STORY_ACTS = [
  'idle', 'arrive', 'greet', 'search', 'agree', 'cheer', 'upset', 'work', 'wait',
];
