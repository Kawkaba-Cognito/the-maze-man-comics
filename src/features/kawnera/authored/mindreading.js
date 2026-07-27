/*
 * Mindreading and Social Cognition — Jane Suilin Lavelle
 * Cambridge Elements in the Philosophy of Mind, 2022.
 *
 * Written from the book after reading it end to end. Section numbers and titles
 * mirror Lavelle's own, so you can move between this and the page.
 *
 * The spine of the whole Element: philosophy spent thirty years arguing about
 * HOW we read minds — theory-theory versus simulation — while quietly agreeing
 * on WHAT mindreading is, WHY we do it and WHEN. Lavelle's case is that those
 * three shared assumptions were wrong, and that dropping them changes the field
 * beyond recognition. Every chapter is a move in that argument.
 */
export default [
  // ══ 1 ═════════════════════════════════════════════════════════════════
  {
    pages: [7, 8],
    question: 'When you understand another person, are you really reading their mind?',
    summary:
      'Lavelle opens by separating two things the literature runs together. Mindreading is attributing psychological states to somebody. Social cognition is everything that lets us navigate other people — a much bigger category, because a great deal of social life demonstrably needs no mental-state attribution at all. She then sets out the four questions the Element is organised around, and flags that they are not independent: your answer to one silently constrains your answers to the rest.',
    sections: [
      {
        n: '1',
        title: 'Mindreading is narrower than social cognition',
        body:
          'Mindreading refers to attributing psychological states — beliefs, desires, feelings — to another person. Social cognition has the broader referent: the cognitive structures that let us navigate the social world. The gap between them is the whole reason this book exists, because you can interact perfectly well with someone by responding to their behaviour without giving a thought to what caused it.',
        points: [
          'You can anticipate people through social protocols rather than their minds: a zebra crossing, a bus queue.',
          'Protocols extend to roles — you have expectations of a bus driver and different ones of a fellow passenger.',
          'None of these obviously involves reasoning about anyone\'s psychological states.',
        ],
      },
      {
        n: '1',
        title: 'The four questions, and why they are entangled',
        body:
          'The Element asks when and why we mindread, which forces the prior question of what mindreading is. In the background sits the mechanism question: how do we attribute states at all? Lavelle stresses that answers co-depend, so splitting them is artificial — but useful, because it exposes assumptions that would otherwise stay invisible.',
        points: [
          'WHAT: which states get attributed — only beliefs and desires, or emotions and sensations too?',
          'WHY: what is it for — predicting behaviour, or something else entirely?',
          'WHEN: how often — nearly always, or only in specific circumstances?',
          'HOW: by what mechanism?',
          'The entanglement, worked through: if you say mindreading attributes very basic non-propositional states (a WHAT answer), you will expect a cheap mechanism (HOW), and a cheap mechanism could run constantly without draining anything — which delivers "most of the time" as your WHEN. One choice quietly sets up the next two.',
        ],
      },
      {
        n: '1',
        title: 'What the Element argues',
        body:
          'Until recently philosophers focused almost exclusively on HOW, in the back-and-forth between simulation and theory-theory that ran from the late 1980s to the mid-2000s. Both camps agreed on the other three answers: mindreading is attributing propositional attitudes (what), in order to explain and predict behaviour (why), underpinning the vast majority of our social interactions (when). Lavelle\'s worry is blunt — if there is no ability corresponding to what simulation theorists were trying to explain, their debates about how it proceeds are moot.',
        points: [
          'The literature is vast because philosophy, neuroscience, social psychology, developmental psychology, anthropology and cognitive ethology all claim a piece of it.',
          'Lavelle\'s charge: previous characterisations simplify mindreading so far that they "threaten to warp it out of existence altogether".',
          'The aim is to promote pluralism — the position developed in Section 3.',
        ],
      },
    ],
    terms: [
      { term: 'Mindreading', meaning: 'Attributing psychological states to another person. In this Element, any psychological state — not only beliefs and desires.' },
      { term: 'Social cognition', meaning: 'The whole set of cognitive structures that let us navigate the social world. Mindreading is one part of it.' },
      { term: 'Propositional attitude', meaning: 'A mental state with a proposition inside it: believing *that* the chocolate is in the drawer; wanting *that* she says yes.' },
      { term: 'Social protocol', meaning: 'A shared expectation about how people behave in a situation or role, which can guide interaction without any mental-state reasoning.' },
    ],
    evidence: [
      {
        study: 'The everyday cases',
        did: 'Lavelle points at ordinary interactions — crossing at a zebra crossing, queueing for a bus, expectations attached to the role of bus driver versus passenger.',
        found: 'Each runs on protocol and role. None obviously requires attributing psychological states, which is what makes the ubiquity assumption a claim rather than an observation.',
      },
    ],
    misconception: {
      believed: 'Understanding other people means working out what they are thinking.',
      actually:
        'Very often it means knowing what the situation calls for. You can predict a cashier perfectly without forming a single belief about their beliefs — and if that is typical rather than exceptional, the standard picture is in trouble.',
    },
    takeaway:
      'Mindreading is one tool for handling other people, not the whole toolkit — and separating it from social cognition is what turns "we mindread constantly" from an assumption into a testable claim.',
    recall: [
      'Give an example from your own day of a social interaction that needed no mindreading at all.',
      'Walk the entanglement: how does an answer to WHAT mindreading is end up determining an answer to WHEN we do it?',
      'Why does Lavelle say that if the traditional picture is wrong, the theory-versus-simulation debate becomes "moot" rather than merely mistaken?',
    ],
  },

  // ══ 2 ═════════════════════════════════════════════════════════════════
  {
    pages: [9, 19],
    question: 'What did the field believe about mindreading for thirty years — and what did it never check?',
    summary:
      'This chapter reconstructs the consensus that ran from the late 1970s to the mid-2000s. Its visible argument was theory-theory versus simulation theory, a dispute purely about mechanism. Lavelle\'s point is that the consequential material is elsewhere: in the answers to why, what and when that both sides took for granted, and which shaped every experiment the era produced.',
    sections: [
      {
        n: '2.1',
        title: 'Why: explanation and prediction',
        body:
          'The early literature assumed mindreading exists to explain and predict behaviour, with explanations shaped like the deductive-nomological model of Hempel and Oppenheim — a deductive argument from a covering generalisation. Two things supported this. The DN model was still dominant in philosophy of science when the mindreading literature formed; and from an evolutionary angle, predicting what another will do is more useful than knowing why. An animal that predicts a threat can avoid it without understanding anything about the other\'s reasons.',
        points: [
          'The consequence: prediction and explanation were treated as symmetrical — get the prediction machinery right and explanation follows for free.',
          'This is why the enormous developmental literature is about children *predicting* behaviour.',
          'Lavelle notes the assumption is rarely defended; Andrews has argued the connection between predicting and explaining is much weaker than assumed.',
        ],
      },
      {
        n: '2.2',
        title: 'What: propositional attitudes',
        body:
          'There are many psychological phenomena — emotions, moods, sensations, knowledge, expectations. The early literature attended almost entirely to propositional attitudes, and within those, overwhelmingly to belief. The trail runs from Premack and Woodruff\'s chimpanzee Sarah, through the philosophers\' reply that she had only been shown to reason about the world rather than about how her trainers represented it, to Wimmer and Perner designing a task that could tell those apart.',
        points: [
          'Location-change task: a puppet hides chocolate in a drawer and leaves; it is moved to a cupboard; where will the puppet look?',
          'Contents-switch task: a child sees a Smarties tube, says "Smarties", is shown pencils inside, then is asked what a waiting adult will think is in it.',
          'Both show the same shift: two- and three-year-olds give the reality answer, and around the fourth birthday they switch to the belief answer.',
          'Wellman\'s theory of mind scale widened this: diverse desires → diverse beliefs → knowledge-access → contents false belief → hidden emotion, passed in near-identical order worldwide though at differing ages.',
          'Rhodes and Wellman showed preschoolers who pass knowledge-access can be trained to accelerate false-belief performance, supporting the claim that earlier concepts are needed for later ones.',
          'Note what the scale still is: propositional attitudes, with emotion making a single token appearance at the very end.',
        ],
      },
      {
        n: '2.3',
        title: 'When do we mindread? Always',
        body:
          'The ubiquity principle — Lavelle\'s name for it — is the assumption that mindreading underpins the vast majority of social interaction. It appears in Nichols and Stich, in Fodor\'s remark that if ordinary understanding of the mind were seriously mistaken it would be "the greatest intellectual catastrophe in the history of our species", and across the most influential voices in the debate. Its effect was to set the explanatory bar: any acceptable account had to be compatible with mindreading driving almost everything.',
        points: [
          'Lavelle\'s counter-example: there is a world of difference between "making the baby stop crying" and "figuring out what the baby wants".',
          'A parent who has learned that a particular toy quiets the baby can hand it over without ever considering what the baby wants now.',
          'Mindreading may have established that learned behaviour without being involved in executing it.',
        ],
      },
      {
        n: '2.4.1',
        title: 'How: theory-theory',
        body:
          'Theory-theory descends from functionalism: mental-state concepts get their meaning from their causal-functional roles, and grasping them requires something like a theory describing those relations. Its distinctive claim is that at least some of these principles are explicitly represented in the mindreading system — a rule such as SEEING LEADS TO KNOWING is there and gets used to make inferences.',
        points: [
          'Crucially, these principles are sub-personal, so they cannot be introspected. You can tell "I am going to wash my hairs" is wrong without any access to the machinery that told you.',
          'Internal split — nativists (Carruthers) hold much of the theory is innate; constructivists (Wellman, Gopnik) hold that a few rules are innate and most are learned.',
          'Wellman\'s learning system is Bayesian and domain-specific, tuned to faces, eyes, intonation and intentional movement, evaluating hypotheses by prior and posterior probability.',
          'Example of that learning: an agent pulling five red beads from a jar the infant knows is mostly blue violates statistical expectation, cueing the infant that a psychological state, not the environment, is driving it.',
          'Lavelle notes the dispute is one of scope rather than content — Carruthers observes that multiple statistical-learning mechanisms would be "indistinguishable from a form of modular account".',
          'The real difference is acquisition: on the nativist picture concepts are "necessary conversions" of input, triggered in a brute causal way; on the Bayesian picture a child may show mastery, appear to lose it, and rediscover it as her theories shift.',
        ],
      },
      {
        n: '2.4.2',
        title: 'How: simulation theory',
        body:
          'Simulation theory attacks on two fronts: it denies that a theory is needed to individuate mental-state concepts, and denies that any such theory is represented in the mindreading system. Instead you use the mind you already have. Take it off-line, feed in the states you think the other person holds, run it, and read off the output as their prediction.',
        points: [
          'Lavelle\'s analogy: two engineers designing an aeroplane wing. One works from aerodynamics texts and algorithms; the other builds candidate shapes and puts them in a wind tunnel, adjusting by what he observes. The second may end with a working design he cannot explain.',
          'Requirements are modest: quarantine your own current states so they do not contaminate the run, and know the output is theirs, not yours.',
          'Simulation is called "knowledge-poor" — it needs no knowledge of the rules governing it.',
          'The underlying argument is rule-guided versus rule-conforming: a rock conforms to physical law without representing it; a driver is guided by traffic law she knows. Simulationists say minds merely conform to psychological laws, so there is no need to represent them.',
          'The standard objection: choosing which states to feed in is exactly what needed explaining, and simulation assumes it.',
          'Goldman concedes rules constrain input selection — a child may use SEEING LEADS TO KNOWING to generate the input — but argues this is not lawlike information of the kind distinctive of theory-theory, and that inputs requiring guidance does not undercut the simulation doing the work.',
        ],
      },
      {
        n: '2.4.3',
        title: 'The current state of play',
        body:
          'The positions converged more than the textbook framing suggests. Goldman does not rule out information-based processes; Carruthers describes a mindreading module that holds structured knowledge about minds *and* runs the subject\'s own inferential capacities off-line on suppositional input. What remains is a harder question than "which one is right": which kind of system underlies which instances of mindreading.',
      },
      {
        n: '2.5',
        title: 'Conclusion',
        body:
          'The chapter closes by naming its own moral. Discussions of this era focus on the dispute; the important thing is how much the disputants shared. The next chapter asks whether those shared assumptions are well founded enough to build on.',
      },
    ],
    terms: [
      { term: 'Deductive-nomological (DN) model', meaning: 'Hempel and Oppenheim\'s account of explanation: a deductive argument from a covering generalisation plus conditions. Its shape made prediction and explanation look symmetrical.' },
      { term: 'Ubiquity principle', meaning: 'Lavelle\'s label for the assumption that mindreading underpins the vast majority of our social interactions.' },
      { term: 'Elicited-response false-belief (EFB) task', meaning: 'A false-belief test requiring a voluntary answer — pointing or speaking — as opposed to measuring involuntary looking.' },
      { term: 'Theory of mind scale', meaning: 'Wellman\'s ordered sequence of mental-state concepts, from diverse desires through to hidden emotion.' },
      { term: 'Sub-personal', meaning: 'Belonging to a part of the mind rather than to you. Sub-personal principles do their work without being available to introspection.' },
      { term: 'Knowledge-poor process', meaning: 'A process needing no represented knowledge of the rules it follows — simulation theory\'s claim about mindreading.' },
      { term: 'Rule-guided vs rule-conforming', meaning: 'A driver knows traffic law and adjusts to it (guided); a rock obeys physics without representing it (conforming). Simulationists put minds in the second category.' },
    ],
    evidence: [
      {
        study: 'Premack & Woodruff — "Does the chimpanzee have a theory of mind?"',
        did: 'Sarah, a chimpanzee, watched videos of a trainer struggling with a problem (lighting a gas heater) and chose among photos, one of which showed the solution.',
        found: 'She chose correctly on 11 of 12 trials for a favoured trainer but only 2 of 8 for a disliked one. Premack and Woodruff argued the flexibility ruled out behaviourism. Bennet, Dennett and Harman replied that every task required reasoning only about possible states of the world, not about how the trainer represented it — which is what set off the false-belief literature.',
      },
      {
        study: 'Wimmer & Perner — the elicited false-belief task',
        did: 'Built a test that isolates representation: a puppet hides chocolate, leaves, the chocolate is moved, and the child predicts where the puppet will look.',
        found: 'Two- and three-year-olds answer with the real location; around the fourth birthday they answer with the puppet\'s belief. Replicated many hundreds of times; Lavelle says it is hard to overstate how far it dominated developmental psychology.',
      },
      {
        study: 'Kushnir, Xu & Wellman — the beads',
        did: 'Infants watched an agent draw five red beads from a jar they knew contained mostly blue ones.',
        found: 'The statistical violation cues infants that a psychological state, rather than an environmental constraint, is producing the behaviour — the kind of environmental evidence Wellman\'s Bayesian learner is tuned to.',
      },
    ],
    misconception: {
      believed: 'The big argument in this field was theory-theory versus simulation theory.',
      actually:
        'That was the visible argument, and by the mid-2000s the two had largely converged — Goldman admits information, Carruthers admits off-line simulation. The consequential part was never in dispute at all: that mindreading is about propositional attitudes, aimed at prediction, and running nearly all the time.',
    },
    takeaway:
      'A generation answered "how?" in enormous detail while treating "what, why and when" as settled — and it is those three that the rest of the book pulls apart.',
    recall: [
      'State the three assumptions theory-theory and simulation theory shared.',
      'Explain the two-engineers analogy, and say which part of mindreading each engineer stands for.',
      'What was the philosophers\' reply to the Sarah experiment, and why did it require a new kind of task?',
      'Nativists and constructivists disagree about acquisition. What does "necessary conversion" mean, and how does the Bayesian alternative differ?',
      'Why would the whole "how" debate be in trouble if the ubiquity principle turned out to be false?',
    ],
  },

  // ══ 3 ═════════════════════════════════════════════════════════════════
  {
    pages: [20, 44],
    question: 'What happens to the field if the honest answer to every question is "it depends"?',
    summary:
      'This is the Element\'s central chapter and its longest. Pluralism holds that none of the four questions has a single answer: it depends on your goal in the interaction, the information available, and what kind of output you need. Lavelle rebuilds each question on pluralist lines — and the cumulative result is that large parts of what we call "understanding people" turn out not to involve reading minds at all.',
    sections: [
      {
        n: '3.1',
        title: 'The pluralist research programme',
        body:
          'Andrews, Spaulding and Westra present pluralism as a "big tent" research programme rather than a single theory: some versions replace traditional accounts of folk psychology, some reframe its function, some work within the old framework and aim to enhance it. Lavelle takes the obvious objection seriously — that this is unwieldy, and that the old narrowness at least generated clear questions.',
        points: [
          'The reply: we cannot explain mindreading until we have an accurate account of what needs explaining, and the real phenomena are messier than prediction, propositional attitudes and ubiquity allow.',
          'Jane Heal\'s image: theorising about young children resembles solving simultaneous equations with far more unknowns than equations — and the worst thing you could do is misconceive the end-point the child is developing towards.',
          'Apperly\'s related point: it is not clear the simple judgements studied in mindreading share a cognitive basis with what social psychology studies, and researchers extending their reach would do well to look there.',
          'Why this matters concretely: participants in false-belief tasks know nothing about Maxi and sit in quiet rooms designed to focus attention. Real mindreading is shaped by status, distraction and motivation. Pluralists say scaling up means confronting that noise rather than filtering it out.',
        ],
      },
      {
        n: '3.2.1',
        title: 'What: mindreading and folk psychology',
        body:
          'Pluralists widen the target. There are far more attributable states than propositional attitudes — emotions, sensations, character traits, goals, perceptions. From here on in the Element, "mindreading" means attributing *any* psychological state; a creature that attributes even something as simple as being frightened counts as a mindreader.',
        points: [
          'Folk psychology is a different thing: our everyday, articulable understanding of psychological states, in the Lewis and Churchland tradition of collected platitudes.',
          'Stich and Ravenscroft argued that although sub-personal mindreading processes shape folk intuitions, there is no reason to expect their contents to match — the analogy is grammar, where sub-personal rules shape but do not equal our folk account of them.',
          'The methodological upshot: to uncover folk psychology, introspect. To uncover mindreading, run experiments and infer indirectly.',
        ],
      },
      {
        n: '3.2.2',
        title: 'What: perceptual content (minimal mindreading)',
        body:
          'Apperly and Butterfill\'s minimal account is built on two claims: some mindreading is fast and automatic, and anything that fast cannot be running propositional content, which is too complex. So they propose non-representational analogues. FIELD is roughly the set of objects an agent can see; ENCOUNTERING is the relation between an agent and an object in her field.',
        points: [
          'The vocabulary matters: an *automatic* process is involuntary, reflexive and cannot be inhibited; a *spontaneous* one starts quickly and involuntarily but is moderated by attention or intention.',
          'A minimal mindreader can do real work — protect resources by keeping them out of another\'s field, decide whether to compete for something being encountered.',
          'But there are signature limits: she cannot act on how another perceives an object, only that they encountered it.',
          'FIELD and ENCOUNTERING are psychological but non-folk-psychological — used by the system, distinct from the folk concept SEEING.',
          'Heyes has questioned whether the dot perspective task requires attributing any psychological state, arguing gaze-following suffices.',
        ],
      },
      {
        n: '3.2.3',
        title: 'What: belief-like states',
        body:
          'REGISTRATION is the minimal analogue of belief. Where belief is a relation to a representation, registration is a relation to an encountered object — and it persists when the object is no longer being encountered, which is what gives it correctness conditions.',
        points: [
          'The worked case: an agent encounters watermelon placed in a yellow box; a screen cuts off her field; the watermelon is moved to a green box. She now bears an incorrect registration relation to it.',
          'Add one rule — "correct registration is a condition of successful action" — and the minimal mindreader predicts she will fail, going to the yellow box.',
          'Crucially this needs no metarepresentation. The observer represents a registration relation, not that the agent *believes* anything.',
          'The signature limit is intensionality: a minimal mindreader cannot grasp that while she knows the man is drinking a vodka-martini, the waiter believes it is water. At best she tracks that he registers clear liquid.',
        ],
      },
      {
        n: '3.2.4',
        title: 'What: goals',
        body:
          'Ordinary talk treats goals and desires as the same, but a more careful reading splits them three ways: non-agentive goals, agentive goals, and desires. Teleofunctional accounts explain how you can see an action as goal-directed without attributing any psychological state to the agent.',
        points: [
          'The analogy from philosophy of biology: the heart\'s function is to pump blood, and that function does not require the heart to *want* to pump blood.',
          'Non-agentive goals, in Roessler and Perner\'s phrase, are "not conceived as the agent\'s, or indeed anyone\'s goal" — so they are not psychological concepts at all, and using them is not mindreading.',
          'An infant can grasp that a movement is directed at the teddy rather than the ball without attributing a desire for the teddy.',
          'Agentive goals *are* psychological but need not be propositional. Motor representations are a candidate vehicle — Rizzolatti and Craighero describe mirror neurons transforming visual information into knowledge of an action\'s outcome.',
          'DESIRE, by contrast, is a full propositional attitude and requires metarepresentation.',
          'Not everyone accepts the mirror-neuron reading; Csibra, Lavelle and Spaulding offer alternatives.',
        ],
      },
      {
        n: '3.3.1',
        title: 'How: model theory',
        body:
          'Rather than theory or simulation, recent work casts mindreading as competence with a model. Models earn their keep on complex interactive phenomena with many unknowns, and — importantly — need not resemble what they represent. Population equations look nothing like populations. That is already a break from simulation theory, where the model is your own mind and therefore necessarily resembles the target.',
        points: [
          'Conway\'s mindspace: a multidimensional space representing up to six traits, with the "average mind" at the centre and individuals placed relative to it.',
          'It accommodates individual differences naturally — Mo\'s friends are reliable and trustworthy so he correlates those traits; Asha\'s friends are scatty but trusted, so in her space they do not correlate.',
          'You are unlikely to place your own mind at the centre; most people rate themselves above average on some dimensions.',
          'Maibom argues competence with a model is a *practice* — which explains how models generalise. Ecologists were puzzled that reintroducing pine-martens increased red squirrel numbers despite pine-martens preying on them; applying an existing shared-predator model showed pine-martens suppress invasive grey squirrels, which normally outcompete the reds.',
          'Fluency with a mindspace comes the same way: through practice you learn when it applies, when experience should reshape it, and when someone is an outlier who should not reshape it at all.',
          'Pluralists split on status: for Godfrey-Smith, Maibom and Spaulding, modelling *enhances* theory-theory, since building a model needs theoretical axioms. Andrews places more distance, construing mindreading models normatively rather than causally.',
        ],
      },
      {
        n: '3.3.2',
        title: 'How: sensory communication',
        body:
          'Nearly every account assumes the input to mindreading is vision. But we hear and touch people too. Botero\'s work on touch is Lavelle\'s illustration of how much a single-modality assumption costs.',
        points: [
          'Haptic touch identifies external objects; affective touch is perceived through CT afferents and produces emotional and behavioural responses to skin contact.',
          'CT afferents are found only in hairy skin and are shared with non-human animals.',
          'Affective touch can communicate fear, anger, disgust, love, gratitude and sympathy.',
          'It is a primal channel between mother and infant — infants recognise through touch whether their mother is frightened, relaxed or aggressive.',
          'Botero argues touch may precede and even scaffold vision, given how much better developed intentional touching is than the newborn visual system.',
          'Lavelle notes touch is barely mentioned in the mindreading literature, and that she had not considered it until Kristin Andrews pointed her to the work.',
        ],
      },
      {
        n: '3.3.3',
        title: 'How: stereotypes',
        body:
          'A stereotype is a set of beliefs about the traits characterising typical group members, generating expectations about behaviour in new situations. Applying one is a method of mindreading quite unlike the traditional picture, because it need not involve attributing any specific belief or desire.',
        points: [
          'Andrews\' example: generalisations about what shop assistants do give predictions good enough for a smooth transaction without thinking about their psychology at all. On her account that is social cognition without mindreading; Lavelle prefers Westra\'s broader reading, on which stereotyping can also attribute states.',
          'Speed is the point: gender, race and age are processed roughly 170–200 ms after a face appears, so stereotyping is what gets used under time pressure or cognitive load.',
          'Many stereotypes are accurate, in the narrow sense that beliefs about typical group characteristics often match independent measures such as census data. That is distinct from beliefs about the historical or social *causes* of those traits being correct.',
          'The real hazard is subtler than inaccuracy: because speed is the priority, the mindreader may not notice a wrong result and may not care — and if she is stereotyping because she is cognitively loaded, checking is exactly what she has no capacity for.',
          'Lavelle uses this to show how method and goal intersect: speed does not entail inaccuracy, but it lets inaccuracy persist unspotted.',
        ],
      },
      {
        n: '3.4.1',
        title: 'Why: mindshaping',
        body:
          'McGeer and Zawidzki propose that part of the point of attributing states to people is to press them into behaving as those states require. McGeer develops this through Sellars\' myth of Jones — an ancestor who invents talk of inner "thoughts" and finds her predictions improve.',
        points: [
          'McGeer\'s addition asks *why* the predictions improve, and the answer is normative: folk psychology specifies how one ought to behave given a state.',
          'Churchland\'s platitude "persons who feel thirst tend to desire potable fluids" becomes a lever — say "you\'re thirsty" and your neighbour either acts thirsty ("yes, I\'ll take some tea") or denies it and is released from the obligation.',
          'The contrast that makes it vivid: a scientist theorises about bacteria and the bacteria do not adjust. Humans, once aware of expectations, frequently do.',
          'So Jones and her peers are no longer observer and observed but participants bound by shared norms — which is why several commentators criticise theory and simulation as "spectatorial".',
          'Related phenomena: demand characteristics in experiments, and Hacking\'s "looping effects".',
          'Zawidzki\'s more radical version: mindshaping predates mindreading both ontogenetically and phylogenetically, so you can shape without representing propositional attitudes. His example is over-imitation — children copy adults\' movements closely even when shown a more efficient method — which lets adults shape behaviour that later acquires mental-state associations.',
        ],
      },
      {
        n: '3.4.2',
        title: 'Why: is mindreading even aiming at accuracy?',
        body:
          'Traditional accounts assume accuracy is the goal. Pluralists point out that a great deal of mindreading is not trying to be accurate at all. Spaulding adds motives such as boosting your own self-esteem or shifting someone\'s opinion.',
        points: [
          'With mindshaping, what the target currently thinks matters less than what we want them to think.',
          'Confirmation bias pushes us to infer states matching our stereotype rather than finding out what someone actually thinks.',
          'Spaulding\'s asymmetry: situational explanations for the success of out-group members, mental-state explanations for friends. Mo explains Asha\'s promotion by external factors, and Paul\'s by his dedication and hard work — the pattern that flatters Mo.',
          'Lavelle\'s sharper point: under theory-theory or simulation theory, mindreading-for-self-esteem is not merely overlooked but hard to accommodate at all, since both assume accuracy is the aim. It would be filed as anomalous.',
        ],
      },
      {
        n: '3.5.1',
        title: 'When: scripts and event schemas',
        body:
          'Script theory rose in the late 1970s promising to unify social, developmental and cognitive psychology. A script is a conceptual structure describing appropriate sequences of events in a context, and scripts vary in strength.',
        points: [
          'Weak scripts are loose and unsequenced — a night out involves chats, drinks, laughter and dancing, in no particular order.',
          'Strong scripts are rigidly causal — the school run requires children washed and dressed before leaving, and leaving before locking the door.',
          'Scripts limit the information you must process and direct attention: a waiter\'s restaurant script makes him attend to water levels, which are not events in the diner\'s script.',
          'The supermarket case: stack items, hear the total, pay. No mindreading of the cashier required.',
          'Going off-script does not automatically summon mindreading. If the cashiers are singing, a glance reveals a strike, and you switch to a weak "workers on strike" script — reading them as "wanting to withhold labour" adds nothing the script did not already carry.',
          'But scripts are normative, and using them well often needs *some* attribution — recognising the waiter\'s intent as he reaches for your bowl, or judging whether he ignored your request or simply missed it.',
        ],
      },
      {
        n: '3.5.2',
        title: 'When: behaviour-reading',
        body:
          'Behaviour-readers navigate socially by reasoning about behaviour rather than mental states. Povinelli and colleagues argue chimpanzees have abstract behavioural concepts — "threat display", "grabbing" — allowing them to categorise others\' behaviour and respond appropriately without attributing anything psychological.',
        points: [
          'A chimpanzee can recognise threat in an animal she has never met by perceiving characteristic tokens — bristling hair, bared teeth — and predict charging or hitting.',
          'The hard case for this programme is tracking what another sees, which requires at least a minimal psychological state.',
          'Hare and colleagues (2001) changed the paradigm from cooperative to competitive: subordinate chimpanzees went for food more often, and got it more often, when the dominant had not seen it hidden or moved.',
          'Krupenye and colleagues (2016) report great apes attributing false beliefs. If that holds, behaviour-reading looks less likely — though it still demonstrates that complex social interaction *without* mindreading is a coherent possibility.',
        ],
      },
      {
        n: '3.5.3 / 3.6',
        title: 'Two challenges, and what is left unexplored',
        body:
          'Lavelle names the two ways pluralists attack the ubiquity principle. The Propositional challenge says some interactions involve mindreading but not propositional attitudes. The Radical challenge says many involve no mindreading at all. She adds a further layer: two people may differ in whether they mindread the same situation, and one person may differ moment to moment.',
        points: [
          'Left undeveloped, by her own admission: Participatory Sense Making and Primary Intersubjectivity, which would require a deeper dive into 4E cognition — enactive, embedded, extended, embodied.',
          'The chapter\'s function is to show pluralism is possible for all four questions; the case studies in chapters 4–6 then test it.',
        ],
      },
    ],
    terms: [
      { term: 'Pluralism', meaning: 'The position that none of the four questions about mindreading has a single answer — it depends on goals, available information and the output required.' },
      { term: 'FIELD', meaning: 'In minimal mindreading, roughly the set of objects an agent can see.' },
      { term: 'ENCOUNTERING', meaning: 'The relation between an agent and an object in her field. A non-representational stand-in for seeing.' },
      { term: 'REGISTRATION', meaning: 'The minimal analogue of belief: a relation to an encountered object that persists once the object leaves the field, and can therefore be incorrect.' },
      { term: 'Metarepresentation', meaning: 'Representing someone else\'s representation. Minimal mindreading is designed to avoid needing it.' },
      { term: 'Intensionality', meaning: 'The fact that how something is described matters — the waiter may believe the man drinks water while you know it is vodka. Minimal mindreaders cannot track this.' },
      { term: 'Automatic vs spontaneous', meaning: 'Automatic: involuntary, reflexive, uninhibitable. Spontaneous: quick and involuntary but moderated by attention or intention.' },
      { term: 'Teleofunctional goal', meaning: 'A goal understood as an action\'s end, on the model of the heart\'s function being to pump blood — no desire required.' },
      { term: 'Non-agentive goal', meaning: 'A goal not conceived as belonging to anyone. Because it is not psychological, using it is not mindreading.' },
      { term: 'Mindspace', meaning: 'Conway\'s model: a multidimensional trait space with the average mind at the centre, against which others are placed.' },
      { term: 'Mindshaping', meaning: 'Attributing states partly in order to press people into behaving as those states require, making them more predictable.' },
      { term: 'Script', meaning: 'A stored sequence of events for a familiar context. Strong scripts are causally ordered; weak ones are loose expectations.' },
      { term: 'CT afferents', meaning: 'Nerve fibres in hairy skin carrying affective touch, as opposed to haptic touch used for identifying objects.' },
      { term: 'Propositional / Radical challenge', meaning: 'Two attacks on ubiquity: that interactions may involve non-propositional mindreading, or no mindreading at all.' },
    ],
    evidence: [
      {
        study: 'Samson and colleagues — the dot perspective task',
        did: 'Adults reported how many dots they saw in a pictured room that also contained an avatar who could see a different number.',
        found: 'People were slower when their count differed from the avatar\'s, despite the avatar being irrelevant — read as evidence that perspective-taking is automatic. O\'Grady and colleagues later argued it is merely spontaneous, occurring only when subtle cues drew attention to the avatar.',
      },
      {
        study: 'Conway and colleagues — Sally-Anne with character traits',
        did: 'Ran the classic false-belief task after telling participants how paranoid Sally was and how honest Anne was, and that Sally knew Anne well.',
        found: 'With Sally paranoid and Anne dishonest, participants were less likely to predict Sally would look where she left the marble. Where the protagonists sat in the participant\'s own mindspace changed the belief attributed to them.',
      },
      {
        study: 'The pine-marten and the red squirrel',
        did: 'Ecologists in Scotland faced a puzzle: reintroducing pine-martens increased red squirrel numbers, though pine-martens prey on red squirrels.',
        found: 'Applying an existing shared-predator model resolved it — pine-martens sharply reduce invasive grey squirrels, which normally outcompete the reds. Maibom\'s point is that transferring a model to a new case is a skill built by practice, exactly like fluency with a mindspace.',
      },
      {
        study: 'Hare, Call & Tomasello (2001)',
        did: 'Restructured chimpanzee experiments around competition rather than cooperation, with subordinates competing against dominants for food.',
        found: 'Subordinates went for the food more often, and obtained it more often, when the dominant had not seen it hidden or moved — evidence the subordinate tracked what the dominant had seen.',
      },
    ],
    misconception: {
      believed: 'Stereotyping is simply inaccurate, lazy thinking.',
      actually:
        'Many stereotypes match independent measures of group characteristics reasonably well, and speed does not entail inaccuracy. The real cost is that because speed is the priority — often because the person is cognitively loaded — errors go unnoticed and unchecked by someone who has no spare capacity to check them.',
    },
    takeaway:
      'Once you allow that mindreading has many forms, many purposes and many inputs, large stretches of ordinary social life turn out to run without it at all.',
    recall: [
      'Explain REGISTRATION to someone who has not read this, and say exactly what a minimal mindreader cannot do with it.',
      'What is the difference between an automatic and a spontaneous process, and why does the dot perspective task sit between them?',
      'Give the heart analogy for non-agentive goals, and say why using such a goal is not mindreading.',
      'Describe a routine in your week that runs entirely on a script. What would have to happen before you started mindreading?',
      'Mindshaping and prediction both make people easier to deal with. State the difference precisely.',
      'Why is mindreading-for-self-esteem not merely overlooked by theory-theory and simulation theory, but hard for them to accommodate?',
      'State the Propositional challenge and the Radical challenge, and give one example of each.',
    ],
  },

  // ══ 4 ═════════════════════════════════════════════════════════════════
  {
    pages: [45, 50],
    question: 'If babies pass a false-belief test at 15 months, why do three-year-olds fail one?',
    summary:
      'The first of three case studies. In 2005 Onishi and Baillargeon appeared to show 15-month-olds expecting people to act on false beliefs — a decade earlier than the classic task suggested. That opened a gap nobody has closed, and the three explanations on offer disagree about something fundamental: whether the infants are mindreading at all. Lavelle keeps the scope deliberately narrow here — controlled laboratory work only — in contrast to chapter 6.',
    sections: [
      {
        n: '4.1',
        title: 'Why this case study',
        body:
          'Infant false belief is used to probe the "when" and "what" questions together, since disputes about when we mindread rest on what you take mindreading to be. The scope is deliberately myopic: artificial laboratory conditions, not real-world interaction. Lavelle\'s argument is that both need to be in the picture for mindreading to be characterised properly.',
      },
      {
        n: '4.2',
        title: 'Spontaneous response false-belief tasks',
        body:
          'Onishi and Baillargeon used Violation of Expectation, which exploits the fact that infants look longer at events that surprise them. Longer looking at B than at A indicates the infant expected A. The paradigm was built for physical knowledge and extended to psychological concepts.',
        points: [
          'Stage 1, familiarisation: the infant watches an experimenter play with a toy watermelon and place it in one of two boxes, green or yellow, then reach into that box as if to grab it.',
          'Stage 2, belief induction, four conditions. In the critical false-belief conditions the watermelon moves in the experimenter\'s absence. Two versions guard against a colour preference — in one the toy moves yellow→green while she is away; in the other she watches it move yellow→green, is occluded by a screen, and it moves back green→yellow.',
          'In the two true-belief conditions she is present throughout and sees everything.',
          'Stage 3, test: the infant sees her reach into one box, and looking time is recorded.',
          'The finding: infants looked longer whenever she reached somewhere inconsistent with her belief — whether that belief was true or false. Infants who saw her act on a false belief were not surprised at all.',
          'Onishi and Baillargeon concluded 15-month-olds possess, at least implicitly, a representational theory of mind.',
          'Since 2005 more than thirty papers report success in under-twos. Methods widened to Anticipatory Looking (tracking gaze to where the protagonist will search) and EEG measures of six-month-olds\' motor predictions.',
        ],
      },
      {
        n: '4.2',
        title: 'The replication problem, stated plainly',
        body:
          'Lavelle does not bury this. There is a live debate about how reliable spontaneous response methods are. Several authors argue Anticipatory Looking cannot tap infant false-belief reasoning, and in some cases the original researchers cannot replicate their own work.',
        points: [
          'Kulke and colleagues have raised repeated concerns about the anticipatory looking method.',
          'Kampis and colleagues report failures to replicate original findings.',
          'Lavelle proceeds on the assumption that spontaneous methods reveal *some* ability to discriminate belief-congruent from belief-incongruent action, while stating openly that the supporting data are disputed.',
          'She notes the knock-on worry: if anticipatory looking is unreliable in infants, that raises questions about the great-ape results built on similar methods.',
        ],
      },
      {
        n: '4.3',
        title: 'The developmental gap',
        body:
          'This is the puzzle the 2005 result created. If 15-month-olds already have the concept BELIEF, why do three-year-olds — who have had eighteen more months of social life — fail the elicited task so reliably? Two families of answer compete, and the difference between them is not a detail. One says the ability was there all along and the task was hiding it. The other says the infants and the three-year-olds are running genuinely different machinery, and the later ability is still being built.',
        points: [
          'Carruthers\' masking account: elicited tasks impose a triple load — attribute the false belief to Maxi, work out the experimenter\'s intentions, and formulate a response. Under that load the initial representation is lost and the child defaults to her own knowledge.',
          'This fits his broader view that our default assumption is that others share our states, overridden by environmental cues about what they can see or hear.',
          'As working memory and executive function improve, the load eases and performance appears. Spontaneous tasks demand only one process, so infants pass far earlier.',
          'The two-systems account (Apperly, Butterfill, Low): infants are minimal mindreaders using REGISTRATION and ENCOUNTERING. Those concepts can drive involuntary behaviour like gaze duration but cannot inform deliberate action such as pointing or speaking, which needs propositional attitudes and a separate system with access to the broader cognitive system.',
          'The contrast matters: masking accounts treat executive development as *unmasking* an existing competence; two-systems accounts treat it as partly *constitutive* of the ability.',
          'de Villiers and Schick add that understanding complement clauses — "Asha thinks *that unicorns live on the moon*" — is necessary for grasping false belief, since complements need not refer to real states of affairs. Language supplies the framework propositional reasoning needs.',
          'Lavelle\'s reading: both sides agree infants use *some* psychological concepts; they disagree about which. Carruthers and Baillargeon sit closest to the traditional picture, Apperly and Butterfill closest to pluralism.',
        ],
      },
      {
        n: '4.4',
        title: 'Are infants mindreading at all?',
        body:
          'Heyes offers the deflationary reading. She starts from the uncontroversial fact that infants look longer at novel events, and argues novelty alone explains the looking times — no psychological state tracking required.',
        points: [
          'Worked through the False-belief Green condition: across the experiment infants see the experimenter reach towards the green box three times and never towards the yellow one until the test trial.',
          'So reaching for yellow is simply a novel sight, and reaching for green is not — which predicts exactly the looking pattern observed.',
          'Heyes gives comparable explanations for every condition.',
          'Her account of the developmental gap follows: elicited tasks test mindreading and spontaneous tasks do not.',
        ],
      },
      {
        n: '4.5',
        title: 'Conclusion',
        body:
          'Whether infants discriminate belief-congruent from belief-incongruent behaviour remains genuinely open. Lavelle\'s use of the case is not to settle it but to show that even one small set of studies supports pluralism about the "what" and "when" questions — and that those who read the data as belief attribution are unlikely to see it that way.',
      },
    ],
    terms: [
      { term: 'Violation of Expectation (VoE)', meaning: 'A method exploiting the fact that infants look longer at surprising events, used to infer what they expected.' },
      { term: 'Spontaneous response task', meaning: 'One measuring involuntary behaviour such as looking time, rather than requiring an answer.' },
      { term: 'Anticipatory Looking', meaning: 'Tracking where an infant looks *before* the protagonist acts, to see whether she predicts the search location.' },
      { term: 'Triple load', meaning: 'Carruthers\' claim that elicited tasks demand three simultaneous operations, overloading the child\'s system.' },
      { term: 'Complement clause', meaning: 'A sentence embedded in another — "Asha thinks that unicorns live on the moon". Because complements need not be true, they can express false belief.' },
      { term: 'Masking vs constitutive', meaning: 'Whether executive development reveals an ability that was already there, or is part of what having the ability consists in.' },
    ],
    evidence: [
      {
        study: 'Onishi & Baillargeon (2005)',
        did: 'Fifteen-month-olds watched a toy watermelon hidden in a yellow or green box and then moved, with the actor present or absent, across four conditions; researchers timed looking when she reached.',
        found: 'Infants looked longer whenever she reached somewhere inconsistent with her belief, true or false — concluded to show a rudimentary representational theory of mind a decade before the classic task.',
      },
      {
        study: 'Heyes — "False belief in infancy: a fresh look"',
        did: 'Re-examined what infants had actually seen across every phase of the experiment rather than what the design intended to test.',
        found: 'Infants had watched the actor reach into one box repeatedly and the other not at all, so the looking pattern follows from low-level novelty alone, with no belief attribution required.',
      },
      {
        study: 'The replication attempts',
        did: 'Multiple groups revisited anticipatory-looking paradigms built on the 2005 finding.',
        found: 'Kulke and colleagues question whether the method can tap false-belief reasoning at all; Kampis and colleagues report original researchers failing to replicate their own results.',
      },
    ],
    misconception: {
      believed: 'The infant studies proved babies understand beliefs.',
      actually:
        'They showed infants look longer at certain events. Whether that reflects belief attribution, minimal registration-tracking, or a plain preference for novelty is still openly disputed — and several of the findings have not replicated.',
    },
    takeaway:
      'The infancy debate is an argument about what should count as mindreading, conducted through looking times — which is why the same data supports three incompatible readings.',
    recall: [
      'Describe the three stages of the Onishi and Baillargeon design well enough that someone could picture it.',
      'Why were there two distinct false-belief conditions rather than one?',
      'Give Heyes\' alternative explanation using the False-belief Green condition, and say what it would take to rule it out.',
      'Carruthers says the task masks competence; two-systems theorists say the ability is not there yet. What is the difference between "unmasking" and "constitutive", and what observation would separate them?',
      'What do complement clauses have to do with false belief?',
    ],
  },

  // ══ 5 ═════════════════════════════════════════════════════════════════
  {
    pages: [51, 62],
    question: 'Is constant mind-reading a fact about humans, or a habit of one kind of culture?',
    summary:
      'The second case study, and the most direct threat to the ubiquity principle. The claim that mindreading is everywhere was made overwhelmingly by researchers from WEIRD societies studying people like themselves. Look wider and the picture shifts: some cultures explain behaviour through situation and duty rather than inner states, and some hold it improper to speculate about another mind at all. Lavelle is careful about what this does and does not show.',
    sections: [
      {
        n: '5',
        title: 'The WEIRD problem',
        body:
          'Henrich and colleagues coined WEIRD — Western, Educated, Industrialised, Rich, Democratic — and reported that an analysis of top psychology journals from 2003 to 2007 found 96% of participants came from industrialised Western societies. That is 96% of samples drawn from countries holding about 12% of the world\'s population, with 73% of first authors based in the United States.',
        points: [
          'It is not only the participants. Scientists are folk too, carrying their own culture\'s concepts of number, colour, space and mind.',
          'That is a problem specifically for anyone hunting universal cognitive structures, since you can always ask whether the structure you found is the culture\'s or the species\'.',
          'Lavelle notes the problem is difficult but not insurmountable, citing Carey\'s work on number concepts as a model of how to do it.',
        ],
      },
      {
        n: '5.1',
        title: 'Individualism, collectivism and duty',
        body:
          'Cross-cultural psychology draws a broad distinction between cultures prioritising individual autonomy and those prioritising group cohesion. Lavelle uses it as a framework while conceding the categories are too imprecise to generate specific hypotheses on their own.',
        points: [
          'Individualist orientation makes reasoning about a person\'s own states culturally central — "but what do you think", "think for yourself".',
          'Collectivist orientation emphasises duties attached to social roles: mother, teacher, head of family. Behaviour is constrained by obligation rather than by private states.',
          'A common misreading, which Lavelle corrects: this does not mean people in collectivist cultures lack desires. The difference is in the *content* of the desire — wanting to fulfil one\'s role, rather than wanting to follow one\'s own wishes independent of it.',
          'In individualist cultures duty is often felt as opposed to what you want; in collectivist ones it is taken for granted that you want to do your duty.',
        ],
      },
      {
        n: '5.2',
        title: 'Adults\' explanations of behaviour',
        body:
          'Miller\'s work compared how Hindu Indians and North Americans explain the same events. Participants narrated two prosocial and two deviant behaviours and explained each. Indians cited contextual factors far more; Americans cited the actor\'s dispositions, and the gap widened with age.',
        points: [
          'The follow-up is the sharp part: American students were given behaviours described by Hindu participants, transcribed as told, with culturally obvious cues masked (rupees became dollars).',
          'The anecdote: an attorney late for court drives an injured passenger to hospital, leaves immediately without waiting for a diagnosis, and the passenger later dies.',
          'The Hindu explanation cited the driver\'s duty to his client, that he might have been nervous or confused, and that the injury might not have looked serious.',
          'The American explanation: the driver "is obviously irresponsible", "was in a state of shock", "is aggressive in pursuing career success".',
          'The context — that he was an attorney late for court — was in the story. Americans overlooked available information to concentrate on dispositions that could only be inferred.',
          'Vinden\'s Junín Quechua work makes a parallel point about language: the language lacks direct translations for "thought", "belief" or "denial", referring to them indirectly ("what would she say?") and infrequently.',
          'In the folk tale "The fox and the cheese", the only psychological state mentioned is the fox\'s false perception. When Canadian graduate students retold a literal translation, every one added mental-state language — "he wondered how", "he thought he would find something to eat" — and found it hard to conceive of telling it otherwise.',
        ],
      },
      {
        n: '5.3',
        title: 'The opacity of other minds',
        body:
          'A doctrine held in varying degrees across cultures, most closely associated with the South Pacific: other people\'s thoughts are known only to them, and we have no right to comment on them or cite them in explanation.',
        points: [
          'Stasch, working with the Korowai in West Papua, found that asking why someone acted often drew "she thinks for herself" or "she decides for herself".',
          'Barrett and colleagues found Yasawan participants in Fiji routinely ignoring intention and attending only to outcome when assigning blame or praise.',
          'Two clarifications Lavelle insists on: this is not behaviourism — nobody denies people have thoughts that cause behaviour — and the claim is that it is socially, even morally, inappropriate to try to ascertain them.',
          'The poison vignette: a man pours insecticide into a swamp feeding the village well, either knowing it is labelled poison or having been assured by a reliable seller that it was safe. Most cultures judged the intentional case far more harshly; the Yasawa and Himba judged both equally.',
          'Lavelle\'s interpretation, connecting back to 3.2.4: if the action is read as directed at an agent-independent goal — poisoning the water — then intention drops out and both cases are equally bad. Adherence to the opacity doctrine may prime non-mindreading interpretations rather than abolishing mindreading.',
        ],
      },
      {
        n: '5.4',
        title: 'Cultural variation in children',
        body:
          'The adult findings raise an obvious developmental question. If the social norms of a group discourage discussing other people\'s psychological states, or default to explanations citing the situation instead, then children will rarely overhear such explanations and will not be encouraged to offer them. Does that change how they acquire the concepts? The literature is genuinely mixed and Lavelle presents it that way rather than picking a side — the results point in different directions depending on which task and which population you look at.',
        points: [
          'Some researchers (Callaghan, Kuntoro) find children worldwide pass the unexpected transfer test at 4–5 regardless of cultural attitudes.',
          'Others (Mayer & Träuble) report South Pacific island children not reliably passing before eight.',
          'Wellman and colleagues found Chinese and Iranian children follow a different order on the theory of mind scale: knowledge-access before diverse beliefs, the reverse of the WEIRD pattern — consistent, they argue, with a cultural emphasis on knowing rather than on belief and falsity.',
          'Attitudes to children matter too. Barrett reports that Yasawan children are the lowest ranking members of society, thought not to understand language or feel pain or pleasure until well into their second year, with very little face-to-face dialogue and few discussions of a child\'s feelings.',
          'Nawaz and Lewis, in north-west Pakistan, found little mother–preschooler talk referring explicitly to mental states, five-year-olds at chance on elicited tasks, and the best predictor being the child\'s *own* use of psychological terms.',
          'Liu and colleagues in Kunming complicate it further — see the evidence section. Their result is the awkward one for the standard story.',
          'Lavelle canvasses four possible readings, including a hidden-variable explanation, the possibility that explanation of behaviour prompts children to reflect on causes generally, and Andrews\' suggestion that a Western behaviour/mind dualism may lead researchers to miscode Chinese mothers\' descriptions as non-psychological.',
        ],
      },
      {
        n: '5.5',
        title: 'Cross-cultural considerations and ubiquity',
        body:
          'Lavelle is careful about the inference. A cultural preference for situational explanation does not entail an absence of mindreading. People may know perfectly well that a state caused the act while being primed to think mentioning it pointless, or being barred by social sanction from voicing it.',
        points: [
          'The real question is how deep the variation goes. Universalists hold the data show mere differences in folk-explanatory practice, with concepts and architecture identical across neurotypical humans.',
          'The universalist argument: both groups recognised the attorney\'s behaviour as intentional, and the Hindu explanation implicitly attributes an attitude towards his duties — he values doing his duty above his passenger\'s wellbeing — or it does not make sense.',
          'The pluralist counter: those intentions could equally be non-agential goals. Duty suits that reading especially well, since duties exist independently of the individual, tied to socially determined roles.',
          'Lavelle sketches what would settle it: establish empirically that our systems use a non-agential goal concept and when it is invoked; then map the architecture tracking situational constraints and test whether a cultural bias towards situational explanation means less mindreading-network activation.',
          'Her conclusion is modest and precise: that ubiquity has its heritage in Western folk psychology does not make it wrong. It makes it a claim requiring defence like any other.',
        ],
      },
    ],
    terms: [
      { term: 'WEIRD', meaning: 'Western, Educated, Industrialised, Rich, Democratic — Henrich and colleagues\' label for the narrow population most psychology has sampled.' },
      { term: 'Individualist / collectivist orientation', meaning: 'A broad contrast between prioritising individual autonomy and prioritising group cohesion and role obligations.' },
      { term: 'Opacity of other minds', meaning: 'The doctrine that another\'s thoughts are theirs alone and it is inappropriate to speculate about or cite them.' },
      { term: 'Unexpected transfer test', meaning: 'The location-change false-belief task, used as the standard cross-cultural comparison.' },
      { term: 'Universalism', meaning: 'The position that cultural variation is in explanatory practice only, leaving mindreading concepts and architecture unchanged.' },
    ],
    evidence: [
      {
        study: 'Miller (1984) — explaining the same events',
        did: 'Hindu Indian and North American participants narrated and explained prosocial and deviant behaviours; a follow-up gave Americans the Hindu-described incidents with cultural cues masked.',
        found: 'Indians cited context and duty, Americans cited disposition. Faced with the attorney anecdote, Americans overlooked contextual facts present in the story to speculate about traits that could only be inferred.',
      },
      {
        study: 'Vinden — "The fox and the cheese"',
        did: 'A Junín Quechua folk tale, from a language rarely referring directly to thoughts, was literally translated and read to Canadian graduate students who then retold it from memory.',
        found: 'Every student added mental-state language absent from the original, and reported finding it difficult to conceive of not expressing thoughts as thoughts.',
      },
      {
        study: 'Liu and colleagues (2016), Kunming',
        did: 'Recorded Chinese mothers sharing a picture book with 3.5–5 year olds, coded behaviour clarifications against mental-state clarifications, and retested false-belief understanding a year later, controlling for verbal ability, earlier scores and maternal education.',
        found: 'Mothers\' early *behaviour* clarifications uniquely predicted children\'s later false-belief understanding, and the relationship was unidirectional. In Western samples it is talk about mental states that predicts it — the same endpoint reached by a different route.',
      },
      {
        study: 'Barrett and colleagues (2013) — infants across cultures',
        did: 'Ran non-verbal violation-of-expectation false-belief tasks with Shuar and Salar infants in Ecuador and China, both cultures placing low emphasis on psychological states and having markedly reduced carer–child conversation.',
        found: 'Results comparable to control infants in Illinois — infants looked longer when the actor behaved inconsistently with her belief.',
      },
    ],
    misconception: {
      believed: 'If a culture explains behaviour by circumstance rather than by thoughts, its people mindread less.',
      actually:
        'It shows a difference in what gets *said*, which is not the same as a difference in what gets thought. Someone may know a thought caused the act and consider mentioning it pointless — or taboo. What the cross-cultural work removes is not the ubiquity principle but its right to be assumed.',
    },
    takeaway:
      'The claim that we mindread constantly was generalised from 12% of humanity, and once you look wider it becomes a hypothesis that owes an argument rather than a background fact.',
    recall: [
      'Both groups in Miller\'s study had the same facts available. What did the American participants do with the contextual information, and why is that the striking part?',
      'Explain the opacity doctrine, and say precisely why it is not the claim that people lack thoughts.',
      'How does Lavelle use non-agentive goals to explain the Yasawa moral judgements?',
      'Why is the Liu finding awkward for the standard account of how children acquire mental-state concepts?',
      'State the universalist reading of the attorney case, then the pluralist counter.',
    ],
  },

  // ══ 6 ═════════════════════════════════════════════════════════════════
  {
    pages: [63, 70],
    question: 'Does having power over someone make you attend to them less?',
    summary:
      'The third case study. A small but growing literature suggests that people who feel powerful in a situation are less likely to consider the states of those below them, while those who feel dependent mindread more. If that holds, how much mindreading you do is set neither by species nor by age but by your position in the room — a third route to challenging ubiquity, and one that puts motivation at the centre.',
    sections: [
      {
        n: '6.1',
        title: 'The power hypothesis',
        body:
          'Kraus and colleagues argue that increased access to resources such as education and wealth correlates with decreased interest in others\' wellbeing, and therefore less engagement in mindreading them. The mechanism is control.',
        points: [
          'Abundant resources mean choosing where you live, who you interact with and which schools you attend — and being relatively unconstrained by others\' needs, since conflicts can be resolved with money or rank.',
          'This spirals: wealth lets you spend time with people like you, so conflict is rarer, and when it comes you tend to win.',
          'Scarce resources mean much less control, and lives more constrained by infrastructure and by discrimination. Kraus argues lower-class individuals must stay vigilant to those whose decisions disproportionately affect their families and prospects.',
          'The resulting contrast: upper-class individuals more solipsistic, focused on their own goals; lower-class individuals more contextualist, sensitive to demands imposed on them.',
          'Crucially, power is relative rather than absolute. A man may have no say at work and be the patriarchal head of his family; a teenager may come from one of the wealthiest families in her county and find it counts for nothing against the international rankings she meets at university.',
        ],
      },
      {
        n: '6.2',
        title: 'The empirical work',
        body:
          'Two strands. One concerns empathic responding, the other performance on social cognition tasks proper. Lavelle flags that the link between empathy and mindreading is not assured — one could give a non-agentive account of empathy, perceiving a situation as objectively bad rather than bad *for them* — but that attending to others is at least a prerequisite for mindreading them.',
        points: [
          'The claim under discussion is about *deployment*, not capacity: whether mindreading is used, not whether the ability is better or worse developed.',
          'Kraus and colleagues measured status both objectively, by whether participants had completed a four-year degree, and subjectively, by self-placement on a ten-rung ladder describing who is best and worst off in the university community.',
          'Self-ratings correlated closely with participants\' ratings of their parents\' education and estimated family income.',
          'Rizzo and Killen manipulated status experimentally in children rather than measuring it — see the evidence section.',
          'Gender was used as the manipulation because it is a social construct even very young children are sensitive to, and they recognise discriminating by it as unfair.',
        ],
      },
      {
        n: '6.3',
        title: 'Is mindreading spontaneous or automatic?',
        body:
          'Having laid out the power findings, Lavelle turns them on a live theoretical question — whether mindreading is automatic or merely spontaneous — and she is scrupulous about the limits of this evidence before using it. If how much you mindread depends on your perceived power in a situation, then how often does it really happen? Is mindreading the default for people with little access to resources but not for those in high-powered positions? And what is the relationship between the processes doing the mindreading and those tracking your own status? She flags all three as open.',
        points: [
          'Shortcoming one: the tasks used were elicited, so they cannot tell us whether advantaged children were still tracking REGISTRATION and ENCOUNTERING. The safe reading is that disadvantaged children were more likely to attribute *propositional attitudes*.',
          'Shortcoming two: the data cannot distinguish "propositional attribution does not occur in situations of power" from "it occurs but goes systematically wrong", because both predict the same failures.',
          'A way in: pair spontaneous response tasks with power manipulations. If registrations are still tracked while elicited performance fails, power affects what feeds into propositional attribution — the Propositional challenge. If they are not tracked at all, power affects whether mindreading starts — the Radical challenge.',
          'Against Carruthers: he holds we have a standing goal of anticipating others\' behaviour, down-regulated when we take on an executively demanding task, which makes his account spontaneous rather than automatic.',
          'Lavelle\'s objection: if you are frequently in a position of power, it is not obvious that the behaviour-predicting goal is your default at all — and the reasons for downgrading it may be far more diverse and frequent than he assumes. Being powerful need not be executively demanding; it may simply mean your attention is elsewhere because others\' needs are less salient.',
        ],
      },
      {
        n: '6.4',
        title: 'Conclusion',
        body:
          'The case study illustrates two facets of pluralism at once. Power affects the goals of mindreading — those with low status have more incentive to be accurate. And power affects whether one kind of mindreading, propositional attribution, happens at all. Lavelle\'s closing note is that traditional frameworks have no scope for a factor like this to matter.',
        points: [
          'A further implication about method: disempowered people have more at stake in getting it wrong, so may prefer techniques associated with accuracy, such as deliberation.',
          'Those in power may lean on speed — which points back to stereotyping in 3.3.3 as the likely method, with accuracy demoted to a secondary aim.',
        ],
      },
    ],
    terms: [
      { term: 'Power hypothesis', meaning: 'That those who perceive themselves as powerful in a situation mindread less, and those who feel less powerful mindread more.' },
      { term: 'Solipsism vs contextualism', meaning: 'Kraus\' contrast: attending inward to one\'s own goals, versus attending outward to external forces and other people.' },
      { term: 'Deployment vs capacity', meaning: 'Whether mindreading is used in a situation, as against how well developed the underlying ability is. The power literature is about the first.' },
      { term: 'Socio-economic status (SES)', meaning: 'Measured here both objectively (education, income) and subjectively (self-placement on a status ladder).' },
    ],
    evidence: [
      {
        study: 'Kraus, Côté & Keltner (2010)',
        did: 'Two studies — identifying emotions in photographs, split by whether participants had completed a four-year degree; and judging a peer\'s emotions after a paired interview, with accuracy scored against that peer\'s own description of how they felt.',
        found: 'High school graduates were consistently more accurate at emotion recognition than college counterparts, and lower-SES participants were more accurate about the person they had just interviewed.',
      },
      {
        study: 'Rizzo & Killen (2018)',
        did: 'Children aged 3–7 played a spot-the-difference game stopped after three finds and declared a tie, then had prizes distributed unfairly by gender — advantaging or disadvantaging them arbitrarily — before completing a contents-switch false-belief task and an emotion-prediction task (a character who loves Lego finds rocks in a Lego box).',
        found: 'Disadvantaged children were more likely to pass both tasks. A second study allocated advantage by merit instead, and disadvantaged children still outperformed. The authors argue disadvantage motivates you to find out what is affecting your situation, while advantage removes the reason to look — and may make the information uncomfortable.',
      },
    ],
    misconception: {
      believed: 'Reading other people is a skill you either have or lack.',
      actually:
        'These findings concern deployment, not capacity — whether you bother, in this situation, with this person. Since power is relative rather than absolute, the same individual may read a superior closely and a subordinate barely at all, within the same day.',
    },
    takeaway:
      'How much you read someone may depend less on your ability than on how much their thoughts can cost you.',
    recall: [
      'State the power hypothesis in one sentence, then give the mechanism Kraus proposes for it.',
      'Why does it matter that Rizzo and Killen found the effect even when advantage was allocated on merit?',
      'Explain why the elicited tasks used cannot tell us whether advantaged children were still tracking registrations.',
      'What experiment would separate "power stops mindreading starting" from "power makes it go wrong"?',
      'Give Lavelle\'s objection to Carruthers\' down-regulation account.',
    ],
  },

  // ══ 7 ═════════════════════════════════════════════════════════════════
  {
    pages: [71, 88],
    question: 'What is left standing, and what should the field do next?',
    summary:
      'The tidy landscape is gone. Where there was theory-theory, simulation and propositional attitudes there is now a sprawl of psychological states, motives, methods and situations — plus a real question about when mindreading happens at all. Lavelle\'s closing argument is that this mess counts as progress, because the tidy version was tidy about something that does not exist.',
    sections: [
      {
        n: '7',
        title: 'The state of the landscape',
        body:
          'The Element set out to present the current literature and concedes immediately that it is not orderly. The pluralist turn reveals that studying mindreading as it happens in the real world with real people means accepting a phenomenon far more baroque than previously acknowledged.',
      },
      {
        n: '7',
        title: 'How to keep pluralism tractable',
        body:
          'Endless branching is only useful if it still produces research questions. Lavelle names two organising frames: Spaulding distinguishes the inputs, processes and outputs of mindreading; this Element uses the how, what, when and why questions. Both are somewhat artificial, since the case studies show the answers depend on each other — but they give a way to begin re-ordering a very large literature.',
        points: [
          'She names philosophers making it tractable: Spaulding, Andrews, Fiebich, Westra.',
          'The admission of artificiality is deliberate — the parsing is a tool, not a claim about how the phenomena divide.',
        ],
      },
      {
        n: '7',
        title: 'The discipline that was missing',
        body:
          'Mindreading research collaborated with neuroscience, developmental psychology and cognitive ethology from the start. Social psychology was conspicuously absent — and it is the field that studies the endpoint of social cognition in all its messiness, by examining how adults actually behave and think across varied situations.',
        points: [
          'Stereotyping, social scripts and the cross-cultural work all show what social psychology has to contribute.',
          'This connects back to Apperly\'s warning in 3.1: the simple judgements studied in mindreading may not share a cognitive basis with what social psychology studies, and the traffic should run both ways.',
        ],
      },
      {
        n: '7',
        title: 'What remains open',
        body:
          'Lavelle is explicit that the four questions are nowhere near answered. She singles out two areas as especially interesting and especially neglected by philosophical accounts: how and when we engage in *accurate* mindreading, and what interferes with the process — perceptions of power being her own example.',
      },
    ],
    terms: [
      { term: 'Inputs / processes / outputs', meaning: 'Spaulding\'s way of organising pluralist research, as an alternative to the how/what/when/why frame used here.' },
      { term: '4E cognition', meaning: 'Enactive, embedded, extended, embodied approaches — flagged in 3.5.3 as promising for accounts of interaction without mindreading, but beyond the Element\'s scope.' },
    ],
    evidence: [
      {
        study: 'Apperly on "relatively simple judgements"',
        did: 'Compared the tasks used in the mindreading literature with those used in social psychology.',
        found: 'Standard tasks involve strangers in quiet rooms designed to focus attention. Real mindreading is shaped by status, distraction and motivation — so scaling from laboratory to world means confronting that noise rather than filtering it out.',
      },
    ],
    misconception: {
      believed: 'The old theories were disproved.',
      actually:
        'Mostly they were bypassed. Their arguments concerned a mechanism for a phenomenon defined far more narrowly than the real one — so the live question is less whether they were wrong than whether they were about the right thing.',
    },
    takeaway:
      'The honest picture of how we understand each other is far messier than the field assumed, and getting the mess right is the work.',
    recall: [
      'Why does Lavelle treat the loss of a tidy theory as progress rather than as failure?',
      'Name the two organising frames for pluralist research, and say why she calls the parsing artificial.',
      'What does social psychology have that the mindreading tradition was missing, and which chapters showed it?',
      'Pick any earlier chapter and say which of the four questions it was really about.',
    ],
  },
];
