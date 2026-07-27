/*
 * Mindreading — the learning layer.
 *
 * The walkthrough in mindreading.js makes the chapter READABLE without the
 * book. This file is what makes it LEARNABLE, and it is deliberately separate:
 * explaining a chapter and testing it are different jobs, and mixing them made
 * the walkthrough file hard to read.
 *
 * TWO MECHANICS, both chosen for reasons rather than for decoration:
 *
 * `predict` — you commit a guess BEFORE the chapter opens, then see the real
 *   answer. This is the pretesting (or errorful-generation) effect: guessing
 *   first beats studying alone, and it beats it hardest when the guess is
 *   wrong. Psychology is unusually well suited to it because its findings are
 *   counterintuitive — the gap between what you expect and what happened is
 *   the thing that sticks. Every item here is drawn from a real result in the
 *   chapter, so the reveal is a fact and not a trick.
 *
 * `checks` — comprehension questions where EVERY WRONG ANSWER IS A REAL
 *   MISCONCEPTION and carries a `why` explaining what is wrong with it. This is
 *   the opposite of what the old generated quiz did: that asked "which sentence
 *   came from this chapter?" with distractors lifted from other chapters, which
 *   tested whether you recognised prose you had just scrolled past. These ask
 *   whether you understood the argument, and a wrong answer teaches.
 *
 * Indexed by chapter, merged into the chapter objects in ./index.js.
 */
