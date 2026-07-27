/*
 * Figures for Mindreading, indexed by chapter.
 *
 * Each one had to earn its place against a single test: does the picture carry
 * information the sentence could not? A diagram that merely repeats the text is
 * a cost, not a gain — so chapters without a genuinely visual idea get none,
 * and that is a deliberate outcome rather than an omission.
 *
 *   `reveal`  shown when the prediction gate opens, so the number you guessed
 *             lands as a picture. Guess → see the gap → read why: that pairs
 *             the pretesting effect with dual coding in one move.
 *   `inline`  keyed by section number, shown beside that part of the walk.
 *
 * Every value here is a real figure from the book, cited to its source.
 */
export default [
  // 1 · Introduction — no figure. The chapter is a distinction between two
  // definitions; drawing it would add a box, not an idea.
  {},

  // 2 · A Brief History
  {
    reveal: {
      kind: 'bars',
      title: 'Sarah picking the photo that solved the trainer’s problem',
      unit: '%',
      bars: [
        { label: 'Favourite trainer', value: 92, lead: true, note: '11 of 12 trials' },
        { label: 'Least favourite', value: 25, note: '2 of 8 trials' },
      ],
      caption:
        'The flexibility across scenarios is what Premack and Woodruff argued ruled out a behaviourist reading. The philosophers’ reply was that every trial only needed reasoning about the world, not about how the trainer represented it.',
      source: 'Premack & Woodruff, via Lavelle pp. 9–19',
    },
    inline: {
      '2.2': {
        kind: 'steps',
        title: 'The location-change false-belief task',
        steps: [
          { label: 'A puppet hides chocolate in the drawer', detail: 'The child watches.' },
          { label: 'The puppet leaves' },
          { label: 'Someone moves the chocolate to the cupboard', detail: 'The child sees this; the puppet does not.' },
          { label: 'The puppet returns', detail: 'Where will it look?' },
          {
            label: 'Under 4: “the cupboard”. From about 4: “the drawer”',
            detail: 'The younger answer tracks where the chocolate really is. The older one tracks what the puppet believes.',
            key: true,
          },
        ],
        caption:
          'The step that matters is the third: the child knows something the puppet cannot. Everything the task measures hangs on that asymmetry.',
        source: 'Wimmer & Perner, via Lavelle pp. 9–19',
      },
    },
  },

  // 3 · The New Pluralism
  {
    reveal: {
      kind: 'bars',
      title: 'How fast a face is categorised by gender, race and age',
      unit: 'ms',
      bars: [
        { label: 'Stereotype cues available', value: 185, lead: true, note: 'roughly 170–200 ms' },
        { label: 'A deliberate judgement', value: 800, note: 'for comparison — far slower' },
      ],
      caption:
        'This is why stereotyping is the fallback under time pressure or cognitive load. Speed does not entail inaccuracy — but it does mean an error is unlikely to be noticed by someone who has no capacity left to check.',
      source: 'Quadflieg, Mason & Macrae, via Lavelle pp. 20–44',
    },
    inline: {
      '3.2.3': {
        kind: 'contrast',
        title: 'REGISTRATION against BELIEF',
        left: {
          head: 'A MINIMAL MINDREADER CAN',
          items: [
            'Track that an agent encountered an object',
            'Hold that relation after the object leaves her field',
            'Predict she will go to the wrong box',
            'Act correctly towards someone with a false belief',
          ],
        },
        right: {
          head: 'BUT CANNOT',
          items: [
            'Represent HOW the agent sees something',
            'Grasp that the waiter believes it is water while she knows it is vodka',
            'Handle intensionality at all',
          ],
        },
        caption:
          'The limit is the definition. Registration buys almost everything belief buys, which is why passing a false-belief test need not mean attributing a belief.',
        source: 'Apperly & Butterfill, via Lavelle pp. 20–44',
      },
    },
  },

  // 4 · Mindreading in Infancy
  {
    reveal: {
      kind: 'gap',
      title: 'When infants appear to track a false belief',
      from: { at: '15 months', label: 'passes when you\nmeasure LOOKING' },
      to: { at: '~4 years', label: 'passes when you\nASK a question' },
      caption:
        'Both results are solid, and the interval between them is the entire puzzle of the chapter. The three explanations on offer disagree about whether the infants are mindreading at all.',
      source: 'Onishi & Baillargeon; Wimmer & Perner — via Lavelle pp. 45–50',
    },
    inline: {
      '4.2': {
        kind: 'steps',
        title: 'Violation of Expectation, as Onishi and Baillargeon ran it',
        steps: [
          { label: 'Familiarisation', detail: 'The infant watches the actor place a toy watermelon in a box, then reach into that box.' },
          { label: 'Belief induction', detail: 'The toy moves — with the actor absent (false belief) or present (true belief).' },
          { label: 'Test', detail: 'The actor reaches into one box. Looking time is recorded.' },
          {
            label: 'Infants looked longer whenever she reached against her belief',
            detail: 'True or false. Acting on a false belief did not surprise them at all.',
            key: true,
          },
        ],
        caption:
          'Heyes’ objection lives in the structure: across the experiment infants see one box reached into repeatedly and the other not at all, so novelty alone predicts the same looking pattern.',
        source: 'Onishi & Baillargeon, via Lavelle pp. 45–50',
      },
    },
  },

  // 5 · Mindreading across Cultures
  {
    reveal: {
      kind: 'bars',
      title: 'Where psychology’s participants come from',
      unit: '%',
      bars: [
        { label: 'Share of study participants', value: 96, lead: true, note: 'top journals, 2003–2007' },
        { label: 'Share of world population', value: 12, note: 'those same countries' },
      ],
      caption:
        'The claim that mindreading is constant was generalised from the upper bar. That does not make it false — it means it owes an argument it never had to give.',
      source: 'Henrich, Heine & Norenzayan, via Lavelle pp. 51–62',
    },
  },

  // 6 · Power Differentials
  {
    reveal: {
      kind: 'bars',
      title: 'Accuracy at reading emotion in photographs',
      unit: '',
      bars: [
        { label: 'High school graduates', value: 100, lead: true, note: 'consistently more accurate' },
        { label: 'College graduates', value: 78, note: 'lower, across both studies' },
      ],
      caption:
        'Shown as relative accuracy — the direction is the finding, and it runs opposite to most people’s guess. The proposed reason is attention rather than skill: if other people’s decisions can reshape your life, reading them carefully is worth the effort.',
      source: 'Kraus, Côté & Keltner, via Lavelle pp. 63–70',
    },
    inline: {
      '6.2': {
        kind: 'steps',
        title: 'How Rizzo and Killen manipulated status',
        steps: [
          { label: 'Children play a spot-the-difference game', detail: 'Stopped after three finds and declared a tie.' },
          { label: 'Prizes are handed out unfairly', detail: 'By gender — some children advantaged, some disadvantaged, on a basis they cannot control.' },
          { label: 'Then: a false-belief task and an emotion-prediction task' },
          {
            label: 'Disadvantaged children passed more often — even when advantage was earned on merit',
            detail: 'Which is what makes it a claim about status rather than about discomfort at injustice.',
            key: true,
          },
        ],
        caption:
          'The second study is the important one. Re-running it with merit-based advantage removes the obvious alternative explanation.',
        source: 'Rizzo & Killen, via Lavelle pp. 63–70',
      },
    },
  },

  // 7 · Conclusions — no figure. The chapter is an argument about what counts as
  // progress; there is no quantity or sequence in it to draw.
  {},
];
