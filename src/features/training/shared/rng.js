/* Tiny seeded RNG (mulberry32) so Pass n Play gives every player the identical
 * board/sequence within a round. makeRng(seed) returns a () => float in [0,1).
 * Implementation lives in src/lib/rng.js (shared app-wide). */
export { makeRng } from '../../../lib/rng';
