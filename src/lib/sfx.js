/**
 * The interface sound palette — synthesized, not sampled.
 *
 * Two earlier attempts were both reported as thin and shrill, and both were:
 *
 *  1. The original oscillator cues ran at 600-1200 Hz on `square` and
 *     `sawtooth`. Those waveforms are all odd/steep harmonics, so a 600 Hz
 *     square puts real energy at 1.8k, 3k and 5k — right through the ear's
 *     most sensitive band. That is the "cheap handheld game" sound exactly.
 *  2. Replacing them with Kenney's CC0 interface samples swapped one bright
 *     source for another: it is a GAME UI pack, voiced glassy and plasticky on
 *     purpose so a cue cuts through music and effects. This app has neither.
 *
 * Synthesis is chosen over hunting for warmer samples for a concrete reason:
 * there is no audio playback in the authoring environment here, so a sample can
 * only ever be picked BLIND, by filename. Frequency, brightness and decay are
 * the exact things being complained about, and they are the exact things a
 * synthesized cue states in numbers and a `.ogg` hides. Everything below can be
 * reasoned about, reviewed, and tuned by changing a number.
 *
 * It also costs nothing: no files, no download, no cache entry, no licence.
 *
 * ── What makes these read as premium ──────────────────────────────────────
 *  · LOW fundamentals (165-525 Hz). The old cues lived an octave too high.
 *  · `sine` and `triangle` only. Never square or sawtooth.
 *  · A low-pass over every voice, so even the triangle's upper harmonics are
 *    rolled off and nothing is brittle.
 *  · A 4-6 ms attack ramp. Starting a gain at full value produces an audible
 *    edge on the very first sample — a large part of what "clicky" means.
 *  · Exponential decay and no sustain: a tap should be over in ~60 ms.
 *  · Quiet. `click` fires from 183 call sites; anything assertive becomes
 *    fatiguing inside a minute.
 *  · Real musical intervals, so multi-note cues sound intentional. Failure is
 *    a gentle falling fourth rather than a buzz — this is a wellbeing app, and
 *    a punishing error tone is off-brand as well as unpleasant.
 */

const NOTE = {
  E3: 164.81, G3: 196.00, A3: 220.00,
  C4: 261.63, E4: 329.63, G4: 392.00,
  C5: 523.25,
};

/**
 * One voice: oscillator → low-pass → gain → out.
 *
 * @param at     start time, seconds from now
 * @param from   starting frequency; `to` glides to it over the note
 * @param cut    low-pass corner — the single biggest lever on "harsh vs warm"
 */
function voice(ctx, { from, to, type = 'sine', at = 0, dur, gain, cut = 1600 }) {
  const t = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const lp = ctx.createBiquadFilter();
  const g = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(from, t);
  if (to && to !== from) osc.frequency.exponentialRampToValueAtTime(to, t + dur);

  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(cut, t);
  lp.Q.value = 0.7;

  // Attack ramp, then exponential fall. exponentialRamp cannot reach 0, so it
  // lands just above silence and a final linear ramp closes it — without that
  // last step the node stops mid-level and clicks.
  const peak = Math.max(gain, 0.0002);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.005);
  g.gain.exponentialRampToValueAtTime(peak * 0.02, t + dur);
  g.gain.linearRampToValueAtTime(0, t + dur + 0.02);

  osc.connect(lp); lp.connect(g); g.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur + 0.04);
  osc.onended = () => { try { osc.disconnect(); lp.disconnect(); g.disconnect(); } catch { /* gone */ } };
}

/*
 * The palette. Each cue is a list of voices.
 *
 * Tuning guide, so this does not need re-deriving next time:
 *   too shrill  → lower `cut`, and/or drop `from`/`to` an octave (halve them)
 *   too loud    → lower `gain`
 *   too clicky  → raise `dur` slightly
 *   too dull    → raise `cut`, or move `type` from 'sine' to 'triangle'
 */
const CUES = {
  // A soft wooden tock, not a tick. The pitch falls slightly across its 55 ms,
  // which is what a struck object does and what stops it reading as a beep.
  click: [{ from: 240, to: 180, type: 'sine', dur: 0.055, gain: 0.05, cut: 900 }],

  // C4 → G4, a rising fifth. Warm and obviously positive without being bright.
  collect: [{ from: NOTE.C4, to: NOTE.G4, type: 'triangle', dur: 0.13, gain: 0.07, cut: 1500 }],

  // G4 → C5, a rising fourth resolving upward: "yes".
  correct: [{ from: NOTE.G4, to: NOTE.C5, type: 'sine', dur: 0.17, gain: 0.075, cut: 1700 }],

  // A major arpeggio, C4-E4-G4-C5, notes overlapping slightly so it rings as a
  // chord rather than four separate beeps. The last note is the longest.
  win: [
    { from: NOTE.C4, at: 0.00, type: 'triangle', dur: 0.20, gain: 0.055, cut: 1500 },
    { from: NOTE.E4, at: 0.07, type: 'triangle', dur: 0.20, gain: 0.055, cut: 1500 },
    { from: NOTE.G4, at: 0.14, type: 'triangle', dur: 0.22, gain: 0.055, cut: 1600 },
    { from: NOTE.C5, at: 0.21, type: 'sine', dur: 0.38, gain: 0.065, cut: 1800 },
  ],

  // A3 → E3, a falling fourth, low and soft. It says "not that" rather than
  // buzzing at the player.
  error: [{ from: NOTE.A3, to: NOTE.E3, type: 'sine', dur: 0.22, gain: 0.07, cut: 1000 }],

  // The same gesture, quieter and shorter: Word Maze fires this on a rejected
  // letter, which is a nudge mid-flow, not a failed round.
  wrong: [{ from: NOTE.G3, to: NOTE.E3, type: 'sine', dur: 0.15, gain: 0.05, cut: 900 }],
};

/** Every cue name this module can play — the fallback list in AppContext. */
export const SFX_NAMES = Object.keys(CUES);

/** Play a named cue. Silently does nothing for an unknown name. */
export function playCue(ctx, name) {
  const cue = CUES[name];
  if (!ctx || !cue) return false;
  try {
    for (const v of cue) voice(ctx, v);
    return true;
  } catch {
    return false;
  }
}
