/*
 * Detective Kawkab's coach script.
 *
 * ⚠ THE METHOD IS THE LESSON. This is a constraint-satisfaction puzzle wearing a
 * story: N suspects, one statement each, a rule about who lies. A player without
 * a method reads the statements, forms an impression, and picks the person who
 * "seems" guilty — which is not solving it, and which fails as soon as the cases
 * stop being small. Assume-and-check is teachable in one sentence and is the
 * entire difference between playing this and guessing at it.
 *
 * ⚠ AND THE TWO GESTURES MEAN DIFFERENT THINGS, WHICH HAS TO BE SAID. A tap is a
 * private note and changes no score; a DRAG into the cell is the answer. That
 * asymmetry is deliberate — a mark is a thought and costs a tap, an arrest is a
 * commitment and costs a deliberate gesture — but it is invisible until stated,
 * and the cell used to sit at the end of the tap cycle where it was triggered by
 * accident while taking notes.
 *
 * ⚠ THE DRAG IS SYMMETRICAL. Reported immediately after the first build: "when i
 * dragged in i should be able to drag out also." Say so, because a door that
 * only opens one way is the first thing a player finds.
 *
 * ── 2026-09-03: four steps became eight, on the spine in COACH-PLAN.md ──
 * The old step 2 carried the entire assume-and-check method in one paragraph and
 * the old step 4 carried the drag, the reverse drag AND the warning about the
 * question all at once.
 *
 * ⚠ NO AWAIT STEP: no `satisfiedFor` predicate on this game.
 *
 * ── 2026-09-05: the scene ──
 * Every case now opens by naming what went missing and where. The lesson has to
 * introduce it, and — more importantly — has to say what it is NOT. The scene
 * is colour: it makes the case readable and gives the player somewhere to put
 * each fact, but no part of the answer is hidden in it. A player hunting the
 * observatory for a clue is being misled by their own diligence, which is a
 * worse failure than being confused. Id bumped to `@coach3` so everyone who has
 * already played is owed the new lesson.
 */
export const DETECTIVE_COACH = {
  id: 'detective@coach3',
  steps: [
    {
      point: '[data-coach="scene"]',
      awaitTap: false,
      en: "I'm Dr Kawkab. Every case opens with what went missing and where — read it, because it tells you who was there. But the answer is never hidden in the scene itself. It is in what they say.",
      ar: 'أنا د. كوكب. وكل قضية تبدأ بما ضاع وأين — فاقرأه، إذ يخبرك من كان هناك. لكنّ الجواب لا يكمن في المشهد نفسه أبداً، بل فيما يقولونه.',
    },
    {
      point: '[data-coach="rule"]',
      awaitTap: false,
      en: 'Then read this, every time. The rule is the one thing here that is certainly TRUE — the suspects are under no such obligation.',
      ar: 'ثم اقرأ هذا في كل مرّة. فالقاعدة هي الشيء الوحيد هنا المؤكَّد صدقه — أمّا المشتبهون فلا يلزمهم ذلك.',
    },
    {
      point: '[data-coach="says"]',
      awaitTap: false,
      en: 'Each of them says exactly one thing. Some of those statements are lies, and the rule is what tells you how many.',
      ar: 'ويقول كلٌّ منهم شيئاً واحداً لا غير. وبعض تلك الإفادات كذب، والقاعدة هي التي تخبرك كم منها.',
    },
    /*
     * ⚠ THE ONE THAT MATTERS. A method, stated as steps the player can actually
     * carry out, not as a description of what solving looks like.
     */
    {
      point: '[data-coach="says"]',
      awaitTap: false,
      en: 'Here is the method. Take one suspect and ASSUME they did it. Then read every statement as true or false under that assumption.',
      ar: 'وإليك الطريقة. خذ مشتبهاً واحداً وافترض أنه الفاعل. ثم اقرأ كل إفادة صادقةً أو كاذبةً على ذلك الافتراض.',
    },
    {
      point: '[data-coach="says"]',
      awaitTap: false,
      en: 'If that forces a contradiction with the rule — too many liars, or too few — then they did not do it. Cross them off and try the next. The answer is the assumption left standing.',
      ar: 'فإن أفضى ذلك إلى تناقضٍ مع القاعدة — كاذبون أكثر من اللازم أو أقلّ — فليس هو الفاعل. فاشطبه وجرّب الذي يليه. والجواب هو الافتراض الذي يصمد.',
    },
    {
      point: '[data-coach="lineup"]',
      awaitTap: false,
      en: 'Tap a card to mark it — cleared, or suspected. That is only your notebook; it changes no score and I never look at it.',
      ar: 'المس البطاقة لتضع عليها علامة — بريء أو مشتبه. وهذا دفترك وحدك؛ لا يغيّر نتيجةً ولا أنظر إليه.',
    },
    {
      point: '[data-coach="lineup"]',
      awaitTap: false,
      en: 'It is there so you can park a conclusion instead of carrying it in your head — which is what makes the fourth and fifth suspect possible at all.',
      ar: 'وُجد لتضع فيه استنتاجاً بدل أن تحمله في رأسك — وهو ما يجعل المشتبه الرابع والخامس ممكنَين أصلاً.',
    },
    {
      point: '[data-coach="lineup"]',
      awaitTap: false,
      en: 'And when you are sure, DRAG them into the cell. That is your answer, not a note — which is why it costs a bigger gesture than a tap. Drag them straight back out if you change your mind.',
      ar: 'وإذا تيقّنت، فاسحبه إلى الزنزانة. فذاك جوابك لا ملاحظتك — ولهذا كلّفك حركةً أكبر من اللمس. واسحبه خارجاً على الفور إن غيّرت رأيك.',
    },
    {
      point: '[data-coach="rule"]',
      awaitTap: false,
      en: 'One last warning, and it is the commonest way to lose a case you had solved: read the question each time. It is not always "who did it" — sometimes I ask who is lying, or how many are, or whether there is enough to convict at all. Your turn.',
      ar: 'وتحذيرٌ أخير، وهو أكثر ما يُضيّع قضيّةً قد حللتها: اقرأ السؤال في كل مرّة. فليس دائماً «من الفاعل» — بل أسأل أحياناً من الكاذب، أو كم عددهم، أو هل في الأمر ما يكفي للإدانة أصلاً. دورك.',
    },
  ],
};

export default DETECTIVE_COACH;
