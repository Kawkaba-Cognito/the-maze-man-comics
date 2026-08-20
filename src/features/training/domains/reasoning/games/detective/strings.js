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
    streak: 'streak',
    notebookHint: 'Drag a suspect down into the cell to hold them. Tap to mark: cleared → held.',

    // ── the holding cell ──
    cellLabel: 'Holding cell',
    cellEmpty: 'Nobody in the cell',
    cellDragHere: 'Drag them in here',
    cellDrop: 'Release to hold',
    cellPick: 'Hold a suspect — tap to change who is in the cell',
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
    streak: 'متتالية',
    notebookHint: 'اسحب المشتبه إلى الزنزانة لتحجزه. والمسه لتعليمه: بريء ← موقوف.',

    // ── الزنزانة ──
    cellLabel: 'الزنزانة',
    cellEmpty: 'لا أحد في الزنزانة',
    cellDragHere: 'اسحبه إلى هنا',
    cellDrop: 'أفلته ليدخل',
    cellPick: 'احجز مشتبهاً — المس لتغيّر من في الزنزانة',
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

/** Render one generated statement as a sentence. */
export function sayText(s, t, nameOf, traitWord) {
  const S = t.say;
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
