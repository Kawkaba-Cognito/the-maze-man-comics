/*
 * Learn topics — evidence-based reads about cognition and the brain.
 * Each topic is a title + an array of content blocks rendered by
 * LearnArticle.jsx. Inline `**bold**` markers are parsed at render time.
 * Content is English-only for now (source material is English; machine
 * translation of scientific text risked accuracy, so it was left out
 * rather than guessed).
 */
import { assetUrl } from '../../../lib/assetUrl';

export const LEARN_TOPICS = [
  {
    id: 'attention',
    icon: '🎯',
    title: 'Attention',
    titleAr: 'الانتباه',
    subtitle: 'Mastering Your Focus: A Scientific Guide to the Art of Attention',
    blocks: [
      { type: 'p', text: "Right now, your brain is quietly ignoring almost everything around you — the hum of the fridge, the weight of your clothes, a hundred things in the corner of your eye. That's not a flaw. It's **attention** doing its job: a gatekeeper deciding, moment to moment, what gets in and what gets filtered out. Scientists call this **endogenous** or **executive attention** — a process run internally by the brain's highest command centers, not something you have to white-knuckle into existence." },
      { type: 'p', text: "It's also the bedrock everything else is built on. Attention is the trigger for memory and learning — without the gatekeeper's approval, information never gets properly encoded, and learning stalls before it starts." },

      { type: 'tldr', label: 'In 30 seconds', items: [
        'Attention has **6 distinct sub-skills** — knowing which one is failing beats "trying harder."',
        'Your brain has a real, built-in **200–500ms blind spot** right after noticing something.',
        'Training works, but **"transfer" is mostly a myth** — a memory game won\'t fix your keys.',
        '**Two months** of short, regular sessions is the actual threshold for lasting change.',
      ] },

      { type: 'image', src: assetUrl('Assets/learn/attention-infographic.webp'), alt: 'Infographic summarizing the three attention networks, the six-level attention hierarchy, and the science of attention training', caption: 'The science of attention, at a glance.' },

      { type: 'h2', text: 'The anatomy of focus' },
      { type: 'p', text: "\"Attention\" isn't one thing — it's a hierarchy of sub-skills (Sohlberg & Mateer's model). Knowing which one is failing lets you target the actual problem instead of just \"trying harder.\"" },
      { type: 'ul', items: [
        '**Arousal** — your basic activation level. Alert and online, or sluggish and fatigued?',
        '**Focused attention** — targeting one specific stimulus, like spotting a notification.',
        '**Sustained attention** — holding steady focus over time, like following an hour-long lecture.',
        '**Selective attention** — concentrating on one task while inhibiting distractions, like reading a spreadsheet in a noisy office.',
        '**Alternating attention** — flexibly switching between tasks and picking back up where you left off.',
        '**Divided attention** — processing multiple things at once, like monitoring GPS while driving.',
      ] },
      { type: 'p', text: "Selective and divided attention aren't the same thing, and the difference matters: selective attention just filters noise, but divided attention carries a real **\"switching cost\"** — a measurable drain that shows up as more errors and faster fatigue. When you \"multitask,\" your brain isn't doing two things at once — it's rapidly switching between them, burning energy each time." },

      { type: 'h2', text: 'Three systems, not one' },
      { type: 'p', text: "Attention isn't localized to a single \"focus spot\" in the brain. Posner and Petersen (1990) identified three distinct networks working together:" },
      { type: 'table', headers: ['System', 'Role'], rows: [
        ['Alert system', 'Maintains arousal, prepares the brain for incoming stimuli.'],
        ['Orientation system', 'Directs focus toward visual stimuli and spatial locations.'],
        ['Execution system', 'Resolves conflicts, manages complex tasks, handles divided attention.'],
      ] },
      { type: 'p', text: "The execution system sits in the prefrontal cortex — the part of the brain that matures **last**, which is a real, physical reason children and teenagers struggle more with impulse control. After 60, natural declines in brain volume can slow these systems too — though as the next section covers, that's not a one-way street." },

      { type: 'h2', text: 'Why attention lapses — and why that’s not a failure' },
      { type: 'p', text: "Lapses are a biological reality, not a personal failing. One clean example: the **attentional blink**. In lab studies, there's a window right after noticing one thing where the brain reliably misses a second thing, because its attention resource is still tied up processing the first. That's not weak willpower — that's how the system is built." },
      { type: 'stat', value: '200–500ms', label: "The attentional blink — a real, measurable blind spot in every human brain, right after it locks onto something." },
      { type: 'ul', items: [
        '**Biological strain** — heat, fatigue, and poor nutrition all measurably degrade the alert system.',
        '**Clinical conditions** — in ADHD, structural differences in the prefrontal cortex make the gatekeeper less effective at inhibiting irrelevant input.',
        '**Aging** — brain volume can decline after 60, but **physical activity** has been shown to increase gray-matter volume even later in life, which is genuinely protective.',
      ] },

      { type: 'h2', text: 'Training attention: what the evidence actually supports' },
      { type: 'p', text: "The underlying mechanism is **brain plasticity** — the brain's ability to reorganize and strengthen its own connections through use. That's real. What it does and doesn't mean is where it's worth being precise — including about what this app itself can and can't promise you." },
      { type: 'callout', tone: 'fact', label: 'Fact —', text: 'targeted training can meaningfully improve specific skills: visual scanning, response time, focused inhibition.' },
      { type: 'callout', tone: 'fact', label: 'Fact —', text: "consistency beats intensity. Short, regular sessions (roughly 15 minutes, a few times a week) sustained for about two months is the rough threshold for new neural connections to stabilize." },
      { type: 'callout', tone: 'fiction', label: 'Fiction — the "transfer" myth —', text: "getting better at a tracking game makes you better at that game. It does not automatically make you better at remembering where you put your keys. Real-world benefit needs to be paired with actual lifestyle habits, not assumed." },
      { type: 'callout', tone: 'fact', label: 'Fact —', text: 'mindfulness practice has separately been shown to improve visuo-spatial processing and executive function, through a different mechanism than drilled cognitive tasks.' },
      { type: 'stat', value: '2 months', label: 'roughly how long consistent, short sessions take before new neural connections actually stabilize. Progress is real, but it isn\'t instant.' },

      { type: 'h2', text: 'Practical takeaways' },
      { type: 'ul', items: [
        "**Keep sessions short and regular** — a real 10–15 minutes, a few times a week, sustained for about two months, matters more than occasional long grinds.",
        "**Respect the blink** — when you're taking in complex new information, slow down. Your brain needs a beat to finish processing the first thing before the second one lands.",
        '**Move your body** — regular physical activity is one of the best-evidenced ways to protect gray matter and attentional control as you age.',
        "**If noisy rooms derail you, don't fight it with willpower** — some people genuinely have \"lower-span\" selective attention. Physical fixes (earplugs, noise-cancelling, a quieter seat) work better than forcing focus.",
      ] },
    ],
  },
];
