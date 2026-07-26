/*
 * Tier 3 — seven beats, five actors, two interleaved threads.
 *
 * The hard part here is not length, it is INTERLEAVING: Mimi's thread (the
 * bell) and Ramy's thread (the search) alternate, so the player has to hold two
 * sequences at once and keep them apart. Beats 3 and 5 are near-twins on
 * purpose — same place, same two actors, different outcome — which is exactly
 * the discrimination episodic memory is supposed to do.
 */
export const THE_QUIET_BELL = {
  id: 'quiet-bell',
  tier: 3,
  title: { en: 'The Quiet Bell', ar: 'الجرس الصامت' },
  moral: {
    en: 'People do not always go missing. Sometimes they are exactly where they said they would be, and nobody listened.',
    ar: 'لا يضيع الناس دائمًا. أحيانًا يكونون تمامًا حيث قالوا إنهم سيكونون، ولم يُصغِ أحد.',
  },
  cast: ['mimi', 'ramy', 'lola', 'star', 'fadi'],
  beats: [
    {
      id: 'b1',
      sky: 'noon',
      label: { en: 'Mimi announces the bell is hers', ar: 'ميمي تعلن أن الجرس لها' },
      narr: {
        en: 'Mimi told everyone at breakfast that she would be ringing the noon bell that day, all week, and that she intended to be excellent at it.',
        ar: 'أخبرت ميمي الجميع على الفطور أنها ستقرع جرس الظهيرة ذلك اليوم، طوال الأسبوع، وأنها تنوي أن تكون بارعة في ذلك.',
      },
      actors: [
        { id: 'mimi', act: 'greet', x: 0 },
        { id: 'ramy', act: 'idle', x: -0.7 },
        { id: 'lola', act: 'idle', x: 0.7 },
      ],
      say: { who: 'mimi', t: { en: 'Noon. Every day. Me.', ar: 'الظهيرة. كل يوم. أنا.' } },
    },
    {
      id: 'b2',
      sky: 'noon',
      label: { en: 'Noon passes in silence', ar: 'الظهيرة تمرّ في صمت' },
      narr: {
        en: 'Noon came and the square stayed silent. Ramy looked up from his bench, waited a full minute more, and then went to find her.',
        ar: 'حلّت الظهيرة وبقيت الساحة صامتة. رفع رامي نظره عن مقعده، وانتظر دقيقة كاملة أخرى، ثم ذهب ليبحث عنها.',
      },
      actors: [{ id: 'ramy', act: 'search', x: -0.2 }],
    },
    {
      id: 'b3',
      sky: 'noon',
      label: { en: 'Star has not seen her — first ask', ar: 'ستار لم يرَها — السؤال الأول' },
      narr: {
        en: 'Ramy asked Star, who was sunning himself by the cistern. Star said he had not seen Mimi since breakfast and went straight back to sunning himself.',
        ar: 'سأل رامي ستار، الذي كان يتشمّس قرب الصهريج. قال ستار إنه لم يرَ ميمي منذ الفطور وعاد فورًا إلى التشمّس.',
      },
      actors: [
        { id: 'ramy', act: 'search', x: -0.5 },
        { id: 'star', act: 'idle', x: 0.5 },
      ],
    },
    {
      id: 'b4',
      sky: 'dusk',
      label: { en: 'Lola checks the wrong tower', ar: 'لولا تتفقّد البرج الخطأ' },
      narr: {
        en: 'Lola climbed the old south tower, the one nobody had used for years, and found nothing but pigeons. She came down with dust on both sleeves and no cat.',
        ar: 'تسلّقت لولا البرج الجنوبي القديم، الذي لم يستخدمه أحد منذ سنوات، ولم تجد سوى الحمام. نزلت والغبار على كلا كمّيها وبلا قطة.',
      },
      actors: [
        { id: 'lola', act: 'search', x: 0.2 },
        { id: 'ramy', act: 'wait', x: -0.7 },
      ],
    },
    {
      id: 'b5',
      sky: 'dusk',
      label: { en: 'Star remembers — second ask', ar: 'ستار يتذكّر — السؤال الثاني' },
      narr: {
        en: 'Ramy asked Star a second time, by the same cistern. This time Star sat up and remembered: Mimi had asked him, that very morning, which tower held the bell.',
        ar: 'سأل رامي ستار مرة ثانية، عند الصهريج نفسه. هذه المرة اعتدل ستار وتذكّر: كانت ميمي قد سألته، في ذلك الصباح بالذات، أيّ برج يحوي الجرس.',
      },
      actors: [
        { id: 'ramy', act: 'search', x: -0.5 },
        { id: 'star', act: 'agree', x: 0.5 },
      ],
      say: { who: 'star', t: { en: 'She asked me which tower. I said the north one.', ar: 'سألتني أيّ برج. قلت لها الشمالي.' } },
    },
    {
      id: 'b6',
      sky: 'night',
      label: { en: 'Fadi opens the north door', ar: 'فادي يفتح الباب الشمالي' },
      narr: {
        en: 'Fadi had the north tower key on his ring the whole time. The door had swung shut behind Mimi at five to twelve, and the old latch had dropped itself.',
        ar: 'كان مفتاح البرج الشمالي في حلقة مفاتيح فادي طوال الوقت. كان الباب قد انغلق خلف ميمي في الثانية عشرة إلا خمس دقائق، وسقط المزلاج القديم من تلقاء نفسه.',
      },
      actors: [
        { id: 'fadi', act: 'work', x: 0.3 },
        { id: 'ramy', act: 'wait', x: -0.5 },
        { id: 'lola', act: 'wait', x: -1 },
      ],
    },
    {
      id: 'b7',
      sky: 'night',
      label: { en: 'The bell rings twelve hours late', ar: 'الجرس يقرع متأخرًا اثنتي عشرة ساعة' },
      narr: {
        en: 'Mimi rang it anyway, at midnight, twelve hours late and entirely unbothered. The whole square came out to complain and stayed to listen.',
        ar: 'قرعته ميمي على أي حال، عند منتصف الليل، متأخرة اثنتي عشرة ساعة وغير مكترثة بتاتًا. خرجت الساحة كلها لتشتكي فبقيت لتُصغي.',
      },
      actors: [
        { id: 'mimi', act: 'cheer', x: 0 },
        { id: 'ramy', act: 'cheer', x: -0.8 },
        { id: 'lola', act: 'cheer', x: 0.8 },
        { id: 'star', act: 'wait', x: -1.2 },
        { id: 'fadi', act: 'agree', x: 1.2 },
      ],
    },
  ],
  probes: [
    {
      id: 'p1',
      kind: 'who',
      q: { en: 'Who did Ramy ask twice?', ar: 'مَن سأله رامي مرتين؟' },
      options: [
        { v: 'star', l: { en: 'Star', ar: 'ستار' } },
        { v: 'lola', l: { en: 'Lola', ar: 'لولا' } },
        { v: 'fadi', l: { en: 'Fadi', ar: 'فادي' } },
      ],
      answer: 'star',
    },
    {
      id: 'p2',
      kind: 'where',
      q: { en: 'Which tower did Lola search?', ar: 'أيّ برج فتّشته لولا؟' },
      options: [
        { v: 'south', l: { en: 'The old south tower', ar: 'البرج الجنوبي القديم' } },
        { v: 'north', l: { en: 'The north tower', ar: 'البرج الشمالي' } },
        { v: 'cistern', l: { en: 'The cistern house', ar: 'بيت الصهريج' } },
      ],
      answer: 'south',
    },
    {
      id: 'p3',
      kind: 'what',
      q: { en: 'Why could Mimi not get out?', ar: 'لماذا لم تستطع ميمي الخروج؟' },
      options: [
        { v: 'latch', l: { en: 'The old latch dropped itself', ar: 'سقط المزلاج القديم من تلقاء نفسه' } },
        { v: 'stairs', l: { en: 'The stairs had collapsed', ar: 'انهارت الدرجات' } },
        { v: 'rope', l: { en: 'The bell rope was tangled', ar: 'تشابك حبل الجرس' } },
      ],
      answer: 'latch',
    },
    {
      id: 'p4',
      kind: 'who',
      q: { en: 'Who had the north tower key?', ar: 'مع مَن كان مفتاح البرج الشمالي؟' },
      options: [
        { v: 'fadi', l: { en: 'Fadi', ar: 'فادي' } },
        { v: 'ramy', l: { en: 'Ramy', ar: 'رامي' } },
        { v: 'star', l: { en: 'Star', ar: 'ستار' } },
      ],
      answer: 'fadi',
    },
    {
      id: 'p5',
      kind: 'what',
      q: { en: 'When did Mimi finally ring the bell?', ar: 'متى قرعت ميمي الجرس أخيرًا؟' },
      options: [
        { v: 'midnight', l: { en: 'At midnight', ar: 'عند منتصف الليل' } },
        { v: 'dusk', l: { en: 'At dusk', ar: 'عند الغسق' } },
        { v: 'never', l: { en: 'She never did', ar: 'لم تفعل قط' } },
      ],
      answer: 'midnight',
    },
  ],
};
