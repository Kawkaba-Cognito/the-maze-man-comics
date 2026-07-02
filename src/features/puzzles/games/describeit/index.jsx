import React from 'react';
import WordRaceGame from '../_shared/WordRaceGame';

/* Describe It — say clues, never the word itself. Shared WordRaceGame engine. */
export default function DescribeItGame({ onBack }) {
  return (
    <WordRaceGame
      onBack={onBack}
      accent="#5ec6a0"
      emoji="💬"
      title={{ en: 'Describe It', ar: 'صِفها' }}
      rule={{ en: "Describe it — don't say the word!", ar: 'صِفها — دون ذكر الكلمة!' }}
      ready={{ en: 'Pass to the describer. Everyone else guesses out loud.', ar: 'مرّر الهاتف للواصف. والبقية يخمّنون بصوت عالٍ.' }}
    />
  );
}
