import { QUESTIONS as couples } from './couples.js';
import { QUESTIONS as duo } from './duo.js';
import { QUESTIONS as group } from './group.js';
import { QUESTIONS as psychology } from './psychology.js';
import { QUESTIONS as deep } from './deep.js';
import { QUESTIONS as fun } from './fun.js';
import { QUESTIONS as family } from './family.js';
import { QUESTIONS as work } from './work.js';

export const DECKS = [
  { id: 'couples', en: 'Couples', ar: 'للأزواج', icon: '💕', accent: '#d46a8a', minPlayers: 2, maxPlayers: 2, questions: couples },
  { id: 'duo', en: 'Duo', ar: 'لشخصين', icon: '🫶', accent: '#6b83c9', minPlayers: 2, maxPlayers: 2, questions: duo },
  { id: 'group', en: 'Group', ar: 'للمجموعة', icon: '🎉', accent: '#49a078', minPlayers: 3, maxPlayers: 12, questions: group },
  { id: 'psychology', en: 'Light Reflection', ar: 'تأمل خفيف', icon: '🌱', accent: '#7d9d72', minPlayers: 1, maxPlayers: 12, questions: psychology },
  { id: 'deep', en: 'Deep', ar: 'عميق', icon: '🌌', accent: '#6856a8', minPlayers: 2, maxPlayers: 12, questions: deep },
  { id: 'fun', en: 'Fun', ar: 'مرح', icon: '🎈', accent: '#e58a48', minPlayers: 2, maxPlayers: 12, questions: fun },
  { id: 'family', en: 'Family', ar: 'للعائلة', icon: '🏡', accent: '#c99051', minPlayers: 2, maxPlayers: 12, questions: family },
  { id: 'work', en: 'Work', ar: 'للعمل', icon: '💼', accent: '#4d8cb5', minPlayers: 2, maxPlayers: 12, questions: work },
];

export const deckById = (id) => DECKS.find((deck) => deck.id === id) || null;
