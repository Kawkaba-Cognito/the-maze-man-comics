import React from 'react';
import Arena3DProto from '../../../../shared/Arena3DProto';
import { prepareTrailRound } from './index';

/*
 * Trail Making · 3D — the REAL 2D Survival board, rendered as cosmos tiles.
 * Boards come from prepareTrailRound (same rampCfg node counts 8→30, shrinking
 * board clock 32s→14s, forward/colour variants and decoy counts). Colour boards
 * carry BOTH colour copies of every number (the wrong-colour copy is a lure) and
 * decoys are unnumbered tiles — tapping either is a soft error with the 2D −2s
 * clock penalty, exactly like the 2D board. Board timeout ends the run; clearing
 * a board pays 20 + seconds-left. Difficulty ramps by boards cleared, not time.
 */

const CTT_HEX = ['#0072B2', '#E69F00'].map((h) => parseInt(h.replace('#', ''), 16));
const DECOY_HEX = 0x8a7a5c;

function makeTrial(rng, _round, ctx) {
  const seed = Math.floor(rng() * 0x7fffffff) >>> 0;
  const boardsCleared = ctx?.correct ?? 0; // survival ramps by boards cleared (2D)
  const prep = prepareTrailRound(boardsCleared, seed);
  const isColor = prep.variant === 'color';

  // Nodes are numbered PLANETS; the arena draws the gold trail through the
  // ones you have connected so far, so the connect-the-numbers task is obvious.
  const sequence = prep.nodes.map((node, i) => ({
    id: `n${i}`,
    label: node.label,
    planet: true,
    color: CTT_HEX[node.colorIndex] ?? CTT_HEX[0],
  }));

  const lures = [];
  if (isColor) {
    // Every number also exists in the WRONG colour — the built-in 2D lure.
    prep.nodes.forEach((node, i) => {
      lures.push({
        id: `c${i}`,
        label: node.label,
        planet: true,
        color: CTT_HEX[1 - node.colorIndex] ?? CTT_HEX[1],
      });
    });
  }
  for (let d = 0; d < (prep.decoys || 0); d++) {
    lures.push({ id: `d${d}`, label: '', planet: true, color: DECOY_HEX });
  }

  return {
    prompt: isColor
      ? { en: `Tap 1 → ${prep.n}, alternating colours — ignore the rest`, ar: `المس ١ ← ${prep.n} بالتناوب بين اللونين — وتجاهل البقية` }
      : { en: `Tap 1 → ${prep.n} in order${prep.decoys ? ' — ignore the blank circles' : ''}`, ar: `المس ١ ← ${prep.n} بالترتيب${prep.decoys ? ' — وتجاهل الدوائر الفارغة' : ''}` },
    chip: { en: `Board ${boardsCleared + 1}`, ar: `لوحة ${boardsCleared + 1}` },
    layout: 'scatter',
    sequence,
    lures,
    timeMs: prep.timeMs,
    timeoutEndsRun: true,
    seqSoftErrors: true,
    seqErrorPenaltyMs: 2000,
    noOverlay: true,
  };
}

export default function TrailMaking3DProto({ isAr, playSfx, onBack }) {
  return (
    <Arena3DProto
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      spec={{
        title: { en: 'Trail Making · 3D', ar: 'صل الأرقام · ثلاثي الأبعاد' },
        hint: { en: 'Clear each board before its clock runs out', ar: 'أكمل كل لوحة قبل نفاد وقتها' },
        mode: 'sequence',
        lives: 0,
        survival: true,
        points: (_combo, _trial, extra) => 20 + Math.max(0, Math.round((extra?.trialMsLeft ?? 0) / 1000)),
        makeTrial,
      }}
    />
  );
}
