/*
 * Learn topics — evidence-based reads about cognition and the brain.
 * Each topic is a title + an array of content blocks rendered by
 * LearnArticle.jsx. Inline `**bold**` markers are parsed at render time.
 * Content is English-only for now (source material is English; machine
 * translation of scientific text risked accuracy, so it was left out
 * rather than guessed).
 *
 * Voice: experiments first, lecture second. Prose is kept to short setup
 * lines; the science and its everyday relevance live inside each
 * experiment's own result explanation (src/components/screens/learn/
 * experiments/), triggered right when the reader has just felt the effect.
 * Every claim is grounded in the NotebookLM source notebook (Sohlberg &
 * Mateer's attention hierarchy, the attentional-blink literature,
 * cognitive-training efficacy reviews) — the jokes are new, the facts are not.
 */
export const LEARN_TOPICS = [
  {
    id: 'attention',
    icon: '🎯',
    title: 'Attention',
    titleAr: 'الانتباه',
    subtitle: "Attention: The Bouncer at the Door of Your Mind",
    blocks: [
      { type: 'p', text: "Forget the lecture. The fastest way to understand your own attention is to test it — three short experiments below, each with your own numbers and what they actually mean." },

      { type: 'tldr', label: "What you're about to do", items: [
        'Round 1 — measure your own **switching cost**, the tax of changing rules mid-task.',
        'Round 2 — catch your brain **blinking**, a real blind spot after every target it notices.',
        'Round 3 — try to genuinely **divide** your attention, and watch accuracy drop when you do.',
      ] },

      { type: 'h2', text: 'Switching cost' },
      { type: 'p', text: "One rule, 8 rounds. Then the same two rules, alternating every round. Answer fast — you're timing yourself." },

      { type: 'experiment', kind: 'switch-cost' },

      { type: 'h2', text: 'The attentional blink' },
      { type: 'p', text: "A fast letter stream. Remember the gold one, then try to catch a second target somewhere after it." },

      { type: 'experiment', kind: 'blink' },

      { type: 'h2', text: 'Divided attention' },
      { type: 'p', text: "Count one colour of dot. Then count two colours at once in a fresh stream. Same eyes, same brain." },

      { type: 'experiment', kind: 'divided-attention' },

      { type: 'h2', text: 'What to do with this' },
      { type: 'ul', items: [
        "**Train narrow, on purpose.** 10–15 minutes, a few times a week, for ~2 months — that's how long real rewiring (plasticity) takes to stabilize. It sharpens exactly the skill you drill, not attention in general.",
        "**Respect the blink.** Dense info, texting, driving — give target one a beat to clear before target two arrives.",
        '**Stop trusting "multitasking."** Your own numbers just showed it: switching and dividing both cost accuracy and time. Do the important thing alone.',
      ] },
    ],
  },
];
