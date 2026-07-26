import { LANTERN_TIDE } from './lanternTide';
import { SEED_AND_STORM } from './seedAndStorm';
import { THE_QUIET_BELL } from './theQuietBell';

/*
 * The staged story rotation, easiest first — 5 beats / 6 beats / 7 interleaved.
 *
 * Survival walks up this list as the player scores clean runs, so tier order
 * here IS the difficulty curve. Every actor id must be a cast id from
 * castRoster.js and every `act` a STORY_ACTS verb — `npm run validate:stage`
 * enforces that along with the rest of the wiring.
 */
export const STAGE_STORIES = [LANTERN_TIDE, SEED_AND_STORM, THE_QUIET_BELL];

export const storyById = (id) => STAGE_STORIES.find((s) => s.id === id) || null;
