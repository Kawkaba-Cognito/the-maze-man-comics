export const PALETTE = {
  bg: '#12090a',
  text: '#f0e2c0',
  muted: '#9c8a70',
  accent: '#e8ac4e',
  rune: '#9cb752',
  card: '#1f160c',
  cardDeep: '#150e08',
  cardBorder: '#3a2b18',
};

export const DOMAIN_COLOR = {
  attention:   '#e8ac4e',
  speed:       '#64b5c2',
  memory:      '#9cb752',
  language:    '#d47a4a',
  reasoning:   '#b696d4',
  flexibility: '#e07aaa',
};

export const DOMAINS = [
  {
    id: 'attention',
    name: 'Attention',
    short: 'ATT',
    desc: 'Cancellation — level modes, 20 levels each, and same-grid challenge (FocusQuest-style).',
    glyph: 'ᚨ',
    subs: [
      { id: 'cancellation', name: 'Cancellation task', games: 1, progress: 0, game: 'cancel-task' },
    ],
  },
  {
    id: 'speed',
    name: 'Speed',
    short: 'SPD',
    desc: 'Processing information quickly and accurately',
    glyph: 'ᛋ',
    subs: [
      { id: 'processing', name: 'Processing Velocity', games: 3, progress: 0 },
      { id: 'reaction',   name: 'Reaction Speed',      games: 2, progress: 0 },
      { id: 'agility',    name: 'Mental Agility',       games: 2, progress: 0 },
    ],
  },
  {
    id: 'memory',
    name: 'Memory',
    short: 'MEM',
    desc: 'Holding, binding & recalling information',
    glyph: 'ᛗ',
    subs: [
      { id: 'working',     name: 'Working Memory',     games: 3, progress: 0 },
      { id: 'short',       name: 'Short-term Memory',  games: 2, progress: 0 },
      { id: 'associative', name: 'Associative Memory', games: 2, progress: 0 },
      { id: 'longterm',    name: 'Long-term Memory',   games: 1, progress: 0 },
    ],
  },
  {
    id: 'language',
    name: 'Language',
    short: 'LNG',
    desc: 'Words, meaning & verbal fluency',
    glyph: 'ᛚ',
    subs: [
      { id: 'fluency',       name: 'Verbal Fluency', games: 2, progress: 0 },
      { id: 'comprehension', name: 'Comprehension',  games: 2, progress: 0 },
      { id: 'naming',        name: 'Naming',         games: 1, progress: 0 },
    ],
  },
  {
    id: 'reasoning',
    name: 'Reasoning',
    short: 'RSN',
    desc: 'Logic, planning & problem-solving',
    glyph: 'ᛉ',
    subs: [
      { id: 'logical',   name: 'Logical Deduction',  games: 2, progress: 0 },
      { id: 'problem',   name: 'Problem Solving',    games: 2, progress: 0 },
      { id: 'planning',  name: 'Strategic Planning', games: 2, progress: 0 },
      { id: 'causal',    name: 'Causal Reasoning',   games: 1, progress: 0 },
    ],
  },
  {
    id: 'flexibility',
    name: 'Flexibility',
    short: 'FLX',
    desc: 'Shifting between tasks, rules & mindsets',
    glyph: 'ᚾ',
    subs: [
      { id: 'switching', name: 'Task Switching',      games: 3, progress: 0 },
      { id: 'setshift',  name: 'Rule Shifting',       games: 2, progress: 0 },
      { id: 'setbreak',  name: 'Mental Set Breaking', games: 2, progress: 0 },
      { id: 'adaptive',  name: 'Adaptive Response',   games: 1, progress: 0 },
    ],
  },
];

export const DOMAIN_ABOUT = {
  speed:       'Processing speed is the engine of thought. These mazes challenge how quickly you can take in, interpret, and act on information — reacting before the path fades.',
  memory:      "Memory binds past to future. Working memory is the mind's workbench — these mazes stretch it by asking you to hold routes and rules in mind while acting.",
  language:    'Language is thought made portable. These mazes weave words and meaning into navigation — spell, decode, and name your way through.',
  reasoning:   "Reasoning is the art of building bridges from what you know to what you don't. Plan, deduce, and solve your way through mazes that demand logic, not luck.",
  flexibility: "Flexibility is the mind's ability to bend without breaking. These mazes shift rules mid-run, invert controls, and force you to abandon your current strategy and adapt.",
};
