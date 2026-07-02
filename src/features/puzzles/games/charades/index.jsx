import React from 'react';
import WordRaceGame from '../_shared/WordRaceGame';

/* Charades — act the word out, no talking. Shared WordRaceGame engine. */
export default function CharadesGame({ onBack }) {
  return (
    <WordRaceGame
      onBack={onBack}
      accent="#e0954a"
      emoji="🎭"
      title={{ en: 'Charades', ar: 'تمثيل' }}
      rule={{ en: 'Act it out — no talking!', ar: 'مثّلها — بلا كلام!' }}
      ready={{ en: 'Pass to the actor. Everyone else guesses out loud.', ar: 'مرّر الهاتف للممثّل. والبقية يخمّنون بصوت عالٍ.' }}
    />
  );
}
