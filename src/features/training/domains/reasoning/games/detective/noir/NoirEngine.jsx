import React, { useMemo, useState } from 'react';
import { makeRng } from '../../../../../shared/rng';
import NoirCase from './NoirCase';
import NoirSurvival from './NoirSurvival';
import { NOIR_CASES } from './cases';

const CASES_BY_ID = Object.fromEntries(NOIR_CASES.map((item) => [item.id, item]));

const RULES = {
  easy: {
    cases: ['observatory', 'encore', 'observatory', 'long-rain', 'encore', 'long-rain'],
    errors: [8, 7, 6, 6, 5, 4],
    instincts: [3, 3, 2, 2, 2, 1],
  },
  med: {
    cases: ['encore', 'observatory', 'long-rain', 'encore', 'long-rain', 'observatory'],
    errors: [6, 5, 5, 4, 3, 2],
    instincts: [2, 2, 2, 1, 1, 1],
  },
  hard: {
    cases: ['long-rain', 'encore', 'observatory', 'long-rain', 'encore', 'observatory'],
    errors: [4, 3, 3, 2, 1, 0],
    instincts: [1, 1, 1, 0, 0, 0],
  },
};

const TITLES = {
  en: ['Open File', 'Scene Discipline', 'Cross-Check', 'Clean Chain', 'Cold Read', 'Perfect Warrant'],
  ar: ['فتح الملف', 'ضبط المسرح', 'المطابقة', 'سلسلة نظيفة', 'قراءة باردة', 'مذكّرة مثالية'],
};

function missionFor(diff = 'med', level = 1, isAr = false) {
  const rules = RULES[diff] || RULES.med;
  const index = Math.max(0, (level - 1) % rules.cases.length);
  const chapter = TITLES[isAr ? 'ar' : 'en'][index];
  return {
    caseData: CASES_BY_ID[rules.cases[index]] || NOIR_CASES[0],
    label: isAr ? `المهمّة ${level} · ${chapter}` : `Assignment ${level} · ${chapter}`,
    maxMistakes: rules.errors[index],
    instinctUses: rules.instincts[index],
  };
}

function scoreCase({ mistakes, elapsedMs }) {
  const timePenalty = Math.min(420, Math.round((elapsedMs || 0) / 1000) * 3);
  return Math.max(100, 1200 - (mistakes * 140) - timePenalty);
}

function LevelCase({
  diff, level, isAr, playSfx, awardPoints, onResult, onExit,
}) {
  const assignment = useMemo(() => missionFor(diff, level, isAr), [diff, level, isAr]);

  const finish = (result) => {
    const won = result.mistakes <= assignment.maxMistakes;
    const score = scoreCase(result);
    if (won) awardPoints?.(result.mistakes === 0 ? 10 : 6);
    const summary = won
      ? (isAr
        ? `أُغلقت القضيّة ضمن الشروط · ${score} نقطة · ${result.mistakes}/${assignment.maxMistakes} أخطاء`
        : `Case closed within conditions · ${score} points · ${result.mistakes}/${assignment.maxMistakes} errors`)
      : (isAr
        ? `حللت القضيّة، لكن المهمّة سمحت بـ ${assignment.maxMistakes} أخطاء وسجّلت ${result.mistakes}. أعدها لإتقان الملف.`
        : `You solved the mystery, but this assignment allowed ${assignment.maxMistakes} errors and you recorded ${result.mistakes}. Replay to master the file.`);
    onResult?.({ won, score, summary });
  };

  return (
    <NoirCase
      key={`${assignment.caseData.id}-${diff}-${level}`}
      caseData={assignment.caseData}
      caseNo={level}
      isAr={isAr}
      playSfx={playSfx}
      mission={assignment}
      completionLabel={isAr ? 'تقييم المهمّة ←' : 'Evaluate assignment →'}
      onCaseDone={finish}
      onExit={onExit}
    />
  );
}

function shuffle(list, rng) {
  const result = [...list];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function passSequence(seed, count) {
  const rng = makeRng(seed ?? 1);
  const sequence = [];
  while (sequence.length < count) sequence.push(...shuffle(NOIR_CASES, rng));
  return sequence.slice(0, count);
}

function PassCases({
  seed, diff, attempt, isAr, playSfx, onResult, onExit,
}) {
  const total = Math.max(1, attempt?.trials || 2);
  const cases = useMemo(() => passSequence(seed, total), [seed, total]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const baseRules = RULES[diff] || RULES.med;
  const mission = {
    label: isAr ? `ملف المنافسة ${index + 1}/${total}` : `Competitive file ${index + 1}/${total}`,
    maxMistakes: baseRules.errors[2],
    instinctUses: baseRules.instincts[2],
  };

  const finish = (result) => {
    const nextScore = score + scoreCase(result);
    if (index + 1 >= total) {
      onResult?.({ score: nextScore });
      return;
    }
    setScore(nextScore);
    setIndex((value) => value + 1);
  };

  return (
    <NoirCase
      key={`${cases[index].id}-${index}`}
      caseData={cases[index]}
      caseNo={index + 1}
      isAr={isAr}
      playSfx={playSfx}
      mission={mission}
      hudRight={<span className="nr-chip">{score} {isAr ? 'نقطة' : 'pts'}</span>}
      completionLabel={index + 1 >= total
        ? (isAr ? 'إنهاء الجولة ←' : 'Finish round →')
        : (isAr ? 'الملف التالي ←' : 'Next file →')}
      onCaseDone={finish}
      onExit={onExit}
    />
  );
}

export default function NoirEngine(props) {
  if (props.mode === 'free') {
    return (
      <NoirSurvival
        seed={props.seed}
        isAr={props.isAr}
        playSfx={props.playSfx}
        awardPoints={props.awardPoints}
        awardFreeRun={props.awardFreeRun}
        onExit={props.onExit}
      />
    );
  }
  if (props.mode === 'passplay') return <PassCases {...props} />;
  return <LevelCase {...props} />;
}
