import React from 'react';
import Arena3DProto from '../../../../shared/Arena3DProto';
import { buildTrial } from './index';

/*
 * Word Links · 3D — the REAL 2D Survival, rendered in the cosmos arena.
 * Every trial comes from the 2D game's own buildTrial({mode:'free'}):
 * all four kinds (similarity / analogy / pair / odd), the time-based
 * survivalTier ramp, per-trial shrinking clocks, the shared anti-repeat
 * "seen" memory, and the exact 2D scoring (10 + combo bonus, no lives —
 * wrong answers only reset the combo; the run ends at 60s).
 */

const OPT_MESH = ['box', 'sphere', 'cone', 'cyl', 'torus', 'octa'];
const OPT_COLOR = [0xe8ac4e, 0x6bb3c8, 0xc47bb0, 0x7cbc7a, 0xd4a574, 0x9b8fd6];

const deco = (i) => ({ mesh: OPT_MESH[i % OPT_MESH.length], color: OPT_COLOR[i % OPT_COLOR.length] });

export default function Synonyms3DProto({ isAr, playSfx, onBack }) {
  const makeTrial = (rng, round, ctx) => {
    const t = buildTrial({
      mode: 'free',
      diff: 'med',
      level: 1,
      trialNum: round - 1,
      rng,
      isAr,
      ramp: ctx?.ramp ?? 0,
    });
    const chip = t.rel ? (isAr ? t.rel.ar : t.rel.en) : (isAr ? 'روابط' : 'Links');

    if (t.kind === 'pair') {
      return {
        mode: 'pick2',
        prompt: t.prompt,
        chip,
        layout: 'cards',
        timeMs: t.timeMs,
        options: t.words.map((w, i) => ({ id: `w${w.key}`, label: w.label, ...deco(i) })),
        pairIds: (t.pair || []).map((k) => `w${k}`),
      };
    }

    const options = t.options.map((o, i) => ({
      id: `o${o.key}`,
      label: o.label,
      correct: !!o.correct,
      ...deco(i),
    }));

    if (t.kind === 'analogy') {
      const [a, b, c] = t.stem;
      return {
        mode: 'choice',
        prompt: `${a} → ${b}  ·  ${c} → ?`,
        chip,
        layout: 'cards',
        timeMs: t.timeMs,
        options,
      };
    }

    if (t.kind === 'odd') {
      return { mode: 'choice', prompt: t.prompt, chip, layout: 'cards', timeMs: t.timeMs, options };
    }

    // similarity
    return {
      mode: 'choice',
      prompt: `${t.left} · ${t.right} — ${t.prompt}`,
      chip,
      layout: 'cards',
      timeMs: t.timeMs,
      options,
    };
  };

  return (
    <Arena3DProto
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      spec={{
        title: { en: 'Word Links · 3D', ar: 'روابط الكلمات · ثلاثي الأبعاد' },
        hint: { en: 'Find the link before the clock runs out', ar: 'اعثر على الرابط قبل نفاد الوقت' },
        mode: 'choice',
        lives: 0,
        survival: true,
        bigPrompt: true,
        points: (combo) => 10 + Math.min(combo, 8) * 2,
        makeTrial,
      }}
    />
  );
}
