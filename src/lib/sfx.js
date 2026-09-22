/**
 * Boutique Tactile Kalimba Sound Palette — Procedurally Synthesized.
 *
 * Replaces the legacy muted sine/triangle test tones with the full
 * Tactile Kalimba acoustic suite selected for the app:
 *
 *  · Mechanical switch click transient (fast 15ms high-passed noise burst)
 *  · Resonant Kalimba tines (fundamental + 2.85x metallic harmonic overtone)
 *  · Stage Win: 8-note major 9th Kalimba cascade (C4 -> C6)
 *  · Round Fail / Loss: Melancholy falling Kalimba descent (F4 -> Db4 -> C4)
 *  · Miss / Distractor: Damped Tine Plink (Eb5 622Hz choked metal, zero low mud)
 *  · Time Warning: High Kalimba Octave Ping (A5 880Hz double pulse)
 *  · UI Taps: Crisp mechanical switch click (55ms)
 *  · Clear, audible, normalized gains (0.22 - 0.38) suitable for all phone/laptop speakers
 */

const NOTE = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, Db4: 277.18, D4: 293.66, Eb4: 311.13, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, Bb4: 466.16, B4: 493.88,
  C5: 523.25, D5: 587.33, Eb5: 622.25, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
  C6: 1046.50,
};

/**
 * Click transient layer: microscopic high-passed mechanical switch click.
 */
function playClick(ctx, at = 0, gain = 0.26) {
  try {
    const t = ctx.currentTime + at;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.015), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.003));
    }
    const src = ctx.createBufferSource();
    const hp = ctx.createBiquadFilter();
    const g = ctx.createGain();

    src.buffer = buf;
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(2400, t);

    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.014);

    src.connect(hp);
    hp.connect(g);
    g.connect(ctx.destination);
    src.start(t);
    src.stop(t + 0.018);
  } catch (e) {
    // audio context might be closed or inactive
  }
}

/**
 * One Kalimba / synth voice: oscillator -> filter -> gain -> destination.
 */
function voice(ctx, { from, to, type = 'sine', at = 0, dur, gain = 0.3, cut = 3200, click = true, clickGain = 0.24, overtone = true, overtoneRatio = 2.85, overtoneGain = 0.22 }) {
  try {
    const t = ctx.currentTime + at;

    if (click) {
      playClick(ctx, at, clickGain);
    }

    // Fundamental tine
    const osc = ctx.createOscillator();
    const lp = ctx.createBiquadFilter();
    const g = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    if (to && to !== from) osc.frequency.exponentialRampToValueAtTime(to, t + dur);

    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(cut, t);
    lp.Q.value = 0.7;

    const peak = Math.max(gain, 0.0002);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.004);
    g.gain.exponentialRampToValueAtTime(peak * 0.015, t + dur);
    g.gain.linearRampToValueAtTime(0, t + dur + 0.02);

    osc.connect(lp);
    lp.connect(g);
    g.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.04);
    osc.onended = () => {
      try { osc.disconnect(); lp.disconnect(); g.disconnect(); } catch { /* cleanup */ }
    };

    // Metallic overtone shimmer (if enabled)
    if (overtone && from >= 200 && from <= 900) {
      const oOsc = ctx.createOscillator();
      const oG = ctx.createGain();
      oOsc.type = 'sine';
      oOsc.frequency.setValueAtTime(from * overtoneRatio, t);

      const oPeak = peak * overtoneGain;
      const oDur = Math.min(dur * 0.45, 0.12);
      oG.gain.setValueAtTime(0.0001, t);
      oG.gain.linearRampToValueAtTime(oPeak, t + 0.003);
      oG.gain.exponentialRampToValueAtTime(0.0001, t + oDur);

      oOsc.connect(oG);
      oG.connect(ctx.destination);
      oOsc.start(t);
      oOsc.stop(t + oDur + 0.02);
      oOsc.onended = () => {
        try { oOsc.disconnect(); oG.disconnect(); } catch { /* cleanup */ }
      };
    }
  } catch (e) {
    // audio context might be suspended or closed
  }
}

/*
 * The complete app-wide sound palette.
 */
