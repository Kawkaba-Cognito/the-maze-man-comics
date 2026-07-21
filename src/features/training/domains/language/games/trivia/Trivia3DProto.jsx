import React, { useRef } from 'react';
import Arena3DProto from '../../../../shared/Arena3DProto';
import { TRIVIA_CATEGORIES } from './triviaData';
import { buildQueue, survivalSteps, survivalTiers, markQuestionSeen } from './index';

/*
 * Trivia · 3D — the REAL 2D Survival staircase, rendered in the cosmos arena.
 * Same structure as TriviaEngine free mode: each staircase is one category with
 * survivalSteps(stairs) steps; questions come from buildQueue (same graded bank,
 * same anti-repeat "seen" memory, marked on answer); THREE mistakes across the
 * whole run end it; clearing a staircase pays step×10+25 and lets the player
 * pick the next topic from three cards; +5 per correct answer; "did you know"
 * facts show after each answer. Tier ramps by staircases cleared, exactly 2D.
 */

const OPT_MESH = ['box', 'sphere', 'cone', 'cyl'];
const OPT_COLOR = [0xe8ac4e, 0x6bb3c8, 0xc47bb0, 0x7cbc7a];
const CAT_COLOR = [0xe8ac4e, 0x6bb3c8, 0x7cbc7a];

function shuffleR(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export default function Trivia3DProto({ isAr, playSfx, onBack }) {
  const stRef = useRef(null);

  const newStaircase = (st, rng, cat) => {
    st.category = cat;
    st.steps = survivalSteps(st.stairs);
    st.step = 0;
    st.queue = buildQueue(cat.id, survivalTiers(st.stairs), rng, true);
    st.qIdx = 0;
  };

  const makeTrial = (rng, _round) => {
    const st = stRef.current || (stRef.current = { stairs: 0, step: 0, steps: 0, category: null, queue: [], qIdx: 0, pickTopic: false, pendingCats: [] });

    if (st.pickTopic) {
      const cats = st.pendingCats;
      return {
        mode: 'choice',
        noScore: true,
        pts: 0,
        prompt: isAr ? 'أحسنت! اختر موضوعك التالي' : 'Staircase cleared! Choose your next topic',
        chip: isAr ? `سلالم ${st.stairs}` : `Stairs ${st.stairs}`,
        layout: 'row',
        feedbackMs: 350,
        options: cats.map((c, i) => ({
          id: c.id,
          label: `${c.emoji} ${isAr ? c.ar : c.en}`,
          correct: true,
          mesh: 'sphere',
          color: CAT_COLOR[i % CAT_COLOR.length],
        })),
        onAnswer: (id) => {
          const cat = cats.find((c) => c.id === id) || cats[0];
          st.pickTopic = false;
          newStaircase(st, rng, cat);
        },
      };
    }

    if (!st.category) {
      newStaircase(st, rng, TRIVIA_CATEGORIES[Math.floor(rng() * TRIVIA_CATEGORIES.length)]);
    }

    const item = st.queue[st.qIdx % st.queue.length];
    const q = item.q;
    const shuffled = shuffleR(q.o.map((pair, i) => ({ pair, correct: i === q.a })), rng);
    const clears = st.step + 1 >= st.steps;
    const fact = q.f ? (isAr ? q.f.ar : q.f.en) : null;

    return {
      mode: 'choice',
      prompt: isAr ? q.ar : q.en,
      chip: `${st.category.emoji} ${isAr ? st.category.ar : st.category.en} · ${st.step + 1}/${st.steps} · ⛰${st.stairs}`,
      layout: 'cards',
      pts: 5 + (clears ? st.steps * 10 + 25 : 0),
      ptsOver: st.step * 10,
      feedbackText: fact ? `💡 ${fact}` : null,
      feedbackMs: fact ? 2300 : undefined,
      options: shuffled.map((o, i) => ({
        id: `o${i}`,
        label: { en: o.pair[0], ar: o.pair[1] },
        correct: o.correct,
        mesh: OPT_MESH[i % OPT_MESH.length],
        color: OPT_COLOR[i % OPT_COLOR.length],
      })),
      onAnswer: (_id, ok) => {
        markQuestionSeen(item.id);
        st.qIdx += 1;
        if (ok) {
          st.step += 1;
          if (st.step >= st.steps) {
            st.stairs += 1;
            st.pendingCats = shuffleR(TRIVIA_CATEGORIES.filter((c) => c.id !== st.category.id), rng).slice(0, 3);
            st.pickTopic = true;
          }
        }
      },
    };
  };

  return (
    <Arena3DProto
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      spec={{
        title: { en: 'Trivia · 3D', ar: 'معلومات · ثلاثي الأبعاد' },
        hint: { en: 'Climb the staircase — three mistakes and the run ends', ar: 'اصعد السلّم — ثلاثة أخطاء وتنتهي المحاولة' },
        mode: 'choice',
        lives: 3,
        endless: true,
        bigPrompt: true,
        points: (_combo, trial) => trial?.pts ?? 0,
        onStart: () => { stRef.current = { stairs: 0, step: 0, steps: 0, category: null, queue: [], qIdx: 0, pickTopic: false, pendingCats: [] }; },
        makeTrial,
      }}
    />
  );
}
