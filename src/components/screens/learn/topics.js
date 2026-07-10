/*
 * Learn topics — evidence-based reads about cognition and the brain.
 * Each topic is a title + an array of content blocks rendered by
 * LearnArticle.jsx. Inline `**bold**` markers are parsed at render time.
 * Content is English-only for now (source material is English; machine
 * translation of scientific text risked accuracy, so it was left out
 * rather than guessed).
 *
 * Voice: precise science, zero jargon-padding, a little mischief. Every
 * claim here is grounded in the NotebookLM source notebook (Sohlberg &
 * Mateer's hierarchy, Posner & Petersen's networks, the attentional-blink
 * literature, cognitive-training efficacy reviews) — the jokes are new,
 * the facts are not.
 */
import { assetUrl } from '../../../lib/assetUrl';

export const LEARN_TOPICS = [
  {
    id: 'attention',
    icon: '🎯',
    title: 'Attention',
    titleAr: 'الانتباه',
    subtitle: "Attention: The Bouncer at the Door of Your Mind",
    blocks: [
      { type: 'p', text: "As you read this sentence, your brain is ghosting a hundred other things — the hum of the fridge, the weight of your left sock, that tab you've kept open since Tuesday. That's not negligence. That's **attention** working: a bouncer at the door of consciousness, deciding moment by moment who gets in and who waits outside. Scientists call it **executive attention**. Everyone else calls it focus." },
      { type: 'p', text: "And it isn't a nice-to-have. Nothing gets remembered, learned, or even properly *experienced* without getting past the door first. No attention, no memory — the bouncer decides what your life gets to keep." },

      { type: 'tldr', label: 'In 30 seconds', items: [
        '"Focus" is **six different skills** wearing one name — diagnose before you blame yourself.',
        'Your brain literally blinks: a built-in **200–500ms blind spot** after it notices anything.',
        'Training works, narrowly: **a tracking game makes you better at tracking games.**',
        'Real rewiring takes **~2 months** of short, regular sessions. Slow is the mechanism, not the problem.',
      ] },

      { type: 'image', src: assetUrl('Assets/learn/attention-infographic.webp'), alt: 'Infographic summarizing the three attention networks, the six-level attention hierarchy, and the science of attention training', caption: 'The science of attention, at a glance.' },

      { type: 'h2', text: 'One word, six skills' },
      { type: 'p', text: "Saying \"my attention is bad\" is like saying \"my sport is bad.\" *Which one?* Neuropsychologists (Sohlberg & Mateer) split focus into a six-rung ladder — and knowing which rung wobbles tells you what actually needs work:" },
      { type: 'ul', items: [
        '**Arousal** — is the brain switched on at all? Pre-coffee you is intimately familiar with this rung.',
        '**Focused** — locking onto one thing: a ping, a face, a faint smell of burning.',
        '**Sustained** — *staying* locked: minute forty of the lecture, not minute two.',
        '**Selective** — holding one voice in a loud café while the room competes for you.',
        '**Alternating** — email → colleague\'s question → back to the exact sentence you left.',
        '**Divided** — GPS + traffic + podcast at once. (Spoiler: nobody truly does this one.)',
      ] },
      { type: 'p', text: "That spoiler matters. What feels like multitasking is the brain flipping a switch at speed — and every flip charges a **switching cost**, measurable in extra errors and faster fatigue. You're not doing two things at once. You're doing two things worse, in alternation." },

      { type: 'h2', text: 'Three networks, one show' },
      { type: 'p', text: "There's no single \"focus spot\" in the skull. Posner and Petersen traced attention to three cooperating brain networks — think stage crew, spotlight operator, and director:" },
      { type: 'table', headers: ['Network', 'Its job'], rows: [
        ['Alerting', '"Wake up — something\'s coming." Keeps the brain primed and ready.'],
        ['Orienting', '"Look there." Swings the spotlight across space and senses.'],
        ['Executive', '"Ignore that, resolve this." The director who settles every conflict.'],
      ] },
      { type: 'p', text: "The director — the prefrontal executive network — is the **last** brain region to finish wiring, which is why teenagers combine world-class orienting with questionable impulse control. That's biology, not character. Past 60 the whole crew slows a little too — though the next section carries genuinely good news about that." },

      { type: 'h2', text: 'Your brain blinks (and other honest excuses)' },
      { type: 'p', text: "Zoning out isn't a moral failure — it's on the spec sheet. The cleanest proof is the **attentional blink**: right after your brain catches one target, there's a window where a second one sails straight past, unseen. Not because you're careless. Because the machinery is still busy with the first." },
      { type: 'stat', value: '200–500ms', label: "the attentional blink — a blind spot built into every human brain. Yours, your boss's, everyone's." },
      { type: 'ul', items: [
        '**Heat, fatigue, hunger** — the alerting network runs on biology, and it degrades with it. An unfocused afternoon is often just an unfed one.',
        "**ADHD** — structural differences in prefrontal circuitry make the bouncer more permissive at the door. A wiring difference, not a willpower one.",
        '**Aging** — gray matter thins after 60, but **physical exercise measurably rebuilds it**. The door can be maintained for life.',
      ] },

      { type: 'h2', text: 'Can you train it? Yes — with fine print' },
      { type: 'p', text: "The mechanism is real: **plasticity**, the brain physically rewiring with use. The fine print is where the honesty lives — including about this app:" },
      { type: 'callout', tone: 'fact', label: 'Fact —', text: 'targeted practice sharpens exactly the skills you drill: visual scanning, reaction speed, distraction-inhibition.' },
      { type: 'callout', tone: 'fact', label: 'Fact —', text: 'consistency beats heroics. Ten focused minutes a few times a week outperforms one monthly marathon.' },
      { type: 'callout', tone: 'fiction', label: 'Fiction — "transfer" —', text: "getting brilliant at a memory game makes you brilliant at… that memory game. Your keys are on their own. Broad benefits need broad habits: sleep, movement, real-world practice." },
      { type: 'callout', tone: 'fact', label: 'Fact —', text: 'mindfulness practice improves executive and visuo-spatial attention through a separate route — so the two approaches stack.' },
      { type: 'stat', value: '2 months', label: "how long consistent practice needs before new wiring stabilizes. Not instant — which is exactly how you know it's structural." },

      { type: 'h2', text: 'Four moves worth stealing' },
      { type: 'ul', items: [
        '**Short and regular wins.** 10–15 minutes, a few times a week, for two months. Boring on paper; potent in cortex.',
        '**Respect the blink.** Learning something dense? Slow the intake — give target one time to clear before target two arrives.',
        '**Move your body to keep your mind.** Exercise is the best-evidenced protector of attention across the lifespan.',
        "**Stop out-toughing noisy rooms.** Some brains genuinely filter less — earplugs beat willpower. That's engineering, not weakness.",
      ] },
    ],
  },
];