const CUES = {
  // ── 1. UI BUTTON CLICKS ──
  // Fast, crisp boutique mechanical switch click (55ms). Highly responsive, non-fatiguing.
  click: [
    { from: 220, to: 170, type: 'sine', dur: 0.055, gain: 0.25, cut: 2400, click: true, clickGain: 0.35, overtone: false }
  ],
  tap: [
    { from: 220, to: 170, type: 'sine', dur: 0.055, gain: 0.25, cut: 2400, click: true, clickGain: 0.35, overtone: false }
  ],
  select: [
    { from: 240, to: 180, type: 'sine', dur: 0.060, gain: 0.26, cut: 2400, click: true, clickGain: 0.35, overtone: false }
  ],

  // ── 2. TARGET HITS & COMBOS ──
  // Primary Target Hit: C5 Kalimba tine with tactile mechanical click
  collect: [
    { from: NOTE.C5, type: 'sine', dur: 0.28, gain: 0.34, cut: 3200, click: true, clickGain: 0.28 }
  ],
  // Streak 2x: D5 Kalimba tine
  collect2: [
    { from: NOTE.D5, type: 'sine', dur: 0.26, gain: 0.34, cut: 3400, click: true, clickGain: 0.28 }
  ],
  // Streak 3x: E5 Kalimba tine
  collect3: [
    { from: NOTE.E5, type: 'sine', dur: 0.26, gain: 0.34, cut: 3400, click: true, clickGain: 0.28 }
  ],
  // Streak 4x: G5 Kalimba tine
  collect4: [
    { from: NOTE.G5, type: 'sine', dur: 0.28, gain: 0.35, cut: 3600, click: true, clickGain: 0.30 }
  ],

  // ── 3. CORRECT RESPONSE / PUZZLE SOLVED ──
  // Rising fifth G4 -> C5 with ringing Kalimba tine resonance
  correct: [
    { from: NOTE.G4, at: 0.00, type: 'sine', dur: 0.22, gain: 0.30, cut: 3000, click: true, clickGain: 0.22 },
    { from: NOTE.C5, at: 0.08, type: 'sine', dur: 0.40, gain: 0.36, cut: 3400, click: true, clickGain: 0.25 }
  ],

  // ── 4. STAGE CLEAR & LEVEL VICTORY ──
  // Celebratory 8-note major 9th Kalimba cascade: C4, E4, G4, B4, D5, E5, G5, C6
  win: [
    { from: NOTE.C4, at: 0.00, type: 'sine', dur: 0.22, gain: 0.28, cut: 2800, click: true, clickGain: 0.20 },
    { from: NOTE.E4, at: 0.07, type: 'sine', dur: 0.22, gain: 0.28, cut: 2800, click: true, clickGain: 0.20 },
    { from: NOTE.G4, at: 0.14, type: 'sine', dur: 0.24, gain: 0.30, cut: 3000, click: true, clickGain: 0.20 },
    { from: NOTE.B4, at: 0.21, type: 'sine', dur: 0.24, gain: 0.30, cut: 3000, click: true, clickGain: 0.20 },
    { from: NOTE.D5, at: 0.28, type: 'sine', dur: 0.26, gain: 0.32, cut: 3200, click: true, clickGain: 0.22 },
    { from: NOTE.E5, at: 0.35, type: 'sine', dur: 0.26, gain: 0.32, cut: 3200, click: true, clickGain: 0.22 },
    { from: NOTE.G5, at: 0.42, type: 'sine', dur: 0.30, gain: 0.34, cut: 3400, click: true, clickGain: 0.24 },
    { from: NOTE.C6, at: 0.50, type: 'sine', dur: 1.20, gain: 0.40, cut: 4000, click: true, clickGain: 0.28, overtone: true }
  ],
  clear: [
    { from: NOTE.C4, at: 0.00, type: 'sine', dur: 0.22, gain: 0.28, cut: 2800, click: true, clickGain: 0.20 },
    { from: NOTE.E4, at: 0.07, type: 'sine', dur: 0.22, gain: 0.28, cut: 2800, click: true, clickGain: 0.20 },
    { from: NOTE.G4, at: 0.14, type: 'sine', dur: 0.24, gain: 0.30, cut: 3000, click: true, clickGain: 0.20 },
    { from: NOTE.B4, at: 0.21, type: 'sine', dur: 0.24, gain: 0.30, cut: 3000, click: true, clickGain: 0.20 },
    { from: NOTE.D5, at: 0.28, type: 'sine', dur: 0.26, gain: 0.32, cut: 3200, click: true, clickGain: 0.22 },
    { from: NOTE.E5, at: 0.35, type: 'sine', dur: 0.26, gain: 0.32, cut: 3200, click: true, clickGain: 0.22 },
    { from: NOTE.G5, at: 0.42, type: 'sine', dur: 0.30, gain: 0.34, cut: 3400, click: true, clickGain: 0.24 },
    { from: NOTE.C6, at: 0.50, type: 'sine', dur: 1.20, gain: 0.40, cut: 4000, click: true, clickGain: 0.28, overtone: true }
  ],

  // ── 5. MISS / DISTRACTOR TAP (USER CHOSEN: 4A Damped Tine Plink) ──
  // Choked Eb5 kalimba tine (622Hz) + switch click. Fast 90ms decay, crisp, dry, zero mud.
  wrong: [
    { from: NOTE.Eb5, type: 'sine', dur: 0.09, gain: 0.35, cut: 3400, click: true, clickGain: 0.40, overtone: true, overtoneRatio: 2.85, overtoneGain: 0.30 }
  ],
  miss: [
    { from: NOTE.Eb5, type: 'sine', dur: 0.09, gain: 0.35, cut: 3400, click: true, clickGain: 0.40, overtone: true, overtoneRatio: 2.85, overtoneGain: 0.30 }
  ],

  // ── 6. ROUND FAILURE / LOSS (Sad Kalimba Descent) ──
  // Melancholy descending kalimba chords F4 -> Db4 -> C4
  error: [
    { from: NOTE.F4, at: 0.00, type: 'sine', dur: 0.32, gain: 0.32, cut: 2600, click: true, clickGain: 0.20 },
    { from: NOTE.Db4, at: 0.16, type: 'sine', dur: 0.35, gain: 0.32, cut: 2400, click: true, clickGain: 0.20 },
    { from: NOTE.C4, at: 0.34, type: 'sine', dur: 0.65, gain: 0.35, cut: 2200, click: true, clickGain: 0.20 }
  ],
  fail: [
    { from: NOTE.F4, at: 0.00, type: 'sine', dur: 0.32, gain: 0.32, cut: 2600, click: true, clickGain: 0.20 },
    { from: NOTE.Db4, at: 0.16, type: 'sine', dur: 0.35, gain: 0.32, cut: 2400, click: true, clickGain: 0.20 },
    { from: NOTE.C4, at: 0.34, type: 'sine', dur: 0.65, gain: 0.35, cut: 2200, click: true, clickGain: 0.20 }
  ],

  // ── 7. TIME WARNING (USER CHOSEN: 8B High Kalimba Ping) ──
  // Urgent crystal-clear high Kalimba A5 double-pulse (880Hz) spaced 140ms apart.
  warn: [
    { from: NOTE.A5, at: 0.00, type: 'sine', dur: 0.15, gain: 0.36, cut: 4000, click: true, clickGain: 0.25 },
    { from: NOTE.A5, at: 0.14, type: 'sine', dur: 0.18, gain: 0.38, cut: 4000, click: true, clickGain: 0.28 }
  ],
  alert: [
    { from: NOTE.A5, at: 0.00, type: 'sine', dur: 0.15, gain: 0.36, cut: 4000, click: true, clickGain: 0.25 },
    { from: NOTE.A5, at: 0.14, type: 'sine', dur: 0.18, gain: 0.38, cut: 4000, click: true, clickGain: 0.28 }
  ],

  // ── 8. COUNTDOWN (3, 2, 1) ──
  // Ascending kalimba arming phrase (C4 -> E4 -> G4) resolving into correct (C5) on GO
  count1: [{ from: NOTE.C4, type: 'sine', dur: 0.16, gain: 0.28, cut: 2400, click: true, clickGain: 0.22 }],
  count2: [{ from: NOTE.E4, type: 'sine', dur: 0.16, gain: 0.30, cut: 2600, click: true, clickGain: 0.24 }],
  count3: [{ from: NOTE.G4, type: 'sine', dur: 0.18, gain: 0.32, cut: 2800, click: true, clickGain: 0.26 }],

  // ── 9. HINT / ASSIST ──
  hint: [
    { from: NOTE.E5, type: 'sine', dur: 0.30, gain: 0.30, cut: 3200, click: true, clickGain: 0.20, overtone: true }
  ],
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
