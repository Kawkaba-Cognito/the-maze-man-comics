/*
 * Detective Kawkab — every word the game says, in both languages.
 *
 * Kept out of index.jsx because the statement and question text is GENERATED:
 * a sentence is assembled from a statement kind plus a name, and getting the
 * Arabic right needs the templates in one place rather than scattered through
 * JSX. `audit:consistency` also reads game strings, and it cannot parse .jsx.
 *
 * ⚠ Naming: it is always "Detective Kawkab" / المحقق كوكب, never a bare
 * "Kawkab" in detective copy.
 */

export const T = {
  en: {
    title: 'Detective',
    menu: 'Menu',
    ruleLabel: 'The rule',
    evidenceLabel: 'Forensics',
    caseOf: (n, m) => `Case ${n} of ${m}`,
    /* Spelled out, because the opening line is prose: "Three were inside"
       reads as a sentence where "3 were inside" reads as a data field. */
    nWord: (n) => (['nobody', 'One', 'Two', 'Three', 'Four', 'Five'][n] || String(n)),
    streak: 'streak',
    notebookHint: 'Tap a suspect to mark them: cleared → held.',

    // ── the holding cell ──
    cellLabel: 'Holding cell',
    cellEmpty: 'Nobody in the cell',
    cellDragHere: 'Drag them in here',
    cellDrop: 'Release to lock up',
    cellPick: 'Put a suspect in the jail — tap to change who is in it',
    cellPickShort: 'Choose',
    cellFree: (n) => `Let ${n} out of the jail`,
    cellOutHint: 'Drag them back out of the jail, or tap them, to change your mind.',
    cellFreeHint: 'Let go outside the jail and they walk free.',
    // when the jail IS the answer
    jailAccuse: 'The jail — your answer',
    jailEmptyAccuse: 'Drag your answer in',
    jailHintAccuse: 'Drag the one you name into the jail, then submit.',
    cellHint: 'You may hold ONE suspect in the cell. It is judged on its own — it never changes whether your answer was right.',
    jailSound: (n) => `Sound arrest — the evidence puts ${n} at the scene in every reading of it.`,
    jailWrongful: (n) => `${n} walks. Nothing in the evidence can place them at the scene.`,
    jailOpen: (n) => `${n} stays under suspicion. The evidence allows it, but does not settle it.`,
    confirm: '✓ Confirm',
    confirmOff: 'Choose an answer',
    solved: 'Solved',
    missed: 'Missed',
    nextCase: 'Next case ›',
    closeFile: 'Close the file ›',
    cont: 'Continue ›',
    score: (n, m) => `${n}/${m} cases closed`,
    perfect: 'Every case closed. ✓',

    // ── rules ──
    rule: {
      exactlyTrue: (k, n) => (k === 1
        ? 'Exactly one of them is telling the truth.'
        : `Exactly ${k} of them are telling the truth.`),
      exactlyLies: (k) => (k === 1
        ? 'Exactly one of them is lying.'
        : `Exactly ${k} of them are lying.`),
      atLeastTrue: (k) => (k === 1
        ? 'At least one of them is telling the truth.'
        : `At least ${k} of them are telling the truth.`),
      knaves: 'The thief always lies. Everyone innocent always tells the truth.',
      invertedKnaves: 'Only the thief is telling the truth. Everyone innocent is lying.',
      free: 'No promises about who lies. Work it out from the statements alone.',
    },

    // ── statements ──
    say: {
      accuse: (n) => `${n} did it.`,
      clear: (n) => `${n} had nothing to do with it.`,
      selfClear: () => 'It wasn’t me.',
      selfAccuse: () => 'It was me. I did it.',
      together: (n) => `${n} and I were together all evening.`,
      oneOf: (a, b) => `It was either ${a} or ${b}.`,
      liar: (n) => `${n} is lying.`,
      honest: (n) => `${n} is telling the truth.`,
      sameAs: (n) => `${n} and I are both honest, or both lying.`,
      countLiars: (k) => (k === 0 ? 'None of us is lying.'
        : k === 1 ? 'Exactly one of us is lying.'
          : `Exactly ${k} of us are lying.`),
      atLeastLiars: (k) => (k === 1 ? 'At least one of us is lying.'
        : `At least ${k} of us are lying.`),
      traitClaim: (trait, not) => (not
        ? `The thief was not wearing ${trait}.`
        : `The thief was wearing ${trait}.`),
    },

    // ── forensic evidence (always true) ──
    evidence: {
      has: (trait) => `We know for certain the thief was wearing ${trait}.`,
      not: (trait) => `We know for certain the thief was not wearing ${trait}.`,
    },

    // ── questions ──
    q: {
      who: 'So who took it?',
      liar: 'So who is lying?',
      honest: 'So who is telling the truth?',
      count: 'So how many of them are lying?',
      verdict: (n) => `So — is ${n} guilty?`,
      clearAll: 'Tap everyone you can PROVE is innocent.',
      key: 'Which single statement already names the thief, on its own?',
    },
    verdictYes: 'Guilty',
    verdictNo: 'Innocent',
    verdictUnknown: 'Not enough evidence',
    clearNobody: 'Nobody',
    listSep: ', ',

    // ── explanations ──
    why: {
      who: (n) => `Only <b>${n}</b> leaves every statement consistent with the rule.`,
      liar: (n) => `Only <b>${n}</b> can be the liar without breaking the rule.`,
      honest: (n) => `Only <b>${n}</b> can be telling the truth here.`,
      count: (k) => `Exactly <b>${k}</b> — no other count fits.`,
      verdictYes: (n) => `<b>${n}</b> is the thief in every arrangement that works.`,
      verdictNo: (n) => `<b>${n}</b> cannot be the thief in any arrangement that works.`,
      verdictUnknown: (n) => `The evidence leaves it open. <b>${n}</b> could be the thief, or not — and nothing here decides it.`,
      clearAll: (list) => `Only <b>${list}</b> can be ruled out. The rest are still possible.`,
      key: 'That one, with the rule, already pins the thief. The others only narrow it.',
    },
    worldsOne: 'One arrangement fits.',
    worldsMany: (n) => `${n} arrangements still fit the evidence.`,
    ruledOut: 'ruled out',
    stillPossible: 'still possible',
    truth: 'true',
    lie: 'false',
    showWork: 'Kawkab’s working',

    // ── notebook ──
    markUnknown: 'unmarked',
    markCleared: 'cleared',
    markSuspect: 'suspect',
  },

  ar: {
    title: 'المحقّق',
    menu: 'القائمة',
    ruleLabel: 'القاعدة',
    evidenceLabel: 'الأدلّة الجنائية',
    caseOf: (n, m) => `القضية ${n} من ${m}`,
    nWord: (n) => (['لا أحد', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة'][n] || String(n)),
    streak: 'متتالية',
    notebookHint: 'المس مشتبهاً لتعليمه: بريء ← موقوف.',

    // ── الزنزانة ──
    cellLabel: 'الزنزانة',
    cellEmpty: 'لا أحد في الزنزانة',
    cellDragHere: 'اسحبه إلى هنا',
    cellDrop: 'أفلته ليدخل',
    cellPick: 'ضع مشتبهاً في الزنزانة — المس لتغيّر من فيها',
    cellPickShort: 'اختر',
    cellFree: (n) => `أخرج ${n} من الزنزانة`,
    cellOutHint: 'اسحبه خارج الزنزانة، أو المسه، إن غيّرت رأيك.',
    cellFreeHint: 'أفلته خارج الزنزانة فيخرج حراً.',
    // حين تكون الزنزانة هي الجواب
    jailAccuse: 'الزنزانة — جوابك',
    jailEmptyAccuse: 'اسحب جوابك إلى هنا',
    jailHintAccuse: 'اسحب من تسمّيه إلى الزنزانة، ثم أكّد.',
    cellHint: 'يمكنك حجز مشتبه واحد. يُحكم عليه وحده — ولا يغيّر أبداً صحة إجابتك.',
    jailSound: (n) => `توقيف سليم — الأدلة تضع ${n} في موقع الجريمة في كل قراءة لها.`,
    jailWrongful: (n) => `${n} يخرج حراً. لا شيء في الأدلة يضعه هناك.`,
    jailOpen: (n) => `${n} يبقى تحت الشبهة. الأدلة تجيز ذلك لكنها لا تحسمه.`,
    confirm: '✓ تأكيد',
    confirmOff: 'اختر جواباً',
    solved: 'حُلّت',
    missed: 'فاتت',
    nextCase: 'القضية التالية ›',
    closeFile: 'أغلق الملف ›',
    cont: 'متابعة ›',
    score: (n, m) => `${n}/${m} قضايا أُغلقت`,
    perfect: 'كل القضايا أُغلقت. ✓',

    rule: {
      exactlyTrue: (k) => (k === 1
        ? 'واحد فقط منهم يقول الصدق.'
        : `${k} منهم فقط يقولون الصدق.`),
      exactlyLies: (k) => (k === 1
        ? 'واحد فقط منهم يكذب.'
        : `${k} منهم فقط يكذبون.`),
      atLeastTrue: (k) => (k === 1
        ? 'واحد منهم على الأقل يقول الصدق.'
        : `${k} منهم على الأقل يقولون الصدق.`),
      knaves: 'الفاعل يكذب دائماً. وكل بريء يقول الصدق دائماً.',
      invertedKnaves: 'الفاعل وحده يقول الصدق. وكل بريء يكذب.',
      free: 'لا وعد بشأن من يكذب. استنتجها من الإفادات وحدها.',
    },

    say: {
      accuse: (n) => `${n} فعلها.`,
      clear: (n) => `لا علاقة ل${n} بالأمر.`,
      selfClear: () => 'لم أكن أنا.',
      selfAccuse: () => 'أنا فعلتها.',
      together: (n) => `كنت مع ${n} طوال المساء.`,
      oneOf: (a, b) => `الفاعل إما ${a} أو ${b}.`,
      liar: (n) => `${n} يكذب.`,
      honest: (n) => `${n} يقول الصدق.`,
      sameAs: (n) => `أنا و${n} إما صادقان معاً أو كاذبان معاً.`,
      countLiars: (k) => (k === 0 ? 'لا أحد منا يكذب.'
        : k === 1 ? 'واحد منا فقط يكذب.'
          : `${k} منا يكذبون بالضبط.`),
      atLeastLiars: (k) => (k === 1 ? 'واحد منا على الأقل يكذب.'
        : `${k} منا على الأقل يكذبون.`),
      traitClaim: (trait, not) => (not
        ? `لم يكن الفاعل يحمل ${trait}.`
        : `كان الفاعل يحمل ${trait}.`),
    },

    evidence: {
      has: (trait) => `نعلم يقيناً أن الفاعل كان يحمل ${trait}.`,
      not: (trait) => `نعلم يقيناً أن الفاعل لم يكن يحمل ${trait}.`,
    },

    q: {
      who: 'إذن من أخذها؟',
      liar: 'إذن من يكذب؟',
      honest: 'إذن من يقول الصدق؟',
      count: 'إذن كم واحداً منهم يكذب؟',
      verdict: (n) => `إذن — هل ${n} مذنب؟`,
      clearAll: 'المس كل من تستطيع إثبات براءته.',
      key: 'أيّ إفادة واحدة تسمّي الفاعل بمفردها؟',
    },
    verdictYes: 'مذنب',
    verdictNo: 'بريء',
    verdictUnknown: 'الأدلّة لا تكفي',
    clearNobody: 'لا أحد',
    listSep: ' و',

    why: {
      who: (n) => '<b>' + n + '</b> وحده يترك كل الإفادات متسقة مع القاعدة.',
      liar: (n) => '<b>' + n + '</b> وحده يمكن أن يكون الكاذب دون كسر القاعدة.',
      honest: (n) => '<b>' + n + '</b> وحده يمكن أن يكون صادقاً هنا.',
      count: (k) => '<b>' + k + '</b> بالضبط — ولا عدد آخر يتّسق.',
      verdictYes: (n) => '<b>' + n + '</b> هو الفاعل في كل ترتيب ممكن.',
      verdictNo: (n) => '<b>' + n + '</b> لا يمكن أن يكون الفاعل في أي ترتيب ممكن.',
      verdictUnknown: (n) => 'الأدلّة تترك الأمر مفتوحاً. قد يكون <b>' + n + '</b> الفاعل وقد لا يكون — ولا شيء هنا يحسم ذلك.',
      clearAll: (list) => 'يمكن استبعاد <b>' + list + '</b> فقط. والبقية ما زالوا محتملين.',
      key: 'تلك الإفادة، مع القاعدة، تحدّد الفاعل وحدها. أما البقية فتضيّق الدائرة فقط.',
    },
    worldsOne: 'ترتيب واحد يتّسق.',
    worldsMany: (n) => `${n} ترتيبات ما زالت تتّسق مع الأدلّة.`,
    ruledOut: 'مستبعد',
    stillPossible: 'ما زال محتملاً',
    truth: 'صدق',
    lie: 'كذب',
    showWork: 'استنتاج المحقّق كوكب',

    markUnknown: 'بلا علامة',
    markCleared: 'بريء',
    markSuspect: 'مشتبه',
  },
};

/* ── THE SCENE LAYER ──────────────────────────────────────────────────────
 * Added 2026-09-05. See the long note beside `SCENES` in data.js for why.
 *
 * ⚠ THESE CHANGE THE WORDS AND NOTHING ELSE. The solver reads `s.kind`; it has
 * never seen a sentence. Every variant below must mean EXACTLY what the flat
 * phrasing above it means — "I saw Ramy leave the library with it" is `accuse`,
 * full stop. A variant that hedged ("I think it was Ramy") would make the text
 * disagree with the logic that scores it, and no gate can read English.
 *
 * ⚠ EN AND AR ARE WRITTEN ON THE SAME LINE, deliberately, so a mismatch is
 * awkward to express rather than merely discouraged. The two halves of a `UI`
 * dict sitting forty lines apart is how this repo shipped Arabic players a
 * sentence promising three difficulties for a game that has one ladder.
 *
 * `sc` is `{ place: {en,ar}, obj: {en,ar} }`; `L` is 'en' or 'ar'.
 */
const P = (sc, L) => sc.place[L];
const O = (sc, L) => sc.obj[L];
/*
 * ⚠ A SCENE WORD THAT OPENS A SENTENCE NEEDS A CAPITAL, and English is the only
 * half that cares. Every object and place is authored lowercase ("the good
 * knife") because it is almost always mid-sentence — so the one phrasing that
 * put it first rendered "Search me. the good knife is not mine to take." Found
 * by reading the actual screen; `validate:liars` now carries a rule for it,
 * because a sentence that is merely ungrammatical still passes every check
 * about meaning.
 */
const Oc = (sc, L) => (L === 'ar' ? sc.obj.ar : cap(sc.obj.en));

export const SAY_SCENE = {
  accuse: [
    { en: (n, sc) => `I saw ${n} leave ${P(sc, 'en')} holding ${O(sc, 'en')}.`, ar: (n, sc) => `رأيت ${n} يخرج من ${P(sc, 'ar')} حاملاً ${O(sc, 'ar')}.` },
    { en: (n, sc) => `${n} took ${O(sc, 'en')}. I watched them do it.`, ar: (n, sc) => `${n} أخذ ${O(sc, 'ar')}. رأيته بعينيّ.` },
    { en: (n, sc) => `Ask ${n} what they carried out of ${P(sc, 'en')}.`, ar: (n, sc) => `اسأل ${n} عمّا حمله خارجاً من ${P(sc, 'ar')}.` },
  ],
  clear: [
    { en: (n, sc) => `${n} was with me all evening — nowhere near ${P(sc, 'en')}.`, ar: (n, sc) => `${n} كان معي طوال المساء، بعيداً عن ${P(sc, 'ar')}.` },
    { en: (n, sc) => `${n} never touched ${O(sc, 'en')}.`, ar: (n, sc) => `${n} لم يمسّ ${O(sc, 'ar')} أبداً.` },
    { en: (n, sc) => `Whoever emptied ${P(sc, 'en')}, it was not ${n}.`, ar: (n, sc) => `مهما كان من أفرغ ${P(sc, 'ar')}، فليس ${n}.` },
  ],
  selfClear: [
    { en: (_n, sc) => `I never set foot in ${P(sc, 'en')}.`, ar: (_n, sc) => `لم تطأ قدماي ${P(sc, 'ar')} قط.` },
    { en: (_n, sc) => `I have not laid eyes on ${O(sc, 'en')} in weeks.`, ar: (_n, sc) => `لم أرَ ${O(sc, 'ar')} منذ أسابيع.` },
    { en: (_n, sc) => `Search me. ${Oc(sc, 'en')} is not mine to take.`, ar: (_n, sc) => `فتّشني. ${Oc(sc, 'ar')} ليست لي لآخذها.` },
  ],
  selfAccuse: [
    { en: (_n, sc) => `It was me. I took ${O(sc, 'en')}.`, ar: (_n, sc) => `أنا الفاعل. أخذت ${O(sc, 'ar')}.` },
    { en: (_n, sc) => `Fine — I went into ${P(sc, 'en')} and I took it.`, ar: (_n, sc) => `حسناً، دخلت ${P(sc, 'ar')} وأخذتها.` },
    { en: () => 'You want the thief? Look no further than me.', ar: () => 'تريد اللص؟ لا تبحث أبعد منّي.' },
  ],
  liar: [
    { en: (n) => `${n} is lying to you, plainly.`, ar: (n) => `${n} يكذب عليك، بوضوح.` },
    { en: (n) => `Whatever ${n} just said, none of it is true.`, ar: (n) => `مهما قال ${n} للتوّ، لا شيء منه صحيح.` },
    { en: (n, sc) => `${n} was not in ${P(sc, 'en')} to see anything — and says otherwise.`, ar: (n, sc) => `${n} لم يكن في ${P(sc, 'ar')} ليرى شيئاً، ومع ذلك يدّعي.` },
  ],
  honest: [
    { en: (n) => `${n} has no reason to lie about this.`, ar: (n) => `لا سبب ل${n} أن يكذب في هذا.` },
    { en: (n) => `Believe ${n}. Every word.`, ar: (n) => `صدّق ${n}. كل كلمة.` },
    { en: (n, sc) => `${n} was standing beside me in ${P(sc, 'en')}. What they say is so.`, ar: (n, sc) => `${n} كان واقفاً بجانبي في ${P(sc, 'ar')}. ما يقوله صحيح.` },
  ],
  together: [
    { en: (n, sc) => `${n} and I were together all evening, far from ${P(sc, 'en')}.`, ar: (n, sc) => `أنا و${n} كنّا معاً طوال المساء، بعيدين عن ${P(sc, 'ar')}.` },
    { en: (n, sc) => `Neither ${n} nor I went near ${O(sc, 'en')}.`, ar: (n, sc) => `لا أنا ولا ${n} اقتربنا من ${O(sc, 'ar')}.` },
    { en: (n) => `${n} never left my side. Clear us both.`, ar: (n) => `${n} لم يفارقني لحظة. برّئنا كلينا.` },
  ],
  oneOf: [
    { en: (a, sc, b) => `It was ${a} or ${b} — one of them was in ${P(sc, 'en')}.`, ar: (a, sc, b) => `إمّا ${a} أو ${b} — أحدهما كان في ${P(sc, 'ar')}.` },
    { en: (a, sc, b) => `${Oc(sc, 'en')} went to ${a} or to ${b}. Nobody else.`, ar: (a, sc, b) => `${Oc(sc, 'ar')} ذهبت إلى ${a} أو إلى ${b}. لا أحد غيرهما.` },
    { en: (a, sc, b) => `Look at ${a} and ${b}. Your thief is one of those two.`, ar: (a, sc, b) => `انظر إلى ${a} و${b}. لصّك أحد هذين.` },
  ],
  sameAs: [
    { en: (n) => `${n} and I are both honest, or both lying. Take us together.`, ar: (n) => `أنا و${n} إمّا صادقان معاً أو كاذبان معاً. خذنا معاً.` },
    { en: (n) => `Whatever you decide about ${n}, decide the same about me.`, ar: (n) => `مهما قرّرت بشأن ${n}، فقرّر مثله بشأني.` },
    { en: (n) => `${n} and I tell the same story. We stand or fall as one.`, ar: (n) => `أنا و${n} نروي القصة ذاتها. ننجو أو نسقط معاً.` },
  ],
};

/** How the case opens: what went missing, from where, and who was there. */
export const OPENERS = [
  { en: (sc, n) => `${cap(sc.place.en)} is short one thing: ${sc.obj.en} is gone. ${n} were inside before the lights went out.`, ar: (sc, n) => `${sc.place.ar} ينقصه شيء: ${sc.obj.ar} اختفت. ${n} كانوا بالداخل قبل أن تنطفئ الأنوار.` },
  { en: (sc, n) => `Somebody took ${sc.obj.en} from ${sc.place.en} last night. ${n} had a key.`, ar: (sc, n) => `أحدهم أخذ ${sc.obj.ar} من ${sc.place.ar} ليلة أمس. ${n} كان لديهم مفتاح.` },
  { en: (sc, n) => `By morning ${sc.obj.en} had vanished from ${sc.place.en}. These ${n} say they know nothing.`, ar: (sc, n) => `مع الصباح اختفت ${sc.obj.ar} من ${sc.place.ar}. هؤلاء ${n} يقولون إنهم لا يعرفون شيئاً.` },
  { en: (sc, n) => `${cap(sc.obj.en)} was in ${sc.place.en} at dusk and gone by dark. Only ${n} were ever near it.`, ar: (sc, n) => `${sc.obj.ar} كانت في ${sc.place.ar} عند الغسق واختفت مع الظلام. ${n} فقط كانوا قريبين منها.` },
];

function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

/** The opening line of a case. `lang` is 'en' or 'ar'. */
export function sceneText(c, lang, countWord) {
  if (!c || !c.scene) return '';
  const o = OPENERS[(c.opener || 0) % OPENERS.length];
  const fn = lang === 'ar' ? o.ar : o.en;
  return fn(c.scene, countWord);
}

/**
 * Render one generated statement as a sentence.
 *
 * ⚠ `scene` and `lang` are OPTIONAL, and the flat phrasing is what runs without
 * them. That is not politeness: `validate:liars` renders both forms and asserts
 * they describe the same statement, and the flat table is still the fallback
 * for the kinds that have no scene-aware wording (the counting statements and
 * the trait claim, which are about the whole board or about a face and read
 * perfectly well without a place).
 */
export function sayText(s, t, nameOf, traitWord, scene, lang) {
  const S = t.say;
  if (scene && SAY_SCENE[s.kind] && lang) {
    const bank = SAY_SCENE[s.kind];
    const pick = bank[(s.v || 0) % bank.length];
    const fn = lang === 'ar' ? pick.ar : pick.en;
    const out = s.kind === 'oneOf'
      ? fn(nameOf(s.about), scene, nameOf(s.other))
      : fn(s.about ? nameOf(s.about) : '', scene);
    if (out) return out;
  }
  switch (s.kind) {
    case 'selfClear': return S.selfClear();
    case 'selfAccuse': return S.selfAccuse();
    case 'countLiars': return S.countLiars(s.k);
    case 'atLeastLiars': return S.atLeastLiars(s.k);
    case 'oneOf': return S.oneOf(nameOf(s.about), nameOf(s.other));
    case 'traitClaim': return S.traitClaim(traitWord(s.trait), s.polarity === 'not');
    default: return S[s.kind] ? S[s.kind](nameOf(s.about)) : '';
  }
}

/** Render the rule in play. */
export function ruleText(rule, t, people) {
  const R = t.rule;
  if (rule.kind === 'knaves' || rule.kind === 'invertedKnaves' || rule.kind === 'free') return R[rule.kind];
  return R[rule.kind] ? R[rule.kind](rule.k, people) : '';
}
