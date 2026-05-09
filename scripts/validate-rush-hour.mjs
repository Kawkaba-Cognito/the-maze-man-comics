/**
 * Run: node scripts/validate-rush-hour.mjs
 *        node scripts/validate-rush-hour.mjs --full   (includes reference puzzle #40 ⇒ 49 moves, see rushHourEngine.js)
 */
import { validateRushHourReferenceSolutions } from '../src/components/training/rushHourEngine.js';

const full = process.argv.includes('--full');
validateRushHourReferenceSolutions({ full });
console.log(
  full
    ? '[validate-rush-hour] OK (--full, KaKariki HardestGame / ref #40)'
    : '[validate-rush-hour] OK (trivial 1-move only; use --full for ref #40)',
);