export default [
  // ── 1 · Introduction ──────────────────────────────────────────────────
  {
    predict: {
      setup:
        'Think back over the last hour of your social life — messages, queues, colleagues, family.',
      question:
        'What proportion of those interactions do you think actually required you to work out what someone was thinking?',
      options: ['Nearly all of them', 'Roughly half', 'A minority of them'],
      answer: 2,
      reveal:
        'Lavelle\'s argument is that it is a minority — and that assuming otherwise shaped thirty years of research. The literature called it the "ubiquity principle" and treated it as background fact rather than a claim. Most of what you did ran on scripts and roles: the queue, the crossing, the cashier.',
    },
    checks: [
      {
        q: 'What is the difference between mindreading and social cognition?',
        options: [
          {
            t: 'Mindreading is attributing psychological states; social cognition is the whole toolkit for navigating people, of which mindreading is one part.',
            ok: true,
            why: 'Right — and the gap between them is the space where scripts, roles and protocols do their work.',
          },
          {
            t: 'They are two names for the same capacity.',
            why: 'This is exactly the conflation Lavelle opens by attacking. Treat them as identical and "we mindread constantly" becomes true by definition rather than testable.',
          },
          {
            t: 'Social cognition handles groups; mindreading handles individuals.',
            why: 'Plausible but not the distinction. Both can concern one person — the difference is whether psychological states are being attributed at all.',
          },
        ],
      },
      {
        q: 'Lavelle says the four questions are entangled. What does that entanglement look like?',
        options: [
          {
            t: 'Deciding mindreading involves only simple states suggests a cheap mechanism, and a cheap mechanism could run constantly — so a WHAT answer quietly delivers a WHEN answer.',
            ok: true,
            why: 'Right, and this is why she says splitting them is artificial but useful: it makes the smuggling visible.',
          },
          {
            t: 'They have to be tackled in a fixed sequence, starting with HOW and only then moving on to what, why and when.',
            why: 'The opposite of her point. Starting with HOW is precisely what the field did for thirty years, and it left the other three sitting unexamined underneath.',
          },
          {
            t: 'Answering any one of the four settles the remaining three, so only one really needs investigating.',
            why: 'They constrain one another; they do not replace one another. All four still need separate answers, which is why she treats the split as useful despite being artificial.',
          },
        ],
      },
    ],
  },

  // ── 2 · A Brief History ───────────────────────────────────────────────
  {
    predict: {
      setup:
        'Premack and Woodruff showed the chimpanzee Sarah videos of a trainer struggling with a problem, then asked her to pick the photo showing the solution. With her FAVOURITE trainer she chose correctly on 11 of 12 trials.',
      question: 'How did she do when the video showed her least favourite trainer?',
      options: [
        'About the same — roughly 10 of 12',
        'Somewhat worse — around 6 of 12',
        'Far worse — 2 correct out of 8',
      ],
      answer: 2,
      reveal:
        'Two out of eight. Premack and Woodruff read the flexibility as evidence Sarah attributed mental states. The philosophers\' reply was sharper: every task only required her to reason about possible states of the world, never about how her trainers represented it. That objection is what produced the false-belief task.',
    },
    checks: [
      {
        q: 'What did theory-theory and simulation theory actually disagree about?',
        options: [
          {
            t: 'Only the mechanism — how states get attributed. They agreed mindreading targets propositional attitudes, aims at prediction, and happens nearly always.',
            ok: true,
            why: 'Right, and by the mid-2000s even the mechanism dispute had softened: Goldman allows information, Carruthers allows off-line simulation.',
          },
          {
            t: 'Whether other people really have minds, and whether we are ever entitled to assume so.',
            why: 'Neither position doubted that for a moment. The dispute was entirely about the machinery we use to read minds we both agreed were there.',
          },
          {
            t: 'Whether our knowledge of how minds work is innate or has to be learned from the environment.',
            why: 'That split runs *inside* theory-theory — Carruthers the nativist against Wellman the constructivist — rather than between theory and simulation.',
          },
        ],
      },
      {
        q: 'A three-year-old says the puppet will look in the cupboard, where the chocolate really is. What does the standard interpretation take this to show?',
        options: [
          {
            t: 'She does not yet grasp that people act on how they represent the world rather than on how it is.',
            ok: true,
            why: 'Right — and note this is an interpretation. Chapter 4 shows it has been contested from several directions.',
          },
          {
            t: 'She has not been paying attention to where the chocolate went.',
            why: 'Children reliably answer control questions about the chocolate\'s movements correctly. The failure is specific to predicting the puppet.',
          },
          {
            t: 'She cannot yet remember two locations at once.',
            why: 'A memory-load account does not explain why the error is systematically the *reality* answer rather than a random one.',
          },
        ],
      },
      {
        q: 'Simulation theorists call their process "knowledge-poor". What does that mean?',
        options: [
          {
            t: 'It needs no represented knowledge of the rules it follows — your mind conforms to psychological laws without storing them, as a rock conforms to physics.',
            ok: true,
            why: 'Right. The contrast is rule-conforming versus rule-guided: a driver knows traffic law and adjusts; a rock just falls.',
          },
          {
            t: 'It tends to produce unreliable results, because the process is starved of the information it would need.',
            why: '"Poor" describes what the process requires, not how well it works. Goldman explicitly allows information to guide the inputs.',
          },
          {
            t: 'It can only be applied to people you already know well enough to imagine your way into.',
            why: 'Nothing in simulation theory restricts it to familiar targets — you feed in candidate states whoever the person is.',
          },
        ],
      },
    ],
  },

  // ── 3 · The New Pluralism ─────────────────────────────────────────────
  {
    predict: {
      setup:
        'When a face appears, your visual system extracts information that feeds straight into stereotyping — the person\'s apparent gender, race and age.',
      question: 'How long after the face appears is that information available?',
      options: ['About 2 seconds', 'About half a second', 'About 170–200 milliseconds'],
      answer: 2,
      reveal:
        'Roughly 170–200 ms — faster than you can decide to do anything about it. That speed is why stereotyping is the fallback under time pressure or cognitive load. The uncomfortable part is not that stereotypes are always wrong (many match census-type measures reasonably well) but that when speed is the priority, an error is unlikely to be noticed and even less likely to be checked.',
    },
    checks: [
      {
        q: 'A minimal mindreader tracks that an agent REGISTERS the watermelon as being in the yellow box. What can she NOT do?',
        options: [
          {
            t: 'Grasp how the agent represents something — that the waiter believes the glass holds water while she knows it is vodka.',
            ok: true,
            why: 'Right. That is the intensionality limit, and it is the signature difference between registration and belief.',
          },
          {
            t: 'Predict that the agent will go to the wrong box and fail to find the watermelon.',
            why: 'She can. Add the rule "correct registration is a condition of successful action" and the prediction follows without any belief concept.',
          },
          {
            t: 'Keep tracking the agent and the object once the object has left her field of view.',
            why: 'That is precisely what registration adds over encountering — it persists when the object is out of view, which is what lets it be incorrect.',
          },
        ],
      },
      {
        q: 'Why does Lavelle say using a non-agentive goal concept is not mindreading?',
        options: [
          {
            t: 'Because the goal is not conceived as belonging to anyone — like the heart\'s function being to pump blood, no psychological state is attributed.',
            ok: true,
            why: 'Right. It explains behaviour as directed at an end without anyone representing that end, so nothing psychological is ascribed.',
          },
          {
            t: 'Because goals matter far less to social understanding than beliefs and desires do.',
            why: 'Not a claim she makes. The distinction is about whether a psychological state is attributed at all, not about importance.',
          },
          {
            t: 'Because the concept only ever applies to infants, who lack full psychological concepts.',
            why: 'She uses it for adults too — most strikingly to explain the Yasawa moral judgements in chapter 5.',
          },
        ],
      },
      {
        q: 'Mindshaping and ordinary prediction both make people easier to deal with. What is the difference?',
        options: [
          {
            t: 'Prediction observes what someone will do; mindshaping attributes a state partly to press them into behaving as it requires.',
            ok: true,
            why: 'Right — observer-to-observed versus participants bound by shared norms. Say "you\'re thirsty" and your neighbour either acts thirsty or denies it.',
          },
          {
            t: 'Mindshaping is just ordinary prediction carried out more carefully and accurately.',
            why: 'It may not aim at accuracy at all. What the target currently thinks matters less than what you want them to think.',
          },
          {
            t: 'Mindshaping is something adults do to children, and does not operate between adults.',
            why: 'McGeer\'s version is about adults among adults. Zawidzki\'s over-imitation case involves children, but that is one application, not the scope.',
          },
        ],
      },
      {
        q: 'You are at the supermarket and the cashiers are singing instead of scanning. What does Lavelle use this to show?',
        options: [
          {
            t: 'Going off-script does not automatically summon mindreading — you may just switch to a weaker "workers on strike" script.',
            ok: true,
            why: 'Right. Reading them as "wanting to withhold labour" adds nothing the strike script already carried.',
          },
          {
            t: 'That scripts fail as soon as anything unusual happens.',
            why: 'The opposite. Her point is that a second script absorbed the surprise, so scripts cover more than expected.',
          },
          {
            t: 'That mindreading is needed whenever expectations are violated.',
            why: 'That is the assumption she is testing. Sometimes it is needed and sometimes another script suffices — "it depends" is the pluralist answer.',
          },
        ],
      },
    ],
  },

  // ── 4 · Mindreading in Infancy ────────────────────────────────────────
  {
    predict: {
      setup:
        'On the classic false-belief task, children reliably give the wrong answer until around their fourth birthday. Then Onishi and Baillargeon measured looking time instead of asking a question.',
      question: 'At what age did infants appear sensitive to another person\'s false belief?',
      options: ['About 3 years', 'About 2 years', 'About 15 months'],
      answer: 2,
      reveal:
        'Fifteen months — well over two years before the classic task says the ability arrives. That gap is the whole puzzle of the chapter, and the three explanations for it disagree about something basic: whether the infants are mindreading at all.',
    },
    checks: [
      {
        q: 'Violation of Expectation infers what an infant expected. From what?',
        options: [
          {
            t: 'Looking time — infants look longer at events that surprise them, so longer looking at B indicates they expected A.',
            ok: true,
            why: 'Right, and that inference is exactly where Heyes attacks: surprise is not the only thing that drives longer looking.',
          },
          {
            t: 'Where the infant reaches, since reaching shows what she expects to find.',
            why: 'That would be a spontaneous *action* measure. VoE is purely about looking, which is why it needs no deliberate response.',
          },
          {
            t: 'Whether the infant imitates the actor once the demonstration has finished.',
            why: 'Imitation appears in Zawidzki\'s mindshaping argument, not in this paradigm.',
          },
        ],
      },
      {
        q: 'Heyes offers a deflationary explanation of the infant data. What is it?',
        options: [
          {
            t: 'Infants had seen the actor reach into one box repeatedly and the other not at all, so longer looking tracks plain novelty, not belief.',
            ok: true,
            why: 'Right — and it reproduces the observed pattern in every condition without granting infants any mental-state tracking.',
          },
          {
            t: 'The infants were simply too young to see the boxes and their contents clearly enough.',
            why: 'No perceptual claim is involved. Her account grants that infants saw everything and explains the looking times from what they had seen how often.',
          },
          {
            t: 'The experimenters unconsciously cued the infants towards the expected box.',
            why: 'A general worry about experimenter effects, but not Heyes\' argument. Hers is specific and built from the trial structure.',
          },
        ],
      },
      {
        q: 'Carruthers and the two-systems theorists both explain the developmental gap. What separates them?',
        options: [
          {
            t: 'Whether executive development *unmasks* an ability that was already there, or is partly what having the ability consists in.',
            ok: true,
            why: 'Right. For Carruthers the triple load hides existing competence; for two-systems theorists the later ability is genuinely still being built.',
          },
          {
            t: 'Whether infants possess any psychological concepts at all at fifteen months.',
            why: 'Both grant infants some concepts. The disagreement is about which kind — full beliefs, or minimal registrations.',
          },
          {
            t: 'Whether the elicited false-belief task is a well designed instrument in the first place.',
            why: 'Carruthers does think the task overloads children, but two-systems theorists are not defending the task — they are describing two mechanisms.',
          },
        ],
      },
    ],
  },

  // ── 5 · Mindreading across Cultures ───────────────────────────────────
  {
    predict: {
      setup:
        'Henrich and colleagues analysed the top psychology journals from 2003 to 2007 to see where participants came from.',
      question: 'What share of participants came from Western industrialised societies?',
      options: ['About 55%', 'About 75%', 'About 96%'],
      answer: 2,
      reveal:
        '96% — drawn from countries holding roughly 12% of the world\'s population, with 73% of first authors based in the United States. The claim that mindreading is constant was generalised from that slice. It does not make the claim false; it means the claim owes an argument it never had to give.',
    },
    checks: [
      {
        q: 'The opacity doctrine holds that another\'s thoughts are not ours to speculate about. What does it NOT claim?',
        options: [
          {
            t: 'That people lack thoughts, or that thoughts do not cause behaviour.',
            ok: true,
            why: 'Right — Lavelle stresses it is not behaviourism. The claim is that reaching for someone\'s thoughts is inappropriate, not that there is nothing to reach for.',
          },
          {
            t: 'That commenting on another\'s motives can be socially improper.',
            why: 'This is part of the doctrine, not something it denies. Stasch\'s Korowai respondents answered "she thinks for herself".',
          },
          {
            t: 'That it can affect how moral blame is assigned.',
            why: 'Also part of it — Yasawan participants attended to outcome over intention in the poison vignette.',
          },
        ],
      },
      {
        q: 'In Miller\'s study, Americans read an incident where an attorney late for court left an injured passenger at hospital. What was the striking finding?',
        options: [
          {
            t: 'They overlooked contextual information present in the story to speculate about dispositions that could only be inferred.',
            ok: true,
            why: 'Right. The fact that he was an attorney late for court was right there. Hindu participants used it; Americans reached past it for "obviously irresponsible".',
          },
          {
            t: 'They failed to understand the story because of unfamiliar cultural details.',
            why: 'The follow-up masked cultural cues — rupees became dollars — precisely to rule this out.',
          },
          {
            t: 'They refused to judge the attorney at all.',
            why: 'They judged him readily, and in dispositional terms. The contrast is in the *kind* of explanation, not its presence.',
          },
        ],
      },
      {
        q: 'Liu and colleagues found that Chinese mothers\' behaviour clarifications predicted children\'s later false-belief understanding. Why is that awkward?',
        options: [
          {
            t: 'In Western samples it is talk about mental states that predicts it — so the same endpoint is reached by opposite-looking routes.',
            ok: true,
            why: 'Right, and Lavelle canvasses several readings, including Andrews\' suggestion that a Western mind/behaviour dualism may make researchers miscode those descriptions as non-psychological.',
          },
          {
            t: 'It shows Chinese children never develop false-belief understanding.',
            why: 'They do. The study measured when it arrives and what predicts it, not whether it appears.',
          },
          {
            t: 'It contradicts the finding that talking to children helps.',
            why: 'Talking still helps. What is surprising is which *kind* of talk did the predicting.',
          },
        ],
      },
    ],
  },

  // ── 6 · Power Differentials ───────────────────────────────────────────
  {
    predict: {
      setup:
        'Kraus and colleagues asked participants to identify the emotions of people in photographs, splitting them by whether they had completed a four-year college degree.',
      question: 'Who read the emotions more accurately?',
      options: [
        'College graduates, by a clear margin',
        'No reliable difference between the groups',
        'High school graduates, consistently',
      ],
      answer: 2,
      reveal:
        'High school graduates, consistently — and lower-status participants were also more accurate about a peer they had just interviewed. The proposed reason is not skill but attention: if other people\'s decisions can reshape your life, reading them carefully is worth the effort. If they cannot, it is not.',
    },
    checks: [
      {
        q: 'The power hypothesis is about deployment rather than capacity. Why does that distinction matter?',
        options: [
          {
            t: 'It means the same person can read a superior closely and a subordinate barely — the claim is about whether mindreading is used here, not about how good you are at it.',
            ok: true,
            why: 'Right, and because power is relative rather than absolute, the effect should shift within a single day, which is what makes it testable.',
          },
          {
            t: 'It means people in powerful positions permanently lose the ability to read others well.',
            why: 'Nothing in the work suggests the capacity degrades. It suggests it is not recruited.',
          },
          {
            t: 'It means the effect shows up only in children, whose status is externally imposed.',
            why: 'Rizzo and Killen studied children, but Kraus and colleagues found it in adults with both objective and self-rated status.',
          },
        ],
      },
      {
        q: 'Rizzo and Killen rigged a game so children were unfairly advantaged or disadvantaged, then ran a second study allocating advantage on merit. Why the second study?',
        options: [
          {
            t: 'To test whether the effect depended on the advantage being unfair. It did not — disadvantaged children still outperformed.',
            ok: true,
            why: 'Right, and that is what makes it a claim about status rather than about discomfort at injustice alone.',
          },
          {
            t: 'To check that the children had understood the rules of the game they were playing.',
            why: 'Comprehension was not the variable. Both studies used the same task and changed only how prizes were justified.',
          },
          {
            t: 'To replicate the original finding in a older group of children.',
            why: 'The age range was the same. What changed was the basis of the status manipulation.',
          },
        ],
      },
      {
        q: 'Lavelle says the elicited tasks used in this literature cannot settle one thing. What?',
        options: [
          {
            t: 'Whether advantaged children were still tracking registrations and encounterings, since elicited tasks do not measure those.',
            ok: true,
            why: 'Right — which is why she proposes pairing spontaneous response tasks with power manipulations to separate the Propositional from the Radical challenge.',
          },
          {
            t: 'Whether the children had properly understood the instructions they were given.',
            why: 'A general methodological worry, but not the specific limit she identifies.',
          },
          {
            t: 'Whether perceived power affects adults in the same way that it affects children.',
            why: 'The Kraus studies already address adults. The gap she names is about which *level* of mindreading is being blocked.',
          },
        ],
      },
    ],
  },

  // ── 7 · Conclusions ───────────────────────────────────────────────────
  {
    predict: {
      setup:
        'Mindreading research collaborated closely with neuroscience, developmental psychology and cognitive ethology from the very beginning.',
      question: 'Which field does Lavelle single out as conspicuously absent?',
      options: ['Linguistics', 'Behavioural economics', 'Social psychology'],
      answer: 2,
      reveal:
        'Social psychology — the field that studies adults being social in messy real conditions, which is exactly what the laboratory version filtered out. Stereotyping, scripts and the cross-cultural work all show what it has to offer, and Apperly argues the traffic should run both ways.',
    },
    checks: [
      {
        q: 'Lavelle treats the loss of a tidy theory as progress. On what grounds?',
        options: [
          {
            t: 'A simple theory of a phenomenon that has been simplified out of existence explains nothing — better to model a messy real thing than a clean imaginary one.',
            ok: true,
            why: 'Right, and it is the same move as Heal\'s warning about misconceiving the end-point you are studying.',
          },
          {
            t: 'Because more complicated theories are generally more accurate than simple ones.',
            why: 'She makes no such claim. Complexity earns its place only where the phenomenon is genuinely complex.',
          },
          {
            t: 'Because the older theories were shown by later evidence to be straightforwardly false.',
            why: 'Her claim is subtler — they were largely bypassed rather than refuted, being about a narrower phenomenon than the real one.',
          },
        ],
      },
      {
        q: 'What is the difference between saying the old theories were "disproved" and saying they were "bypassed"?',
        options: [
          {
            t: 'Disproved means their answers were wrong; bypassed means their question was about something narrower than the real phenomenon.',
            ok: true,
            why: 'Right — which is why Lavelle says the live issue is whether they were about the right thing, not whether they were correct.',
          },
          {
            t: 'There is no real difference; both mean the theories failed.',
            why: 'The difference decides what to do next. A refuted theory is replaced; a bypassed one may still be right about the narrow case it described.',
          },
          {
            t: 'Bypassed means nobody reads them any more.',
            why: 'Not about readership. It is about the relationship between what they explained and what needs explaining.',
          },
        ],
      },
    ],
  },
];
